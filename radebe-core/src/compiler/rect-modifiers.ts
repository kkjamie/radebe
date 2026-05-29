import { getCommandDefinition } from "../schema.js";

import type {
  ParsedCommandNode,
  RadebeDiagnostic,
  RectCut,
  RectRadius
} from "../types.js";

import {
  createCompilerDiagnostic,
  readRequiredInteger,
  resolveCommandProperties,
  validateChildren
} from "./shared.js";

export function compileRectCut(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectCut | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  validateChildren(node, definition, diagnostics);

  let topLeftToken: string | null = null;
  let topRightToken: string | null = null;
  let bottomRightToken: string | null = null;
  let bottomLeftToken: string | null = null;

  if (node.args.length === 1) {
    [topLeftToken] = node.args;
    topRightToken = topLeftToken;
    bottomRightToken = topLeftToken;
    bottomLeftToken = topLeftToken;
  } else if (node.args.length === 4) {
    [topLeftToken, topRightToken, bottomRightToken, bottomLeftToken] = node.args;
  } else if (node.args.length > 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        'The cut command expects either one value or four values in "top-left top-right bottom-right bottom-left" order.',
        node
      )
    );
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  if (topLeftToken !== null) {
    resolvedProperties.values.set("top-left", topLeftToken);
  }
  if (topRightToken !== null) {
    resolvedProperties.values.set("top-right", topRightToken);
  }
  if (bottomRightToken !== null) {
    resolvedProperties.values.set("bottom-right", bottomRightToken);
  }
  if (bottomLeftToken !== null) {
    resolvedProperties.values.set("bottom-left", bottomLeftToken);
  }

  const topLeft = readRequiredInteger(
    node,
    resolvedProperties.values,
    "top-left",
    diagnostics,
    { min: 0 }
  );
  const topRight = readRequiredInteger(
    node,
    resolvedProperties.values,
    "top-right",
    diagnostics,
    { min: 0 }
  );
  const bottomRight = readRequiredInteger(
    node,
    resolvedProperties.values,
    "bottom-right",
    diagnostics,
    { min: 0 }
  );
  const bottomLeft = readRequiredInteger(
    node,
    resolvedProperties.values,
    "bottom-left",
    diagnostics,
    { min: 0 }
  );

  if (
    topLeft === null ||
    topRight === null ||
    bottomRight === null ||
    bottomLeft === null
  ) {
    return null;
  }

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  };
}

export function compileRectRadius(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): RectRadius | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const value = readRequiredInteger(node, resolvedProperties.values, "value", diagnostics, {
    min: 0
  });

  if (value === null) {
    return null;
  }

  return { value };
}
