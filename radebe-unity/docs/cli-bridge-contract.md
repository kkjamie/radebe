# Unity CLI Bridge Contract

Owner: `t-005-unity-bridge-contract`
Last updated: `2026-05-19`

## Purpose
- Define how `radebe-unity` consumes the packaged `radebe-cli` Node SEA artifact.
- Keep Unity aligned to the implemented CLI packaging layout from T-006.
- Preserve `radebe-cli` as the only bridge into the canonical TypeScript implementation.

## Contract Baseline
- Producer: `scripts/src/sea.ts`
- Artifact root: `artifacts/radebe-cli/sea/<platform>-<arch>/`
- Default artifact base name: `radebe`
- Platform directory key: Node runtime values joined as `<process.platform>-<process.arch>`
- Current implementation emits one runnable executable plus sidecar metadata and build files in the same directory.

## Artifact Layout
Each packaged build lives under one platform-specific folder:

```text
artifacts/
  radebe-cli/
    sea/
      <platform>-<arch>/
        artifact-manifest.json
        radebe.bundle.cjs
        radebe.sea.blob
        radebe[.exe]
        sea-config.json
```

Unity should treat the platform folder as an atomic payload. The executable is the launch target, and the remaining files are required packaging outputs that should stay together for inspection, troubleshooting, and future install validation.

## Executable Naming
- Base executable name: `radebe`
- Windows executable filename: `radebe.exe`
- macOS and Linux executable filename: `radebe`
- Unity should derive the launch filename from `artifact-manifest.json` when available by taking the leaf name of `executablePath`, and otherwise fall back to `radebe` plus the platform extension rule above.

## Install and Update Model
- Source of truth for packaged payloads is the SEA artifact directory produced by `npm run package:cli:sea`.
- Unity should copy one whole `<platform>-<arch>` folder into a Unity-managed install root rather than cherry-picking only the executable.
- Recommended Unity install root: `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/`
- Updates should replace the entire installed platform folder with a newly packaged platform folder from the same artifact layout.
- Unity should compare the bundled `artifact-manifest.json` when deciding whether an installed payload needs refresh.
- Unity should not require a system Node.js install in production use.
- The current editor helper baseline exposes `InstallOrUpdatePayload()` for this flow and defaults the source artifact root to `../artifacts/radebe-cli/sea/` relative to the Unity project when the caller does not provide an explicit source path.

## Invocation Model
- Launch target: packaged executable from the installed platform folder.
- Compatibility CLI contract: pass one positional source-string argument to render sprite-grid rows to stdout.
- Unity importer CLI contract: invoke `radebe compile <source-file> --format unity-json`.
- Current importer example: `radebe.exe compile Assets/UI/panel.rdb --format unity-json` on Windows or `./radebe compile Assets/UI/panel.rdb --format unity-json` on macOS/Linux.
- Compatibility stdout contract: rendered sprite-grid rows followed by a trailing newline.
- Unity importer stdout contract: a JSON object with `kind: "unity-sprite"`, `version: 1`, `name`, `width`, `height`, `background`, `rows`, row-major `pixels` encoded as `#rrggbbaa`, and `diagnostics`.
- Current smoke-test expectation: the spec-aligned default smoke source renders `....\n.#..\n....\n`.
- Stderr contract: packaging or process-launch failures may write to stderr; Unity should capture stderr verbatim for logs and user-visible error details.
- Exit codes:
  - `0`: render completed with no diagnostics.
  - `1`: render completed with one or more diagnostics, or the CLI process failed internally after surfacing an error.

## Error and Reporting Expectations
- Unity should treat a non-zero exit code as a failed bridge invocation.
- Unity should always capture:
  - resolved executable path
  - full argument list
  - exit code
  - stdout
  - stderr
- If the executable is missing, Unity should report that the packaged `radebe-cli` payload is not installed for the current platform.
- If `artifact-manifest.json` is missing, Unity may still attempt the executable fallback name, but should log that install validation data is incomplete.
- On Windows, local unsigned injected binaries may emit the warning `The signature seems corrupted!` during smoke validation before any release signing step. This warning should be treated as packaging noise unless the process also fails to run.

## Validation Expectations
- Packaging command: `npm run package:cli:sea`
- Smoke command: `npm run smoke:cli:sea`
- Unity-side install checks should confirm:
  - platform folder exists
  - executable exists
  - `artifact-manifest.json` exists and its `executablePath` leaf name matches the installed executable name
- Unity-side bridge smoke tests should invoke the executable with a known source string and assert stdout plus exit code.
- The current editor helper baseline exposes `RunSmokeTest()` which validates the installed payload, invokes the packaged executable with a spec-aligned smoke source, expects stdout `....\n.#..\n....\n`, and tolerates the known unsigned SEA stderr warning as non-fatal noise when the process still succeeds.
- The current editor helper baseline also exposes `InvokeCompileFile()` for ScriptedImporter use, and `RadebeSpriteImporter` turns the `unity-sprite` JSON artifact into generated `Texture2D` and `Sprite` subassets.
- The current local deployment baseline uses `npm run deploy:unity`, driven by `.env` / `RADEBE_UNITY_PROJECT_PATH`, to copy `radebe-unity/Assets` plus the current platform SEA payload into a configured Unity test project.

## Forward-Compatibility Notes
- Unity should continue consuming `radebe-cli` rather than a parallel runtime path.
- The `unity-sprite` JSON artifact is the current machine-readable Unity import contract. If a later task switches Unity to PNG sidecar output, richer metadata, or streaming stdin, this document should be revised first.
- `artifact-manifest.json` is the preferred future extension point for version, checksum, and compatibility metadata.
