#!/usr/bin/env node

import { join } from "node:path";

import {
  deployCliPayload,
  deployUnityAssets,
  loadEnvFile,
  parseUnityDeployArgs,
  REPO_ROOT,
  validateUnityProject
} from "./unity-common.js";

function run(): number {
  loadEnvFile(join(REPO_ROOT, ".env"));

  const options = parseUnityDeployArgs(process.argv.slice(2));
  validateUnityProject(options.projectPath);

  const deployedAssetsPath = deployUnityAssets(
    options.projectPath,
    options.deploySubdir
  );
  console.log(`Deployed Radebe Unity assets to ${deployedAssetsPath}`);

  if (!options.skipCliPayload) {
    const deployedPayloadPath = deployCliPayload(
      options.projectPath,
      options.deploySubdir
    );
    console.log(`Deployed packaged radebe-cli payload to ${deployedPayloadPath}`);
  }

  return 0;
}

try {
  process.exitCode = run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`unity-deploy: ${message}`);
  process.exitCode = 1;
}
