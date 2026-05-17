# Session Log: T-006 CLI SEA Implementation

Date: `2026-05-17`
Thread: `t-006-cli-sea-implementation`

## Scope
- Implement the accepted Node SEA packaging pipeline for `radebe-cli`.
- Add project automation for bundle/blob/executable generation.
- Add smoke coverage for the packaged executable path.

## Work Completed
- Added explicit SEA tooling dependencies to `@radebe/scripts`: `esbuild` for release-time bundling and `postject` for resource injection into the copied Node binary.
- Implemented `scripts/src/sea.ts` to:
  - bundle `radebe-cli` plus `@radebe/core` into one CommonJS entry suitable for the current Node 20 SEA flow,
  - emit a SEA config file plus metadata manifest,
  - generate the SEA prep blob,
  - copy the current Node binary and inject the blob into a runnable standalone executable,
  - expose `bundle`, `build`, and `smoke` commands for automation.
- Added root commands:
  - `npm run package:cli:sea`
  - `npm run smoke:cli:sea`
- Added `scripts/test/sea.test.ts` to build the SEA artifact in a temp directory, run the bundled entry, run the generated executable, and assert the expected CLI output on the current platform.
- Updated repo docs with the packaging commands, artifact root, and implementation-specific CommonJS note for the current Node SEA flow.
- Added `artifacts/` to `.gitignore` so local packaging runs do not leave untracked release binaries behind.

## Implementation Notes
- The SEA bundle uses an in-memory wrapper entry that calls `run(process.argv)` directly. This avoids relying on `import.meta.url` in the generated CommonJS bundle while keeping `radebe-cli` itself authored as a normal ESM workspace package.
- The current automation produces artifacts under `artifacts/radebe-cli/sea/<platform>-<arch>/`.
- The smoke test currently surfaces a Windows warning from the injected executable: `The signature seems corrupted!`. The executable still runs correctly; this is expected for an injected local copy of the signed Node binary before any release signing step.

## Verification
- Ran `npm run build` successfully.
- Ran `npm test` successfully, including the new SEA smoke test in `@radebe/scripts`.
- Ran `npm run typecheck` successfully outside the sandbox because of the known Windows sandbox `EPERM` issue.
- Ran `npm run smoke:cli:sea` successfully outside the sandbox; both the bundled entry and the generated executable printed `hello`.

## Follow-On Impact
- T-005 can now define the Unity bridge contract against a concrete artifact layout and command surface.
- M1 Gate B remains in progress, with the web authoring loop now the main remaining implementation item.
