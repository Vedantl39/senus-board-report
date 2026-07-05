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

export function percentChange(current, previous) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
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
