const { pool } = require("../lib/db");
const { logger } = require("../lib/logger");
const { extractMetrics } = require("./extractMetrics");
const { extractRisks } = require("./extractRisks");
const { extractEvents } = require("./extractEvents");
const { diffRiskStatus } = require("./diffRiskStatus");
const { inferPeriodMonths } = require("./periodMonths");
const {
  persistExtraction,
  fetchPreviousRisksByCategory,
} = require("./persistExtraction");

const PRESS_RELEASE_DOC_TYPES = new Set(["press_release", "announcement"]);

function groupRisksByCategory(risks) {
  const groups = new Map();
  risks.forEach((risk, index) => {
    const list = groups.get(risk.category) ?? [];
    list.push({ risk, index });
    groups.set(risk.category, list);
  });
  return groups;
}

/**
 * Runs risk status diffing per category. Returns an array of statuses
 * parallel to `risks` (same order/length). Categories with no prior
 * risks stored are trivially "New" for every current risk — Claude is
 * only called for categories where a previous set exists, per spec.
 */
async function resolveRiskStatuses(client, risks) {
  const statuses = new Array(risks.length).fill("New");
  const groups = groupRisksByCategory(risks);

  for (const [category, entries] of groups) {
    const previousRisks = await fetchPreviousRisksByCategory(client, category);
    if (previousRisks.length === 0) continue;

    const currentRisks = entries.map((e) => e.risk);
    const categoryStatuses = await diffRiskStatus({
      previousRisks,
      currentRisks,
    });

    entries.forEach((entry, i) => {
      statuses[entry.index] = categoryStatuses[i];
    });
  }

  return statuses;
}

/**
 * Runs the full extraction pipeline for one document and persists the
 * results transactionally. Throws (without persisting anything) if any
 * step fails — see callClaudeJson for the retry-once-then-fail behavior
 * on malformed Claude responses.
 *
 * @param {object} params
 * @param {string} params.documentText - full text of the source document
 * @param {string} params.sourceDocumentId - UUID of the source_documents row
 * @param {object} params.metadata - passed in programmatically, never inferred by the LLM
 * @param {string} params.metadata.docType
 * @param {string} [params.metadata.periodLabel]
 * @param {string} [params.metadata.consolidationBasis]
 * @param {boolean} [params.metadata.audited]
 * @param {boolean} [params.hasRiskSection] - whether the document has a risk factors section
 */
async function extractDocument({ documentText, sourceDocumentId, metadata, hasRiskSection = false }) {
  const metrics = await extractMetrics(documentText);

  const risks = hasRiskSection ? await extractRisks(documentText) : [];

  const isPressRelease = PRESS_RELEASE_DOC_TYPES.has(metadata.docType);
  const events = isPressRelease ? await extractEvents(documentText) : [];

  const periodMonths = inferPeriodMonths(metadata.periodLabel);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const riskStatuses = await resolveRiskStatuses(client, risks);

    await persistExtraction(client, {
      sourceDocumentId,
      metadata: {
        periodLabel: metadata.periodLabel,
        consolidationBasis: metadata.consolidationBasis,
      },
      metrics,
      risks,
      riskStatuses,
      events,
      periodMonths,
    });

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      { sourceDocumentId, error: error.message },
      "Extraction failed — transaction rolled back, no partial data stored",
    );
    throw error;
  } finally {
    client.release();
  }

  return { metrics, risks, events };
}

module.exports = { extractDocument, resolveRiskStatuses };
