const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isRecognizedRawMetric,
  RAW_METRIC_TAXONOMY,
  DERIVED_METRIC_NAMES,
} = require("../src/extraction/taxonomy");

test("recognizes a metric name that is in the taxonomy", () => {
  assert.equal(isRecognizedRawMetric("revenue"), true);
  assert.equal(isRecognizedRawMetric("cash_and_equivalents"), true);
});

test("rejects a metric name that is not in the taxonomy", () => {
  assert.equal(isRecognizedRawMetric("made_up_metric"), false);
  assert.equal(isRecognizedRawMetric(""), false);
  assert.equal(isRecognizedRawMetric(undefined), false);
});

test("derived metric names are never accepted as raw metric names", () => {
  for (const derivedName of DERIVED_METRIC_NAMES) {
    assert.equal(
      isRecognizedRawMetric(derivedName),
      false,
      `${derivedName} is derived and must not be in the raw taxonomy`,
    );
  }
});

test("every taxonomy category has at least one metric", () => {
  for (const [category, metrics] of Object.entries(RAW_METRIC_TAXONOMY)) {
    assert.ok(metrics.length > 0, `${category} has no metrics`);
  }
});
