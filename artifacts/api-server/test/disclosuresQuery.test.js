const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDisclosuresQuery,
  queryDisclosures,
} = require("../src/lib/disclosuresQuery");

test("builds an unfiltered query when no filters are given", () => {
  const { text, params } = buildDisclosuresQuery();
  assert.equal(params.length, 0);
  assert.doesNotMatch(text, /WHERE/);
  assert.match(text, /LEFT JOIN source_documents/);
});

test("combines record_type, category, and period_label filters with AND", () => {
  const { text, params } = buildDisclosuresQuery({
    recordType: "metric",
    category: "Growth & Revenue",
    periodLabel: "H1 FY2026",
  });

  assert.deepEqual(params, ["metric", "Growth & Revenue", "H1 FY2026"]);
  assert.match(text, /d\.record_type = \$1/);
  assert.match(text, /d\.category = \$2/);
  assert.match(text, /d\.period_label = \$3/);
  assert.match(text, /AND/);
});

test("filters are all optional and combinable independently", () => {
  const onlyCategory = buildDisclosuresQuery({ category: "Profitability" });
  assert.equal(onlyCategory.params.length, 1);
  assert.doesNotMatch(onlyCategory.text, /WHERE.*record_type/s);

  const onlyPeriod = buildDisclosuresQuery({ periodLabel: "FY2025" });
  assert.equal(onlyPeriod.params.length, 1);
  assert.doesNotMatch(onlyPeriod.text, /WHERE.*d\.category = /s);
});

test("categories and metricNames together are OR'd, not AND'd", () => {
  const { text, params } = buildDisclosuresQuery({
    categories: ["Growth & Revenue", "Profitability"],
    metricNames: ["cash_runway_months"],
  });

  assert.equal(params.length, 2);
  assert.deepEqual(params[0], ["Growth & Revenue", "Profitability"]);
  assert.deepEqual(params[1], ["cash_runway_months"]);
  assert.match(
    text,
    /\(d\.category = ANY\(\$1\) OR d\.payload->>'metric_name' = ANY\(\$2\)\)/,
  );
});

test("status filter is applied for risk queries", () => {
  const { text, params } = buildDisclosuresQuery({
    recordType: "risk",
    status: "New",
  });

  assert.deepEqual(params, ["risk", "New"]);
  assert.match(text, /d\.status = \$2/);
});

test("custom orderBy is honored (used for risk register ordering)", () => {
  const { text } = buildDisclosuresQuery({
    recordType: "risk",
    orderBy: "d.category ASC, d.materiality_rank ASC NULLS LAST",
  });

  assert.match(
    text,
    /ORDER BY d\.category ASC, d\.materiality_rank ASC NULLS LAST/,
  );
});

test("queryDisclosures executes the built query against the given client", async () => {
  const calls = [];
  const fakeClient = {
    query: async (text, params) => {
      calls.push({ text, params });
      return {
        rows: [
          {
            id: "d1",
            source_document_id: "doc-1",
            source_filename: "hy-2026.pdf",
          },
        ],
      };
    },
  };

  const rows = await queryDisclosures(fakeClient, { recordType: "event" });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, ["event"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_document_id, "doc-1");
  assert.equal(rows[0].source_filename, "hy-2026.pdf");
});
