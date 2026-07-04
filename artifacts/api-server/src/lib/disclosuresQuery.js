/**
 * Query builder for the `disclosures` table, shared by the generic
 * /api/disclosures endpoint, the /api/views/* audience endpoints, and
 * /api/risks. Every row is left-joined against `source_documents` so
 * callers always get traceability (filename, doc type, audited flag)
 * alongside the disclosure fact itself, per the spec's requirement that
 * every returned fact carries its source document.
 */

function buildDisclosuresQuery(filters = {}) {
  const {
    recordType,
    category,
    categories,
    periodLabel,
    metricNames,
    status,
    orderBy = "d.extracted_at DESC",
  } = filters;

  const conditions = [];
  const params = [];

  if (recordType) {
    params.push(recordType);
    conditions.push(`d.record_type = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`d.category = $${params.length}`);
  }

  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const hasMetricNames = Array.isArray(metricNames) && metricNames.length > 0;

  if (hasCategories && hasMetricNames) {
    params.push(categories);
    const categoriesIdx = params.length;
    params.push(metricNames);
    const metricNamesIdx = params.length;
    conditions.push(
      `(d.category = ANY($${categoriesIdx}) OR d.payload->>'metric_name' = ANY($${metricNamesIdx}))`,
    );
  } else if (hasCategories) {
    params.push(categories);
    conditions.push(`d.category = ANY($${params.length})`);
  } else if (hasMetricNames) {
    params.push(metricNames);
    conditions.push(`d.payload->>'metric_name' = ANY($${params.length})`);
  }

  if (periodLabel) {
    params.push(periodLabel);
    conditions.push(`d.period_label = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`d.status = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const text = `
    SELECT
      d.id,
      d.source_document_id,
      d.record_type,
      d.category,
      d.period_label,
      d.consolidation_basis,
      d.product_line,
      d.materiality_rank,
      d.status,
      d.payload,
      d.extracted_at,
      sd.filename AS source_filename,
      sd.doc_type AS source_doc_type,
      sd.audited AS source_audited,
      sd.period_covered AS source_period_covered
    FROM disclosures d
    LEFT JOIN source_documents sd ON sd.id = d.source_document_id
    ${whereClause}
    ORDER BY ${orderBy}
  `;

  return { text, params };
}

async function queryDisclosures(client, filters = {}) {
  const { text, params } = buildDisclosuresQuery(filters);
  const { rows } = await client.query(text, params);
  return rows;
}

module.exports = { buildDisclosuresQuery, queryDisclosures };
