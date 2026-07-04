/**
 * Single-login gate. There is no per-user/role concept in this app —
 * this middleware only checks whether the shared session is
 * authenticated at all, per the spec's "single login, no RBAC"
 * requirement.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

module.exports = { requireAuth };
