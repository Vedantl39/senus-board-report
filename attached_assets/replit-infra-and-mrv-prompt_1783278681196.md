# Infrastructure Setup + Measure/Verify Tabs + Bug Fixes

Please work through these in order and confirm each section before moving to the next.

---

## Part 1: Infrastructure (do this first — it hasn't been set up yet)

### 1.1 Database
Confirm whether Postgres is provisioned for this project and `DATABASE_URL` is set. If not, provision it now. Confirm the `source_documents` and `disclosures` tables exist with real extracted data in them (not empty, not manually seeded).

### 1.2 Git / GitHub Connection
Connect this Repl to a GitHub repository — this is a required deliverable for the assignment, not optional. If no repo exists yet, create one (e.g. `senus-board-report`) and connect it via Replit's Git pane. Make a commit now with the current state and confirm the push succeeded by showing me the commit visible on GitHub.

### 1.3 Workflows
Configure the "Run" workflow to start the real application (`node src/index.js` or equivalent — the Express server serving both the API and the built frontend). Restart the Repl using this workflow specifically and confirm the app loads correctly from a cold start, not just in the Agent's own preview pane.

### 1.4 Validation (Test Runner)
Configure the Validation tool to run `npm test` (and the frontend's test suite if it has a separate package.json). Run it now and show me the actual pass/fail output.

Give me a summary once all four are confirmed: what's connected, the current Run command, and the GitHub repo URL.

---

## Part 2: Build the Measure and Verify tabs (currently only "Report" exists)

The top nav shows Measure / Report / Verify, but only Report is active anywhere in the app — Measure and Verify are dead links. This needs to actually reflect the MRV structure the whole product is framed around.

### 2.1 "Verify" tab — AI-generated commentary, using code that already exists
There's already a commentary prompt builder and a grounding validator in the codebase (`src/commentary/buildCommentaryPrompt.js` and `src/commentary/validateCommentaryGrounding.js`) — this has not been wired into the live app yet. Build the Verify tab to:
1. For the current audience view, call `buildCommentaryPrompt()` with the relevant disclosure records for that audience
2. Send that prompt to the Claude API and get a Measure → Report → Verify structured commentary response
3. Run `validateCommentaryGrounding()` on the response before displaying it — if it fails validation (contains a number not traceable to the source data), do not display it; show an honest "commentary could not be verified" state instead and log what failed
4. Display the validated commentary as readable prose, organized under its own Measure/Report/Verify headings

### 2.2 "Measure" tab
This should be a simpler, more literal view than Report — closer to "here is exactly what was measured, from which document, with no interpretation." Consider: a dense, sortable table of every raw metric across all periods with its source document, minimal styling — the "show your work" view underneath the polished Report tab.

---

## Part 3: Fix these specific bugs found in review

1. **Current Share Price still shows "Not available."** The extraction pipeline only processed PDF documents — the two xlsx share price files (`SENUS_Historical_price.xlsx`, `IE000O0F49R3XACD_Performance.xlsx`) were never ingested. Since this is already-structured spreadsheet data, don't send it through an AI extraction call — write a simple deterministic parser that reads the relevant cells directly (latest close price, admission price, YTD %) and inserts them as metric records. Same principle already used for derived metrics: don't use AI where deterministic code is the right tool.

2. **Net Assets/(Liabilities) shows a misleading "▲223.7%."** This metric flips sign between periods (FY2025: -€15,575 net liabilities → H1 FY2026: €561,081 net assets). A percentage change across a sign flip is technically calculable but practically meaningless and misleading, the same category of problem as the earlier revenue period-comparison bug. For any metric where the comparative value and current value have different signs, don't show a percentage change — show both values side by side with clear labels ("Net Liabilities" vs. "Net Assets") instead.

3. **Check the trend arrow color/direction logic for loss-making metrics.** Operating Profit/Loss shows "▼19.3%" in red, but the loss narrowed between periods (an improvement). Confirm whether the arrow logic accounts for metric semantics — for a loss figure, the number becoming less negative is good news and shouldn't automatically render as a red down-arrow just because the raw number decreased in magnitude with a negative sign. Fix so the color/direction reflects whether the change is favorable or unfavorable for that specific metric type, not just numeric increase/decrease.

---

## Part 4: Small aesthetic additions, once the above is done

- Add a small "Data last extracted: [timestamp]" note somewhere unobtrusive, reinforcing this is live extracted data
- Consider a PDF export button for the current view — genuinely useful for a real board report, not just decoration

Please confirm completion of Part 1 before starting Part 2, and Part 2 before Part 3.
