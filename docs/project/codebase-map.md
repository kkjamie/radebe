# Codebase Map

Owner: `Main Thread`
Last updated: `2026-05-17`

## Top-Level Layout
- `docs/`: workflow, planning, and project source-of-truth docs.
- `docs/original-spec.md`: redirect to canonical docs after spec consolidation.
- `package.json`: root npm workspace manifest and shared scripts.
- `tsconfig.base.json`: shared TypeScript compiler defaults for workspace packages.
- `tsconfig.json`: root TypeScript project references for the active workspaces.
- `radebe-core/`: shared TypeScript engine package for parsing, compiling, and rendering.
- `radebe-cli/`: Node CLI package that wraps `radebe-core`.
- `radebe-web/`: Vite-backed browser package that imports `radebe-core`.
- `radebe-unity/`: Unity bridge placeholder that will integrate through the packaged CLI rather than a separate runtime port.
- `scripts/`: workspace automation package for repo-level tooling.

## Core Runtime Paths
- `radebe-core/src/`: current public runtime entrypoint and future parser/compiler/renderer modules.
- `radebe-core/test/`: initial Node test coverage for shared runtime behavior.
- `radebe-cli/src/`: CLI entrypoint and future command/file IO orchestration.
- `radebe-cli/test/`: initial CLI behavior coverage.
- `radebe-web/src/`: browser shell entrypoint that imports `radebe-core`.
- `radebe-unity/README.md`: bridge direction and planned Unity asset layout.
- `radebe-unity/bridge.manifest.json`: placeholder bridge metadata for the future Unity integration contract.

## Tooling / Build Paths
- `scripts/src/doctor.ts`: initial repo automation entrypoint for workspace health checks.
- root workspace config files: npm workspaces, TypeScript project references, and shared build settings.
- CLI packaging outputs: standalone executable artifacts intended for Unity and non-Node consumers.

## Test Paths
- `radebe-core/test/`: parser, compiler, renderer, and fixture coverage.
- `radebe-cli/test/`: command invocation and executable packaging verification.
- `radebe-web/`: UI and integration tests for authoring and realtime preview flows.
- `radebe-unity/`: bridge validation and integration smoke tests as the package matures.

## Agent Notes
- Keep this file high-signal and architecture-focused.
- Avoid duplicating detailed implementation notes from session logs.
- Workspace tooling is now `npm` workspaces plus TypeScript project references, with `radebe-unity` intentionally kept outside the npm workspace boundary.
