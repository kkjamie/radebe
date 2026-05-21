# Decisions Log

Owner: `Main Thread`
Last updated: `2026-05-21`

Use for significant decisions only. Keep entries short and explicit.

## Entry Template
### DEC-<id>: <decision title>
- Date: `YYYY-MM-DD`
- Status: Proposed | Accepted | Superseded
- Context: <why this decision is needed>
- Decision: <what was chosen>
- Consequences: <tradeoffs and impacts>
- Related tasks: <task IDs>
- Supersedes: <decision ID or N/A>

---

### DEC-000: Keep Lightweight ADR Entries
- Date: `2026-05-17`
- Status: Accepted
- Context: The repository needs durable cross-thread decision records without heavy ceremony.
- Decision: Adopt lightweight ADR-style entries in this file.
- Consequences: Important project choices stay visible without creating a separate ADR system.
- Related tasks: T-001
- Supersedes: N/A

---

### DEC-001: Use TypeScript Across First-Party Radebe Tooling
- Date: `2026-05-17`
- Status: Accepted
- Context: The project needs one implementation language that can power shared runtime logic, CLI tooling, and browser-based authoring.
- Decision: Build the first-party Radebe toolchain in TypeScript.
- Consequences: `radebe-core`, `radebe-cli`, and `radebe-web` can share code directly; Unity integration will consume the CLI rather than a separate C# port.
- Related tasks: T-001, T-002
- Supersedes: N/A

---

### DEC-002: Organize the Repo as a Multi-Package Workspace
- Date: `2026-05-17`
- Status: Accepted
- Context: The toolchain has distinct responsibilities across core runtime, CLI usage, web authoring, Unity integration, and automation.
- Decision: Structure the repository around `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts`.
- Consequences: Package boundaries are explicit early, and implementation can proceed without mixing runtime, UI, and bridge concerns.
- Related tasks: T-001, T-004, T-005
- Supersedes: N/A

---

### DEC-003: Unity Integration Goes Through the CLI
- Date: `2026-05-17`
- Status: Accepted
- Context: Unity needs a stable integration surface while the TypeScript core remains the canonical implementation.
- Decision: `radebe-unity` will use `radebe-cli` as its bridge to the shared toolchain.
- Consequences: Packaging the CLI as a standalone executable becomes an important delivery concern for M0/M1 planning.
- Related tasks: T-003, T-005
- Supersedes: N/A

---

### DEC-004: Use npm Workspaces with TypeScript Project References
- Date: `2026-05-17`
- Status: Accepted
- Context: T-001 needed a concrete monorepo baseline that keeps setup lightweight while supporting a shared core library, a CLI package, a web package, and repo-level automation.
- Decision: Use root `npm` workspaces for `radebe-core`, `radebe-cli`, `radebe-web`, and `scripts`, backed by a shared `tsconfig.base.json`, root project references, and a Vite shell for `radebe-web`.
- Consequences: The workspace uses default Node/npm tooling with low setup overhead, `radebe-core` stays directly consumable by the CLI and web app, and `radebe-unity` remains outside the npm workspace as a Unity bridge that consumes the packaged CLI.
- Related tasks: T-001, T-002, T-004, T-005
- Supersedes: N/A

---

### DEC-005: Expose `radebe-core` as a Staged Pipeline with Root Convenience Helpers
- Date: `2026-05-17`
- Status: Accepted
- Context: T-002 needed a concrete API boundary for parsing, compiling, and rendering without forcing CLI and web consumers to depend on private internals.
- Decision: Model `radebe-core` as explicit parser, compiler, and renderer modules that share stable document/diagnostic types, then re-export the stage APIs plus a root `renderSource` convenience pipeline from the package entrypoint.
- Consequences: Downstream consumers can either call the full pipeline or integrate at a specific stage, and future language work can evolve within the stage modules without changing the workspace package split.
- Related tasks: T-002, T-004, T-005
- Supersedes: N/A

---

### DEC-006: Package `radebe-cli` with Node SEA Release Artifacts
- Date: `2026-05-17`
- Status: Accepted
- Context: T-003 needed a standalone executable path for Unity and other non-Node consumers that fits the existing npm/TypeScript workspace and the newly staged `radebe-core` API.
- Decision: Keep `radebe-cli` authored and tested as a normal Node package in the workspace, then produce standalone releases by bundling the CLI and `@radebe/core` into one entry script and generating per-platform Node single executable application artifacts from a pinned Node LTS binary.
- Consequences: The repo stays on one primary runtime/tooling stack, Unity still consumes the CLI rather than a separate port, release automation must add a bundling plus SEA step, and executable smoke tests should validate the produced artifacts on each supported target platform.
- Related tasks: T-003, T-005
- Supersedes: N/A

---

### DEC-007: Share a Text-Grid Render Artifact Across Core and Web
- Date: `2026-05-18`
- Status: Accepted
- Context: T-004 needed the smallest concrete render-output contract that could power a browser preview immediately without creating a second Unity-specific path.
- Decision: Have `radebe-core` render to a lightweight text-grid artifact with `rows`, `width`, and `height`, and make `radebe-web` preview that artifact directly.
- Consequences: Browser preview can stay simple, Unity can later rasterize the same artifact into textures if needed, and richer render artifact kinds can be added later without changing the package split.
- Related tasks: T-004
- Supersedes: N/A

---

### DEC-008: Prioritize Basic Language Commands Before More Unity Integration
- Date: `2026-05-18`
- Status: Accepted
- Context: M1 closed with a viable CLI packaging path, a shared render artifact, a live web preview, and a Unity bridge baseline, but the language itself still lacks enough concrete behavior to justify deeper Unity-first integration work.
- Decision: Use early M2 work to implement one or two basic rendering commands through `radebe-core`, `radebe-cli`, and `radebe-web` before returning to full Unity vertical integration.
- Consequences: The next thread should optimize for core language behavior and fast feedback in CLI/web, while Unity remains on the existing packaged CLI bridge baseline until the first usable command loop is stable.
- Related tasks: T-009, T-010
- Supersedes: N/A

---

### DEC-009: Introduce `@`-Prefixed Commands While Keeping Plain-Text Compatibility
- Date: `2026-05-18`
- Status: Superseded
- Context: T-010 needed the first real rendering commands, but the packaged CLI bridge and existing smoke expectations still relied on plain text input rendering directly to the shared text-grid artifact.
- Decision: Add the first command syntax as `@`-prefixed line commands, starting with `@text <content>` and `@repeat <count> <content>`, while continuing to treat non-command lines as literal text rows.
- Consequences: This provided a temporary implementation slice, but it is not the canonical language direction after the recovered product spec restored the intended `.uis` syntax and command model.
- Related tasks: T-010
- Supersedes: N/A

---

### DEC-010: Define the Language as an Indentation-Based `.uis` Command Tree With Schema-Driven Semantics
- Date: `2026-05-18`
- Status: Superseded
- Context: The recovered source product spec restored the intended language design, including concrete examples, command hierarchy rules, and an extensibility model that had been lost during doc consolidation.
- Decision: Treat the canonical language as an indentation-based `.uis` command language whose parser only builds a generic command tree, and define syntax shorthand, allowed children, command kinds, and semantic behavior through a schema registry and semantic resolver.
- Consequences: This restored the missing command-tree and schema-registry model, but it used the recovered `.uis` extension and a more deeply nested sprite structure than the currently preferred direction.
- Related tasks: T-010
- Supersedes: DEC-009

---

### DEC-011: Use a Small `sprite` Header Block With Root-Level Draw Commands
- Date: `2026-05-18`
- Status: Accepted
- Context: After restoring the source product spec, the language direction still needed refinement to improve authoring ergonomics and clarify the first concrete vertical slice.
- Decision: Keep `sprite` as a small header block for overall file properties such as `size` and `background`, allow actual drawing commands at root indentation, treat file extensions as conventions rather than hard requirements, tentatively prefer a short project-specific extension such as `.rdb`, and make `plot x y color` followed by `line x1 y1 x2 y2 color` the first real commands to implement.
- Consequences: The canonical language remains indentation-based and schema-driven, but the top-level file model is flatter and easier to author; the implementation should start with a file-level/header-level validation model instead of nesting every draw command under `sprite`; and future docs and code should avoid treating `.uis` as locked.
- Related tasks: T-012
- Supersedes: DEC-010

---

### DEC-012: Model Gradient Families as Separate Linear and Radial Appearance Variants
- Date: `2026-05-18`
- Status: Accepted
- Context: The first gradient implementation worked as a horizontal-only rectangle fill, but richer authoring needed different properties for linear and radial gradients plus clearer example coverage in the web shell.
- Decision: Keep `gradient` as a compatibility alias for the linear form, add explicit `gradient-linear` and `gradient-radial` appearance variants with their own schema properties, and document them on separate example pages with multiple live scenarios per page.
- Consequences: The author-facing language stays approachable for simple cases while the compiler and renderer get clearer semantic separation; future gradient work can extend linear and radial independently; and the web docs can explain each variant without overloading one generic page.
- Related tasks: T-020
- Supersedes: N/A

---

### DEC-013: Keep `line` as a Primitive While Introducing Rectangle-Backed `stroke`
- Date: `2026-05-18`
- Status: Accepted
- Context: The language needed its first real `stroke` slice, but the team also wanted to avoid prematurely redefining simple `line` drawing as a path-stroking abstraction before caps, joins, and reusable path behavior exist.
- Decision: Keep `line` as a first-class primitive command, and introduce the first `stroke` implementation only as a rectangle-backed generated region with shorthand `width` plus `color`, optional `align`, and optional `style`.
- Consequences: The language gets useful outline behavior immediately without forcing a full path model too early; later path-capable stroke work can grow independently; and convenience forms such as `stroke 2 white` can still lower into the richer fill-based appearance structure.
- Related tasks: T-022
- Supersedes: N/A

---

### DEC-014: Treat `cut` as a Geometry Modifier on Rectangle-Backed Shapes
- Date: `2026-05-18`
- Status: Accepted
- Context: The next distinct sci-fi panel feature was corner cuts, but the team preferred a composable modifier model over introducing a separate `cut-rect` shape command.
- Decision: Implement `cut` as a child geometry modifier under rectangle-backed shapes, with uniform shorthand, four-value shorthand, and expanded named corner values, rather than adding a standalone `cut-rect` command first.
- Consequences: The language stays more composable, `rect` remains the base shape vocabulary, and future shape modifiers can follow the same pattern; the first implementation currently affects the fill silhouette directly, while stroke-aware cut handling can follow as a later refinement.
- Related tasks: T-024
- Supersedes: N/A

---

### DEC-015: Use Hash-Prefixed Source Comments
- Date: `2026-05-18`
- Status: Accepted
- Context: The language previously accepted both `//` and `#` as whole-line comment prefixes, while the desired authoring convention is a single comment style.
- Decision: Treat only trimmed lines that start with `#` as source comments.
- Consequences: Radebe examples and docs use one comment style, and `//` lines are parsed as ordinary source rather than being silently ignored.
- Related tasks: T-027
- Supersedes: N/A

---

### DEC-016: Keep `alpha` Explicit on Appearance Passes
- Date: `2026-05-18`
- Status: Accepted
- Context: The language needed separate opacity control, but putting alpha on geometry nodes would imply subtree-style inheritance or offscreen group compositing semantics that the current pass-based renderer does not model yet.
- Decision: Support `alpha` explicitly on `fill` and `stroke`, default it to `1`, make it multiply with any alpha already present in solid colors or gradient stop colors, and do not implicitly inherit it to nested child strokes.
- Consequences: The first alpha slice stays consistent with the current geometry-versus-appearance split, gradient stops can keep their own transparency nuance, and future shape- or group-level opacity can be added later as a distinct semantic instead of overloading the current appearance passes.
- Related tasks: T-029
- Supersedes: N/A

---

### DEC-017: Model Rounded Corners as `radius` on Rectangle-Backed Shapes
- Date: `2026-05-18`
- Status: Accepted
- Context: The language still carried older `rounded-rect` wording even after `cut` had already been accepted as a child geometry modifier on rectangle-backed shapes.
- Decision: Keep `rect` as the base rectangle geometry vocabulary, add rounded corners through a child `radius` modifier, and reject `cut` plus `radius` on the same rectangle until a richer per-corner corner-treatment model exists.
- Consequences: Rectangle authoring stays consistent around one base shape plus modifiers, the web docs/examples can collapse rounded and cut cases under the `rect` page, and future mixed-corner semantics remain available without committing to ambiguous precedence rules now.
- Related tasks: T-030
- Supersedes: N/A

---

### DEC-018: Land `circle` as a Fill-First Geometry Primitive
- Date: `2026-05-18`
- Status: Accepted
- Context: The product spec already lists `circle` as part of the early geometry vocabulary, and M2 needed one more distinct shape that could reuse the existing shared fill pipeline without forcing a premature generalization of stroke behavior.
- Decision: Implement the first `circle` slice with integer `x`, `y`, and `radius` geometry, color shorthand lowering, and the existing `fill` variants (`solid`, `gradient-linear`, and `gradient-radial`), while leaving circle-specific `stroke` support for a later shape-general stroke pass.
- Consequences: The language gets a useful non-rectangular primitive immediately, renderer and docs stay aligned around the current fill model, and future stroke work can target circle and non-rect shapes deliberately instead of overextending the rectangle-backed stroke slice.
- Related tasks: T-031
- Supersedes: N/A

---

### DEC-019: Use a Shared `shape-appearance` Capability for Shape-Level `fill` and `stroke`
- Date: `2026-05-18`
- Status: Accepted
- Context: The schema already distinguished command kinds, but shape appearance support still had to be enabled command-by-command, which made the implementation drift from the intended capability-based model.
- Decision: Add a `shape-appearance` capability in the command schema so geometry commands can opt into shared `fill` and `stroke` children through capability matching, and route shape appearance compilation through a common compiler pass while keeping geometry-specific contour rendering where needed.
- Consequences: `circle` and rectangle geometry now share the same appearance-child compilation model, future shape commands can adopt `fill` and `stroke` with less bespoke compiler plumbing, and renderer work can focus on contour support rather than child-schema duplication.
- Related tasks: T-032
- Supersedes: N/A

---

### DEC-020: Make Rectangle Stroke Contours Follow `cut` and `radius`
- Date: `2026-05-19`
- Status: Accepted
- Context: After `stroke` became shared across multiple shapes, the largest remaining fidelity gap was that rectangle-backed strokes still used the plain rectangle envelope instead of following cut and rounded-corner silhouettes.
- Decision: Keep the existing band-based rectangle stroke path for unmodified rectangles, and add a contour-aware rectangle stroke path for `cut` and `radius` cases so stroke rendering follows the same modified silhouette as the underlying rectangle fill.
- Consequences: Plain rectangle stroke behavior stays stable, modified rectangle strokes now visually match their geometry, and future refinement can focus on contour precision rather than basic modifier support.
- Related tasks: T-033
- Supersedes: N/A

---

### DEC-021: Keep The First `polygon` Slice On Whitespace-Separated Point Syntax
- Date: `2026-05-19`
- Status: Accepted
- Context: The language direction already listed `polygon`, but the repo had not introduced any comma-delimited tuple syntax and needed to choose whether polygon should be the first exception.
- Decision: Land the first `polygon` geometry slice using either flat whitespace-separated `x y` point pairs or canonical child `point` commands, keep color shorthand lowering into `fill`, and defer polygon `stroke` until explicit contour semantics are designed.
- Consequences: Polygon authoring stays consistent with the parser's current whitespace token model, the compiler avoids a one-off comma tuple grammar, and future path or polygon stroke work can build on the same point representation without inheriting premature join behavior.
- Related tasks: T-034
- Supersedes: N/A

---

### DEC-022: Add Polygon To The Shared `stroke` Model With Edge-Distance Contour Sampling
- Date: `2026-05-19`
- Status: Accepted
- Context: After the first polygon fill slice landed, the next question was whether polygon should remain fill-only until a future `path` system or join model existed.
- Decision: Extend `polygon` to accept the shared `stroke` command now, and render its stroke as an edge-distance contour band sampled around the polygon perimeter using the existing align, style, and fill rules.
- Consequences: Polygon authoring now matches the shared shape appearance model more closely, the first stroke behavior is useful without introducing comma tuple syntax or a full path system, and future work can refine joins or nested-envelope semantics without changing the surface syntax again.
- Related tasks: T-035
- Supersedes: N/A

---

### DEC-023: Land `path` As A Stroke-First Open Polyline Primitive
- Date: `2026-05-19`
- Status: Accepted
- Context: The language direction already listed `path`, but the project still lacked a minimal implementation that avoided overcommitting to fillable contours, winding rules, or reusable path references.
- Decision: Implement the first `path` slice as an open polyline defined by child `point` commands, require at least one `stroke` child for visibility, and support only `stroke` align `center` in this initial version.
- Consequences: The language gets a useful multi-segment line primitive now, `path` stays distinct from filled region shapes such as `polygon`, and future path work can add closing, fill, winding, or reusable-name semantics without rewriting the initial stroke-first surface.
- Related tasks: T-036
- Supersedes: N/A

---

### DEC-024: Keep Placeholder Example Pages Only For Substantive Future Features
- Date: `2026-05-19`
- Status: Superseded
- Context: The web docs nav included placeholder pages for both meaningful future features and low-value support concepts such as header sub-properties or appearance containers, which made the placeholder set noisy.
- Decision: Keep placeholder pages only for substantive planned features such as `overlay`, `shadow`, `group`, `mask`, and `vars`, and remove placeholder-only pages that are better documented under parent pages or once real implementation work exists.
- Consequences: The nav still signals important planned capabilities without over-advertising low-signal stubs like `size`, `background`, `fill`, `inset`, `blend`, and `draw`.
- Related tasks: T-037
- Supersedes: N/A

---

### DEC-025: Drop `overlay` From The Near-Term Language Surface
- Date: `2026-05-19`
- Status: Accepted
- Context: The current implementation already supports ordered multi-`fill` passes on shapes, which covers the existing layering use cases without needing a separate `overlay` command or placeholder page.
- Decision: Remove `overlay` from the current product spec and web docs surface for now, keep ordered `fill` passes as the only shape-interior layering model, and revisit a distinct overlay concept only if future compositing rules require semantics that multi-`fill` cannot express cleanly.
- Consequences: The near-term language gets simpler, the docs stop implying an extra appearance primitive that does not exist, and future overlay work stays available as a deliberate new feature instead of inherited placeholder baggage.
- Related tasks: T-038
- Supersedes: DEC-024

---

### DEC-026: Model `shadow` As One Appearance Command With Offset And Spread
- Date: `2026-05-19`
- Status: Accepted
- Context: The project wanted to design `shadow` with the longer-term soft-shadow direction in mind without forcing blur support into the first implementation slice.
- Decision: Implement one shared `shadow` appearance command for shape geometry rather than separate hard and soft shadow types, land the first slice with `x`, `y`, `spread`, explicit `alpha`, and either color shorthand or nested `fill`, render it behind the source shape, and defer `blur` to a later follow-up property on the same command.
- Consequences: The language gets a crisp contour-derived shadow model now for rectangles, circles, and polygons, future blur support has a clear extension point without a surface rename, and the current slice stays aligned with the renderer's pixel-perfect no-antialiasing direction.
- Related tasks: T-039
- Supersedes: N/A

---

### DEC-027: Make `var` The Declaration Command And `vars` An Optional Group
- Date: `2026-05-19`
- Status: Accepted
- Context: The language needed reusable values without making small files pay an unnecessary grouping tax or weakening the schema-driven command model with dynamic child command names.
- Decision: Support root-level `var name value` declarations as the real semantic variable command, support `vars` only as an optional structural grouping wrapper for `var` children, resolve variables top-to-bottom before use, and limit the first slice to whole-token references such as `$accent`.
- Consequences: Small files can stay terse, larger files can group variables when helpful, diagnostics remain schema-backed, and embedded expression forms such as `left+$pad` remain a future expression-system concern.
- Related tasks: T-040
- Supersedes: N/A

---

### DEC-028: Add Sprite-Level Antialias Defaults With Geometry Overrides
- Date: `2026-05-19`
- Status: Accepted
- Context: The renderer had been fully pixel-perfect, which works well for grid-aligned UI art but makes circles, rounded corners, polygons, paths, and diagonal lines visibly stair-stepped when smoother contours are desired.
- Decision: Add optional boolean `antialias` control at the `sprite` header as the document render default, allow geometry commands to override it, and keep the omitted default as `false`.
- Consequences: Existing output remains unchanged unless authors opt in, while smoothed geometry writes partial alpha into the real render artifact rather than relying on preview-only canvas smoothing.
- Related tasks: T-041
- Supersedes: N/A

---

### DEC-029: Import `.rdb` In Unity Through A CLI-Backed Sprite Artifact
- Date: `2026-05-19`
- Status: Accepted
- Context: T-011 needed to restart Unity integration without creating a parallel C# renderer or baking the local Eddie test project into repo-owned code.
- Decision: Treat `.rdb` files as Unity source assets handled by a ScriptedImporter that calls the packaged `radebe-cli` through the existing bridge, consumes a `unity-sprite` JSON artifact, and creates generated `Texture2D` plus `Sprite` subassets. Local Unity test deployment is driven by `.env` / environment variables such as `RADEBE_UNITY_PROJECT_PATH`, with Eddie-specific assets kept outside the repo.
- Consequences: Unity gets a native sprite-facing workflow while the TypeScript renderer remains canonical; the CLI contract now needs to maintain a machine-readable Unity artifact mode; repo automation can deploy into any configured Unity project instead of assuming Eddie; and the next Gate C step must capture a hard Unity-side importer assertion before the gate is marked passed.
- Related tasks: T-011
- Supersedes: N/A

---

### DEC-030: Drive Editor Intelligence From Shared Schema Metadata
- Date: `2026-05-20`
- Status: Accepted
- Context: The web editor is growing from a smoke-test textarea into an IDE-like authoring surface, and Unity should eventually provide the same live editing behavior without duplicating language knowledge in C#.
- Decision: Enrich the shared `@radebe/core` command schema with editor-oriented metadata, including argument value kinds, enum values, indentation hints, inline child-command forms, allowed-child helpers, and shorthand-expansion hints, then build future web and Unity editor features on top of that shared metadata.
- Consequences: The schema becomes a public tooling contract, `@radebe/core/schema` is exported as a subpath, future web and Unity language assistance can share one source of truth, and the next editor slice should implement a headless language service rather than hard-coding completions in a presentation layer.
- Related tasks: T-044, T-045
- Supersedes: N/A

---

### DEC-031: Use CodeMirror 6 As The Web Editor Host
- Date: `2026-05-20`
- Status: Accepted
- Context: The textarea/highlight shell supported the first editor-assist slices, but autocomplete, smart edits, undo grouping, cursor-positioned UI, and future diagnostics were already pushing it toward brittle browser-edit workarounds.
- Decision: Use CodeMirror 6 as the web editor host while continuing to source language intelligence from the shared `@radebe/core` schema and language service.
- Consequences: The web editor gains real document state, history, selections, and transaction primitives; custom Radebe assist UI can keep evolving on top of shared language-service APIs; the web bundle is larger; and Unity still needs its own presentation layer or a separate bridge to shared language-service behavior.
- Related tasks: T-050, T-052
- Supersedes: N/A

---

### DEC-032: Defer Reusable Editor Packaging And Unity Live Authoring
- Date: `2026-05-20`
- Status: Accepted
- Context: Phase 4 made the web editor substantially more capable, which made Phase 5 reusable editor packaging and Phase 6 Unity live-authoring parity tempting next steps. The project wants those captured without letting them automatically displace nearer-term validation and tooling choices.
- Decision: Defer Phase 5 and Phase 6 into explicit backlog tasks. Track reusable editor packaging as T-054, Unity editor live-authoring parity as T-055, and VS Code language support as a separate T-056 candidate that should reuse the same `@radebe/core` language-service behavior as the web editor.
- Consequences: The roadmap keeps the reusable editor and Unity IDE ambitions visible without committing to them immediately; VS Code can be evaluated on its own architecture merits, likely through a VS Code extension and possibly an LSP-shaped adapter; and the current Unity importer-options validation remains the leading Unity follow-on.
- Related tasks: T-054, T-055, T-056
- Supersedes: N/A

---

### DEC-033: Start VS Code Support As A Direct Core-Backed Extension
- Date: `2026-05-20`
- Status: Accepted
- Context: T-056 needed a deliberate architecture choice before adding `.rdb` language support outside the web editor. The shared `@radebe/core` language service already provides the editor intelligence needed for a first VS Code slice.
- Decision: Add `radebe-vscode` as a first-party VS Code extension workspace that consumes `@radebe/core` directly inside the extension host for completions, signature help, diagnostics, smart edits, indentation, and render-preview behavior. Defer an LSP-shaped adapter until another editor host needs a protocol boundary.
- Consequences: VS Code support can land quickly without duplicating command/schema knowledge or introducing a separate server process. A future LSP remains available, but it should be justified by multi-host reuse rather than added preemptively.
- Related tasks: T-056
- Supersedes: N/A

---

### DEC-034: Share Color Token Metadata From Core
- Date: `2026-05-20`
- Status: Accepted
- Context: VS Code automatically decorated hex colors in `.rdb` files, but named Radebe colors such as `white` were invisible to the color picker, and the web editor had no color swatch affordance.
- Decision: Move Radebe color parsing, formatting, named-color metadata, and source token range extraction into `@radebe/core/colors`, then have VS Code and web editor surfaces consume that shared metadata for color decorations.
- Consequences: Editor color affordances stay aligned with renderer-supported colors, named colors and hex colors behave consistently across VS Code and web, and future color vocabulary changes can be made once in core.
- Related tasks: T-057
- Supersedes: N/A

---

### DEC-035: Package VS Code Locally With A Staged VSIX
- Date: `2026-05-20`
- Status: Accepted
- Context: The user wanted a normal installed VS Code extension without publishing to Marketplace yet, and the extension imports the private workspace package `@radebe/core`.
- Decision: Add a local install script that stages a clean VSIX directory, copies the extension build plus `@radebe/core` runtime files into that stage, packages it with repo-local `@vscode/vsce`, and installs it with the VS Code CLI. Keep Marketplace publishing out of scope for now.
- Consequences: `npm run install:vscode` gives a repeatable local deployment path without relying on Extension Development Host, global `vsce`, or workspace symlinks inside the VSIX. Marketplace publishing can still be added later with a separate release workflow.
- Related tasks: T-058
- Supersedes: N/A

---

### DEC-036: Keep The First `group` Slice Transparent
- Date: `2026-05-21`
- Status: Accepted
- Context: T-059 needed structural grouping without accidentally committing to offscreen compositing semantics for alpha, blend modes, masks, filters, or future transforms.
- Decision: Implement `group` as a transparent structural container whose child draw commands flatten into the normal render command stream in source order. Allow optional group names and nested groups, but do not allow direct appearance children or group-level render effects in this slice.
- Consequences: Authors can organize related geometry immediately, editor tooling can complete and indent groups from shared schema metadata, and future compositing or transform work can attach to a clear structural boundary without changing current pixel output semantics.
- Related tasks: T-059, T-060, T-067, T-069
- Supersedes: N/A
