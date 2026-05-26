# Codebase Map

Owner: `Main Thread`
Last updated: `2026-05-23`

## Top-Level Layout
- `docs/`: workflow, planning, and project source-of-truth docs.
- `docs/original-spec.md`: redirect to canonical docs after spec consolidation.
- `.nvmrc`: pinned local Node.js runtime version for contributors and shell tooling.
- `.npmrc`: npm workspace enforcement such as `engine-strict` for the pinned runtime.
- `package.json`: root npm workspace manifest and shared scripts.
- `tsconfig.base.json`: shared TypeScript compiler defaults for workspace packages.
- `tsconfig.json`: root TypeScript project references for the active workspaces.
- `radebe-core/`: shared TypeScript engine package for parsing, compiling, and rendering.
- `radebe-cli/`: Node CLI package that wraps `radebe-core`.
- `radebe-web/`: Vite-backed browser package that imports `radebe-core`.
- `radebe-vscode/`: VS Code extension package that registers `.rdb` language support and imports `radebe-core` for editor intelligence.
- `radebe-unity/`: Unity bridge placeholder that will integrate through the packaged CLI rather than a separate runtime port.
- `scripts/`: workspace automation package for repo-level tooling.

## Core Runtime Paths
- `radebe-core/src/index.ts`: root public API that re-exports shared types and the common parse/compile/render helpers.
- `radebe-core/src/parser.ts`: parser boundary for converting source text into the shared parsed document shape.
- `radebe-core/src/compiler.ts`: compiler boundary for transforming parsed documents into renderable compiled documents.
- `radebe-core/src/colors.ts`: shared Radebe color parsing, formatting, named-color registry, and source token range extraction for editor color decorators.
- `radebe-core/src/schema.ts`: command registry, child-capability rules, compiler-facing shorthand/property metadata, and editor-facing argument, enum, indentation, inline-child, and shorthand-expansion metadata.
- `radebe-core/src/language-service.ts`: headless editor assistance API for cursor context, schema-driven completions, argument help, enum suggestions, smart edits, and Enter indentation.
- `radebe-core/src/renderer.ts`: renderer boundary plus the convenience source-to-artifact pipeline helper.
- `radebe-core/src/types.ts`: shared contracts that define the cross-stage document, render artifact, and diagnostic shapes.
- `radebe-core/test/`: initial Node test coverage for shared runtime behavior.
- `radebe-cli/src/`: CLI entrypoint and future command/file IO orchestration.
- `radebe-cli/test/`: initial CLI behavior coverage.
- `radebe-web/src/main.tsx`: Preact browser site shell, top bar/sidebar wiring, hash routing, active navigation, and shared source-state ownership.
- `radebe-web/src/data.ts`: lightweight page registry that combines page definitions exported from `src/pages/` with command reference docs.
- `radebe-web/src/pages/home.tsx`: homepage component with its page definition and highlighted mini-preview source co-located at the top.
- `radebe-web/src/pages/try-it.tsx`: full-page Try it component with its page definition and default editor example data co-located at the top.
- `radebe-web/src/pages/syntax.tsx`: syntax guide component with feature cards, notes, and example snippets co-located at the top.
- `radebe-web/src/content/release-notes.ts`: canonical product release-note content rendered by the public site.
- `radebe-web/src/pages/release-notes.tsx`: release notes page component that renders the canonical product release-note content.
- `radebe-web/src/pages/roadmap.tsx`: public roadmap component with feature cards and planned syntax examples co-located at the top.
- `radebe-web/src/pages/integrations.tsx`: integration page component with VS Code extension and Unity plugin page data plus local download links co-located at the top.
- `radebe-web/src/pages/command-reference.tsx`: generic command reference page component that renders command docs and examples.
- `radebe-web/src/pages/index.ts`: barrel exports for page components and page definitions.
- `radebe-web/src/content/commands/*.ts`: one command reference doc module per sidebar command page, with `content/commands/index.ts` preserving navigation order.
- `radebe-web/src/playground.tsx`: Preact-hosted CodeMirror Radebe editor/preview surface, schema-driven assists, diagnostics, color swatches, and preview rendering.
- `radebe-web/src/syntax-highlight.ts`: shared static source highlighter used outside CodeMirror surfaces.
- `radebe-web/src/ui.tsx`: reusable Preact page panels and small UI primitives used by page renderers.
- `radebe-web/src/styles.css`: stylesheet for the web shell, editor, sidebar, and shared components.
- `radebe-web/src/types.ts`: web-only page/content types shared across the web modules.
- `radebe-vscode/src/extension.ts`: VS Code extension activation for `.rdb` completions, signature help, diagnostics, color decorations/picker presentations, smart newline indentation, smart edits, and text render preview.
- `radebe-vscode/src/language-adapter.ts`: pure adapter layer that converts VS Code-style offsets into shared `@radebe/core` language-service, color-token, and diagnostic-range calls.
- `radebe-vscode/syntaxes/radebe.tmLanguage.json`: TextMate grammar for `.rdb` syntax highlighting.
- `radebe-unity/README.md`: bridge direction and the canonical `Assets/Plugins/Radebe` Unity asset layout.
- `radebe-unity/docs/cli-bridge-contract.md`: Unity-facing invocation, install/update, and error-reporting contract for the packaged CLI bridge.
- `radebe-unity/bridge.manifest.json`: bridge metadata that mirrors the Unity contract baseline and packaged artifact expectations.
- `radebe-unity/PackageRoot.meta` and `radebe-unity/PackageRoot/**/*.meta`: repo-owned Unity-authored metadata mirror for package-root assets that do not live directly under `radebe-unity/Assets`, such as `bridge.manifest.json` and packaged CLI payload entries.
- `radebe-unity/Assets/Editor/RadebeCliBridgeHelper.cs`: Unity-side install validation, plugin-local payload copy/update, and smoke-invocation helper for the packaged CLI payload under `Assets/Plugins/Radebe/Tools/radebe-cli/`.
- `radebe-unity/Assets/Editor/RadebeSpriteImporter.cs`: Unity `.rdb` ScriptedImporter that invokes `radebe-cli compile <file> --format unity-json` and creates generated `Texture2D` plus `Sprite` subassets.
- `radebe-unity/Assets/Editor/RadebeUnityMenu.cs`: Unity editor menu entrypoints for payload validation, install/update, and smoke testing.
- `radebe-unity/Assets/Editor/RadebeUnityImportVerifier.cs`: batchmode-friendly utility for asserting that a configured `.rdb` asset imports as a generated Sprite.

## Tooling / Build Paths
- `scripts/src/doctor.ts`: initial repo automation entrypoint for workspace health checks.
- `scripts/src/sea.ts`: release-time bundling and Node SEA packaging automation for `radebe-cli`.
- `scripts/src/unity-common.ts`: shared Unity deploy/package config parsing and filesystem helpers.
- `scripts/src/unity-deploy.ts`: local Unity plugin deployment helper that reads `.env` / `RADEBE_UNITY_PROJECT_PATH`, copies `radebe-unity/Assets` plus `bridge.manifest.json` into `Assets/Plugins/Radebe`, and installs the current platform packaged CLI payload under `Tools/radebe-cli/`.
- `scripts/src/unity-package-native-poc.ts`: experimental zero-Unity packer that emits a `.unitypackage` directly from the repo's canonical plugin layout plus the built CLI payload, now preferring harvested repo `.meta` files, excluding `.meta` files from ordinary asset payload collection, and matching Unity's export structure more closely with GUID directory entries plus `asset` / `asset.meta` / `pathname` ordering.
- `scripts/install-vscode-extension.mjs`: local VS Code deployment helper that stages the extension plus copied `@radebe/core` runtime files, packages a VSIX through `@vscode/vsce`, and optionally installs it with the VS Code CLI.
- root workspace config files: npm workspaces, TypeScript project references, and shared build settings.
- CLI packaging pipeline: bundle `radebe-cli` plus `@radebe/core` into a single release entry script, then build per-platform Node SEA executables from a pinned Node LTS binary.
- SEA artifact root: `artifacts/radebe-cli/sea/<platform>-<arch>/` containing `artifact-manifest.json`, the bundled entry, SEA blob, config, and generated executable.
- CLI packaging outputs: signed or otherwise release-ready standalone executable artifacts intended for Unity and other non-Node consumers.

## Test Paths
- `radebe-core/test/`: parser, compiler, renderer, and fixture coverage.
- `radebe-cli/test/`: command invocation, bundled entrypoint smoke tests, and executable packaging verification.
- `scripts/test/sea.test.ts`: end-to-end SEA packaging smoke test that builds and runs the generated executable on the current platform.
- `radebe-web/`: UI and integration tests for authoring and realtime preview flows.
- `radebe-vscode/test/`: adapter-level coverage for completion, indentation, smart edits, diagnostic ranges, color tokens, and text render preview behavior.
- `radebe-unity/`: bridge validation and integration smoke tests as the package matures.

## Agent Notes
- Keep this file high-signal and architecture-focused.
- Avoid duplicating detailed implementation notes from session logs.
- Workspace tooling is now `npm` workspaces plus TypeScript project references, with `radebe-unity` intentionally kept outside the npm workspace boundary.
- `radebe-web` is a Vite + TypeScript + Preact app; keep public pages and reusable panels in TSX components, while treating CodeMirror-specific editor behavior as an imperative island inside `playground.tsx`.
- `radebe-core` now exposes both a root API and subpath exports so downstream packages can choose between whole-pipeline usage and stage-specific integration.
- The recommended executable path is Node SEA so the repo can stay on the current Node/npm toolchain and only add release-time bundling plus per-platform artifact generation.
- The first VS Code surface consumes `@radebe/core` directly inside the extension host; introduce an LSP adapter only if multiple editor hosts need the protocol boundary.
