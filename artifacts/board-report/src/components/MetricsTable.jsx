import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { ConsolidationBadge } from "@/components/badges/ConsolidationBadge";
import { EmptyState } from "@/components/EmptyState";
import { Tooltip } from "@/components/Tooltip";
import { humanize, formatCurrency, formatPercent, groupBy } from "@/lib/format";

export function MetricsTable({ metrics }) {
  const [openCategory, setOpenCategory] = useState(undefined);

  if (!metrics || metrics.length === 0) {
    return (
      <EmptyState
        title="No metrics disclosed for this view"
        description="Once a source document is extracted for this audience's categories, the figures will appear here automatically."
      />
    );
  }

  const byCategory = groupBy(metrics, (m) => m.category ?? "Other");
  const categoryEntries = Array.from(byCategory.entries());
  const activeCategory = openCategory === undefined ? categoryEntries[0]?.[0] : openCategory;

  const toggleCategory = (category) => {
    setOpenCategory((prev) => {
      const current = prev === undefined ? categoryEntries[0]?.[0] : prev;
      return current === category ? null : category;
    });
  };

  return (
    <div className="space-y-3">
      {categoryEntries.map(([category, rows]) => {
        const isOpen = activeCategory === category;
        return (
          <div key={category} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between gap-3 bg-muted/40 px-3 py-2.5 text-left hover:bg-muted/60"
              aria-expanded={isOpen}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/80">
                {humanize(category)}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{rows.length} metric{rows.length === 1 ? "" : "s"}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </div>
            </button>
            {isOpen ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-t border-border bg-muted/60 text-left text-muted-foreground">
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
                          {payload.unit === "ratio"
                            ? formatPercent(payload.value)
                            : formatCurrency(payload.value, payload.unit)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {payload.comparative_value !== undefined &&
                          payload.comparative_value !== null
                            ? `${
                                payload.unit === "ratio"
                                  ? formatPercent(payload.comparative_value)
                                  : formatCurrency(payload.comparative_value, payload.unit)
                              } (${payload.comparative_period ?? "prior period"})`
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Tooltip
                            content={
                              <div className="space-y-0.5">
                                <p className="font-semibold">
                                  {row.source_filename ?? "Unknown source"}
                                </p>
                                <p className="text-muted-foreground">
                                  {row.source_audited === false ? "Unaudited" : "Audited"}
                                </p>
                              </div>
                            }
                          >
                            <div className="flex cursor-help flex-wrap items-center gap-1.5">
                              {row.source_audited === false ? <UnauditedBadge /> : null}
                              <ConsolidationBadge basis={row.consolidation_basis} />
                              {row.source_filename ? (
                                <span className="truncate text-[11px] text-muted-foreground">
                                  {row.source_filename}
                                </span>
                              ) : null}
                            </div>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
