# Roadmap

Owner: `Main Thread`
Last updated: `2026-05-19`

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
- The recovered source product spec has now been realigned in code through a schema-backed `sprite` header block, root-level `plot` and `line` commands, rectangle geometry spanning `rect`, `rect-absolute`, `rect-inset`, and child `cut` plus child `radius` modifiers, the first `circle` geometry primitive, a `polygon` geometry slice using whitespace-separated `x y` point pairs or canonical child `point` nodes, a first open `path` geometry slice using child `point` nodes plus required `stroke`, filled shapes with `solid`, `gradient-linear`, and `gradient-radial` appearance variants, explicit per-pass `alpha` on `fill` and `stroke`, a `shape-appearance` capability path that lets geometry commands opt into shared `fill` / `stroke` children where appropriate, circle stroke support, polygon stroke support, path stroke support, rectangle stroke contours that now follow `cut` and `radius` silhouettes, and a shared sprite-grid render artifact consumed by `radebe-core`, `radebe-cli`, `radebe-web`, and the SEA smoke path.
- The shared shape appearance model now also includes a first hard-edged `shadow` pass for `rect`, `circle`, and `polygon`, with `x`, `y`, `spread`, explicit `alpha`, and either color shorthand or nested `fill`, while `blur` remains intentionally deferred.
- The web example surface now treats rounded and cut corners as part of the main `rect` story instead of separate geometry pages, which keeps the current authoring model aligned with the implemented modifier-based shape semantics.
- The placeholder example audit now keeps only substantive future-feature stubs in the web nav; low-value property/container placeholders that are better covered by their parent pages have been removed.
- M2 Gate A and Gate B now have working end-to-end evidence; the most natural next step is returning to Gate C to re-exercise the packaged CLI bridge from Unity against the richer spec-aligned language slice now that `circle`, strokable `polygon`, and stroke-first `path` join the current geometry set, shape appearance attachment is capability-driven, and rectangle strokes follow modifier-aware contours.

## Gate Policy
- All milestones must define gates in `docs/project/milestones/Mx-*.md`.
- A milestone cannot move to `Done` until all required gates are `Passed`.
- If a gate is `Blocked`, record the blocker in the milestone doc and `task-board.md`.
