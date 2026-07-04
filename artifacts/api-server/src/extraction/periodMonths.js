/**
 * Senus reports FY (full year, 12 months) or H1/H2 (half year, 6 months)
 * periods only — see replit-build-prompt: "Senus reports FY/HY only".
 * Infers the number of months a period_label covers so cashRunwayMonths()
 * can be computed. Returns null when it cannot be inferred, in which case
 * cash_runway_months is stored as null rather than guessed.
 */
function inferPeriodMonths(periodLabel) {
  if (!periodLabel) return null;
  const label = periodLabel.toUpperCase();
  if (/\bH1\b|\bH2\b|HALF[\s-]?YEAR/.test(label)) return 6;
  if (/\bFY\d*\b|FULL[\s-]?YEAR|ANNUAL/.test(label)) return 12;
  return null;
}

module.exports = { inferPeriodMonths };
