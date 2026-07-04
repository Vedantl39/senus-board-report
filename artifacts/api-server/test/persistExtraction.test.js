const test = require("node:test");
const assert = require("node:assert/strict");
const { persistExtraction } = require("../src/extraction/persistExtraction");

function fakeClient() {
  const calls = [];
  return {
    calls,
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rows: [] };
    },
  };
}

test("inserts one raw metric row per extracted metric plus derived rows computed from deriveMetrics", async () => {
  const client = fakeClient();

  await persistExtraction(client, {
    sourceDocumentId: "doc-1",
    metadata: { category: "H1", periodLabel: "H1 FY2026", consolidationBasis: "consolidated" },
    metrics: [
      { metric_name: "revenue", value: 354813, comparative_value: null, comparative_period: null },
      { metric_name: "gross_profit", value: 289952, comparative_value: null, comparative_period: null },
    ],
    risks: [],
    riskStatuses: [],
    events: [],
    periodMonths: 6,
  });

  const metricInserts = client.calls.filter((c) => c.sql.includes("record_type, category, period_label, consolidation_basis"));
  // 2 raw + 2 derived (gross_margin, total_assets); the rest are null/NaN
  // given this partial input and are correctly skipped.
  assert.equal(metricInserts.length, 4);

  const payloads = metricInserts.map((c) => JSON.parse(c.params[4]));
  const grossMarginRow = payloads.find((p) => p.metric_name === "gross_margin");
  assert.ok(grossMarginRow, "expected a derived gross_margin row to be inserted");
  assert.equal(grossMarginRow.derived, true);
  assert.ok(Math.abs(grossMarginRow.value - 0.817) < 0.001);

  const nanMetricNames = ["working_capital", "cash_runway_months"];
  for (const name of nanMetricNames) {
    assert.ok(
      !payloads.some((p) => p.metric_name === name),
      `${name} should be skipped rather than stored as NaN/null`,
    );
  }
});

test("does not attempt derived-metric computation when there are no raw metrics", async () => {
  const client = fakeClient();

  await persistExtraction(client, {
    sourceDocumentId: "doc-1",
    metadata: { category: "H1", periodLabel: "H1 FY2026" },
    metrics: [],
    risks: [],
    riskStatuses: [],
    events: [],
    periodMonths: 6,
  });

  assert.equal(client.calls.length, 0);
});

test("inserts risks with materiality_rank as array index and events as their own record_type", async () => {
  const client = fakeClient();

  await persistExtraction(client, {
    sourceDocumentId: "doc-1",
    metadata: { periodLabel: "H1 FY2026" },
    metrics: [],
    risks: [
      { category: "Market", title: "First risk", summary: "..." },
      { category: "Market", title: "Second risk", summary: "..." },
    ],
    riskStatuses: ["New", "Unchanged"],
    events: [{ title: "Admission to trading", description: "..." }],
    periodMonths: 6,
  });

  const riskInserts = client.calls.filter((c) => c.sql.includes("'risk'"));
  assert.equal(riskInserts.length, 2);
  assert.equal(riskInserts[0].params[2], 0);
  assert.equal(riskInserts[1].params[2], 1);
  assert.equal(riskInserts[0].params[3], "New");
  assert.equal(riskInserts[1].params[3], "Unchanged");

  const eventInserts = client.calls.filter((c) => c.sql.includes("'event'"));
  assert.equal(eventInserts.length, 1);
});
