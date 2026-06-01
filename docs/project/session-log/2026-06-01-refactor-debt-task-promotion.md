# 2026-06-01 Refactor Debt Task Promotion

## Scope Completed
- Promoted the open renderer/shared debt from TD-003 into concrete task T-151.
- Sequenced T-151 as the next M3 Gate D task before T-150 consolidation, so the shared renderer cleanup can be attacked soon.
- Promoted broader TD-009 class-owned subsystem work into T-152, parked for M5 validation instead of letting M3 expand without a concrete near-term target.
- Recorded DEC-080 for the planning decision.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/technical-debt-register.md`
- `docs/project/decisions.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-06-01-refactor-debt-task-promotion.md`

## Behavioral Impact
- No runtime behavior changed.
- Project planning now makes T-151 the next refactor execution target and keeps T-150 as the final M3 consolidation pass.
- TD-003 and TD-009 now both have explicit task-board representation.

## Verification
- Reviewed the planning diff for the task board, roadmap, milestone, debt register, decisions, main-thread state, and session log.
- `git diff --check`
- Git reported only existing line-ending normalization warnings for edited Markdown files.

## Remaining Work
- T-151 should inspect `radebe-core/src/renderer/shared.ts`, adjacent appearance-pass renderers, and group/mask renderer paths, then choose one behavior-preserving cleanup slice.
- T-150 should run after T-151 to complete Gate D consolidation and prepare the M4 GitHub migration handoff.

## Risks Or Blockers
- No known blocker.
- T-151 should stay narrow; broad renderer architecture conversion remains T-152 unless the concrete cleanup slice makes part of it necessary.

## Exact Next 3 Steps
1. Start T-151 and identify the smallest valuable renderer/shared extraction around `renderer/shared.ts`, stroke/shadow/glow, group, or mask helpers.
2. Preserve command-owned geometry semantics and allocation-light hot loops while adding focused coverage for any behavior-preserving movement.
3. Run T-150 after T-151 to verify the final M3 safety net and hand off to M4 GitHub migration.

## Paste-Ready Prompt For Next Thread
Continue M3 Gate D with T-151. Read `docs/project/README.md`, `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/agent/source-of-truth.md`, `docs/project/milestones/M3-refactoring-stabilization.md`, the latest `docs/project/session-log/*.md`, and `docs/project/main-thread-state.md`. T-151 is Next Up: reduce renderer shared-helper concentration and appearance-pass duplication by attacking one behavior-preserving cleanup slice around `radebe-core/src/renderer/shared.ts`, stroke/shadow/glow, group, or mask helpers. Preserve command-owned geometry semantics, public renderer APIs, plain-data render instructions, and allocation-light hot loops. Run the closest practical core verification, update required docs, and leave T-150 as the final M3 consolidation task.

This is a good handoff point. Start a new worker thread.
