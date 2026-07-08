# Senus PLC Board Report — One-Page Summary

**An AI-native board reporting platform serving four audiences — Management, Board, Equity Investors, and Credit Providers — from one underlying data model, built for the Assiduous Technology Graduate Assessment.**

## What it does
Senus PLC's financial and corporate disclosures (17 source documents — annual accounts, half-year results, listing documents, press releases) are extracted by Claude into a structured database, then presented through audience-specific views built around Senus's own "Measure → Report → Verify" framing: raw data (Measure), a polished dashboard (Report), and AI-generated commentary that's mechanically checked against the source data before display (Verify).

## Architecture
Two tables — `source_documents` and `disclosures` — power everything. Every extracted fact (a metric, a risk, a corporate event) is one row, distinguished by a `record_type` column, with a flexible JSON payload for what's type-specific. This is deliberately thin scaffolding: new KPIs or risk categories Senus discloses in future reports need no schema migration. Every audience view is a config entry (which categories, which risk types, whether to include events) filtering the same data — not a separate table or duplicated logic per audience.

**Stack:** Plain Node.js/JavaScript (no build step), React, PostgreSQL, Claude API for extraction and commentary, Node's built-in test runner. Every choice here was deliberate — see the Philosophy Log for the reasoning behind each.

## AI extraction, and how its output is trusted
One Claude call per record type (metric / risk / event), plus a fourth call that judges whether a reworded risk disclosure means the same thing as a prior one — a genuinely interpretive task, kept with the AI. Arithmetic (gross margin, EBITDA, ROCE) is calculated by deterministic code, never by asking an LLM to do division. AI-generated commentary is validated after generation: every number mentioned is extracted and checked against the actual source data, and a deliberately fabricated test case proves this catches invented figures, not just claims to.

## Validation approach
Key figures were hand-verified from the source PDFs before any extraction code was written (a golden test set), and the pipeline's real output — from real Claude API calls against real documents — was checked against it: 20/20 financial figures matched exactly, and two genuine bugs (a percentage/ratio unit conversion, a risk-category mapping mismatch) were found and fixed in the process. A live deployed-dashboard bug was also caught this way: a KPI card showing "▼57.6% decline" by comparing 6 months of revenue against a full 12-month prior year — the correct H1-vs-H1 comparison shows +4.1% growth. That bug, and the fix, are documented rather than hidden.

## Honest assumptions and limitations
Month-over-month figures aren't available (Senus reports annually/semi-annually only). FY2025 was corrected mid-project from a mislabeled "standalone" basis to its accurate "consolidated, pre-Loamin" basis, once real extraction re-read the source document closely. A chat-with-documents (RAG) feature was deliberately scoped out as a stretch goal, not core to a board report. All of this is stated explicitly rather than smoothed over — consistent with Assiduous's own guidance that explicit assumptions are preferred over silently guessing.

## What makes this different
Every major decision — schema design, the AI/code boundary, the single-login scope call, data quality handling — is logged with its reasoning in `philosophy-log.md` (36+ entries), including the mistakes caught and corrected along the way. This wasn't written retroactively for the submission; it was built as the project went, which is why it includes real bugs, not just polished decisions.

**Live app:** [published URL] · **GitHub:** [repo URL] · **Demo:** [YouTube link]
