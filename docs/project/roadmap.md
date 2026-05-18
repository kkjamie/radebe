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
| M2 | First usable language loop with basic rendering commands across core, CLI, and web before returning to Unity integration | P1 | In Progress | 2026-06-28 | M1 completed | `docs/project/milestones/M2-scale-and-optimization.md` | Gate A |

## Priority Rules
- P0: blocks core progress or release path.
- P1: high value, not release-blocking.
- P2: useful improvements, schedule as capacity allows.

## Current Focus
- M1 Gate C has passed with the shared core/web render contract, SEA packaging pipeline, and Unity payload install/update plus smoke helper baseline in place.
- The recovered source product spec restored the canonical language shape, including syntax examples, semantic categories, child-capability rules, and a schema-driven extensibility model that were missing from the consolidated docs.
- The current preferred authoring model is a small `sprite` header block plus root-level draw commands, with `plot` and then `line` as the first real commands.
- M2 returns to Gate A because the current speculative `@text` / `@repeat` implementation does not match the canonical language direction. The next priority is a spec-aligned vertical slice through `radebe-core`, `radebe-cli`, and `radebe-web` before more Unity validation.

## Gate Policy
- All milestones must define gates in `docs/project/milestones/Mx-*.md`.
- A milestone cannot move to `Done` until all required gates are `Passed`.
- If a gate is `Blocked`, record the blocker in the milestone doc and `task-board.md`.
