# Task Board

Owner: `Main Thread`
Last updated: `2026-05-17`

Use this as the single source of truth for active execution state.

## Active
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | Select workspace tooling and scaffold the TypeScript monorepo | M1 | Gate A | P0 | Done | `t-001-workspace-scaffold` | None | Hand off to T-002 with the scaffolded package boundaries and shared TypeScript config |
| T-002 | Design the initial `radebe-core` API and module boundaries | M1 | Gate A | P0 | Done | `t-002-core-api-boundaries` | None | Hand off to T-003 for CLI packaging evaluation or T-004 for the first web authoring loop |
| T-003 | Evaluate standalone executable packaging for `radebe-cli` | M0 | Gate C | P1 | Done | `t-003-cli-packaging-evaluation` | None | Hand off to T-006 for SEA implementation or T-005 for the Unity bridge contract using the accepted executable path |
| T-005 | Define Unity bridge contract for `radebe-unity` consuming `radebe-cli` | M2 | Gate A | P1 | Done | `t-005-unity-bridge-contract` | None | Hand off to the next Unity implementation task to build install validation and invocation helpers against the documented SEA artifact contract |
| T-006 | Implement the Node SEA packaging pipeline for `radebe-cli` | M1 | Gate B | P1 | Done | `t-006-cli-sea-implementation` | None | Hand off to T-005 for the Unity bridge contract and artifact consumption details, or T-004 for the first web authoring loop |

## Next Up
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-004 | Define the first authoring loop for `radebe-web` realtime preview | M1 | Gate B | P1 | Ready | Unassigned | None | Describe editor, compile loop, and preview update path on top of the staged core API |

## Backlog
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-099 | Track future language and tooling ideas after the first vertical slice | M2 | Gate B | P2 | Backlog | Unassigned | None | Revisit once the core loop is running |

## Status Vocabulary
- `Ready`: scoped and unblocked, can start now.
- `In Progress`: currently active in a worker thread.
- `Blocked`: cannot continue until blocker is removed.
- `Review`: implemented, awaiting validation or merge.
- `Done`: complete and integrated.
- `Backlog`: not scheduled yet.

## Update Rules
- At worker start: set target task to `In Progress`.
- At worker end: update status, blockers, and next action.
- If scope changes: create/split tasks instead of overloading one row.
