# Philosophy Log — Senus PLC Board Report

Every meaningful decision — visual, architectural, or product — gets an entry here as it's made. This log is the raw material for three things:

1. **The demo narration** — instead of describing features, narrate the philosophy behind them
2. **The README** — this log becomes the "technical decisions" section almost verbatim
3. **Your own thinking** — forces you to justify each choice as you make it, not retroactively

Each entry follows the same shape:

> **Decision:** What was built/chosen
> **Philosophy:** Why — what belief or principle drove it
> **Where it shows up:** The concrete feature/screen/file
> **Proves:** Which evaluation pillar(s) — Software Engineering / Product Thinking / Technical Decision-Making

---

## Entry Template (copy this for each new entry)

```
## [Short Title]
**Decision:**
**Philosophy:**
**Where it shows up:**
**Proves:**
```

---

## Entries So Far

## Schema-on-Read Data Model
**Decision:** Store extracted financials as generic key-value metric records (metric_name, value, period, currency, source_document) instead of fixed database columns.
**Philosophy:** Senus's own documents don't follow one rigid format — annual accounts, half-year results, and investor decks all present numbers differently, and next year's report might introduce entirely new line items (e.g. as Senus 2030 strategy evolves). A rigid schema forces the data into a foreign shape; a flexible schema lets the data keep its own shape and still be queried consistently. This mirrors Senus's own approach to natural capital itself — measuring diverse, unpredictable real-world signals (soil, water, biodiversity) without forcing them into one narrow template.
**Where it shows up:** Database schema design, extraction pipeline output format.
**Proves:** Software Engineering, Technical Decision-Making

## Measure / Report / Verify Framing
**Decision:** Structure the dashboard's information architecture around "Measure → Report → Verify" rather than a generic finance-dashboard layout (e.g. "Overview / Metrics / Reports").
**Philosophy:** This isn't an invented framework — it's lifted directly from Senus's own stated product philosophy (their MRV — Measurement, Reporting, Verification — positioning, visible on their own site and in their Information Document). Applying the client's own mental model to how their board report is organized signals genuine understanding of who Senus is, not just what their revenue was. It also gives the AI commentary layer a natural narrative arc: what happened → what it means → why you can trust it.
**Where it shows up:** Top-level navigation/section structure of the dashboard; commentary generation prompt structure.
**Proves:** Product Thinking

## Dual Visual Identity (Assiduous Shell, Senus Content)
**Decision:** Use Assiduous's dark/coral visual identity for the "wrapper" (login, landing, platform chrome) and Senus's own natural/earth-toned identity for the actual report content.
**Philosophy:** The platform has two brands present in it for a real reason, not a stylistic accident — Assiduous is the listing sponsor and platform enabler ("Neo Sponsor"), Senus is the subject of the report. Visually separating "the tool" from "the company being reported on" mirrors that real-world relationship, and signals to a board member that they're looking at trustworthy, sponsor-verified reporting on Senus, not a Senus-built self-report.
**Where it shows up:** Login/auth screens vs. dashboard content screens.
**Proves:** Product Thinking, Technical Decision-Making

## Audience-Specific Views (Not One Generic Dashboard)
**Decision:** Structure the UI so Management, Board, Equity Investors, and Credit Providers each get a view emphasizing what they actually care about, rather than one dashboard showing everything to everyone.
**Philosophy:** A credit provider caring about DSCR and cash runway, and an equity investor caring about growth rate and TAM, are being poorly served by the same wall of 20 metrics. Real board reporting differentiates by audience. Building this in demonstrates the report was designed for its readers, not just from the data.
**Where it shows up:** Frontend view/tab structure; filtered metric sets per role.
**Proves:** Product Thinking

## Single Login, View Switcher — Not Multi-Account RBAC
**Decision:** One login represents access to the platform as a whole. A persistent "view as: Management / Board / Investors / Lenders" switcher in the UI changes which filtered slice of the same data store is displayed, rather than issuing separate accounts per audience with server-side role-based access control.
**Philosophy:** The brief itself frames this as "a platform a CEO would log in to and use" — a single-user login, not a multi-tenant system serving external investors and lenders who genuinely need access to be gated from each other. Building real RBAC (per-role auth, per-endpoint permission checks) would spend disproportionate time on a dimension the assignment isn't evaluating (identity/access management), at the cost of time on extraction, product thinking, and UI — the three things that are actually graded. The honest, defensible move is to build the simple version and state explicitly what a production system would add instead of quietly overbuilding or silently underexplaining.
**Where it shows up:** Top-nav view switcher component; API/query layer filters by selected view, not by authenticated role.
**Proves:** Technical Decision-Making, Software Engineering (recognising and stating scope boundaries deliberately)

## Metric Selection Justified Per Audience (Not Copied From the Brief)
**Decision:** Rather than building every metric listed in the assignment brief (Growth, Profitability, Cash, Solvency, Returns) as one undifferentiated set, each metric is explicitly mapped to the audience(s) it actually serves, with inclusions and exclusions justified against Senus's real financial situation rather than assumed by default.
**Philosophy:** The brief's bullet list is a menu, not a spec — copying it verbatim would prove I can follow instructions, not that I understand board reporting. Two examples of the judgment calls this forced: (1) Solvency & Leverage is framed around liquidity resilience rather than formal debt ratios, because Senus's disclosures show minimal existing leverage — building a DSCR-heavy view for a company with no meaningful debt would be technically impressive and practically hollow; (2) Growth & Revenue metrics are weighted toward Management and Equity Investors specifically, because a lender assessing solvency cares less about topline growth rate and more about whether growth is burning cash faster than it's replacing it. The full mapping (which audience, which metrics, why) lives in `business-understanding.md` §4–5.
**Where it shows up:** Metric selection summary table (Business Understanding doc); per-audience view filtering in the frontend.
**Proves:** Product Thinking, Technical Decision-Making

## Risk Register: Category + Materiality Order + Status Flag (Not a Static List)
**Decision:** Extract Senus's disclosed risk factors as structured records — category, title, plain-English summary, materiality rank (preserving the Directors' own most-material-first ordering) — and track a status flag (New / Updated / Unchanged) by comparing each new document's risk section against the last stored version, rather than displaying the risk section as a static block of text.
**Philosophy:** Senus's own Information Document already tells you the ranking (most material listed first per category) and already treats risk tracking as a real disclosed concept (the Half Year report explicitly states risks "have not materially changed" from the prior document) — so this isn't an invented feature, it's making an implicit signal in the source material explicit and scannable. A board member re-reading an unchanged wall of risk-factor prose every reporting period gets no value from the second read; a status flag tells them exactly where to spend their attention. This also reuses the same AI-extraction philosophy applied to the numeric metrics — qualitative disclosures get the same "AI reads it, doesn't force it into a rigid template" treatment as financial figures.
**Where it shows up:** Risk register component (Board view primarily, filtered subsets in Investor/Lender views); extraction pipeline's handling of Section 2 (Risk Factors) and equivalent HY report references.
**Proves:** Product Thinking, Software Engineering, Technical Decision-Making

## Frontend Logic Separated From Rendering, Tested Where It Can Be
**Decision:** The frontend's data-shaping logic (`groupRisksByCategory`, the API client's request/error handling) lives in plain, framework-free JavaScript with real tests. The React components themselves (`RiskRegister.jsx`, `App.jsx`) consume that tested logic but aren't unit-tested in this environment, since that would require a browser/DOM testing setup this sandbox doesn't have — that verification happens once the components render for real in Replit.
**Philosophy:** Rather than skip testing the frontend entirely, or add a heavy DOM-testing dependency (jsdom, React Testing Library) just to claim coverage, the actual logic that can go subtly wrong — grouping, filtering, error messages — is separated into pure functions and tested properly (4/4 passing). The presentational layer that's genuinely hard to unit test without a browser is left to visual verification instead of faked with brittle snapshot tests.
**Where it shows up:** `frontend/src/api/client.js` + `frontend/test/client.test.js`; `RiskRegister.jsx` imports and uses the tested `groupRisksByCategory` rather than re-implementing grouping inline.
**Proves:** Software Engineering, Technical Decision-Making

## Swappable Repository Interface (In-Memory for Tests, Postgres for Production)
**Decision:** All database access goes through a single repository interface (`createInMemoryRepository` / `createPostgresRepository`) with identical method signatures. Route handlers call the interface, never SQL directly.
**Philosophy:** This let the entire API layer — routing, filtering, audience view logic — be built and tested with real HTTP requests against a real running server, without needing a live Postgres instance in the sandbox where this was developed. The same route code will run unmodified once pointed at the real database in Replit. This isn't over-engineering for its own sake — it's the concrete reason 6 integration tests could run and pass before ever touching a real database.
**Where it shows up:** `src/data/disclosuresRepository.js`; every route in `src/api/server.js`.
**Proves:** Software Engineering, Technical Decision-Making

## One Route Per Audience via a Config Map, Not Four Duplicated Handlers
**Decision:** `/api/views/:audience` is a single route that looks up the requested audience in `viewDefinitions.js` and applies its filter — rather than writing separate `/api/views/management`, `/api/views/board`, etc. route handlers with near-identical logic.
**Philosophy:** This is the API-layer expression of the same "one store, four filtered views" principle from the schema design (Bucket 3) — the audience differentiation lives in a data structure (`VIEW_DEFINITIONS`), not in duplicated code paths. Adding a fifth audience later, if ever needed, is a config entry, not a new route to write and maintain in parallel with four others.
**Where it shows up:** `src/api/viewDefinitions.js`, `src/api/server.js`.
**Proves:** Software Engineering, Technical Decision-Making

## Independent Research Confirmed the Architecture Matches "AI-Native" Best Practice, Retroactively
**Decision:** A deliberate check against current industry definitions of "AI-native architecture" (grounding, structured output validation with fallback behavior, intelligence embedded at every layer rather than bolted on) was done after most of the system was already built — not used to design it.
**Philosophy:** The grounding validator and the risk-status diffing approach were built because they solved real problems this project ran into (fabricated numbers, brittle string matching), not because a definition said to build them. Finding that independent research on AI-native systems describes almost exactly what was already built — "never trust that the model formatted JSON correctly... type guards on AI-generated content before it touches anything critical" — is stronger evidence of sound architecture than citing the definition upfront would have been. It also identified one real gap worth closing: an agentic, multi-step, self-directed capability, which the current system doesn't yet have (see the "ask a follow-up question" feature).
**Where it shows up:** README's architecture framing; `replit-upload-and-interactivity-prompt.md` Part 2.
**Proves:** Technical Decision-Making, Product Thinking

## Client Clarification Confirmed Decisions Made Before the Answers Existed
**Decision:** No changes were needed to the project's approach after receiving Assiduous's clarification responses — the answers to standalone/consolidated framing, audited/unaudited visual treatment, share price format, and login/auth approach were all "your judgment call," and in each case the judgment already made and documented matched what was being asked for.
**Philosophy:** This is the real test of whether documented reasoning (the Philosophy Log itself) was actually sound versus just plausible-sounding: none of these decisions were made with foreknowledge of the client's answer, yet none needed revision once it arrived. The "state assumptions explicitly rather than request more data" answer in particular describes this project's approach from Bucket 1 onward, word for word, before that instruction was ever given. This is stronger validation than any internal review could provide.
**Where it shows up:** `business-understanding.md` §7; the demo narration should reference this directly rather than only describing decisions in isolation.
**Proves:** Product Thinking, Technical Decision-Making

## Real Extraction Surfaced and Corrected a Mislabeled Data Quality Assumption
**Decision:** Running real AI extraction against the actual Information Document surfaced that FY2025 was mislabeled "standalone" since Bucket 2 — the source document's own Section 3 title ("Annual Report and Consolidated Financial Statements") confirms it was always consolidated, just without Loamin (which joined later, in H1 FY2026). The distinction is corrected to "consolidated without Loamin" vs. "consolidated with Loamin," not a standalone/consolidated binary.
**Philosophy:** This is a genuinely good outcome of actually running extraction rather than continuing on hand-seeded data: the AI extraction step re-reading the primary source with fresh eyes caught a labeling error a human (including this project's own earlier analysis) had carried forward unquestioned for most of the build. It's a concrete demonstration of why "trust but verify against the real document" beats "an earlier pass already characterized this correctly" — even careful earlier work benefits from being re-checked against the primary source rather than assumed settled.
**Where it shows up:** `data-understanding.md` (corrected data quality issue #2); extraction pipeline's `consolidation_basis` labeling.
**Proves:** Software Engineering, Technical Decision-Making

## Noticing a Pattern That Exposed the Real Extraction Pipeline May Never Have Run
**Decision:** After the third consecutive question from the Replit agent asking for raw figures that live in the source PDFs, the pattern itself — not any single question — was the signal that the AI extraction pipeline designed in Bucket 4 likely never actually ran against real documents, and the dashboard's data was manually seeded instead.
**Philosophy:** Each individual question looked like reasonable, small missing-data cleanup. Only in aggregate did they reveal something structural: an agent that had actually extracted data from real documents wouldn't need to ask a human to look up admission price or balance sheet figures — it would already have them. This is a reminder that verification isn't just checking outputs against known values one at a time (the golden test set approach); it's also watching for *meta-signals* in how a system behaves that reveal it isn't doing what it claims. For an assignment where AI extraction is the explicitly named core requirement, this distinction — hand-seeded correct numbers vs. an actual working extraction pipeline — is not cosmetic.
**Where it shows up:** `replit-extraction-audit-prompt.md`.
**Proves:** Technical Decision-Making, Software Engineering (recognising the difference between a system that produces correct output and one that correctly does its job)

## Leadership Content Scoped to Board View, Tied to Existing Event Data
**Decision:** Rather than a team-photo sidebar across every view, leadership/governance content is added only to the Board view, and framed as populating the already-existing (but empty) Governance Events section with real corporate milestones already catalogued in the data inventory, plus a small, secondary leadership panel — not a new marketing-style feature.
**Philosophy:** A board report's job is decision-useful information; a prominent team-bio sidebar on every screen would compete with the actual financial data for attention on views where it's irrelevant (a Lender doesn't need founder headshots). The better version of the underlying good instinct — governance context matters — was already half-built: the Governance Events section existed but was empty despite real, dated milestones (rebrand, acquisition, listing, leadership transition) sitting in the Bucket 2 data inventory. Finishing that, rather than adding a parallel new feature, is the more disciplined move.
**Where it shows up:** `replit-governance-leadership-prompt.md`.
**Proves:** Product Thinking (recognising when an idea's good instinct has a better, smaller, already-scoped home)

## A Live Dashboard Bug Showed Growth as Decline — Caught Before Submission
**Decision:** The deployed dashboard's Revenue KPI card showed a "▼57.6%" decline indicator, produced by comparing H1 FY2026 (6 months) against full-year FY2025 (12 months) as if they were the same period length. The correct comparison — H1 FY2026 vs. the true prior-period H1 FY2025 — shows +4.1% growth, the opposite conclusion.
**Philosophy:** This is the exact failure mode the Bucket 2 data quality list warned about in the abstract (don't blend mismatched periods) actually happening in a live UI, with a real, visible, wrong number a board member would have read as "the company is shrinking" when it's actually growing. Catching this by checking the deployed output against known-correct figures — not just trusting that the design docs were followed — is the same discipline as the golden test set and the assignment alignment check, applied one stage later in the pipeline, closer to what a user would actually see.
**Where it shows up:** `replit-accuracy-fixes-prompt.md` Priority 1.
**Proves:** Software Engineering, Product Thinking (a wrong number a board member trusts is worse than no number at all)

## Client-Side Rendering, Not SSR
**Decision:** The frontend is plain client-side-rendered React (fetches data after the page loads), not server-side rendered (e.g. Next.js).
**Philosophy:** SSR solves problems this app doesn't have — SEO for public content, fast first-paint for anonymous visitors, social link previews. This is a login-gated internal board report with no public content to index and nothing shared as a link preview. Adopting SSR here would mean a heavier framework and a genuinely more complex deployment for zero real benefit — the kind of technology choice that looks sophisticated but is actually a worse fit than the simple option.
**Where it shows up:** `frontend/src/App.jsx`; deployment is a single Express server serving both the API and the built static frontend files.
**Proves:** Technical Decision-Making (recognising when a "more advanced" option is actually the wrong tool)

## Assiduous Logo Treatment Corrected Before Being Built
**Decision:** The login page background is set to `#121826` (the exact navy from Assiduous's own logo file) so the logo blends in directly, rather than the initially-proposed white background plate.
**Philosophy:** The first version of this instruction was a reasonable-sounding guess made without the actual asset in hand — plausible, and wrong. The moment the real logo file was available, pixel-measuring it (navy `#121826`, coral `#EB3C4D`, off-white `#F0F9F6`) immediately showed the guess was incorrect: the logo already carries its own dark background, so a white plate would have created a visible, wrong-looking box rather than a clean blend. Catching this before Replit built it, rather than after, is the same "don't trust the first plausible answer, verify against the real asset" discipline used for the Senus colors and the bookings correction.
**Where it shows up:** `replit-assiduous-logo-prompt.md`.
**Proves:** Technical Decision-Making, Product Thinking

## Brand Colors Verified Against the Live Site, Not Just the Presentation
**Decision:** The Senus color palette used in the UI is pixel-measured from the actual live senus.com website (`#023424` dark green, `#20887F` teal), not estimated from the static corporate presentation PDF.
**Philosophy:** The presentation gave a reasonable first estimate, but a presentation is a point-in-time marketing asset; the live site is the company's current, canonical brand expression. When the person spotted the real site and it confirmed (and sharpened) the estimate, updating the source-of-truth values rather than treating the first guess as good enough is the same "verify, don't assume" discipline used everywhere else in this project (the golden test set, the assignment alignment check, the bookings correction).
**Where it shows up:** `replit-color-scheme-prompt.md`.
**Proves:** Product Thinking, Technical Decision-Making

## Code-Level Grounding Check, Not Just a Prompt Instruction
**Decision:** AI-generated commentary is validated after generation by extracting every number mentioned in the text and checking it against the actual disclosure values that were fed into the prompt. A number that doesn't match anything in the source data fails validation, regardless of how confidently the prompt instruction was followed.
**Philosophy:** A prompt instruction ("only use the figures provided") is advice to the model, not a guarantee — the only way to actually catch a fabricated number is to check the output mechanically against ground truth, the same principle as the golden test set in Bucket 4 applied to a different stage of the pipeline. Trusting an AI output because the prompt asked it to behave is not validation; re-checking it against known-correct data is.
**Where it shows up:** `src/commentary/validateCommentaryGrounding.js`; proven by a test that deliberately fabricates numbers and confirms they're caught.
**Proves:** Software Engineering, Technical Decision-Making

## Two Real Bugs the Grounding Tests Caught While Building
**Decision:** The grounding validator's own test suite caught two genuine bugs during development, both fixed before the module was considered done: (1) a human-rounded number like "€354.8k" was being compared too strictly against its exact stored value (354813) and failing despite being correct; (2) bare years like "2026" from phrases like "H1 FY2026" were being flagged as unmatched fabricated numbers, when they're period labels, not financial claims.
**Philosophy:** Both bugs are exactly the kind of thing that looks fine in isolation and fails on real text — which is why the tests used realistic commentary sentences rather than synthetic inputs. Fixing both before moving on, rather than shipping a validator with known false positives, matters because a validator that cries wolf gets ignored or disabled, which defeats its purpose entirely.
**Where it shows up:** `validateCommentaryGrounding.js` (magnitude-scaled tolerance, bare-year exclusion); `test/commentaryGrounding.test.js` (15/15 passing).
**Proves:** Software Engineering

## Plain JavaScript, No Build Step, No Test Framework Dependency
**Decision:** The backend is plain Node.js/JavaScript (no TypeScript compilation step), and tests use Node 22's built-in `node:test` runner rather than installing Jest or another test framework.
**Philosophy:** This was left open since the very first planning conversation ("Node.js/Express or Python"). Given a non-CS background and a timeboxed solo build, every extra layer of tooling (a compiler step, a test framework's own configuration and API) is friction that doesn't buy anything the built-in tools don't already provide for a project this size. One language for both frontend and backend (JavaScript/React) also means no context-switching between two type systems or two package ecosystems.
**Where it shows up:** `package.json`, `src/metrics/deriveMetrics.js`, `test/deriveMetrics.test.js`.
**Proves:** Technical Decision-Making (recognising where tooling adds value vs. friction)

## The Golden Test Set Caught a Real Bug on the First Run
**Decision:** Running the derived metrics module against the hand-verified figures from Bucket 4 immediately surfaced a genuine bug — `safeDivide` checked for `null` but not `undefined`, so a field that was simply absent from a document (rather than explicitly null) produced `NaN` instead of a clean "not available."
**Philosophy:** This is exactly what the golden test set was built for (ai-extraction-design.md §6) — not a formality, a real check that caught a real defect before it reached a board-level report. It's also a concrete, honest answer to "how did you validate your outputs": here is an actual bug that was actually found and actually fixed, not a claim that testing happened.
**Where it shows up:** `src/metrics/deriveMetrics.js` (safeDivide, safeSum); `test/deriveMetrics.test.js` (10/10 passing after the fix).
**Proves:** Software Engineering, Technical Decision-Making

## Deep Document Search Caught a Real Error Before It Shipped
**Decision:** A full re-read of every source document (not just the ones already central to extraction) was done specifically to check for missed data, after the lighter brief-alignment check in the previous pass.
**Philosophy:** This caught a genuine mistake, not just a gap: bookings/pipeline value had been assumed to be undisclosed and excluded from scope — it's actually stated directly in the H1 FY2026 results Highlights (€700k closed, €500k open pipeline). Assuming something isn't disclosed, without actually re-checking, is a different and worse failure mode than knowingly excluding something that genuinely isn't there — the first is a research gap, the second is a documented judgment call. This also confirmed two documents (the quote chart PDF, the results notification PDF) were correctly excluded in Bucket 2, and surfaced smaller but real context (dividend policy, disclosed dilution via the share option pool, immaterial related-party transactions, a clean legal-proceedings baseline) that sharpens the Equity Investor and governance framing.
**Where it shows up:** `assignment-alignment-check.md` §5–6; corrected assumptions in business-understanding.md §6; new raw metrics in ai-extraction-design.md.
**Proves:** Software Engineering (rigor), Technical Decision-Making

## Explicit Assignment Alignment Check (Caught Before Building, Not After)
**Decision:** Before writing any implementation code, every metric category named in the assignment brief was checked one-by-one against the schema and extraction design already produced, rather than assuming earlier design work automatically covered it.
**Philosophy:** This caught a real gap: EBITDA margin, cash runway, working capital, and ROCE were all referenced conceptually in earlier buckets but never actually written down as formulas — the kind of gap that's easy to miss when each bucket feels complete in isolation but nobody re-reads the original brief against the sum of the decisions. It also surfaced two honest scope exclusions (true MoM granularity, quantified bookings) that the source documents simply don't support, which are now explicit assumptions rather than silent omissions discovered by an evaluator instead.
**Where it shows up:** `assignment-alignment-check.md`; derived metric taxonomy (ai-extraction-design.md §10); assumptions section (business-understanding.md §6).
**Proves:** Technical Decision-Making, Product Thinking

## Fail Loud, Not Silent: Retry-Then-Flag, Transactional Inserts
**Decision:** A malformed extraction response gets one retry with the error fed back to the model; if that also fails, the document is flagged for manual review rather than storing partial or guessed data. Raw metrics and their derived ratios are inserted in a single transaction per document, so a document is never left with one but not the other.
**Philosophy:** A board report with silently incomplete or half-computed figures is worse than one that visibly says "this document needs review" — the same principle already applied to unaudited/consolidated data flags (Bucket 1/2) applies to pipeline failures too. Failing loudly and stopping is more trustworthy than failing quietly and continuing.
**Where it shows up:** Extraction pipeline error handling and transaction boundaries (ai-extraction-design.md §8–9).
**Proves:** Software Engineering, Technical Decision-Making

## Arithmetic in Code, Interpretation in AI
**Decision:** Derived metrics (gross margin, EBITDA margin, etc.) are calculated by deterministic code reading raw extracted figures — never generated by asking the LLM to perform the arithmetic itself.
**Philosophy:** "AI-led, not rule-based" was always about interpreting messy, inconsistently-formatted source material — not about doing math. Division has exactly one correct answer; it belongs in a function, not a prompt, because LLM arithmetic errors are an avoidable risk on numbers feeding a board-level financial report. This sharpens the earlier extraction philosophy rather than contradicting it: the dividing line is interpretive task vs. mechanical calculation, not "AI vs. not AI."
**Where it shows up:** Post-extraction processing step (ai-extraction-design.md §4).
**Proves:** Software Engineering, Technical Decision-Making

## AI-Led Risk Status Diffing, Not String/Embedding Matching
**Decision:** Comparing a new document's extracted risks against the previously stored set (to set New/Updated/Unchanged) is its own AI call judging semantic equivalence, rather than a string-similarity or embedding-distance threshold.
**Philosophy:** Senus's own disclosures reword risks between reporting periods without changing their substance (the HY report references prior risks "in substance" rather than repeating them verbatim) — exactly the kind of paraphrasing a brittle similarity threshold would misjudge, while an LLM reading for meaning handles naturally. This is the same tool already trusted to interpret the original documents, applied to interpreting the relationship between two versions of the same disclosure.
**Where it shows up:** Risk diffing prompt (ai-extraction-design.md §5).
**Proves:** Software Engineering, Technical Decision-Making

## Validation via a Hand-Verified Golden Test Set
**Decision:** Before trusting the extraction pipeline's output generally, its results are checked against a small set of figures already read and verified manually during Buckets 1–2 (e.g. FY2025 revenue €836,991, H1 FY2026 revenue €354,813, FY2025 gross margin 77.5%).
**Philosophy:** The brief explicitly asks how outputs were validated — this is a concrete, honest answer rather than a vague claim of "spot-checking." A mismatch against a known-correct figure isolates the problem immediately (prompt or parsing bug, not ambiguous data), and this is exactly how a careful analyst would validate an automated process against ground truth they already trust.
**Where it shows up:** Testing/validation step (ai-extraction-design.md §6); README's "how I validated outputs" section.
**Proves:** Software Engineering, Technical Decision-Making

## RAG Document Q&A Deferred to Stretch Goal, Not Core Scope
**Decision:** A retrieval-augmented Q&A feature (chat-with-your-documents over the full unstructured text) is not part of the core 11 buckets. If time permits after the core report is complete, it's a stretch addition (Bucket 12), built on Postgres's `pgvector` extension rather than a separate vector database.
**Philosophy:** Most of what RAG is useful for — answering questions about specific facts — is already served by the structured `disclosures` table from AI extraction. Full RAG only adds value for prose that never gets extracted into a structured field (e.g. narrative detail on R&D partnerships). That's real value, but it's a separate subsystem layered on top of a Board Report, not the Board Report itself — building it before the core deliverable is solid would be a timeboxing mistake for a solo, non-CS-background candidate.
**Where it shows up:** Deferred; not present in the current bucket plan.
**Proves:** Technical Decision-Making (recognising scope boundaries)

## Derived Metrics Computed Once at Extraction, Not on Every Read
**Decision:** Gross margin, EBITDA margin, and other calculated ratios are computed once during the extraction pipeline run and stored as their own rows (flagged `derived: true`, referencing the raw rows they came from), rather than recalculated live every time the dashboard loads.
**Philosophy:** The pipeline is event-driven and batch-oriented — a document arrives, gets processed once — so there's no live-data justification for recomputing on every read, and doing so would spread the same formula across the API, frontend, and AI commentary prompt with real risk of drift between them. Storing the derived value once also gives a genuine audit trail (timestamped, traceable to its inputs) that directly answers the brief's question of how outputs were validated, rather than leaving the calculation invisible.
**Where it shows up:** `disclosures` table (schema-design.md §6); extraction pipeline's post-processing step.
**Proves:** Software Engineering, Technical Decision-Making

## Hybrid Schema: Fixed Columns + JSONB Payload (Not Pure Key-Value)
**Decision:** Implement the schema-on-read philosophy as two tables — `source_documents` and a single `disclosures` table with a `record_type` discriminator ('metric' / 'risk' / 'event'), fixed columns for what's shared across all record types (category, period, source, materiality, status), and a JSONB `payload` column for what varies by type.
**Philosophy:** A pure key-value store (everything as text triples) would lose real query power — "all risks with status = New" becomes a fragile string match instead of an indexable filter. A fully rigid schema would break the moment a new metric or fact type appears. The hybrid keeps a stable, queryable shell for the things every disclosure has in common, while leaving room in the payload for what's genuinely different between a revenue figure, a risk factor, and a leadership announcement — without needing a migration each time. This is the concrete technical answer to "how flexible is flexible," not just a restatement of the earlier principle.
**Where it shows up:** Database schema (`schema-design.md`); every audience view is implemented as a filtered query against the same `disclosures` table, not a separate data source per audience.
**Proves:** Software Engineering, Technical Decision-Making

## Senus's Own Product-Line Segmentation (Soil / ERA / Terrain), Not a Generic Channel Breakdown
**Decision:** Break down revenue and Enterprise Average Contract Value by Senus's actual product lines — SOIL, ERA, TERRAIN — rather than a generic "channel mix" or invented product category.
**Philosophy:** Senus already segments its own business this way in its disclosures (each line has its own launch date, target customer, and disclosed ACV — €12,309 Soil, €21,524 Terrain, €58,900 ERA in FY2025), so using their categories rather than a generic placeholder is a small but real signal of having read the source material closely rather than skimming it. This surfaced while double-checking an assumption that Terrain was an upcoming product — it's actually been live since October 2024 with a full year of data behind it — a good reminder to verify product details against the source documents rather than rely on general impressions of the company.
**Where it shows up:** Metric selection table (Business Understanding doc); extraction targets (Information Document + corporate presentation, since this breakdown isn't in the statutory financials).
**Proves:** Product Thinking, Technical Decision-Making

## AI Extraction, Not Rule-Based Parsing
**Decision:** Use an LLM to read source documents and extract structured financial data, rather than hardcoded rules per document/format.
**Philosophy:** Senus's own document set already shows why this matters in practice — the company changed its legal name mid-history (ADF Farm Solutions → Senus), reports both standalone and consolidated figures depending on period, and mixes audited and unaudited data. A rule-based parser would need a special case for every one of these; an AI-led extraction step interprets each document on its own terms and still produces consistent output. This isn't a shortcut — it's the correct match between the flexibility of the real-world data and the flexibility of the extraction method.
**Where it shows up:** Extraction pipeline (Bucket 4).
**Proves:** Software Engineering, Technical Decision-Making

## Explicit Data Quality Handling (Not Silent Assumptions)
**Decision:** Where source data is ambiguous (unaudited vs. audited, standalone vs. consolidated, missing OHLC values in share price data), the platform states the assumption rather than silently normalizing it away.
**Philosophy:** A board report that quietly smooths over data quality issues is less trustworthy than one that surfaces them. Given Senus is a real, currently-listed company, treating their actual disclosed distinctions (e.g. "unaudited") with the same rigor Senus itself uses in its own filings shows respect for the subject matter, not just technical competence.
**Where it shows up:** Data validation step; UI badges/flags on affected figures.
**Proves:** Software Engineering, Product Thinking

---

## Entries To Add As You Build
*(placeholders — fill in as each bucket progresses)*

- [x] ~~How the login/auth flow was implemented and why that level of realism was chosen~~ → see "Single Login, View Switcher" above
- [x] ~~How risk disclosures are extracted and flagged (new / unchanged / updated per period)~~ → see "Risk Register: Category + Materiality Order + Status Flag" above
- [ ] Choice of Replit as the hosting/dev environment
- [ ] Choice of Claude specifically for extraction + commentary (vs. other LLMs)
- [ ] Any specific chart/visualization choices for growth, margin, cash metrics
- [ ] How negative EBITDA / loss-making periods are handled in ratio displays
- [ ] Final decision on public vs. private repo/demo (pending Assiduous's answer on data sensitivity)
- [ ] Any commentary tone/style decisions for the AI-generated insights

---

## How to Use This During the Demo

Don't describe features. Narrate philosophy, then show the feature as proof of it. For example:

> "Because Senus's own reporting mixes audited and unaudited figures, the platform flags that distinction rather than hiding it — here you can see H1 FY26 marked as unaudited, exactly as Senus itself discloses it."

This does three things at once: shows the feature, shows you understood the source material deeply, and shows deliberate technical judgment — all in one sentence.
