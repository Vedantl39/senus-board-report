# Color Scheme Fix — Senus PLC Board Report

The current color scheme (purple/orange) doesn't match either brand. Please replace it with the following, which is measured directly from Senus's actual corporate presentation and their listing sponsor Assiduous's identity:

## Senus PLC identity (used for all report content — this should dominate the UI)
*Measured directly from senus.com — precise, not estimated.*
- Primary dark green (nav bar, headers, active states): `#023424`
- Teal accent (buttons, links, active tab background — matches Senus's own "Login"/"Contact Us" buttons): `#20887F`
- Warm cream (page background, replacing any white/gray backgrounds): `#F2EAD9`
- Text on dark: `#FFFFFF`
- Text on light: `#1A1A1A`

## Assiduous identity (used ONLY for the login screen and a small "Powered by Assiduous" mark — not the report content itself)
- Background: near-black `#1A1A1A`
- Accent: coral `#D85A30`
- Text: `#FFFFFF`

## Where each applies
- **Login screen**: Assiduous colors (dark background, coral button) — this is the platform's own shell, not Senus's content
- **Everything after login** (the actual board report — nav, metric cards, risk register, charts): Senus's green/teal/cream palette
- **Active states** (selected audience tab, active nav item): dark green `#023424` background with white text, OR teal `#20887F` (matching Senus's own button color) — replace whatever purple is currently used for this
- **Status pills on the risk register**: keep these semantically distinct from the brand palette — red-ish for "New", amber for "Updated", neutral gray for "Unchanged" — don't force these into green just because it's the brand color, since red/amber carry real meaning here

Please update the theme/CSS variables in one place (not scattered inline styles) so this is a single source of truth, and show me a screenshot of both the login screen and the Board view once updated.
