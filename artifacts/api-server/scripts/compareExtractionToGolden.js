/**
 * Compares real Claude-extracted figures (in *_staging tables, produced by
 * scripts/runRealExtraction.js) against the hand-verified "golden" figures
 * currently seeded into the live `disclosures` table by scripts/seed.js.
 *
 * This is a validation report only — it never writes to any table.
 * Run: node scripts/compareExtractionToGolden.js
 */

const { pool } = require("../src/lib/db");

// Golden figures, copied by hand from scripts/seed.js (not queried live,
// so this script is a genuine independent check rather than comparing the
// seed script against itself).
const GOLDEN = {
  "FY2025|revenue": 836991,
  "FY2025|gross_profit": 648450,
  "FY2025|operating_profit_loss": -633694,
  "FY2025|gross_margin": 648450 / 836991,
  "FY2025|operating_margin": -633694 / 836991,
  "FY2025|net_assets_liabilities": -15575,
  "H1 FY2026|revenue": 354813,
  "H1 FY2026|gross_profit": 289952,
  "H1 FY2026|operating_profit_loss": -483753,
  "H1 FY2026|cash_and_equivalents": 735189,
  "H1 FY2026|depreciation_amortization": 10014,
  "H1 FY2026|gross_margin": 289952 / 354813,
  "H1 FY2026|operating_margin": -483753 / 354813,
  "H1 FY2026|ebitda": -473739,
  "H1 FY2026|ebitda_margin": -473739 / 354813,
  "H1 FY2026|working_capital": 536233,
  "H1 FY2026|net_assets_liabilities": 561081,
  "H1 FY2026|called_up_share_capital": 25000,
  "H1 FY2026|share_premium": 300000,
  "H1 FY2026|retained_earnings": 236081,
  "H1 FY2026|admission_price": 5.126,
  "H1 FY2026|share_option_pool_percentage": 0.05,
};

function approxEqual(a, b, tolerance = 1e-6) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));
}

async function main() {
  const { rows } = await pool.query(`
    SELECT sd.filename, d.period_label, d.consolidation_basis, d.payload
    FROM disclosures_staging d
    JOIN source_documents_staging sd ON sd.id = d.source_document_id
    WHERE d.record_type = 'metric'
  `);

  const extracted = new Map();
  for (const row of rows) {
    const key = `${row.period_label}|${row.payload.metric_name}`;
    extracted.set(key, { value: row.payload.value, consolidationBasis: row.consolidation_basis, filename: row.filename });
  }

  console.log("=".repeat(100));
  console.log("EXTRACTED vs GOLDEN comparison (real Claude extraction vs hand-verified seed.js figures)");
  console.log("=".repeat(100));

  let matchCount = 0;
  let mismatchCount = 0;
  let missingCount = 0;
  const mismatches = [];
  const missing = [];

  for (const [key, goldenValue] of Object.entries(GOLDEN)) {
    const found = extracted.get(key);
    if (!found) {
      missingCount += 1;
      missing.push(key);
      console.log(`MISSING   | ${key.padEnd(45)} | golden=${goldenValue}`);
      continue;
    }
    const match = approxEqual(found.value, goldenValue, 1e-4);
    if (match) {
      matchCount += 1;
      console.log(`MATCH     | ${key.padEnd(45)} | ${found.value}`);
    } else {
      mismatchCount += 1;
      mismatches.push({ key, extracted: found.value, golden: goldenValue });
      console.log(`MISMATCH  | ${key.padEnd(45)} | extracted=${found.value} golden=${goldenValue}`);
    }
  }

  console.log("=".repeat(100));
  console.log(`Totals: ${matchCount} match, ${mismatchCount} mismatch, ${missingCount} missing (of ${Object.keys(GOLDEN).length} golden figures checked)`);

  // Consolidation-basis metadata check (separate from value accuracy).
  const fy25Sample = [...extracted.entries()].find(([k]) => k.startsWith("FY2025|revenue"));
  if (fy25Sample) {
    console.log("\nMetadata check:");
    console.log(`  FY2025 consolidation_basis extracted = "${fy25Sample[1].consolidationBasis}" vs seed.js label = "standalone"`);
    console.log(`  (The source document's Section 3 explicitly labels these as "Annual Report and Consolidated Financial Statements" —`);
    console.log(`   the real document disagrees with the seed.js "standalone" label, independent of any extraction error.)`);
  }

  if (mismatches.length > 0) {
    console.log("\nMismatch details:");
    for (const m of mismatches) console.log(`  - ${m.key}: extracted=${m.extracted}, golden=${m.golden}`);
  }
  if (missing.length > 0) {
    console.log("\nMissing details (golden figure not found in extraction output at all):");
    for (const m of missing) console.log(`  - ${m}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
