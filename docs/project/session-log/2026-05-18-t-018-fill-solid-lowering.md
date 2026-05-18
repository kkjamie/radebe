# Session Log: T-018 Fill Solid Lowering

Date: `2026-05-18`
Thread: `t-018-fill-solid-lowering`

## Scope
- Implement actual `fill` / `solid` appearance commands and make rectangle `color` shorthand lower into that appearance model instead of remaining a one-off direct render property.

## Work Completed
- Extended the schema with `fill` and `solid` appearance commands while keeping `color` as the canonical child-property form.
- Updated rectangle compilation so `rect ... <color>` becomes an implicit first solid fill, while explicit `fill solid ...` and expanded `fill -> solid -> color` forms are also accepted.
- Allowed multiple fills on a rectangle as ordered appearance passes rather than treating later fills as invalid overrides.
- Updated the renderer so rectangle fills are applied in order through the shared sprite-grid artifact.
- Added test coverage for shorthand lowering, explicit fill forms, expanded child-property fill forms, and multiple fill passes.
- Added a dedicated `Fill / Solid` example page in `radebe-web` and updated the experimental sample to use explicit fill syntax.

## Verification
- Ran `npm run build` at the repo root successfully.
- Ran `npm test` at the repo root successfully.

## Notes
- This is the first real step toward separating geometry from appearance in implementation rather than only in the spec.
- Plot and line still use direct color properties for now; they can be revisited later if we decide to move more commands onto the same appearance model.

## Next Recommendation
- Implement `rect-inset` next, then decide whether to follow with `rect-outline` or a more general stroke model before returning to Unity.
