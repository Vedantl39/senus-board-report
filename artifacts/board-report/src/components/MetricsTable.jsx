import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { ConsolidationBadge } from "@/components/badges/ConsolidationBadge";
import { humanize, formatCurrency, groupBy } from "@/lib/format";

export function MetricsTable({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return <p className="text-sm text-muted-foreground">No metrics disclosed for this view.</p>;
  }

  const byCategory = groupBy(metrics, (m) => m.category ?? "Other");

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, rows]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary/80">
            {humanize(category)}
          </h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Metric</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">Comparative</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const payload = row.payload ?? {};
                  return (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground">
                        {humanize(payload.metric_name)}
                        {payload.derived ? (
                          <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                            (derived)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.period_label ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {formatCurrency(payload.value, payload.unit)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {payload.comparative_value !== undefined &&
                        payload.comparative_value !== null
                          ? `${formatCurrency(payload.comparative_value, payload.unit)} (${
                              payload.comparative_period ?? "prior period"
                            })`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.source_audited === false ? <UnauditedBadge /> : null}
                          <ConsolidationBadge basis={row.consolidation_basis} />
                          {row.source_filename ? (
                            <span
                              className="truncate text-[11px] text-muted-foreground"
                              title={row.source_filename}
                            >
                              {row.source_filename}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
