# Session Log: T-003 CLI Packaging Evaluation

Date: `2026-05-17`
Thread: `t-003-cli-packaging-evaluation`

## Scope
- Evaluate standalone executable packaging options for `radebe-cli`.
- Compare the options against the current npm workspace, TypeScript project references, and staged `radebe-core` API.
- Recommend one path that preserves Unity consuming `radebe-cli` rather than a separate runtime port.

## Work Completed
- Reviewed the current workspace shape: `radebe-cli` is a Node ESM package that depends only on `@radebe/core`, both packages emit plain TypeScript build output, and the repo standardizes on npm workspaces plus TypeScript project references.
- Compared Node SEA, `pkg`, `nexe`, and Bun against that shape and the Unity executable requirement.
- Chose Node SEA as the recommended standalone packaging path.
- Updated the product spec, codebase map, decision log, roadmap, milestone state, task board, and main-thread state to reflect the accepted packaging direction and follow-on tasks.

## Option Comparison
- Node SEA: Best fit. It keeps the repo on the existing Node/npm stack, treats the executable as a release artifact rather than a new runtime, and aligns well with the current `radebe-cli` plus `@radebe/core` boundary once a bundle step produces one entry script.
- `pkg`: Possible in principle, but it adds dependency on a separate packager with a weaker long-term maintenance story than the built-in Node path and would still need careful handling for ESM/output shape.
- `nexe`: Similar downside to `pkg`, with extra risk around modern Node compatibility and custom executable maintenance burden.
- Bun compile: Attractive for single-file distribution, but it would introduce a second primary runtime into a repo that already chose Node/npm for builds, tests, and package behavior, which increases drift risk for the canonical CLI path.

## Recommendation
- Keep `radebe-cli` as a normal workspace package for development and testing.
- Add a release-time bundling step that resolves `radebe-cli` and `@radebe/core` into one executable entry script.
- Generate per-platform standalone artifacts with Node SEA from a pinned Node LTS binary.
- Put the packaging automation in `scripts/` and add smoke tests that execute the produced artifact on supported release targets.

## Repo Implications
- T-006 should implement the bundling plus SEA pipeline and artifact smoke tests.
- T-005 can now define the Unity bridge contract around a known executable artifact shape instead of a generic "packaged CLI" placeholder.
- No roadmap priority change is needed; the evaluation resolved an open decision without creating a blocker.

## Verification
- No code or runtime behavior changed in this thread; verification was limited to doc consistency and workspace/package-graph review.

## Next Recommendation
- Start with T-006 to implement the Node SEA packaging pipeline, or T-004 if the immediate priority is the first browser authoring loop.
