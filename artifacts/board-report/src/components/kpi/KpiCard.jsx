import { Tooltip } from "@/components/Tooltip";
import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { ConsolidationBadge } from "@/components/badges/ConsolidationBadge";
import { TrendArrow } from "@/components/kpi/TrendArrow";
import { formatCurrency, formatPercent } from "@/lib/format";
import { percentChange } from "@/lib/metricsHelpers";

/**
 * A single hero KPI card. `metric` is a raw disclosure row (with `.payload`
 * and traceability fields from the shared query builder). `positiveIsGood`
 * controls whether an increase renders green or red (e.g. revenue up is
 * good, operating loss widening is bad).
 */
export function KpiCard({ label, metric, isPercent = false, positiveIsGood = true }) {
  if (!metric) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Not available</p>
      </div>
    );
  }

  const payload = metric.payload ?? {};
  const value = isPercent
    ? formatPercent(payload.value)
    : formatCurrency(payload.value, payload.unit);

  const change = percentChange(payload.value, payload.comparative_value);

  const tooltipContent = (
    <div className="space-y-0.5">
      <p className="font-semibold">{metric.source_filename ?? "Unknown source"}</p>
      <p className="text-muted-foreground">
        {metric.source_audited === false ? "Unaudited" : "Audited"}
        {metric.consolidation_basis ? ` · ${metric.consolidation_basis}` : ""}
      </p>
      {metric.period_label ? <p className="text-muted-foreground">{metric.period_label}</p> : null}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div className="w-full cursor-help rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {payload.derived ? (
            <span className="text-[10px] uppercase text-muted-foreground/70">derived</span>
          ) : null}
        </div>
        <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <TrendArrow change={change} positiveIsGood={positiveIsGood} />
          {metric.source_audited === false ? <UnauditedBadge /> : null}
          <ConsolidationBadge basis={metric.consolidation_basis} />
        </div>
      </div>
    </Tooltip>
  );
}
