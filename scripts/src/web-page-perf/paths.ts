import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getCurrentDirectory(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

export function findRepoRoot(startDir = getCurrentDirectory()): string {
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

export function getWebDistDir(rootDir: string): string {
  return path.join(rootDir, "radebe-web", "dist");
}

export function getReportOutputDir(rootDir: string): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");

  return path.join(rootDir, "Temp", "web-page-perf", stamp);
}
