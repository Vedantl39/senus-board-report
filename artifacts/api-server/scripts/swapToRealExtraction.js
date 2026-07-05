/**
 * The ONE clean swap: wipes the manually-seeded live `disclosures`/
 * `source_documents` tables and replaces them with the validated real
 * extraction output currently sitting in `*_staging` (produced by
 * runRealExtraction.js, checked by compareExtractionToGolden.js).
 *
 * This is intentionally a single all-or-nothing transaction — never a
 * partial/gradual replace. If anything fails, the whole thing rolls back
 * and the previously-seeded data is left untouched.
 *
 * Usage: node scripts/swapToRealExtraction.js
 */

const { pool } = require("../src/lib/db");

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: stagingDocs } = await client.query(
      "SELECT id, filename, doc_type, period_covered, audited FROM source_documents_staging",
    );
    if (stagingDocs.length === 0) {
      throw new Error("No staging source documents found — run runRealExtraction.js first.");
    }

    console.log(`Wiping live disclosures/source_documents (${stagingDocs.length} staged source docs to migrate)...`);
    await client.query("DELETE FROM disclosures");
    await client.query("DELETE FROM source_documents");

    const idMap = new Map();
    for (const doc of stagingDocs) {
      const { rows } = await client.query(
        `INSERT INTO source_documents (filename, doc_type, period_covered, audited)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [doc.filename, doc.doc_type, doc.period_covered, doc.audited],
      );
      idMap.set(doc.id, rows[0].id);
    }

    const { rows: stagingDisclosures } = await client.query(
      `SELECT source_document_id, record_type, category, period_label, consolidation_basis,
              product_line, materiality_rank, status, payload
       FROM disclosures_staging`,
    );

    for (const row of stagingDisclosures) {
      const liveSourceDocId = row.source_document_id ? idMap.get(row.source_document_id) : null;
      await client.query(
        `INSERT INTO disclosures
          (source_document_id, record_type, category, period_label, consolidation_basis,
           product_line, materiality_rank, status, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          liveSourceDocId,
          row.record_type,
          row.category,
          row.period_label,
          row.consolidation_basis,
          row.product_line,
          row.materiality_rank,
          row.status,
          row.payload,
        ],
      );
    }

    const { rows: counts } = await client.query(
      "SELECT record_type, count(*) FROM disclosures GROUP BY record_type ORDER BY record_type",
    );

    await client.query("COMMIT");

    console.log("\nSwap complete. Live disclosures now contains:");
    for (const c of counts) console.log(`  ${c.record_type}: ${c.count}`);
    console.log(`\nSource documents: ${stagingDocs.length}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Swap failed, rolled back — live data unchanged:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
