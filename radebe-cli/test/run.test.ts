import test from "node:test";
import assert from "node:assert/strict";

import { run } from "../src/index.js";

test("run returns zero and prints rendered rows for valid input", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  try {
    const exitCode = run([
      "node",
      "radebe",
      "sprite panel\n  size 4 3\n  background transparent\n\nplot 1 1 #ffffff\nline 0 0 3 0 #70c8e8"
    ]);

    assert.equal(exitCode, 0);
    assert.deepEqual(stdout, ["####\n.#..\n....\n"]);
    assert.deepEqual(stderr, []);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
});

test("run returns one and prints diagnostics for invalid commands", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  try {
    const exitCode = run(["node", "radebe", "plot 0 0 #fff"]);

    assert.equal(exitCode, 1);
    assert.deepEqual(stdout, ["\n"]);
    assert.deepEqual(stderr, [
      "compiler:1:1 Root draw commands require a sprite header before drawing commands.\ncompiler:1:1 A sprite header is required before root draw commands.\n"
    ]);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
});
