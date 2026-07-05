import { MetricsTable } from "@/components/MetricsTable";
import { HeroKpiStrip } from "@/components/kpi/HeroKpiStrip";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { EbitdaWaterfallChart } from "@/components/charts/EbitdaWaterfallChart";

export function ManagementView({ data }) {
  return (
    <div className="space-y-8">
      <section>
        <HeroKpiStrip metrics={data?.metrics} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <RevenueTrendChart metrics={data?.metrics} />
        <EbitdaWaterfallChart metrics={data?.metrics} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Growth, Revenue &amp; Profitability
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
    </div>
  );
}
