# Session Log: T-002 Core API Boundaries

Date: `2026-05-17`
Thread: `t-002-core-api-boundaries`

## Scope
- Define the first concrete `radebe-core` API for parser, compiler, and renderer responsibilities.
- Reflect the new stage boundaries in code and package exports.
- Rewire `radebe-cli` and `radebe-web` to consume the updated core surface.

## Work Completed
- Split `radebe-core` into explicit `parser`, `compiler`, `renderer`, and `types` modules.
- Added shared parsed/compiled document contracts plus stage diagnostics and pipeline result types.
- Exposed a root `renderSource` convenience pipeline and added `@radebe/core` subpath exports for stage-specific consumers.
- Updated `radebe-cli` to call the new root pipeline helper and updated `radebe-web` to surface parsed line counts from the staged result.
- Added core tests that cover parse, compile, render, and end-to-end pipeline behavior.
- Updated the product spec, codebase map, roadmap, milestone state, task board, decisions log, and main-thread state to match the implemented API boundaries.

## Verification
- `npm run build` succeeded outside the sandbox after the known Windows sandbox `EPERM` issue reappeared on the in-sandbox run.
- `npm test` succeeded against the freshly built artifacts.

## Notes
- The root `@radebe/core` entrypoint is now the stable default for common consumers, while parser/compiler/renderer subpath exports give future tooling a stage-specific integration path without reaching into private files.
- `radebe-cli` remains the only planned Unity-facing executable boundary; no separate Unity runtime path was introduced.

## Next Recommendation
- Start with T-003 to decide how the staged CLI should be packaged for Unity and other non-Node consumers, or T-004 if the priority shifts to the first browser authoring loop.
