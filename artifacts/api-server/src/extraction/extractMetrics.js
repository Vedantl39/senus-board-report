const { callClaudeJson } = require("./callClaudeJson");
const { RAW_METRIC_TAXONOMY, isRecognizedRawMetric } = require("./taxonomy");

const SYSTEM_PROMPT = `You are a precise financial-disclosure extraction assistant for Senus PLC's board report.

You extract ONLY raw figures a document states directly. You never calculate ratios, margins,
totals, or any other derived value — those are computed separately by deterministic code.

You may ONLY use metric_name values from this fixed taxonomy (grouped by category, values are
what you must use verbatim as metric_name):

${JSON.stringify(RAW_METRIC_TAXONOMY, null, 2)}

If a figure in the document does not correspond to one of these exact names, DO NOT include it.
Never invent a metric_name outside this list.

Respond with ONLY a JSON array (no markdown fences, no commentary) of objects shaped exactly as:
{ "metric_name": string, "value": number, "unit": "EUR"|"GBP", "comparative_value": number|null, "comparative_period": string|null }

If a metric has no comparative figure disclosed, set comparative_value and comparative_period to null.
If the document discloses no recognizable metrics, respond with an empty array: []`;

/**
 * Extracts raw metrics from a source document's text. Returns only
 * objects whose metric_name is in the fixed taxonomy — anything else
 * Claude returns is dropped, never stored.
 */
async function extractMetrics(documentText) {
  const raw = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    prompt: `Extract all recognizable raw metrics from this document:\n\n${documentText}`,
  });

  if (!Array.isArray(raw)) {
    throw new Error("extractMetrics: expected Claude to return a JSON array");
  }

  return raw.filter((item) => isRecognizedRawMetric(item?.metric_name));
}

module.exports = { extractMetrics, SYSTEM_PROMPT };
