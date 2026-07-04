# Senus PLC Board Report

AI-native board reporting platform for Senus PLC (a natural capital software company), serving four audiences — Management, Board, Investors, Lenders — with disclosures, derived financial metrics, and AI-assisted document extraction.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (plain Node.js, no build step)
- `pnpm --filter @workspace/api-server run test` — run backend tests via `node --test`
- `pnpm --filter @workspace/board-report run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages (skips `api-server`/`board-report`, which are plain JS)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24
- **`artifacts/api-server`**: plain JavaScript (CommonJS), no TypeScript, no build step, no Orval/OpenAPI codegen, no Zod, no Drizzle. Express 5 + `pg` directly against Postgres.
- **`artifacts/board-report`**: React + Vite, plain `.jsx`/`.js` (no TypeScript).
- DB: PostgreSQL (Replit built-in), raw SQL via `pg` — schema-on-read design (see below).
- AI: Anthropic Claude via `@anthropic-ai/sdk` (Replit AI Integrations proxy), used in a later phase for document extraction.
- Testing: Node's built-in `node:test` runner only (no Jest).
- Auth: single-login only, no RBAC — session-based via `express-session`, gated by one shared password (`BOARD_REPORT_LOGIN_PASSWORD` secret) and `SESSION_SECRET`.

## Where things live

- `artifacts/api-server/src/metrics/deriveMetrics.js` — pure functions computing derived financial metrics (gross margin, EBITDA, working capital, cash runway, ROCE, etc.) from disclosure payloads. Copied verbatim from the user's spec; do not modify without checking `test/deriveMetrics.test.js` still passes.
- `artifacts/api-server/src/extraction/` — AI extraction pipeline (Phase 2): `taxonomy.js` (fixed raw-metric taxonomy + category lookup), `callClaudeJson.js` (low-level Claude call, retry-once-on-bad-JSON, throws `ClaudeExtractionError`), `extractMetrics.js`/`extractRisks.js`/`extractEvents.js` (per-type Claude prompts), `diffRiskStatus.js` (semantic New/Updated/Unchanged classification), `periodMonths.js` (infers 6/12-month period length from `period_label` for cash-runway calc), `persistExtraction.js` (transactional inserts), `extract.js` (orchestrator — gates risk/event extraction on doc metadata, wires everything together). No HTTP endpoints call this yet — extraction is triggered separately from the read API below.
- `artifacts/api-server/src/lib/disclosuresQuery.js` — the single shared query builder (`buildDisclosuresQuery`/`queryDisclosures`) behind every read endpoint. Always left-joins `source_documents` so every row carries `source_document_id`/`source_filename` for traceability. `categories` + `metricNames` filters are OR'd together (for audience views that need "these categories OR these specific metrics"); everything else ANDs.
- `artifacts/api-server/src/config/audienceViews.js` — declarative category/metric scoping per audience (`management`/`investors`/`lenders`), plus `BOARD_VIEW` for the board's metrics slice. Board also pulls the full risk register and event list directly in the route since it spans multiple `record_type`s.
- `artifacts/api-server/src/routes/` — `auth.js` (login/logout/session, public), `disclosures.js` (generic filtered query), `views.js` (4 audience endpoints), `risks.js` (risk register). All routes except `health` and `auth` sit behind `requireAuth` (see `src/middlewares/requireAuth.js`), wired in `routes/index.js`.
- `attached_assets/replit-build-prompt_1783199322997.md` — the original full build spec (verbatim DDL, taxonomy, phase breakdown). Source of truth for schema/behavior questions.
- `.local/tasks/task-*.md` — the 4-phase project task breakdown (Foundation & DB → AI extraction → Backend API → Frontend).
- `artifacts/board-report/src/api/client.js` — shared `fetch` wrapper (`credentials: "include"`, base `${BASE_URL}api`) used by every request; no Orval, plain `fetch`.
- `artifacts/board-report/src/context/AuthContext.jsx` — session state via `/api/session`, login/logout, gates the whole app (`LoginPage` vs `ReportShell`) in `App.jsx`.
- `artifacts/board-report/src/pages/ReportShell.jsx` + `src/pages/views/*View.jsx` — persistent audience switcher (Management/Board/Investors/Lenders) driving `useAudienceView` (`src/hooks/useAudienceView.js`), which fetches the matching `/api/views/{audience}` endpoint.
- `artifacts/board-report/src/components/RiskRegister.jsx` — groups risks by category, ordered by `materiality_rank`, with `StatusPill` badges (red/amber/gray for New/Updated/Unchanged).
- `artifacts/board-report/src/components/badges/` — `UnauditedBadge`, `ConsolidationBadge` (Consolidated/Standalone), `StatusPill`, reused across `MetricsTable`/`RiskRegister`/`EventList`.
- `artifacts/board-report/src/index.css` — three theme layers: `:root` (base tokens), `.theme-senus` (Safestack-inspired purple/coral/orange identity — purple primary, coral secondary, orange accent, Lato body + Work Sans headings via `--app-font-heading`/`font-heading` — layered on top of `:root` for the post-login report UI only), and `.dark` (Assiduous dark/coral, login screen only, untouched by the report redesign since it never carries `.theme-senus`). Wrapper classes applied in `App.jsx`.

## Architecture decisions

- **This product deliberately overrides the workspace's default conventions.** The rest of the monorepo template favors TypeScript + Orval/OpenAPI/Zod/Drizzle; this product does not use any of that. Do not "fix" `api-server`/`board-report` back toward TS or add Orval/Zod/Drizzle — that's an explicit, locked-in user decision, not an oversight.
- **Schema-on-read DB design**: only two tables — `source_documents` and `disclosures` (with a JSONB `payload` column). New disclosure fields are added by writing new keys into `payload`, not by altering table structure.
- `board-report` frontend was scaffolded from the default react-vite template (which ships a full TS/shadcn component set) and then stripped down to a minimal plain-JSX shell; UI is intentionally minimal until the frontend phase builds it out.

## Product

Four-audience board reporting app (Management, Board, Investors, Lenders) built on structured disclosures extracted from source documents, with AI-derived metrics and (in later phases) a document extraction pipeline and dashboards per audience.

## User preferences

- Backend must stay plain Node.js/JavaScript — no TypeScript, no build step, no Orval/OpenAPI codegen, no Zod, no Drizzle ORM. Use `pg` directly.
- Frontend must stay plain JS/JSX — no TypeScript.
- Tests must use Node's built-in `node:test` runner only — do not introduce Jest or other test frameworks.
- Auth is single-login only; no role-based access control.
- User wants to review the DB schema before later phases proceed (done for Phase 1 — two tables, three indexes on `disclosures`).

## Gotchas

- `node --test test/` (with a directory arg) fails to resolve on this Node version — run bare `node --test` from the package root instead; it auto-discovers `*.test.js` files recursively.
- `pnpm run typecheck` at the root only typechecks packages that have a `typecheck` script; `api-server` and `board-report` intentionally have none since they're plain JS — this is expected, not a gap.
- No `"pg"` catalog entry exists in `pnpm-workspace.yaml`; `api-server` pins an explicit `pg` version instead of `catalog:`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
