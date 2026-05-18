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
| Gate A | Basic Operation | One or two rendering commands are implemented and verified through `radebe-core`, `radebe-cli`, and `radebe-web` | Passed | T-012 replaced the speculative `@text` / `@repeat` slice with a schema-backed indentation-based parser/compiler path, a small `sprite` header block, and root-level `plot` and `line` commands verified through workspace build and tests. |
| Gate B | Feedback Loop | The first language commands have usable diagnostics and artifact presentation for iteration in the web and CLI surfaces | Passed | The CLI now prints the shared sprite-grid rows with compiler diagnostics, the web shell previews both the pixel grid and ASCII rows, and the SEA smoke path exercises the same spec-aligned sample. |
| Gate C | Unity Return | The packaged CLI path is exercised again from Unity after the basic command loop is stable | Not Started | Next thread should reuse the packaged CLI bridge from Unity against the new `sprite`/`plot`/`line` sample without widening language scope yet. |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
