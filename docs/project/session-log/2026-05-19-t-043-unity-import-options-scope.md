# T-043 Unity Import Options Scope

Date: `2026-05-19`
Thread: `codex-main`
Task: `T-043`
Milestone/Gate: `M2 / Gate C`

## Scope
- Capture the next Unity follow-up after T-011 closure.
- Prioritize Unity importer options that improve sprite authoring ergonomics inside the editor.

## Decision
- The next Unity-focused task should expose importer options for:
  - Sprite border / 9-slice metadata
  - Pivot
  - Pixels per unit
  - Texture filtering, starting with point vs bilinear

## Rationale
- These settings are high-value Unity-facing controls that fit the existing ScriptedImporter model.
- They improve real production usability without changing the packaged CLI bridge or introducing a C# renderer.
- They can initially live as Unity import settings even if some metadata later becomes expressible in `.rdb`.

## Exact Next 3 Steps
1. Add or refine serialized importer fields and apply them consistently when creating the generated `Texture2D` and `Sprite`.
2. Verify the options behave correctly in Unity editor workflows, especially border/9-slice and filtering.
3. Update docs and decide whether any import options should later become part of the source-language metadata surface.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-043-unity-import-options`.

Objective:
- Add Unity importer options for sprite settings and slicing metadata on `.rdb` imports.

Done criteria:
- The `.rdb` ScriptedImporter exposes practical Unity-facing options for pivot, pixels per unit, border/9-slice metadata, and filtering.
- Imported Sprite assets reflect those settings correctly in Unity.
- The packaged CLI bridge and `.env`-driven deploy flow remain unchanged.
- Project docs are updated to reflect the implemented Unity importer options.

Constraints:
- Keep Eddie-specific configuration in ignored local files.
- Keep Unity consuming the packaged `radebe-cli`; do not add a C# renderer.
- Prefer Unity importer/editor settings over changing the `.rdb` language unless a clear need appears.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-043)
3) docs/project/roadmap.md
4) docs/project/milestones/M2-scale-and-optimization.md
5) docs/project/session-log/2026-05-19-t-011-unity-gate-c-closeout.md
6) radebe-unity/Assets/Editor/RadebeSpriteImporter.cs
7) docs/project/main-thread-state.md

At completion:
- Update task-board, roadmap if priority changes, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```
