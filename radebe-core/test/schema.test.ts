import test from "node:test";
import assert from "node:assert/strict";

import {
  FILE_DEFINITION,
  getAllowedChildCommandDefinitions,
  getAllowedChildCommandNames,
  getCommandArgumentDefinition,
  getCommandDefinition,
  getShorthandArgumentDefinitions
} from "../src/index.js";

test("schema exposes typed command arguments for editor assistance", () => {
  const stroke = getCommandDefinition("stroke");
  const circle = getCommandDefinition("circle");

  assert.ok(stroke);
  assert.ok(circle);
  assert.deepEqual(
    getShorthandArgumentDefinitions(stroke).map((argument) => ({
      name: argument.name,
      valueKind: argument.valueKind,
      required: argument.required
    })),
    [
      { name: "width", valueKind: "integer", required: true },
      { name: "color", valueKind: "color", required: undefined }
    ]
  );
  assert.deepEqual(getCommandArgumentDefinition(stroke, "align"), {
    name: "align",
    valueKind: "enum",
    enumValues: ["inside", "center", "outside"]
  });
  assert.deepEqual(getCommandArgumentDefinition(stroke, "style"), {
    name: "style",
    valueKind: "enum",
    enumValues: ["solid", "dashed", "dotted"]
  });
  assert.deepEqual(getCommandArgumentDefinition(circle, "antialias"), {
    name: "antialias",
    valueKind: "boolean",
    enumValues: ["true", "false"]
  });
});

test("schema exposes context-aware child command metadata", () => {
  const sprite = getCommandDefinition("sprite");
  const circle = getCommandDefinition("circle");

  assert.ok(sprite);
  assert.ok(circle);
  assert.deepEqual(getAllowedChildCommandNames(FILE_DEFINITION), [
    "sprite",
    "plot",
    "line",
    "rect",
    "rect-absolute",
    "rect-inset",
    "circle",
    "polygon",
    "polygon-regular",
    "polygon-star",
    "path",
    "group",
    "mask",
    "var",
    "vars"
  ]);
  assert.deepEqual(
    getAllowedChildCommandDefinitions(sprite).map((child) => ({
      name: child.definition.name,
      source: child.source,
      valueKind: child.parentArgument?.valueKind
    })),
    [
      { name: "size", source: "explicit", valueKind: undefined },
      { name: "background", source: "explicit", valueKind: undefined },
      { name: "name", source: "property", valueKind: "identifier" },
      { name: "antialias", source: "property", valueKind: "boolean" }
    ]
  );

  const circleChildren = getAllowedChildCommandDefinitions(circle);
  assert.deepEqual(
    circleChildren
      .filter((child) => child.source === "property")
      .map((child) => [child.definition.name, child.parentArgument?.valueKind]),
    [
      ["x", "integer"],
      ["y", "integer"],
      ["radius", "integer"],
      ["color", "color"],
      ["antialias", "boolean"]
    ]
  );
  assert.deepEqual(
    circleChildren
      .filter((child) => child.source === "capability")
      .map((child) => child.definition.name),
    ["fill", "shadow", "glow", "stroke"]
  );

  const group = getCommandDefinition("group");
  assert.ok(group);
  assert.deepEqual(getAllowedChildCommandNames(group), [
    "plot",
    "line",
    "rect",
    "rect-absolute",
    "rect-inset",
    "circle",
    "polygon",
    "polygon-regular",
    "polygon-star",
    "path",
    "group",
    "mask",
    "name",
    "fill",
    "shadow",
    "glow",
    "stroke"
  ]);

  const mask = getCommandDefinition("mask");
  assert.ok(mask);
  assert.deepEqual(getAllowedChildCommandNames(mask), [
    "shape",
    "contents",
    "name",
    "invert",
    "show"
  ]);
});

test("schema records editor hints for inline child commands and smart expansions", () => {
  const rect = getCommandDefinition("rect");
  const fill = getCommandDefinition("fill");
  const polygon = getCommandDefinition("polygon");

  assert.ok(rect);
  assert.ok(fill);
  assert.ok(polygon);
  assert.deepEqual(rect.shorthandExpansions, [
    {
      argument: "color",
      childCommand: "fill",
      childCommandArgs: ["solid", "{color}"],
      description: 'The "color" shorthand lowers into a solid fill appearance.',
      removeWhenChildCommandStarted: true
    }
  ]);
  assert.deepEqual(fill.inlineChildCommand, {
    argumentName: "variant",
    allowedCommands: ["solid", "gradient", "gradient-linear", "gradient-radial"],
    consumesRemainingArguments: true
  });
  assert.equal(rect.editorHints?.indentBehavior, "child");
  assert.equal(fill.editorHints?.indentBehavior, "child-when-no-args");
  assert.deepEqual(polygon.variadicArguments, {
    name: "points",
    minRepeats: 3,
    sequence: [
      { name: "x", valueKind: "integer", required: true },
      { name: "y", valueKind: "integer", required: true }
    ],
    trailingArgument: { name: "color", valueKind: "color" }
  });

  const regular = getCommandDefinition("polygon-regular");
  const star = getCommandDefinition("polygon-star");

  assert.ok(regular);
  assert.ok(star);
  assert.deepEqual(getShorthandArgumentDefinitions(regular).map((argument) => ({
    name: argument.name,
    valueKind: argument.valueKind,
    required: argument.required,
    min: argument.min
  })), [
    { name: "x", valueKind: "integer", required: true, min: undefined },
    { name: "y", valueKind: "integer", required: true, min: undefined },
    { name: "sides", valueKind: "integer", required: true, min: 3 },
    { name: "radius", valueKind: "integer", required: true, min: 1 },
    { name: "color", valueKind: "color", required: undefined, min: undefined }
  ]);
  assert.deepEqual(getShorthandArgumentDefinitions(star).map((argument) => ({
    name: argument.name,
    valueKind: argument.valueKind,
    required: argument.required,
    min: argument.min
  })), [
    { name: "x", valueKind: "integer", required: true, min: undefined },
    { name: "y", valueKind: "integer", required: true, min: undefined },
    { name: "points", valueKind: "integer", required: true, min: 3 },
    { name: "inner-radius", valueKind: "integer", required: true, min: 1 },
    { name: "outer-radius", valueKind: "integer", required: true, min: 1 },
    { name: "color", valueKind: "color", required: undefined, min: undefined }
  ]);
  assert.ok(polygon.allowedChildCommands?.includes("cut"));
  assert.ok(polygon.allowedChildCommands?.includes("radius"));
  assert.ok(regular.allowedChildCommands?.includes("cut"));
  assert.ok(regular.allowedChildCommands?.includes("radius"));
  assert.ok(star.allowedChildCommands?.includes("cut"));
  assert.ok(star.allowedChildCommands?.includes("radius"));
});
