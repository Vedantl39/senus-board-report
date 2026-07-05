const { callClaudeJson } = require("./callClaudeJson");
const { RISK_CATEGORIES } = require("./taxonomy");

const SYSTEM_PROMPT = `You are extracting the "principal risks" or "risk factors" section from a board/financial
document for Senus PLC.

Preserve the SOURCE ORDER of risks exactly as they appear in the document within each category —
their position matters and will be used downstream as a materiality ranking. Do not reorder,
deduplicate across categories, or add risks that aren't stated in the document.

The document's own section headers (e.g. "CUSTOMER", "PRODUCT", "ORGANISATION") are NOT the
category values to output. You MUST map every risk into exactly one of this fixed set of
categories, choosing whichever fits best by meaning:

${JSON.stringify(RISK_CATEGORIES)}

For example: risks about technology, IP, cyber security, or data map to "Technology and IP";
risks about key personnel, staffing, or third-party service providers map to
"People and Operations"; risks about jurisdictions, international law, or regulation map to
"International and Regulatory"; risks about profitability, capital, dividends, or the shares
themselves map to "Financial and Shares"; risks about market competition or industry dynamics
map to "Market and Competition"; overarching strategy/reputation/M&A risks map to "Corporate".
Never output a category string outside this fixed list.

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

  const validCategories = new Set(RISK_CATEGORIES);
  const invalid = risks.filter((r) => !validCategories.has(r?.category));
  if (invalid.length > 0) {
    throw new Error(
      `extractRisks: Claude returned ${invalid.length} risk(s) with a category outside the fixed taxonomy: ${JSON.stringify(invalid.map((r) => r.category))}`,
    );
  }

  return risks;
}

module.exports = { extractRisks, SYSTEM_PROMPT };
