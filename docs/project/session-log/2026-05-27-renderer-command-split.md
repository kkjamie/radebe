# 2026-05-27 Renderer Command Split

## Scope Completed
- Refactored `radebe-core` renderer internals so rect, circle, and polygon rendering now live in per-command folders split by rendering feature.
- Kept the public `radebe-core/src/renderer.ts` API stable while moving shared raster, layer, mask, and sampling helpers into a dedicated internal module.
- Captured a follow-up backlog task and naming decision for broader appearance-pass unification across shapes.

## Files Changed
- `radebe-core/src/renderer.ts`
- `radebe-core/src/renderer/shared.ts`
- `radebe-core/src/renderer/commands/rect/index.ts`
- `radebe-core/src/renderer/commands/rect/fill.ts`
- `radebe-core/src/renderer/commands/rect/stroke.ts`
- `radebe-core/src/renderer/commands/rect/glow.ts`
- `radebe-core/src/renderer/commands/rect/shadow.ts`
- `radebe-core/src/renderer/commands/circle/index.ts`
- `radebe-core/src/renderer/commands/circle/fill.ts`
- `radebe-core/src/renderer/commands/circle/stroke.ts`
- `radebe-core/src/renderer/commands/circle/glow.ts`
- `radebe-core/src/renderer/commands/circle/shadow.ts`
- `radebe-core/src/renderer/commands/polygon/index.ts`
- `radebe-core/src/renderer/commands/polygon/fill.ts`
- `radebe-core/src/renderer/commands/polygon/stroke.ts`
- `radebe-core/src/renderer/commands/polygon/glow.ts`
- `radebe-core/src/renderer/commands/polygon/shadow.ts`
- `docs/project/task-board.md`
- `docs/project/codebase-map.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-rendering-expansion.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-05-27-renderer-command-split.md`

## Behavioral Impact
- Runtime rendering behavior stays the same; the refactor is internal only.
- The renderer is now easier to extend by command family because shape-specific logic is co-located with its `fill`, `stroke`, `glow`, and `shadow` passes.
- The repo now uses `appearance passes` as the umbrella term for `fill`, `stroke`, `shadow`, and `glow` in renderer architecture discussions.

## Tests / Verification
- Ran: `npm run typecheck -w radebe-core`
- Ran: `npm test -w radebe-core`
- Not run: broader workspace checks, because the change was isolated to `radebe-core` internals and its own tests passed

## Remaining Work
- T-133 should reduce repeated appearance-pass logic across shapes by introducing reusable capabilities instead of duplicating every pass forever.
- `path`, `group`, and `mask` can be given the same folder treatment later if further renderer work touches them heavily.

## Risks / Blockers
- Shared helpers are now centralized in one internal module; future refactors should keep an eye on that file so it does not become the next monolith.
- The later appearance-pass unification should preserve geometry-specific semantics such as stroke alignment, perimeter sampling, and fill coordinate spaces instead of flattening them too aggressively.

## Next 3 Steps
1. Keep M2 focused on T-126 release hosting and final release-path validation.
2. When M3 resumes, take T-133 before or alongside the next substantial rendering feature so new work does not deepen shape-to-shape appearance duplication.
3. If another renderer cleanup thread is needed before T-133, consider giving `path`, `group`, and `mask` the same internal folder treatment now used by rect, circle, and polygon.

## Commit Status
- Status: `not committed`
- Commit: `N/A`
- Notes: Changes were implemented and verified locally in the workspace, but no commit was requested in this thread.

## Docs Updated
- `docs/project/task-board.md`: yes, closed T-132 and added T-133
- `docs/project/codebase-map.md`: yes, documented the new internal renderer layout
- `docs/project/roadmap.md`: yes, recorded the completed renderer split and next unification follow-up
- `docs/project/milestones/M3-rendering-expansion.md`: yes, updated Gate B seed-task notes
- `docs/project/decisions.md`: yes, added DEC-073 for `appearance passes` terminology
- `docs/project/session-log/2026-05-27-renderer-command-split.md`: yes, created
- `docs/project/main-thread-state.md`: yes, refreshed renderer status and follow-up

## Main Thread Resume Prompt
```md
Main thread sync.

Review:
- docs/project/main-thread-state.md
- docs/project/session-log/2026-05-27-renderer-command-split.md
- docs/project/task-board.md
- docs/project/roadmap.md
- docs/project/milestones/M3-rendering-expansion.md
- docs/project/decisions.md

Please:
1) Confirm state consistency
2) Decide whether to close or advance the current gate
3) Suggest the next worker thread (single best option)
4) Provide the next worker prompt
```

## Next Thread Prompt
```md
Objective:
- Unify repeated renderer appearance-pass logic across shapes without changing current rendering behavior.

Done criteria:
- Define the shared renderer capabilities that `fill`, `stroke`, `shadow`, and `glow` can consume across shapes.
- Reduce at least one clear slice of duplicated appearance-pass logic across rect, circle, polygon, and any composited mask/group path it naturally fits.
- Keep the public `@radebe/core` render API stable.
- Run the closest practical `radebe-core` checks before handoff.

Context to read:
1) AGENTS.md
2) docs/project/task-board.md (item: T-133)
3) docs/project/roadmap.md (milestone: M3)
4) docs/agent/standards.md
5) docs/project/codebase-map.md (relevant section)
6) docs/project/session-log/2026-05-27-renderer-command-split.md
```

This is a good handoff point. Start a new worker thread.
