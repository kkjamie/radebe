import test from "node:test";
import assert from "node:assert/strict";

import { run } from "../src/index.js";

test("run returns zero for the scaffold path", () => {
  assert.equal(run(["node", "radebe", "hello"]), 0);
});
