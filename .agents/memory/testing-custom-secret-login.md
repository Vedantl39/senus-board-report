---
name: Playwright testing sandbox cannot access custom app secrets
description: runTest()'s Playwright runtime has no access to arbitrary workspace secrets (e.g. a custom shared-password login secret) — plan verification accordingly.
---

`runTest()`'s Playwright execution environment does not expose `process.env` or any injected variable for custom, app-specific secrets (e.g. a shared single-login password stored as a Replit secret like `BOARD_REPORT_LOGIN_PASSWORD`). Attempts to reference the secret by name in the test plan return `undefined` in that sandbox, even though the same secret works fine via `bash`/`curl` or inside the app's own workflow.

**Why:** The testing skill's built-in secret bridging only covers specific supported auth providers (Clerk via `testClerkAuth: true`, Replit Auth via its documented bypass). Arbitrary custom secrets used for non-provider auth (e.g. a single shared password gate) are not threaded into the Playwright sandbox.

**How to apply:** For apps with custom secret-gated login (not Clerk/Replit Auth), don't rely on `runTest()` to drive the login form directly with the real secret. Instead:
- Verify the authenticated behavior at the API layer directly (`bash`/`curl`, using the env var inline without echoing it) — this can fully validate login + every downstream authenticated endpoint.
- If UI-level Playwright coverage is required, consider a test-only bypass (e.g. a `NODE_ENV=test`-gated route) rather than repeatedly retrying `runTest()` with secret name variants, since the sandbox limitation won't resolve on retry.
