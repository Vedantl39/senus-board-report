const test = require("node:test");
const assert = require("node:assert/strict");
const { fetchPreviousRisksByCategory } = require("../src/extraction/persistExtraction");

function fakeClient(rowsBySql) {
  return {
    query: async (sql, params) => {
      if (sql.includes("SELECT source_document_id")) {
        return { rows: rowsBySql.latestDocQuery ?? [] };
      }
      return { rows: rowsBySql.finalQuery ?? [] };
    },
  };
}

test("scopes previous risks to a single most-recent document, not a mix across documents", async () => {
  const client = {
    calls: [],
    query: async function (sql, params) {
      this.calls.push({ sql, params });
      // The single query uses a correlated subquery, so we simulate the DB
      // by returning rows only for the category asked about.
      return {
        rows: [
          { title: "Competition risk", summary: "From the latest H1 doc" },
          { title: "Supply chain risk", summary: "From the latest H1 doc" },
        ],
      };
    },
  };

  const rows = await fetchPreviousRisksByCategory(client, "Market");

  assert.equal(client.calls.length, 1);
  const [{ sql, params }] = client.calls;
  assert.equal(params[0], "Market");
  assert.match(sql, /source_document_id\s*=\s*\(/, "must scope to a single document via subquery, not just ORDER BY/LIMIT on the outer query");
  assert.equal(rows.length, 2);
});
