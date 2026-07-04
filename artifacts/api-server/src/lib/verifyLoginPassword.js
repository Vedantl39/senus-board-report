const crypto = require("node:crypto");

/**
 * Constant-time comparison against the shared login password so
 * response timing doesn't leak how many characters matched.
 */
function verifyLoginPassword(candidate, expected) {
  if (typeof candidate !== "string" || typeof expected !== "string") {
    return false;
  }

  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(expected);

  if (candidateBuf.length !== expectedBuf.length) {
    // Still run a comparison of equal-length buffers so the elapsed
    // time doesn't depend on the length mismatch either.
    crypto.timingSafeEqual(candidateBuf, candidateBuf);
    return false;
  }

  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

module.exports = { verifyLoginPassword };
