import { StatusPill } from "@/components/badges/StatusPill";
import { UnauditedBadge } from "@/components/badges/UnauditedBadge";
import { humanize, groupBy } from "@/lib/format";

export function RiskRegister({ risks }) {
  if (!risks || risks.length === 0) {
    return <p className="text-sm text-muted-foreground">No risks disclosed.</p>;
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
              {ordered.map((risk) => {
                const payload = risk.payload ?? {};
                return (
                  <li
                    key={risk.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-foreground">
                        {payload.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusPill status={risk.status} />
                        {risk.source_audited === false ? <UnauditedBadge /> : null}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
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
