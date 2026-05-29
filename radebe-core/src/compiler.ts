/**
 * Public compiler stage facade.
 *
 * The full source pipeline is:
 * 1. `parseSource` normalizes text, tokenizes non-comment lines by whitespace,
 *    and builds an indentation-based command syntax tree.
 * 2. `compileDocument` validates that tree against the schema, resolves
 *    file-scoped variables, compiles the sprite header, and lowers author
 *    commands into plain compiled draw instructions.
 * 3. `renderDocument` consumes those instructions and rasterizes the sprite.
 *
 * Keep this root file as the package entry point for the compiler stage. The
 * `Compiler` owner and command-owned modules under `src/compiler/` hold the
 * implementation details.
 */
import { Compiler } from "./compiler/compiler.js";

import type { CompileResult, ParsedDocument } from "./types.js";

export function compileDocument(document: ParsedDocument): CompileResult {
  return new Compiler(document).compile();
}
