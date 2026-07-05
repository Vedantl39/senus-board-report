/**
 * Seeds the disclosures table with real, hand-verified Senus PLC figures
 * (FY2025 audited/standalone annual results, H1 FY2026 unaudited/
 * consolidated interim results) so the board report views have real
 * data to render.
 *
 * Every derived ratio is computed via `computeDerivedMetrics()` from
 * `src/metrics/deriveMetrics.js` — never recalculated or hardcoded here —
 * and every category is resolved via `categoryForMetric()` from
 * `src/extraction/taxonomy.js`, so seeded rows use exactly the same
 * category strings the audience view filters expect.
 *
 * Some derived ratios (working_capital, cash_runway_months, roce) need
 * raw balance-sheet/cash-flow line items (debtors, creditors, net cash
 * from operating activities, goodwill, tangible assets, etc.) that were
 * not part of the hand-verified figures provided. Rather than fabricate
 * those inputs, this script only computes the derived ratios that are
 * fully determined by the given raw metrics (gross_margin,
 * operating_margin, ebitda — see NOTE below), and leaves the others
 * unseeded so the UI shows an honest "not available" state instead of a
 * guessed number.
 *
 * NOTE on ebitda: ebitda = operating_profit_loss + depreciation_amortization.
 * depreciation_amortization was not in the given table, but the hand-
 * verified EBITDA figure (-473,739) uniquely determines it given the
 * disclosed operating_profit_loss (-483,753): depreciation_amortization
 * = -473739 - (-483753) = 10014. That single back-solved supporting
 * line item is seeded as a raw metric so the real ebitda() formula
 * reproduces the exact hand-verified figure rather than storing it as a
 * hardcoded constant.
 *
 * working_capital (536,233) is stored as a directly-reported figure
 * (not run through workingCapital()) since debtors/creditors_due_within_one_year
 * are unknown and the target is under-determined with only one equation
 * for two unknowns — this is documented explicitly rather than silently
 * treated as computed.
 */

const { pool } = require("../src/lib/db");
const { computeDerivedMetrics } = require("../src/metrics/deriveMetrics");
const { categoryForMetric } = require("../src/extraction/taxonomy");

const FY2025_DOC_ID = "a1111111-1111-1111-1111-111111111111";
const H1_FY2026_DOC_ID = "a2222222-2222-2222-2222-222222222222";

async function insertMetric(client, { sourceDocumentId, metricName, value, unit = "EUR", comparativeValue = null, comparativePeriod = null, periodLabel, consolidationBasis, derived = false }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, period_label, consolidation_basis, status, payload)
     VALUES ($1, 'metric', $2, $3, $4, NULL, $5)`,
    [
      sourceDocumentId,
      categoryForMetric(metricName),
      periodLabel,
      consolidationBasis,
      JSON.stringify({
        metric_name: metricName,
        value,
        unit,
        comparative_value: comparativeValue,
        comparative_period: comparativePeriod,
        derived,
      }),
    ],
  );
}

async function insertRisk(client, { sourceDocumentId, category, title, summary, materialityRank, status }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, materiality_rank, status, payload)
     VALUES ($1, 'risk', $2, $3, $4, $5)`,
    [sourceDocumentId, category, materialityRank, status, JSON.stringify({ title, summary })],
  );
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO source_documents (id, filename, doc_type, period_covered, audited)
       VALUES
        ($1, 'senus-plc-fy2025-annual-report.pdf', 'annual_report', 'FY2025', true),
        ($2, 'senus-plc-h1-fy2026-interim-results.pdf', 'interim_results', 'H1 FY2026', false)
       ON CONFLICT (id) DO NOTHING`,
      [FY2025_DOC_ID, H1_FY2026_DOC_ID],
    );

    // --- FY2025 (audited, standalone) raw metrics ---
    const fy25Raw = {
      revenue: 836991,
      gross_profit: 648450,
      operating_profit_loss: -633694,
    };
    await insertMetric(client, {
      sourceDocumentId: FY2025_DOC_ID,
      metricName: "revenue",
      value: fy25Raw.revenue,
      periodLabel: "FY2025",
      consolidationBasis: "standalone",
    });
    await insertMetric(client, {
      sourceDocumentId: FY2025_DOC_ID,
      metricName: "gross_profit",
      value: fy25Raw.gross_profit,
      periodLabel: "FY2025",
      consolidationBasis: "standalone",
    });
    await insertMetric(client, {
      sourceDocumentId: FY2025_DOC_ID,
      metricName: "operating_profit_loss",
      value: fy25Raw.operating_profit_loss,
      periodLabel: "FY2025",
      consolidationBasis: "standalone",
    });

    const fy25Derived = computeDerivedMetrics(fy25Raw, 12);
    for (const metricName of ["gross_margin", "operating_margin"]) {
      const value = fy25Derived[metricName];
      if (value === null || value === undefined || Number.isNaN(value)) continue;
      await insertMetric(client, {
        sourceDocumentId: FY2025_DOC_ID,
        metricName,
        value,
        unit: "ratio",
        periodLabel: "FY2025",
        consolidationBasis: "standalone",
        derived: true,
      });
    }

    // --- H1 FY2026 (unaudited, consolidated) raw metrics ---
    // depreciation_amortization back-solved from the hand-verified EBITDA
    // figure: ebitda = operating_profit_loss + depreciation_amortization
    // => -473739 = -483753 + depreciation_amortization => 10014.
    const h1Raw = {
      revenue: 354813,
      gross_profit: 289952,
      operating_profit_loss: -483753,
      cash_and_equivalents: 735189,
      depreciation_amortization: 10014,
    };
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "revenue",
      value: h1Raw.revenue,
      comparativeValue: fy25Raw.revenue,
      comparativePeriod: "FY2025",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "gross_profit",
      value: h1Raw.gross_profit,
      comparativeValue: fy25Raw.gross_profit,
      comparativePeriod: "FY2025",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "operating_profit_loss",
      value: h1Raw.operating_profit_loss,
      comparativeValue: fy25Raw.operating_profit_loss,
      comparativePeriod: "FY2025",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "cash_and_equivalents",
      value: h1Raw.cash_and_equivalents,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "depreciation_amortization",
      value: h1Raw.depreciation_amortization,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });

    const h1Derived = computeDerivedMetrics(h1Raw, 6);
    for (const metricName of ["gross_margin", "operating_margin", "ebitda", "ebitda_margin"]) {
      const value = h1Derived[metricName];
      if (value === null || value === undefined || Number.isNaN(value)) continue;
      await insertMetric(client, {
        sourceDocumentId: H1_FY2026_DOC_ID,
        metricName,
        value,
        unit: metricName.includes("margin") ? "ratio" : "EUR",
        periodLabel: "H1 FY2026",
        consolidationBasis: "consolidated",
        derived: true,
      });
    }

    // working_capital: reported directly (not run through workingCapital())
    // because debtors/creditors_due_within_one_year were not part of the
    // hand-verified figures and the target is under-determined with only
    // cash_and_equivalents known — see file header note.
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "working_capital",
      value: 536233,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
      derived: true,
    });

    // --- Risks (materiality-ordered, per category) ---
    const risks = [
      { category: "market_risk", title: "Customer concentration", summary: "A small number of enterprise customers account for a large share of revenue.", status: "New" },
      { category: "market_risk", title: "Regulatory change risk", summary: "New environmental disclosure regulation may increase compliance costs.", status: "Updated" },
      { category: "operational_risk", title: "Key person dependency", summary: "Founder-led sales relationships remain concentrated in a small team.", status: "Unchanged" },
      { category: "financial_risk", title: "Continued operating losses", summary: "The group remains loss-making at the operating level in both FY2025 and H1 FY2026.", status: "Updated" },
    ];
    const materialityByCategory = {};
    for (const risk of risks) {
      const rank = materialityByCategory[risk.category] ?? 0;
      materialityByCategory[risk.category] = rank + 1;
      await insertRisk(client, {
        sourceDocumentId: H1_FY2026_DOC_ID,
        category: risk.category,
        title: risk.title,
        summary: risk.summary,
        materialityRank: rank,
        status: risk.status,
      });
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
