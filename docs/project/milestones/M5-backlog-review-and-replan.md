# M5 Backlog Review And Replan

Milestone ID: `M5`
Title: `Backlog Review And Replan`
Owner: `Main Thread`
Last updated: `2026-05-28`
Status: `Planned`

## Outcome
- Review the full post-migration backlog before starting the broad "everything else" work, pruning stale tasks, validating product value, and splitting the remaining work into fresh milestones.

## Scope
- Audit every open backlog task after M3 refactors and M4 GitHub migration have changed the project shape.
- Close, merge, split, or rewrite tasks that no longer match the product, repo, or hosting direction.
- Decide which language, rendering, Unity, VS Code, reusable editor, and public website items still deserve near-term milestones.
- Produce the next milestone sequence from a validated backlog rather than carrying forward the old M3/M4 feature grouping.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Full Backlog Audit | Every open task in `docs/project/task-board.md` is reviewed for keep, prune, merge, split, or defer | Not Started | Seed task: T-148 |
| Gate B | Product And Technical Validation | Kept tasks have current rationale, dependencies, and minimum done criteria after the GitHub migration | Not Started | Includes language/rendering, Unity, VS Code, reusable editor, and release/public-site follow-ons |
| Gate C | Future Milestone Split | Validated tasks are assigned to fresh follow-on milestones with explicit gates and pass criteria | Not Started | "Everything else" work should not begin until this gate has passed |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
