# Session Log: T-001 Workspace Scaffold

Date: `2026-05-17`
Thread: `t-001-workspace-scaffold`

## Scope
- Choose the root workspace tooling for the initial Radebe monorepo.
- Scaffold the first package folders and configs for `radebe-core`, `radebe-cli`, `radebe-web`, `radebe-unity`, and `scripts`.
- Update canonical docs to reflect the actual scaffold choice.

## Work Completed
- Selected `npm` workspaces as the root package manager and TypeScript project references as the shared compiler baseline.
- Added the root `package.json`, `tsconfig.base.json`, `tsconfig.json`, and `.gitignore`.
- Scaffolded `radebe-core`, `radebe-cli`, `radebe-web`, and `scripts` as workspace packages with starter manifests, TypeScript configs, and minimal source files.
- Added `radebe-unity/README.md` to document that Unity will consume the packaged CLI rather than a separate runtime port.
- Updated the decision log, product spec, codebase map, milestone state, task board, README, and main-thread state to match the scaffold.

## Verification
- `npm install` completed successfully and produced a lockfile.
- `npm run build` succeeded after fixing package entrypoints for emitted `dist/src/*` outputs.
- `npm test` succeeded after switching the workspace test scripts to directory-based `node --test` invocations that work on Windows.

## Notes
- The scaffold keeps `radebe-unity` outside the npm workspace set on purpose so the Unity bridge can stay focused on consuming `radebe-cli`.
- `radebe-web` uses Vite only as the initial browser shell; runtime boundaries remain centered on `radebe-core`.
- The initial sandboxed `npm run build` attempt hit a Windows `EPERM` path-resolution issue, but the same verification completed successfully outside the sandbox and the remaining fixes were project-config issues rather than environment blockers.

## Next Recommendation
- Start with T-002 to replace the placeholder core API with concrete parser/compiler/renderer module boundaries and exports.
