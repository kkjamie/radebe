# Session Log: T-009 Unity Payload Install and Smoke Helper

Date: `2026-05-18`
Thread: `t-009-unity-payload-install-smoke`

## Scope
- Review M1 Gate C readiness after the shared `radebe-core`/`radebe-web` render contract landed.
- Continue the Unity bridge follow-on work for packaged payload install-copy/update and smoke execution.
- Keep Unity consuming `radebe-cli` rather than introducing a separate runtime path.

## Work Completed
- Reviewed the current M1 readiness state and confirmed the largest remaining gap was Unity-side payload lifecycle support rather than deeper web preview work.
- Extended [RadebeCliBridgeHelper.cs](/d:/projects/personal/radebe/radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs) with source-payload validation against the SEA artifact directory, using the current platform key and requiring the packaged manifest plus executable.
- Added `InstallOrUpdatePayload()` to compare the packaged source manifest with the installed `StreamingAssets` manifest and copy or refresh the entire `<platform>-<arch>` folder atomically when the payload changed or was missing.
- Added `RunSmokeTest()` on top of the existing invocation path so Unity can validate the installed packaged CLI with the current `hello -> hello\n` contract while treating the known unsigned SEA warning as non-fatal noise when execution succeeds.
- Updated the Unity README, CLI bridge contract, and project codebase map so the new install/update and smoke helper baseline is discoverable in the docs.
- Passed M1 Gate C and marked the milestone complete in the milestone and roadmap docs.

## Verification
- `npm run build`
- `npm test`
- `npm run smoke:cli:sea`

## Notes
- `npm run smoke:cli:sea` initially failed inside the sandbox with a Windows `EPERM` error against `C:\Users\JamieH~1`; rerunning the same command outside the sandbox succeeded, so the failure appears environmental rather than a packaging regression.
- There is still no runnable Unity editor harness in this repository, so this thread did not compile the C# helper inside Unity or execute the helper against a live `StreamingAssets` install.
- The next thread should reconcile `docs/project/milestones/M2-scale-and-optimization.md` with the roadmap's M2 definition before starting M2 execution to avoid cross-file drift.

## Next Recommendation
- Treat M1 as complete, align the M2 milestone file with the roadmap, then run the new Unity payload install/update and smoke helper in a real Unity editor project before widening the first usable language loop.
