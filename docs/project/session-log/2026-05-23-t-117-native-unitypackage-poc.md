# T-117 Native Unitypackage POC

Date: `2026-05-23`
Thread: `codex-main`
Task: `T-117`
Milestone/Gate: `M2 / Gate C`

## Scope
- Prove that the project can assemble a `.unitypackage` without Unity, a Unity project, or a Unity installation.
- Keep the result explicitly marked as a proof of concept rather than the final release path.

## Completed
- Added `scripts/src/unity-package-native-poc.ts`.
- Added `npm run package:unity:native-poc`.
- The native POC:
  - packages the canonical `Assets/Plugins/Radebe` plugin layout directly from repo sources
  - includes `bridge.manifest.json`
  - includes the current platform SEA payload under `Assets/Plugins/Radebe/Tools/radebe-cli/<platform>-<arch>/`
  - synthesizes deterministic folder/file `.meta` contents because the repo does not yet store Unity-authored `.meta` files
  - emits a `.unitypackage` as a gzipped tar archive with GUID-named folders containing `pathname`, `asset.meta`, and `asset` entries
- Generated `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage`.
- Recorded DEC-054 to keep the native path as a POC until the repo owns real Unity metadata.
- Follow-up work later harvested Unity-authored `.meta` files from a clean verification project back into `radebe-unity`, reducing the native packer's dependence on synthetic metadata.

## Validation
- `npm run typecheck` passed.
- `npm run package:cli:sea` passed.
- `npm run package:unity:native-poc` passed and wrote `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage`.
- `tar -tzf Temp/radebe-unity-plugin-0.1.0-poc.unitypackage` showed the expected GUID-folder package structure.
- Spot-checked archive contents:
  - `pathname` resolved to `Assets/Plugins/Radebe/bridge.manifest.json`
  - `asset.meta` contained a matching deterministic GUID

## Remaining
- Decide whether to promote the native packer beyond POC status.
- If yes, add committed Unity `.meta` files and reconcile the synthetic metadata logic with real import settings and GUID ownership.
- Import the POC package into a Unity test project to see how well the synthetic metadata behaves in practice.

## Risks / Blockers
- The POC currently synthesizes generic `DefaultImporter` metadata for all files, which is enough to prove package shape but may not be sufficient for all final importer settings or asset references.
- The repo still lacks checked-in Unity `.meta` files, so the current deterministic GUID strategy is a packaging convenience rather than an exact reproduction of Unity-authored metadata.

## Exact Next 3 Steps
1. Import `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage` into a throwaway Unity project and observe how the synthetic metadata behaves.
2. Decide whether the project wants to own real `.meta` files in source control for `Assets/Plugins/Radebe`.
3. If the answer is yes, replace or narrow the synthetic metadata generator and move the native packer closer to the real publish path.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-117-native-unitypackage-import-check`.

Objective:
- Test the native `.unitypackage` proof of concept inside Unity and judge whether the synthetic metadata approach is viable.

Done criteria:
- `Temp/radebe-unity-plugin-0.1.0-poc.unitypackage` is imported into a test Unity project.
- The imported package layout under `Assets/Plugins/Radebe` is checked.
- Any importer, script compilation, or payload-path issues are captured clearly.
- Docs are updated with findings and a recommendation on whether to promote or discard the native packaging path.

Constraints:
- Treat the native packer as a proof of concept unless the evidence clearly supports promotion.
- Keep `Assets/Plugins/Radebe` as the canonical plugin root.
- Do not silently replace the Unity-driven exporter without explicitly recording the tradeoff.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-117)
3) docs/project/roadmap.md (milestone: M2)
4) docs/project/session-log/2026-05-23-t-117-native-unitypackage-poc.md
5) scripts/src/unity-package-native-poc.ts
6) radebe-unity/README.md
7) docs/project/decisions.md

At completion:
- Update task-board, roadmap if needed, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```

This is a good handoff point. Start a new worker thread.
