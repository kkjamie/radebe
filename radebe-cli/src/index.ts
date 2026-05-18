#!/usr/bin/env node

import { renderSource } from "@radebe/core";

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

export function run(argv: string[]): number {
  const input = argv[2] ?? "";
  const result = renderSource({ source: input });
  const output = result.artifact.rows.join("\n");

  process.stdout.write(output === "" ? "\n" : `${output}\n`);

  if (result.diagnostics.length > 0) {
    const diagnosticOutput = result.diagnostics
      .map(formatDiagnosticLine)
      .join("\n");
    process.stderr.write(`${diagnosticOutput}\n`);
  }

  return result.diagnostics.length === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(run(process.argv));
}
