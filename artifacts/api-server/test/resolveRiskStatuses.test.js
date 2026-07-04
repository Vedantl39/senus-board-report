const test = require("node:test");
const assert = require("node:assert/strict");
const { anthropic } = require("../src/lib/anthropicClient");
const { resolveRiskStatuses } = require("../src/extraction/extract");

function textMessage(text) {
  return { content: [{ type: "text", text }] };
}

function fakeClient(previousRisksByCategory) {
  return {
    query: async (sql, params) => {
      const category = params[0];
      return { rows: previousRisksByCategory[category] ?? [] };
    },
  };
}

test("marks every risk as New when no prior risks exist for its category (no Claude call)", async (t) => {
  const create = t.mock.method(anthropic.messages, "create", async () => {
    throw new Error("should not be called when there is no prior risk history");
  });

  const client = fakeClient({});
  const risks = [
    { category: "Market", title: "Competition risk", summary: "New entrants" },
    { category: "Operational", title: "Key person risk", summary: "Founder dependency" },
  ];

  const statuses = await resolveRiskStatuses(client, risks);

  assert.deepEqual(statuses, ["New", "New"]);
  assert.equal(create.mock.calls.length, 0);
});

test("calls Claude to diff risks per category when prior risks exist, mapping statuses back by index", async (t) => {
  t.mock.method(anthropic.messages, "create", async () =>
    textMessage(
      JSON.stringify([
        { title: "Competition risk", status: "Updated" },
      ]),
    ),
  );

  const client = fakeClient({
    Market: [{ title: "Competition risk", summary: "Old wording" }],
  });

  const risks = [
    { category: "Market", title: "Competition risk", summary: "New wording, same substance" },
    { category: "Operational", title: "Key person risk", summary: "Founder dependency" },
  ];

  const statuses = await resolveRiskStatuses(client, risks);

  assert.deepEqual(statuses, ["Updated", "New"]);
});
