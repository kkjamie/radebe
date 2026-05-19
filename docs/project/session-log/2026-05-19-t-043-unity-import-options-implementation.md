# T-043 Unity Import Options Implementation

Date: `2026-05-19`
Thread: `codex-main`
Task: `T-043`
Milestone/Gate: `M2 / Gate C`

## Scope
- Implement the first Unity importer options pass for `.rdb` assets.
- Keep the packaged CLI bridge and `.env`-driven Eddie deploy path unchanged.

## Completed
- Extended `RadebeSpriteImporter` with explicit pivot preset support while keeping custom pivot available.
- Added importer-side sanitation for 9-slice border values so oversized borders are clamped against the generated sprite dimensions.
- Added importer options for sprite mesh type and extrude edges alongside the existing PPU, filter mode, and wrap mode.
- Added a custom `RadebeSpriteImporterEditor` inspector that groups sprite, texture, and bridge settings with Unity-facing labels and help text.
- Added a live importer preview overlay that draws the imported sprite plus border guides and pivot marker from the current inspector values so border tuning can happen visually before reimport.
- Redeployed the updated plugin and packaged CLI payload into Eddie with `npm run deploy:unity`.

## Validation
- Repo-side patch review confirms the importer now resolves pivot presets before `Sprite.Create` and applies sanitized border values during import.
- `npm run deploy:unity` completed successfully and redeployed:
  - `Assets/Radebe`
  - `Assets/StreamingAssets/Radebe/radebe-cli/win32-x64`
- No automated Unity editor verification was completed in this thread; the remaining check is manual in-editor validation of the new inspector controls and live preview behavior.

## Remaining
- Open a deployed `.rdb` asset in Eddie and confirm the new importer inspector options are visible and behave correctly on reimport.
- Confirm the live preview updates border guides and pivot marker immediately as importer fields change.
- Verify especially:
  - border / 9-slice behavior
  - pivot presets and custom pivot
  - pixels per unit
  - point vs bilinear filtering
  - mesh type / extrude behavior if used

## Risks / Blockers
- There is still no automated Unity-side assertion for the new importer option behavior.
- The custom importer editor should be straightforward, but final confirmation depends on Unity editor inspection.

## Exact Next 3 Steps
1. Open a deployed `.rdb` asset in Eddie and test the new importer inspector settings.
2. If the settings behave correctly, mark T-043 `Done` and update the Unity docs/state files with the validated workflow.
3. Decide whether any importer options should remain Unity-only or later be expressible in `.rdb` source metadata.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-043-unity-import-options-verify`.

Objective:
- Validate the new `.rdb` Unity importer options in Eddie and close T-043 if they behave correctly.

Done criteria:
- A deployed `.rdb` asset in Eddie shows the new importer inspector settings.
- Reimport behavior is confirmed for pivot, pixels per unit, border/9-slice metadata, and filtering.
- Any issue discovered is fixed in repo-owned importer/editor code.
- Project docs are updated to mark T-043 done only after Unity validation happens.

Constraints:
- Keep Eddie-specific configuration in ignored local files.
- Keep Unity consuming the packaged `radebe-cli`; do not add a C# renderer.
- Preserve the current packaged-CLI bridge and `.env`-driven deploy flow.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-043)
3) docs/project/roadmap.md
4) docs/project/session-log/2026-05-19-t-043-unity-import-options-scope.md
5) docs/project/session-log/2026-05-19-t-043-unity-import-options-implementation.md
6) radebe-unity/Assets/Editor/RadebeSpriteImporter.cs
7) radebe-unity/Assets/Editor/RadebeSpriteImporterEditor.cs
8) docs/project/main-thread-state.md

At completion:
- Update task-board, roadmap if priority changes, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```
