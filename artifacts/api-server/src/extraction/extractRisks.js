const { callClaudeJson } = require("./callClaudeJson");

const SYSTEM_PROMPT = `You are extracting the "principal risks" or "risk factors" section from a board/financial
document for Senus PLC.

Preserve the SOURCE ORDER of risks exactly as they appear in the document within each category —
their position matters and will be used downstream as a materiality ranking. Do not reorder,
deduplicate across categories, or add risks that aren't stated in the document.

Respond with ONLY a JSON array (no markdown fences, no commentary) of objects shaped exactly as:
{ "category": string, "title": string, "summary": string }

If the document has no risk factors section, respond with an empty array: []`;

/**
 * Extracts risk items from a document, preserving source order. Only call
 * this when the document is known to contain a risk factors section —
 * the caller decides that, not this function.
 */
async function extractRisks(documentText) {
  const risks = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    prompt: `Extract the risk factors from this document, preserving their original order:\n\n${documentText}`,
  });

  if (!Array.isArray(risks)) {
    throw new Error("extractRisks: expected Claude to return a JSON array");
  }

  return risks;
}

module.exports = { extractRisks, SYSTEM_PROMPT };
