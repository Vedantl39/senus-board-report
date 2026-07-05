---
name: Screenshotting apps behind session-password auth
description: How to visually verify a single-shared-password app without ever knowing/typing the real secret password.
---

When an app gates its whole UI behind a session check (e.g. a `/api/session` endpoint the frontend calls to decide login-page vs. main-app), you can't screenshot real views without the password — and you must never read/type secret env vars.

**How to apply:** temporarily bypass in three places, screenshot, then revert all three before finishing:
1. The auth gate middleware on protected routes (comment out, don't delete).
2. The `/session`-style endpoint the frontend polls (return `authenticated: true` unconditionally).
3. If the view/tab to inspect isn't reachable by URL param (SPA with only in-memory `useState`), temporarily change the `useState` default to the target tab/view.

Mark every temp edit with a `// TEMP-AUTH-BYPASS-FOR-SCREENSHOT` comment so a final `grep` across the touched packages can confirm zero bypass markers remain before wrapping up. Re-run the test suite and restart the workflow after reverting to confirm the real login screen reappears.
