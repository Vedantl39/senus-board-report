/**
 * Runs the REAL extraction pipeline (real Claude API calls, via
 * src/extraction/*) against the REAL Senus PLC source documents the user
 * uploaded, and persists the output into the *_staging tables — never into
 * the live `disclosures`/`source_documents` tables the dashboard reads
 * from. This is the validation step requested in
 * attached_assets/replit-extraction-audit-prompt_1783253634341.md: prove
 * extraction works against real documents before ever touching live data.
 *
 * Usage: node scripts/runRealExtraction.js
 *
 * Text is pulled from the PDFs via the `pdftotext` CLI (Poppler) since none
 * of the usable source PDFs are scanned images — they have real embedded
 * text layers. Two of the uploaded PDFs (the Senus Limited balance sheet as
 * at 8 Dec 2025, and the ADF Farm Solutions statutory accounts) ARE
 * scanner-produced image PDFs with no text layer and are skipped — logged
 * explicitly below, not silently ignored.
 */

const path = require("path");
const { execFileSync } = require("child_process");
const { pool } = require("../src/lib/db");
const { extractMetrics } = require("../src/extraction/extractMetrics");
const { extractRisks } = require("../src/extraction/extractRisks");
const { extractEvents } = require("../src/extraction/extractEvents");
const { computeDerivedMetrics } = require("../src/metrics/deriveMetrics");
const { categoryForMetric } = require("../src/extraction/taxonomy");
const { inferPeriodMonths } = require("../src/extraction/periodMonths");

const ASSETS_DIR = path.join(__dirname, "../../../attached_assets");

function pdfText(filename) {
  const fullPath = path.join(ASSETS_DIR, filename);
  return execFileSync("pdftotext", [fullPath, "-"], {
    maxBuffer: 1024 * 1024 * 50,
  }).toString("utf8");
}

const DOCUMENTS = [
  {
    // FY2025 is consolidated (Senus PLC + its UK subsidiary, incorporated
    // 2023) but predates the Loamin acquisition (Nov 2025) — a binary
    // "standalone" label would be wrong (it was never standalone) and a
    // plain "consolidated" label would be incomplete (doesn't say what's
    // included), so the scope is spelled out explicitly. See replit.md.
    filename: "Senus_PLC_Information_Document_December_2025_1783253990763.pdf",
    docType: "information_document",
    periodLabel: "FY2025",
    consolidationBasis: "Consolidated (excl. Loamin)",
    audited: true,
    hasRiskSection: true,
    isPressRelease: false,
  },
  {
    // H1 FY2026 is consolidated including Loamin, acquired November 2025.
    filename: "Senus_HalfYearResultsDec2025_PR_V19032026_FINAL_clean_(2)_1783253990759.pdf",
    docType: "interim_results",
    periodLabel: "H1 FY2026",
    consolidationBasis: "Consolidated (incl. Loamin, acquired Nov 2025)",
    audited: false,
    hasRiskSection: false,
    isPressRelease: true,
  },
  {
    filename: "Senus_PLC_Direct_Listing_Launch_Press_Release_1783253990763.pdf",
    docType: "press_release",
    periodLabel: null,
    consolidationBasis: null,
    audited: null,
    hasRiskSection: false,
    isPressRelease: true,
  },
  {
    filename: "Senus_PR_LeadershipTransition_V24062026_1783253990764.pdf",
    docType: "press_release",
    periodLabel: null,
    consolidationBasis: null,
    audited: null,
    hasRiskSection: false,
    isPressRelease: true,
  },
];

const SKIPPED_SCANNED_PDFS = [
  "Senus_Limited_Company_Balance_Sheet_(as_at_8_December_2025)_1783253990759.pdf",
  "ADF_Farm_Solutions_Consolidated_Financial_Statements_(30_June__1783253990762.pdf",
  "Senus_PLC_Memo_and_Arts_1783253990762.pdf",
];

async function insertSourceDocumentStaging(client, doc) {
  const { rows } = await client.query(
    `INSERT INTO source_documents_staging (filename, doc_type, period_covered, audited)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [doc.filename, doc.docType, doc.periodLabel, doc.audited],
  );
  return rows[0].id;
}

async function insertMetricStaging(client, { sourceDocumentId, metadata, metricName, value, unit, comparativeValue, comparativePeriod, derived }) {
  await client.query(
    `INSERT INTO disclosures_staging
      (source_document_id, record_type, category, period_label, consolidation_basis, status, payload)
     VALUES ($1, 'metric', $2, $3, $4, NULL, $5)`,
    [
      sourceDocumentId,
      categoryForMetric(metricName),
      metadata.periodLabel ?? null,
      metadata.consolidationBasis ?? null,
      JSON.stringify({
        metric_name: metricName,
        value,
        unit: unit ?? "EUR",
        comparative_value: comparativeValue ?? null,
        comparative_period: comparativePeriod ?? null,
        derived: Boolean(derived),
      }),
    ],
  );
}

async function insertRiskStaging(client, { sourceDocumentId, risk, materialityRank, status }) {
  await client.query(
    `INSERT INTO disclosures_staging
      (source_document_id, record_type, category, materiality_rank, status, payload)
     VALUES ($1, 'risk', $2, $3, $4, $5)`,
    [sourceDocumentId, risk.category, materialityRank, status, JSON.stringify({ title: risk.title, summary: risk.summary })],
  );
}

async function insertEventStaging(client, { sourceDocumentId, event, periodLabel }) {
  await client.query(
    `INSERT INTO disclosures_staging
      (source_document_id, record_type, category, period_label, payload)
     VALUES ($1, 'event', 'event', $2, $3)`,
    [sourceDocumentId, periodLabel ?? null, JSON.stringify({ title: event.title, description: event.description })],
  );
}

async function processDocument(client, doc) {
  console.log(`\n--- Extracting: ${doc.filename} ---`);
  const text = pdfText(doc.filename);
  console.log(`  Text length: ${text.length} chars`);

  const sourceDocumentId = await insertSourceDocumentStaging(client, doc);

  const metrics = await extractMetrics(text);
  console.log(`  Metrics extracted: ${metrics.length}`);
  for (const m of metrics) {
    await insertMetricStaging(client, {
      sourceDocumentId,
      metadata: doc,
      metricName: m.metric_name,
      value: m.value,
      unit: m.unit,
      comparativeValue: m.comparative_value,
      comparativePeriod: m.comparative_period,
      derived: false,
    });
  }

  if (metrics.length > 0) {
    const rawMetrics = {};
    for (const m of metrics) rawMetrics[m.metric_name] = m.value;
    const periodMonths = inferPeriodMonths(doc.periodLabel);
    const derived = computeDerivedMetrics(rawMetrics, periodMonths);
    for (const [metricName, value] of Object.entries(derived)) {
      if (value === null || value === undefined || Number.isNaN(value)) continue;
      await insertMetricStaging(client, {
        sourceDocumentId,
        metadata: doc,
        metricName,
        value,
        derived: true,
      });
    }
  }

  if (doc.hasRiskSection) {
    const risks = await extractRisks(text);
    console.log(`  Risks extracted: ${risks.length}`);
    for (let i = 0; i < risks.length; i += 1) {
      await insertRiskStaging(client, { sourceDocumentId, risk: risks[i], materialityRank: i, status: "New" });
    }
  }

  if (doc.isPressRelease) {
    const events = await extractEvents(text);
    console.log(`  Events extracted: ${events.length}`);
    for (const event of events) {
      await insertEventStaging(client, { sourceDocumentId, event, periodLabel: doc.periodLabel });
    }
  }

  return { sourceDocumentId, metricsCount: metrics.length };
}

async function main() {
  // Usage: node runRealExtraction.js [--reset] [docIndex]
  // --reset truncates staging tables first (only pass on the very first
  // call of a fresh run). docIndex (0-based) processes just that one
  // document — real Claude calls against large documents are slow enough
  // that processing all 4 documents in one process run exceeds typical
  // shell/tool timeouts, so this script is designed to be invoked once per
  // document across several separate calls.
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const indexArg = args.find((a) => /^\d+$/.test(a));

  if (reset) {
    console.log("Resetting staging tables...");
    await pool.query("TRUNCATE disclosures_staging, source_documents_staging RESTART IDENTITY CASCADE");
  }

  console.log("Skipping scanned (image-only, no text layer) PDFs:");
  for (const f of SKIPPED_SCANNED_PDFS) console.log(`  - ${f}`);

  const docsToRun = indexArg !== undefined ? [DOCUMENTS[Number(indexArg)]] : DOCUMENTS;

  const client = await pool.connect();
  try {
    for (const doc of docsToRun) {
      await processDocument(client, doc);
    }
    console.log("\nBatch complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Extraction run failed:", err);
  process.exit(1);
});
