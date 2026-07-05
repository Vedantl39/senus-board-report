# Dashboard Accuracy & Completeness Fixes

Great progress — the branding, traceability, and risk register structure are working well. But there's one serious data accuracy problem and several real gaps to fix, in this priority order.

## Priority 1: Fix the misleading period comparison (most important)

Every "comparative" figure for H1 FY2026 is currently set to full-year FY2025 (e.g. Revenue shows Comparative: €836,991). This produces a misleading "▼57.6%" decline indicator — but that's comparing 6 months of revenue against 12 months, not a real year-over-year comparison.

**The correct comparative for every H1 FY2026 metric is the matching H1 FY2025 figure, not the full FY2025 figure.** For revenue specifically: H1 FY2025 revenue was €340,931 — using this, H1 FY2026 (€354,813) is actually **+4.1% growth**, not a decline. Please:
1. Find and correct every H1 FY2026 metric's `comparative_value` to use the true H1 FY2025 prior-period figure, not the FY2025 annual figure.
2. Where a true half-year comparative genuinely isn't available for a specific metric, show "—" (no comparative), the same way the FY2025 rows correctly show "—" — do not substitute a differently-scoped period just to have a number to show. A blank comparative is honest; a wrong one is not.
3. Re-check the trend indicators (▲/▼ arrows) on every KPI card after this fix — several are likely showing the wrong direction entirely, not just the wrong magnitude.

## Priority 2: Fix percentage formatting in the data tables

Gross Margin, Operating Margin, and EBITDA Margin show as raw decimals in the detail tables (e.g. "0.77", "-1.36") instead of percentages (77%, -136%). The hero KPI cards format these correctly — apply the same formatting to the table rows. Also fix the label casing: "Ebitda" / "Ebitda Margin" should display as "EBITDA" / "EBITDA Margin".

## Priority 3: Use the real, actual risk disclosures — not placeholder content

The current risk register shows generic-sounding risks under categories like "Financial Risk" and "Market Risk." These don't match Senus's actual disclosed risk categories. Replace with the real ones from the Information Document:

- **Corporate**: execution risk on Senus 2030 growth strategy
- **Technology and IP**: cyber security threats to customer data; software/IP infringement exposure
- **People and operations**: dependence on key personnel; reliance on third-party service providers
- **International and regulatory**: divergent data protection laws across markets; exposure to international economic/political risk
- **Financial and shares**: company is not yet profitable; limited share liquidity on Euronext Access
- **Market and competition**: (check the Information Document for the actual disclosed item here)

All should show status "Unchanged" for now, since this is the baseline document with nothing yet to compare against.

## Priority 4: Add the missing Leadership Transition event

"Governance Events" currently shows "No governance events disclosed" — but the Leadership Transition press release (24 June 2026) is real, in-scope data that hasn't been added yet. Add it as an event record: title "Leadership Transition," describing Brendan Allen's move to Vice Chairman.

## Priority 5: Populate the Investors view properly

It currently shows only a revenue table. Add:
- Returns category metrics: ROCE (once calculable), admission price vs. current share price, the share option pool percentage (~5%)
- The relevant risk categories already defined for this view (Market and competition, Financial and shares)

## Priority 6: Populate the Lenders view's missing Solvency & Leverage section

Only Cash & Liquidity currently shows. Add the Solvency & Leverage / Balance Sheet category metrics (net assets/liabilities, working capital already present, any relevant balance sheet items) and the Financial and shares risk category.

Please confirm each priority is fixed before moving to the next, and show me updated screenshots of the Revenue KPI card (to confirm the trend arrow is now correct) and the Investors/Lenders views once populated.
