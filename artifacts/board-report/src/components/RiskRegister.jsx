import { StatusPill } from "@/components/badges/StatusPill";
import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { EmptyState } from "@/components/EmptyState";
import { humanize, groupBy } from "@/lib/format";

export function RiskRegister({ risks }) {
  if (!risks || risks.length === 0) {
    return (
      <EmptyState
        title="No risks disclosed"
        description="The risk register will populate once a source document's risk factors section is extracted."
      />
    );
  }

  const byCategory = groupBy(risks, (r) => r.category ?? "Other");

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, items]) => {
        const ordered = [...items].sort(
          (a, b) => (a.materiality_rank ?? 999) - (b.materiality_rank ?? 999),
        );
        return (
          <div key={category}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary/80">
              {humanize(category)}
            </h3>
            <ul className="space-y-2">
              {ordered.map((risk, index) => {
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
          </div>
        );
      })}
    </div>
  );
}
