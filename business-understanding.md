# Business & Product Framing — Senus PLC Board Report

## 1. Objective

Build an AI-native platform that transforms Senus PLC's scattered financial and corporate disclosures into a single, interactive Board Report — usable by four distinct audiences, each with different concerns, from the same underlying data.

## 2. Situation Assessment

Senus PLC is an early-stage, recently-listed (22 Dec 2025, Euronext Access Dublin) natural capital management software company:

- **Revenue:** €836,991 FY2025 (+21.6% YoY), €354.8k H1 FY2026 (+4.1% YoY)
- **Profitability:** Loss-making but narrowing (operating loss down 44% in FY2025); not expected EBITDA-positive until FY2028
- **Cash:** €735.1k as at Dec 2025; recently raised €1.1m in a private placement pre-listing
- **Strategy:** "Senus 2030" — targeting ≥50% compound annual revenue growth 2026–2030
- **Structure:** Recently changed legal identity (ADF Farm Solutions Ltd → Senus PLC), consolidated a subsidiary (Loamin) mid-period, meaning FY2025 and H1 FY2026 are not fully like-for-like
- **Market position:** Operating in a fragmented, non-incumbent category (natural capital / agri-MRV). No direct commercial competitor has been identified to date — Farmeye was Senus's *own* former brand name (rebranded Sept 2024), not a separate competitor; NatCap/Stanford dominates the non-commercial/academic natural capital space but isn't a direct SaaS competitor either. This near-absence of an entrenched incumbent is itself a relevant product-thinking data point, not a gap to paper over.
- **Trading:** Illiquid — near-zero trading volume since listing, share price effectively static

**Implication for the report:** This is a growth-story company, not a mature, cash-generative one. Metrics and commentary should reflect that reality — emphasis on trajectory and strategy-tracking, not on metrics that assume profitability or heavy leverage (e.g. don't over-index on margin stability; do index on runway and growth rate).

## 3. Success Criteria

The platform succeeds if:

1. A person from any of the four target audiences can understand Senus's financial position and trajectory **within ~2 minutes** of logging in
2. Every number shown is traceable back to a specific source document (no unexplained figures)
3. The AI-generated commentary adds genuine interpretive value beyond what the raw numbers already show, without overstating certainty the data doesn't support
4. The report reflects Senus's *own* stated strategy (Senus 2030, MRV philosophy) rather than a generic finance-dashboard template
5. Data quality issues in the underlying disclosures (unaudited figures, consolidation changes, legal name change) are surfaced, not hidden

## 4. Audience Needs (Double Diamond: Discover/Define)

### Management (day-to-day operators)
**What they need:** Operational detail to steer the business week-to-week.
- Revenue by product line (Senus SOIL, ERA, TERRAIN) and by customer channel (Enterprise / Independent / R&D), MoM trends
- Customer count and account growth (138 accounts baseline)
- Cost breakdown (by category, not just total)
- Cash burn rate and runway
- Bookings/pipeline indicators if available

### The Board (governance oversight)
**What they need:** Strategic-level health check, less granular than Management.
- Performance vs. Senus 2030 targets (50% CAGR benchmark)
- High-level P&L trend (revenue, gross margin, operating loss trajectory)
- Cash position and runway
- Key risks flagged in disclosures
- Governance/leadership context (e.g. the recent MD transition)

### Equity Investors (growth/return-focused)
**What they need:** Is this company on track to be worth more later?
- Revenue growth rate vs. the 50% CAGR target
- Path to profitability (trajectory toward FY2028 EBITDA-positive target)
- Share price performance since listing (+20% YTD, per the price data)
- Market cap context, ROCE
- Dilution/cap table awareness (if disclosed)

### Credit Providers (solvency/repayment-focused)
**What they need:** Can this company service debt and remain solvent?
- Debt Service Coverage Ratio (DSCR) — noting Senus's current leverage appears minimal, so this section should be framed honestly around liquidity/solvency more broadly if formal debt is limited
- Cash runway and working capital position
- Balance sheet strength (assets vs. liabilities)
- EBITDA trajectory (even though negative — the *trend* is what matters to a lender assessing forward risk)

## 5. Metric Selection Summary

| Category | Primary Audience | Metrics |
|---|---|---|
| Growth & Revenue | Management, Equity Investors | YoY/period revenue growth, customer count, revenue and Enterprise ACV by product line (SOIL / ERA / TERRAIN), growth vs. 50% CAGR target |
| Profitability | Management, Board | Gross margin, operating margin, EBITDA margin, cost breakdown |
| Cash & Liquidity | Management, Board, Credit Providers | Cash balance, burn rate, runway, working capital |
| Solvency & Leverage | Credit Providers | DSCR (if applicable), liabilities vs. assets |
| Returns | Equity Investors | ROCE, share price performance since listing |
| AI Commentary | All | Narrative synthesis per audience view, framed around Measure → Report → Verify |

## 6. Key Assumptions (to state explicitly in README)

- Where FY2025 (standalone) and H1 FY2026 (consolidated) figures aren't directly comparable, this will be noted rather than silently blended
- H1 FY2026 figures are unaudited and will be visually flagged as such
- Given Senus currently shows minimal formal debt in its disclosures, the Solvency & Leverage section will be framed around liquidity resilience rather than assuming meaningful existing leverage — this is a reasonable product judgment call given the source data, to be confirmed if Assiduous responds otherwise
- Share price/trading data will be treated as a static snapshot from the provided files, not a live feed (pending clarification)
- No direct commercial competitor has been identified for Senus; competitive framing in the platform (if any) should acknowledge this white-space market position rather than force a comparison that doesn't exist
- Revenue and ACV breakdown by product line (SOIL, ERA, TERRAIN) is disclosed narratively in the Information Document and corporate presentation, not in the statutory financial statements themselves — extraction for this metric will target those sources specifically rather than expecting it in the P&L
- Month-over-month figures are not available for core financials — Senus reports annually and semi-annually only, with no monthly disclosure anywhere in the source documents; MoM granularity is only genuinely available for share price data, which will be presented as market data, not financial performance
- Bookings/pipeline value IS quantitatively disclosed (H1 FY2026 results: €700k closed pipeline deals across 21 enterprise customers, €500k further open pipeline) — captured as raw metrics, not excluded as originally (incorrectly) assumed during an earlier pass
- Dividend policy is explicitly nil for the foreseeable future — the Equity Investor "Returns" view is framed entirely around capital growth (ROCE, share price appreciation), not income
- Dilution is disclosed concretely via the 2025 Share Option Plan (~5% of pre-placement share capital reserved) — included as `share_option_pool_percentage`, upgraded from the earlier "if disclosed" placeholder

## 7. Assiduous Clarification — Resolved

Barry from Assiduous responded to the clarification email. Key confirmed answers:

- **No hard deadline** — "complete in your own time"
- **Scope confirmed**: solely the Senus investor relations page materials (matches the document set already in use)
- **Include H1 FY2026 alongside FY2025** — confirmed, already done
- **Explicit assumptions over requesting more data** — confirmed as the expected approach; this project's approach throughout (unaudited flags, consolidation basis labels, documented exclusions for MoM) was already built this way before the confirmation came in
- **Public GitHub repo and public YouTube demo are fine** — all source data is already public information
- **Standalone/consolidated comparison basis, audited/unaudited visual distinction, and share price format (static snapshot vs. live feed) are all "your decision"** — validates the judgment calls already made and documented in this project
- **No standard board reporting template exists** — metric selection was correctly left to independent judgment, not benchmarked against something that doesn't exist
- **No tech stack or AI provider constraints**
- **Demo login can be simulated/shared-password** — directly validates the single-login, not-multi-account-RBAC decision
- **YouTube demo: 2-3 minutes** — a real constraint to script tightly against, not a suggestion
- **GitHub repo should be public**
- **One-page write-up: "you decide"** — optional, worth including given most of its content already exists across the project docs
- **Evaluation weighting not shared at this stage**

## 8. ADR-001: Metric Selection, Per Audience

**Context**
The brief lists example metric categories (Growth & Revenue, Profitability, Cash & Liquidity, Solvency & Leverage, Returns) as a starting point, not a prescription. Applied uncritically, that list produces one dashboard showing all metrics to all four audiences — which fails Success Criterion 1 (understand the company within ~2 minutes) and ignores that Management, the Board, Equity Investors, and Credit Providers are asking fundamentally different questions of the same numbers.

**Decision**
Metrics are assigned a primary audience (§5 table) based on what decision that audience is actually trying to make, not on which brief category they technically fall under:
- **Management** gets the metrics that inform week-to-week operating decisions (channel mix, burn rate) — not board-level strategy metrics.
- **The Board** gets trajectory-vs-target metrics (progress against Senus 2030's 50% CAGR, path to FY2028 EBITDA breakeven) — oversight-level, not day-to-day detail.
- **Equity Investors** get growth and return metrics (ROCE, share price performance) that speak to future value, since that's the question an equity holder is actually asking.
- **Credit Providers** get liquidity and solvency metrics (cash runway, working capital) — and, per §6, this section is deliberately framed around liquidity resilience rather than a formal DSCR calculation, since Senus currently carries minimal formal debt. Forcing a leverage ratio onto a near-debt-free balance sheet would manufacture false precision.

Two brief-listed categories were deliberately reframed rather than dropped: "Solvency & Leverage" (reframed as liquidity resilience, above) and generic "Cost Breakdown" (assigned to Management specifically, not shown board-wide, since granular cost detail isn't a board-level concern for a company this size).

**Consequences**
- Positive: each audience view stays short enough to meet the 2-minute comprehension target; the report reads as designed for its readers rather than copy-pasted from the brief.
- Positive: reframing Solvency & Leverage avoids presenting a misleading or hollow ratio just to tick a brief bullet point.
- Trade-off: some metrics (e.g. EBITDA trajectory) legitimately matter to more than one audience and are intentionally duplicated across views rather than forced into a single "primary owner" — this is accepted, not an oversight.
- Risk: if Assiduous's evaluators expect to see every brief-listed metric surfaced identically for every audience, this audience-differentiated approach could read as incomplete rather than considered. Mitigated by stating this reasoning explicitly in the README and demo narration, so the omission reads as a decision, not a gap.
