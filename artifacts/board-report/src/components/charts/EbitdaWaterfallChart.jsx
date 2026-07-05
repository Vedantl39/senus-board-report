import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/format";
import { findMetric, latestPeriod } from "@/lib/metricsHelpers";

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-popover-foreground">{point.label}</p>
      <p className="text-muted-foreground">{formatCurrency(point.delta, "EUR")}</p>
    </div>
  );
}

/**
 * Builds a Revenue -> EBITDA waterfall from raw disclosed line items for
 * the given period, entirely from real seeded figures — no invented
 * numbers. Each step's `delta` is the true reported/derived value; only
 * the running-total `base` (used to stack bars visually) is computed here.
 */
function buildWaterfallSteps(metrics, period) {
  const revenue = findMetric(metrics, "revenue", period)?.payload?.value;
  const grossProfit = findMetric(metrics, "gross_profit", period)?.payload?.value;
  const operatingProfitLoss = findMetric(metrics, "operating_profit_loss", period)?.payload?.value;
  const depreciationAmortization = findMetric(metrics, "depreciation_amortization", period)?.payload
    ?.value;
  const ebitda = findMetric(metrics, "ebitda", period)?.payload?.value;

  if (
    revenue === undefined ||
    grossProfit === undefined ||
    operatingProfitLoss === undefined ||
    ebitda === undefined
  ) {
    return null;
  }

  const costOfSales = grossProfit - revenue;
  const operatingExpenses = operatingProfitLoss - grossProfit;
  const daAddBack = depreciationAmortization ?? ebitda - operatingProfitLoss;

  const steps = [
    { label: "Revenue", delta: revenue, kind: "total" },
    { label: "Cost of Sales", delta: costOfSales, kind: "decrease" },
    { label: "Gross Profit", delta: grossProfit, kind: "total" },
    { label: "Operating Expenses", delta: operatingExpenses, kind: "decrease" },
    { label: "Operating Profit/Loss", delta: operatingProfitLoss, kind: "total" },
    { label: "D&A Add-back", delta: daAddBack, kind: "increase" },
    { label: "EBITDA", delta: ebitda, kind: "total" },
  ];

  let running = 0;
  return steps.map((step) => {
    if (step.kind === "total") {
      const base = 0;
      running = step.delta;
      return { ...step, base, top: step.delta, floating: false };
    }
    const start = running;
    const end = running + step.delta;
    running = end;
    const base = Math.min(start, end);
    const top = Math.abs(step.delta);
    return { ...step, base, top, floating: true };
  });
}

const COLORS = {
  total: "hsl(var(--chart-1))",
  increase: "hsl(var(--chart-2))",
  decrease: "hsl(var(--destructive))",
};

export function EbitdaWaterfallChart({ metrics }) {
  const period = latestPeriod(metrics ?? []);
  const steps = buildWaterfallSteps(metrics ?? [], period);

  if (!steps) {
    return (
      <EmptyState
        title="EBITDA waterfall not available"
        description="Requires revenue, gross profit and operating profit/loss for the same period."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Revenue → EBITDA Bridge {period ? `(${period})` : ""}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={steps} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => formatCurrency(v, "EUR")}
            width={90}
          />
          <RechartsTooltip content={<ChartTooltip />} />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="top" stackId="waterfall" radius={[4, 4, 0, 0]}>
            {steps.map((step) => (
              <Cell key={step.label} fill={COLORS[step.kind]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
