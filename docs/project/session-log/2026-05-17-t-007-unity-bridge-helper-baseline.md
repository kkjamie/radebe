# Session Log: T-007 Unity Bridge Helper Baseline

Date: `2026-05-17`
Thread: `t-007-unity-bridge-helper-baseline`

## Scope
- Implement the first Unity-side install validation and process-launch helper against the documented `radebe-cli` SEA artifact contract.
- Keep Unity consuming the packaged CLI rather than introducing a separate runtime path.

## Work Completed
- Added [RadebeCliBridgeHelper.cs](/d:/projects/personal/radebe/radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs) under `radebe-unity/Assets/Editor/` as the first Unity editor-side helper baseline.
- Implemented platform-key resolution for the packaged CLI payload using the contract's `<platform>-<arch>` layout and `Application.streamingAssetsPath`.
- Implemented install validation that checks the platform-specific install folder, manifest availability and parsing, executable-name resolution, and executable presence for the current platform.
- Implemented synchronous process launch with captured stdout, stderr, resolved executable path, argument list, exit code, and timeout or launch-failure reporting.
- Updated the Unity bridge contract wording to clarify that Unity must use the leaf name of `artifact-manifest.json`'s `executablePath` because the current SEA manifest stores an absolute build-time path that does not remain valid after the payload is copied into `StreamingAssets`.
- Updated `radebe-unity/README.md` and `docs/project/codebase-map.md` to reflect the new helper entrypoint.

## Verification
- Verified the helper logic against `scripts/src/sea.ts` for the real SEA manifest schema and executable naming.
- Verified the helper logic against `radebe-cli/src/index.ts` for the current single-argument invocation contract and exit-code behavior.
- Verified the helper logic against `radebe-unity/docs/cli-bridge-contract.md` for the installed payload layout and reporting expectations.
- No runnable Unity test harness exists in the repository yet, so this thread did not execute Unity compilation or editor smoke tests.

## Follow-On Impact
- Unity now has a concrete helper baseline for validating an installed packaged CLI payload and invoking it without depending on a system Node.js runtime.
- The next Unity thread can focus on copying packaged artifacts into `StreamingAssets`, wiring a Unity smoke command around the helper, and validating the flow inside a real Unity project/editor session.
