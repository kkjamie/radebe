# Session Log: T-038 Remove Overlay

Date: `2026-05-19`
Thread: `codex-main`

## Scope
- Remove `overlay` from the near-term language surface.
- Update the product/docs story so ordered multi-`fill` passes are the current layering model.
- Keep project state and decision records aligned with that simplification.

## Work Completed
- Removed `overlay` from the current product spec appearance vocabulary and related fill-coverage wording.
- Updated the longer-term renderer concept names so they no longer imply an active overlay command surface.
- Removed the `Overlay` placeholder page from the web docs nav.
- Updated the radial gradient example wording in `radebe-web` so it describes a transparent highlight achieved with ordered fill passes rather than an overlay command.
- Updated the `shadow` placeholder page to stop advertising `overlay` as a child command.
- Added task-board and decision-log entries recording that ordered multi-`fill` passes are the current supported layering model.
- Updated main-thread state to reflect that `overlay` is intentionally out of the near-term language surface.

## Verification
- Ran `npm run build` successfully.

## Notes
- Historical session logs still mention `overlay` where they accurately describe earlier planning state; current truth now lives in the product spec, decision log, task board, and main-thread state.
- This change is intentionally surface-level only because `overlay` was not implemented in schema, compiler, or renderer code.

## Next Recommendation
- Return to M2 Gate C and re-exercise the packaged CLI bridge from Unity against the richer current geometry and appearance set.
