# Schema Design — Senus PLC Board Report

## 1. Design Goal

Turn the "schema-on-read" philosophy (Bucket 1) into an actual, queryable database schema — flexible enough to hold three very different kinds of facts (numeric metrics, qualitative risks, one-off events) without a schema migration every time a new kind of fact appears, but structured enough to write real SQL against.

## 2. Why Hybrid (Relational Shell + JSONB Payload), Not Pure Key-Value or Pure Rigid Columns

Three options were considered:

| Approach | Problem |
|---|---|
| Fully rigid columns (one column per metric) | Breaks the moment a new metric type appears (e.g. Senus 2030 introduces a KPI nobody extracted for before); can't hold risk/event records at all without separate, disconnected tables |
| Pure key-value (`entity, attribute, value` triples, all as text) | Loses the ability to filter/sort meaningfully — "show me all risks with status = New" becomes a fragile string match instead of a real query; loses type safety on numeric values |
| **Hybrid: fixed columns for what's shared, JSONB for what varies** | Chosen — see below |

The hybrid model keeps a stable, indexable, real column for everything that's common across *all* disclosure types (what period, what category, which document, how material, what status) — because those are the things you actually filter, sort, and group by in the UI. Everything that's genuinely different between a metric and a risk and an event goes into `payload`, a JSONB column, which Postgres can still query into when needed but doesn't force a schema change for.

**A filing cabinet analogy for why any schema exists at all.** "Schema-on-read" doesn't mean no structure — it means avoiding one specific kind of rigidity: a labelled drawer for every exact fact in advance (a "Revenue drawer," a "Cyber Risk drawer," a "Terrain ACV drawer"). That breaks the moment Senus's own reporting produces a fact that doesn't have a drawer yet. The opposite extreme — no cabinet at all, just a pile of loose paper — can't be searched, sorted, or queried; also not workable. What this schema does instead is use one drawer type (`disclosures`), with a label on the outside of each folder (category, period, record type) so things stay findable, while the *contents* of the folder are free-form. The AI decides what goes inside; the drawer itself doesn't care. This is the minimum scaffolding needed to store facts at all, deliberately kept thin so the interpretive work stays with the AI extraction step, not the database schema.

## 3. Tables

### `source_documents`
One row per source file. Directly implements the Bucket 2 inventory as live data rather than a static markdown table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `filename` | text | |
| `doc_type` | text | e.g. "Information Document", "Interim Results", "Press Release" |
| `period_covered` | text | e.g. "FY2025", "H1 FY2026", "2026-06-24" for point-in-time announcements |
| `audited` | boolean, nullable | null where audit status doesn't apply (e.g. press releases) |
| `in_scope` | boolean | mirrors the Bucket 2 scope decision |
| `uploaded_at` | timestamp | |

### `disclosures`
One row per extracted fact, of any type.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `source_document_id` | uuid (FK → source_documents) | traceability — every number/claim points back to its source |
| `record_type` | text | `'metric'` \| `'risk'` \| `'event'` |
| `category` | text | e.g. "Growth & Revenue", "Technology and IP", "Governance" |
| `period_label` | text, nullable | e.g. "FY2025", "H1 FY2026"; null for point-in-time events |
| `consolidation_basis` | text, nullable | `'standalone'` \| `'consolidated'` \| null — carries forward the Bucket 2 data quality flag |
| `product_line` | text, nullable | `'Soil'` \| `'ERA'` \| `'Terrain'` \| null (null = company-wide) |
| `materiality_rank` | int, nullable | mainly for risk records — preserves the Directors' own most-material-first ordering |
| `status` | text, nullable | mainly for risk records — `'New'` \| `'Updated'` \| `'Unchanged'` |
| `payload` | jsonb | type-specific fields, shape varies by `record_type` (see below) |
| `extracted_at` | timestamp | when the AI extraction step produced this row |

## 4. Payload Shape Per Record Type

Not enforced at the database level (that's the point of JSONB) but enforced at the application/extraction layer — the AI extraction prompt for each record type is responsible for producing a consistent shape.

**`metric`**
```json
{ "metric_name": "revenue", "value": 354813, "unit": "EUR", "comparative_value": 340931, "comparative_period": "H1 FY2025" }
```

**`risk`**
```json
{ "title": "Cyber security threats to customer data", "summary": "Plain-English 1-2 sentence summary, paraphrased from the source disclosure." }
```

**`event`**
```json
{ "title": "Leadership transition", "description": "Brendan Allen transitions to Vice Chairman by October 2026." }
```

## 5. How This Serves the Four Audiences

No audience has its own table or its own copy of data. A view is just a filtered query against `disclosures` — e.g. the Lenders view queries `category IN ('Cash & Liquidity', 'Solvency & Leverage', 'Financial and shares')`, the Board's risk register queries `record_type = 'risk' ORDER BY category, materiality_rank`. This is the database-level expression of the "one store, filtered four ways" diagram from earlier.

## 6. Derived Metrics: Computed Once at Extraction Time, Stored as Their Own Rows

**Decision:** Derived/calculated metrics (gross margin, EBITDA margin, cash runway, etc.) are computed once during the extraction pipeline run — not recalculated on every read — and stored as their own `metric` rows in `disclosures`, with `payload.derived: true` and a reference to the raw metric rows they were computed from.

**Why not compute on read instead:** The pipeline is event-driven and batch-oriented (a document arrives, gets processed once) — the underlying raw figures don't change between pipeline runs, so there's no live-data reason to recalculate on every dashboard load. Computing on read would also mean the same formula (e.g. gross profit ÷ revenue) has to live in three places — the API layer, the frontend, and the AI commentary prompt — with no benefit and a real risk of the three drifting out of sync. Storing the derived value once, at the point it's computed, also directly answers the brief's "how did you validate your outputs" question: the row carries its own extraction timestamp and points back to the raw inputs it was calculated from, giving a genuine audit trail rather than an invisible runtime calculation.

## 7. What's Still Open (Bucket 4)

- The actual extraction prompts that populate `payload` correctly and consistently per record type
- The comparison logic that sets `status` on risk records (New/Updated/Unchanged) by diffing against the previous period's rows
