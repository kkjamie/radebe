# M3 Refactoring And Architecture Stabilization

Milestone ID: `M3`
Title: `Refactoring And Architecture Stabilization`
Owner: `Main Thread`
Last updated: `2026-05-29`
Status: `In Progress`

## Outcome
- Reduce the highest-risk codebase hotspots before the GitHub migration, so the public repo and release pipeline are moved after the core compiler, renderer, tests, web playground, and supporting tooling have clearer ownership boundaries.

## Scope
- Improve the refactor safety net before behavior-changing compiler or renderer extractions.
- Split the core compiler into clearer command-owned and argument/value-owned modules while preserving public `@radebe/core` APIs.
- Move compiler and renderer internals toward the accepted class-owned architecture direction without moving behavior onto plain-data render instructions.
- Split the web Playground, web styling, performance tooling, and Unity bridge helper where doing so lowers future change risk.
- Keep all refactors behavior-preserving unless a specific bug is deliberately fixed with regression coverage.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Core Safety And Compiler Boundaries | The core render/compiler test safety net is easier to work with, shared argument/value binding exists for at least the duplicated high-risk cases, and the compiler is split behind stable public APIs | Passed | T-143, T-141, and T-140 are complete: tests are split by concern, malformed-token coverage is in place, shared argument binding covers the high-risk cases, and `compiler.ts` now delegates to focused compiler modules while preserving the public compile API |
| Gate B | Renderer And Core Ownership | Renderer appearance-pass duplication is reduced where practical, and the first class-owned compiler/renderer slices follow DEC-078 without per-pixel object churn or instruction-owned rendering behavior | In Progress | T-147 is complete with an internal `Compiler` owner behind the public `compileDocument` facade; next seed task is T-133 renderer appearance-pass capability cleanup |
| Gate C | Tooling And Surface Module Splits | The largest non-core hotspots are split into focused modules or services with closest-practical validation | Not Started | Seed tasks: T-142, T-144, T-145, T-146 |
| Gate D | Refactor Consolidation | Refactor work is documented, tests/builds pass, remaining debt is either closed or re-scoped, and the repo is ready for GitHub migration | Not Started | Update task board, debt register, roadmap, and session log before advancing to M4 |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
