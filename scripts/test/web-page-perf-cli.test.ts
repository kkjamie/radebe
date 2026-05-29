import assert from "node:assert/strict";
import test from "node:test";

import { parseCommandLine } from "../src/web-page-perf/cli.js";

test("parseCommandLine returns default web page perf options", () => {
  assert.deepEqual(parseCommandLine([]), {
    port: 4173,
    virtualTimeBudgetMs: 12000
  });
});

test("parseCommandLine accepts strict integer web page perf options", () => {
  assert.deepEqual(
    parseCommandLine(["--port", "4192", "--virtual-time-budget", "90000"]),
    {
      port: 4192,
      virtualTimeBudgetMs: 90000
    }
  );
});

test("parseCommandLine rejects malformed numeric web page perf options", () => {
  assert.throws(
    () => parseCommandLine(["--port", "12abc"]),
    /--port must be a base-10 integer/
  );
  assert.throws(
    () => parseCommandLine(["--port", "0"]),
    /--port must be at least 1/
  );
  assert.throws(
    () => parseCommandLine(["--port"]),
    /Missing value for --port/
  );
  assert.throws(
    () => parseCommandLine(["--virtual-time-budget", "1.5"]),
    /--virtual-time-budget must be a base-10 integer/
  );
});
