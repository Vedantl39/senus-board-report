const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCommentaryPrompt } = require("../src/commentary/buildCommentaryPrompt");

test("includes audience-specific framing in the system prompt", () => {
  const { systemPrompt } = buildCommentaryPrompt({ audience: "lenders", metrics: [] });
  assert.match(systemPrompt, /lenders/);
  assert.match(systemPrompt, /liquidity/i);
});

test("prompt requires exactly the three Measure/Report/Verify headings", () => {
  const { systemPrompt } = buildCommentaryPrompt({ audience: "board", metrics: [] });
  assert.match(systemPrompt, /## Measure/);
  assert.match(systemPrompt, /## Report/);
  assert.match(systemPrompt, /## Verify/);
});

test("formats metric, risk, and event records into the user prompt", () => {
  const { prompt } = buildCommentaryPrompt({
    audience: "management",
    metrics: [
      {
        category: "Profitability",
        period_label: "FY2025",
        source_filename: "doc.pdf",
        payload: { metric_name: "revenue", value: 100, comparative_value: 80, unit: "EUR" },
      },
    ],
    risks: [
      {
        category: "Financial and Shares",
        status: "New",
        source_filename: "doc.pdf",
        payload: { title: "Cash burn risk", description: "..." },
      },
    ],
    events: [
      {
        period_label: "H1 FY2026",
        payload: { title: "Leadership change", description: "New CFO appointed" },
      },
    ],
  });

  assert.match(prompt, /revenue = 100/);
  assert.match(prompt, /Cash burn risk/);
  assert.match(prompt, /Leadership change/);
});

test("handles an audience with no data at all without throwing", () => {
  const { prompt } = buildCommentaryPrompt({ audience: "management" });
  assert.match(prompt, /no data available/i);
});
