/**
 * Post-hoc grounding check for AI-generated commentary (the "Verify" tab).
 *
 * The prompt in buildCommentaryPrompt.js instructs Claude not to invent
 * numbers, but LLMs can still slip — this scans the generated text for
 * every numeric token and confirms each is traceable to (a) a raw value
 * or comparative value actually present in the disclosure data fed to the
 * prompt, (b) a percentage change directly derivable from those two
 * values, or (c) a number embedded in the free-text title/description of
 * a risk or event that was itself part of the source data. Anything else
 * fails validation and the commentary must not be shown to the user.
 *
 * This is a best-effort heuristic, not a proof — it can't verify prose
 * *claims* (e.g. "revenue grew due to new customers"), only that the
 * *numbers* quoted are real. That's the boundary the spec asks for: never
 * display a fabricated figure.
 */

const NUMBER_REGEX = /-?[€$£]?\d[\d,]*(?:\.\d+)?%?/g;

function normalizeToken(token) {
  const isPercent = token.includes("%");
  const cleaned = token.replace(/[€$£,%]/g, "");
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return { value, isPercent };
}

function extractNumbersFromText(text) {
  if (!text) return [];
  const matches = text.match(NUMBER_REGEX) || [];
  return matches.map(normalizeToken).filter(Boolean).map((n) => n.value);
}

/**
 * Builds the set of numeric values the commentary is allowed to cite,
 * given the same records that were fed into buildCommentaryPrompt.
 *
 * Deliberately generous rather than a strict single-representation
 * match: real disclosure data legitimately contains the same fact in
 * multiple numeric forms (a ratio metric like gross_margin is stored as
 * a fraction, e.g. 0.7747, but commentary naturally renders it "77.5%";
 * a period_label/comparative_period/filename carries dates whose year
 * and day components — "2025", "30", "31" — are real, disclosed facts,
 * not fabrications, even though they aren't in a `value` field). Missing
 * any of these representations would cause correct commentary to be
 * wrongly withheld, which is its own kind of failure for a board report.
 */
function collectAllowedNumbers({ metrics = [], risks = [], events = [] }) {
  const numbers = [];

  const addValueAndPercentForm = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return;
    numbers.push(value);
    // Ratio-style derived metrics (gross_margin, operating_margin, etc.)
    // are stored as fractions but commonly narrated as percentages.
    numbers.push(value * 100);
    // Loss/negative metrics (operating_profit_loss, profit_loss_after_tax,
    // etc.) are commonly narrated in prose without a leading minus sign
    // ("posted a loss of €633,694" rather than "-€633,694") — the
    // magnitude is still the same disclosed fact.
    numbers.push(Math.abs(value), Math.abs(value) * 100);
  };

  for (const m of metrics) {
    const p = m.payload || {};
    addValueAndPercentForm(p.value);
    addValueAndPercentForm(p.comparative_value);

    if (
      typeof p.value === "number" &&
      typeof p.comparative_value === "number" &&
      p.comparative_value !== 0
    ) {
      const pctChange = ((p.value - p.comparative_value) / Math.abs(p.comparative_value)) * 100;
      numbers.push(pctChange, Math.abs(pctChange));
    }

    // Dates embedded in period labels/comparative periods (years, days
    // of month) are real disclosed facts even though they aren't a
    // `value` field — e.g. "financial year ended 30 June 2024".
    numbers.push(...extractNumbersFromText(m.period_label));
    numbers.push(...extractNumbersFromText(p.comparative_period));
    numbers.push(...extractNumbersFromText(m.source_filename));
    numbers.push(...extractNumbersFromText(m.source_period_covered));
  }

  for (const r of risks) {
    const p = r.payload || {};
    numbers.push(...extractNumbersFromText(p.title));
    numbers.push(...extractNumbersFromText(p.description));
    numbers.push(...extractNumbersFromText(r.period_label));
    numbers.push(...extractNumbersFromText(r.source_filename));
    numbers.push(...extractNumbersFromText(r.source_period_covered));
  }

  for (const e of events) {
    const p = e.payload || {};
    numbers.push(...extractNumbersFromText(p.title));
    numbers.push(...extractNumbersFromText(p.description));
    numbers.push(...extractNumbersFromText(e.period_label));
    // Source filenames often embed a document date (e.g. "V24062026" for
    // 24 June 2026) that legitimately explains a day/month/year Claude
    // cites when describing an undated event's press-release provenance.
    numbers.push(...extractNumbersFromText(e.source_filename));
    numbers.push(...extractNumbersFromText(e.source_period_covered));
  }

  return numbers;
}

function isTraceable(value, isPercent, allowedNumbers) {
  const tolerance = isPercent ? 0.5 : Math.max(Math.abs(value) * 0.01, 1);
  return allowedNumbers.some((n) => Math.abs(n - value) <= tolerance);
}

/**
 * @param {string} commentaryText - raw text returned by Claude
 * @param {{metrics?: object[], risks?: object[], events?: object[]}} sourceData
 *   - the exact records passed to buildCommentaryPrompt for this call
 * @returns {{valid: boolean, failedNumbers: string[], checkedCount: number}}
 */
function validateCommentaryGrounding(commentaryText, sourceData) {
  const allowedNumbers = collectAllowedNumbers(sourceData);
  const matches = commentaryText.match(NUMBER_REGEX) || [];

  const failedNumbers = [];
  for (const match of matches) {
    const normalized = normalizeToken(match);
    if (!normalized) continue;

    // Small integers (0-3) are near-universally structural (e.g. "three
    // sections", ordinal references) rather than disclosed facts — not
    // worth flagging and would produce constant false positives.
    if (!normalized.isPercent && Math.abs(normalized.value) <= 3) continue;

    if (!isTraceable(normalized.value, normalized.isPercent, allowedNumbers)) {
      failedNumbers.push(match);
    }
  }

  return { valid: failedNumbers.length === 0, failedNumbers, checkedCount: matches.length };
}

module.exports = { validateCommentaryGrounding, collectAllowedNumbers };
