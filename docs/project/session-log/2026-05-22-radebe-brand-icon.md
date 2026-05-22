# 2026-05-22 Radebe Brand Icon

## Scope
- Added a small geometric Radebe icon authored as Radebe source and reused across the public web surface.

## Changes
- Added `radebe-web/src/content/brand-icon.json` as the canonical source for the 64x64 icon.
- Added a web `BrandIcon` component that renders the icon source through `@radebe/core` into the top-bar canvas.
- Replaced the previous CSS-only package square in the top bar with the source-rendered icon.
- Updated the homepage mini preview to show the icon source and rendered artifact.
- Extended the preview generator to emit `/generated/brand/radebe-icon.png` alongside example previews.
- Added the generated brand PNG as the site favicon path.

## Validation
- `npm run build -w @radebe/web` passes and generates 6 example previews plus 1 brand icon.
- `npm test` passes across the workspace.
- The generated `radebe-icon.png` was visually checked at source resolution.

## Notes
- No milestone gate, roadmap priority, or durable architecture decision changed.

## Follow-Up: Editable Example
- Added the Radebe Icon as the first editable row on the Examples page by importing the canonical brand icon JSON beside the showcase examples.
- Added a short summary to `brand-icon.json` so the shared playground row has useful page copy.
- Validation after this follow-up: `npm run build -w @radebe/web` passes, the running dev server serves `src/pages/examples.tsx` with HTTP 200, and `/generated/brand/radebe-icon.png` serves with HTTP 200.
