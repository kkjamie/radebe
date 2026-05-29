import { getCommandDefinition } from "../schema.js";

import type {
  ParsedCommandNode,
  RadebeDiagnostic,
  SpriteHeader
} from "../types.js";

import {
  createCompilerDiagnostic,
  readOptionalBoolean,
  readRequiredInteger,
  readRequiredString,
  resolveCommandProperties
} from "./shared.js";

export function compileSpriteHeader(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): SpriteHeader | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const name = readRequiredString(
    node,
    resolvedProperties.values,
    "name",
    diagnostics
  );
  let width: number | null = null;
  let height: number | null = null;
  let background = "transparent";
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      return;
    }

    const childProperties = resolveCommandProperties(child, childDefinition);
    diagnostics.push(...childProperties.diagnostics);

    if (child.name === "size") {
      width = readRequiredInteger(
        child,
        childProperties.values,
        "width",
        diagnostics,
        { min: 1 }
      );
      height = readRequiredInteger(
        child,
        childProperties.values,
        "height",
        diagnostics,
        { min: 1 }
      );
    }

    if (child.name === "background") {
      const color = readRequiredString(
        child,
        childProperties.values,
        "color",
        diagnostics
      );

      if (color) {
        background = color;
      }
    }
  });

  if (name === null || width === null || height === null) {
    return null;
  }

  return {
    name,
    width,
    height,
    background,
    ...(antialias === null ? {} : { antialias })
  };
}
