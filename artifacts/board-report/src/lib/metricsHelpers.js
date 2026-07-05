export function findMetric(metrics, metricName, periodLabel) {
  if (!metrics) return null;
  return (
    metrics.find(
      (m) =>
        m.payload?.metric_name === metricName &&
        (periodLabel ? m.period_label === periodLabel : true),
    ) ?? null
  );
}

/**
 * True when `current` and `previous` are both present, both nonzero, and
 * have opposite signs (e.g. net liabilities flipping to net assets). A
 * percentage change across a sign flip is technically calculable but
 * practically meaningless/misleading, so callers should show both raw
 * values side by side instead of a "%" change in this case.
 */
export function hasSignFlip(current, previous) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    current === 0 ||
    previous === 0
  ) {
    return false;
  }
  return Math.sign(current) !== Math.sign(previous);
}

export function percentChange(current, previous) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0 ||
    hasSignFlip(current, previous)
  ) {
    return null;
  }
  return (current - previous) / Math.abs(previous);
}

export function latestPeriod(metrics) {
  if (!metrics || metrics.length === 0) return null;
  const withDates = metrics
    .map((m) => m.period_label)
    .filter(Boolean);
  if (withDates.includes("H1 FY2026")) return "H1 FY2026";
  return withDates[0] ?? null;
}

/**
 * Finds the most recent record for a specific metric_name, independent of
 * whichever period happens to be the report's overall `latestPeriod()`.
 *
 * Some disclosed facts (e.g. `admission_price`) are one-time/point-in-time
 * figures that only ever get extracted for the document/period that first
 * announced them (e.g. FY2025's Direct Listing) and are never re-disclosed
 * in later periods (e.g. H1 FY2026). Using `findMetric(metrics, name,
 * latestPeriod(metrics))` for those metrics incorrectly renders "Not
 * available" even though the fact is present in the data — it's a
 * period-scoping mismatch, not a missing-data problem. This helper instead
 * looks at only the records that actually exist for that metric name and
 * picks the most recent of those, preferring a labeled period over an
 * unlabeled one.
 */
export function findLatestMetric(metrics, metricName) {
  if (!metrics) return null;
  const matches = metrics.filter((m) => m.payload?.metric_name === metricName);
  if (matches.length === 0) return null;

  const labeled = matches.filter((m) => m.period_label);
  const pool = labeled.length > 0 ? labeled : matches;

  const preferredOrder = ["H1 FY2026", "FY2025"];
  for (const period of preferredOrder) {
    const found = pool.find((m) => m.period_label === period);
    if (found) return found;
  }
  return pool[0];
}
