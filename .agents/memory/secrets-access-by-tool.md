---
name: Secrets access differs by tool
description: Which tools can read process.env secrets and which cannot, in this environment.
---

The `bash` tool has access to real environment secret values via `process.env` (e.g. `node -e "console.log(process.env.SOME_SECRET)"` works from bash). The `code_execution` JS sandbox tool does NOT have access to the same secrets.

**Why:** confirmed while trying to curl-test a session-password-gated API from the sandbox — the secret was unreadable there, but the same lookup succeeded immediately from `bash`.

**How to apply:** when a task needs a live secret value to drive a request/test (e.g. logging into a password-gated app to verify a fix), do it from `bash`, not from `code_execution`. Never print the secret value itself to the transcript — pipe it directly into the command that needs it.
