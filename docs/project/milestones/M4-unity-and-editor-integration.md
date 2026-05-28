# M4 Unity And Editor Integration

Milestone ID: `M4`
Title: `Unity And Editor Integration`
Owner: `Main Thread`
Last updated: `2026-05-28`
Status: `Planned`

## Outcome
- Turn the existing CLI-backed Unity/plugin baseline and current web editor work into a deliberate integration milestone focused on importer capabilities, reusable editor surfaces, and in-Unity authoring experience.

## Scope
- Extend the Unity-facing source/import contract where needed, starting with author-authored import metadata and any follow-up package validation that supports the editor flow.
- Define and package a reusable editor surface that can be consumed outside the current web shell.
- Design and implement the first meaningful Unity editor/live-authoring workflow on top of the shared language/runtime contracts.

## Gate Definitions
| Gate | Name | Required Evidence | Status | Notes |
| --- | --- | --- | --- | --- |
| Gate A | Unity Metadata Contract | Unity-facing source metadata and importer expectations are defined, implemented, and validated | Not Started | Seed task: T-072 |
| Gate B | Reusable Editor Surface | The editor host is packaged behind a deliberate reusable boundary with documented consumption expectations | Not Started | Seed tasks: T-054, T-137 |
| Gate C | Unity Authoring Workflow | Unity gets a practical editor/live-authoring experience that builds on the reusable editor and packaged CLI/plugin path | Not Started | Seed task: T-055 |

Allowed status values: `Not Started`, `In Progress`, `Passed`, `Blocked`.
