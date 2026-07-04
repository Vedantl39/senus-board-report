---
name: Audience view category matching is exact-string, display-form
description: Why seeded/test disclosure rows silently return empty audience views if category strings don't match the taxonomy verbatim.
---

`audienceViews.js` filters disclosures by exact `category` string equality (e.g. `"Growth & Revenue"`, `"Cash & Liquidity"`), not a normalized/slugified form. These are the human-readable taxonomy category labels, not snake_case identifiers.

**Why:** the schema-on-read design stores `category` as free-text in the JSONB/column, so there's no FK or enum to catch a mismatch — a wrong category (e.g. `"growth_revenue"` instead of `"Growth & Revenue"`) fails silently, returning an empty view instead of an error.

**How to apply:** when seeding or hand-writing disclosure rows for testing, copy category strings verbatim from `artifacts/api-server/src/config/audienceViews.js` / `taxonomy.js` rather than guessing a slug form. If an audience view unexpectedly renders "No metrics disclosed," check category string equality first.
