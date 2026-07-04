const test = require('node:test');
const assert = require('node:assert/strict');
const {
  grossMargin,
  ebitda,
  workingCapital,
  cashRunwayMonths,
  totalAssets,
  roce,
  computeDerivedMetrics,
} = require('../src/metrics/deriveMetrics');

// --- Golden test set (ai-extraction-design.md §6): hand-verified directly
// from the source PDFs before any extraction code was written. If these
// fail, the bug is in the formula/code, not the source data.

const FY2025 = {
  revenue: 836991,
  gross_profit: 648450,
  operating_profit_loss: -633694,
};

const H1_FY2026 = {
  revenue: 354813,
  gross_profit: 289952,
  operating_profit_loss: -483753,
  depreciation_amortization: 10014,
  goodwill: 669550,
  development_costs: 239765,
  tangible_assets: 42006,
  debtors: 188149,
  cash_and_equivalents: 735189,
  creditors_due_within_one_year: 387105,
  net_cash_operating_activities: -410291,
};

test('gross margin matches Senus\'s own disclosed FY2025 figure (77.5%)', () => {
  const margin = grossMargin(FY2025);
  assert.ok(Math.abs(margin - 0.775) < 0.001, `expected ~0.775, got ${margin}`);
});

test('gross margin matches Senus\'s own disclosed H1 FY2026 figure (81.7%)', () => {
  const margin = grossMargin(H1_FY2026);
  assert.ok(Math.abs(margin - 0.817) < 0.001, `expected ~0.817, got ${margin}`);
});

test('EBITDA (via operating_profit_loss + D&A) matches the subtotal Senus itself shows in its H1 cash flow statement (-473,739)', () => {
  // Senus's own cash flow notes derive the same figure a different way
  // (loss for period + interest + depreciation) and land on -473,739.
  // Both paths should agree — this is a genuine cross-check, not a
  // circular one, since our formula starts from operating_profit_loss.
  const result = ebitda(H1_FY2026);
  assert.equal(result, -473739);
});

test('total assets subtotal matches the Fixed + Current Assets split shown in the balance sheet', () => {
  // Senus's own balance sheet shows Fixed Assets subtotal of 951,321
  // and Current Assets (debtors + cash) of 923,338 for H1 FY2026.
  const result = totalAssets(H1_FY2026);
  assert.equal(result, 951321 + 923338);
});

test('working capital is current assets minus current liabilities', () => {
  const result = workingCapital(H1_FY2026);
  assert.equal(result, (188149 + 735189) - 387105);
});

test('cash runway returns null when the company is cash-generative (not burning cash)', () => {
  const cashPositive = { cash_and_equivalents: 100000, net_cash_operating_activities: 5000 };
  assert.equal(cashRunwayMonths(cashPositive, 6), null);
});

test('cash runway computes months of cash left when burning cash', () => {
  const months = cashRunwayMonths(H1_FY2026, 6);
  // monthly burn = 410,291 / 6 ≈ 68,381.83; runway = 735,189 / 68,381.83 ≈ 10.75
  assert.ok(Math.abs(months - 10.75) < 0.05, `expected ~10.75, got ${months}`);
});

test('ROCE is negative for a loss-making period, not NaN or a crash', () => {
  const result = roce(H1_FY2026);
  assert.ok(typeof result === 'number' && result < 0, `expected a negative number, got ${result}`);
});

test('missing inputs return null rather than throwing (incomplete document handling)', () => {
  const incomplete = { revenue: 100000 }; // gross_profit missing
  assert.equal(grossMargin(incomplete), null);
});

test('computeDerivedMetrics returns every defined derived metric for a full period', () => {
  const result = computeDerivedMetrics(H1_FY2026, 6);
  const expectedKeys = [
    'gross_margin', 'operating_margin', 'total_assets', 'ebitda',
    'ebitda_margin', 'working_capital', 'cash_runway_months', 'roce',
  ];
  for (const key of expectedKeys) {
    assert.ok(key in result, `missing derived metric: ${key}`);
  }
});
