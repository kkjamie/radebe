# Session Log: T-019 Fill Gradient

Date: `2026-05-18`
Thread: `t-019-fill-gradient`

## Scope
- Add gradient fills with both shorthand and explicit stop-based forms, including alpha-capable interpolation for transparent stops.

## Work Completed
- Extended the appearance schema with `gradient`, `stop`, `from`, `to`, and `position`.
- Implemented `fill gradient <from> <to>` shorthand as a two-stop gradient from position `0` to `1`.
- Implemented explicit stop-based gradients through `fill -> gradient -> stop color position`.
- Added alpha-capable hex parsing and interpolation so stop colors such as `#0000ff80` work as transparent gradient endpoints.
- Upgraded rectangle fill rendering to use internal RGBA compositing so multiple fill passes behave more like ordered appearance layers instead of raw string replacement.
- Added a dedicated `Gradient` example page in `radebe-web` and updated the experimental sample to show gradient fill immediately.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.
- Ran `npm run build -w @radebe/web` successfully.

## Notes
- The first gradient implementation currently evaluates stop positions across the rectangle width, so it behaves as a horizontal linear gradient.
- Plot and line still use direct color properties; only rectangle appearance uses the richer fill model right now.

## Next Recommendation
- Implement `rect-inset` next, then decide whether to follow with `rect-outline` or a more general stroke model before returning to Unity.
