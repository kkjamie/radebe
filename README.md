# Radebe

Radebe is a TypeScript-based language toolchain and authoring ecosystem.

The repo is being organized as a multi-package workspace with these primary parts:

- `radebe-core`: parsing, compiling, and rendering for the language.
- `radebe-cli`: standalone command-line wrapper around `radebe-core`.
- `radebe-web`: browser-based authoring and realtime preview powered by `radebe-core` as a TypeScript module.
- `radebe-unity`: Unity bridge that integrates through `radebe-cli`.
- `scripts`: build, packaging, and automation utilities.

## Workspace Tooling

- Root package manager: `npm` workspaces
- Shared compiler baseline: TypeScript project references
- Browser package shell: Vite in `radebe-web`
- Unity integration direction: `radebe-unity` consumes `radebe-cli`

## Documentation

Project planning and source-of-truth docs live in `docs/project/`.

Start with:

1. `AGENTS.md`
2. `docs/project/README.md`
3. `docs/project/product-spec.md`
4. `docs/project/task-board.md`
5. `docs/project/roadmap.md`

## Packaging Direction

The intended CLI distribution path is a packaged executable so Unity and other consumers do not need a separate Node.js installation at runtime.

## CLI SEA Packaging

Build a local Node SEA executable artifact with:

```powershell
npm run package:cli:sea
```

Run the packaged executable smoke test with:

```powershell
npm run smoke:cli:sea
```

The automation emits release-time bundle, blob, config, and executable outputs under `artifacts/radebe-cli/sea/<platform>-<arch>/`. The current implementation targets the Node 20 SEA flow, so it bundles `radebe-cli` plus `@radebe/core` into a CommonJS entry before creating the executable.
