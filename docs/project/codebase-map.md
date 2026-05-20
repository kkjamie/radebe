# Codebase Map

Owner: `Main Thread`
Last updated: `2026-05-20`

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
- `radebe-core/src/schema.ts`: command registry, child-capability rules, compiler-facing shorthand/property metadata, and editor-facing argument, enum, indentation, inline-child, and shorthand-expansion metadata.
- `radebe-core/src/language-service.ts`: headless editor assistance API for cursor context, schema-driven completions, argument help, enum suggestions, smart edits, and Enter indentation.
- `radebe-core/src/renderer.ts`: renderer boundary plus the convenience source-to-artifact pipeline helper.
- `radebe-core/src/types.ts`: shared contracts that define the cross-stage document, render artifact, and diagnostic shapes.
- `radebe-core/test/`: initial Node test coverage for shared runtime behavior.
- `radebe-cli/src/`: CLI entrypoint and future command/file IO orchestration.
- `radebe-cli/test/`: initial CLI behavior coverage.
- `radebe-web/src/`: browser authoring shell that imports `radebe-core` and renders the shared preview artifact.
- `radebe-unity/README.md`: bridge direction and planned Unity asset layout.
- `radebe-unity/docs/cli-bridge-contract.md`: Unity-facing invocation, install/update, and error-reporting contract for the packaged CLI bridge.
- `radebe-unity/bridge.manifest.json`: bridge metadata that mirrors the Unity contract baseline and packaged artifact expectations.
- `radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs`: Unity-side install validation, payload copy/update, and smoke-invocation helper for the packaged CLI payload.
- `radebe-unity/Assets/Editor/RadebeSpriteImporter.cs`: Unity `.rdb` ScriptedImporter that invokes `radebe-cli compile <file> --format unity-json` and creates generated `Texture2D` plus `Sprite` subassets.
- `radebe-unity/Assets/Editor/RadebeUnityMenu.cs`: Unity editor menu entrypoints for payload validation, install/update, and smoke testing.
- `radebe-unity/Assets/Editor/RadebeUnityImportVerifier.cs`: batchmode-friendly utility for asserting that a configured `.rdb` asset imports as a generated Sprite.

## Tooling / Build Paths
- `scripts/src/doctor.ts`: initial repo automation entrypoint for workspace health checks.
- `scripts/src/sea.ts`: release-time bundling and Node SEA packaging automation for `radebe-cli`.
- `scripts/src/unity-deploy.ts`: local Unity plugin deployment helper that reads `.env` / `RADEBE_UNITY_PROJECT_PATH`, copies `radebe-unity/Assets` into a configured Unity project, and installs the current platform packaged CLI payload.
- root workspace config files: npm workspaces, TypeScript project references, and shared build settings.
- CLI packaging pipeline: bundle `radebe-cli` plus `@radebe/core` into a single release entry script, then build per-platform Node SEA executables from a pinned Node LTS binary.
- SEA artifact root: `artifacts/radebe-cli/sea/<platform>-<arch>/` containing `artifact-manifest.json`, the bundled entry, SEA blob, config, and generated executable.
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
