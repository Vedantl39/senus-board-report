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
- `artifacts/board-report/src/components/badges/` — `UnauditedBadge`, `ConsolidationBadge` (renders whatever free-text scope string `consolidation_basis` holds, e.g. "Consolidated (excl. Loamin)" — no longer a binary Consolidated/Standalone badge), `StatusPill`, reused across `MetricsTable`/`RiskRegister`/`EventList`.
- `artifacts/board-report/src/index.css` — three theme layers: `:root` (base tokens), `.theme-senus` (Senus PLC identity measured from senus.com — dark green `#023424` primary/nav, teal `#20887F` secondary/accent, warm cream `#F2EAD9` background, Lato body + Work Sans headings via `--app-font-heading`/`font-heading` — layered on top of `:root` for the post-login report UI only), and `.dark` (Assiduous dark/coral, login screen only, untouched by the report redesign since it never carries `.theme-senus`). `StatusPill` (New/Updated/Unchanged) deliberately uses hardcoded semantic red/amber/gray, independent of the brand palette. Wrapper classes applied in `App.jsx`.
- `artifacts/api-server/scripts/seed.js` (`pnpm --filter @workspace/api-server run db:seed`) — **superseded, no longer the source of live data** (see "Real extraction pipeline is now live" below). Kept only as the original hand-verified golden reference used to validate the real extraction pipeline (`compareExtractionToGolden.js`); do not run it against the live tables anymore, it would overwrite real-extraction data with the smaller hand-picked seed set.
- `artifacts/api-server/scripts/runRealExtraction.js` — runs the real Claude extraction pipeline (`src/extraction/`) against actual uploaded PDFs (`attached_assets/`) into `*_staging` tables (never touches live `disclosures`/`source_documents`). Each doc takes ~30-110s of real Claude calls — run one doc per invocation (`node scripts/runRealExtraction.js [--reset] <docIndex 0-3>`); background/detached processes get killed in this sandbox, so this must run synchronously per doc, not in one batched/backgrounded call. Skips scanned/image-only PDFs (no text layer) automatically.
- `artifacts/api-server/scripts/compareExtractionToGolden.js` — diffs staging extraction output against the seed.js golden figures; used once to validate the pipeline before the live swap (20/20 checked figures matched exactly). Two real extraction bugs it caught and that got fixed: ratio-metric raw values (`share_option_pool_percentage` etc. — see `RATIO_RAW_METRIC_NAMES` in `taxonomy.js`) and risk categories drifting to a document's own headers instead of the fixed taxonomy (`RISK_CATEGORIES` in `taxonomy.js`, now validated/thrown on).
- `artifacts/api-server/scripts/swapToRealExtraction.js` — the one-time, all-or-nothing swap script: wipes live `disclosures`+`source_documents` and repopulates them from the validated `*_staging` tables inside a single transaction (rolls back entirely on any failure, never partial). **Already run once** — live data now comes from real Claude extraction of the actual uploaded PDFs, not from `seed.js`.

### Real extraction pipeline is now live
As of the swap, `disclosures`/`source_documents` are populated from real Claude extraction over 4 real source PDFs (Information Document → FY2025, Half Year Results PR → H1 FY2026, Direct Listing PR, Leadership Transition PR; 3 other uploaded PDFs were scanned/image-only and skipped). Live counts: 68 metrics, 35 risks (full register), 17 events. `consolidation_basis` is now **free text describing actual scope**, not a binary standalone/consolidated flag — e.g. FY2025 = `"Consolidated (excl. Loamin)"`, H1 FY2026 = `"Consolidated (incl. Loamin, acquired Nov 2025)"` (Loamin was acquired Nov 2025, so only H1 FY2026 consolidates it). The DB `CHECK` constraint restricting this column to `standalone`/`consolidated` was dropped in `db/migrations/003_relax_consolidation_basis.sql`; `ConsolidationBadge.jsx` renders whatever string is stored as-is instead of mapping to a binary badge.
- `artifacts/board-report/src/components/kpi/` (`HeroKpiStrip`, `KpiCard`, `TrendArrow`) — hero KPI cards for the latest period, each with a traceability `Tooltip` (source doc + audited status) and a comparative-period trend arrow.
- `artifacts/board-report/src/components/charts/` (`RevenueTrendChart`, `EbitdaWaterfallChart`) — Recharts visualizations. The EBITDA bridge is a true waterfall built entirely from real disclosed/derived line items (revenue, gross profit, operating profit/loss, D&A, EBITDA) for whichever period has all of them — no invented figures.
- `artifacts/board-report/src/components/Tooltip.jsx` — shared lightweight hover/focus tooltip (no extra dependency) used for traceability throughout `MetricsTable` and the KPI cards.
- `artifacts/board-report/src/components/EmptyState.jsx` — styled empty state (icon + title + description) replacing plain "No data" text in `MetricsTable` and `RiskRegister`.
- `attached_assets/senus_logo_trimmed.png` — the real Senus PLC logo lockup, background-removed and tightly cropped so it blends seamlessly into the dark green `TopNav` header (which shares the same brand green); imported via the `@assets` Vite alias in `TopNav.jsx`, replacing the plain "Senus PLC" text.
- `artifacts/board-report/src/pages/LoginPage.jsx` — login screen (`.theme-assiduous.dark`) shows the real Assiduous logo, tightly cropped to `attached_assets/assiduous_logo_trimmed.png` (the original attached file has its own baked-in navy background plus a lot of uniform padding around the mark — cropped rather than just relying on CSS margins, so the logo reads large without an oversized gap before the heading). `.dark`'s `--background` in `index.css` is set to the exact navy measured from the logo (`#121826` → `hsl(222 36% 11%)`) so the image blends with no visible edge; the old placeholder orange coral (`16 90% 60%`) was replaced everywhere in `.dark` with the logo's real coral (`#EB3C4D` → `hsl(354 81% 58%)`) for `--primary`/`--accent`/`--ring`/`--sidebar-primary`/`--sidebar-ring`/`--chart-1`.

## Architecture decisions

- **This product deliberately overrides the workspace's default conventions.** The rest of the monorepo template favors TypeScript + Orval/OpenAPI/Zod/Drizzle; this product does not use any of that. Do not "fix" `api-server`/`board-report` back toward TS or add Orval/Zod/Drizzle — that's an explicit, locked-in user decision, not an oversight.
- **Schema-on-read DB design**: only two tables — `source_documents` and `disclosures` (with a JSONB `payload` column). New disclosure fields are added by writing new keys into `payload`, not by altering table structure.
- `board-report` frontend was scaffolded from the default react-vite template (which ships a full TS/shadcn component set) and then stripped down to a minimal plain-JSX shell; UI is intentionally minimal until the frontend phase builds it out.

## Product

Four-audience board reporting app (Management, Board, Investors, Lenders) built on structured disclosures extracted from source documents, with AI-derived metrics and a real AI document-extraction pipeline (Claude reads actual uploaded PDFs) feeding the live dashboards per audience — no more manually-seeded figures in the live tables.

## User preferences

- Backend must stay plain Node.js/JavaScript — no TypeScript, no build step, no Orval/OpenAPI codegen, no Zod, no Drizzle ORM. Use `pg` directly.
- Frontend must stay plain JS/JSX — no TypeScript.
- Tests must use Node's built-in `node:test` runner only — do not introduce Jest or other test frameworks.
- Auth is single-login only; no role-based access control.
- User wants to review the DB schema before later phases proceed (done for Phase 1 — two tables, three indexes on `disclosures`).
- `consolidation_basis` must describe actual reporting scope in free text (e.g. "Consolidated (excl. Loamin)"), never a binary standalone/consolidated flag — per-period consolidation scope can differ (e.g. an acquisition mid-year), and a binary label would misrepresent that.
- Any change to live disclosure data must go through a staged validate-then-swap process (extract into `*_staging`, diff against a golden/known-correct reference, only then run one clean all-or-nothing transaction into the live tables) — never write directly to live `disclosures`/`source_documents` from an unverified extraction run.

## Gotchas

- `node --test test/` (with a directory arg) fails to resolve on this Node version — run bare `node --test` from the package root instead; it auto-discovers `*.test.js` files recursively.
- `pnpm run typecheck` at the root only typechecks packages that have a `typecheck` script; `api-server` and `board-report` intentionally have none since they're plain JS — this is expected, not a gap.
- No `"pg"` catalog entry exists in `pnpm-workspace.yaml`; `api-server` pins an explicit `pg` version instead of `catalog:`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
