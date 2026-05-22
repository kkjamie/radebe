# Session Log: Inline Comments Roadmap

Date: `2026-05-22`
Thread: `codex-main`
Task: `T-091`
Milestone/Gate: `M2 / Deferred`

## Scope Completed
- Added a backlog task for inline comments after source commands.
- Added a public Roadmap card under Language Expressiveness.
- Recorded the candidate delimiter direction: a standalone `#` token starts the inline comment so hex color tokens remain valid.

## Files Changed
- `docs/project/task-board.md`: added T-091 to the backlog.
- `docs/project/roadmap.md`: added inline comments to the future language/effects backlog summary.
- `docs/project/main-thread-state.md`: recorded T-091 and added it to suggested next language tasks.
- `radebe-web/src/pages/roadmap.tsx`: added the Inline comments public roadmap card.

## Behavioral Impact
- No parser behavior changed yet.
- The public roadmap now advertises inline command comments as a planned language ergonomics feature.

## Tests / Verification
- Ran `npm run build`: passed. Vite still reports the existing CodeMirror-heavy chunk-size warning.

## Remaining Work
- Implement parser stripping for inline comments.
- Update syntax highlighting, CodeMirror decorations, color-token detection, language service context, VS Code grammar, and docs/tests once implementation starts.

## Risks / Blockers
- Inline comments must not treat hex color tokens such as `#70c8e8` as comment starts.
- The exact delimiter rule should be finalized during implementation, with standalone `#` as the current candidate.

## Exact Next 3 Steps
1. Add parser tests for `cut 4 # comment` and color-bearing lines such as `stroke 2 #70c8e8 # comment`.
2. Implement shared source tokenization/comment stripping so parser, highlighter, color service, web editor, and VS Code behavior stay aligned.
3. Update Syntax/docs examples once the language actually supports inline comments.

## Paste-Ready Next Thread Prompt
```md
You are working in worker thread `<task-id>`.

Objective:
- Implement T-091 inline comments after source commands.

Current state:
- The parser currently supports only full-line comments whose trimmed line starts with `#`.
- T-091 is in the backlog and the public Roadmap has an Inline comments card.
- The candidate rule is that a standalone `#` token starts an inline comment, preserving hex color tokens like `#70c8e8`.

Done criteria:
- Parser accepts examples like `cut 4 # chamfer each corner`.
- Color tokens such as `#70c8e8` still parse and highlight correctly, including lines with a later inline comment.
- Web static highlighter, CodeMirror decorations, color token extraction, language service cursor behavior, VS Code grammar/help, docs, and tests are updated as needed.
- Update task-board, roadmap if affected, decisions if needed, session-log, and main-thread-state.
```

This is a good handoff point. Start a new worker thread.
