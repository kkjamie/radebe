# M3 Advanced Rendering Features

Milestone ID: `M3`
Title: `Advanced Rendering Features`
Owner: `Main Thread`
Last updated: `2026-05-26`
Status: `Planned`

## Outcome
- Expand the language beyond the first usable loop with higher-value rendering, authoring, and composition features that make Radebe meaningfully more expressive.

## Scope
- Add the next layer of authoring ergonomics such as expressions, built-in sprite variables, relative units, inline comments, and clearer ordering diagnostics.
- Add richer rendering/composition capabilities such as procedural fills, blend modes, transforms, reusable symbols, richer paths, boolean regions, and mask composition modes.
- Keep CLI, web docs/examples, and editor assistance aligned with each new language feature as it lands.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Authoring Ergonomics | Expression-like values, sprite-relative helpers, comments, and ordering guidance are implemented with diagnostics, docs, and editor support | Not Started | Seed tasks: T-068, T-075, T-087, T-088, T-091 |
| Gate B | Rendering Expansion | At least one substantial new rendering/composition family is implemented and verified across core, CLI, and web | Not Started | Seed tasks: T-063, T-064, T-065, T-066, T-067, T-069, T-070, T-071, T-073, T-077, T-079 |
| Gate C | Milestone Consolidation | Remaining M3 backlog is triaged into finished work, explicit deferments, or follow-on milestones with docs/examples refreshed | Not Started | Seed task: T-099 |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
