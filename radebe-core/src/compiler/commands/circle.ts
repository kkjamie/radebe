import { getCommandDefinition } from "../../schema.js";

import type {
  CircleCommand,
  GlowAppearance,
  ParsedCommandNode,
  RadebeDiagnostic,
  RectFill,
  ShadowAppearance,
  StrokeAppearance
} from "../../types.js";

import { compileShapeAppearances } from "../appearance.js";
import {
  createCompilerDiagnostic,
  createMaskShapeFill,
  readOptionalBoolean,
  readOptionalString,
  readRequiredInteger,
  resolveCommandProperties,
  type CompileDrawOptions
} from "../shared.js";

export function compileCircleCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[],
  options: CompileDrawOptions = {}
): CircleCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const x = readRequiredInteger(node, resolvedProperties.values, "x", diagnostics);
  const y = readRequiredInteger(node, resolvedProperties.values, "y", diagnostics);
  const radius = readRequiredInteger(
    node,
    resolvedProperties.values,
    "radius",
    diagnostics,
    { min: 1 }
  );
  const color = readOptionalString(resolvedProperties.values, "color");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const appearances = compileShapeAppearances(node, diagnostics);
  const fills: RectFill[] = appearances.fills;
  const glows: GlowAppearance[] = appearances.glows;
  const shadows: ShadowAppearance[] = appearances.shadows;
  const strokes: StrokeAppearance[] = appearances.strokes;

  if (color !== null) {
    fills.unshift({
      kind: "solid",
      color,
      alpha: 1
    });
  }

  if (
    options.maskShape &&
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    fills.push(createMaskShapeFill());
  }

  if (x === null || y === null || radius === null) {
    return null;
  }

  if (
    fills.length === 0 &&
    glows.length === 0 &&
    shadows.length === 0 &&
    strokes.length === 0
  ) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The circle command requires a color shorthand, a fill child, a glow child, a shadow child, or a stroke child.",
        node
      )
    );
    return null;
  }

  return {
    kind: "circle",
    lineNumber: node.lineNumber,
    x,
    y,
    radius,
    ...(antialias === null ? {} : { antialias }),
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    ...(glows.length === 0 ? {} : { glows }),
    strokes
  };
}
