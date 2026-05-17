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
- Final executable packaging technology choice for the CLI.

## Open Questions
- What packaging approach should produce the standalone `radebe-cli` executable: Node SEA, `pkg`, `nexe`, Bun, or another strategy?
- How should rendering outputs be represented and versioned between `radebe-core`, `radebe-web`, and `radebe-unity`?

## Dependencies
- TypeScript toolchain for the shared implementation language.
- npm workspaces with shared TypeScript project references for multi-package development.
- Vite for the initial browser package shell in `radebe-web`.
- Unity integration constraints for the `radebe-unity` bridge.

## Canonical Package Boundaries
- `radebe-core`: owns parsing, compiling, rendering, and the reusable TypeScript API surface, with a root pipeline API plus explicit parser/compiler/renderer module entrypoints.
- `radebe-cli`: wraps `radebe-core` for command-line usage and future standalone executable packaging.
- `radebe-web`: provides browser-based authoring and realtime feedback by importing `radebe-core` directly as a module.
- `radebe-unity`: bridges Unity to the language toolchain by invoking `radebe-cli`.
- `scripts`: owns build automation, packaging helpers, release tasks, and other project-level automation.
