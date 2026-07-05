# Dashboard Visual Upgrade — Senus PLC Board Report

Two things need to happen together here, in this order: **fix the data first, then make it look good.** A beautiful dashboard showing wrong or empty numbers is worse than an ugly one showing correct numbers — don't let visual work paper over the data problem.

## Part 1: Fix the Data Before Touching Styling

The Management view currently shows "No metrics disclosed for this view" despite claims that metrics were verified working. Before any visual changes:

1. Show me the exact `category` string values currently stored in the `disclosures` table for `record_type = 'metric'`.
2. Show me the exact `metricCategories` array in the view filtering logic for the Management view.
3. These must match character-for-character. Fix whichever one is wrong — do not change both to "make them agree" by guessing; find out which one is the actual source of truth and correct the other.

**Use these real, hand-verified figures as your test/seed data — do not invent placeholder numbers:**

| Metric | FY2025 (audited, standalone) | H1 FY2026 (unaudited, consolidated) |
|---|---|---|
| Revenue | €836,991 | €354,813 |
| Gross profit | €648,450 | €289,952 |
| Gross margin | 77.5% | 81.7% |
| Operating profit/loss | -€633,694 | -€483,753 |
| Cash and equivalents | — | €735,189 |
| Working capital | — | €536,233 |
| EBITDA | — | -€473,739 |

**Every derived ratio (gross margin, operating margin, EBITDA, EBITDA margin, working capital, cash runway, ROCE) must be calculated using the existing `src/metrics/deriveMetrics.js` module — do not recalculate these with your own formulas or hardcode them.** If that module isn't wired into the view yet, wire it in now: raw metrics go into `computeDerivedMetrics()`, the output populates the derived rows. This is a hard requirement, not a style preference — an LLM or a fresh implementation recalculating financial ratios independently is exactly the kind of drift this project has been built to avoid.

Confirm the Management, Board, Investors, and Lenders views all render real, non-empty data before moving to Part 2.

## Part 2: Visual Redesign

Reference inspiration: modern financial/investor-relations dashboards with a bold hero KPI section, trend-driven cards, and real charts — not a flat list of numbers under a heading. Apply the following, using the Senus color scheme already established (`#023424` dark green, `#20887F` teal, `#F2EAD9` cream background):

1. **Hero KPI strip at the top of every view** — 3-4 large, bold headline numbers before anything else. For example, Board view: Revenue, Cash Runway, Net Loss, Progress vs. 50% CAGR target. Each number should be large (32px+), with a small trend indicator next to it (▲ green / ▼ red + percentage) using the `comparative_value` already in the metric payload.

2. **Real charts, not just cards** — add:
   - A revenue trend line/bar chart (FY2025 vs H1 FY2026, using Recharts)
   - An EBITDA-to-FCF waterfall-style chart showing EBITDA → operating cash flow → investing cash flow → net cash change
   Use the `recharts` npm package.

3. **Traceability on every metric** — a small "ⓘ" icon or footnote on each metric card that shows the source document and audited/unaudited status on hover (e.g. "Source: H1 FY2026 Results — Unaudited"). This should read from the `source_document_id` already stored on each disclosure row — don't fabricate this, pull the real linked document.

4. **Styled empty states** — if a view genuinely has no data for a category (as opposed to the bug in Part 1), show a designed empty state with a short explanatory sentence (e.g. "Lenders view only shows disclosed liquidity and solvency data"), not bare gray text.

5. **Materiality-weighted risk register** — the risk register already sorts by materiality; give the first/most-material risk per category slightly more visual weight (larger text or a subtle highlight) than the rest, so the hierarchy that's already in the data is visible, not just present in the sort order.

6. **Keep the risk status pills semantically colored** (red=New, amber=Updated, gray=Unchanged) — don't force these into the green brand palette, since the color is carrying real meaning here, separate from brand identity.

Show me a screenshot of the Board view once both parts are done.
