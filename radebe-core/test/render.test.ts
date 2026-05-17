import test from "node:test";
import assert from "node:assert/strict";

import { renderDocument } from "../src/index.js";

test("renderDocument returns the source unchanged in the scaffold", () => {
  const result = renderDocument({ source: "hello" });

  assert.equal(result.output, "hello");
  assert.deepEqual(result.diagnostics, []);
});
