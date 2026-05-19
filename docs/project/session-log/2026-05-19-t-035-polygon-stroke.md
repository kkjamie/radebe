# Session Log: T-035 Polygon Stroke

Date: `2026-05-19`
Thread: `t-035-polygon-stroke`

## Scope
- Extend `polygon` into the shared `stroke` appearance model.
- Preserve the no-comma, whitespace-based polygon point syntax chosen in T-034.
- Update tests, docs, and project state to reflect polygon stroke support.

## Work Completed
- Updated the polygon schema entry to opt into the shared `shape-appearance` capability path, which now allows both `fill` and `stroke`.
- Reworked polygon compilation to reuse the shared appearance collector instead of remaining fill-only.
- Added renderer support for polygon stroke using:
  - edge-distance sampling against polygon segments
  - the existing `align` stroke extents
  - the existing `solid` / `dashed` / `dotted` pattern rules
  - the existing stroke fill sampling for solid and gradient-filled stroke bands
- Updated core coverage so polygon stroke now compiles through the shared appearance model and renders a visible contour band.
- Replaced the polygon docs wording that said stroke was deferred, and expanded the shared `stroke` docs showcase to include polygon.
- Updated roadmap, milestone, decisions, task board, and main-thread state to reflect that polygon now participates in the shared stroke model.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully.

## Notes
- Polygon authoring still uses whitespace-separated `x y` point pairs or canonical `point` children; this change did not introduce comma tuple syntax.
- The current polygon stroke path is intentionally contour-band based rather than a full path/join model, which keeps the feature useful without forcing `path` semantics prematurely.

## Next Recommendation
- Return to M2 Gate C and re-exercise the packaged CLI bridge from Unity against the richer shape set, now including polygon stroke, unless path or deeper polygon contour semantics clearly outrank that checkpoint.
