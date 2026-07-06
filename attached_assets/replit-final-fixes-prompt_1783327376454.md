# Final Fixes: Deployment, GitHub, and Remaining Data Gaps

Please work through these in order and confirm each before moving to the next.

## 1. Publish the app for real
The app is currently only running as a temporary development preview (`*.riker.replit.dev`), tied to this editing session. Click Publish (or the equivalent Deployments action) to create a real, stable, permanently-accessible URL. Confirm the published URL works by loading it fresh (not from this session's cache) and confirm all four audience views and the Measure/Report/Verify tabs work on that published URL specifically, not just the dev preview.

## 2. Confirm GitHub status — explicitly, don't assume
I need a direct answer: is this project actually connected to a GitHub repository right now, with the current code pushed? If yes, give me the repo URL and confirm the latest commit reflects the current state (Measure/Verify tabs, real extraction, etc.) — not an earlier version. If no, set this up now: create the repo, connect it via Replit's Git pane, and push everything. This is a required deliverable for the assignment, not optional.

## 3. Ingest the share price xlsx files (Current Share Price still shows "Not available")
The AI extraction pipeline only processed PDF documents. `SENUS_Historical_price.xlsx` and `IE000O0F49R3XACD_Performance.xlsx` were never ingested. This is already-structured spreadsheet data — write a simple deterministic parser (not an AI extraction call) that reads:
- Latest closing share price (most recent date in the historical price file)
- Admission price (already correctly extracted elsewhere — confirm this parser produces the same value as a sanity check)
- YTD percentage change (from the performance file)

Insert these as metric records in the Returns/Market category. Confirm the Investors view's "Current Share Price" card now shows a real value.

## 4. Fix the customer count unit bug
In the Measure tab, "Enterprise Customer Count," "Independent Customer Count," and "Rd Customer Count" all show **Unit: EUR**. These are counts, not currency. Find where the extraction prompt or schema defaults every metric's unit to EUR regardless of type, and fix it so count-type metrics show no unit (or "count") instead of EUR.

## 5. Add the missing international sales percentage metric
Senus's own corporate presentation states an explicit, disclosed strategic KPI: international sales were 22% of FY2025 revenue, and growing this percentage is a named part of their 2030 growth strategy. This isn't currently in the raw metric taxonomy anywhere. Add it as a metric record (e.g. `international_sales_percentage`, value 0.22, period FY2025, source: corporate presentation) and surface it in the Growth & Revenue section, since it's a real disclosed figure Senus itself tracks as a growth indicator.

## 6. One thing to check, not necessarily fix: the cash runway caveat
The Verify tab's commentary states the cash runway figure is "presented without a disclosed closing cash balance in the data provided." But Cash And Equivalents is already a metric in the same Cash & Liquidity category shown in the Measure tab. Please check: is the actual cash balance genuinely being excluded from the data passed into the commentary prompt for this specific request, or is this caveat inaccurate? Tell me which one it is — if it's a data-plumbing gap (the right data exists but isn't being included in what's sent to the AI), fix it so the commentary can reference the real cash figure directly instead of caveating around it.

Please confirm each numbered item before moving to the next, and give me a final summary: published URL, GitHub repo URL, and confirmation that items 3-6 are resolved.
