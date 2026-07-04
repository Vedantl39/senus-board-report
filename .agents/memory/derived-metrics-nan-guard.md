---
name: deriveMetrics NaN vs null on partial input
description: Why derived-metric consumers must filter NaN, not just null/undefined, before persisting
---

`deriveMetrics.js`'s `workingCapital`, `cashRunwayMonths`, and `roce` guard missing inputs with
`=== null` checks, but a genuinely absent raw metric key is `undefined`, not `null`. That check
silently fails to short-circuit, so the arithmetic proceeds with `undefined` operands and produces
`NaN` instead of `null` for those specific formulas when the underlying raw metrics are only
partially available.

**Why:** `deriveMetrics.js` is locked/verbatim from the user's spec (do not modify without
re-checking `deriveMetrics.test.js`), so this can't be fixed at the source without risking the
existing test contract.

**How to apply:** any caller that persists `computeDerivedMetrics()` output must skip a metric
when its value is `null`, `undefined`, **or `Number.isNaN(value)`** — not just the first two —
otherwise a NaN gets silently JSON-serialized into `null` and stored as if it were a real "not
disclosed" result rather than being omitted entirely.
