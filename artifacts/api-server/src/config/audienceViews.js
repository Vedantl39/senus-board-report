/**
 * Pre-filtered category/metric scoping for each audience view, per
 * Phase 4 of the spec. These are just filtered queries against
 * `disclosures` — not per-role gating (there is no RBAC in this app).
 *
 * Rationale for each audience's scope (see
 * attached_assets/replit-build-prompt_1783199322997.md, Phase 4):
 * - management: "Growth & Revenue, Profitability line items, cash burn."
 *   Cash burn is represented by the derived cash_runway_months metric
 *   and the raw net_cash_operating_activities metric (both categorized
 *   under "Cash & Liquidity" in the taxonomy, so they're pulled in by
 *   metricNames rather than the whole category).
 * - investors: "growth vs. CAGR target, ROCE, share price, dilution."
 *   There is no CAGR-target metric in the taxonomy (the spec explicitly
 *   forbids fabricating metrics Senus doesn't disclose), so "growth" is
 *   represented by the actual disclosed `revenue` metric. ROCE, share
 *   price, and dilution (share_option_pool_percentage) all fall under
 *   the "Returns/Market" taxonomy category.
 * - lenders: "cash/liquidity, working capital, going-concern-relevant
 *   items." Cash/liquidity and working capital (derived) both live in
 *   the "Cash & Liquidity" category. Going-concern relevance is covered
 *   by net_assets_liabilities (Solvency/Balance Sheet) since that's the
 *   disclosed balance-sheet solvency figure.
 *
 * The "board" view mixes multiple record_types (metrics + risks +
 * events), so it's assembled directly in the views route rather than
 * expressed as a single filter object here.
 */

const AUDIENCE_VIEWS = {
  management: {
    recordType: "metric",
    categories: ["Growth & Revenue", "Profitability"],
    metricNames: ["net_cash_operating_activities", "cash_runway_months"],
  },
  investors: {
    recordType: "metric",
    categories: ["Returns/Market"],
    metricNames: ["revenue"],
  },
  lenders: {
    recordType: "metric",
    categories: ["Cash & Liquidity"],
    metricNames: ["net_assets_liabilities"],
  },
};

const BOARD_VIEW = {
  metrics: {
    recordType: "metric",
    categories: ["Profitability"],
    metricNames: ["revenue", "cash_and_equivalents"],
  },
};

module.exports = { AUDIENCE_VIEWS, BOARD_VIEW };
