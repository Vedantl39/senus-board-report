# Build Prompt for Replit Agent — Senus PLC Board Report Platform

I'm building an AI-native "Board Report" platform for Senus PLC (a real, recently-listed Irish natural capital software company) as a technical assessment. I've already done extensive design work — please follow it precisely rather than substituting your own architectural choices. Work through the phases below **in order**, and pause after each phase for me to review before continuing to the next.

## Project Context

Senus PLC is an early-stage, loss-making, recently-listed (Euronext Access Dublin, Dec 2025) natural capital management software company. This platform turns their financial disclosures into an interactive board report serving four audiences: Management, the Board, Equity Investors, and Credit Providers ("Lenders" in the UI).

## Tech Stack (already decided — do not substitute)

- **Backend:** Plain Node.js/JavaScript, no TypeScript, no build step
- **Frontend:** React
- **Database:** PostgreSQL (Replit's built-in Postgres)
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk`) for document extraction and commentary generation
- **Testing:** Node's built-in `node:test` runner — do not install Jest or another test framework
- **Auth:** Single login only (no multi-user/role-based auth system) — see Phase 4

I already have a working, tested module at `src/metrics/deriveMetrics.js` (with `test/deriveMetrics.test.js` passing 10/10). **Do not rewrite this file** — the database and API should call its exported functions (`computeDerivedMetrics`, `grossMargin`, `ebitda`, `workingCapital`, `cashRunwayMonths`, `roce`, `totalAssets`, `operatingMargin`, `ebitdaMargin`).

---

## Phase 1: Database Schema

Create exactly two tables (this is a deliberate schema-on-read design — do not add per-metric columns or additional tables without asking):

```sql
CREATE TABLE source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  period_covered TEXT,
  audited BOOLEAN,
  in_scope BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES source_documents(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('metric', 'risk', 'event')),
  category TEXT NOT NULL,
  period_label TEXT,
  consolidation_basis TEXT CHECK (consolidation_basis IN ('standalone', 'consolidated') OR consolidation_basis IS NULL),
  product_line TEXT CHECK (product_line IN ('Soil', 'ERA', 'Terrain') OR product_line IS NULL),
  materiality_rank INTEGER,
  status TEXT CHECK (status IN ('New', 'Updated', 'Unchanged') OR status IS NULL),
  payload JSONB NOT NULL,
  extracted_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_disclosures_record_type ON disclosures(record_type);
CREATE INDEX idx_disclosures_category ON disclosures(category);
CREATE INDEX idx_disclosures_period ON disclosures(period_label);
```

Payload shapes by `record_type` (not enforced at DB level, enforce in application code):
- `metric`: `{ "metric_name": string, "value": number, "unit": "EUR"|"GBP", "comparative_value": number|null, "comparative_period": string|null, "derived": boolean }`
- `risk`: `{ "title": string, "summary": string }`
- `event`: `{ "title": string, "description": string }`

## Phase 2: Raw Metric Taxonomy (for extraction prompts in Phase 3)

**Growth & Revenue:** `revenue`, `enterprise_customer_count`, `independent_customer_count`, `rd_customer_count`, `acv_enterprise_soil`, `acv_enterprise_era`, `acv_enterprise_terrain`, `pipeline_bookings_closed_value`, `pipeline_open_value`, `pipeline_deals_closed_count`

**Profitability:** `cost_of_sales`, `gross_profit`, `administrative_expenses`, `other_operating_income`, `operating_profit_loss`, `profit_loss_before_tax`, `profit_loss_after_tax`

**Cash & Liquidity:** `cash_and_equivalents`, `cash_at_period_start`, `net_cash_operating_activities`, `net_cash_investing_activities`, `net_cash_financing_activities`, `debtors`, `creditors_due_within_one_year`, `creditors_due_after_one_year`, `depreciation_amortization`

**Solvency/Balance Sheet:** `net_assets_liabilities`, `called_up_share_capital`, `share_premium`, `retained_earnings`, `goodwill`, `development_costs`, `tangible_assets`, `contingent_consideration`

**Returns/Market:** `share_price_close`, `share_price_open`, `share_price_high`, `share_price_low`, `share_price_volume`, `admission_price`, `share_option_pool_percentage`

Derived metrics (computed by `deriveMetrics.js`, NOT by the LLM): `gross_margin`, `operating_margin`, `total_assets`, `ebitda`, `ebitda_margin`, `working_capital`, `cash_runway_months`, `roce`

## Phase 3: AI Extraction Pipeline

Build a script (e.g. `src/extraction/extract.js`) that takes a document's raw text and its metadata (`doc_type`, `period_label`, `consolidation_basis`, `audited` — passed in programmatically, never asked of the LLM) and runs up to 4 separate Claude API calls:

**3a. Metric extraction** — only recognise metric names from the Phase 2 taxonomy. Prompt Claude to return ONLY a JSON array of `{metric_name, value, unit, comparative_value, comparative_period}`. Do not ask it to calculate any ratios — raw figures only.

**3b. Risk extraction** — only run if the document has a risk factors section. Return ONLY a JSON array of `{category, title, summary}` preserving the source's own order within each category (this order becomes `materiality_rank` — assign it in code as the array index, not asked of the LLM).

**3c. Event extraction** — only run on press releases/announcements. Return ONLY a JSON array of `{title, description}`.

**3d. Risk status diffing** — only run if risk records exist from a prior document. Give Claude both the PREVIOUS stored risks and the CURRENT extraction, ask it to classify each CURRENT item as `"New"`, `"Updated"`, or `"Unchanged"` by semantic meaning (risks get reworded between periods without changing substance — do not use string-matching or embedding similarity for this).

**Error handling:** if a response isn't valid JSON, retry once with the parse error fed back to the model. If it fails twice, mark that document's extraction as failed and log the raw response — do not store partial/guessed data.

**After extraction:** insert raw metric rows, then call `computeDerivedMetrics()` from the existing module and insert the derived rows with `payload.derived: true`. Both raw and derived inserts for one document should happen in a single database transaction.

## Phase 4: Backend API

Single login (no per-role accounts, no RBAC) — build a simple session/auth check representing "logged into the platform," not per-audience gating. Build these endpoints:

- `GET /api/disclosures?record_type=metric&category=X&period_label=Y` — generic filtered query against `disclosures`
- `GET /api/views/management` — pre-filtered query for the Management audience (Growth & Revenue, Profitability line items, cash burn)
- `GET /api/views/board` — pre-filtered for Board (high-level P&L trend, cash position, risk register, governance events)
- `GET /api/views/investors` — pre-filtered for Equity Investors (growth vs. CAGR target, ROCE, share price, dilution)
- `GET /api/views/lenders` — pre-filtered for Credit Providers (cash/liquidity, working capital, going-concern-relevant items)
- `GET /api/risks?status=New` — risk register, filterable by status, ordered by category then materiality_rank

Every endpoint's response should include the `source_document_id` (or resolved filename) for each fact returned, for traceability.

## Phase 5: Frontend

- Single login screen using Assiduous's visual identity (dark/coral)
- Post-login: Senus's own visual identity (natural/earth tones) for the actual report content
- A persistent top-nav view switcher: Management / Board / Investors / Lenders — switches the filtered view, not the login
- Top-level navigation follows Senus's own "Measure → Report → Verify" framing, not a generic "Overview/Metrics/Reports" structure
- Board view includes the Risk Register component: grouped by category, ordered by materiality, with a status pill (red=New, amber=Updated, gray=Unchanged)
- Any figure sourced from an unaudited document should show a visible "unaudited" badge
- Any figure from a consolidated-vs-standalone period should be labelled with its consolidation basis

## What NOT to Build

- No RAG/chat-with-documents feature (explicitly deferred as a stretch goal, not core scope)
- No multi-user authentication or role-based access control
- No fabricated metrics for things Senus doesn't disclose (e.g. no monthly financials — Senus reports FY/HY only)
- Don't let the LLM perform arithmetic — all ratio/derived calculations go through `deriveMetrics.js`

---

Please confirm you've read this in full and start with Phase 1 (database schema). Show me the created tables before moving to Phase 2.
