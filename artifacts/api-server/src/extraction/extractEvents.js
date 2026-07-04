const { callClaudeJson } = require("./callClaudeJson");

const SYSTEM_PROMPT = `You are extracting notable governance/corporate events from a press release or
company announcement for Senus PLC. Examples: board appointments, admission to trading, contract
wins, regulatory filings, material corporate actions.

Respond with ONLY a JSON array (no markdown fences, no commentary) of objects shaped exactly as:
{ "title": string, "description": string }

If the document announces no distinct events, respond with an empty array: []`;

/**
 * Extracts governance/corporate events from a document. Only call this
 * for press releases / announcements — the caller decides doc_type
 * eligibility, not this function.
 */
async function extractEvents(documentText) {
  const events = await callClaudeJson({
    systemPrompt: SYSTEM_PROMPT,
    prompt: `Extract the notable events announced in this document:\n\n${documentText}`,
  });

  if (!Array.isArray(events)) {
    throw new Error("extractEvents: expected Claude to return a JSON array");
  }

  return events;
}

module.exports = { extractEvents, SYSTEM_PROMPT };
