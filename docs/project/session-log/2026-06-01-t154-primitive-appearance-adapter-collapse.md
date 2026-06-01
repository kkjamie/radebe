# 2026-06-01 T-154 Primitive Appearance Adapter Collapse

## Scope Completed
- Completed T-154 for M3 Gate D by removing redundant primitive appearance adapter modules after T-153 moved their behavior into coverage sources.
- Added `drawCoverageAppearancePasses` as the shared ordered pass orchestrator for shadows, outer glows, fills, inner glows, and strokes.
- Updated rect, circle, and polygon command entries to create their shape coverage source directly and call the shared appearance-pass helper.
- Deleted the per-shape `fill`, `stroke`, `shadow`, and `glow` adapter files for rect, circle, and polygon.

## Files Changed
- `radebe-core/src/renderer/appearance.ts`
- `radebe-core/src/renderer/commands/rect/index.ts`
- `radebe-core/src/renderer/commands/circle/index.ts`
- `radebe-core/src/renderer/commands/polygon/index.ts`
- Deleted `radebe-core/src/renderer/commands/{rect,circle,polygon}/{fill,stroke,shadow,glow}.ts`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/technical-debt-register.md`
- `docs/project/codebase-map.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-06-01-t154-primitive-appearance-adapter-collapse.md`

## Behavioral Impact
- No intended public API, compiler-output, or render-output behavior change.
- Rect, circle, and polygon command modules now match the shared renderer strategy: choose coverage, then render ordered appearance passes through one helper.
- Open path stroke remains separate.

## Verification
- `npm run build -w @radebe/core`
- `node --test dist/test/render.test.js`
- `node --test dist/test/colors.test.js dist/test/compiler.test.js dist/test/language-service.test.js dist/test/render.test.js dist/test/schema.test.js`
- `npm run build`
- `npm test`
- `git diff --check`
- Git reported only line-ending normalization warnings for edited Markdown and TypeScript files.

## Remaining Work
- T-150 should run final M3 Gate D consolidation, verify the whole refactor story, and close or narrowly re-scope TD-003 and TD-009.

## Risks Or Blockers
- No known blocker.
- The path renderer still has separate stroke behavior by design; future path work should define cap/join/path-length semantics before attempting coverage-source unification.

## Exact Next 3 Steps
1. Start T-150 and review M3 Gate D evidence, including T-151, T-153, and T-154.
2. Decide whether TD-003 can close now that primitive appearance adapter files are gone.
3. If Gate D passes, prepare the M4 GitHub migration handoff.

## Paste-Ready Prompt For Next Thread
Continue M3 Gate D with T-150. Read `docs/project/README.md`, `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/agent/source-of-truth.md`, `docs/project/milestones/M3-refactoring-stabilization.md`, the latest `docs/project/session-log/*.md`, and `docs/project/main-thread-state.md`. T-151, T-153, and T-154 are complete: renderer appearance passes now use coverage sources for composited alpha masks and primitive rect/circle/polygon shapes, and redundant primitive per-shape fill/stroke/shadow/glow adapter files have been removed. Review all completed M3 refactors, verify the final safety net, close or re-scope TD-003 and TD-009, update required docs, and prepare the M4 GitHub migration handoff.

This is a good handoff point. Start a new worker thread.
