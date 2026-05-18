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
| T-015 | Normalize schema-driven property syntax across inline and child forms | M2 | Gate B | P1 | Done | `t-015-property-normalization` | None | Hand off to the next language thread to add more drawing commands on top of the shared rule that command properties can come from positional inline args, named inline args, or canonical child property commands |
| T-016 | Add the first rectangle fill primitive with a simple alias | M2 | Gate B | P1 | Done | `t-016-rect-absolute-alias` | None | Hand off to the next language thread for either `rect-inset` or the first outline/stroke-capable rectangle path before returning to Unity validation |
| T-018 | Introduce actual `fill` / `solid` appearance commands and lower rectangle color shorthand into them | M2 | Gate B | P1 | Done | `t-018-fill-solid-lowering` | None | Hand off to the next language thread for `rect-inset` or outline/stroke work now that rectangle appearance has a real command model instead of direct color-only semantics |
| T-019 | Add gradient fills with stop-based expansion and alpha-capable interpolation | M2 | Gate B | P1 | Done | `t-019-fill-gradient` | None | Hand off to the next language thread for `rect-inset` or outline/stroke work now that rectangle fills support solid, gradient shorthand, explicit stops, and transparent stop colors |
| T-020 | Split gradients into explicit linear and radial variants and expand the web examples into multi-scenario docs pages | M2 | Gate B | P1 | Done | `t-020-gradient-variants-and-examples` | None | Hand off to the next language thread for `rect-inset` or early stroke work now that fills support `solid`, `gradient` as a linear alias, explicit `gradient-linear`, explicit `gradient-radial`, and richer per-feature example coverage in `radebe-web` |
| T-021 | Add `rect-inset` as the first bounds-relative rectangle convenience command | M2 | Gate B | P1 | Done | `t-021-rect-inset` | None | Hand off to the next language thread for the first real `stroke` slice or a simpler `rect-outline` command now that rectangle geometry supports both absolute coordinates and sprite-relative inset authoring |
| T-022 | Add the first rectangle-backed `stroke` slice with shorthand, alignment, and style controls | M2 | Gate B | P1 | Done | `t-022-rectangle-stroke-slice` | None | Hand off to the next language thread for nested stroke support, `rect-outline` as a convenience alias, or the first `cut-rect` slice now that rectangle geometry supports generated `stroke` regions with `solid`, `dashed`, and `dotted` styles |
| T-023 | Allow nested rectangle-backed `stroke` passes | M2 | Gate B | P1 | Done | `t-023-nested-stroke` | None | Hand off to the next language thread for `rect-outline` as a convenience alias or the first `cut-rect` slice now that stroke can recurse and produce double-outline treatments within the same appearance model |
| T-024 | Add `cut` as a rectangle geometry modifier | M2 | Gate B | P1 | Done | `t-024-rect-cut-modifier` | None | Hand off to the next language thread for cut-aware stroke rendering, `rect-outline` as a convenience alias, or the next distinct shape now that rectangle fill silhouettes support uniform, four-value, and named corner cuts |
| T-025 | Realign `cut` from side semantics to corner semantics | M2 | Gate B | P1 | Done | `t-025-corner-cut-realignment` | None | Hand off to the next language thread for cut-aware stroke rendering now that `cut` resolves per corner with `top-left`, `top-right`, `bottom-right`, and `bottom-left` forms in both shorthand and expanded syntax |

## Next Up
| ID | Title | Milestone | Gate | Priority | Status | Owner | Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-011 | Re-exercise the packaged CLI bridge from Unity after the first language commands | M2 | Gate C | P1 | Ready | Unassigned | None | Revisit after one or two more library-level commands land; when taken, run the packaged CLI bridge from Unity against the richer spec-aligned sample including absolute rectangles, inset rectangles, cut-modified rectangle fills, gradients, and rectangle-backed stroke rendering and validate the same output contract now that the web feedback loop includes multi-example docs pages with editable live previews |

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
