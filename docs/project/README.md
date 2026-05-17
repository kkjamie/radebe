# Project Docs Index

Owner: `TBD`
Last updated: `YYYY-MM-DD`

Purpose: fast startup context for new agent threads with minimal token load.

## Read This First
1. `AGENTS.md`
2. `docs/project/task-board.md`
3. `docs/project/roadmap.md`
4. `docs/project/decisions.md`
5. `docs/agent/source-of-truth.md`
6. Active milestone in `docs/project/milestones/`
7. `docs/project/codebase-map.md` (only relevant sections)
8. Recent `docs/project/session-log/*.md` entries
9. `docs/project/main-thread-state.md`

## File Roles
- `product-spec.md`: canonical product facts and open questions.
- `inconsistency-register.md`: ambiguity and conflict register.
- `codebase-map.md`: architecture and key system locations.
- `roadmap.md`: milestones, priorities, dependency order.
- `milestones/Mx-*.md`: milestone scope, gates, acceptance criteria.
- `task-board.md`: active queue, status, immediate next action.
- `decisions.md`: significant decisions and rationale.
- `styleguide.md`: stack-specific implementation rules.
- `technical-debt-register.md`: known debt worth tracking explicitly.
- `todo-inventory.md`: deferred non-canonical cleanup inventory.
- `main-thread-state.md`: resumable orchestration context.
- `workflow-manifest.yml`: pinned Wilko version and open upstream proposals.
- `workflow-overrides.md`: project-local exceptions to shared workflow.

## Worker Thread Start Prompt Template
```md
You are working in worker thread `<name>`.

Objective:
- <single scoped objective>

Done criteria:
- <testable outcomes>

Constraints:
- <constraints>

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: <id>)
3) docs/project/roadmap.md (milestone: <name>)
4) docs/project/milestones/<Mx-name>.md (active gate)
5) docs/agent/standards.md
6) docs/project/codebase-map.md (relevant section)
7) docs/project/session-log/<most relevant>.md

At completion:
- Update task-board, roadmap (if affected), decisions (if needed), and session-log.
- Update milestone gate status in docs/project/milestones/<Mx-name>.md if progressed.
- Update docs/project/main-thread-state.md.
- Return a handoff using docs/agent/handoff-template.md.
- If checkpoint reached, say: "This is a good handoff point. Start a new worker thread."
```
