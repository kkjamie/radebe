import { getCommandDefinition } from "../../schema.js";

import type {
  CompiledDrawCommand,
  ParsedCommandNode,
  PlotCommand,
  RadebeDiagnostic
} from "../../types.js";

import {
  createCompilerDiagnostic,
  readOptionalBoolean,
  readRequiredInteger,
  readRequiredString,
  resolveCommandProperties
} from "../shared.js";

export function compilePlotCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PlotCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
  const y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);
  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );

  if (x === null || y === null || color === null) {
    return null;
  }

  return {
    kind: "plot",
    lineNumber: node.lineNumber,
    x,
    y,
    color
  };
}

export function compileLineCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): CompiledDrawCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x1 = readRequiredInteger(node, resolvedProperties.values, "x1", diagnostics);
  const y1 = readRequiredInteger(node, resolvedProperties.values, "y1", diagnostics);
  const x2 = readRequiredInteger(node, resolvedProperties.values, "x2", diagnostics);
  const y2 = readRequiredInteger(node, resolvedProperties.values, "y2", diagnostics);
  const color = readRequiredString(
    node,
    resolvedProperties.values,
    "color",
    diagnostics
  );
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );

  if (x1 === null || y1 === null || x2 === null || y2 === null || color === null) {
    return null;
  }

  return {
    kind: "line",
    lineNumber: node.lineNumber,
    x1,
    y1,
    x2,
    y2,
    color,
    ...(antialias === null ? {} : { antialias })
  };
}
