# Data Understanding & Inventory — Senus PLC Board Report

## 1. Source Document Catalogue

| Document | Type | Period / Date | Audited? | In scope? |
|---|---|---|---|---|
| `Senus_PLC_Information_Document_December_2025.pdf` | Listing document (company overview, risk factors, KPIs, board, financial summary) | As at Dec 2025 | Mixed (summarises audited FY25 figures) | ✅ Primary source |
| `ADF_Farm_Solutions_Consolidated_Financial_Statements_30_June_2025.pdf` | Full statutory annual accounts (consolidated, pre-Loamin) | FY ended 30 Jun 2025 (+ FY24 comparative) | ✅ Audited | ✅ Primary source |
| `Senus_HalfYearResultsDec2025_PR_V19032026_FINAL_clean.pdf` | Interim results announcement (P&L, balance sheet, cash flow) | 6 months to 31 Dec 2025 (+ Dec 2024 comparative) | ❌ Unaudited (explicitly marked) | ✅ Primary source |
| `SENUS_Historical_price.xlsx` | Daily share price series (OHLC, volume) | Since Admission (22 Dec 2025) | n/a | ✅ In scope (Equity Investor view) |
| `IE000O0F49R3XACD_Performance.xlsx` | Share performance summary (YTD, 52-week, etc.) | Snapshot | n/a | ✅ In scope (Equity Investor view) |
| `Senus_PLC_Direct_Listing_Launch_Press_Release.pdf` | Listing announcement | 22 Dec 2025 | n/a | ✅ In scope — source of admission price (€5.126) baseline |
| `Senus_PR_LeadershipTransition_V24062026.pdf` | Leadership change announcement | 24 Jun 2026 | n/a | ✅ In scope — most recent disclosure; also a live "key personnel" risk event |
| `Senus_short_corporate_presentation_19032026.pdf` | Investor deck | Mar 2026 | n/a | ✅ In scope — supplementary strategy/market narrative, not raw financials |
| `Senus_Limited_Company_Balance_Sheet_as_at_8_December_2025.pdf` | Statutory balance sheet snapshot for PLC reregistration | 8 Dec 2025 | Unclear | 🟡 In scope, minor — one-off transition-date snapshot |
| `Senus_PLC_Memo_and_Arts.pdf` | Memorandum & Articles of Association | n/a | n/a | ❌ Out of scope — legal constitution, no financial content |
| `Senus_Form_Proxy_for_Annual_General_Meeting_2026.pdf` | Proxy voting form | AGM 8 Jul 2026 | n/a | ❌ Out of scope — procedural |
| `Senus_Circular_Notice_of_Annual_General_Meeting_2026.pdf` | Full AGM notice (resolutions: director re-election, auditor continuation, share issuance authority) | AGM 8 Jul 2026 | n/a | 🟡 Light-touch only — governance context for Board view, not extracted as metrics |
| `Senus_PR_Notice_of_AGM_2026.pdf` | AGM announcement pointer | n/a | n/a | ❌ Out of scope — duplicate-in-spirit of the Circular above |
| `Senus_Notification_of_Results_HY_Dec_2025.pdf` | Results notification/pointer | n/a | n/a | ❌ Out of scope — redundant with the HY Results PR itself |
| `SENUS_quote_chart.pdf` | Visual share price chart | n/a | n/a | ❌ Out of scope — visual rendering of the same data already in the xlsx files |
| `Assiduous_TechGradAssignment.pdf` | The assignment brief | n/a | n/a | ❌ Not a data source — this is the instructions, not Senus data |

## 2. Data Quality Issues (Explicit)

These are stated here so they can be handled deliberately in the extraction pipeline, rather than discovered as bugs later.

1. **Legal entity name change mid-history.** ADF Farm Solutions Limited → Senus Limited (10 Dec 2025) → Senus PLC. Documents from different dates refer to the same legal entity by different names — extraction must resolve these as one company, not three.
2. **Consolidation scope changed between periods, but both were consolidated — this was initially mischaracterized.** FY2025 annual accounts are titled "Annual Report and Consolidated Financial Statements" in the source document itself (Section 3) — they already consolidate the UK subsidiary (incorporated 2023). An earlier pass through this project incorrectly labeled FY2025 as "standalone." The real distinction: FY2025 is consolidated *without* Loamin; H1 FY2026 is consolidated *with* Loamin (acquired November 2025, contributing goodwill of €669,500 and contingent consideration of €850,000). This will be labeled precisely (consolidation scope/entities included), not as a simple standalone-vs-consolidated binary.
3. **Audited vs. unaudited.** FY2025 annual accounts are audited; H1 FY2026 results are explicitly marked "Unaudited" in the source document itself. This distinction will be visually flagged wherever H1 FY26 figures appear.
4. **Non-organic balance sheet movements.** The jump in called-up share capital between comparatives (€144 → €25,000) reflects the PLC reregistration/share restructuring, not organic business performance — this needs a note rather than appearing as an unexplained swing.
5. **Missing OHLC values in share price data.** Some trading days have only a closing print; Open/High/Low are blank. Extraction must handle this as a valid state, not a missing-data error.
6. **Near-zero trading volume.** Consistent with Euronext Access being a thin, SME-focused market — the share price is effectively static. This is a real market characteristic, not a data fault, and should be presented as such (e.g. "illiquid, low trading activity" rather than a broken-looking flat chart).
7. **Multi-currency exposure.** The UK subsidiary reports in GBP and is translated to EUR for consolidation — a minor FX consideration noted for completeness, not expected to materially affect headline figures.
8. **A temporal gap between latest financials and latest known event.** The most recent hard financial figures are for H1 FY2026 (to 31 Dec 2025), but the most recent *disclosure* is the Leadership Transition announcement (24 Jun 2026) — six months later, with no accompanying financials (FY2026 results aren't due until 11 Sept 2026). The platform should be able to show a governance/event update without pretending it comes with matching financial figures.

## 3. Scope Decision Summary

**In scope for AI extraction into the metric/risk data store:**
- Information Document (primary — KPIs, risk factors, financial summary)
- FY2025 audited annual accounts
- H1 FY2026 unaudited interim results (one canonical copy)
- Share price data (both xlsx files)
- Listing press release (admission price baseline)
- Leadership Transition announcement (governance + risk-relevant event)
- Corporate presentation (market/strategy narrative, used for commentary context rather than hard numbers)
- Senus Limited balance sheet as at 8 Dec 2025 (minor, transition snapshot)

**Out of scope — legal/procedural documents with no reportable financial or risk content:**
- Memorandum & Articles of Association
- AGM proxy form
- AGM announcement pointer, results notification pointer
- Share price quote chart (redundant with the xlsx source data)

**Light-touch only:**
- AGM Circular — not extracted as metrics, but its resolutions (director re-election, share issuance authority up to two-thirds of capital) are relevant governance context for the Board view and worth a single-line mention rather than full extraction.

## 4. What This Gives Us

Two real, comparable-with-caveats financial periods (FY2025 annual, H1 FY2026 interim) — enough for a genuine YoY/period comparison once the standalone-vs-consolidated distinction is respected. One real corporate event with no financials attached yet (leadership transition), which is a good test case for the platform's ability to surface a qualitative update independently of the numeric metric pipeline.
