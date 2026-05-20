# Main Thread State

Owner: `Main Thread`
Last updated: `2026-05-20`

## Current Milestone / Gate
- Milestone: `M2`
- Gate: `Gate C`
- Status: `Passed`

## Current Focus
- The recovered source product spec is now reflected in code through an indentation-aware command tree, a schema-backed compiler registry, a small `sprite` header block with nested `size` and `background` properties, root-level `plot`, `line`, `rect`, `rect-absolute`, `rect-inset`, and `circle` commands, generic property normalization across positional inline args, named inline args, and child property commands, plus actual `fill` / `solid` / explicit `gradient-linear` / explicit `gradient-radial` appearance commands while `gradient` remains the compatibility alias for the linear form.
- `overlay` has been intentionally removed from the near-term language surface and web docs for now; ordered multi-`fill` passes are the current supported layering model until a future compositing need justifies a distinct overlay command again.
- `shadow` is now a real shape appearance pass on `rect`, `circle`, and `polygon`, with `x`, `y`, `spread`, explicit per-pass `alpha`, and either color shorthand or nested `fill`; it renders as a crisp contour-derived shadow behind the source shape, and `blur` remains intentionally deferred to a later extension on the same command.
- `fill` and `stroke` now also support explicit `alpha` properties as per-pass opacity multipliers; they default to `1`, multiply with any alpha already present in solid colors or gradient stop colors, and do not implicitly flow into nested child strokes.
- Rectangle geometry now also supports `cut` and `radius` as child geometry modifiers on rectangle-backed shapes, with `cut` covering chamfered corners, `radius` covering rounded corners, and the current compiler intentionally rejecting both on the same rectangle until a richer mixed-corner model exists.
- Geometry commands can now opt into shared shape appearance children through a `shape-appearance` capability path in the schema, and the compiler collects those `fill` / `stroke` children through a shared appearance pass instead of per-shape child wiring.
- Rectangle-backed `stroke` is now available as the first generated-region appearance slice, including `stroke <width> <color>` shorthand, optional `align`, optional `style`, rectangle rendering for `solid`, `dashed`, and `dotted` styles, nested child `stroke` support on the generated stroke envelope, and modifier-aware contour following for `cut` and `radius`.
- `circle` is now available as the first non-rectangular shape primitive using integer `x`, `y`, and `radius` geometry plus color shorthand or explicit `fill`, and it now also participates in the shared `stroke` model.
- `polygon` is now available as a shared-shape geometry primitive using either flat whitespace-separated `x y` point pairs or canonical child `point` commands, plus color shorthand or explicit `fill`, and it now also participates in the shared `stroke` model while still keeping polygon syntax on the existing whitespace token model.
- `path` is now available as a stroke-first open polyline primitive using canonical child `point` commands and required `stroke`; the first slice intentionally limits path to `stroke` align `center` and does not yet treat paths as fillable or closable regions.
- File-scoped variables are now available through root `var name value` declarations plus optional `vars` grouping blocks. References resolve top-to-bottom as whole value tokens such as `$accent`, including named argument values like `color=$accent`; embedded expression forms such as `left+$pad` remain deferred.
- Optional real output antialiasing is now available through a sprite-level `antialias` default plus per-geometry overrides on line, rectangle, circle, polygon, and path commands. The omitted default remains `false`, so existing pixel-perfect output remains unchanged unless authors opt in.
- Source comments now use hash-prefixed lines only. The parser ignores lines whose trimmed text starts with `#`; `//` is no longer a comment marker and will be parsed as ordinary source.
- The shared `radebe-core` / `radebe-cli` / `radebe-web` path remains intact, the SEA smoke path still exercises the same spec-aligned sample contract, and the web shell has grown into a left-nav docs/playground surface with an experimental page plus per-feature example pages that now support multiple editable live scenarios on a single page.
- The web source editor now keeps native textarea editing while rendering a synchronized syntax-highlight layer for comments, command tokens, property-command child args, named argument keys, argument values, and unknown command tokens.
- T-044 added editor-oriented metadata to the shared command schema: typed argument definitions, enum values, allowed-child metadata helpers, inline child-command hints for `fill` variants, indentation hints, variadic polygon point-pair metadata, and shorthand-expansion hints for color forms that lower into `fill solid`. This is the foundation for a headless language service before the web editor or Unity editor window grow richer UI behavior.
- T-045 added a headless `@radebe/core` language-service API for cursor context, schema-driven command completions, argument help, enum completions, inline `fill` variant completions, contextual property argument help, and Enter indentation. It is exported from the root package and from `@radebe/core/language-service`.
- T-046 wired that language-service API into the current web textarea editor with a lightweight completion popup, argument helper strip, `Tab` completion acceptance, arrow-key completion navigation, `Escape` dismissal, and smart `Enter` indentation. The implementation intentionally keeps the existing highlight layer and live preview intact.
- T-048 tuned the first web completion interaction pass so completion lists appear only after a typed prefix unless explicitly requested, `Enter` accepts the active visible completion instead of inserting a newline, accepted completions suppress immediate reopening, and the assist UI positions below the current line.
- T-049 polished the web assist interaction and display: explicit completion request moved to `Ctrl+Space`, requested completions persist until `Escape` or an edit changes the context, accepted completions no longer reopen immediately, argument help opens only after entering an argument slot such as typing a space, optional arguments are shown with a `?` marker, and enum argument values render inline in the helper.
- T-047 added the first schema-driven smart edit API to `@radebe/core`: `getLanguageSmartEdits` can remove parent constructor shorthand arguments marked by `shorthandExpansions` when an equivalent child command is started. The web editor now applies that edit immediately, so starting `fill` under a shape with inline color shorthand removes the parent color token before preview and assist refresh.
- The web examples now fold cut and rounded-corner rectangle cases into the main `rect` page instead of keeping separate `cut` or `rounded-rect` pages, and `polygon` now has real live examples instead of a placeholder page.
- The web example nav now keeps placeholder pages only for substantive planned features; low-value stubs such as `size`, `background`, `fill`, `inset`, `blend`, `draw`, `overlay`, and standalone `align` / `style` property pages were removed so those concepts can instead live under parent pages or command-specific pages.
- The web docs/playground now has a real `shadow` page instead of a placeholder, including examples for simple offset use plus positive and negative `spread`.
- The web docs/playground now has a real `vars` page, and the syntax highlighter gives variable declarations and `$name` usages their own color.
- `radebe-web` now has a Vite resolver config that maps `@radebe/core` and its exported subpaths to `radebe-core/src` for web dev/build bundling, so `npm run dev:web` no longer requires a pre-existing `radebe-core/dist`.
- M2 Gate C is now passed through T-011. The current Unity plugin baseline keeps `.rdb` as source, adds a ScriptedImporter that turns Unity JSON output into generated `Texture2D` and `Sprite` subassets, and deploys repo-owned plugin code plus the packaged CLI payload into a configured Unity project through `.env` / environment variables rather than committed Eddie-specific paths.
- Current configured-project validation: a local ignored `.env` points `RADEBE_UNITY_PROJECT_PATH` at `D:/projects/personal/eddie`; `npm run deploy:unity` successfully redeployed `radebe-unity/Assets` to `Assets/Radebe` and the packaged CLI payload to `Assets/StreamingAssets/Radebe/radebe-cli/win32-x64`; and manual editor verification in Eddie confirmed the deployed `.rdb` importer produces a generated Sprite main asset.
- A separate Eddie batchmode package-resolution issue around `com.unity.test-framework` still exists, but it no longer blocks Gate C closure because the Unity integration objective for this task was verified manually in-editor.

## Open Decisions / Blockers
- No M1 blocker remains; the shared core/web render contract, workspace build, workspace tests, and CLI SEA smoke path all pass in the current environment.
- No active blocker remains on the language or web-dev tooling side.
- DEC-030 records that editor intelligence should be driven from shared core schema metadata rather than hard-coded web or Unity presentation logic.
- T-047 is complete; the next editor-track choice is whether to move the textarea shell to CodeMirror 6 for stronger editor primitives or continue with small language-service-backed improvements in the current textarea implementation.
- No active blocker remains on T-011. The remaining Unity follow-on work is product choice, not integration failure.
- The current leading Unity follow-on is importer options for sprite authoring ergonomics: border/9-slice metadata, pivot, pixels per unit, and filter mode surfaced through the existing ScriptedImporter settings.
- T-043 is now in progress. Repo code adds a custom `RadebeSpriteImporter` inspector plus importer-side support for pivot presets, custom pivot fallback, clamped 9-slice border values, mesh type, extrude edges, filter mode, and wrap mode. The inspector now also renders a live preview overlay of the imported sprite with border guides and pivot marker driven by the current inspector values before reimport. The updated plugin has been redeployed to Eddie through `npm run deploy:unity`, but the settings still need a hands-on Unity editor check.

## Best Next Tasks
1. If continuing the editor track, start T-050 and decide whether the next slice should migrate to CodeMirror 6 for better cursor-positioned UI and edit transactions.
2. If staying on the current textarea shell, add another small language-service-backed assist such as diagnostics underlining or command-specific hover/help.
3. Return to T-043 when ready to close the active Unity importer-options task with hands-on Eddie validation.

## Resume Checklist
1. Read the latest `docs/project/session-log/*.md`.
2. Verify consistency across `task-board`, `roadmap`, `milestone`, and `decisions`.
3. Select the next best unblocked objective.
