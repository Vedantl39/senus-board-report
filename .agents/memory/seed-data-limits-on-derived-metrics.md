---
name: Seed/real data limits on derived metrics
description: When hand-seeding real financial figures, only back-solve a derived metric if every raw input was actually disclosed — otherwise show "Not available" rather than fabricating inputs.
---

When seeding real (not synthetic) financial disclosures, always compute derived ratios through the project's real `computeDerivedMetrics()` — never reimplement the formula inline in the seed script, even for a "quick" one-off value.

It's acceptable to back-solve a single missing raw input from a disclosed derived figure (e.g. deriving `depreciation_amortization` from a disclosed EBITDA + operating profit) because that's just algebra on real disclosed numbers.

It is NOT acceptable to fabricate undisclosed balance-sheet/cash-flow line items (e.g. debtors, creditors, capital employed) just to populate a derived metric like `working_capital`, `cash_runway_months`, or `roce`. When the raw inputs genuinely weren't part of the source figures, skip the derived metric and let the UI render "Not available" — document the skip in the seed script's header comments so future reseeds don't silently reintroduce fabricated data.

**Why:** the user explicitly wants disclosures traceable to real source documents; inventing plausible-looking numbers to fill a UI gap breaks that trust even if it "looks fine" in a demo.

**How to apply:** whenever a seed/fixture script needs a derived metric that real code computes from multiple raw inputs, check which raw inputs are actually available before deciding to compute, back-solve, or omit.
