const { Router } = require("express");
const { verifyLoginPassword } = require("../lib/verifyLoginPassword");

const router = Router();

router.post("/login", (req, res) => {
  const expected = process.env.BOARD_REPORT_LOGIN_PASSWORD;

  if (!expected) {
    req.log.error("BOARD_REPORT_LOGIN_PASSWORD is not configured");
    return res.status(500).json({ error: "Login is not configured" });
  }

  const { password } = req.body ?? {};

  if (!verifyLoginPassword(password, expected)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  req.session.authenticated = true;
  res.json({ authenticated: true });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ authenticated: false });
  });
});

router.get("/session", (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.authenticated) });
});

module.exports = router;
