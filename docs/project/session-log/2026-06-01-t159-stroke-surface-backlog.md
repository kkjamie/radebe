# 2026-06-01 T-159 Stroke Surface Backlog

## Scope Completed
- Added T-159 as a future M5 backlog task for allowing normal appearance passes on stroke-generated surfaces.
- Kept the task explicitly out of M3 so the current thread remains focused on refactoring and T-150 consolidation.
- Captured the key semantics question: nested passes on a stroke must define whether they target the stroke band, the expanded outer envelope, or an explicit surface choice.

## Files Changed
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/main-thread-state.md`
- `docs/project/session-log/2026-06-01-t159-stroke-surface-backlog.md`

## Behavioral Impact
- No runtime behavior changed.
- Current nested stroke behavior remains unchanged: nested strokes advance from the current stroke's outer contour through coverage-source expansion.

## Verification
- Documentation-only update.
- `git diff --check`

## Remaining Work
- T-150 should still run final M3 Gate D consolidation before new feature work.
- T-159 should be validated during T-148/M5 before implementation.

## Risks Or Blockers
- No known blocker.
- The future implementation should not blur current stacked-outline semantics with effects that should apply to the actual stroke band unless the surface model is explicit.

## Exact Next 3 Steps
1. Start T-150 and review M3 Gate D evidence, including T-151 through T-158.
2. Keep T-159 parked until M5 backlog validation.
3. If Gate D passes, prepare the M4 GitHub migration handoff.

## Paste-Ready Prompt For Next Thread
Continue M3 Gate D with T-150. Read `docs/project/README.md`, `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/agent/source-of-truth.md`, `docs/project/milestones/M3-refactoring-stabilization.md`, the latest `docs/project/session-log/*.md`, and `docs/project/main-thread-state.md`. T-159 is parked for M5: future work may allow fill/shadow/glow/stroke passes on stroke-generated surfaces, but that semantic design should not expand current M3 refactoring. Review completed M3 refactors, verify the final safety net, close or re-scope TD-003 and TD-009, update required docs, and prepare the M4 GitHub migration handoff.

This is a good handoff point. Start a new worker thread.
