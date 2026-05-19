# T-011 Unity Env Redeploy

Date: `2026-05-19`
Thread: `codex-main`
Task: `T-011`
Milestone/Gate: `M2 / Gate C`

## Scope
- Restore the local Unity target configuration for Eddie through `.env`.
- Re-run the repo-owned Unity deploy flow and retry the batchmode importer verification.

## Completed
- Created a local ignored `.env` with `RADEBE_UNITY_PROJECT_PATH=D:/projects/personal/eddie` and the default `RADEBE_UNITY_DEPLOY_SUBDIR=Assets/Radebe`.
- Confirmed the sibling Eddie Unity project still exists and has a valid `ProjectSettings/ProjectVersion.txt`.
- Re-ran `npm run deploy:unity`, which rebuilt the SEA payload and redeployed `radebe-unity/Assets` plus the packaged CLI payload into Eddie.
- Recreated a temporary smoke asset at `Assets/Radebe/panel.rdb` inside Eddie so the deployed importer has a concrete `.rdb` file to load.
- Re-ran Unity batchmode against `Radebe.UnityBridge.Editor.RadebeUnityImportVerifier.VerifyEnvironmentSmokeAsset` and captured a repo-local log file.

## Validation
- `npm run deploy:unity` passed and redeployed:
  - `Assets/Radebe`
  - `Assets/StreamingAssets/Radebe/radebe-cli/win32-x64`
- Unity executable used for verification: `C:/Program Files/Unity/Hub/Editor/6000.0.32f1/Editor/Unity.exe`
- Batchmode log capture in `Temp/unity-import-verify.log` shows Unity stopping during package resolution before `-executeMethod` reached the verifier.
- The blocking error in the captured log is:
  - `Project has invalid dependencies: com.unity.test-framework: Package [com.unity.test-framework@1.6.0] cannot be found`

## Remaining
- No remaining work in this thread after manual Eddie verification confirmed the deployed importer produces a Sprite main asset.

## Risks / Blockers
- Eddie still has a separate batchmode package-resolution issue around `com.unity.test-framework`, so future automation-first Unity work may still want a cleaner verification project or a fixed Eddie package setup.

## Exact Next 3 Steps
1. Choose the next Unity follow-up slice, likely importer metadata such as pivot, PPU, and border.
2. Decide whether to fix Eddie batchmode package resolution before any automation-heavy Unity follow-up.
3. If Unity pauses, move back to the next unblocked language or tooling task with T-011 closed.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-011-unity-batchmode-project-blocker`.

Objective:
- Unblock M2 Gate C by getting a Unity project to complete batchmode startup and reach the Radebe importer verifier.

Done criteria:
- The active Unity project completes package resolution in batchmode.
- `Radebe.UnityBridge.Editor.RadebeUnityImportVerifier.VerifyEnvironmentSmokeAsset` runs against `Assets/Radebe/panel.rdb`.
- The run captures a hard pass/fail log for `AssetDatabase.LoadAssetAtPath<Sprite>("Assets/Radebe/panel.rdb")`.
- Gate C / T-011 docs are updated only if that Sprite assertion is captured.

Constraints:
- Keep Eddie-specific configuration in local ignored files such as `.env`.
- Keep Unity consuming the packaged `radebe-cli`; do not add a C# renderer.
- Prefer fixing the Unity project startup blocker over adding speculative repo-side importer changes.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-011)
3) docs/project/milestones/M2-scale-and-optimization.md (Gate C)
4) docs/project/session-log/2026-05-19-t-011-unity-plugin-importer-baseline.md
5) docs/project/session-log/2026-05-19-t-011-unity-env-redeploy.md
6) docs/project/main-thread-state.md

At completion:
- Update task-board, roadmap if gate state changes, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```
