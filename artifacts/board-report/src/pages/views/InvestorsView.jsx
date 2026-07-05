import { MetricsTable } from "@/components/MetricsTable";
import { RiskRegister } from "@/components/RiskRegister";
import { KpiCard } from "@/components/kpi/KpiCard";
import { findMetric, latestPeriod } from "@/lib/metricsHelpers";

export function InvestorsView({ data }) {
  const period = latestPeriod(data?.metrics);
  const roce = findMetric(data?.metrics, "roce", period);
  const admissionPrice = findMetric(data?.metrics, "admission_price", period);
  const sharePrice = findMetric(data?.metrics, "share_price_close", period);

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
