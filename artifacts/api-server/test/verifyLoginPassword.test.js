const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyLoginPassword } = require("../src/lib/verifyLoginPassword");

test("accepts the correct password", () => {
  assert.equal(verifyLoginPassword("correct-horse", "correct-horse"), true);
});

test("rejects an incorrect password of the same length", () => {
  assert.equal(verifyLoginPassword("correct-donkey", "correct-horse!"), false);
});

test("rejects an incorrect password of a different length", () => {
  assert.equal(verifyLoginPassword("short", "a-much-longer-password"), false);
});

test("rejects non-string input instead of throwing", () => {
  assert.equal(verifyLoginPassword(undefined, "secret"), false);
  assert.equal(verifyLoginPassword(null, "secret"), false);
  assert.equal(verifyLoginPassword(42, "secret"), false);
});
