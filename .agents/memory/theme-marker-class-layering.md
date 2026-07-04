---
name: Scoping a brand-inspired redesign to part of an app via marker classes
description: How to add a second visual identity to one section of an app without touching another section that shares the same CSS variable system
---

When an app has two visually distinct sections sharing one CSS-custom-property-driven theme system (e.g. a Tailwind `@theme inline` mapping to `--color-*` vars declared in `:root`), and only one section needs a brand-inspired redesign:

- Add a new class (e.g. `.theme-<brand>`) that redeclares only the CSS custom properties for that section, layered as a sibling rule after `:root` — do not edit `:root` itself or any other section's override class (e.g. `.dark` used elsewhere).
- Because CSS custom properties cascade, a wrapper div with the new marker class overrides inherited `:root` values for everything inside it, while elements outside that wrapper (e.g. a differently-themed login screen) are unaffected even though both read from the same variable names.
- If the redesign needs a second font family for headings, add a new token (e.g. `--app-font-heading`) mapped into the `@theme inline` block as `--font-heading`, then apply it via a small heading-selector rule (`.theme-x h1, h2, h3, h4 { font-family: var(--app-font-heading); }`) rather than hardcoding it in every component.

**Why:** this keeps a brand redesign fully additive and low-risk — no diff on the untouched section's theme block — and matches how the user distinguishes "redesign the report UI but leave the login screen as-is" type requests.

**How to apply:** when asked to reskin one screen/section of an app that shares a theme file with another screen the user wants untouched, search for the existing per-section marker classes first (they often already exist as unstyled markers) before writing new global CSS.
