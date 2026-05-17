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
- `radebe-core/src/index.ts`: root public API that re-exports shared types and the common parse/compile/render helpers.
- `radebe-core/src/parser.ts`: parser boundary for converting source text into the shared parsed document shape.
- `radebe-core/src/compiler.ts`: compiler boundary for transforming parsed documents into renderable compiled documents.
- `radebe-core/src/renderer.ts`: renderer boundary plus the convenience source-to-output pipeline helper.
- `radebe-core/src/types.ts`: shared contracts that define the cross-stage document and diagnostic shapes.
- `radebe-core/test/`: initial Node test coverage for shared runtime behavior.
- `radebe-cli/src/`: CLI entrypoint and future command/file IO orchestration.
- `radebe-cli/test/`: initial CLI behavior coverage.
- `radebe-web/src/`: browser shell entrypoint that imports `radebe-core`.
- `radebe-unity/README.md`: bridge direction and planned Unity asset layout.
- `radebe-unity/bridge.manifest.json`: placeholder bridge metadata for the future Unity integration contract.

## Tooling / Build Paths
- `scripts/src/doctor.ts`: initial repo automation entrypoint for workspace health checks.
- `scripts/src/sea.ts`: release-time bundling and Node SEA packaging automation for `radebe-cli`.
- root workspace config files: npm workspaces, TypeScript project references, and shared build settings.
- CLI packaging pipeline: bundle `radebe-cli` plus `@radebe/core` into a single release entry script, then build per-platform Node SEA executables from a pinned Node LTS binary.
- SEA artifact root: `artifacts/radebe-cli/sea/<platform>-<arch>/` containing the bundled entry, SEA blob, config, manifest, and generated executable.
- CLI packaging outputs: signed or otherwise release-ready standalone executable artifacts intended for Unity and other non-Node consumers.

## Test Paths
- `radebe-core/test/`: parser, compiler, renderer, and fixture coverage.
- `radebe-cli/test/`: command invocation, bundled entrypoint smoke tests, and executable packaging verification.
- `scripts/test/sea.test.ts`: end-to-end SEA packaging smoke test that builds and runs the generated executable on the current platform.
- `radebe-web/`: UI and integration tests for authoring and realtime preview flows.
- `radebe-unity/`: bridge validation and integration smoke tests as the package matures.

## Agent Notes
- Keep this file high-signal and architecture-focused.
- Avoid duplicating detailed implementation notes from session logs.
- Workspace tooling is now `npm` workspaces plus TypeScript project references, with `radebe-unity` intentionally kept outside the npm workspace boundary.
- `radebe-core` now exposes both a root API and subpath exports so downstream packages can choose between whole-pipeline usage and stage-specific integration.
- The recommended executable path is Node SEA so the repo can stay on the current Node/npm toolchain and only add release-time bundling plus per-platform artifact generation.
