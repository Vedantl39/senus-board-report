const { Router } = require("express");
const { pool } = require("../lib/db");
const { queryDisclosures } = require("../lib/disclosuresQuery");

const router = Router();

router.get("/risks", async (req, res, next) => {
  try {
    const { status } = req.query;

    const rows = await queryDisclosures(pool, {
      recordType: "risk",
      status,
      orderBy: "d.category ASC, d.materiality_rank ASC NULLS LAST",
    });

    res.json({ risks: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
