# T-011 Unity Plugin Importer Baseline

Date: `2026-05-19`
Thread: `codex-main`
Task: `T-011`
Milestone/Gate: `M2 / Gate C`

## Scope
- Restart Unity integration as a real plugin/importer baseline.
- Keep repo-owned plugin code in `radebe-unity`.
- Keep Eddie-specific test state outside the repo while allowing local deployment through `.env`.

## Completed
- Added `radebe compile <source-file> --format unity-json` to `radebe-cli`.
- Added a CLI test proving the Unity JSON artifact shape includes sprite metadata, rows, row-major `#rrggbbaa` pixels, and diagnostics.
- Added a `.rdb` ScriptedImporter in `radebe-unity` that invokes the packaged CLI, parses the Unity JSON artifact, flips top-left source pixels into Unity texture order, and creates generated `Texture2D` plus `Sprite` subassets.
- Added Unity editor menu helpers for payload validation, install/update, and smoke testing.
- Added a Unity importer verifier utility intended for batchmode Sprite main-asset assertions.
- Added `scripts/src/unity-deploy.ts`, root `npm run deploy:unity`, `.env.example`, and `.gitignore` coverage for local `.env` files.
- Created a local ignored `.env` on this machine pointing `RADEBE_UNITY_PROJECT_PATH` at Eddie.
- Built and deployed the plugin plus the current `win32-x64` packaged CLI payload into Eddie.
- Created a configured-project-local smoke asset at `Assets/RadebeSmoke/panel.rdb`.

## Validation
- `npm run typecheck` passed outside the sandbox.
- `npm test` passed outside the sandbox.
- `npm run package:cli:sea` passed and produced `artifacts/radebe-cli/sea/win32-x64/radebe.exe`.
- `npm run smoke:cli:sea` passed with bundled and SEA stdout `####\n.#..\n....\n`.
- `npm run deploy:unity` deployed plugin code to the configured Unity project's `Assets/Radebe` folder and CLI payload to `Assets/StreamingAssets/Radebe/radebe-cli/win32-x64`.
- Unity batchmode compiled the deployed editor plugin without Radebe C# errors.
- The configured-project-local `.rdb` smoke asset received ScriptedImporter metadata.
- The deployed `radebe.exe compile <configured-project>/Assets/RadebeSmoke/panel.rdb --format unity-json` returned exit code `0` and emitted a `unity-sprite` artifact named `unity-smoke`.

## Remaining
- The batchmode `-executeMethod Radebe.UnityBridge.Editor.RadebeUnityImportVerifier.VerifyEnvironmentSmokeAsset` runs did not emit the expected verifier log before Unity exited, so there is still no hard captured assertion that `AssetDatabase.LoadAssetAtPath<Sprite>("Assets/RadebeSmoke/panel.rdb")` returns the generated Sprite.
- M2 Gate C should remain `In Progress` until that Unity-side Sprite assertion is captured.

## Risks / Blockers
- The importer implementation shape is in place, but evidence is not yet strong enough to call Gate C passed.
- The deployed CLI payload currently lives in `StreamingAssets`, which is acceptable for this bridge baseline but should be revisited before deciding what ships in player builds.

## Exact Next 3 Steps
1. Fix or replace the Unity batchmode verifier so it logs and exits with a hard pass/fail for loading the generated Sprite main asset from `Assets/RadebeSmoke/panel.rdb`.
2. If the verifier passes, update `docs/project/milestones/M2-scale-and-optimization.md`, `docs/project/task-board.md`, and `docs/project/main-thread-state.md` to mark Gate C / T-011 passed.
3. Choose the next Unity slice: metadata-driven importer settings such as pivot, PPU, and border, or a cleaner editor-only CLI payload location outside `StreamingAssets`.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-011-unity-importer-verification`.

Objective:
- Finish M2 Gate C by capturing a hard Unity-side assertion that a deployed `.rdb` asset imports as a generated Sprite main asset.

Done criteria:
- A configured Unity test project has the repo plugin deployed through `npm run deploy:unity`.
- Unity batchmode verifies `AssetDatabase.LoadAssetAtPath<Sprite>("Assets/RadebeSmoke/panel.rdb")` returns a Sprite with the expected texture dimensions.
- Any Unity verifier issue is fixed in repo-owned `radebe-unity` code, not by hard-coding Eddie paths.
- M2 Gate C and T-011 docs are updated to Passed/Done only after the assertion is captured.

Constraints:
- Keep Eddie-specific paths and smoke assets outside the repo.
- Keep Unity consuming the packaged `radebe-cli`; do not add a C# renderer.
- Use `.env` / environment variables for local deploy target configuration.

Read order:
1) AGENTS.md
2) docs/project/task-board.md (item: T-011)
3) docs/project/milestones/M2-scale-and-optimization.md (Gate C)
4) docs/project/session-log/2026-05-19-t-011-unity-plugin-importer-baseline.md
5) radebe-unity/docs/cli-bridge-contract.md
6) docs/project/codebase-map.md (Unity and scripts sections)

At completion:
- Update task-board, milestone, roadmap if gate status changes, decisions if needed, session-log, and main-thread-state.
- Return a handoff using docs/agent/handoff-template.md.
```
