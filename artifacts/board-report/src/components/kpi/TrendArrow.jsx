export function TrendArrow({ change, positiveIsGood = true }) {
  if (change === null || change === undefined || Number.isNaN(change)) {
    return null;
  }

  const isUp = change > 0;
  const isFlat = change === 0;
  const isGood = isFlat ? null : isUp === positiveIsGood;

  const colorClass = isFlat
    ? "text-muted-foreground"
    : isGood
      ? "text-emerald-600"
      : "text-red-600";

  const arrow = isFlat ? "→" : isUp ? "▲" : "▼";
  const pct = Math.abs(change * 100);

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${colorClass}`}>
      <span aria-hidden="true">{arrow}</span>
      {pct.toFixed(1)}%
    </span>
  );
}
