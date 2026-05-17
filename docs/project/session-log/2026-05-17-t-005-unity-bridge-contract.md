# Session Log: T-005 Unity Bridge Contract

Date: `2026-05-17`
Thread: `t-005-unity-bridge-contract`

## Scope
- Define the Unity bridge contract for `radebe-unity` consuming the implemented `radebe-cli` SEA artifact path.
- Document install/update expectations, executable naming, artifact layout, and error/reporting behavior without introducing a separate runtime path.

## Work Completed
- Added `radebe-unity/docs/cli-bridge-contract.md` as the Unity-local source of truth for the packaged CLI bridge.
- Documented the implemented SEA artifact root `artifacts/radebe-cli/sea/<platform>-<arch>/`, the default executable base name `radebe`, and the required sidecar files emitted by `scripts/src/sea.ts`.
- Captured the current invocation contract against the real CLI behavior:
  - one positional source-string argument,
  - stdout carries the rendered output with a trailing newline,
  - exit code `0` for no diagnostics and `1` when diagnostics are present or the process fails.
- Documented the recommended Unity install/update model as replacing the entire platform-specific artifact folder under `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/`.
- Updated `radebe-unity/README.md`, `radebe-unity/bridge.manifest.json`, and project docs so the canonical split stays consistent between local bridge docs and project-level references.

## Verification
- Verified the contract against:
  - `scripts/src/sea.ts` for artifact naming, folder layout, and manifest behavior,
  - `radebe-cli/src/index.ts` for invocation and exit-code behavior,
  - `scripts/test/sea.test.ts` for the packaged executable smoke baseline.
- No code or runtime behavior changed; no additional test run was required for this documentation-only task.

## Follow-On Impact
- Unity implementation work now has a concrete packaged-CLI contract to target instead of a placeholder bridge description.
- The next Unity task can focus on install validation and process-launch helpers rather than re-deciding artifact structure.
