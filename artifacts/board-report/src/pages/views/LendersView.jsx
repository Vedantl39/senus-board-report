import { MetricsTable } from "@/components/MetricsTable";
import { RiskRegister } from "@/components/RiskRegister";
import { KpiCard } from "@/components/kpi/KpiCard";
import { findMetric, latestPeriod } from "@/lib/metricsHelpers";

export function LendersView({ data }) {
  const period = latestPeriod(data?.metrics);
  const netAssetsLiabilities = findMetric(data?.metrics, "net_assets_liabilities", period);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Cash, Liquidity &amp; Working Capital
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Solvency &amp; Leverage
        </h2>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Net Assets / (Liabilities)"
            metric={netAssetsLiabilities}
            positiveIsGood
            signLabels={{ positive: "Net Assets", negative: "Net Liabilities" }}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Key Risks</h2>
        <RiskRegister risks={data?.risks} />
      </section>
    </div>
  );
}
