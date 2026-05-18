# Session Log: T-004 Web Preview Render Contract

Date: `2026-05-18`
Thread: `t-008-web-preview-render-contract`

## Scope
- Define the smallest shared render-output contract in `radebe-core`.
- Wire the first basic `radebe-web` live preview loop to that contract.
- Keep Unity aligned to the CLI path rather than introducing a separate runtime path.

## Work Completed
- Added a concrete `RenderArtifact` contract in `radebe-core` as a lightweight text-grid with `rows`, `width`, and `height`.
- Updated `renderDocument` and `renderSource` to return the shared render artifact instead of a bare string output.
- Updated `radebe-cli` to keep printing rendered text by joining artifact rows, preserving the existing CLI behavior while moving onto the shared artifact contract.
- Replaced the static `radebe-web` shell with a basic authoring loop that accepts source text in a textarea, runs the existing core pipeline on each input event, and displays the rendered preview plus simple artifact metadata.
- Extended core tests to assert the new render artifact shape and verified the workspace build and tests after the change.

## Verification
- `npm run build`
- `npm test`

## Notes
- The text-grid artifact is intentionally small and browser-friendly while still giving Unity a cheap future path to texture generation through rasterization rather than a separate render contract.
- The current artifact reflects the compiled rows only, so blank lines are still removed by the compiler stage as in the existing pipeline behavior.

## Next Recommendation
- Review whether M1 Gate C can now pass, then choose between the next Unity install/update flow task or a follow-up web task for richer preview and diagnostics behavior.
