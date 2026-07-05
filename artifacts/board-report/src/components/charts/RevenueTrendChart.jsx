import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(point.revenue, "EUR")}</p>
      {point.audited === false ? (
        <p className="mt-0.5 text-amber-600">Unaudited</p>
      ) : (
        <p className="mt-0.5 text-muted-foreground">Audited</p>
      )}
    </div>
  );
}

export function RevenueTrendChart({ metrics }) {
  const revenueRows = (metrics ?? []).filter((m) => m.payload?.metric_name === "revenue");

  if (revenueRows.length === 0) {
    return <EmptyState title="No revenue data disclosed" />;
  }

  const data = revenueRows
    .map((row) => ({
      period: row.period_label ?? "—",
      revenue: row.payload.value,
      audited: row.source_audited,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => formatCurrency(v, "EUR")}
            width={90}
          />
          <RechartsTooltip content={<ChartTooltip />} />
          <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
