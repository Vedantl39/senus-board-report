/**
 * Renders a colored trend arrow for a `change` ratio (from `percentChange`).
 *
 * Color/direction is intentionally based on `isUp === positiveIsGood`, NOT
 * on the sign of the underlying metric. This already handles loss-type
 * metrics (e.g. `operating_profit_loss`, always negative while it's a
 * loss) correctly as long as the caller passes `positiveIsGood`: since a
 * loss narrowing means the raw value moves up (less negative, e.g. -1.13m
 * -> -0.63m is numerically an increase), `isUp` is `true` for an
 * improvement and `false` for a widening loss — so `positiveIsGood={true}`
 * (the default, used for operating_profit_loss in HeroKpiStrip) correctly
 * renders a narrowing loss as a green up-arrow and a widening loss as a
 * red down-arrow. Do NOT special-case "negative metrics" here; `change`'s
 * sign already encodes favorability once `positiveIsGood` is set correctly
 * by the caller. (Confirmed against real data: FY2025 operating loss
 * narrowing -1,130,729 -> -633,694 renders +44.0% green up; H1 FY2026
 * widening -405,577 -> -483,753 renders -19.3% red down.) Metrics that can
 * flip sign between periods (net assets <-> net liabilities) are handled
 * upstream by `hasSignFlip`/`percentChange`, which returns `null` and
 * causes `KpiCard` to skip this component entirely in favor of a side-by-side
 * value comparison — a signed "%" change is never meaningful there.
 */
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
