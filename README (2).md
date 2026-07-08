# Senus PLC Board Report — AI-Native Board Reporting Platform

An interactive board report for Senus PLC (a real, recently-listed Irish natural capital management software company) built for four distinct audiences — Management, the Board, Equity Investors, and Credit Providers — from a single underlying data model, with AI-led extraction and commentary throughout.

Built for the Assiduous Technology Graduate Assessment.

## What this is

Senus's financial and corporate disclosures — annual accounts, half-year results, listing documents, press releases — are scattered across 17 source documents in inconsistent formats. This platform turns them into a single, interactive board report where the same underlying facts are filtered differently depending on who's looking: a lender cares about liquidity, an equity investor cares about growth, a board member needs a strategic overview with a risk register attached.

## Architecture at a glance

```
Source documents (PDF/xlsx)
        ↓
AI extraction (Claude API — one prompt per record type: metric / risk / event)
        ↓
disclosures table (schema-on-read: fixed columns + JSONB payload)
        ↓
Derived metrics computed in code (never by the LLM) — gross margin, EBITDA, ROCE, etc.
        ↓
Backend API — one route per audience, driven by a config map, not four duplicated handlers
        ↓
React frontend — single login, persistent view switcher (Management/Board/Investors/Lenders)
```

Two tables power the entire data layer: `source_documents` and `disclosures`. Every extracted fact — whether a revenue figure, a disclosed risk, or a corporate announcement — is one row in `disclosures`, distinguished by a `record_type` column, with a flexible JSON `payload` for whatever's specific to that type. This is deliberately thin scaffolding, not a rigid schema-per-metric design — new KPIs Senus discloses in future reports don't require a schema migration.

## Scalability and Data Modelling

**Data modelling.** The schema is intentionally two tables, not twenty (see `schema-design.md`): `source_documents` and `disclosures`, with a `record_type` discriminator (metric/risk/event) and a JSONB `payload` for what varies by type. This is a hybrid relational/document model — fixed columns for what's always filterable (category, period, materiality, status), flexible payload for what's type-specific. This scales along the dimension that actually matters for this domain: **new kinds of disclosed facts** (a new KPI Senus introduces, a new risk category, a new event type) require zero schema migration, just a new payload shape.

**Backend APIs.** Every audience view is a config entry in `viewDefinitions.js`, not a bespoke route — adding a fifth audience is a data change, not new route code. All database access goes through a swappable repository interface (`disclosuresRepository.js`), which is what allowed the entire API layer to be built and tested against real HTTP requests before a production database even existed.

**What scales as-is, and what would need to change with real growth:**
- **More documents / more history**: scales cleanly — each document is one `source_documents` row and N `disclosures` rows; there's no per-document special-casing anywhere in the pipeline.
- **More concurrent users**: the current single-login model (see Philosophy Log) is a deliberate scope choice for a single-company, single-tenant assessment context, not a technical ceiling — the same schema and API would support real multi-user auth by adding a `users`/`sessions` table and per-endpoint permission checks without touching the data model.
- **More companies / multi-tenant use**: would need a `company_id` on both tables and tenant-scoped queries — a real change, not a redesign, because the schema was already built as "one flexible store," not "one hardcoded Senus-shaped store."
- **Higher extraction volume**: currently synchronous, per-document API calls. At real scale this would move to a queue (a document lands, a job is enqueued, extraction runs async) — the extraction functions themselves wouldn't need to change, only how they're triggered.

The honest scoping principle throughout: build the simplest version that's still architecturally correct for growth, rather than either over-engineering for scale this assessment doesn't need, or building something that would need a rewrite to handle real growth. See the Philosophy Log's "Single Login, View Switcher" and "Hybrid Schema" entries for the reasoning behind where that line was drawn.

## Tech stack

- **Backend:** Plain Node.js/JavaScript — no TypeScript, no build step
- **Frontend:** React
- **Database:** PostgreSQL (Replit's built-in Postgres)
- **AI:** Anthropic Claude API — document extraction, risk status comparison, commentary generation
- **Testing:** Node's built-in `node:test` runner — no external test framework
- **Hosting:** Replit (single Express server serving both the API and the built frontend — no SSR, since this is a login-gated internal tool with no public content to optimize for)

Every one of these choices was deliberate, not default — see the Philosophy Log for the reasoning behind each.

**A note on this repo's GitHub language statistics:** GitHub reports this repository as roughly half TypeScript. That figure comes entirely from unused workspace-template scaffolding (`lib/api-client-react`, `lib/api-zod`, `lib/db`, `scripts/src/hello.ts`) and a separate design-prototyping tool (`artifacts/mockup-sandbox`) that ships with the development environment — neither is imported by, nor part of, the actual application. The real product (`artifacts/api-server` and `artifacts/board-report`) is 100% plain JavaScript, exactly as documented above.

## Key design decisions (highlights — full reasoning in `philosophy-log.md`)

- **Single login with a view switcher, not multi-account role-based access.** The brief describes a platform a CEO logs into, not a multi-tenant system serving external investors and lenders who need to be gated from each other. Building real RBAC would spend disproportionate time on a dimension not being evaluated.
- **Arithmetic in code, interpretation in AI.** Derived ratios (gross margin, EBITDA, ROCE) are calculated by deterministic functions reading raw extracted figures — never by asking an LLM to do division. Judging whether a reworded risk disclosure means the same thing as a prior one *is* an interpretive task and stays with the AI.
- **A code-level grounding check on AI commentary**, not just a prompt instruction. Every number in generated commentary is extracted and checked against the actual source data after generation — a prompt instruction can be ignored, this cannot.
- **A hand-verified golden test set**, not just unit tests in the abstract. Figures were read directly from the source PDFs before any extraction code was written, and the pipeline's output is checked against them. This caught two real bugs during development (a `null`/`undefined` handling bug in the metrics calculator, and a rounding-tolerance bug in the commentary validator).
- **Explicit data quality handling, never silent normalization.** Unaudited figures, consolidation basis changes (standalone vs. consolidated), and mismatched period lengths are flagged, not hidden. This caught a real bug in the deployed dashboard — a KPI card showing "▼57.6% decline" by comparing 6 months of revenue against 12 months, when the true H1-vs-H1 comparison shows +4.1% growth.

## Data scope and assumptions

Full document-by-document inventory and 8 explicit data quality issues are in `data-understanding.md`. Headlines:

- Two genuinely comparable financial periods exist: FY2025 (audited, standalone) and H1 FY2026 (unaudited, consolidated) — the consolidation basis difference (Loamin acquisition) is tracked, not blended away.
- Month-over-month figures are not available — Senus reports annually/semi-annually only.
- Bookings ARE disclosed (€700k closed pipeline, €500k open, H1 FY2026) — an earlier internal review incorrectly assumed otherwise; caught and corrected during a deep re-read of every source document before implementation.
- No direct commercial competitor has been identified for Senus — the market position is treated as genuine white space, not forced into a comparison that doesn't exist.

## Validation approach

1. **Golden test set** — key figures (FY2025 revenue €836,991, H1 FY2026 revenue €354,813, gross margins, cash balance) were hand-verified from the source PDFs before writing extraction code. Pipeline output is checked against these first.
2. **Automated tests** — 26+ tests across the derived metrics calculator, the commentary grounding validator, and the API layer (real HTTP integration tests against a running server, not mocked).
3. **A deliberate fabrication test** — the commentary validator is proven to work by feeding it commentary with an invented number and confirming it gets rejected, not just asserting it "should" catch fabrication.
4. **An explicit assignment alignment check** — every metric category named in the brief was checked against the design before implementation began, which caught unwritten derived metric formulas (EBITDA margin, cash runway, working capital, ROCE) and confirmed two genuine scope exclusions (MoM, initially-miscategorized bookings).

## What's deferred, and why

- **RAG / chat-with-documents** — a real, useful feature, but a separate subsystem from the core deliverable (a board report, not a chatbot). Flagged as a stretch goal, not core scope, given a solo timeboxed build.
- **Full role-based access control** — see the single-login decision above.

## Repository structure

This is a monorepo — the two real applications live under `artifacts/`, nested per this workspace's standard convention rather than at the repo root:

```
artifacts/
  api-server/                       — backend (plain JS, Express)
    src/metrics/deriveMetrics.js    — derived ratio calculations (tested against golden test set)
    src/commentary/                 — AI commentary prompt builder + grounding validator
    src/extraction/                 — real Claude-API document extraction pipeline
    src/routes/                     — Express routes, audience view definitions
    src/lib/, src/config/, src/middlewares/
    test/                           — 98 tests, run with `npm test`
  board-report/                     — frontend (plain JSX, Vite/React)
    src/api/client.js               — frontend API client (tested)
    src/components/                 — RiskRegister, ViewSwitcher, MetricCard
  mockup-sandbox/                   — design/prototyping tool (TypeScript) — not part of the product;
                                       see the note above on this repo's GitHub language statistics
attached_assets/                    — the 17 real Senus source PDFs/xlsx files, plus original spec prompts
lib/, scripts/                      — unused workspace-template scaffolding (Orval/Zod/Drizzle codegen),
                                       never imported by either real application — inert, not part of the product
philosophy-log.md                   — every architectural/product decision, with reasoning
business-understanding.md           — audience framing, success criteria, metric selection
data-understanding.md               — full document inventory and data quality issues
schema-design.md                    — the disclosures/source_documents schema and rationale
ai-extraction-design.md             — extraction prompts, derived metric formulas, error handling
assignment-alignment-check.md       — brief-vs-design audit performed before implementation
one-page-writeup.md                 — condensed project summary
```

## Running locally

```
npm install
npm test              # run the backend test suite
node src/index.js     # start the API server (requires DATABASE_URL, ANTHROPIC_API_KEY)

cd frontend
npm install
npm test               # run the frontend test suite
npm start               # start the dev frontend
```

## How AI was used in building this

Every architectural and product decision in this project was made through iterative discussion with Claude, then implemented, tested, and — critically — checked against real data and the actual assignment brief rather than accepted on first pass. The Philosophy Log documents each decision with its reasoning, including several places where an initial assumption was wrong and caught before being built (an incorrect belief that bookings weren't disclosed; a guessed color scheme later corrected against the real brand assets; a misleading period comparison caught on the live deployed dashboard). Nothing here was accepted without being checked against the actual source documents or actual running code.
