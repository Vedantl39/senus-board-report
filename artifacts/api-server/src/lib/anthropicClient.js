const Anthropic = require("@anthropic-ai/sdk");

const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!baseURL || !apiKey) {
  throw new Error(
    "AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set. " +
      "This project uses Replit's AI Integrations proxy for Anthropic access — no user-supplied API key is required.",
  );
}

const anthropic = new Anthropic({ baseURL, apiKey });

module.exports = { anthropic };
