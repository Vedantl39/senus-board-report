import { MetricsTable } from "@/components/MetricsTable";

export function InvestorsView({ data }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold text-foreground">
          Growth, Returns &amp; Market
        </h2>
        <MetricsTable metrics={data?.metrics} />
      </section>
    </div>
  );
}
