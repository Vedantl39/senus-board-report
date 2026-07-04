const { computeDerivedMetrics } = require("../metrics/deriveMetrics");
const { categoryForMetric } = require("./taxonomy");

/**
 * Fetches the most recently extracted risk disclosures for a given
 * category, so risk status diffing has a "previous" set to compare
 * against. Only the latest extraction per category is used as "previous".
 */
async function fetchPreviousRisksByCategory(client, category) {
  const { rows } = await client.query(
    `SELECT payload->>'title' AS title, payload->>'summary' AS summary
     FROM disclosures
     WHERE record_type = 'risk' AND category = $1
     ORDER BY extracted_at DESC
     LIMIT 50`,
    [category],
  );
  return rows;
}

function toRawMetricsObject(metrics) {
  const rawMetrics = {};
  for (const metric of metrics) {
    rawMetrics[metric.metric_name] = metric.value;
  }
  return rawMetrics;
}

async function insertMetricRow(client, { sourceDocumentId, metadata, metricName, value, comparativeValue, comparativePeriod, derived }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, period_label, consolidation_basis, product_line, status, payload)
     VALUES ($1, 'metric', $2, $3, $4, NULL, NULL, $5)`,
    [
      sourceDocumentId,
      categoryForMetric(metricName),
      metadata.periodLabel ?? null,
      metadata.consolidationBasis ?? null,
      JSON.stringify({
        metric_name: metricName,
        value,
        unit: metadata.unit ?? "EUR",
        comparative_value: comparativeValue ?? null,
        comparative_period: comparativePeriod ?? null,
        derived: Boolean(derived),
      }),
    ],
  );
}

async function insertRiskRow(client, { sourceDocumentId, risk, materialityRank, status }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, materiality_rank, status, payload)
     VALUES ($1, 'risk', $2, $3, $4, $5)`,
    [
      sourceDocumentId,
      risk.category,
      materialityRank,
      status,
      JSON.stringify({ title: risk.title, summary: risk.summary }),
    ],
  );
}

async function insertEventRow(client, { sourceDocumentId, event, periodLabel }) {
  await client.query(
    `INSERT INTO disclosures
      (source_document_id, record_type, category, period_label, payload)
     VALUES ($1, 'event', 'event', $2, $3)`,
    [
      sourceDocumentId,
      periodLabel ?? null,
      JSON.stringify({ title: event.title, description: event.description }),
    ],
  );
}

/**
 * Persists one document's full extraction result — raw metrics, derived
 * metrics (computed via the existing, already-tested computeDerivedMetrics),
 * risks (with materiality_rank + status), and events — all in a single
 * transaction. Callers must not call this with partial/guessed data; on
 * any failure the whole transaction rolls back.
 *
 * `client` must be a checked-out pg client (from pool.connect()), with
 * BEGIN/COMMIT/ROLLBACK managed by the caller (see extract.js) so this
 * function stays easy to unit test with a fake client.
 */
async function persistExtraction(client, { sourceDocumentId, metadata, metrics, risks, riskStatuses, events, periodMonths }) {
  for (const metric of metrics) {
    await insertMetricRow(client, {
      sourceDocumentId,
      metadata,
      metricName: metric.metric_name,
      value: metric.value,
      comparativeValue: metric.comparative_value,
      comparativePeriod: metric.comparative_period,
      derived: false,
    });
  }

  if (metrics.length > 0) {
    const rawMetrics = toRawMetricsObject(metrics);
    const derived = computeDerivedMetrics(rawMetrics, periodMonths);
    for (const [metricName, value] of Object.entries(derived)) {
      // deriveMetrics.js checks `=== null` in a couple of spots against
      // fields that are actually `undefined` when simply absent from a
      // partial extraction, which can yield NaN rather than null. Guard
      // against that here rather than storing a NaN/misleading value.
      if (value === null || value === undefined || Number.isNaN(value)) continue;
      await insertMetricRow(client, {
        sourceDocumentId,
        metadata,
        metricName,
        value,
        derived: true,
      });
    }
  }

  for (let index = 0; index < risks.length; index += 1) {
    await insertRiskRow(client, {
      sourceDocumentId,
      risk: risks[index],
      materialityRank: index,
      status: riskStatuses[index] ?? "New",
    });
  }

  for (const event of events) {
    await insertEventRow(client, {
      sourceDocumentId,
      event,
      periodLabel: metadata.periodLabel,
    });
  }
}

module.exports = {
  persistExtraction,
  fetchPreviousRisksByCategory,
  toRawMetricsObject,
};
