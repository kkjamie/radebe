import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

import { smokeTestSeaArtifact } from "../src/sea.js";

test("smokeTestSeaArtifact builds a runnable SEA executable", async (context) => {
  const outputRootDir = await mkdtemp(path.join(os.tmpdir(), "radebe-sea-test-"));

  context.after(async () => {
    await rm(outputRootDir, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 200
    });
  });

  const result = await smokeTestSeaArtifact({
    outputRootDir
  });

  assert.equal(result.bundledEntry.code, 0);
  assert.equal(result.executable.code, 0);
  assert.equal(result.bundledEntry.stdout, "hello\n");
  assert.equal(result.executable.stdout, "hello\n");

  const executableStats = await stat(result.manifest.executablePath);
  assert.ok(executableStats.isFile());

  const manifest = JSON.parse(
    await readFile(result.manifest.manifestPath, "utf8")
  ) as {
    mainFormat: string;
    target: {
      arch: string;
      platform: string;
    };
  };

  assert.equal(manifest.mainFormat, "commonjs");
  assert.equal(manifest.target.platform, process.platform);
  assert.equal(manifest.target.arch, process.arch);
});
