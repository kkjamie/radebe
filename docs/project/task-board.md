# Task Board

Owner: `Main Thread`
Last updated: `2026-05-18`

Use this as the single source of truth for active execution state.

## Active
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | Select workspace tooling and scaffold the TypeScript monorepo | M1 | Gate A | P0 | Done | `t-001-workspace-scaffold` | None | Hand off to T-002 with the scaffolded package boundaries and shared TypeScript config |
| T-002 | Design the initial `radebe-core` API and module boundaries | M1 | Gate A | P0 | Done | `t-002-core-api-boundaries` | None | Hand off to T-003 for CLI packaging evaluation or T-004 for the first web authoring loop |
| T-003 | Evaluate standalone executable packaging for `radebe-cli` | M0 | Gate C | P1 | Done | `t-003-cli-packaging-evaluation` | None | Hand off to T-006 for SEA implementation or T-005 for the Unity bridge contract using the accepted executable path |
| T-005 | Define Unity bridge contract for `radebe-unity` consuming `radebe-cli` | M2 | Gate A | P1 | Done | `t-005-unity-bridge-contract` | None | Hand off to the next Unity implementation task to build install validation and invocation helpers against the documented SEA artifact contract |
| T-006 | Implement the Node SEA packaging pipeline for `radebe-cli` | M1 | Gate B | P1 | Done | `t-006-cli-sea-implementation` | None | Hand off to T-005 for the Unity bridge contract and artifact consumption details, or T-004 for the first web authoring loop |
| T-007 | Implement Unity bridge install validation and process-launch helper baseline | M2 | Gate A | P1 | Done | `t-007-unity-bridge-helper-baseline` | None | Hand off to the next Unity task to add payload install-copy/update flow and run bridge smoke checks inside a real Unity project |
| T-004 | Define the first authoring loop for `radebe-web` realtime preview | M1 | Gate B | P1 | Done | `t-008-web-preview-render-contract` | None | Hand off to the next thread to review M1 Gate C readiness and continue either the Unity install-copy flow or richer web preview behavior on top of the shared render artifact |
| T-009 | Implement Unity payload install/update and smoke helper baseline | M1 | Gate C | P1 | Done | `t-009-unity-payload-install-smoke` | None | Hand off to M2 language work with Unity follow-on intentionally deferred until the first spec-aligned language slice works through core, CLI, and web |
| T-012 | Realign the language implementation to the recovered product spec | M2 | Gate A | P1 | Done | `t-012-spec-aligned-language-slice` | None | Hand off to T-011 to re-exercise the packaged CLI bridge from Unity now that the spec-aligned `sprite` header plus root-level `plot` and `line` slice is stable through `radebe-core`, `radebe-cli`, `radebe-web`, and the SEA smoke path |

## Next Up
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-011 | Re-exercise the packaged CLI bridge from Unity after the first language commands | M2 | Gate C | P1 | Ready | Unassigned | None | Run the packaged CLI bridge from Unity against the spec-aligned `sprite`/`plot`/`line` sample, confirm the install/update path still works, and record any follow-on Unity-side contract adjustments without changing the shared core/CLI/web language path |

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
