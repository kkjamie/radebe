# Canonical Source-of-Truth Map

Owner: `TBD`
Last updated: `YYYY-MM-DD`

Purpose: define one canonical document per concern and prevent cross-file drift.

## Ownership Map
| Concern | Canonical Source | Supporting Sources | Notes |
| --- | --- | --- | --- |
| Shared workflow rules and process | `docs/agent/*.md` | `AGENTS.md` | `docs/agent/` stays project-agnostic. |
| Product facts and open product questions | `docs/project/product-spec.md` | `docs/project/inconsistency-register.md`; external source docs | Product spec records facts and open conflicts only. |
| Conflict and ambiguity tracking | `docs/project/inconsistency-register.md` | `docs/project/product-spec.md` | Register is issue-truth, not decision-truth. |
| Active execution state and next action | `docs/project/task-board.md` | `docs/project/session-log/*.md`; `docs/project/main-thread-state.md` | Do not duplicate live status in other docs. |
| Milestone gates and pass criteria | `docs/project/milestones/Mx-*.md` | `docs/project/task-board.md`; `docs/project/roadmap.md` | Milestone files own gate definitions and status. |
| Priority order and sequencing | `docs/project/roadmap.md` | `docs/project/milestones/Mx-*.md`; `docs/project/task-board.md` | Roadmap owns milestone priority. |
| Significant decisions | `docs/project/decisions.md` | `docs/project/session-log/*.md`; `docs/project/inconsistency-register.md` | Decision log is authoritative for accepted decisions. |
| Engineering and process standards | `docs/agent/standards.md` | `docs/agent/procedures.md`; `AGENTS.md` | Standards are rules; procedures are steps. |
| Thread-level history | `docs/project/session-log/*.md` | `docs/project/task-board.md` | Logs record what happened, not canonical product truth. |
| Main-thread resumable context | `docs/project/main-thread-state.md` | `docs/project/session-log/*.md`; `docs/project/task-board.md` | Keep concise; link instead of duplicating full tables. |

## Anti-Duplication Rules
- Status belongs in `docs/project/task-board.md` and milestone files only.
- Product conflicts remain unresolved until decision is logged in `docs/project/decisions.md`.
- Workflow rules belong in `docs/agent/`, not in project files.
- `main-thread-state.md` is orchestration summary, not a second task board.
