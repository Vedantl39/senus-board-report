# Collapse Long Sections + Fix Investors Hero Card Data

Real extraction brought in much more data than the hand-seeded version (35 risks, 18 events, full balance sheet line items) — which is great, but every page is now extremely long because everything renders flat with no hierarchy. Please add collapsing in three places:

## 1. Risk Register — show only the most material by default
For each category, show only the top 1-2 most-material risks by default (the ones already tagged "MOST MATERIAL"), with a "Show all in [category] (N more)" toggle to expand the rest. Right now all ~35 risks render flat, which buries the materiality signal that's already in the data (materiality_rank) under a wall of equally-styled cards.

## 2. Governance Events — show recent history only by default
Show the 4-5 most recent events by default, with a "Show full history (N more)" toggle for the rest. 18 events flat-listed reads as a full company timeline, not a "what's changed lately" glance — most users want the latter first.

## 3. Detailed metric tables — collapse by category
Growth & Revenue, Profitability, Cash & Liquidity, and Balance Sheet tables should each be a collapsible section (accordion), closed by default or with only the first open. The hero KPI cards at the top of each view already give the headline numbers — these detailed tables are for someone actively drilling in, not the first thing to read.

Keep all the data — nothing here is about removing information, only about not showing everything at once. Use a simple expand/collapse pattern (chevron icon, "Show N more" text) consistent with what's already used elsewhere in the app.

## 4. Separately — check the Investors view's hero cards

Admission Price and Current Share Price both show "Not available" in the hero KPI row, but there appears to be relevant data further down the page in a detail table. Please check: does a metric record with the correct `metric_name` (e.g. `admission_price`, `share_price_close`) actually exist and match what the Investors hero card is querying for? This looks like the same category/metric-name mismatch pattern from earlier in this project — confirm whether it's a naming mismatch, not a data gap, before doing anything else to it.

Show me updated screenshots of the Board view (to confirm the risk register and events sections now collapse sensibly) and the Investors hero row (to confirm the admission price / share price cards are either fixed or you've identified exactly why they're not).
