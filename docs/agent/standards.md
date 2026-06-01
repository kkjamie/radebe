# Engineering Standards

Owner: `Main Thread`
Last updated: `2026-06-01`

## Scope and Change Discipline
- Execute only the scoped objective unless expansion is explicitly approved.
- Keep changes minimal and coherent.
- Preserve behavior outside touched scope unless task requires behavior change.

## Coding Standards
- Prefer clear, composable units over large multi-purpose blocks.
- Keep public interfaces stable unless change is intentional and documented.
- Add comments only where intent, contract, or non-obvious behavior needs help.
- Remove or task-link placeholders in touched scope.

## TypeScript Style
- Keep function parameters and return types explicit on exported functions, public package APIs, and module-boundary helpers.
- Add explicit local variable types when a function call returns a project/domain type and the variable name does not make the shape obvious, especially for parser, compiler, renderer, language-service, and preview pipeline results.
- Let inference stand for obvious primitives, literal constants, loop variables, short expression temporaries, and simple arrays or objects where an annotation would only repeat the initializer.
- Prefer the domain type over broad structural annotations. For example, use `CompileResult` rather than a hand-written object type for `compileDocument(...)`.
- Avoid repo-wide mechanical type churn. Apply these rules in touched code and in focused cleanup tasks where the surrounding context makes the intended type clear.

## Formatting Style
- Inline a function call when its arguments are short and the whole line remains readable.
- Do not force single-argument calls onto multiple lines unless the argument is itself multiline or complex.
- When a call needs wrapping because of length or complexity, put each argument on its own line so future edits are predictable.
- Add blank lines between distinct phases of a function, such as setup, validation, rendering, and return assembly.
- Keep tightly coupled statements together when a blank line would split one idea into fragments.
- Give multiline call sites enough breathing room when adjacent operations are unrelated or side-effecting.

## Comment And Documentation Tone
- Write comments and JSDoc as human-facing explanations of purpose, behavior, or contract.
- Prefer wording such as "Renders a compiled document into a rendered image" over architectural labels such as "Public renderer stage facade".
- Keep implementation-location notes short and secondary; the first sentence should say what the code does or why the API exists.

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
