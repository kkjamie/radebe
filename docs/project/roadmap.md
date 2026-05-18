# Roadmap

Owner: `Main Thread`
Last updated: `2026-05-18`

## Planning Horizon
- Current: `2026-05-17` to `2026-05-24`
- Next: `2026-05-24` to `2026-06-14`

## Milestones
| Milestone | Outcome | Priority | Status | Target | Dependencies | Spec File | Current Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M0 | Planning baseline for the Radebe monorepo and package model | P0 | Done | 2026-05-24 | Initial setup | `docs/project/milestones/M0-planning-phase.md` | Passed |
| M1 | Workspace scaffold for `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts` | P0 | Done | 2026-06-07 | M0 completed | `docs/project/milestones/M1-implementation-foundation.md` | Passed |
| M2 | First usable language loop with basic rendering commands across core, CLI, and web before returning to Unity integration | P1 | In Progress | 2026-06-28 | M1 completed | `docs/project/milestones/M2-scale-and-optimization.md` | Gate C |

## Priority Rules
- P0: blocks core progress or release path.
- P1: high value, not release-blocking.
- P2: useful improvements, schedule as capacity allows.

## Current Focus
- M1 Gate C remains passed with the shared core/web render contract, SEA packaging pipeline, and Unity payload install/update plus smoke helper baseline in place.
- The recovered source product spec has now been realigned in code through a schema-backed `sprite` header block, root-level `plot` and `line` commands, rectangle geometry spanning `rect`, `rect-absolute`, `rect-inset`, and child `cut` modifiers with corner-based chamfer control, filled rectangles with `solid`, `gradient-linear`, and `gradient-radial` appearance variants, explicit per-pass `alpha` on `fill` and `stroke`, the first rectangle-backed `stroke` slice with `solid`, `dashed`, and `dotted` styles plus nested stroke support, and a shared sprite-grid render artifact consumed by `radebe-core`, `radebe-cli`, `radebe-web`, and the SEA smoke path.
- M2 Gate A and Gate B now have working end-to-end evidence; one or two more language-level geometry or stroke additions should land before returning to Gate C to re-exercise the packaged CLI bridge from Unity against the richer spec-aligned language slice.

## Gate Policy
- All milestones must define gates in `docs/project/milestones/Mx-*.md`.
- A milestone cannot move to `Done` until all required gates are `Passed`.
- If a gate is `Blocked`, record the blocker in the milestone doc and `task-board.md`.
