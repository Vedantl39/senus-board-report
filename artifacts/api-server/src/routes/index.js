const { Router } = require("express");
const healthRouter = require("./health");
const authRouter = require("./auth");
const disclosuresRouter = require("./disclosures");
const viewsRouter = require("./views");
const risksRouter = require("./risks");
const commentaryRouter = require("./commentary");
const { requireAuth } = require("../middlewares/requireAuth");

const router = Router();

// Public routes: health checks and login/logout do not require a
// session yet.
router.use(healthRouter);
router.use(authRouter);

// Everything else is gated behind the single shared login.
router.use(requireAuth);
router.use(disclosuresRouter);
router.use(viewsRouter);
router.use(risksRouter);
router.use(commentaryRouter);

module.exports = router;
