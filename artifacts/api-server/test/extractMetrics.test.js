const test = require("node:test");
const assert = require("node:assert/strict");
const { anthropic } = require("../src/lib/anthropicClient");
const { extractMetrics } = require("../src/extraction/extractMetrics");

function textMessage(text) {
  return { content: [{ type: "text", text }] };
}

test("drops metric names outside the fixed taxonomy instead of storing them", async (t) => {
  t.mock.method(anthropic.messages, "create", async () =>
    textMessage(
      JSON.stringify([
        { metric_name: "revenue", value: 100, unit: "EUR", comparative_value: null, comparative_period: null },
        { metric_name: "made_up_metric_not_in_taxonomy", value: 999, unit: "EUR", comparative_value: null, comparative_period: null },
      ]),
    ),
  );

  const result = await extractMetrics("some document text");

  assert.equal(result.length, 1);
  assert.equal(result[0].metric_name, "revenue");
});

test("throws if Claude does not return a JSON array", async (t) => {
  t.mock.method(anthropic.messages, "create", async () =>
    textMessage('{"not": "an array"}'),
  );

  await assert.rejects(() => extractMetrics("some document text"));
});
