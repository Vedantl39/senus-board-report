const test = require("node:test");
const assert = require("node:assert/strict");
const { mock } = require("node:test");
const { anthropic } = require("../src/lib/anthropicClient");
const { callClaudeJson } = require("../src/extraction/callClaudeJson");

function textMessage(text) {
  return { content: [{ type: "text", text }] };
}

test("returns parsed JSON on first successful response", async (t) => {
  const create = t.mock.method(anthropic.messages, "create", async () =>
    textMessage('[{"metric_name":"revenue","value":100}]'),
  );

  const result = await callClaudeJson({ systemPrompt: "sys", prompt: "prompt" });

  assert.deepEqual(result, [{ metric_name: "revenue", value: 100 }]);
  assert.equal(create.mock.calls.length, 1);
});

test("strips markdown code fences before parsing", async (t) => {
  t.mock.method(anthropic.messages, "create", async () =>
    textMessage('```json\n{"ok":true}\n```'),
  );

  const result = await callClaudeJson({ systemPrompt: "sys", prompt: "prompt" });
  assert.deepEqual(result, { ok: true });
});

test("retries once on invalid JSON, then succeeds", async (t) => {
  let callCount = 0;
  const create = t.mock.method(anthropic.messages, "create", async () => {
    callCount += 1;
    if (callCount === 1) {
      return textMessage("not valid json");
    }
    return textMessage('{"recovered":true}');
  });

  const result = await callClaudeJson({ systemPrompt: "sys", prompt: "prompt" });

  assert.deepEqual(result, { recovered: true });
  assert.equal(create.mock.calls.length, 2);
});

test("fails cleanly after two invalid JSON responses, without guessing data", async (t) => {
  const create = t.mock.method(
    anthropic.messages,
    "create",
    async () => textMessage("still not valid json"),
  );

  await assert.rejects(
    () => callClaudeJson({ systemPrompt: "sys", prompt: "prompt" }),
    (err) => {
      assert.equal(err.name, "ClaudeExtractionError");
      assert.equal(err.rawResponse, "still not valid json");
      return true;
    },
  );

  assert.equal(create.mock.calls.length, 2);
});
