---
name: Audience-view category/metricName OR-query test coupling
description: A generic disclosuresQuery test asserts every AUDIENCE_VIEWS entry compiles to a "categories OR metricNames" SQL pattern — keep metricNames non-empty even when categories alone would suffice.
---

`buildDisclosuresQuery`/`queryDisclosures` builds `category = ANY(...) OR metric_name = ANY(...)` when both `categories` and `metricNames` are present on a filter object. A repo-wide test (`audienceViews.test.js`) asserts this OR pattern compiles for *every* entry in `AUDIENCE_VIEWS`.

**Why:** if you widen an audience's `categories` array (e.g. adding a new category) and think you can drop `metricNames` to `[]` since categories now cover the metric, the generic OR-pattern test breaks — it isn't audience-specific, it checks the whole config.

**How to apply:** when adding a category to satisfy a metric, keep a matching (even redundant) entry in `metricNames` too, or update the generic test's assertion strategy at the same time. Redundant category+metricName overlap is harmless (just an OR'd duplicate), so prefer the redundant-but-consistent fix over changing test semantics.
