/**
 * Derived Metrics Calculator — Senus PLC Board Report
 *
 * Implements the formulas defined in ai-extraction-design.md §10.
 * Pure functions only: given raw metric values, return derived values.
 * No AI calls here — see ai-extraction-design.md §4 for why arithmetic
 * stays in code, not in an LLM prompt.
 *
 * Input shape: a "rawMetrics" object keyed by metric_name (matching the
 * raw metric taxonomy in ai-extraction-design.md §7/§2.6), values in EUR
 * unless noted. Missing inputs are treated as `null` and propagate as
 * `null` outputs rather than throwing — a board report should show
 * "not available" rather than crash on an incomplete document.
 */

function safeDivide(numerator, denominator) {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function safeSum(...values) {
  if (values.some((v) => v === null || v === undefined)) return null;
  return values.reduce((a, b) => a + b, 0);
}

/** gross_margin = gross_profit / revenue */
function grossMargin(raw) {
  return safeDivide(raw.gross_profit, raw.revenue);
}

/** operating_margin = operating_profit_loss / revenue */
function operatingMargin(raw) {
  return safeDivide(raw.operating_profit_loss, raw.revenue);
}

/**
 * total_assets = (goodwill + development_costs + tangible_assets)
 *              + (debtors + cash_and_equivalents)
 * Not disclosed as a single line item — computed as a subtotal.
 */
function totalAssets(raw) {
  const fixedAssets = safeSum(
    raw.goodwill ?? 0,
    raw.development_costs ?? 0,
    raw.tangible_assets ?? 0
  );
  const currentAssets = safeSum(raw.debtors ?? 0, raw.cash_and_equivalents ?? 0);
  return safeSum(fixedAssets, currentAssets);
}

/** ebitda = operating_profit_loss + depreciation_amortization */
function ebitda(raw) {
  return safeSum(raw.operating_profit_loss, raw.depreciation_amortization);
}

/** ebitda_margin = ebitda / revenue */
function ebitdaMargin(raw) {
  return safeDivide(ebitda(raw), raw.revenue);
}

/**
 * working_capital = (debtors + cash_and_equivalents) - creditors_due_within_one_year
 */
function workingCapital(raw) {
  const currentAssets = safeSum(raw.debtors ?? 0, raw.cash_and_equivalents ?? 0);
  if (currentAssets === null || raw.creditors_due_within_one_year === null) return null;
  return currentAssets - raw.creditors_due_within_one_year;
}

/**
 * cash_runway_months = cash_and_equivalents / average monthly net cash used in operations
 * net_cash_operating_activities is negative when cash is being burned — runway is
 * only meaningful when burning cash, so a positive (cash-generative) period returns null
 * rather than a misleading negative or infinite "runway".
 * periodMonths: number of months the operating cash flow figure covers (e.g. 6 for H1).
 */
function cashRunwayMonths(raw, periodMonths) {
  if (raw.cash_and_equivalents === null || raw.net_cash_operating_activities === null) {
    return null;
  }
  if (raw.net_cash_operating_activities >= 0) return null; // not burning cash
  const monthlyBurn = Math.abs(raw.net_cash_operating_activities) / periodMonths;
  if (monthlyBurn === 0) return null;
  return raw.cash_and_equivalents / monthlyBurn;
}

/** roce = operating_profit_loss / (total_assets - creditors_due_within_one_year) */
function roce(raw) {
  const capitalEmployed = safeSum(
    totalAssets(raw),
    raw.creditors_due_within_one_year === null ? null : -raw.creditors_due_within_one_year
  );
  return safeDivide(raw.operating_profit_loss, capitalEmployed);
}

/**
 * Computes every derived metric for one period's raw metrics.
 * Returns an object of { metric_name: value|null }, ready to be
 * inserted as `derived: true` rows per schema-design.md §6.
 */
function computeDerivedMetrics(rawMetrics, periodMonths) {
  return {
    gross_margin: grossMargin(rawMetrics),
    operating_margin: operatingMargin(rawMetrics),
    total_assets: totalAssets(rawMetrics),
    ebitda: ebitda(rawMetrics),
    ebitda_margin: ebitdaMargin(rawMetrics),
    working_capital: workingCapital(rawMetrics),
    cash_runway_months: cashRunwayMonths(rawMetrics, periodMonths),
    roce: roce(rawMetrics),
  };
}

module.exports = {
  grossMargin,
  operatingMargin,
  totalAssets,
  ebitda,
  ebitdaMargin,
  workingCapital,
  cashRunwayMonths,
  roce,
  computeDerivedMetrics,
};
