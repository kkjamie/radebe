# Session Log: Unity Plugin Eddie Redeploy

Date: `2026-05-27`
Thread: `codex`
Task: `T-133`
Milestone/Gate: `M2 / Gate C`

## Scope Completed
- Rebuilt the latest local Radebe CLI SEA payload for `win32-x64`.
- Rebuilt the native Unity plugin package at `Temp/radebe-unity-plugin-0.1.0.unitypackage`.
- Deployed the refreshed Unity plugin into the Eddie project configured by `.env`.
- Used the current canonical Unity plugin root, `Assets/Plugins/Radebe`, instead of the older local `.env` value `Assets/Radebe`.
- Updated the local ignored `.env` deploy subdir so future local redeploys use `Assets/Plugins/Radebe`.

## Files Changed
- `.env`: corrected local deploy subdir to `Assets/Plugins/Radebe`.
- `docs/project/task-board.md`: added completed operational redeploy entry T-133.
- `docs/project/main-thread-state.md`: recorded the local Eddie redeploy as an operational checkpoint that does not change T-126.
- `docs/project/session-log/2026-05-27-unity-plugin-eddie-redeploy.md`: added this handoff record.

## Behavioral Impact
- Eddie now has a refreshed Radebe Unity plugin under `D:/projects/personal/Eddie/Assets/Plugins/Radebe`.
- The deployed plugin includes current editor scripts, bridge manifest, and the refreshed packaged CLI payload under `Tools/radebe-cli/win32-x64`.
- The repo-local `.unitypackage` artifact for product `0.1.0` is rebuilt from the same fresh payload.

## Validation
- `node ./node_modules/typescript/bin/tsc -b scripts` passed.
- `node scripts/dist/src/sea.js build` passed and wrote `artifacts/radebe-cli/sea/win32-x64/radebe.exe`.
- `node scripts/dist/src/unity-package-native-poc.js` passed and wrote `Temp/radebe-unity-plugin-0.1.0.unitypackage`.
- `node scripts/dist/src/unity-deploy.js --deploy-subdir Assets/Plugins/Radebe` passed and deployed to Eddie.
- SHA-256 matched between repo and deployed `radebe.exe`: `DEA58729D4036D97C64EEFE28850AC96FC38E60711114C6EDEFDF19B3054CD4C`.
- Smoke render passed for both the repo executable and Eddie-deployed executable using a tiny `sprite smoke` source.
- Not run: Unity batchmode import verification; this request was a build/deploy refresh, and Eddie has previously had Unity package-resolution friction in batchmode.

## Remaining Work
- Continue T-126 release-hosting closeout; this redeploy does not solve external public artifact hosting.
- If a full Unity verification pass is desired, run Eddie through Unity editor import or a batchmode verifier after confirming its package setup is stable.

## Risks / Blockers
- The local `npm` wrapper still hits the known Windows profile `EPERM` in this Codex shell, so direct `node` script invocations were used.
- The SEA artifact manifest records local Node `v20.20.0`; the documented project baseline remains Node `20.18.1` with npm `10.9.2`.

## Exact Next 3 Steps
1. Open or focus Eddie in Unity and let it reimport `Assets/Plugins/Radebe`.
2. Create or reimport a small `.rdb` asset in Eddie to confirm the importer invokes the packaged CLI.
3. Resume T-126 by wiring external artifact hosting and restoring the public download pages.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `t-126-release-hosting-closeout`.

Objective:
- Finish the remaining M2 release path by wiring hosted public downloads into the staged release flow and validating the documented release checklist end to end.

Current state:
- A local operational redeploy on 2026-05-27 rebuilt the Radebe SEA payload and native Unity package, then deployed the current plugin into Eddie at `Assets/Plugins/Radebe`.
- The local ignored `.env` now points future Unity deploys at `Assets/Plugins/Radebe`.
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
7) docs/project/session-log/2026-05-27-unity-plugin-eddie-redeploy.md
8) docs/project/session-log/2026-05-26-t126-release-process.md
9) docs/project/session-log/2026-05-23-t-119-pages-safe-download-disable.md
10) azure-pipelines.yml
```

This is a good handoff point. Start a new worker thread.
