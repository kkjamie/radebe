# Unity CLI Bridge Contract

Owner: `t-005-unity-bridge-contract`
Last updated: `2026-05-17`

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
- Unity should derive the launch path from `artifact-manifest.json` when available, and otherwise fall back to `radebe` plus the platform extension rule above.

## Install and Update Model
- Source of truth for packaged payloads is the SEA artifact directory produced by `npm run package:cli:sea`.
- Unity should copy one whole `<platform>-<arch>` folder into a Unity-managed install root rather than cherry-picking only the executable.
- Recommended Unity install root: `Assets/StreamingAssets/Radebe/radebe-cli/<platform>-<arch>/`
- Updates should replace the entire installed platform folder with a newly packaged platform folder from the same artifact layout.
- Unity should compare the bundled `artifact-manifest.json` when deciding whether an installed payload needs refresh.
- Unity should not require a system Node.js install in production use.

## Invocation Model
- Launch target: packaged executable from the installed platform folder.
- Current CLI contract: pass one positional source-string argument.
- Current example: `radebe.exe "hello"` on Windows or `./radebe "hello"` on macOS/Linux.
- Stdout contract: rendered output followed by a trailing newline.
- Current smoke-test expectation: input `hello` produces stdout `hello\n`.
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
  - `artifact-manifest.json` exists and points at the installed executable name
- Unity-side bridge smoke tests should invoke the executable with a known source string and assert stdout plus exit code.

## Forward-Compatibility Notes
- The current CLI accepts only a single source-string argument. If a later task introduces file-based input, structured diagnostics, or machine-readable output, this document should be revised first and Unity should continue consuming `radebe-cli` rather than a parallel runtime path.
- `artifact-manifest.json` is the preferred future extension point for version, checksum, and compatibility metadata.
