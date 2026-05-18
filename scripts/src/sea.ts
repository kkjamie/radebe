import { spawn } from "node:child_process";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { build as buildBundle } from "esbuild";
import { inject } from "postject";

const SEA_RESOURCE_NAME = "NODE_SEA_BLOB";
const SEA_SENTINEL_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const DEFAULT_ARTIFACT_NAME = "radebe";
const DEFAULT_OUTPUT_ROOT = path.join("artifacts", "radebe-cli", "sea");

export interface SeaBuildOptions {
  artifactName?: string;
  nodeBinaryPath?: string;
  outputRootDir?: string;
  rootDir?: string;
}

export interface SeaArtifactManifest {
  artifactName: string;
  bundlePath: string;
  executablePath: string;
  generatedAt: string;
  mainFormat: "commonjs";
  manifestPath: string;
  nodeBinaryPath: string;
  nodeVersion: string;
  outputDir: string;
  seaConfigPath: string;
  seaPrepBlobPath: string;
  target: {
    arch: string;
    platform: NodeJS.Platform;
  };
}

export interface SeaSmokeResult {
  executable: ProcessResult;
  manifest: SeaArtifactManifest;
  bundledEntry: ProcessResult;
}

interface ProcessResult {
  code: number;
  stderr: string;
  stdout: string;
}

interface SeaPaths {
  bundlePath: string;
  executablePath: string;
  manifestPath: string;
  outputDir: string;
  seaConfigPath: string;
  seaPrepBlobPath: string;
}

const SMOKE_SOURCE = [
  "sprite sea-smoke",
  "  size 4 3",
  "  background transparent",
  "",
  "plot 1 1 #ffffff",
  "line 0 0 3 0 #70c8e8"
].join("\n");

function findRepoRoot(startDir = getCurrentDirectory()): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (
      existsSync(path.join(currentDir, "AGENTS.md")) &&
      existsSync(path.join(currentDir, "package.json"))
    ) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Unable to locate the workspace root from ${startDir}.`);
    }

    currentDir = parentDir;
  }
}

function getCurrentDirectory(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

function resolveBuildOptions(options: SeaBuildOptions = {}): Required<SeaBuildOptions> {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : findRepoRoot(process.cwd());
  const outputRootDir = path.resolve(rootDir, options.outputRootDir ?? DEFAULT_OUTPUT_ROOT);

  return {
    artifactName: options.artifactName ?? DEFAULT_ARTIFACT_NAME,
    nodeBinaryPath: path.resolve(options.nodeBinaryPath ?? process.execPath),
    outputRootDir,
    rootDir
  };
}

function getSeaPaths(options: Required<SeaBuildOptions>): SeaPaths {
  const outputDir = path.join(
    options.outputRootDir,
    `${process.platform}-${process.arch}`
  );
  const executableExtension = process.platform === "win32" ? ".exe" : "";
  const baseName = options.artifactName;

  return {
    bundlePath: path.join(outputDir, `${baseName}.bundle.cjs`),
    executablePath: path.join(outputDir, `${baseName}${executableExtension}`),
    manifestPath: path.join(outputDir, "artifact-manifest.json"),
    outputDir,
    seaConfigPath: path.join(outputDir, "sea-config.json"),
    seaPrepBlobPath: path.join(outputDir, `${baseName}.sea.blob`)
  };
}

function getCliEntrypoint(rootDir: string): string {
  return path.join(rootDir, "radebe-cli", "src", "index.ts");
}

function getCoreSourcePath(rootDir: string, subpath = "index"): string {
  return path.join(rootDir, "radebe-core", "src", `${subpath}.ts`);
}

function toManifest(
  options: Required<SeaBuildOptions>,
  seaPaths: SeaPaths
): SeaArtifactManifest {
  return {
    artifactName: options.artifactName,
    bundlePath: seaPaths.bundlePath,
    executablePath: seaPaths.executablePath,
    generatedAt: new Date().toISOString(),
    mainFormat: "commonjs",
    manifestPath: seaPaths.manifestPath,
    nodeBinaryPath: options.nodeBinaryPath,
    nodeVersion: process.version,
    outputDir: seaPaths.outputDir,
    seaConfigPath: seaPaths.seaConfigPath,
    seaPrepBlobPath: seaPaths.seaPrepBlobPath,
    target: {
      arch: process.arch,
      platform: process.platform
    }
  };
}

async function writeManifest(manifestPath: string, manifest: SeaArtifactManifest): Promise<void> {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function runProcess(
  executablePath: string,
  args: string[],
  cwd: string
): Promise<ProcessResult> {
  return await new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(executablePath, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stderr,
        stdout
      });
    });
  });
}

function createWorkspaceAliasPlugin(rootDir: string) {
  return {
    name: "radebe-workspace-alias",
    setup(build: {
      onResolve: (options: { filter: RegExp }, callback: (args: { path: string }) => { path: string }) => void;
    }) {
      build.onResolve({ filter: /^@radebe\/core(?:\/.+)?$/ }, (args) => {
        const subpath = args.path === "@radebe/core"
          ? "index"
          : args.path.slice("@radebe/core/".length);

        return {
          path: getCoreSourcePath(rootDir, subpath)
        };
      });
    }
  };
}

export async function bundleCliForSea(options: SeaBuildOptions = {}): Promise<SeaArtifactManifest> {
  const resolvedOptions = resolveBuildOptions(options);
  const seaPaths = getSeaPaths(resolvedOptions);

  await mkdir(seaPaths.outputDir, { recursive: true });

  await buildBundle({
    bundle: true,
    format: "cjs",
    stdin: {
      contents: [
        'import { run } from "./radebe-cli/src/index.ts";',
        "process.exit(run(process.argv));"
      ].join("\n"),
      resolveDir: resolvedOptions.rootDir,
      sourcefile: "sea-entry.ts"
    },
    legalComments: "none",
    logOverride: {
      "empty-import-meta": "silent"
    },
    outfile: seaPaths.bundlePath,
    platform: "node",
    plugins: [createWorkspaceAliasPlugin(resolvedOptions.rootDir)],
    sourcemap: false,
    target: "node20"
  });

  const seaConfig = {
    disableExperimentalSEAWarning: true,
    main: seaPaths.bundlePath,
    output: seaPaths.seaPrepBlobPath,
    useCodeCache: false,
    useSnapshot: false
  };

  await writeFile(seaPaths.seaConfigPath, `${JSON.stringify(seaConfig, null, 2)}\n`, "utf8");

  const manifest = toManifest(resolvedOptions, seaPaths);
  await writeManifest(seaPaths.manifestPath, manifest);

  return manifest;
}

export async function buildSeaArtifact(options: SeaBuildOptions = {}): Promise<SeaArtifactManifest> {
  const resolvedOptions = resolveBuildOptions(options);
  const manifest = await bundleCliForSea(resolvedOptions);

  await access(resolvedOptions.nodeBinaryPath, constants.R_OK);

  const seaConfigResult = await runProcess(
    resolvedOptions.nodeBinaryPath,
    ["--experimental-sea-config", manifest.seaConfigPath],
    resolvedOptions.rootDir
  );

  if (seaConfigResult.code !== 0) {
    throw new Error(
      `Failed to generate the SEA preparation blob.\n${seaConfigResult.stderr || seaConfigResult.stdout}`
    );
  }

  await copyFile(resolvedOptions.nodeBinaryPath, manifest.executablePath);

  const seaPrepBlob = await readFile(manifest.seaPrepBlobPath);

  await inject(manifest.executablePath, SEA_RESOURCE_NAME, seaPrepBlob, {
    machoSegmentName: "NODE_SEA",
    sentinelFuse: SEA_SENTINEL_FUSE
  });

  const updatedManifest = toManifest(resolvedOptions, getSeaPaths(resolvedOptions));
  await writeManifest(getSeaPaths(resolvedOptions).manifestPath, updatedManifest);

  return updatedManifest;
}

export async function smokeTestSeaArtifact(options: SeaBuildOptions = {}): Promise<SeaSmokeResult> {
  const manifest = await buildSeaArtifact(options);
  const cwd = resolveBuildOptions(options).rootDir;

  const bundledEntry = await runProcess(process.execPath, [manifest.bundlePath, SMOKE_SOURCE], cwd);
  if (bundledEntry.code !== 0) {
    throw new Error(`Bundled SEA entry smoke test failed.\n${bundledEntry.stderr || bundledEntry.stdout}`);
  }

  const executable = await runProcess(manifest.executablePath, [SMOKE_SOURCE], cwd);
  if (executable.code !== 0) {
    throw new Error(`SEA executable smoke test failed.\n${executable.stderr || executable.stdout}`);
  }

  return {
    executable,
    manifest,
    bundledEntry
  };
}

function parseCommandLine(argv: string[]): {
  command: string;
  options: SeaBuildOptions;
} {
  let command = "build";
  const options: SeaBuildOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--") && index === 0) {
      command = token;
      continue;
    }

    const value = argv[index + 1];
    switch (token) {
      case "--artifact-name":
        options.artifactName = value;
        index += 1;
        break;
      case "--node-binary":
        options.nodeBinaryPath = value;
        index += 1;
        break;
      case "--output-root":
        options.outputRootDir = value;
        index += 1;
        break;
      case "--root":
        options.rootDir = value;
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return {
    command,
    options
  };
}

function printUsage(): void {
  process.stdout.write(
    [
      "Usage: node ./scripts/dist/src/sea.js <bundle|build|smoke> [options]",
      "",
      "Options:",
      "  --artifact-name <name>  Override the output executable base name.",
      "  --node-binary <path>    Use a specific Node binary for blob generation and executable copy.",
      "  --output-root <path>    Override the artifact root directory.",
      "  --root <path>           Override the repository root."
    ].join("\n")
  );
  process.stdout.write("\n");
}

async function main(argv: string[]): Promise<number> {
  try {
    const { command, options } = parseCommandLine(argv);

    switch (command) {
      case "bundle": {
        const manifest = await bundleCliForSea(options);
        process.stdout.write(`Bundled CLI entry: ${manifest.bundlePath}\n`);
        return 0;
      }
      case "build": {
        const manifest = await buildSeaArtifact(options);
        process.stdout.write(`SEA executable: ${manifest.executablePath}\n`);
        return 0;
      }
      case "smoke": {
        const result = await smokeTestSeaArtifact(options);
        process.stdout.write(`Bundled entry stdout: ${JSON.stringify(result.bundledEntry.stdout)}\n`);
        process.stdout.write(`SEA executable stdout: ${JSON.stringify(result.executable.stdout)}\n`);
        process.stdout.write(`SEA executable: ${result.manifest.executablePath}\n`);
        return 0;
      }
      case "--help":
      case "-h":
      case "help":
        printUsage();
        return 0;
      default:
        printUsage();
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
