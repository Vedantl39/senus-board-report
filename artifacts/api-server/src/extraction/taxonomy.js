/**
 * Raw metric taxonomy — Senus PLC Board Report.
 *
 * These are the ONLY metric_name values the extraction pipeline may
 * recognize from a source document. Anything Claude returns outside this
 * set is rejected (not stored), per the user's spec — never fabricate
 * or store unrecognized metrics. Derived metrics (gross_margin, ebitda,
 * etc.) are computed in code by deriveMetrics.js and must never be
 * requested from or accepted directly from the LLM.
 */

const RAW_METRIC_TAXONOMY = {
  "Growth & Revenue": [
    "revenue",
    "enterprise_customer_count",
    "independent_customer_count",
    "rd_customer_count",
    "acv_enterprise_soil",
    "acv_enterprise_era",
    "acv_enterprise_terrain",
    "pipeline_bookings_closed_value",
    "pipeline_open_value",
    "pipeline_deals_closed_count",
  ],
  Profitability: [
    "cost_of_sales",
    "gross_profit",
    "administrative_expenses",
    "other_operating_income",
    "operating_profit_loss",
    "profit_loss_before_tax",
    "profit_loss_after_tax",
  ],
  "Cash & Liquidity": [
    "cash_and_equivalents",
    "cash_at_period_start",
    "net_cash_operating_activities",
    "net_cash_investing_activities",
    "net_cash_financing_activities",
    "debtors",
    "creditors_due_within_one_year",
    "creditors_due_after_one_year",
    "depreciation_amortization",
  ],
  "Solvency/Balance Sheet": [
    "net_assets_liabilities",
    "called_up_share_capital",
    "share_premium",
    "retained_earnings",
    "goodwill",
    "development_costs",
    "tangible_assets",
    "contingent_consideration",
  ],
  "Returns/Market": [
    "share_price_close",
    "share_price_open",
    "share_price_high",
    "share_price_low",
    "share_price_volume",
    "admission_price",
    "share_option_pool_percentage",
  ],
};

/** Derived metrics are computed by deriveMetrics.js, never by the LLM. */
const DERIVED_METRIC_NAMES = [
  "gross_margin",
  "operating_margin",
  "total_assets",
  "ebitda",
  "ebitda_margin",
  "working_capital",
  "cash_runway_months",
  "roce",
];

const ALL_RAW_METRIC_NAMES = new Set(
  Object.values(RAW_METRIC_TAXONOMY).flat(),
);

function isRecognizedRawMetric(metricName) {
  return ALL_RAW_METRIC_NAMES.has(metricName);
}

const RAW_METRIC_CATEGORY_BY_NAME = new Map();
for (const [category, names] of Object.entries(RAW_METRIC_TAXONOMY)) {
  for (const name of names) {
    RAW_METRIC_CATEGORY_BY_NAME.set(name, category);
  }
}

/** Which taxonomy category each derived metric conceptually belongs to. */
const DERIVED_METRIC_CATEGORY_BY_NAME = {
  gross_margin: "Profitability",
  operating_margin: "Profitability",
  ebitda: "Profitability",
  ebitda_margin: "Profitability",
  total_assets: "Solvency/Balance Sheet",
  working_capital: "Cash & Liquidity",
  cash_runway_months: "Cash & Liquidity",
  roce: "Returns/Market",
};

/**
 * Resolves the `disclosures.category` value for a metric row — the raw
 * taxonomy category it belongs to for raw metrics, or its conceptual
 * category for derived metrics. Falls back to "Other" for anything
 * unrecognized (should not happen given isRecognizedRawMetric filtering).
 */
function categoryForMetric(metricName) {
  return (
    RAW_METRIC_CATEGORY_BY_NAME.get(metricName) ??
    DERIVED_METRIC_CATEGORY_BY_NAME[metricName] ??
    "Other"
  );
}

module.exports = {
  RAW_METRIC_TAXONOMY,
  DERIVED_METRIC_NAMES,
  ALL_RAW_METRIC_NAMES,
  isRecognizedRawMetric,
  categoryForMetric,
};
