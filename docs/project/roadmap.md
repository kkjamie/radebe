# Roadmap

Owner: `Main Thread`
Last updated: `2026-05-17`

## Planning Horizon
- Current: `2026-05-17` to `2026-05-24`
- Next: `2026-05-24` to `2026-06-14`

## Milestones
| Milestone | Outcome | Priority | Status | Target | Dependencies | Spec File | Current Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M0 | Planning baseline for the Radebe monorepo and package model | P0 | In Progress | 2026-05-24 | Initial setup | `docs/project/milestones/M0-planning-phase.md` | Gate C |
| M1 | Workspace scaffold for `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts` | P0 | In Progress | 2026-06-07 | M0 completed | `docs/project/milestones/M1-implementation-foundation.md` | Gate B |
| M2 | First usable language loop across CLI, web, and Unity bridge | P1 | Planned | 2026-06-28 | M1 completed | `docs/project/milestones/M2-scale-and-optimization.md` | Gate A |

## Priority Rules
- P0: blocks core progress or release path.
- P1: high value, not release-blocking.
- P2: useful improvements, schedule as capacity allows.

## Current Focus
- Use the staged `radebe-core` API baseline to evaluate CLI packaging and define the first `radebe-web` authoring loop.

## Gate Policy
- All milestones must define gates in `docs/project/milestones/Mx-*.md`.
- A milestone cannot move to `Done` until all required gates are `Passed`.
- If a gate is `Blocked`, record the blocker in the milestone doc and `task-board.md`.
