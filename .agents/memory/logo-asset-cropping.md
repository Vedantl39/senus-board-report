---
name: Crop baked-in logo padding/taglines at the source, not with CSS
description: When an attached brand logo PNG has non-transparent background and extra content (padding, taglines) baked in, fix sizing/spacing by cropping the source image, not by tweaking margins/max-height.
---

Attached logo files often ship as a single flattened PNG with a solid background color plus large uniform padding around the mark, and sometimes an extra line (e.g. a tagline) baked in below the main wordmark. If the surrounding page background matches the logo's baked-in background, the image reads as if it "blends in" — but any layout complaints (logo too small, gap too large, unwanted extra text) can't be fixed with Tailwind margin/height classes alone, because the empty space and extra content are pixels inside the image, not CSS.

**Why:** Repeated attempts to fix spacing via `mb-*`/`mt-*`/`max-h-*` only shrink/grow the whole image proportionally (including its internal padding) or change gaps around it — they cannot remove content that's part of the raster image itself, like a tagline row or wide margins.

**How to apply:** Use `magick <src> -bordercolor "<exact-bg-hex>" -border 1 -fuzz 5% -trim -format "%wx%h%O" info:` to find the tight bounding box of the actual visual content (icon/wordmark) against its own background color. If you need to exclude a specific unwanted row (e.g. a tagline below the main mark), crop first to isolate just the desired region, then re-trim. Crop from the *original* source image with `magick <src> -crop WxH+X+Y +repage <output>` (using coordinates relative to the original, not an already-cropped intermediate) to avoid compounding offset errors. Only after the image itself is tightly cropped to just the wanted content should you adjust Tailwind spacing (`mb-*`, `mt-*`) for final polish.
