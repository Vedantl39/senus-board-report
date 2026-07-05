# Audit: Is Real AI Extraction Actually Running?

Before any more visual polish, I need an honest answer to this, since it affects whether the core requirement of this assignment is actually being met.

## Questions — answer each one directly, don't summarize

1. **Are the actual source PDF/xlsx files present in this Replit project's filesystem right now?** List what's in the documents/uploads folder, if one exists.

2. **Does an extraction pipeline exist in the codebase** that reads a document's raw text and calls the Anthropic API to extract structured metric/risk/event data (per `ai-extraction-design.md` — three extraction prompts plus a risk-diffing prompt)? Show me the actual file if it exists.

3. **Has that pipeline ever actually been run** against a real source document, with a real Claude API call, producing rows that were inserted into the `disclosures` table? Or has the data currently in the database been manually inserted/seeded by you based on figures I provided in chat?

Answer honestly even if the answer is "no, extraction was never actually built/run and the current data is manually seeded." That's a fixable gap, not a failure — but I need to know which situation we're actually in before deciding what to do next.

## If extraction was never actually run (likely, given the pattern of questions asked)

Here's what needs to happen:

1. Upload the actual source documents (PDFs + xlsx files) into this Replit project.
2. Build (or finish building, if partially started) the extraction pipeline exactly as specified in `ai-extraction-design.md`: one Claude API call for metrics, one for risks, one for events, using the raw metric taxonomy already defined.
3. Run it against at least the two core financial documents (the FY2025 annual report and the H1 FY2026 interim results) and the Information Document (for risk factors), and confirm the extracted output matches the golden test set figures already documented (FY2025 revenue €836,991, H1 FY2026 revenue €354,813, etc.) — if it doesn't match, that's a real bug to fix in the extraction prompts, not something to paper over by re-seeding the correct numbers manually.
4. Clear out any manually-seeded data first, so what's left in the database is only what the pipeline actually produced — otherwise we won't be able to tell what's real extraction output versus leftover manual seeding.

The manually-seeded numbers currently in the dashboard are all correct (I verified them against the source documents myself), but "correct because a human looked them up and typed them in" and "correct because the AI extraction pipeline read the document and got it right" are fundamentally different things for this specific assignment, where AI extraction is the main thing being assessed.
