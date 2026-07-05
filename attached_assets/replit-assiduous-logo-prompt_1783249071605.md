# Add the Real Assiduous Logo to the Login Screen

I've attached the actual Assiduous logo file — it already has its own dark navy background baked into the image (it's not a transparent asset), so **do not put it on a white background**. Instead, match the page background to the logo's own background so it blends in seamlessly with no visible edge.

## Exact colors, measured directly from the logo file

- Background navy: `#121826`
- Coral/red mark: `#EB3C4D`
- Off-white text: `#F0F9F6`

## Requirements

1. **Set the login page's own background to `#121826`** (replacing whatever dark color is currently used) — this must match exactly, or the logo will show as a visible rectangle instead of blending in.

2. **Place the logo image directly on that background** — no card, no plate, no border around it. It should look like it's part of the page, not a pasted-in image.

3. **Preserve aspect ratio** — scale by max-width/max-height, don't stretch.

4. **Update the coral accent used elsewhere on this screen** (the "Sign in" button, "ASSIDUOUS" label text if any remains) to the exact `#EB3C4D` measured above, so the button and the logo's own red are consistent — right now they may be slightly different shades of orange/coral.

5. **Keep the rest of the layout as-is** — "Board Report Access" heading, password field, Sign in button placement all stay where they are. This is a background-color and logo-placement fix, not a layout change.

Show me a screenshot of the updated login screen once done — specifically check that there's no visible seam or box edge around the logo.

