#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

import { renderSource } from "@radebe/core";

import type { PipelineResult, RadebeDiagnostic } from "@radebe/core";

function formatDiagnosticLine(diagnostic: {
  stage: string;
  message: string;
  line?: number;
  column?: number;
}): string {
  const location =
    diagnostic.line === undefined
      ? diagnostic.stage
      : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

  return `${location} ${diagnostic.message}`;
}

function printDiagnostics(diagnostics: RadebeDiagnostic[]): void {
  if (diagnostics.length === 0) {
    return;
  }

  const diagnosticOutput = diagnostics.map(formatDiagnosticLine).join("\n");
  process.stderr.write(`${diagnosticOutput}\n`);
}

function normalizeUnityPixel(pixel: string | null): string {
  if (pixel === null) {
    return "#00000000";
  }

  if (/^#[0-9a-f]{6}$/i.test(pixel)) {
    return `${pixel}ff`.toLowerCase();
  }

  return pixel.toLowerCase();
}

function getSourceFileName(sourcePath: string): string {
  const extension = extname(sourcePath);
  return basename(sourcePath, extension);
}

function buildUnityJsonArtifact(
  result: PipelineResult,
  sourcePath: string
): string {
  const artifact = result.artifact;
  const spriteName =
    result.compiled.sprite?.name || getSourceFileName(sourcePath) || "radebe";

  return JSON.stringify(
    {
      kind: "unity-sprite",
      version: 1,
      name: spriteName,
      width: artifact.width,
      height: artifact.height,
      background: artifact.background,
      rows: artifact.rows,
      pixels: artifact.pixels.flatMap((row) => row.map(normalizeUnityPixel)),
      diagnostics: result.diagnostics
    },
    null,
    2
  );
}

type CompileOptions =
  | {
      ok: true;
      sourcePath: string;
      format: "unity-json";
    }
  | {
      ok: false;
      message: string;
    };

function parseCompileOptions(args: string[]): CompileOptions {
  let sourcePath: string | null = null;
  let format: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    if (arg === "--format") {
      format = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--format=")) {
      format = arg.slice("--format=".length);
      continue;
    }

    if (arg.startsWith("--")) {
      return {
        ok: false,
        message: `Unknown compile option "${arg}".`
      };
    }

    if (sourcePath !== null) {
      return {
        ok: false,
        message: "The compile command accepts exactly one source file path."
      };
    }

    sourcePath = arg;
  }

  if (sourcePath === null || sourcePath.trim() === "") {
    return {
      ok: false,
      message: "The compile command requires a source file path."
    };
  }

  if ((format ?? "unity-json") !== "unity-json") {
    return {
      ok: false,
      message: `Unsupported compile format "${format}". Supported format: unity-json.`
    };
  }

  return {
    ok: true,
    sourcePath,
    format: "unity-json"
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function runCompile(argv: string[]): number {
  const options = parseCompileOptions(argv.slice(3));

  if (!options.ok) {
    process.stderr.write(`cli ${options.message}\n`);
    return 1;
  }

  let source: string;
  try {
    source = readFileSync(options.sourcePath, "utf8");
  } catch (error) {
    process.stderr.write(
      `cli Failed to read source file "${options.sourcePath}": ${getErrorMessage(error)}\n`
    );
    return 1;
  }

  const result = renderSource({ source });
  process.stdout.write(`${buildUnityJsonArtifact(result, options.sourcePath)}\n`);
  printDiagnostics(result.diagnostics);

  return result.diagnostics.length === 0 ? 0 : 1;
}

export function run(argv: string[]): number {
  if (argv[2] === "compile") {
    return runCompile(argv);
  }

  const input = argv[2] ?? "";
  const result = renderSource({ source: input });
  const output = result.artifact.rows.join("\n");

  process.stdout.write(output === "" ? "\n" : `${output}\n`);
  printDiagnostics(result.diagnostics);

  return result.diagnostics.length === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(run(process.argv));
}
