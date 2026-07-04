---
name: Express sessions behind Replit's proxy
description: secure express-session cookies require trust proxy when the app sits behind Replit's shared reverse proxy
---

Any Express app using `express-session` with `cookie.secure: true` (or
conditioned on `NODE_ENV === "production"`) needs
`app.set("trust proxy", 1)` set before the session middleware.

**Why:** Replit's shared reverse proxy terminates TLS and forwards requests
to the app over plain HTTP with `X-Forwarded-Proto: https`. Without `trust
proxy`, Express doesn't trust that header, so `req.secure` is always false
and a `secure` cookie is silently never sent to the browser — login appears
to succeed (200 response) but the session cookie never sticks, so every
subsequent request looks unauthenticated.

**How to apply:** whenever adding session-based (or any cookie-based)
auth to a Replit web app that will run in production behind the shared
proxy, set `app.set("trust proxy", 1)` on the Express instance up front.
