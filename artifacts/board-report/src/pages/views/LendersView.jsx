import { MetricsTable } from "@/components/MetricsTable";

export function LendersView({ data }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Cash, Liquidity &amp; Working Capital
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
    </div>
  );
}
