# T-116 Unitypackage Export Script

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-116`
Milestone/Gate: `M2 / Gate C`

## Scope
- Add a real build-script path that outputs a `.unitypackage`.
- Keep the package generation aligned with the new `Assets/Plugins/Radebe` plugin-root layout.

## Completed
- Added `scripts/src/unity-common.ts` so Unity deploy and package flows share project/env/path helpers.
- Added `scripts/src/unity-package.ts` and `npm run package:unity`.
- The new package script deploys the current plugin root and packaged CLI payload into a configured Unity project, then invokes Unity batchmode with `Radebe.UnityBridge.Editor.RadebeUnityPackageExporter.ExportFromEnvironment`.
- Added `radebe-unity/Assets/Editor/RadebeUnityPackageExporter.cs`, which exports `Assets/Plugins/Radebe` through `AssetDatabase.ExportPackage`.
- Updated `.env.example` with `RADEBE_UNITY_EDITOR_PATH` and `RADEBE_UNITY_PACKAGE_OUTPUT`.
- Updated the Unity README, bridge contract, web integration download route, and project docs to reflect `.unitypackage` output as the intended local artifact.
- Logged DEC-053 for using Unity's own exporter instead of re-implementing `.unitypackage` assembly in repo scripts.

## Validation
- `npm run typecheck` passed.
- Not run: `npm run package:unity`. This still needs a configured Unity project and editor executable during a real batchmode run.
- Not run: direct inspection of an emitted `.unitypackage`, because the export itself was not executed in this thread.

## Remaining
- Run `npm run package:unity` in a configured environment.
- Check that `Temp/radebe-unity-plugin-0.1.0.unitypackage` is produced and imports cleanly.
- If Unity batchmode still hits the known project package-resolution issue, decide whether to use a cleaner export project or fix the local Unity project setup.

## Risks / Blockers
- The export path depends on Unity batchmode startup, which previously hit package-resolution issues in Eddie.
- The code is wired and typechecked, but end-to-end package export evidence is still missing.

## Exact Next 3 Steps
1. Ensure `.env` contains both `RADEBE_UNITY_PROJECT_PATH` and `RADEBE_UNITY_EDITOR_PATH`.
2. Run `npm run package:unity` and inspect `Temp/unity-package-export.log` if Unity exits non-zero.
3. If export succeeds, import the emitted `.unitypackage` into a test Unity project and verify the `Assets/Plugins/Radebe` contents.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-116-unitypackage-export-verify`.

Objective:
- Validate the new Unity-driven `.unitypackage` export flow.

Done criteria:
- `npm run package:unity` completes against a configured Unity project and editor path.
- `Temp/radebe-unity-plugin-0.1.0.unitypackage` is produced.
- The emitted package imports cleanly and contains the expected `Assets/Plugins/Radebe` plugin root with the packaged CLI payload under `Tools/radebe-cli/<platform>-<arch>/`.
- Docs are updated if Unity batchmode or package contents reveal any mismatch.

Constraints:
- Keep package generation driven by Unity's own exporter rather than a custom archive-format implementation.
- Keep `Assets/Plugins/Radebe` as the canonical plugin root.
- Preserve `artifacts/...` as internal build staging only.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-116)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-116-unitypackage-export-script.md
5) scripts/src/unity-package.ts
6) radebe-unity/Assets/Editor/RadebeUnityPackageExporter.cs
7) Temp/unity-package-export.log (if present)

At completion:
- Update task-board, roadmap if needed, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```

This is a good handoff point. Start a new worker thread.
