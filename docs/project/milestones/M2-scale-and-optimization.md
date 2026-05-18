# M2 First Usable Language Loop

Milestone ID: `M2`
Title: `First Usable Language Loop`
Owner: `Main Thread`
Last updated: `2026-05-18`
Status: `In Progress`

## Outcome
- Establish basic language operation with one or two rendering commands that are usable through the shared runtime and visible in the web preview.

## Scope
- Extend `radebe-core` with one or two minimal rendering commands in the language.
- Keep `radebe-cli` aligned with the updated language behavior through the existing shared pipeline.
- Keep `radebe-web` as the fastest feedback surface for previewing the new commands and their rendered artifact output.
- Preserve the Unity bridge baseline without making full Unity vertical integration the current priority.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Basic Operation | One or two rendering commands are implemented and verified through `radebe-core`, `radebe-cli`, and `radebe-web` | Blocked | The canonical language now uses a small `sprite` header block and root-level draw commands. The current `@text` / `@repeat` slice is implementation drift rather than gate-complete evidence. |
| Gate B | Feedback Loop | The first language commands have usable diagnostics and artifact presentation for iteration in the web and CLI surfaces | Not Started | Resume after the first spec-aligned slice exists, starting with `plot` and `line`. Keep the shared preview contract as small as possible unless the language requirements force expansion. |
| Gate C | Unity Return | The packaged CLI path is exercised again from Unity after the basic command loop is stable | Not Started | Revisit install/update and smoke behavior only after the first commands are working end to end elsewhere. |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
