import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const extensionRoot = path.join(repoRoot, "radebe-vscode");
const coreRoot = path.join(repoRoot, "radebe-core");
const tempRoot = path.join(repoRoot, "Temp");
const stageRoot = path.join(tempRoot, "vscode-extension-stage");
const extensionDistRoot = path.join(extensionRoot, "dist", "src");
const coreDistRoot = path.join(coreRoot, "dist");
const installExtension = process.argv.includes("--install");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(`${filePath}`, `${JSON.stringify(value, null, 2)}\n`);
}

function copyRequiredPath(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Expected build artifact at ${path.relative(repoRoot, from)}`);
  }

  cpSync(from, to, { recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: "inherit",
    shell: options.shell ?? false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runShell(command, options = {}) {
  const result = spawnSync(command, {
    cwd: options.cwd ?? repoRoot,
    stdio: "inherit",
    shell: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getLocalBin(name) {
  return path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name
  );
}

function getVsCodeCli() {
  if (process.platform !== "win32") {
    return "code";
  }

  const candidates = [
    process.env.LOCALAPPDATA
      ? path.join(
          process.env.LOCALAPPDATA,
          "Programs",
          "Microsoft VS Code",
          "bin",
          "code.cmd"
        )
      : null,
    process.env.ProgramFiles
      ? path.join(process.env.ProgramFiles, "Microsoft VS Code", "bin", "code.cmd")
      : null,
    process.env["ProgramFiles(x86)"]
      ? path.join(
          process.env["ProgramFiles(x86)"],
          "Microsoft VS Code",
          "bin",
          "code.cmd"
        )
      : null
  ];

  return candidates.find((candidate) => candidate !== null && existsSync(candidate)) ?? "code.cmd";
}

function installVsix(vsixFilePath) {
  const codeCli = getVsCodeCli();

  if (process.platform === "win32") {
    runShell(`"${codeCli}" --install-extension "${vsixFilePath}" --force`);
    return;
  }

  run(codeCli, ["--install-extension", vsixFilePath, "--force"]);
}

const extensionPackage = readJson(path.join(extensionRoot, "package.json"));
const corePackage = readJson(path.join(coreRoot, "package.json"));
const vsixPath = path.join(
  tempRoot,
  `${extensionPackage.name}-${extensionPackage.version}.vsix`
);

if (!existsSync(getLocalBin("vsce"))) {
  throw new Error("Missing @vscode/vsce. Run `npm install` before packaging the VSIX.");
}

if (!existsSync(extensionDistRoot) || !existsSync(coreDistRoot)) {
  throw new Error("Missing build output. Run `npm run build` before packaging the VSIX.");
}

rmSync(stageRoot, { force: true, recursive: true });
mkdirSync(stageRoot, { recursive: true });
mkdirSync(tempRoot, { recursive: true });

const stagedPackage = {
  ...extensionPackage,
  private: undefined,
  scripts: undefined,
  dependencies: {
    "@radebe/core": corePackage.version
  }
};

delete stagedPackage.private;
delete stagedPackage.scripts;
delete stagedPackage.files;

writeJson(path.join(stageRoot, "package.json"), stagedPackage);
copyRequiredPath(extensionDistRoot, path.join(stageRoot, "dist", "src"));
copyFileSync(
  path.join(extensionRoot, "language-configuration.json"),
  path.join(stageRoot, "language-configuration.json")
);
copyFileSync(path.join(extensionRoot, "README.md"), path.join(stageRoot, "README.md"));
copyRequiredPath(path.join(extensionRoot, "syntaxes"), path.join(stageRoot, "syntaxes"));

const stagedCoreRoot = path.join(stageRoot, "node_modules", "@radebe", "core");
mkdirSync(stagedCoreRoot, { recursive: true });

const stagedCorePackage = { ...corePackage };
delete stagedCorePackage.private;
delete stagedCorePackage.scripts;

writeJson(path.join(stagedCoreRoot, "package.json"), stagedCorePackage);
copyRequiredPath(coreDistRoot, path.join(stagedCoreRoot, "dist"));

writeFileSync(
  path.join(stageRoot, ".vscodeignore"),
  [
    ".vscodeignore",
    "**/*.tsbuildinfo",
    "dist/test/**",
    "node_modules/@radebe/core/dist/test/**",
    "node_modules/@radebe/core/test/**",
    "node_modules/@radebe/core/src/**",
    ""
  ].join("\n")
);

rmSync(vsixPath, { force: true });
run(
  getLocalBin("vsce"),
  ["package", "--allow-missing-repository", "--no-dependencies", "--out", vsixPath],
  { cwd: stageRoot, shell: process.platform === "win32" }
);

console.log(`Packaged ${path.relative(repoRoot, vsixPath)}`);

if (installExtension) {
  installVsix(vsixPath);
}
