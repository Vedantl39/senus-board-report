---
name: deriveMetrics NaN vs null on partial input
description: Why derived-metric consumers must filter NaN, not just null/undefined, before persisting
---

A locked, verbatim-from-spec derived-metrics module can return `NaN` instead of `null` for some
formulas when raw inputs are only partially available (it checks `=== null`, but a missing key is
actually `undefined`).

**Why:** the module can't be modified without re-validating its existing test contract, so the
fix belongs at the call site.

**How to apply:** any caller persisting derived-metric output must skip a value when it is `null`,
`undefined`, **or `Number.isNaN(value)`** — otherwise NaN silently JSON-serializes to `null` and
gets stored as a real "not disclosed" result instead of being omitted.
