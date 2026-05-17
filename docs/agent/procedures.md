# Procedures

Owner: `TBD`
Last updated: `YYYY-MM-DD`

These procedures define repeatable execution flow for main-thread and worker-thread operation.

## Start Main Thread Session
1. Read `AGENTS.md`, `docs/project/README.md`, and `docs/agent/source-of-truth.md`.
2. Review `docs/project/task-board.md`, `docs/project/roadmap.md`, and `docs/project/decisions.md`.
3. Review the active milestone in `docs/project/milestones/` and confirm current gate.
4. Pick the highest-priority unblocked task.
5. Create a scoped worker prompt using `docs/agent/handoff-template.md` and the project docs.

## Start Worker Thread
1. Confirm one objective, explicit done criteria, and constraints.
2. Set target task to `In Progress` in `docs/project/task-board.md`.
3. Confirm active milestone and gate context.
4. Load only required context.

## Execute Worker Thread
1. Keep implementation inside scope.
2. Keep status tracking only in `docs/project/task-board.md` and milestone files.
3. Record meaningful decisions in `docs/project/decisions.md`.
4. Keep logs factual: what changed, why, verification, and risks.
5. If work reaches a coherent checkpoint, run `Commit at Checkpoint` before handoff.

## Commit at Checkpoint
1. Confirm checkpoint is coherent and objective-aligned.
2. Run required checks, or capture explicit deferrals.
3. Ensure mandatory docs and handoff updates are complete.
4. Classify uncertainty:
   - `Low`: scope clear, task-aligned diff, checks passing or explicitly deferred.
   - `Material`: scope ambiguity, unrelated broad diff, unresolved conflicts, or unclear failing checks.
5. If uncertainty is `Low`, commit without extra confirmation.
6. If uncertainty is `Material`, ask for user confirmation before committing.
7. Use commit message format `<task-id>: <summary>` when task ID exists.
8. Include commit outcome in handoff.

## End Worker Thread
1. Validate done criteria and run checks, or record deferral rationale.
2. Update `docs/project/task-board.md`.
3. Update `docs/project/roadmap.md` only if priorities or sequence changed.
4. Update the active milestone gate status if progressed.
5. Add `docs/project/session-log/YYYY-MM-DD-topic.md`.
6. Update `docs/project/decisions.md` only for meaningful decisions.
7. Update `docs/project/main-thread-state.md`.
8. Return handoff using `docs/agent/handoff-template.md`.

## Re-enter Main Thread
1. Review the latest worker session log.
2. Verify consistency across task board, roadmap, milestone file, and decisions.
3. Confirm gate state and blockers.
4. Select the next best unblocked objective.
5. Spawn the next worker thread.
