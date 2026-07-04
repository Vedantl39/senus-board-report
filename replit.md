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
- Auth: single-login only, no RBAC (planned for a later phase).

## Where things live

- `artifacts/api-server/src/metrics/deriveMetrics.js` — pure functions computing derived financial metrics (gross margin, EBITDA, working capital, cash runway, ROCE, etc.) from disclosure payloads. Copied verbatim from the user's spec; do not modify without checking `test/deriveMetrics.test.js` still passes.
- `attached_assets/replit-build-prompt_1783199322997.md` — the original full build spec (verbatim DDL, taxonomy, phase breakdown). Source of truth for schema/behavior questions.
- `.local/tasks/task-*.md` — the 4-phase project task breakdown (Foundation & DB → AI extraction → Backend API → Frontend).

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
