import { KpiCard } from "@/components/kpi/KpiCard";
import { findMetric, latestPeriod } from "@/lib/metricsHelpers";

/**
 * Hero KPI strip — a row of headline metric cards for the most recent
 * period available in `metrics`, each with a trend arrow (vs. the
 * comparative period baked into the metric payload by the seed/extraction
 * pipeline) and a traceability tooltip (source doc + audited status).
 */
export function HeroKpiStrip({ metrics }) {
  if (!metrics || metrics.length === 0) return null;

  const period = latestPeriod(metrics);

  const revenue = findMetric(metrics, "revenue", period);
  const grossMargin = findMetric(metrics, "gross_margin", period);
  const operatingProfitLoss = findMetric(metrics, "operating_profit_loss", period);
  const ebitda = findMetric(metrics, "ebitda", period);

  return (
    <div>
      {period ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Latest period: {period}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Revenue" metric={revenue} positiveIsGood />
        <KpiCard label="Gross Margin" metric={grossMargin} isPercent positiveIsGood />
        <KpiCard label="Operating Profit/Loss" metric={operatingProfitLoss} positiveIsGood />
        <KpiCard label="EBITDA" metric={ebitda} positiveIsGood />
      </div>
    </div>
  );
}
