# Roadmap

Owner: `Main Thread`
Last updated: `2026-05-21`

## Planning Horizon
- Current: `2026-05-17` to `2026-05-24`
- Next: `2026-05-24` to `2026-06-14`

## Milestones
| Milestone | Outcome | Priority | Status | Target | Dependencies | Spec File | Current Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M0 | Planning baseline for the Radebe monorepo and package model | P0 | Done | 2026-05-24 | Initial setup | `docs/project/milestones/M0-planning-phase.md` | Passed |
| M1 | Workspace scaffold for `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts` | P0 | Done | 2026-06-07 | M0 completed | `docs/project/milestones/M1-implementation-foundation.md` | Passed |
| M2 | First usable language loop with basic rendering commands across core, CLI, and web before returning to Unity integration | P1 | In Progress | 2026-06-28 | M1 completed | `docs/project/milestones/M2-scale-and-optimization.md` | Gate C |

## Priority Rules
- P0: blocks core progress or release path.
- P1: high value, not release-blocking.
- P2: useful improvements, schedule as capacity allows.

## Current Focus
- M1 Gate C remains passed with the shared core/web render contract, SEA packaging pipeline, and Unity payload install/update plus smoke helper baseline in place.
- The recovered source product spec has now been realigned in code through a schema-backed `sprite` header block, root-level `plot` and `line` commands, rectangle geometry spanning `rect`, `rect-absolute`, `rect-inset`, and child `cut` plus child `radius` modifiers, the first `circle` geometry primitive, a `polygon` geometry slice using whitespace-separated `x y` point pairs or canonical child `point` nodes, a first open `path` geometry slice using child `point` nodes plus required `stroke`, filled shapes with `solid`, `gradient-linear`, and `gradient-radial` appearance variants, explicit per-pass `alpha` on `fill` and `stroke`, a `shape-appearance` capability path that lets geometry commands opt into shared `fill` / `stroke` children where appropriate, circle stroke support, polygon stroke support, path stroke support, rectangle stroke contours that now follow `cut` and `radius` silhouettes, and a shared sprite-grid render artifact consumed by `radebe-core`, `radebe-cli`, `radebe-web`, and the SEA smoke path.
- The shared shape appearance model now also includes a first hard-edged `shadow` pass for `rect`, `circle`, and `polygon`, with `x`, `y`, `spread`, explicit `alpha`, and either color shorthand or nested `fill`, while `blur` remains intentionally deferred.
- The language now supports file-scoped variables through root `var name value` declarations and optional `vars` grouping blocks, with top-to-bottom defined-before-use resolution for whole-token references such as `$accent`.
- The language now supports `group` as a transparent structural container. Groups can be named, nested, and used to organize draw commands while compiling child commands into the normal flat render stream in source order; group-level compositing, appearance inheritance, masks, filters, and transforms remain deferred.
- The renderer now supports optional real output antialiasing through a sprite-level `antialias` default and per-geometry overrides, defaulting to pixel-perfect `false` so existing artifacts remain stable unless authors opt in.
- The web example surface now treats rounded and cut corners as part of the main `rect` story instead of separate geometry pages, which keeps the current authoring model aligned with the implemented modifier-based shape semantics.
- The placeholder example audit now keeps only substantive future-feature stubs in the web nav; low-value property/container placeholders that are better covered by their parent pages have been removed.
- M2 Gate A, Gate B, and Gate C now all have working evidence. T-011 established the first real Unity plugin import baseline: `.rdb` files are Unity source assets handled by a ScriptedImporter, the packaged CLI can emit a Unity JSON sprite artifact, local deployment into a configured Unity project is driven by `.env` / environment variables rather than hard-coding Eddie into repo state, and manual verification in Eddie confirmed the deployed importer produces a generated Sprite main asset.
- Unity importer-options work is closed by user request. The next Unity slice should be chosen only if Unity work is explicitly resumed.
- T-043 has been closed by user request after the importer-options code and Eddie deployment work. Reopen it only if additional hands-on Unity importer validation is explicitly requested.
- Phase 5 reusable editor packaging and Phase 6 Unity live-authoring parity are intentionally postponed. They remain tracked as backlog tasks T-054 and T-055 so that reusable editor packaging or Unity IDE surface design resumes only by explicit choice.
- T-056 has added the first VS Code `.rdb` language-support package. It registers the language and TextMate grammar, consumes `@radebe/core` directly for completions, signature help, diagnostics, smart edits, and smart newline indentation, and includes a text render preview command. LSP remains a deferred architecture option if multiple editor hosts need a shared protocol boundary.
- T-057 followed user validation of the VS Code host by promoting Radebe color-token knowledge into shared `@radebe/core` metadata. VS Code now decorates named colors such as `white` through a real color provider, and the web CodeMirror editor now shows clickable color swatches with browser-picker-backed hex replacement.
- T-058 added local VS Code extension deployment automation. `npm run install:vscode` builds the workspace, stages a VSIX with the copied `@radebe/core` runtime instead of workspace symlinks, packages it with local `@vscode/vsce`, and installs it into the normal VS Code profile without Marketplace publishing.
- Future language/effects backlog still includes `mask`, soft shadows and glow, procedural fills such as noise, clouds, Voronoi, and patterns, plus follow-ons for blend modes, expressions, transforms, reusable symbols, richer paths, source-authored import metadata, and boolean region operations. T-059 `group` has now landed as the transparent structural first slice.

## Gate Policy
- All milestones must define gates in `docs/project/milestones/Mx-*.md`.
- A milestone cannot move to `Done` until all required gates are `Passed`.
- If a gate is `Blocked`, record the blocker in the milestone doc and `task-board.md`.
