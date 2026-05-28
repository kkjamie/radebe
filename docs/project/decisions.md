# Decisions Log

Owner: `Main Thread`
Last updated: `2026-05-28`

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

---

### DEC-037: Use Author-Facing Vocabulary And Avoid Silent Child Reordering
- Date: `2026-05-21`
- Status: Accepted
- Context: Group compositing, masks, and future compiler ordering rules need clearer language than broad schema kinds such as geometry, appearance, and structural.
- Decision: Adopt author-facing terms such as drawable commands, pixel primitives, shape drawables, path drawables, geometry modifiers, property commands, appearance passes, effect passes, structural containers, mask shape, and masked content. Preserve source-order intuition by rejecting confusing child ordering rather than silently moving modifiers or group effects across drawables.
- Consequences: The product spec has a canonical vocabulary now; T-074 will fold it into web reference docs and editor help, and T-075 will add focused compiler diagnostics for child-phase ordering.
- Related tasks: T-074, T-075, T-060, T-067, T-069
- Supersedes: N/A

---

### DEC-038: Apply Group Passes To A Composited Layer
- Date: `2026-05-21`
- Status: Accepted
- Context: Future group-level `fill`, `stroke`, `shadow`, glow, opacity, and blend behavior needs semantics that match the user's Photoshop-folder mental model instead of implying inherited child defaults.
- Decision: Treat future group appearance/effect passes as post-raster layer operations: render all group children into an offscreen layer in source order, use the combined alpha/pixels as the group drawable, apply group-level passes to that composited result, then composite the final group layer back into the parent. Authors should use nested groups for staged effects.
- Consequences: Group strokes and shadows can follow the combined outside contour rather than each child shape individually; ordering diagnostics must ensure group content comes before group-level passes; renderer work will need an offscreen layer/alpha model.
- Related tasks: T-076, T-075, T-067, T-069
- Supersedes: N/A

---

### DEC-039: Preserve Compiled Groups And Composite Only When Needed
- Date: `2026-05-21`
- Status: Accepted
- Context: T-076 needed group-level passes without breaking the transparent source-order behavior introduced in T-059.
- Decision: Compile `group` into a retained draw-command node with nested child commands. Render groups directly into the parent when they have no group-level passes, and switch to an offscreen child layer only when `fill`, `stroke`, or `shadow` appears under the group.
- Consequences: Transparent groups preserve their existing pixel behavior while still giving the renderer a real boundary for group passes, future masks, transforms, and compositing controls. Compiler diagnostics can now enforce group content before group-level passes without silently flattening or reordering children.
- Related tasks: T-076, T-075, T-060, T-069
- Supersedes: N/A

---

### DEC-040: Distinguish Omitted Corner Treatments From Zero Values
- Date: `2026-05-21`
- Status: Superseded
- Context: Existing rectangle corner modifiers support uniform and four-corner `cut` or `radius` values, but authors also need to mix cut and rounded corners on the same rectangle.
- Decision: Future mixed-corner rectangle work should support targeted single-corner commands such as `cut top-left 8` and `radius top-right 12`. A corner with no targeted treatment is semantically different from a corner with an explicit zero-valued cut or radius.
- Consequences: T-077 must use a corner-treatment model that can represent absence, cut, and radius independently per corner rather than lowering targeted syntax into four numeric values where `0` means "not modified."
- Related tasks: T-077, T-030, T-033
- Supersedes: N/A

---

### DEC-041: Use A Deterministic Box Blur For Shadow Blur
- Date: `2026-05-21`
- Status: Accepted
- Context: T-061 needed soft shadow support on the existing `shadow` command while preserving deterministic pixel output across CLI, web, VS Code preview, and Unity artifact consumers.
- Decision: Add `blur` as a non-negative integer pixel radius on `shadow`, keep `blur 0` as the hard-edged default, and render positive blur values with a normalized box blur over the shadow alpha mask.
- Consequences: Soft shadows use the same command surface as hard shadows and work for shape and composited-group shadows; large blur radii increase render cost in proportion to the blurred area and kernel size.
- Related tasks: T-061, T-039, T-076, T-062
- Supersedes: N/A

---

### DEC-042: Model Glow As A Distinct Inner/Outer Effect Pass
- Date: `2026-05-21`
- Status: Accepted
- Context: T-062 needed to decide whether outer glow should be syntax sugar over colored soft shadows or a separate appearance/effect command, while inner glow requires clipped-inside contour semantics.
- Decision: Add `glow` as a distinct shape/group effect pass with `mode` values `outer` and `inner`. Outer glow reuses the deterministic soft-shadow alpha blur sampler with zero offset but clips out the source interior; inner glow clips inside the source region and derives its coverage from a blurred, optionally shrunken core alpha.
- Consequences: Authors get one command for glow semantics instead of overloading `shadow`; renderer code can share blur sampling without making outer glow a pure `shadow 0 0` alias; glow currently supports rectangle-backed shapes, circles, polygons, and composited groups, while paths remain stroke-only.
- Related tasks: T-062, T-061, T-076
- Supersedes: N/A

---

### DEC-043: Use Shape And Contents Containers For First Mask Clipping
- Date: `2026-05-21`
- Status: Accepted
- Context: T-060 needed explicit masks for clipping arbitrary child drawing, and the latest authoring direction preferred `mask` with a `shape` container plus a plural `contents` container. The older backlog wording also mentioned composition modes, but add/replace/intersect/subtract need a real stacked-mask or region-composition model to avoid fake semantics.
- Decision: Implement the first mask slice as `mask name? invert=true|false show=masked-content|shape-only|content-only` with exactly one `shape` container followed by exactly one `contents` container. Mask shape drawables render into an alpha layer, otherwise-unpainted shape drawables receive implicit mask coverage, and the content layer is clipped through the mask alpha or inverse alpha when `invert=true`. The `show` option defaults to `masked-content`; `shape-only` and `content-only` are debug views.
- Consequences: Authors can clip arbitrary draw commands immediately with deterministic pixel output, a clear inverted-mask option, and a way to inspect either side of the mask while tuning source. Full mask composition modes are split to T-079 so they can be designed against a real mask-stack or boolean-region model.
- Related tasks: T-060, T-079
- Supersedes: N/A

---

### DEC-044: Make `radebe-web` The Public Homepage And Reference Surface
- Date: `2026-05-21`
- Status: Accepted
- Context: The web package had grown from a quick examples workbench into the most useful user-facing surface for learning and trying the language.
- Decision: Treat `radebe-web` as the main public site. The default route introduces Radebe, `Try it` owns the full editor/preview workspace, command reference navigation uses the author-facing vocabulary, and release notes, public roadmap, VS Code extension, and Unity plugin pages live alongside the command docs.
- Consequences: Future web additions should decide whether they belong in the public roadmap, command reference, syntax guide, or integration pages instead of adding another examples-only page by default.
- Related tasks: T-081, T-074, T-054, T-055, T-058
- Supersedes: N/A

---

### DEC-045: Keep The Web Site On Modular Vanilla TypeScript
- Date: `2026-05-21`
- Status: Superseded
- Context: After `radebe-web` became the public site, `main.ts` had grown into a multi-thousand-line mix of static content, page rendering, editor internals, styling, and router wiring. The site needs reusable panels and easier editing, but it remains mostly static and does not yet need framework-level state management.
- Decision: Keep `radebe-web` on Vite, TypeScript, CodeMirror 6, and direct DOM construction for now, but split the app into modules for data, page renderers, playground/editor internals, shared UI helpers, styles, shared types, and shell/router wiring. Do not introduce React or another frontend framework solely for this stage.
- Consequences: Page and docs edits become easier without framework churn. A future React/Preact/Svelte decision remains open if the web app gains richer persistent state, reusable interactive panels, or hostable editor-package needs that justify a component framework.
- Related tasks: T-082, T-081, T-054
- Supersedes: N/A

---

### DEC-046: Use Preact For The Web Component Layer
- Date: `2026-05-22`
- Status: Accepted
- Context: After the content split, editing the public web site still required verbose page-level DOM construction and inline style strings. The web surface now benefits from reusable components and real markup, but it still does not need heavyweight framework state management.
- Decision: Convert `radebe-web` to a Vite + TypeScript + Preact TSX app. Keep CodeMirror 6 as an imperative editor island inside a Preact `Playground` component, keep page/content data in the existing modules, and move site styling into a normal CSS import.
- Consequences: Shell, page renderers, and shared UI panels become component markup; the web runtime adds a small `preact` dependency; editor internals can remain close to CodeMirror's DOM APIs; future page work should prefer TSX components and CSS classes over manual page-level `document.createElement` assembly.
- Related tasks: T-085, T-082, T-083, T-084
- Supersedes: DEC-045

---

### DEC-047: Co-Locate Simple Web Page Data With Page Components
- Date: `2026-05-22`
- Status: Accepted
- Context: After the Preact migration, a single `pages.tsx` still mixed every page component while simple page data lived in separate content modules. That made edits require bouncing between files for small public pages.
- Decision: Split the web page layer into focused modules under `radebe-web/src/pages/`, with each simple public page keeping its page definition and static page data at the top of the same file as the component. Keep command reference docs under `content/commands` because they are already one module per command and feed a generic command reference component.
- Consequences: Page edits become local to one component file, `data.ts` remains a registry instead of a content store, command reference docs keep their dedicated content ownership, and future simple page additions should start with co-located data plus component markup.
- Related tasks: T-086, T-085, T-083
- Supersedes: N/A

---

### DEC-048: Use The Preact Vite Preset For Web HMR
- Date: `2026-05-22`
- Status: Accepted
- Context: After converting `radebe-web` to TSX components, CSS hot reload worked but TSX edits could leave the dev page black until the Vite server restarted. The Vite config was still using plain TSX handling plus the local downloads middleware instead of Preact's supported refresh integration.
- Decision: Add `@preact/preset-vite` as a web dev dependency and run `preact()` first in `radebe-web/vite.config.ts` before the custom local-downloads plugin.
- Consequences: TSX component/page edits use the supported Preact refresh path during web development, while the existing local download middleware and production build remain intact. The web package now carries the preset's Babel/prefresh dev dependencies in `package-lock.json`.
- Related tasks: T-092, T-085
- Supersedes: N/A

---

### DEC-049: Generate Examples Page Static Previews Before Web Serve/Build
- Date: `2026-05-22`
- Status: Accepted
- Context: Rendering every complete Examples page source as a live CodeMirror playground made the page expensive to load, but the page still needs visual previews before an author chooses to edit.
- Decision: Keep the complete example sources in shared web JSON data, generate PNG previews from those sources with `@radebe/core` before `vite` dev/build, serve the generated images from `public/generated/examples/`, and let `Playground` accept a cached preview image that overrides the live preview canvas until the source changes.
- Consequences: The Examples page can show editable source immediately while the preview starts from cheap generated image assets in the same preview frame and zoom path as live rendering. Generated preview files are build artifacts ignored from git; dev/build commands regenerate them so stale previews are not the source of truth. Live render and diagnostics begin per row after the first edit.
- Related tasks: T-105, T-106, T-101, T-103, T-104
- Supersedes: N/A

---

### DEC-050: Center Generated Polygon Shapes On The Sprite
- Date: `2026-05-22`
- Status: Superseded
- Context: T-109 added `polygon-regular <sides> <radius>` and `polygon-star <points> <inner-radius> <outer-radius>` without explicit x/y position arguments.
- Decision: Generate both commands around the current sprite center, place the first outer vertex at the top, then proceed clockwise.
- Consequences: The requested compact forms are immediately useful for centered badges and icons; authors who need manual positioning or asymmetry should use explicit `polygon` points until a broader transform or anchor model exists.
- Related tasks: T-109, T-069, T-087, T-120
- Supersedes: N/A

---

### DEC-063: Require Explicit Centers For Generated Polygon Commands
- Date: `2026-05-23`
- Status: Accepted
- Context: After T-109 landed, generated regular and star polygons were harder to position than other geometry because they implicitly used the sprite center and offered no explicit `x y` surface.
- Decision: Change `polygon-regular` to require `<x> <y> <sides> <radius>` and `polygon-star` to require `<x> <y> <points> <inner-radius> <outer-radius>`, keeping the first outer/generated point at the top and continuing clockwise from there.
- Consequences: Generated polygons now follow the repo's broader explicit-positioning model, can be placed without falling back to manual `polygon` points, and keep room for future transform/anchor work without depending on implicit sprite-centering behavior.
- Related tasks: T-120, T-109, T-069, T-087
- Supersedes: DEC-050

---

### DEC-064: Add Corner Modifiers To Polygon Shapes But Not Paths
- Date: `2026-05-24`
- Status: Accepted
- Context: Authors wanted `polygon`, `polygon-regular`, `polygon-star`, and `path` to support `cut` and `radius`, but the current geometry model treats polygons as filled regions while `path` is still a stroke-first open polyline.
- Decision: Add uniform per-vertex `cut` and `radius` modifiers to the polygon family only. Keep `path` unchanged and defer its corner behavior to future join/cap or richer path semantics work.
- Consequences: Polygon-family shapes now share more of the rectangle-style modifier story without blurring the current distinction between region geometry and stroke-only paths. `path` stays simpler and avoids premature semantics that would likely conflict with later join/cap design.
- Related tasks: T-122, T-071
- Supersedes: N/A

---

### DEC-051: Pin One Local Node And npm Baseline For The Workspace
- Date: `2026-05-22`
- Status: Accepted
- Context: The repo was effectively using whatever Node.js version happened to be installed on each developer machine, which created avoidable runtime drift and already surfaced as a `dev:web` failure on `Node.js v20.9.0` when a script used unsupported JSON import-attribute syntax.
- Decision: Pin the local workspace runtime to Node.js `20.9.0` and npm `10.9.2`, declare both in the root `package.json` `engines`, enforce them with root `.npmrc` `engine-strict=true`, and add `.nvmrc` plus README setup guidance so the expected runtime is explicit across environments.
- Consequences: Contributors get one clearly documented and enforced baseline instead of ad hoc local versions, and runtime mismatches fail early during npm usage rather than later during script execution. Contributors must switch to the pinned runtime before installing or working in the repo.
- Related tasks: T-110, T-111
- Supersedes: N/A

---

### DEC-052: Mount The Unity Bridge Under `Assets/Plugins/Radebe`
- Date: `2026-05-23`
- Status: Accepted
- Context: The first Unity bridge baseline used a split install shape with editor code under `Assets/Radebe` and the packaged CLI payload under `Assets/StreamingAssets/Radebe/...`, which is awkward for a future one-step Unity import experience.
- Decision: Treat `Assets/Plugins/Radebe` as the canonical Unity plugin root, with the packaged CLI payload installed under `Assets/Plugins/Radebe/Tools/radebe-cli/<platform>-<arch>/`.
- Consequences: The Unity-facing plugin becomes a single removable or distributable directory, `StreamingAssets` is no longer part of the intended bridge architecture, and future `.unitypackage` assembly can package one coherent root while `artifacts/...` remains an internal build staging location.
- Related tasks: T-115, T-055
- Supersedes: N/A

---

### DEC-053: Export The Unity Package Through Unity Itself
- Date: `2026-05-23`
- Status: Superseded
- Context: After moving the bridge to `Assets/Plugins/Radebe`, the next packaging step needs a real `.unitypackage` output. Re-implementing Unity's archive format in repo tooling would be brittle and would sidestep Unity's own asset export behavior.
- Decision: Add repo automation that deploys the canonical plugin root into a configured Unity project, then invokes `AssetDatabase.ExportPackage` through a repo-owned batchmode editor method to produce the `.unitypackage`.
- Consequences: This established a comparison baseline against Unity-authored packages, but the project later removed the Unity-driven export path from the supported workflow after the native path imported cleanly.
- Related tasks: T-116, T-115
- Supersedes: N/A

---

### DEC-054: Keep Native `.unitypackage` Assembly As A POC Until Real `.meta` Files Exist
- Date: `2026-05-23`
- Status: Accepted
- Context: The project needs a zero-Unity, zero-project packaging path for CI, but the current repo does not yet store Unity-authored `.meta` files for the plugin tree.
- Decision: Prove the `.unitypackage` format with a repo-native Node POC that synthesizes deterministic `.meta` content and writes the GUID-folder tar.gz structure directly, while keeping the Unity-driven exporter as the more authoritative path for now.
- Consequences: The repo now has evidence that `.unitypackage` creation can happen without Unity, but the native packer remains a proof of concept until the project decides how to manage real `.meta` files and import settings in source control.
- Related tasks: T-117, T-116
- Supersedes: N/A

---

### DEC-055: Keep Harvested Unity `.meta` Files In Repo For The Native Packaging Path
- Date: `2026-05-23`
- Status: Accepted
- Context: After the native `.unitypackage` POC imported successfully in a clean Unity project, the weakest part of the zero-Unity path was the synthetic metadata fallback.
- Decision: Harvest Unity-authored `.meta` files from the clean verification project and check them into the repo alongside the canonical plugin content or package-root metadata mirror. Make the native packer prefer those checked-in `.meta` files and use synthesis only as a fallback.
- Consequences: The repo-native packer now more closely mirrors a real Unity-authored package, GUID stability improves, and future work can decide whether to eliminate synthetic fallback entirely once metadata coverage is complete.
- Related tasks: T-117
- Supersedes: N/A

---

### DEC-056: Make The Native Unity Package Builder The Default Export Path
- Date: `2026-05-23`
- Status: Accepted
- Context: The repo-native `.unitypackage` builder now imports cleanly in fresh Unity projects, no longer emits the earlier `.meta` warnings, and better matches the project's zero-Unity CI goals than the Unity-driven exporter.
- Decision: Promote the native builder to the default and only supported `npm run package:unity` command. Remove the Unity-driven export path from the supported command surface.
- Consequences: The main packaging story no longer depends on a Unity install or a configured Unity project, and contributors have one clear supported path instead of a split export model. The earlier Unity-driven export code has now been removed from the supported workflow.
- Related tasks: T-117, T-116
- Supersedes: N/A

---

### DEC-057: Build Release Downloads On Windows Before Static Site Deploy
- Date: `2026-05-23`
- Status: Accepted
- Context: The deployed website links directly to a Windows SEA CLI payload, a packaged Unity plugin, and a packaged VS Code extension, so the web deploy build must produce and embed those files first instead of deploying a site with broken download links.
- Decision: Add an Azure DevOps pipeline that follows the existing Cloudflare Pages deploy flow from `radebe-legacy`, but runs on `windows-latest` and drives one repo-owned `npm run build:release:web` command. Have the website build copy the packaged downloads and bridge manifest into `radebe-web/dist/downloads/` so the static deploy output is self-contained.
- Consequences: CI now matches the website's download contract, the Windows `.exe` linked by the site is built on the same agent that prepares the rest of the release artifacts, and website deploy no longer relies on dev-server-only middleware behavior. Azure DevOps still needs the expected Cloudflare secrets and any pipeline variables configured before the deploy can run in the hosted environment.
- Related tasks: T-119, T-117, T-058
- Supersedes: N/A

---

### DEC-058: Pin npm Explicitly In Azure DevOps Instead Of Trusting The Node Image Default
- Date: `2026-05-23`
- Status: Accepted
- Context: The first hosted Azure DevOps run used Node `20.9.0` as requested, but the bundled npm was `10.1.0`, which failed the workspace's intentional engine enforcement for npm `10.9.2`.
- Decision: Keep the strict repo engine contract and add an explicit pipeline step that installs npm `10.9.2` globally on the hosted agent before `npm ci`.
- Consequences: Hosted builds now match the repo's pinned runtime contract instead of weakening engine enforcement to fit the agent image. Pipeline failures after this point are more likely to reflect real dependency or environment issues than tool-version drift.
- Related tasks: T-119, T-111
- Supersedes: N/A

---

### DEC-059: Link Azure Library Variables In YAML For The New Repo Pipeline
- Date: `2026-05-23`
- Status: Accepted
- Context: The old pipeline could not be cleanly retargeted to the new repo, and the new Azure DevOps setup now stores deploy values in a Library variable group named `Radebe Variables`.
- Decision: Reference `Radebe Variables` directly from `azure-pipelines.yml` with `variables: - group: Radebe Variables` instead of relying on pipeline-UI-only linkage.
- Consequences: The pipeline's dependency on Azure Library configuration is visible in repo history and portable across recreated pipeline definitions. The pipeline still requires Azure authorization to use that variable group, and bad or missing values in the group will surface at runtime.
- Related tasks: T-119
- Supersedes: N/A

---

### DEC-060: Advance The Workspace Node Baseline To 20.18.1
- Date: `2026-05-23`
- Status: Accepted
- Context: After fixing npm pinning in Azure DevOps, the hosted install still failed because `@vscode/vsce` resolved `cheerio@1.2.0`, whose engine requires Node `>=20.18.1`. The repo's earlier Node `20.9.0` baseline was no longer sufficient for the current build tooling graph.
- Decision: Move the repo and pipeline Node baseline from `20.9.0` to `20.18.1` while keeping npm pinned at `10.9.2`.
- Consequences: CI and local setup now target a newer Node 20 patch that satisfies the current VS Code packaging dependency chain without introducing brittle overrides for transitive tooling packages. Contributors need to update their local Node runtime from `20.9.0` to `20.18.1`.
- Related tasks: T-119, T-111
- Supersedes: N/A

---

### DEC-061: Build On Windows But Deploy Cloudflare Pages From Linux
- Date: `2026-05-23`
- Status: Accepted
- Context: The new pipeline needs Windows to build the website-linked `win32-x64` CLI payload, but after merging to `master`, Cloudflare only showed the project-update audit and no deployment event. The legacy deploy path was already known to work from `ubuntu-latest`.
- Decision: Split the Azure pipeline into two stages: build release artifacts on `windows-latest`, publish the website output as a pipeline artifact, then download that artifact and run the actual Cloudflare Pages deploy from `ubuntu-latest`.
- Consequences: The project keeps the Windows build requirement for packaged downloads while reducing deploy-environment drift against the legacy Cloudflare flow. This also makes deploy troubleshooting clearer by separating build failures from Cloudflare upload behavior.
- Related tasks: T-119
- Supersedes: N/A

---

### DEC-062: Do Not Ship Large Release Binaries Through Cloudflare Pages
- Date: `2026-05-23`
- Status: Accepted
- Context: A hosted deploy run proved that Cloudflare Pages rejects files larger than `25 MiB`, and the current site output included a `66.9 MiB` Windows CLI binary plus other large release downloads.
- Decision: Temporarily remove the oversized public download binaries from the Pages site output and hide the integration pages that advertise them until release artifacts are moved to external hosting such as Cloudflare R2.
- Consequences: The site itself can now deploy through Pages without being blocked by large binaries, but public download links for the VS Code extension, Unity package, and Windows CLI are intentionally unavailable until the external artifact host is in place.
- Related tasks: T-119
- Supersedes: N/A

---

### DEC-065: Queue Non-Immersive Playground Startup By Viewport Priority
- Date: `2026-05-24`
- Status: Accepted
- Context: After page-level route timing was improved, the remaining perceived slowness came from many command-reference and examples rows creating CodeMirror editors and first previews at once, which made the editor/preview surface feel heavy even when the page frame itself was fast.
- Decision: Instrument `Playground` startup explicitly and queue non-immersive playground activation so only one row performs its initial editor/preview startup at a time, preferring the nearest visible row first. Keep the immersive `Try it` editor immediate.
- Consequences: Command-reference and examples pages can paint quickly while still bringing editors/previews online in a predictable order, and perf reports now separate queue wait, editor setup, and preview startup cost so future optimization can focus on the real bottleneck instead of total page frame time.
- Related tasks: T-124, T-123
- Supersedes: N/A

---

### DEC-066: Split Remaining Work Into M2 Closeout, M3 Rendering, And M4 Unity/Editor
- Date: `2026-05-26`
- Status: Accepted
- Context: After the first usable authoring loop, the remaining backlog mixed final website/release polish with longer-horizon rendering features and postponed Unity/editor work, which made milestone priority unclear.
- Decision: Keep M2 as a short closeout milestone for final website/release passes, move the deferred rendering/language backlog into M3, and reserve M4 for Unity integration plus reusable editor surfaces.
- Consequences: The near-term execution queue becomes smaller and more release-oriented, future rendering work gets a dedicated milestone instead of extending M2 indefinitely, and Unity/editor work stays intentionally later unless priorities change again.
- Related tasks: T-074, T-125, T-126, T-063, T-068, T-072, T-054, T-055
- Supersedes: N/A

---

### DEC-067: Unify Corner Targeting Across Rect And Polygon-Family Shapes
- Date: `2026-05-26`
- Status: Accepted
- Context: The backlog already included mixed per-corner rectangle treatment work, but the same authoring need now exists across `rect`, `polygon`, `polygon-regular`, and `polygon-star`, where authors should be able to target subsets of corners or vertices without inventing separate modifier systems per shape.
- Decision: Expand T-077 from rectangle-only mixed-corner work into a unified corner-targeting system for `cut` and `radius` on cornerable shapes. The future model should support selectors by index and by semantic tag. Tags may overlap, such as a rectangle corner participating in `top-left`, `top`, and `left`, while star vertices can participate in tags such as `inner` and `outer`. `path` remains excluded from this decision until richer path-corner semantics are designed.
- Consequences: Corner modifiers can become more expressive without fragmenting the language surface across shape families, existing uniform and shorthand corner forms can remain as convenience syntax, and compiler/runtime work must define a stable selector model plus conflict/precedence behavior when multiple selectors target the same corner.
- Related tasks: T-077, T-122, T-071
- Supersedes: DEC-040

---

### DEC-068: Run Web Playground Preview Rendering Through A Coalescing Worker Queue
- Date: `2026-05-26`
- Status: Accepted
- Context: The CodeMirror editor already debounced preview rendering, but pages with several editable examples still felt slow because the first edit of a cached-preview row synchronously rendered on the keystroke path and later preview renders could still compete with typing on the main thread.
- Decision: Move web playground preview `renderSource` work into a module worker behind one shared queue. Queue entries are coalesced per playground so repeated edits keep only the latest pending source, stale render results are ignored, and a short edit cooldown delays preview refresh until typing pauses.
- Consequences: Typing stays responsive even on multi-example pages, at the cost of previews catching up asynchronously. The preview toolbar now exposes queued, dirty, refreshing, cached, rendered, and error states so users can see when the displayed preview is still catching up.
- Related tasks: T-129, T-100, T-124
- Supersedes: N/A

---

### DEC-069: Treat Shared Schema Metadata As The Vocabulary Source For Editor Assistance
- Date: `2026-05-26`
- Status: Accepted
- Context: T-074 remained open as a catch-all cleanup task for cross-surface wording drift after the public web reference copy sweep, but the repo now routes both web-editor assistance and VS Code assistance through the same `@radebe/core` schema and language-service metadata.
- Decision: Treat the shared `@radebe/core` schema plus language-service metadata as the canonical vocabulary source for completions and argument help across editor surfaces, and close T-074 as a standalone M2 task now that the public docs are also aligned.
- Consequences: Future wording tweaks should ship with the feature work that changes the schema or docs rather than reopening a separate milestone-wide vocabulary pass. Drift risk is reduced because the web editor and VS Code extension no longer maintain separate help taxonomies.
- Related tasks: T-074, T-084, T-081
- Supersedes: N/A

---

### DEC-070: Split Product Version From Site Version While Keeping One Main Public Label
- Date: `2026-05-26`
- Status: Accepted
- Context: M2 closeout needed a formal release process, and the user confirmed that publishing website-only work without a product version bump is likely to be a normal flow. The repo therefore needs a traceable site/build version without overloading the main Radebe product version.
- Decision: Split the website version source into a public `productVersion` and a secondary `siteVersion`. Keep the website top bar and release notes on the product version, use the site version for deploy/build tracking, continue keeping one aligned product version across the workspace rather than creating separate public version streams for `web`, `core`, `cli`, `unity`, and `vscode`, and use separate git tag namespaces: `product/vX.Y.Z` for product releases and `site/YYYY-MM-DD.N` for website-only deploys.
- Consequences: Website-only deploys can now advance the site/build version without forcing a user-facing product version bump, while product releases still keep one easy-to-understand public version across the toolchain. Separate tag namespaces remove ambiguity that bare `vX.Y.Z` tags would create after the split. The repo now needs release discipline around which version field and tag namespace changes on each deploy, but it avoids the heavier coordination cost of fully independent package-level public versioning.
- Related tasks: T-126
- Supersedes: N/A

---

### DEC-071: Use `YYYY-MM-DD.N` As The Site-Version Format
- Date: `2026-05-26`
- Status: Accepted
- Context: DEC-070 introduced a separate `siteVersion`, but the project still needed one concrete format so deploy markers, website-only release prep, and `site/*` tags would stay aligned instead of drifting into ad hoc strings.
- Decision: Format `siteVersion` as `YYYY-MM-DD.N`, where `N` increments for additional deploys on the same date, and keep `site/YYYY-MM-DD.N` as the matching git tag shape for website-only deploy history.
- Consequences: Site builds now have a predictable operational identifier that reads differently from the public product semver, release docs can describe one durable rule instead of examples only, and the first prepared formal release candidate uses `2026-05-26.1` as the initial site/build marker.
- Related tasks: T-126
- Supersedes: N/A

---

### DEC-072: Keep One Canonical Product Release-Notes Source Rendered By The Site
- Date: `2026-05-26`
- Status: Accepted
- Context: Release prep now depends on the site-facing release notes being accurate, but page-local copy and process docs could otherwise drift into separate versions of the release story.
- Decision: Treat the site-rendered product release notes as the canonical product release-notes source, keep that content in one dedicated module, and reserve it for product releases only rather than website-only deploy history.
- Consequences: Preparing a release now explicitly includes finalizing the product release-note entry, website-only deploys should not add release-note entries, and the release-notes page becomes a pure renderer of the canonical content instead of a second source of truth.
- Related tasks: T-126
- Supersedes: N/A

---

### DEC-073: Preserve The Existing Unity ScriptedImporter GUID
- Date: `2026-05-27`
- Status: Accepted
- Context: Eddie's existing `.rdb.meta` assets reference `RadebeSpriteImporter` through Unity's serialized ScriptedImporter script GUID `7d26963f36cf2114eb572a982375d4c1`, while the redeployed plugin script meta had drifted to `6640e18c04fcca044c4a6433be509617`, causing existing imports to show missing script.
- Decision: Treat `7d26963f36cf2114eb572a982375d4c1` as the stable GUID for `radebe-unity/Assets/Editor/RadebeSpriteImporter.cs.meta` and preserve it in repo source, deployed plugin copies, and native Unity package output.
- Consequences: Existing `.rdb.meta` importer settings resolve without bulk asset rewrites, and future packages keep the importer identity stable. Any short-lived assets created against the accidental `6640e18c04fcca044c4a6433be509617` GUID would need reimport or meta repair, but no Eddie `.rdb.meta` files referenced that accidental GUID during verification.
- Related tasks: T-134, T-133, T-117
- Supersedes: N/A

---

### DEC-074: Publish `v0.1.0` As A Web-Only Public Release
- Date: `2026-05-27`
- Status: Accepted
- Context: Cloudflare R2 would require a credit card even for the free tier, and the user is undecided between staying on Azure/Cloudflare or moving the public open-source project shape to GitHub, GitHub Actions, GitHub Pages, and GitHub Releases.
- Decision: Publish the current `v0.1.0` release as a web-only public site release. Do not publish CLI, VSIX, or Unity package downloads in this release, keep public integration/download pages hidden, simplify `build:release:web` and the Azure pipeline so they build/deploy only the website, and defer the source/artifact-hosting decision to a follow-up task.
- Consequences: M2 can close around the first public web authoring experience without requiring a credit-card-backed artifact host or a rushed GitHub migration. Public copy must not advertise unavailable downloadable tooling, and future public CLI/VSIX/Unity distribution needs a separate hosting decision before those pages are restored.
- Related tasks: T-126, T-135, T-119
### DEC-075: Use `Appearance Passes` As The Renderer Umbrella For Fill/Stroke/Shadow/Glow
- Date: `2026-05-27`
- Status: Accepted
- Context: The renderer refactor split rect, circle, and polygon code into per-command modules, but future maintainability work still needs one clear umbrella term for `fill`, `stroke`, `shadow`, and `glow` that does not blur the repo's existing distinction between geometry commands and their visual treatment.
- Decision: Treat `fill`, `stroke`, `shadow`, and `glow` as `appearance passes` in renderer architecture discussions and follow-up tasks. Keep the user-facing command names unchanged, preserve the geometry-versus-appearance distinction in the language model, and use future refactors such as T-133 to explore shared implementation capabilities for those appearance passes across shapes.
- Consequences: The project gets one durable internal term for the ordered visual passes applied to shapes and composited layers, without forcing a surface-language rename or collapsing shape-specific geometry logic too early. Follow-up architecture work can now target appearance-pass unification explicitly instead of alternating between `effects`, `appearance`, and other overloaded labels.
- Related tasks: T-132, T-133
- Supersedes: N/A

---

### DEC-076: Model Repetition Features As Structural Containers
- Date: `2026-05-28`
- Status: Accepted
- Context: Cog and repeated-detail authoring exposed a broader need for radial, linear, grid, mirrored, tiled, and path-following repetition without adding a narrow one-off `cog` command or treating repeated path vertices as one concatenated path by default.
- Decision: Track repeaters as structural containers that instantiate child drawables under deterministic transforms. The planned family is `repeat-linear`, `repeat-grid`, `repeat-radial`, `mirror`, `tile`, and later `repeat-along-path`; `scatter` is intentionally excluded from the current planned set.
- Consequences: The language gets a general reuse/composition direction for bolts, cogs, dial ticks, vents, grids, and tile-like regions while preserving shape commands as geometry primitives. Implementation should define transform semantics for repeated child drawables, keep repeated paths independent unless a later region-combination feature says otherwise, distinguish fixed-count `repeat-grid` from bounded-area `tile`, and defer `repeat-along-path` until richer path semantics are available.
- Related tasks: T-069, T-070, T-071, T-136
- Supersedes: N/A

---

### DEC-077: Keep VS Code Live Preview As A Lightweight WebviewPanel
- Date: `2026-05-28`
- Status: Accepted
- Context: The VS Code extension already owns native `.rdb` editing and language support, while the existing web playground includes a Preact and CodeMirror authoring surface that should not be duplicated inside VS Code.
- Decision: Implement the VS Code live rendered preview as an in-editor `WebviewPanel` that sits beside the native text editor, consumes `@radebe/core` render output from the extension side, and draws only the rendered artifact plus minimal preview controls/status in the webview. Do not open a separate browser window and do not embed the full `radebe-web` playground.
- Consequences: VS Code keeps its native editor, undo, language features, and extension-host integration while gaining a rendered preview pane similar to Markdown Preview. The implementation can reuse the shared render artifact and selected preview-display logic without introducing Preact/CodeMirror into the extension preview. The task stays internal to the VS Code extension backlog and is intentionally excluded from the public website roadmap.
- Related tasks: T-137, T-056, T-058
- Supersedes: N/A
