# Session Log: Milestone Replan

- Date: `2026-05-26`
- Thread: `codex-main`
- Scope: Reorganize the remaining backlog into clearer milestones so M2 becomes a short website/release closeout, M3 owns rendering expansion, and M4 owns Unity/editor follow-on work.

## What Changed
- Updated `docs/project/roadmap.md` to split the remaining plan into M2, M3, and M4 with explicit milestone docs for the new M3 and M4 phases.
- Updated `docs/project/milestones/M2-scale-and-optimization.md` so historical gates A-C stay passed while a new Gate D captures the remaining website/release closeout work.
- Added `docs/project/milestones/M3-rendering-expansion.md` and `docs/project/milestones/M4-unity-and-editor-integration.md`.
- Reassigned backlog tasks in `docs/project/task-board.md` so rendering/language work moves to M3, Unity/editor work moves to M4, and the remaining closeout tasks sit in M2.
- Added T-125 for the final public website QA/polish pass and T-126 for external artifact hosting plus release-path completion.
- Logged DEC-066 to record the milestone split decision and updated `docs/project/main-thread-state.md` to reflect the new active gate and best next tasks.

## Why
- The previous backlog kept extending M2 even though the remaining work had split into three different kinds of effort: near-term public-site/release closeout, larger rendering/language expansion, and deliberately postponed Unity/editor integration.
- Splitting those tracks makes the next execution queue smaller and clearer without losing the historical evidence already captured under the earlier M2 gates.

## Follow-Up
- The next worker thread should stay inside M2 Gate D unless priorities change.
- The highest-signal next tasks are T-125, T-126, and T-074 in that order.
