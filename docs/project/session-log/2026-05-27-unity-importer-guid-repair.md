# Session Log: Unity Importer GUID Repair

Date: `2026-05-27`
Thread: `codex`
Task: `T-134`
Milestone/Gate: `M2 / Gate C`

## Scope Completed
- Investigated Eddie `.rdb` assets showing missing script after the local Unity plugin redeploy.
- Confirmed the deployed `RadebeSpriteImporter.cs.meta` GUID had drifted to `6640e18c04fcca044c4a6433be509617`.
- Confirmed existing Eddie `.rdb.meta` files still reference importer script GUID `7d26963f36cf2114eb572a982375d4c1`.
- Restored `radebe-unity/Assets/Editor/RadebeSpriteImporter.cs.meta` to the existing Eddie importer GUID.
- Rebuilt `Temp/radebe-unity-plugin-0.1.0.unitypackage`.
- Redeployed the plugin to Eddie at `Assets/Plugins/Radebe`.
- Recorded DEC-073 so the importer GUID stays stable in future package and deploy work.

## Files Changed
- `radebe-unity/Assets/Editor/RadebeSpriteImporter.cs.meta`: restored GUID to `7d26963f36cf2114eb572a982375d4c1`.
- `docs/project/task-board.md`: added completed T-134.
- `docs/project/decisions.md`: added DEC-073 for the stable ScriptedImporter GUID.
- `docs/project/main-thread-state.md`: recorded the compatibility repair.
- `docs/project/session-log/2026-05-27-unity-importer-guid-repair.md`: added this handoff record.

## Behavioral Impact
- Existing Eddie `.rdb.meta` import settings should resolve `RadebeSpriteImporter` again after Unity refreshes imports.
- Future native `.unitypackage` outputs include the same stable importer GUID, so package imports should not create the same missing-script break for existing assets.
- No `.rdb.meta` files in Eddie were rewritten.

## Validation
- Compared repo and Eddie `RadebeSpriteImporter.cs.meta`; both now use `7d26963f36cf2114eb572a982375d4c1`.
- Searched Eddie `.meta` files for the accidental GUID `6640e18c04fcca044c4a6433be509617`; no matches remained.
- Verified the rebuilt `Temp/radebe-unity-plugin-0.1.0.unitypackage` contains a `7d26963f36cf2114eb572a982375d4c1` entry.
- `node ./node_modules/typescript/bin/tsc -b scripts` passed.
- `node scripts/dist/src/unity-package-native-poc.js` passed.
- `node scripts/dist/src/unity-deploy.js` passed and redeployed to Eddie.
- Smoke render passed through the Eddie-deployed `radebe.exe`.
- Not run: Unity editor or batchmode import verification; the file-level GUID mismatch was confirmed and repaired directly, and Eddie has had prior batchmode package-resolution friction.

## Remaining Work
- Open or focus Eddie in Unity so it refreshes the plugin script meta and reimports affected `.rdb` assets.
- If Unity still shows missing script after refresh, trigger a manual reimport of the affected `.rdb` folder or restart Unity to flush stale importer cache.
- Continue T-126 release-hosting closeout.

## Risks / Blockers
- Any assets created during the short accidental `6640e18c04fcca044c4a6433be509617` window would need meta repair or reimport; verification found no Eddie `.rdb.meta` files using that GUID.
- Unity may need an editor refresh/restart before the Inspector stops showing stale missing-script state.

## Exact Next 3 Steps
1. Refresh Eddie in Unity and let `Assets/Plugins/Radebe/Editor/RadebeSpriteImporter.cs` reimport.
2. Reimport `Assets/Game/Art/GUI/Rad` if the Inspector still shows stale missing-script state.
3. Resume T-126 by wiring external artifact hosting and restoring the public download pages.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-126-release-hosting-closeout`.

Objective:
- Finish the remaining M2 release path by wiring hosted public downloads into the staged release flow and validating the documented release checklist end to end.

Current state:
- A local operational redeploy on 2026-05-27 rebuilt and deployed the Unity plugin into Eddie at `Assets/Plugins/Radebe`.
- A follow-up repair restored `RadebeSpriteImporter.cs.meta` to the existing Eddie ScriptedImporter GUID `7d26963f36cf2114eb572a982375d4c1`, rebuilt the Unity package, and redeployed.
- T-126 remains open because Cloudflare Pages cannot host the large CLI and Unity downloads directly inside the site bundle.

Done criteria:
- Choose and wire the external artifact host.
- Restore the public integration/download pages with validated hosted URLs.
- Prove the staged Azure/Cloudflare release path end to end using the documented release checklist.
- Update task-board, roadmap if needed, decisions if a new infrastructure choice is made, session-log, and main-thread-state.

Read order:
1) AGENTS.md
2) docs/project/task-board.md
3) docs/project/roadmap.md
4) docs/project/milestones/M2-scale-and-optimization.md
5) docs/project/release-process.md
6) docs/project/main-thread-state.md
7) docs/project/session-log/2026-05-27-unity-importer-guid-repair.md
8) docs/project/session-log/2026-05-27-unity-plugin-eddie-redeploy.md
9) docs/project/session-log/2026-05-23-t-119-pages-safe-download-disable.md
10) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
