# Styleguide

Owner: `Main Thread`
Last updated: `2026-06-01`

Radebe is a TypeScript-first workspace. The canonical engineering style rules
live in `docs/agent/standards.md`; this file records the repo-specific entry
points and expectations that support those rules.

## TypeScript Conventions
- Use the explicit-type, function-call formatting, blank-line, and comment tone rules from `docs/agent/standards.md`.
- Prefer existing package boundaries and local helper APIs before introducing new abstractions.
- Keep public package facades such as `parseSource`, `compileDocument`, `renderDocument`, and `renderSource` small and consumer-oriented.

## File And Module Organization
- Keep public entry files as stable facades when practical, with implementation details in focused submodules.
- Split growing files by real responsibility, not by one-function mechanical extraction.
- Keep renderer hot paths allocation-light and numeric/array-oriented.

## Testing Baseline
- Validate touched behavior with the closest package-level build or test.
- For docs-only standards changes, `git diff --check` is enough unless code also changed.
