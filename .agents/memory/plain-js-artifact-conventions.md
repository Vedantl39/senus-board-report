---
name: Plain-JS artifact conventions
description: How to run a no-TypeScript backend/frontend inside this TS/Orval/Drizzle-first pnpm workspace template when a project explicitly opts out.
---

Some products explicitly lock in plain Node.js/JavaScript (no TS, no build step, no Orval/Zod/Drizzle) and plain React JSX, overriding this workspace's default TS-first conventions. When that happens:

- `pnpm run typecheck` at the root only runs `typecheck` for packages that declare a `typecheck` script. A package with no TS (no `tsconfig.json`, no `typecheck` script) is simply skipped — this is correct behavior, not a broken check.
- `node --test <dir>/` (with a directory argument, trailing slash or not) failed to resolve on this environment's Node version (v24). Run bare `node --test` from the package root instead — it recursively auto-discovers `*.test.js` files without needing a path argument.
- The default react-vite artifact scaffold ships a full TypeScript + shadcn/ui component set (~60 `.tsx` files) plus Orval/Zod/`@workspace/api-client-react` wiring. For a plain-JS product, the fast path is: delete the whole `components/ui`, `hooks`, `pages` TS scaffold and workspace API-client dependency, keep only `.jsx`/`.js` entry files (`App.jsx`, `main.jsx`), rename `vite.config.ts` → `.js` (it rarely has real type annotations to strip), and drop `tsconfig.json` plus all `@types/*`/shadcn/radix devDependencies from `package.json`. Rebuilding UI from scratch is expected — Task/phase-based plans typically scope that to a later step.
- `pnpm-workspace.yaml`'s catalog does not include every common package (e.g. `pg` is absent) — when a package isn't in the catalog, pin an explicit version instead of using `catalog:`.
