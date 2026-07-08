# Assignment Alignment Check

Checking every metric category and requirement named in `Assiduous_TechGradAssignment.pdf` against what's been designed in Buckets 1–4, before writing any code.

## 1. Metric-by-Metric Coverage

| Brief category | Brief examples | Status |
|---|---|---|
| **Growth & Revenue** | YoY | ✅ Raw `revenue` extracted per period with `comparative_value`/`comparative_period` fields |
| | MoM | ⚠️ **Gap — see §2.1** |
| | Customers | ✅ `enterprise_customer_count`, `independent_customer_count`, `rd_customer_count` |
| | Channels | ✅ Covered two ways — commercial channel (Enterprise/Independent/R&D) and product line (Soil/ERA/Terrain) |
| | Bookings | ⚠️ **Gap — see §2.2** |
| **Profitability** | Gross Margin | ⚠️ **Gap — see §2.3** (raw inputs exist, derived metric was never formally listed) |
| | Operating Margin | ⚠️ Same gap |
| | EBITDA Margin | ⚠️ Same gap, plus EBITDA itself was never defined |
| | Cost Breakdown | 🟡 Partial — `cost_of_sales` and `administrative_expenses` are the only cost lines Senus discloses; no further sub-categorisation exists in the source documents to extract |
| **Cash & Liquidity** | EBITDA to FCF Bridge | ⚠️ Same gap — raw cash flow lines exist (`net_cash_operating/investing/financing_activities`), bridge itself not yet defined |
| | Cash Runway | ⚠️ Same gap |
| | Working Capital | ⚠️ Same gap — raw inputs exist (`debtors`, `creditors_due_within_one_year`, `cash_and_equivalents`) |
| **Solvency & Leverage** | Debt Service Coverage Ratios | ✅ Already explicitly addressed — Business Understanding §6 documents the decision to reframe this section around liquidity resilience, since Senus discloses minimal formal debt. This is a deliberate scope decision, not an oversight. |
| **Returns** | ROCE | ⚠️ **Gap — see §2.4** |
| **AI-powered insights/commentary** | | ✅ On track — scheduled as Bucket 6, Measure→Report→Verify framing already decided |

## 2. Gaps Found and How They're Resolved

### 2.1 Month-over-Month (MoM) — Not Available for Core Financials
Senus reports annually (FY) and semi-annually (H1) — there is no monthly financial disclosure anywhere in the source documents. True MoM revenue/profitability is not derivable from what Senus discloses. **Resolution:** documented as an explicit limitation, not silently omitted. The one place monthly granularity genuinely exists is the daily share price data, which can be rolled up to monthly for the Equity Investor view (share price trend), but this is market data, not financial performance.

### 2.2 Bookings — CORRECTION: This Was Wrong. It IS Disclosed.
The first pass of this alignment check incorrectly concluded bookings weren't quantitatively disclosed. A deeper search of the H1 FY2026 results PR found real figures: **"pipeline deals of approx. €700k across 21 enterprise customers closed in the period (further approx. €500k of open pipeline)"** — stated directly in the results Highlights. The same document's body text separately mentions "10 commercial deals... combined estimated value of approx. €425k" closed in the final two months of 2025 specifically — a sub-period within the same H1, not a separate figure to add to the €700k. **Resolution:** `pipeline_bookings_closed_value`, `pipeline_open_value`, and `pipeline_deals_closed_count` added to the raw metric taxonomy (§2.3 below). The narrower "final two months" figure is treated as supporting commentary context, not a separate stored metric, to avoid double-counting against the six-month headline figure.

### 2.3 Derived Financial Ratios Were Never Formally Listed
Bucket 3/4 correctly decided *how* derived metrics get computed (in code, from raw rows) but never wrote down *which* ones. Adding now:

| Derived metric | Formula | Inputs available? |
|---|---|---|
| `gross_margin` | gross_profit ÷ revenue | ✅ both raw |
| `operating_margin` | operating_profit_loss ÷ revenue | ✅ both raw |
| `ebitda` | operating_profit_loss + depreciation_amortization | 🟡 depreciation disclosed in H1 FY26 (€10,014) cash flow notes; needs checking whether FY2025 annual accounts disclose it too (full statutory accounts, not just the summary table) |
| `ebitda_margin` | ebitda ÷ revenue | Depends on ebitda above |
| `working_capital` | (debtors + cash_and_equivalents) − creditors_due_within_one_year | ✅ all raw |
| `cash_runway_months` | cash_and_equivalents ÷ average monthly net cash used in operations | ✅ raw inputs exist, needs a monthly-average convention decided |
| `ebitda_to_fcf_bridge` | Not a single number — a presentation of ebitda → net_cash_operating_activities → net_cash_investing_activities → net change in cash, as a waterfall | ✅ all raw components exist; this is a chart design decision (Bucket 8), not an extraction gap |
| `roce` | operating_profit_loss ÷ (total_assets − creditors_due_within_one_year) | 🟡 needs `total_assets` — computable as sum of fixed assets + current assets components already in the raw taxonomy, not disclosed as a single line — worth adding as an explicit derived subtotal |

**Action:** `depreciation_amortization` added to the raw metric taxonomy (Cash & Liquidity or Profitability group); `total_assets` added as a derived subtotal that other derived metrics (ROCE) depend on.

### 2.4 ROCE — Same Root Cause as 2.3
Covered above — the raw components exist, the derived metric itself just needed to be written down explicitly rather than left as a table header with no formula.

## 3. What Was NOT a Gap (False Alarms Worth Ruling Out)

- **DSCR** — this was already deliberately addressed, not missed. Worth restating here so it doesn't get "fixed" twice.
- **Risk register** — not named anywhere in the brief. This is a genuine product-thinking addition on top of the brief's explicit requirements, not a requirement itself. It should not come at the cost of time needed for the metrics the brief actually names above.
- **Reference materials note** — the brief says materials are on Senus's investor relations website. Worth a final check close to submission that no newer document has been published there since these files were provided, since the Leadership Transition PR (24 Jun 2026) shows the company does publish between the documents we have.

## 5. Additional Findings from Deep Document Search

Beyond the metric-by-metric check, a full pass through every source document surfaced a few more items worth having on record:

- **Dividend policy:** No dividends intended for the foreseeable future — return case is entirely capital growth (Senus 2030). Relevant context for the Equity Investor view's "Returns" framing: ROCE and share price appreciation are the whole story, not a supplementary one.
- **Dilution is now a real, disclosed number, not a placeholder.** The 2025 Share Option Plan reserves options over 122,633 shares (~5% of pre-placement issued capital), with named grants to Stephen Coen, Hugh Sturrock, and Jonathan Smith. This upgrades the Business Understanding assumption "dilution/cap table awareness (if disclosed)" from hypothetical to concrete — added as `share_option_pool_percentage` in the raw metric taxonomy.
- **Related party transactions exist but are immaterial** (Onagh Consulting Ltd, a company controlled by Director Eoghan Finneran: ~€4-5k in both directions; two director working-capital loans of €100k and €70k, both repaid by October 2025). Reviewed and consciously excluded from the metric store as immaterial — noted here so it's a deliberate exclusion, not an oversight.
- **No legal or arbitration proceedings** — a clean baseline explicitly stated in the Information Document, worth surfacing as a one-line governance fact rather than leaving the Board/Credit Provider view silent on the topic.
- **Formal going concern statement exists** in both the FY2025 annual accounts and H1 FY2026 interim results — Directors explicitly state adequate resources exist for the foreseeable future. Directly supports the Credit Provider view's liquidity framing.
- **`SENUS_quote_chart.pdf` confirmed genuinely redundant** — it's a saved snapshot of the same Euronext live quote page the xlsx price data already covers. The Bucket 2 scope decision to exclude it was correct.
- **`Senus_Notification_of_Results_HY_Dec_2025.pdf` confirmed genuinely redundant** — it's a short "save the date" announcement (17 Feb 2026) pointing to the same HY results already captured from the actual results PR. The Bucket 2 exclusion was correct here too.

## 6. Raw Metric Taxonomy Additions From This Search

| New raw metric | Source | Category |
|---|---|---|
| `pipeline_bookings_closed_value` | H1 FY2026 results PR Highlights (€700k) | Growth & Revenue |
| `pipeline_open_value` | H1 FY2026 results PR Highlights (€500k) | Growth & Revenue |
| `pipeline_deals_closed_count` | H1 FY2026 results PR Highlights (21 enterprise customers) | Growth & Revenue |
| `share_option_pool_percentage` | Information Document §5.8 (~5% of pre-placement capital) | Returns |

## 7. Net Assessment

Not off track — the four buckets so far correctly cover audience framing, data inventory, schema, and extraction mechanics. Two things were fixed by this check: the *specific derived metrics the brief names by name* (EBITDA margin, cash runway, working capital, ROCE) had not actually been written down as formulas anywhere until now, only referenced conceptually; and one real factual error was caught and corrected — bookings data was initially assumed absent but is in fact disclosed. One genuine, defensible scope exclusion remains (MoM), now explicit rather than a silent gap.
