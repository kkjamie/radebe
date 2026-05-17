# `radebe-unity`

Unity-facing integration assets will live here.

## Direction
- Consume the packaged `radebe-cli` executable as the single bridge into the canonical TypeScript implementation.
- Avoid introducing a separate Unity-side runtime port.
- Track invocation details and artifact contracts here once T-005 starts.

## Planned Layout
- `Assets/Editor/`: Unity editor scripts that invoke the CLI.
- `Assets/StreamingAssets/` or package-managed install location for CLI payloads.
- `docs/`: integration notes and smoke-test instructions.
