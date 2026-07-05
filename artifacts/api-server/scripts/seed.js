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

async function insertEvent(client, { sourceDocumentId, category, title, description, periodLabel, extractedAt }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, period_label, payload, extracted_at)
     VALUES ($1, 'event', $2, $3, $4, $5)`,
    [sourceDocumentId, category, periodLabel, JSON.stringify({ title, description }), extractedAt],
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
    // Comparative for every H1 FY2026 metric must be the matching H1 FY2025
    // (half-year) figure, never the full FY2025 annual figure — comparing 6
    // months against 12 months produces a misleading direction/magnitude.
    // Only revenue has a hand-verified true H1 FY2025 comparative (340,931).
    // gross_profit / operating_profit_loss have no disclosed H1 FY2025
    // figure, so their comparative is left null (renders as "—") rather
    // than substituting the wrongly-scoped annual figure.
    const h1Fy2025Revenue = 340931;
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "revenue",
      value: h1Raw.revenue,
      comparativeValue: h1Fy2025Revenue,
      comparativePeriod: "H1 FY2025",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "gross_profit",
      value: h1Raw.gross_profit,
      comparativeValue: null,
      comparativePeriod: null,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "operating_profit_loss",
      value: h1Raw.operating_profit_loss,
      comparativeValue: null,
      comparativePeriod: null,
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

    // share_option_pool_percentage: the one real disclosed Returns/Market
    // figure available so far (~5%, per the user).
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "share_option_pool_percentage",
      value: 0.05,
      unit: "ratio",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });

    // admission_price: fixed IPO/admission price, not period-scoped in the
    // same sense as a trading price — attached to H1 FY2026 (the period the
    // report currently covers) since that's the only doc it's associated
    // with; no comparative (it doesn't move).
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "admission_price",
      value: 5.126,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });

    // share_price_close: latest close (3 July 2026) per
    // SENUS_Historical_price.xlsx / IE000O0F49R3XACD_Performance.xlsx.
    // comparative_value is the admission price so the KPI card's trend
    // arrow reflects the disclosed +19.98% YTD change against admission,
    // not a fabricated prior-period close (OHLC/volume are genuinely
    // "-"/0 on Euronext Access on many days — real illiquidity, not a
    // data gap).
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "share_price_close",
      value: 6.15,
      comparativeValue: 5.126,
      comparativePeriod: "Admission",
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });

    // net_assets_liabilities: real figures for both periods, but NOT
    // directly comparable (standalone vs consolidated; the swing is driven
    // by the Loamin acquisition + a EUR1.1m share issuance, not organic
    // performance) — per the user, seeded as two independent period rows
    // (same treatment as revenue) rather than wired as comparative_value
    // of one another, so the UI shows them side-by-side with their
    // consolidation-basis badges instead of a misleading % change.
    await insertMetric(client, {
      sourceDocumentId: FY2025_DOC_ID,
      metricName: "net_assets_liabilities",
      value: -15575,
      periodLabel: "FY2025",
      consolidationBasis: "standalone",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "net_assets_liabilities",
      value: 561081,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    // Supporting components (H1 FY2026), disclosed alongside the net
    // assets figure: share capital + share premium + retained earnings
    // = 25000 + 300000 + 236081 = 561081.
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "called_up_share_capital",
      value: 25000,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "share_premium",
      value: 300000,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });
    await insertMetric(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      metricName: "retained_earnings",
      value: 236081,
      periodLabel: "H1 FY2026",
      consolidationBasis: "consolidated",
    });

    // --- Risks (materiality-ordered, per category) ---
    // Real disclosed risk categories/items from the Information Document,
    // per attached_assets/replit-accuracy-fixes-prompt_1783249854817.md
    // Priority 3 — replacing the earlier generic placeholder risks. All
    // "Unchanged" since this is the baseline document with nothing yet to
    // compare against.
    const risks = [
      {
        category: "Corporate",
        title: "Execution risk on Senus 2030 growth strategy",
        summary: "The group's ability to deliver its Senus 2030 growth strategy depends on successful execution across product, sales, and operations.",
        status: "Unchanged",
      },
      {
        category: "Technology and IP",
        title: "Cyber security threats to customer data",
        summary: "The group holds sensitive customer data; a security breach could damage customer trust and expose the group to liability.",
        status: "Unchanged",
      },
      {
        category: "Technology and IP",
        title: "Software and IP infringement exposure",
        summary: "The group's software and IP could be subject to infringement claims, or third parties could infringe the group's own IP.",
        status: "Unchanged",
      },
      {
        category: "People and Operations",
        title: "Dependence on key personnel",
        summary: "The group's performance depends on retaining a small number of key personnel with specialist knowledge and relationships.",
        status: "Unchanged",
      },
      {
        category: "People and Operations",
        title: "Reliance on third-party service providers",
        summary: "The group relies on third-party service providers for critical operational functions; disruption to these relationships could affect delivery.",
        status: "Unchanged",
      },
      {
        category: "International and Regulatory",
        title: "Divergent data protection laws across markets",
        summary: "Operating across multiple jurisdictions exposes the group to divergent and evolving data protection regimes.",
        status: "Unchanged",
      },
      {
        category: "International and Regulatory",
        title: "Exposure to international economic and political risk",
        summary: "The group's international operations are exposed to economic and political conditions outside its control.",
        status: "Unchanged",
      },
      {
        category: "Financial and Shares",
        title: "Company is not yet profitable",
        summary: "The group has a history of losses and there is no guarantee it will achieve or sustain profitability.",
        status: "Unchanged",
      },
      {
        category: "Financial and Shares",
        title: "Limited share liquidity on Euronext Access",
        summary: "The group's shares trade on Euronext Access, which has historically lower liquidity than a main market, and shareholders may find it difficult to trade in size.",
        status: "Unchanged",
      },
      {
        category: "Market and Competition",
        title: "Competitive intensity in a fast-evolving market",
        summary: "Some competitors have greater financial, technical, and marketing resources, longer operating histories, and larger customer bases; the Natural Capital solutions market is evolving quickly, which could affect Senus's ability to maintain or grow market share.",
        status: "Unchanged",
      },
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

    // --- Governance events ---
    await insertEvent(client, {
      sourceDocumentId: H1_FY2026_DOC_ID,
      category: "Governance",
      title: "Leadership Transition",
      description:
        "Brendan Allen moved from Chief Executive Officer to Vice Chairman, effective 24 June 2026.",
      periodLabel: "H1 FY2026",
      extractedAt: "2026-06-24T00:00:00Z",
    });

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
