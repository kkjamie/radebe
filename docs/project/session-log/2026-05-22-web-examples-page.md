# 2026-05-22 Web Examples Page

## Scope
- Added a dedicated public Examples page for complete, working sprite sources.
- Kept the page lightweight by rendering static canvas previews instead of embedding multiple CodeMirror playgrounds.

## Changes
- Added `radebe-web/src/pages/examples.tsx` with six complete sprite examples: Neon Status Chip, Reactor Core, Inventory Slot, Signal Bars, Masked Glint Panel, and Warning Badge.
- Registered `#/examples` in the page type union, page exports, registry, router switch, and main nav.
- Added `showcase-*` CSS classes for responsive rendered-source gallery cards.
- Recorded task-board and main-thread-state handoff notes as T-101.

## Validation
- `npm run build -w @radebe/web` passes.
- The running dev server at `http://127.0.0.1:5173/src/pages/examples.tsx` and `http://127.0.0.1:5173/src/data.ts` served updated modules with HTTP 200.

## Notes
- The examples page intentionally uses static previews plus highlighted source so it remains performant even with several finished sprites on one page.
- No milestone or priority changed.

## Follow-Up: Casual Buttons
- Added three casual mobile-game style examples: Play Button, Coin Reward Button, and Menu Button.
- Updated the page hero copy to frame the gallery around buttons, badges, panels, icons, and HUD pieces rather than only sci-fi/HUD sprites.
- Validation after the follow-up: `npm run build -w @radebe/web` passes, and all 9 gallery sources render through `renderSource()` without diagnostics.

## Follow-Up: Button And Icon Mix
- Pruned the repeated casual button variants back to Play Button only, with sprite-level antialiasing enabled.
- Replaced the extra sci-fi and telemetry examples with Message Icon, Tick Badge, Star Prize, Heart Pickup, and a Simple Sci-Fi Panel with no internal contents.
- Removed Coin Reward Button, Menu Button, Signal Bars, Warning Badge, Reactor Core, Inventory Slot, and Masked Glint Panel from the live gallery.
- Validation after this refinement: `npm run build -w @radebe/web` passes, and all 6 gallery sources render through `renderSource()` without diagnostics.

## Follow-Up: Message Icon Group Fill
- Updated Message Icon so the bubble tail polygon and rounded rectangle live inside a `group bubble`.
- The group now receives the shared shadow, gradient fill, and stroke, demonstrating group-level compositing over the combined bubble contour.
- Validation after this refinement: `npm run build -w @radebe/web` passes, and all 6 gallery sources render through `renderSource()` without diagnostics.

## Follow-Up: Editable Rows
- Converted the Examples page from static gallery tiles to one stacked `Playground` row per example.
- Each example now has its own CodeMirror source editor, live preview, diagnostics output, zoom control, and session source-state persistence.
- Removed the old static showcase preview component path and `showcase-*` gallery CSS.
- Validation after this refinement: `npm run build -w @radebe/web` passes, all 6 examples render through `renderSource()` without diagnostics, and the running dev server serves `src/pages/examples.tsx` with HTTP 200.

## Follow-Up: Lazy Editors And Fit Zoom
- Changed the Examples page so only the first playground editor mounts immediately; the remaining rows keep their titles/summaries and mount their editable `Playground` when they approach the viewport.
- Added lightweight placeholder panels for not-yet-mounted example rows to preserve page shape without paying the CodeMirror setup cost up front.
- Updated the shared playground preview sizing so `fit` zoom schedules an animation-frame recalculation after the first render and after resize observations, matching the visible Fit selection without requiring a manual zoom toggle.
- Validation after this refinement: `npm run build -w @radebe/web` passes, all 6 examples render through `renderSource()` without diagnostics, and the running dev server serves `src/pages/examples.tsx` and `src/playground.tsx` with HTTP 200.

## Follow-Up: Generated Static Previews
- Moved the complete Examples page sources into `src/content/examples.json` so the page and generator read the same data.
- Added a web package generator script that renders each example through `@radebe/core`, encodes a PNG with Node built-ins, and writes previews to `public/generated/examples/`.
- Updated `npm run dev` and `npm run build` in `@radebe/web` so preview images are regenerated before Vite serves or bundles the site.
- Initially changed Examples rows to show generated PNG previews first and swap into the live `Playground` only when the user clicked `Edit source`; this was superseded by the cached-preview Playground follow-up below.
- Marked `radebe-web/public/generated/` as ignored generated output.
- Validation after this refinement: `npm run build -w @radebe/web` passes, generated 6 preview PNGs, Vite copied them into `dist/generated/examples/`, the running dev server serves the generated play-button PNG with HTTP 200, and the generated play-button image was visually checked.

## Follow-Up: Cached Preview Playground Mode
- Moved the cached preview behavior into the shared `Playground` component through an optional `cachedPreview` prop.
- Examples now render full editable Playground rows immediately, so source is visible and editable without a separate edit button.
- The preview panel starts with the generated PNG inside the normal sprite preview surface, using the same checkerboard, zoom select, and fit sizing path as the live canvas.
- On the first source change, that row hides the cached image, shows the live canvas, and resumes normal render/diagnostic updates.
- Removed the separate static preview row/button CSS from the Examples page.
- Validation after this refinement: `npm run build -w @radebe/web` passes, generated 6 preview PNGs, Vite copied them into `dist/generated/examples/`, and the running dev server serves the generated play-button PNG plus updated `src/playground.tsx` and `src/pages/examples.tsx` with HTTP 200.
