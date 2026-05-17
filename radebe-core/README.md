# `@radebe/core`

`@radebe/core` owns the canonical parse -> compile -> render pipeline for the
Radebe toolchain.

## Public Surface

- Root entrypoint `@radebe/core`: shared types plus the common pipeline helpers
  `parseSource`, `compileDocument`, `renderDocument`, and `renderSource`.
- `@radebe/core/parser`: parser-only entrypoint for consumers that only need the
  source-to-structure stage.
- `@radebe/core/compiler`: compiler-only entrypoint for consumers that work from
  parsed documents.
- `@radebe/core/renderer`: renderer entrypoint plus the `renderSource`
  convenience helper.
- `@radebe/core/types`: shared cross-stage contracts and document shapes.

## Module Boundaries

- `src/parser.ts`: turns raw source text into a `ParsedDocument`.
- `src/compiler.ts`: transforms a `ParsedDocument` into a `CompiledDocument`.
- `src/renderer.ts`: renders a `CompiledDocument` into string output and exposes
  the end-to-end `renderSource` helper.
- `src/types.ts`: contains the stable contracts shared by all stages.
