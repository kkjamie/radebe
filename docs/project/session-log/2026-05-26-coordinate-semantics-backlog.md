# 2026-05-26 Coordinate Semantics Backlog

## Scope
- Captured the unresolved coordinate-space question raised while discussing antialiased horizontal and vertical `path` strokes.
- Added a future M3 task instead of choosing a coordinate model in this thread.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-rendering-expansion.md`
- `docs/project/inconsistency-register.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-26-coordinate-semantics-backlog.md`

## Behavioral Impact
- No runtime behavior changed.
- Future `outputscale`, richer `path`, and antialiasing work now has an explicit tracked ambiguity: how author-facing coordinates should map to sprite bounds, pixel cells, filled extents, stroke centerlines, and samples.

## Remaining Work
- Decide the coordinate model before or alongside `outputscale`.
- Update renderer behavior, tests, command docs, syntax guidance, and editor help after the decision.
- Re-check existing `path`, `line`, `plot`, `rect`, generated polygon, and stroke examples for consistency after any behavior change.

## Risks Or Blockers
- Existing `path` output may change if path points are reinterpreted to match `line`-style pixel-cell behavior.
- Deferring the decision until after `outputscale` could make scaling rules harder to explain and test.

## Exact Next 3 Steps
1. Keep M2 Gate D focused on T-125, T-126, and T-074 unless priorities change.
2. When M3 starts, run T-131 before or alongside T-127 so `outputscale` has settled coordinate semantics.
3. If T-071 richer path work starts first, include T-131 in that thread's design scope so path caps, joins, and centerline behavior do not drift from the broader coordinate model.

## Paste-Ready Prompt For Next Thread
```md
You are working in worker thread `t-131-coordinate-semantics`.

Objective:
- Resolve Radebe's author-facing coordinate-space semantics before `outputscale` and richer path work harden the current ambiguity.

Done criteria:
- Decide and document how sprite bounds, filled extents, pixel-like point commands, open path points, stroke centerlines, antialias samples, and `outputscale` interact.
- Update `docs/project/inconsistency-register.md` with the resolution and add an accepted decision if the model is chosen.
- Update renderer/compiler tests and docs if behavior changes are implemented in the same thread.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-131)
3) docs/project/inconsistency-register.md (item: IR-002)
4) docs/project/roadmap.md
5) docs/project/milestones/M3-rendering-expansion.md
6) docs/project/decisions.md (DEC-023, DEC-064, and any coordinate-related entries)
7) docs/project/session-log/2026-05-26-coordinate-semantics-backlog.md
8) radebe-core/src/renderer.ts
9) radebe-core/src/compiler.ts

At completion:
- Update task-board, roadmap if priority or milestone changed, decisions if a model is accepted, session-log, and main-thread-state.
- Return the standard handoff summary.
```
