#!/usr/bin/env node

import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type DeployOptions = {
  projectPath: string;
  deploySubdir: string;
  skipCliPayload: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");
const DEFAULT_DEPLOY_SUBDIR = "Assets/Radebe";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(args: string[]): DeployOptions {
  let projectPath = process.env.RADEBE_UNITY_PROJECT_PATH ?? "";
  let deploySubdir =
    process.env.RADEBE_UNITY_DEPLOY_SUBDIR ?? DEFAULT_DEPLOY_SUBDIR;
  let skipCliPayload = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    if (arg === "--project") {
      projectPath = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg.startsWith("--project=")) {
      projectPath = arg.slice("--project=".length);
      continue;
    }

    if (arg === "--deploy-subdir") {
      deploySubdir = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg.startsWith("--deploy-subdir=")) {
      deploySubdir = arg.slice("--deploy-subdir=".length);
      continue;
    }

    if (arg === "--skip-cli-payload") {
      skipCliPayload = true;
      continue;
    }

    throw new Error(`Unknown deploy option "${arg}".`);
  }

  if (projectPath.trim() === "") {
    throw new Error(
      "Unity project path is required. Set RADEBE_UNITY_PROJECT_PATH in .env or pass --project <path>."
    );
  }

  if (deploySubdir.trim() === "") {
    throw new Error("Unity deploy subdirectory must not be empty.");
  }

  if (isAbsolute(deploySubdir)) {
    throw new Error("Unity deploy subdirectory must be relative to the Unity project root.");
  }

  return {
    projectPath: resolve(projectPath),
    deploySubdir,
    skipCliPayload
  };
}

function ensureDirectory(path: string, label: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`${label} does not exist or is not a directory: ${path}`);
  }
}

function ensureInside(parent: string, child: string, label: string): void {
  const relativePath = relative(parent, child);

  if (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !isAbsolute(relativePath))
  ) {
    return;
  }

  throw new Error(`${label} must stay inside ${parent}. Resolved path: ${child}`);
}

function validateUnityProject(projectPath: string): void {
  ensureDirectory(projectPath, "Unity project");
  ensureDirectory(join(projectPath, "Assets"), "Unity Assets folder");

  const projectVersionPath = join(projectPath, "ProjectSettings", "ProjectVersion.txt");
  if (!existsSync(projectVersionPath)) {
    throw new Error(`Unity ProjectVersion.txt was not found at ${projectVersionPath}`);
  }
}

function copyFreshDirectory(source: string, destination: string): void {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}

function deployUnityAssets(projectPath: string, deploySubdir: string): string {
  const sourceAssets = join(REPO_ROOT, "radebe-unity", "Assets");
  const destination = resolve(projectPath, deploySubdir);
  const assetsRoot = resolve(projectPath, "Assets");

  ensureInside(assetsRoot, destination, "Unity plugin deploy directory");
  copyFreshDirectory(sourceAssets, destination);
  copyFileSync(
    join(REPO_ROOT, "radebe-unity", "bridge.manifest.json"),
    join(destination, "bridge.manifest.json")
  );

  return destination;
}

function deployCliPayload(projectPath: string): string {
  const platformKey = `${process.platform}-${process.arch}`;
  const source = join(REPO_ROOT, "artifacts", "radebe-cli", "sea", platformKey);
  const destination = join(
    projectPath,
    "Assets",
    "StreamingAssets",
    "Radebe",
    "radebe-cli",
    platformKey
  );
  const streamingAssetsRoot = resolve(projectPath, "Assets", "StreamingAssets");

  ensureDirectory(
    source,
    `Packaged radebe-cli payload for ${platformKey}. Run npm run package:cli:sea first`
  );
  ensureInside(streamingAssetsRoot, resolve(destination), "CLI payload deploy directory");
  copyFreshDirectory(source, destination);

  return destination;
}

function run(): number {
  loadEnvFile(join(REPO_ROOT, ".env"));

  const options = parseArgs(process.argv.slice(2));
  validateUnityProject(options.projectPath);

  const deployedAssetsPath = deployUnityAssets(
    options.projectPath,
    options.deploySubdir
  );
  console.log(`Deployed Radebe Unity assets to ${deployedAssetsPath}`);

  if (!options.skipCliPayload) {
    const deployedPayloadPath = deployCliPayload(options.projectPath);
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
