const { callClaudeJson } = require("./callClaudeJson");

const SYSTEM_PROMPT = `You compare a company's previously disclosed risks against its currently
disclosed risks for the SAME risk category, and classify each CURRENT risk semantically.

Companies reword risks between reporting periods without changing their substance — you must
compare MEANING, not exact text. Use these rules:
- "New": no previous risk in this category covers the same underlying issue.
- "Unchanged": a previous risk covers the same issue and the substance has not materially changed,
  even if the wording differs.
- "Updated": a previous risk covers the same issue but the substance, severity, or facts have
  materially changed.

Respond with ONLY a JSON array (no markdown fences, no commentary), one object per CURRENT risk,
in the same order they were given, shaped exactly as:
{ "title": string, "status": "New"|"Updated"|"Unchanged" }`;

/**
 * Classifies each current risk (for one category) against the previously
 * stored risks for that same category. Only call this when prior risks
 * exist for the category — otherwise every current risk is trivially "New"
 * and no Claude call is needed.
 */
async function diffRiskStatus({ previousRisks, currentRisks }) {
  const statuses = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    prompt: JSON.stringify({
      previous_risks: previousRisks.map((r) => ({
        title: r.title,
        summary: r.summary,
      })),
      current_risks: currentRisks.map((r) => ({
        title: r.title,
        summary: r.summary,
      })),
    }),
  });

  if (!Array.isArray(statuses) || statuses.length !== currentRisks.length) {
    throw new Error(
      "diffRiskStatus: expected Claude to return one status per current risk",
    );
  }

  return statuses.map((s) => s.status);
}

module.exports = { diffRiskStatus, SYSTEM_PROMPT };
