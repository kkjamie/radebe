#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { DEFAULT_DEPLOY_SUBDIR, ensureDirectory, REPO_ROOT } from "./unity-common.js";

type VirtualAsset = {
  assetPath: string;
  contents?: Buffer;
  isFolder: boolean;
  metaContents: Buffer;
};

type CliArgs = {
  outputPath: string;
};

const DEFAULT_OUTPUT_PATH = "Temp/radebe-unity-plugin-0.1.0.unitypackage";
const FolderMetaPrefix = "folder";
const FileMetaPrefix = "file";
const UnitySourceRoot = join(REPO_ROOT, "radebe-unity");
const UnityAssetsSourceRoot = join(UnitySourceRoot, "Assets");
const UnityPackageRootMetaSource = join(UnitySourceRoot, "PackageRoot");

function parseArgs(args: string[]): CliArgs {
  let outputPath = DEFAULT_OUTPUT_PATH;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    if (arg === "--output") {
      outputPath = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      outputPath = arg.slice("--output=".length);
      continue;
    }

    throw new Error(`Unknown native unitypackage option "${arg}".`);
  }

  if (outputPath.trim() === "") {
    throw new Error("Unity package output path must not be empty.");
  }

  return {
    outputPath: resolve(REPO_ROOT, outputPath)
  };
}

function createGuid(seed: string): string {
  return createHash("md5").update(seed).digest("hex");
}

function normalizeAssetPath(assetPath: string): string {
  return assetPath.replace(/\\/g, "/");
}

function createFolderMeta(assetPath: string): Buffer {
  const guid = createGuid(`${FolderMetaPrefix}:${assetPath}`);
  return Buffer.from(
    [
      "fileFormatVersion: 2",
      `guid: ${guid}`,
      "folderAsset: yes",
      "DefaultImporter:",
      "  externalObjects: {}",
      "  userData: ",
      "  assetBundleName: ",
      "  assetBundleVariant: ",
      ""
    ].join("\n"),
    "utf8"
  );
}

function createFileMeta(assetPath: string): Buffer {
  const guid = createGuid(`${FileMetaPrefix}:${assetPath}`);
  return Buffer.from(
    [
      "fileFormatVersion: 2",
      `guid: ${guid}`,
      "DefaultImporter:",
      "  externalObjects: {}",
      "  userData: ",
      "  assetBundleName: ",
      "  assetBundleVariant: ",
      ""
    ].join("\n"),
    "utf8"
  );
}

function getRepoMetaPath(assetPath: string): string | null {
  const pluginAssetRoot = normalizeAssetPath(DEFAULT_DEPLOY_SUBDIR);
  if (assetPath === pluginAssetRoot) {
    return join(UnitySourceRoot, "PackageRoot.meta");
  }

  const relativePath = assetPath.startsWith(`${pluginAssetRoot}/`)
    ? assetPath.slice(pluginAssetRoot.length + 1)
    : null;
  if (!relativePath) {
    return null;
  }

  if (relativePath === "bridge.manifest.json" || relativePath.startsWith("Tools/")) {
    return join(UnityPackageRootMetaSource, `${relativePath}.meta`);
  }

  if (relativePath === "Editor" || relativePath.startsWith("Editor/")) {
    return join(UnityAssetsSourceRoot, `${relativePath}.meta`);
  }

  return null;
}

function getMetaContents(assetPath: string, isFolder: boolean): Buffer {
  const repoMetaPath = getRepoMetaPath(assetPath);
  if (repoMetaPath && existsSync(repoMetaPath)) {
    return readFileSync(repoMetaPath);
  }

  return isFolder ? createFolderMeta(assetPath) : createFileMeta(assetPath);
}

function walkDirectory(directoryPath: string): string[] {
  const pending = [directoryPath];
  const results: string[] = [];

  while (pending.length > 0) {
    const current = pending.pop()!;
    results.push(current);

    if (!statSync(current).isDirectory()) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name)
    );
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index]!;
      pending.push(join(current, entry.name));
    }
  }

  return results;
}

function collectPluginAssets(): VirtualAsset[] {
  const assetsSourceRoot = UnityAssetsSourceRoot;
  const pluginAssetRoot = normalizeAssetPath(DEFAULT_DEPLOY_SUBDIR);
  const virtualAssets: VirtualAsset[] = [];

  ensureDirectory(assetsSourceRoot, "Radebe Unity assets source");

  virtualAssets.push({
    assetPath: pluginAssetRoot,
    isFolder: true,
    metaContents: getMetaContents(pluginAssetRoot, true)
  });

  for (const currentPath of walkDirectory(assetsSourceRoot)) {
    const relativePath = relative(assetsSourceRoot, currentPath);
    if (relativePath === "") {
      continue;
    }

    if (relativePath.endsWith(".meta")) {
      continue;
    }

    const assetPath = normalizeAssetPath(join(pluginAssetRoot, relativePath));
    const stat = statSync(currentPath);

    if (stat.isDirectory()) {
      virtualAssets.push({
        assetPath,
        isFolder: true,
        metaContents: getMetaContents(assetPath, true)
      });
      continue;
    }

    virtualAssets.push({
      assetPath,
      contents: readFileSync(currentPath),
      isFolder: false,
      metaContents: getMetaContents(assetPath, false)
    });
  }

  const bridgeManifestPath = join(UnitySourceRoot, "bridge.manifest.json");
  virtualAssets.push({
    assetPath: normalizeAssetPath(join(pluginAssetRoot, "bridge.manifest.json")),
    contents: readFileSync(bridgeManifestPath),
    isFolder: false,
    metaContents: getMetaContents(
      normalizeAssetPath(join(pluginAssetRoot, "bridge.manifest.json")),
      false
    )
  });

  return virtualAssets;
}

function collectCliPayloadAssets(): VirtualAsset[] {
  const platformKey = `${process.platform}-${process.arch}`;
  const payloadSourceRoot = join(
    REPO_ROOT,
    "artifacts",
    "radebe-cli",
    "sea",
    platformKey
  );
  const payloadAssetRoot = normalizeAssetPath(
    join(DEFAULT_DEPLOY_SUBDIR, "Tools", "radebe-cli", platformKey)
  );
  const virtualAssets: VirtualAsset[] = [];

  ensureDirectory(
    payloadSourceRoot,
    `Packaged radebe-cli payload for ${platformKey}. Run npm run package:cli:sea first`
  );

  const folderPaths = [
    normalizeAssetPath(join(DEFAULT_DEPLOY_SUBDIR, "Tools")),
    normalizeAssetPath(join(DEFAULT_DEPLOY_SUBDIR, "Tools", "radebe-cli")),
    payloadAssetRoot
  ];

  for (const folderPath of folderPaths) {
    virtualAssets.push({
      assetPath: folderPath,
      isFolder: true,
      metaContents: getMetaContents(folderPath, true)
    });
  }

  for (const currentPath of walkDirectory(payloadSourceRoot)) {
    const relativePath = relative(payloadSourceRoot, currentPath);
    if (relativePath === "") {
      continue;
    }

    if (relativePath.endsWith(".meta")) {
      continue;
    }

    const assetPath = normalizeAssetPath(join(payloadAssetRoot, relativePath));
    const stat = statSync(currentPath);

    if (stat.isDirectory()) {
      virtualAssets.push({
        assetPath,
        isFolder: true,
        metaContents: getMetaContents(assetPath, true)
      });
      continue;
    }

    virtualAssets.push({
      assetPath,
      contents: readFileSync(currentPath),
      isFolder: false,
      metaContents: getMetaContents(assetPath, false)
    });
  }

  return virtualAssets;
}

function uniqueAssets(assets: VirtualAsset[]): VirtualAsset[] {
  const deduped = new Map<string, VirtualAsset>();
  for (const asset of assets) {
    deduped.set(asset.assetPath, asset);
  }

  return [...deduped.values()].sort((left, right) =>
    left.assetPath.localeCompare(right.assetPath)
  );
}

function tarOctal(value: number, width: number): string {
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function tarString(value: string, width: number): Buffer {
  const buffer = Buffer.alloc(width, 0);
  Buffer.from(value, "utf8").copy(buffer, 0, 0, Math.min(Buffer.byteLength(value), width));
  return buffer;
}

function createTarHeader(name: string, size: number, mode: number, typeflag: string): Buffer {
  const buffer = Buffer.alloc(512, 0);
  tarString(name, 100).copy(buffer, 0);
  tarString(tarOctal(mode, 8), 8).copy(buffer, 100);
  tarString(tarOctal(0, 8), 8).copy(buffer, 108);
  tarString(tarOctal(0, 8), 8).copy(buffer, 116);
  tarString(tarOctal(size, 12), 12).copy(buffer, 124);
  tarString(tarOctal(0, 12), 12).copy(buffer, 136);
  Buffer.from("        ").copy(buffer, 148);
  tarString(typeflag, 1).copy(buffer, 156);
  tarString("ustar", 6).copy(buffer, 257);
  tarString("00", 2).copy(buffer, 263);

  let checksum = 0;
  for (const value of buffer.values()) {
    checksum += value;
  }

  tarString(tarOctal(checksum, 8), 8).copy(buffer, 148);
  return buffer;
}

function tarPadSize(size: number): number {
  const remainder = size % 512;
  return remainder === 0 ? 0 : 512 - remainder;
}

function createPackageEntry(asset: VirtualAsset): { name: string; contents?: Buffer }[] {
  const guidMatch = asset.metaContents
    .toString("utf8")
    .match(/^guid:\s*([0-9a-f]{32})$/m);

  if (!guidMatch) {
    throw new Error(`Could not read GUID from generated meta for ${asset.assetPath}.`);
  }

  const guid = guidMatch[1]!;
  const entries: { name: string; contents?: Buffer }[] = [
    {
      name: `${guid}/`
    }
  ];

  if (!asset.isFolder && asset.contents) {
    entries.push({
      name: `${guid}/asset`,
      contents: asset.contents
    });
  }

  entries.push({
    name: `${guid}/asset.meta`,
    contents: asset.metaContents
  });

  entries.push({
    name: `${guid}/pathname`,
    contents: Buffer.from(`${asset.assetPath}\n`, "utf8")
  });

  return entries;
}

function writeUnityPackage(outputPath: string, assets: VirtualAsset[]): void {
  const tarChunks: Buffer[] = [];

  for (const asset of assets) {
    for (const entry of createPackageEntry(asset)) {
      const contents = entry.contents ?? Buffer.alloc(0);
      const isDirectory = entry.name.endsWith("/");
      tarChunks.push(
        createTarHeader(entry.name, contents.length, isDirectory ? 0o777 : 0o644, isDirectory ? "5" : "0")
      );
      if (contents.length > 0) {
        tarChunks.push(contents);
      }

      const padding = tarPadSize(contents.length);
      if (padding > 0) {
        tarChunks.push(Buffer.alloc(padding, 0));
      }
    }
  }

  tarChunks.push(Buffer.alloc(1024, 0));
  const tarBuffer = Buffer.concat(tarChunks);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, tarBuffer);
}

function run(): number {
  const options = parseArgs(process.argv.slice(2));
  const assets = uniqueAssets([
    ...collectPluginAssets(),
    ...collectCliPayloadAssets()
  ]);

  writeUnityPackage(options.outputPath, assets);
  console.log(
    `Wrote native Unity package with ${assets.length} asset entries to ${options.outputPath}`
  );
  return 0;
}

try {
  process.exitCode = run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`unity-package-native-poc: ${message}`);
  process.exitCode = 1;
}
