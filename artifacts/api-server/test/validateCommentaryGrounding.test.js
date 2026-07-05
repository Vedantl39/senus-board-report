const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCommentaryGrounding } = require("../src/commentary/validateCommentaryGrounding");

const sourceData = {
  metrics: [
    {
      payload: { metric_name: "revenue", value: 836991, comparative_value: 688317 },
    },
  ],
  risks: [{ payload: { title: "Loamin acquired for 1.1m" } }],
  events: [{ payload: { title: "Fundraise", description: "Raised 500,000 shares" } }],
};

test("passes commentary that only cites disclosed or derivable numbers", () => {
  const text =
    "## Measure\nRevenue was 836991 versus a prior 688317. ## Report\nThat is roughly a 21.6% increase. ## Verify\nAll figures trace to source documents.";
  const result = validateCommentaryGrounding(text, sourceData);
  assert.equal(result.valid, true);
  assert.deepEqual(result.failedNumbers, []);
});

test("passes commentary citing a number embedded in free-text risk/event descriptions", () => {
  const text = "The Loamin acquisition for 1.1m and a fundraise of 500,000 shares were notable.";
  const result = validateCommentaryGrounding(text, sourceData);
  assert.equal(result.valid, true);
});

test("fails commentary that fabricates a number not present anywhere in the source data", () => {
  const text = "Revenue grew to 999999999 this year.";
  const result = validateCommentaryGrounding(text, sourceData);
  assert.equal(result.valid, false);
  assert.ok(result.failedNumbers.length > 0);
});

test("ignores small structural integers like '3' that are not disclosed facts", () => {
  const text = "We reviewed 3 source documents this period.";
  const result = validateCommentaryGrounding(text, sourceData);
  assert.equal(result.valid, true);
});

test("treats percentage tolerance separately from absolute value tolerance", () => {
  const text = "Revenue increased by approximately 21.5%.";
  const result = validateCommentaryGrounding(text, sourceData);
  assert.equal(result.valid, true);
});
