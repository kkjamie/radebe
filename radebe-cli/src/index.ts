#!/usr/bin/env node

import { renderSource } from "@radebe/core";

export function run(argv: string[]): number {
  const input = argv[2] ?? "";
  const result = renderSource({ source: input });

  process.stdout.write(`${result.output}\n`);
  return result.diagnostics.length === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(run(process.argv));
}
