# 2026-05-22 Try It Editor Perf

## Scope
- Investigated poor typing performance in the web Try it CodeMirror source panel.
- Moved expensive preview, diagnostics, and assist work out of the immediate typing transaction path.

## Changes
- `radebe-web/src/playground.tsx` now debounces preview/diagnostic rendering after edits instead of running `renderSource()` synchronously on every document change.
- Diagnostic squiggles now come from a CodeMirror state field updated by the debounced preview render result, removing the previous second `renderSource()` call from the diagnostic highlighter.
- Assist/completion recomputation now has a short debounce after document changes, while focus, cursor navigation, and explicit completion requests still update directly.

## Validation
- `npm run build -w @radebe/web` passes.
- The running dev server at `http://127.0.0.1:5173/src/playground.tsx` serves the updated module with HTTP 200.

## Notes
- The preview intentionally catches up shortly after typing pauses; source text entry should feel much less blocked.
- No milestone or priority changed.
