/**
 * Public compiler stage facade. Keep implementation detail inside
 * `src/compiler/` so this package entry point stays stable for consumers.
 */
import { Compiler } from "./compiler/compiler.js";

import type { CompileResult, ParsedDocument } from "./types.js";

export function compileDocument(document: ParsedDocument): CompileResult {
  return new Compiler(document).compile();
}
