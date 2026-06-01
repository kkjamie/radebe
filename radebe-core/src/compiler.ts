/**
 * Exposes the compiler API that turns parsed command trees into render-ready
 * documents, while the implementation stays inside `src/compiler/`.
 */
import { Compiler } from "./compiler/compiler.js";

import type { CompileResult, ParsedDocument } from "./types.js";

export function compileDocument(document: ParsedDocument): CompileResult {
  return new Compiler(document).compile();
}
