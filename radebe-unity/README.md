# `radebe-unity`

Unity-facing integration assets will live here.

## Direction
- Consume the packaged `radebe-cli` executable as the single bridge into the canonical TypeScript implementation.
- Avoid introducing a separate Unity-side runtime port.
- Treat the implemented Node SEA artifact layout as the Unity bridge baseline.

## Bridge Contract
- Contract doc: `radebe-unity/docs/cli-bridge-contract.md`
- Bridge manifest: `radebe-unity/bridge.manifest.json`
- Unity should launch the packaged CLI executable, not a local `node` process and not raw workspace sources.

## Expected Layout
- `Assets/Editor/`: Unity editor scripts that invoke the CLI.
- `Assets/Editor/RadebeCliBridgeHelper.cs`: install validation and process-launch helper baseline for the packaged CLI payload.
- `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/`: installed CLI payload copied from the packaged SEA artifact.
- `docs/`: integration notes, bridge contract, and smoke-test instructions.

## Current Baseline
- Packaged artifact root: `artifacts/radebe-cli/sea/<platform>-<arch>/`
- Default executable base name: `radebe`
- Windows executable name: `radebe.exe`
- Sidecar files Unity should preserve beside the executable:
  - `radebe.bundle.cjs`
  - `radebe.sea.blob`
  - `sea-config.json`
  - `artifact-manifest.json`

## Editor Helper Baseline
- `RadebeCliBridgeHelper.ValidateInstalledPayload()` checks the installed `StreamingAssets` payload for the current platform.
- `RadebeCliBridgeHelper.InstallOrUpdatePayload()` validates the packaged SEA source folder, compares manifests, and copies or refreshes the whole platform directory into `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/`.
- `RadebeCliBridgeHelper.RunSmokeTest()` invokes the installed packaged CLI with the current single-argument contract and asserts the known `hello -> hello\n` smoke path.
- The helper defaults its source artifact root to `../artifacts/radebe-cli/sea/` relative to the Unity project when no explicit path is provided.
