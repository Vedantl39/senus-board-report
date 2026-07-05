import { MetricsTable } from "@/components/MetricsTable";
import { RiskRegister } from "@/components/RiskRegister";
import { KpiCard } from "@/components/kpi/KpiCard";
import { findLatestMetric } from "@/lib/metricsHelpers";

export function InvestorsView({ data }) {
  // These are looked up independently per-metric (not pinned to the report's
  // single "latest period") because admission_price/share_price_close are
  // point-in-time facts that aren't necessarily re-disclosed every period —
  // see findLatestMetric's doc comment.
  const roce = findLatestMetric(data?.metrics, "roce");
  const admissionPrice = findLatestMetric(data?.metrics, "admission_price");
  const sharePrice = findLatestMetric(data?.metrics, "share_price_close");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Returns</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="ROCE" metric={roce} isPercent positiveIsGood />
          <KpiCard label="Admission Price" metric={admissionPrice} positiveIsGood />
          <KpiCard label="Current Share Price" metric={sharePrice} positiveIsGood />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Growth, Returns &amp; Market
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Key Risks</h2>
        <RiskRegister risks={data?.risks} />
      </section>
    </div>
  );
}
