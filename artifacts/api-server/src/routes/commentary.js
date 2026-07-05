const { Router } = require("express");
const { pool } = require("../lib/db");
const { queryDisclosures } = require("../lib/disclosuresQuery");
const { AUDIENCE_VIEWS, BOARD_VIEW } = require("../config/audienceViews");
const { anthropic } = require("../lib/anthropicClient");
const { logger } = require("../lib/logger");
const { buildCommentaryPrompt } = require("../commentary/buildCommentaryPrompt");
const { validateCommentaryGrounding } = require("../commentary/validateCommentaryGrounding");

const router = Router();
const MODEL = "claude-sonnet-4-6";

// In-memory cache — commentary is a relatively expensive Claude call, and
// the underlying disclosure data only ever changes via the (manual,
// staged) extraction pipeline, not on every page load. A process-lifetime
// cache avoids re-generating on every "Verify" tab click; ?refresh=true
// bypasses it.
const cache = new Map();

async function fetchAudienceData(audience) {
  if (audience === "board") {
    const [metrics, risks, events] = await Promise.all([
      queryDisclosures(pool, BOARD_VIEW.metrics),
      queryDisclosures(pool, {
        recordType: "risk",
        orderBy: "d.category ASC, d.materiality_rank ASC NULLS LAST",
      }),
      queryDisclosures(pool, { recordType: "event", orderBy: "d.extracted_at DESC" }),
    ]);
    return { metrics, risks, events };
  }

  const filters = AUDIENCE_VIEWS[audience];
  if (!filters) return null;

  const hasRiskCategories = Array.isArray(filters.riskCategories) && filters.riskCategories.length > 0;
  const [metrics, risks] = await Promise.all([
    queryDisclosures(pool, filters),
    hasRiskCategories
      ? queryDisclosures(pool, {
          recordType: "risk",
          categories: filters.riskCategories,
          orderBy: "d.category ASC, d.materiality_rank ASC NULLS LAST",
        })
      : Promise.resolve([]),
  ]);
  return { metrics, risks, events: [] };
}

router.get("/commentary/:audience", async (req, res, next) => {
  const { audience } = req.params;
  const forceRefresh = req.query.refresh === "true";

  try {
    if (!forceRefresh && cache.has(audience)) {
      return res.json(cache.get(audience));
    }

    const data = await fetchAudienceData(audience);
    if (!data) {
      return res.status(404).json({ error: `Unknown audience: ${audience}` });
    }

    const { systemPrompt, prompt } = buildCommentaryPrompt({ audience, ...data });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const commentaryText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const validation = validateCommentaryGrounding(commentaryText, data);

    let result;
    if (validation.valid) {
      result = {
        status: "verified",
        commentary: commentaryText,
        generatedAt: new Date().toISOString(),
      };
    } else {
      logger.warn(
        {
          audience,
          failedNumbers: validation.failedNumbers,
          checkedCount: validation.checkedCount,
        },
        "Commentary failed grounding validation — withheld from response",
      );
      result = {
        status: "unverified",
        commentary: null,
        generatedAt: new Date().toISOString(),
        reason:
          "Generated commentary contained figures that could not be traced back to the underlying disclosure data, so it was withheld.",
      };
    }

    cache.set(audience, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
