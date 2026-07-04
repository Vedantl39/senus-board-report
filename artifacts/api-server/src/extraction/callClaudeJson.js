const { anthropic } = require("../lib/anthropicClient");
const { logger } = require("../lib/logger");

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

/**
 * Strips common Markdown code-fence wrapping Claude sometimes adds around
 * JSON output, then parses it. Throws if the result still isn't valid JSON.
 */
function parseJsonResponse(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function extractText(message) {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Calls Claude with `prompt`, expecting a JSON response. If the response
 * fails to parse, retries ONCE, feeding the parse error back to the model
 * so it can self-correct. If it fails a second time, throws a
 * ClaudeExtractionError carrying the raw response for logging — callers
 * must not store partial/guessed data on failure.
 */
async function callClaudeJson({ systemPrompt, prompt }) {
  const messages = [{ role: "user", content: prompt }];
  let rawResponse = "";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    rawResponse = extractText(message);

    try {
      return parseJsonResponse(rawResponse);
    } catch (parseError) {
      if (attempt === 2) {
        logger.error(
          { rawResponse, parseError: parseError.message },
          "Claude extraction failed twice — not valid JSON",
        );
        const err = new Error(
          `Claude response was not valid JSON after ${attempt} attempts: ${parseError.message}`,
        );
        err.name = "ClaudeExtractionError";
        err.rawResponse = rawResponse;
        throw err;
      }

      messages.push({ role: "assistant", content: rawResponse });
      messages.push({
        role: "user",
        content: `Your previous response could not be parsed as JSON. Parse error: "${parseError.message}". Respond again with ONLY valid JSON, no markdown formatting, no commentary.`,
      });
    }
  }

  // Unreachable, but keeps control-flow analysis happy.
  throw new Error("callClaudeJson: exhausted retries without returning");
}

module.exports = { callClaudeJson, parseJsonResponse };
