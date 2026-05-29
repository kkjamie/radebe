# 2026-05-29 T-146 Web Page Perf Tooling Split

## Scope Completed
- Completed T-146 for M3 Gate C by reducing `scripts/src/web-page-perf.ts` to the executable performance diagnostics entrypoint.
- Split shared performance report types, repo/path helpers, static site serving and progress capture, browser/WebSocket probing, metrics reduction, report writing, and CLI orchestration into focused modules under `scripts/src/web-page-perf/`.
- Added strict numeric command-line validation for `--port` and `--virtual-time-budget`, including missing-value, malformed-integer, unsafe-integer, out-of-range port, and stray positional argument rejection.
- Added focused script test coverage for the parser defaults, valid integer overrides, and malformed numeric options.
- Advanced M3 from Gate C to Gate D and seeded T-150 as the refactor consolidation task before M4 GitHub migration.

## Files Changed
- `scripts/src/web-page-perf.ts`
- `scripts/src/web-page-perf/types.ts`
- `scripts/src/web-page-perf/paths.ts`
- `scripts/src/web-page-perf/static-server.ts`
- `scripts/src/web-page-perf/browser-probe.ts`
- `scripts/src/web-page-perf/metrics.ts`
- `scripts/src/web-page-perf/report-writer.ts`
- `scripts/src/web-page-perf/cli.ts`
- `scripts/test/web-page-perf-cli.test.ts`
- `docs/project/task-board.md`
- `docs/project/roadmap.md`
- `docs/project/milestones/M3-refactoring-stabilization.md`
- `docs/project/main-thread-state.md`
- `docs/project/codebase-map.md`
- `docs/project/technical-debt-register.md`
- `docs/project/session-log/2026-05-29-t146-web-page-perf-tooling-split.md`

## Behavioral Impact
- Existing performance diagnostics entry command remains `node scripts/dist/src/web-page-perf.js` and root `npm run diagnose:web:pages` still points at that compiled entrypoint.
- Valid CLI usage keeps the same defaults and option names.
- Invalid numeric CLI values now fail early with explicit errors instead of being partially accepted by `parseInt`.
- No intentional browser sweep or report-format behavior change.

## Verification
- `npm --prefix scripts run build`
- `node --test scripts/dist/test/web-page-perf-cli.test.js`
- `npm --prefix scripts run test`
- `node scripts/dist/src/web-page-perf.js --help`
- `node scripts/dist/src/web-page-perf.js --port 12abc`
- `npm run build`
- `git diff --check`
- The scripts test suite still prints the existing SEA smoke warning `The signature seems corrupted!` while passing.
- A full browser route sweep was not run for this refactor slice; the closest practical smoke covered the compiled CLI surface and parser validation.

## Remaining Work
- T-150 should run M3 Gate D consolidation: review all completed refactor evidence, verify the final safety net, close or re-scope remaining refactor debt, and prepare the M4 GitHub migration handoff.

## Risks Or Blockers
- No known blocker.
- The browser/WebSocket helper code was preserved in the browser-probe module for continuity even though the current suite mostly relies on the app-posted perf report path.

## Exact Next 3 Steps
1. Start T-150 and review M3 Gate D pass criteria against completed Gate A, Gate B, and Gate C evidence.
2. Run the final agreed build/test safety net and close or re-scope open refactor debt such as remaining renderer/shared architecture debt.
3. If Gate D passes, move to M4 Gate A and start T-135 for the GitHub source, Pages, Actions, Releases, and release-binary hosting migration.

## Paste-Ready Prompt For Next Thread
Continue M3 Gate D with T-150. Read `docs/project/README.md`, `docs/project/task-board.md`, `docs/project/roadmap.md`, `docs/project/decisions.md`, `docs/agent/source-of-truth.md`, `docs/project/milestones/M3-refactoring-stabilization.md`, the latest `docs/project/session-log/*.md`, and `docs/project/main-thread-state.md`. T-146 is complete: `scripts/src/web-page-perf.ts` is now the CLI entrypoint, with static-server, browser/WebSocket probe, metrics, report writer, path, type, and CLI modules under `scripts/src/web-page-perf/`, plus focused strict numeric parser tests. Review completed M3 refactors, verify the final safety net, close or re-scope remaining refactor debt, and prepare the M4 GitHub migration handoff.

This is a good handoff point. Start a new worker thread.
