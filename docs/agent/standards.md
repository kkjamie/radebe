# Engineering Standards

Owner: `TBD`
Last updated: `YYYY-MM-DD`

## Scope and Change Discipline
- Execute only the scoped objective unless expansion is explicitly approved.
- Keep changes minimal and coherent.
- Preserve behavior outside touched scope unless task requires behavior change.

## Coding Standards
- Prefer clear, composable units over large multi-purpose blocks.
- Keep public interfaces stable unless change is intentional and documented.
- Add comments only where intent is not obvious.
- Remove or task-link placeholders in touched scope.

## Testing and Verification
- Validate touched behavior with the closest practical checks.
- Add regression coverage for bug fixes where seams exist.
- If verification is skipped, record what and why in handoff.

## Documentation Standards
- Keep one canonical source per concern as defined in `docs/agent/source-of-truth.md`.
- Record active task status only in `docs/project/task-board.md` and milestone files.
- Record meaningful decisions in `docs/project/decisions.md`.

## Commit Standards
- Default to commit at coherent checkpoints when uncertainty is low.
- Ask for confirmation before committing when uncertainty is material.
- Prefer one coherent task-sized commit.
