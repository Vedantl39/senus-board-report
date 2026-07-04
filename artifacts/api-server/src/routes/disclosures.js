const { Router } = require("express");
const { pool } = require("../lib/db");
const { queryDisclosures } = require("../lib/disclosuresQuery");

const router = Router();

router.get("/disclosures", async (req, res, next) => {
  try {
    const { record_type: recordType, category, period_label: periodLabel } =
      req.query;

    const rows = await queryDisclosures(pool, {
      recordType,
      category,
      periodLabel,
    });

    res.json({ disclosures: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
