const test = require("node:test");
const assert = require("node:assert/strict");
const { AUDIENCE_VIEWS, BOARD_VIEW } = require("../src/config/audienceViews");
const { buildDisclosuresQuery } = require("../src/lib/disclosuresQuery");

test("management view scopes to Growth & Revenue, Profitability, and cash-burn metrics", () => {
  const { categories, metricNames, recordType } = AUDIENCE_VIEWS.management;
  assert.equal(recordType, "metric");
  assert.deepEqual(categories, ["Growth & Revenue", "Profitability"]);
  assert.ok(metricNames.includes("cash_runway_months"));
  assert.ok(metricNames.includes("net_cash_operating_activities"));
});

test("investors view scopes to Returns/Market plus disclosed revenue growth", () => {
  const { categories, metricNames } = AUDIENCE_VIEWS.investors;
  assert.deepEqual(categories, ["Returns/Market"]);
  assert.deepEqual(metricNames, ["revenue"]);
});

test("lenders view scopes to Cash & Liquidity plus balance-sheet solvency", () => {
  const { categories, metricNames } = AUDIENCE_VIEWS.lenders;
  assert.deepEqual(categories, ["Cash & Liquidity", "Solvency/Balance Sheet"]);
  assert.ok(metricNames.includes("net_assets_liabilities"));
});

test("board view's metrics slice scopes to Profitability plus cash position", () => {
  const { categories, metricNames, recordType } = BOARD_VIEW.metrics;
  assert.equal(recordType, "metric");
  assert.deepEqual(categories, ["Profitability"]);
  assert.ok(metricNames.includes("cash_and_equivalents"));
});

test("each audience view compiles into a valid OR'd query", () => {
  for (const [audience, filters] of Object.entries(AUDIENCE_VIEWS)) {
    const { text, params } = buildDisclosuresQuery(filters);
    assert.match(
      text,
      /category = ANY.*OR.*metric_name.*= ANY/s,
      `${audience} view should OR categories with metricNames`,
    );
    assert.equal(params.length, 3, `${audience} view: recordType + categories + metricNames`);
  }
});
