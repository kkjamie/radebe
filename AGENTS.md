# Agent Workflow Contract

This repository uses a main-thread plus worker-thread model for AI agent collaboration.

## Priority Read Order
1. `docs/project/README.md`
2. `docs/project/task-board.md`
3. `docs/project/roadmap.md`
4. `docs/project/decisions.md`
5. `docs/agent/source-of-truth.md`
6. Active milestone file in `docs/project/milestones/`
7. Relevant `docs/project/session-log/*.md` entries
8. `docs/project/main-thread-state.md`

## Folder Responsibilities
- `docs/agent/`: shared, project-agnostic workflow rules and templates
- `docs/project/`: project-specific truth, planning, and execution state

## Thread Model
- Main thread: planning, prioritization, milestone review, and integration checks.
- Worker thread: one scoped objective with clear done criteria.
- Worker threads do not redefine roadmap priorities unless explicitly requested.

## Milestone Naming + Gates
- Milestone docs live in `docs/project/milestones/`.
- Every milestone file starts with the milestone ID prefix.
- Every milestone defines explicit gates and pass criteria before work advances.
- Worker threads should reference the active milestone file and current gate.

## Mandatory Handoff Rule
Before ending a worker thread, the agent must:
1. Update `docs/project/task-board.md`
2. Update `docs/project/roadmap.md` if milestone or priority changed
3. Append or create `docs/project/session-log/YYYY-MM-DD-topic.md`
4. Append `docs/project/decisions.md` if a meaningful decision was made
5. Update `docs/project/main-thread-state.md`
6. Provide a paste-ready next-thread prompt

If these are not updated, the task is not complete.

## Checkpoint / Thread Refresh Triggers
Agent should explicitly recommend starting a new worker thread when any are true:
- scope shift
- quality drift
- meaningful checkpoint reached
- thread length becomes high enough to reduce reliability

Required wording:
- `This is a good handoff point. Start a new worker thread.`

## Documentation Discipline
- Keep process docs concise and current.
- `docs/agent/` owns workflow rules.
- `docs/project/` owns project truth and live status.
- Do not duplicate status across multiple files.

## End-of-Thread Output Contract
Every worker thread must end with:
1. Scope completed
2. Files changed
3. Behavioral impact
4. Remaining work
5. Risks or blockers
6. Exact next 3 steps
7. Paste-ready prompt for the next thread
