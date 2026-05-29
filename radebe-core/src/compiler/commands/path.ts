import { getCommandDefinition } from "../../schema.js";

import type {
  ParsedCommandNode,
  PathCommand,
  PolygonPoint,
  RadebeDiagnostic,
  StrokeAppearance
} from "../../types.js";

import { compileStroke } from "../appearance.js";
import {
  createCompilerDiagnostic,
  readOptionalBoolean,
  readOptionalString,
  resolveCommandProperties,
  validateChildren
} from "../shared.js";
import { compilePolygonPoint } from "./polygon.js";

export function compilePathCommand(
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): PathCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);
  validateChildren(node, definition, diagnostics);

  const name = readOptionalString(resolvedProperties.values, "name");
  const antialias = readOptionalBoolean(
    node,
    resolvedProperties.values,
    "antialias",
    diagnostics
  );
  const points: PolygonPoint[] = [];
  const strokes: StrokeAppearance[] = [];

  node.children.forEach((child) => {
    if (child.name === "point") {
      const point = compilePolygonPoint(child, diagnostics);

      if (point !== null) {
        points.push(point);
      }

      return;
    }

    if (child.name === "stroke") {
      const stroke = compileStroke(child, diagnostics);

      if (stroke !== null) {
        strokes.push(stroke);
      }
    }
  });

  if (points.length < 2) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The path command requires at least two points.",
        node
      )
    );
    return null;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;

    if (current.x === next.x && current.y === next.y) {
      diagnostics.push(
        createCompilerDiagnostic(
          "The path command does not allow consecutive duplicate points.",
          node
        )
      );
      return null;
    }
  }

  if (strokes.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The path command requires at least one stroke child because open paths are only visible through stroke in the current slice.",
        node
      )
    );
    return null;
  }

  for (const stroke of strokes) {
    if (stroke.align !== "center") {
      diagnostics.push(
        createCompilerDiagnostic(
          'The path command currently supports only `stroke` align "center".',
          node
        )
      );
      return null;
    }
  }

  return {
    kind: "path",
    lineNumber: node.lineNumber,
    name,
    ...(antialias === null ? {} : { antialias }),
    points,
    strokes
  };
}
