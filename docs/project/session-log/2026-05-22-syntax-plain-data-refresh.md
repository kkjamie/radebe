# 2026-05-22 Syntax Plain Data Refresh

## Scope
- Investigated the web page infinite-loading report after recent Syntax guide edits.
- Reduced likely Preact refresh/runtime instability by removing JSX fragments from top-level Syntax guide data.

## Changes
- `radebe-web/src/pages/syntax.tsx` now stores guide body copy as plain text/code-part arrays and vocabulary details as command arrays plus plain detail strings.
- Added local `InlineText` and `CommandList` render helpers so the page still renders inline code and readable command lists without embedding JSX in static data.
- Recorded task-board and main-thread-state handoff notes as T-098.

## Validation
- `npm run build -w @radebe/web` passes.
- Fresh Vite dev server served the app, Vite client, `main.tsx`, `syntax.tsx`, and Preact dependency with HTTP 200 responses.
- Existing `5173` dev server and temporary `5174` dev server both served the updated Syntax module after the change.

## Notes
- Port `5173` was already occupied by a separate dev-server process, so the temporary verification server started on `5174`.
- No milestone or priority changed.
