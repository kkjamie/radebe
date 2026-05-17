# Worker Thread Handoff Template

Use this at the end of every worker thread.

## Scope Completed
- <what objective was completed>

## Files Changed
- `<path>`: <what changed>

## Behavior Impact
- <runtime or user-facing impact>

## Tests / Verification
- Ran: <test/check and result>
- Not run: <what and why>

## Remaining Work
- <what is left>

## Risks / Blockers
- <risk or blocker>

## Next 3 Steps
1. <step>
2. <step>
3. <step>

## Commit Status
- Status: `committed` | `not committed`
- Commit: `<hash or N/A>`
- Notes: <why committed now, or why deferred>

## Docs Updated
- `docs/project/task-board.md`: <yes/no and summary>
- `docs/project/roadmap.md`: <yes/no and summary>
- `docs/project/milestones/<active>.md`: <yes/no and gate status change>
- `docs/project/decisions.md`: <yes/no and summary>
- `docs/project/session-log/<file>.md`: <yes/no and summary>
- `docs/project/main-thread-state.md`: <yes/no and summary>

## Main Thread Resume Prompt
```md
Main thread sync.

Review:
- docs/project/main-thread-state.md
- docs/project/session-log/<worker-log>.md
- docs/project/task-board.md
- docs/project/roadmap.md
- docs/project/milestones/<active>.md
- docs/project/decisions.md (if updated)

Please:
1) Confirm state consistency
2) Decide whether to close or advance the current gate
3) Suggest the next worker thread (single best option)
4) Provide the next worker prompt
```

## Next Thread Prompt
```md
Objective:
- <single scoped objective>

Done criteria:
- <testable outcomes>

Context to read:
1) AGENTS.md
2) docs/project/task-board.md (item: <id>)
3) docs/project/roadmap.md (milestone: <name>)
4) docs/agent/standards.md
5) docs/project/codebase-map.md (relevant section)
6) docs/project/session-log/<most relevant>.md
```

If checkpoint reached, include exact sentence:
- `This is a good handoff point. Start a new worker thread.`
