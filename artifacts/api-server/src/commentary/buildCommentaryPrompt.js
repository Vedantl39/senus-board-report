/**
 * Builds the Claude prompt for the "Verify" tab's Measure/Report/Verify
 * narrative commentary. Takes the same disclosure records already fetched
 * for an audience's Report view (metrics/risks/events) and turns them into
 * a strict, grounded prompt — Claude is instructed to use ONLY numbers
 * present in (or directly derivable from) the data given, never invent or
 * estimate. `validateCommentaryGrounding.js` re-checks this after the
 * fact; this prompt is the first line of defense, not the only one.
 */

const AUDIENCE_FRAMING = {
  management: "day-to-day operating performance: growth, profitability, and cash burn.",
  board: "governance oversight: headline financial performance, the risk register, and recent governance events.",
  investors: "the investment case: growth, returns, share price, and dilution.",
  lenders: "creditworthiness: liquidity, working capital, solvency, and going-concern risk.",
};

function formatMetric(m) {
  const p = m.payload || {};
  const bits = [`${p.metric_name} = ${p.value}`];
  if (p.comparative_value !== undefined && p.comparative_value !== null) {
    bits.push(
      `prior: ${p.comparative_value}${p.comparative_period ? ` (${p.comparative_period})` : ""}`,
    );
  }
  if (p.unit) bits.push(`unit=${p.unit}`);
  if (p.derived) bits.push("derived");
  return `- [${m.category}] ${m.period_label ?? "unknown period"}: ${bits.join(", ")} (source: ${m.source_filename ?? "unknown"})`;
}

function formatRisk(r) {
  const p = r.payload || {};
  return `- [${r.category}] ${p.title ?? p.description ?? "risk"} — status: ${r.status ?? "unknown"} (source: ${r.source_filename ?? "unknown"})`;
}

function formatEvent(e) {
  const p = e.payload || {};
  return `- ${p.title ?? "event"}: ${p.description ?? ""} (period: ${e.period_label ?? "n/a"}, source: ${e.source_filename ?? "unknown"})`;
}

function buildCommentaryPrompt({ audience, metrics = [], risks = [], events = [] }) {
  const framing = AUDIENCE_FRAMING[audience] ?? "the relevant financial and operational facts.";

  const sections = [
    metrics.length ? `METRICS:\n${metrics.map(formatMetric).join("\n")}` : null,
    risks.length ? `RISKS:\n${risks.map(formatRisk).join("\n")}` : null,
    events.length ? `EVENTS:\n${events.map(formatEvent).join("\n")}` : null,
  ].filter(Boolean);

  const systemPrompt = `You are writing board-report commentary for Senus PLC, a natural capital software company. You are writing for the "${audience}" audience, whose primary concern is ${framing}

Ground rule, non-negotiable: you may ONLY state figures, dates, and facts that are explicitly present in the data the user gives you, or a value directly derivable from it (e.g. the percentage change between a "value" and its "prior" figure). Never invent, estimate, extrapolate, or round in a way that changes the reported figure. If you are not sure a fact is supported by the data, omit it rather than guess.

Structure your response with exactly three headed sections, in this exact order, using Markdown "##" headings:

## Measure
A plain, literal statement of what was measured, from which source documents, for which periods. No interpretation, just facts and provenance.

## Report
The headline narrative: what happened, told in prose, grounded strictly in the figures provided.

## Verify
Call out anything a reader should independently sanity-check or treat cautiously — e.g. a metric that flipped sign between periods, a figure only disclosed once, or a data gap. Only mention things genuinely true of this data; do not pad with generic disclaimers.

Write 2-4 sentences of plain prose per section. Do not use bullet points or tables.`;

  const prompt = `Here is the disclosure data available for the "${audience}" audience view:\n\n${
    sections.length > 0 ? sections.join("\n\n") : "(no data available for this audience)"
  }\n\nWrite the Measure / Report / Verify commentary now, following the system instructions exactly.`;

  return { systemPrompt, prompt };
}

module.exports = { buildCommentaryPrompt };
