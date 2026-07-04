const test = require("node:test");
const assert = require("node:assert/strict");
const { requireAuth } = require("../src/middlewares/requireAuth");

test("calls next() when the session is authenticated", () => {
  let nextCalled = false;
  const req = { session: { authenticated: true } };
  const res = {};

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("responds 401 when there is no session", () => {
  let statusCode = null;
  let body = null;
  const req = { session: undefined };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
    },
  };

  requireAuth(req, res, () => {
    assert.fail("next() should not be called when unauthenticated");
  });

  assert.equal(statusCode, 401);
  assert.ok(body.error);
});

test("responds 401 when the session exists but is not authenticated", () => {
  let statusCode = null;
  const req = { session: { authenticated: false } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {},
  };

  requireAuth(req, res, () => {
    assert.fail("next() should not be called when unauthenticated");
  });

  assert.equal(statusCode, 401);
});
