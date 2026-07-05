import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusPill } from "@/components/badges/StatusPill";
import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { EmptyState } from "@/components/EmptyState";
import { humanize, groupBy } from "@/lib/format";

const DEFAULT_VISIBLE_PER_CATEGORY = 2;

export function RiskRegister({ risks }) {
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  if (!risks || risks.length === 0) {
    return (
      <EmptyState
        title="No risks disclosed"
        description="The risk register will populate once a source document's risk factors section is extracted."
      />
    );
  }

  const byCategory = groupBy(risks, (r) => r.category ?? "Other");

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, items]) => {
        const ordered = [...items].sort(
          (a, b) => (a.materiality_rank ?? 999) - (b.materiality_rank ?? 999),
        );
        const isExpanded = expandedCategories.has(category);
        const visible = isExpanded ? ordered : ordered.slice(0, DEFAULT_VISIBLE_PER_CATEGORY);
        const hiddenCount = ordered.length - visible.length;

        return (
          <div key={category}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary/80">
              {humanize(category)}
            </h3>
            <ul className="space-y-2">
              {visible.map((risk, index) => {
                const payload = risk.payload ?? {};
                const isMostMaterial = index === 0;
                return (
                  <li
                    key={risk.id}
                    className={
                      isMostMaterial
                        ? "rounded-lg border-2 border-primary/30 bg-card p-4 shadow-md"
                        : "rounded-lg border border-border bg-card p-3"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={
                          isMostMaterial
                            ? "text-base font-semibold text-foreground"
                            : "font-medium text-foreground"
                        }
                      >
                        {isMostMaterial ? (
                          <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Most material
                          </span>
                        ) : null}
                        {payload.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusPill status={risk.status} />
                        {risk.source_audited === false ? <UnauditedBadge /> : null}
                      </div>
                    </div>
                    <p
                      className={
                        isMostMaterial
                          ? "mt-1.5 text-sm text-foreground/90"
                          : "mt-1 text-sm text-muted-foreground"
                      }
                    >
                      {payload.summary}
                    </p>
                  </li>
                );
              })}
            </ul>
            {ordered.length > DEFAULT_VISIBLE_PER_CATEGORY ? (
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
                {isExpanded
                  ? "Show less"
                  : `Show all in ${humanize(category)} (${hiddenCount} more)`}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
