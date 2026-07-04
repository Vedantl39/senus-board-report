const test = require("node:test");
const assert = require("node:assert/strict");
const { inferPeriodMonths } = require("../src/extraction/periodMonths");

test("infers 6 months for half-year labels", () => {
  assert.equal(inferPeriodMonths("H1 FY2026"), 6);
  assert.equal(inferPeriodMonths("H2 FY2025"), 6);
  assert.equal(inferPeriodMonths("Half-Year 2026"), 6);
});

test("infers 12 months for full-year labels", () => {
  assert.equal(inferPeriodMonths("FY2025"), 12);
  assert.equal(inferPeriodMonths("Full Year 2025"), 12);
  assert.equal(inferPeriodMonths("Annual Report 2025"), 12);
});

test("returns null for unrecognized or missing labels rather than guessing", () => {
  assert.equal(inferPeriodMonths(""), null);
  assert.equal(inferPeriodMonths(null), null);
  assert.equal(inferPeriodMonths("Q3 2025"), null);
});
