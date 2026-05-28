# 2026-05-28 Repeater Container Roadmap

## Scope
- Record the planned repeater-style structural container family in the internal task backlog, project roadmap, M3 gate notes, and public website roadmap.

## Changes
- Added T-136 for structural repeater containers covering `repeat-linear`, `repeat-grid`, `repeat-radial`, `mirror`, `tile`, and later `repeat-along-path`.
- Updated the M3 roadmap language and Gate B seed-task list to include T-136.
- Added DEC-076 to capture the decision that repeaters are structural containers, repeated paths stay independent by default, `tile` remains planned, and `scatter` is excluded for now.
- Added a public Roadmap card for repeat containers and moved `mirror` out of the generic transform-card and transform-task wording.

## Validation
- `npm --prefix radebe-web run build` passed. Vite emitted the existing large chunk warning for the main bundle.

## Next Steps
1. Validate the website build after the roadmap TSX update.
2. When M3 Gate B starts, decide whether `repeat-linear`, `repeat-grid`, or `repeat-radial` is the first implementation slice.
3. Defer `repeat-along-path` until path caps, joins, closure, and curve semantics are better defined.
