# Product Spec

Owner: `Main Thread`
Last updated: `2026-05-17`

## Product Summary
- Radebe is a language and toolchain for authoring content that can be parsed, compiled, and rendered across multiple environments.
- Primary users are tool builders and content authors who need a shared language runtime across CLI, web, and Unity workflows.
- The core value proposition is one canonical TypeScript implementation that powers authoring, validation, rendering, and downstream integrations without divergent logic.

## Core Experience Goals
- Make the language usable from both developer tooling and interactive authoring surfaces.
- Keep the core engine reusable so every integration consumes the same parsing, compiling, and rendering behavior.
- Support easy embedding in external tools, especially Unity, without requiring a local Node.js runtime in production use.

## In Scope (Current Milestone)
- Define the canonical repo/package structure for the Radebe ecosystem.
- Establish TypeScript as the implementation language for the shared runtime and first-party tooling.
- Document how `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts` relate to each other.
- Seed planning docs so implementation work can start from concrete tasks instead of template placeholders.

## Out of Scope (Current Milestone)
- Final language grammar and syntax design.
- Concrete parser/compiler implementation details.
- Unity runtime integration specifics beyond the high-level bridge direction.

## Packaging Direction
- Package `radebe-cli` as a Node.js single executable application built from a bundled CLI entrypoint plus a pinned Node LTS binary in release automation.
- Keep local development on the existing npm workspace and TypeScript project-reference flow; the standalone executable is a release artifact, not a second day-to-day runtime.
- Avoid switching the CLI to Bun because the repo already standardizes on Node/npm for workspace builds, tests, and downstream consumption.
- Avoid `pkg` and `nexe` as the primary path because their maintenance posture is weaker than the built-in Node SEA path and would add more long-term packaging risk to the repo.

## Open Questions
- How should rendering outputs be represented and versioned between `radebe-core`, `radebe-web`, and `radebe-unity`?

## Dependencies
- TypeScript toolchain for the shared implementation language.
- npm workspaces with shared TypeScript project references for multi-package development.
- Vite for the initial browser package shell in `radebe-web`.
- Unity integration constraints for the `radebe-unity` bridge.
- A bundling step for `radebe-cli` release builds so the CLI plus `@radebe/core` can be emitted as one SEA entry script before executable generation.

## Canonical Package Boundaries
- `radebe-core`: owns parsing, compiling, rendering, and the reusable TypeScript API surface, with a root pipeline API plus explicit parser/compiler/renderer module entrypoints.
- `radebe-cli`: wraps `radebe-core` for command-line usage and is the source package for the standalone Node SEA executable.
- `radebe-web`: provides browser-based authoring and realtime feedback by importing `radebe-core` directly as a module.
- `radebe-unity`: bridges Unity to the language toolchain by invoking `radebe-cli`.
- `scripts`: owns build automation, CLI bundling/SEA packaging helpers, release tasks, and other project-level automation.
