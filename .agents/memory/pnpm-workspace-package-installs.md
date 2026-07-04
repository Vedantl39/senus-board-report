---
name: pnpm workspace subpackage installs
description: installLanguagePackages's cwd param doesn't reliably scope pnpm add to a workspace subpackage
---

Calling `installLanguagePackages` with `packageManagerType: "nodejs"` and a
`cwd` pointing at a workspace subpackage (e.g. `artifacts/api-server`) can
still run `pnpm add` unscoped, which pnpm then refuses with
`ERR_PNPM_ADDING_TO_ROOT` inside a workspace.

**Why:** the tool's `cwd` handling doesn't always translate into pnpm's
`--filter`/workspace-root semantics, so a plain `pnpm add <pkg>` runs from
the workspace root instead of the intended package directory.

**How to apply:** if this error appears, don't retry the same call. Instead,
add the dependency line directly to the target package's `package.json`
(matching existing version-pinning style) and run
`pnpm install --filter @workspace/<name>` from the repo root.
