# Codebase Map

Owner: `Main Thread`
Last updated: `2026-05-17`

## Top-Level Layout
- `docs/`: workflow, planning, and project source-of-truth docs.
- `docs/original-spec.md`: redirect to canonical docs after spec consolidation.
- `radebe-core/`: planned shared TypeScript engine for parsing, compiling, and rendering.
- `radebe-cli/`: planned command-line wrapper around `radebe-core`.
- `radebe-web/`: planned web authoring surface with realtime feedback using `radebe-core` as a module.
- `radebe-unity/`: planned Unity bridge that integrates through `radebe-cli`.
- `scripts/`: planned automation and packaging scripts.

## Core Runtime Paths
- `radebe-core/src/`: parser, compiler, renderer, and public runtime API.
- `radebe-core/test/`: unit and behavioral tests for core language behavior.
- `radebe-cli/src/`: command parsing, file IO, process exit behavior, and output formatting.
- `radebe-web/src/`: browser editor, preview orchestration, and integration with core APIs.
- `radebe-unity/`: Unity-facing integration assets, docs, and bridge helpers.

## Tooling / Build Paths
- `scripts/`: workspace bootstrap, build orchestration, packaging, and release helpers.
- root workspace config files: package manager, TypeScript, linting, and shared build settings.
- CLI packaging outputs: standalone executable artifacts intended for Unity and non-Node consumers.

## Test Paths
- `radebe-core/test/`: parser, compiler, renderer, and fixture coverage.
- `radebe-cli/test/`: command invocation and executable packaging verification.
- `radebe-web/`: UI and integration tests for authoring and realtime preview flows.
- `radebe-unity/`: bridge validation and integration smoke tests as the package matures.

## Agent Notes
- Keep this file high-signal and architecture-focused.
- Avoid duplicating detailed implementation notes from session logs.
- When the repo scaffold is created, replace planned paths with actual paths and note the workspace tooling choice.
