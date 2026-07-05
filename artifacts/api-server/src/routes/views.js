const { Router } = require("express");
const { pool } = require("../lib/db");
const { queryDisclosures } = require("../lib/disclosuresQuery");
const { AUDIENCE_VIEWS, BOARD_VIEW } = require("../config/audienceViews");

const router = Router();

function simpleAudienceHandler(audience) {
  const filters = AUDIENCE_VIEWS[audience];

  return async (req, res, next) => {
    try {
      const hasRiskCategories =
        Array.isArray(filters.riskCategories) && filters.riskCategories.length > 0;

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

      res.json({ metrics, risks });
    } catch (err) {
      next(err);
    }
  };
}

router.get("/views/management", simpleAudienceHandler("management"));
router.get("/views/investors", simpleAudienceHandler("investors"));
router.get("/views/lenders", simpleAudienceHandler("lenders"));

router.get("/views/board", async (req, res, next) => {
  try {
    const [metrics, risks, events] = await Promise.all([
      queryDisclosures(pool, BOARD_VIEW.metrics),
      queryDisclosures(pool, {
        recordType: "risk",
        orderBy: "d.category ASC, d.materiality_rank ASC NULLS LAST",
      }),
      queryDisclosures(pool, {
        recordType: "event",
        orderBy: "d.extracted_at DESC",
      }),
    ]);

    res.json({ metrics, risks, events });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
