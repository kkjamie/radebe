import type { CommandKind } from "./types.js";

export interface CommandDefinition {
  name: string;
  kind: CommandKind;
  allowedChildKinds?: CommandKind[];
  allowedChildCommands?: string[];
  propertyArgs?: string[];
  shorthandSchema?: string[];
}

export const FILE_DEFINITION: CommandDefinition = {
  name: "$file",
  kind: "file",
  allowedChildCommands: ["sprite", "plot", "line", "rect", "rect-absolute", "rect-inset"]
};

function createSingleValuePropertyDefinition(name: string): CommandDefinition {
  return {
    name,
    kind: "property",
    propertyArgs: ["value"],
    shorthandSchema: ["value"]
  };
}

const commandDefinitions = [
  {
    name: "sprite",
    kind: "header",
    allowedChildCommands: ["size", "background"],
    propertyArgs: ["name"],
    shorthandSchema: ["name"]
  },
  {
    name: "size",
    kind: "property",
    propertyArgs: ["width", "height"],
    shorthandSchema: ["width", "height"]
  },
  {
    name: "background",
    kind: "property",
    propertyArgs: ["color"],
    shorthandSchema: ["color"]
  },
  {
    name: "plot",
    kind: "geometry",
    propertyArgs: ["x", "y", "color"],
    shorthandSchema: ["x", "y", "color"]
  },
  {
    name: "line",
    kind: "geometry",
    propertyArgs: ["x1", "y1", "x2", "y2", "color"],
    shorthandSchema: ["x1", "y1", "x2", "y2", "color"]
  },
  {
    name: "rect-absolute",
    kind: "geometry",
    propertyArgs: ["x", "y", "width", "height", "color"],
    shorthandSchema: ["x", "y", "width", "height", "color"],
    allowedChildCommands: ["fill", "stroke", "cut", "radius"]
  },
  {
    name: "rect",
    kind: "geometry",
    propertyArgs: ["x", "y", "width", "height", "color"],
    shorthandSchema: ["x", "y", "width", "height", "color"],
    allowedChildCommands: ["fill", "stroke", "cut", "radius"]
  },
  {
    name: "rect-inset",
    kind: "geometry",
    propertyArgs: ["inset", "top", "right", "bottom", "left", "color"],
    shorthandSchema: ["inset", "color"],
    allowedChildCommands: ["fill", "stroke", "cut", "radius"]
  },
  {
    name: "cut",
    kind: "property",
    propertyArgs: ["top-left", "top-right", "bottom-right", "bottom-left"],
    shorthandSchema: ["top-left", "top-right", "bottom-right", "bottom-left"],
    allowedChildCommands: ["top-left", "top-right", "bottom-right", "bottom-left"]
  },
  {
    name: "fill",
    kind: "appearance",
    propertyArgs: ["alpha"],
    allowedChildCommands: ["solid", "gradient", "gradient-linear", "gradient-radial"]
  },
  {
    name: "stroke",
    kind: "appearance",
    propertyArgs: [
      "width",
      "color",
      "alpha",
      "align",
      "style",
      "dash-length",
      "gap-length",
      "dot-spacing"
    ],
    shorthandSchema: ["width", "color"],
    allowedChildCommands: [
      "width",
      "align",
      "style",
      "dash-length",
      "gap-length",
      "dot-spacing",
      "fill",
      "stroke"
    ]
  },
  {
    name: "solid",
    kind: "appearance",
    propertyArgs: ["color"],
    shorthandSchema: ["color"],
    allowedChildCommands: ["color"]
  },
  {
    name: "gradient",
    kind: "appearance",
    propertyArgs: ["from", "to", "direction", "angle"],
    shorthandSchema: ["from", "to"],
    allowedChildCommands: ["stop", "direction", "angle"]
  },
  {
    name: "gradient-linear",
    kind: "appearance",
    propertyArgs: ["from", "to", "direction", "angle"],
    shorthandSchema: ["from", "to"],
    allowedChildCommands: ["stop", "direction", "angle"]
  },
  {
    name: "gradient-radial",
    kind: "appearance",
    propertyArgs: ["from", "to", "center-x", "center-y", "radius"],
    shorthandSchema: ["from", "to"],
    allowedChildCommands: ["stop", "center-x", "center-y", "radius"]
  },
  {
    name: "stop",
    kind: "appearance",
    propertyArgs: ["color", "position"],
    shorthandSchema: ["color", "position"],
    allowedChildCommands: ["color", "position"]
  },
  createSingleValuePropertyDefinition("name"),
  createSingleValuePropertyDefinition("width"),
  createSingleValuePropertyDefinition("height"),
  createSingleValuePropertyDefinition("alpha"),
  createSingleValuePropertyDefinition("color"),
  createSingleValuePropertyDefinition("position"),
  createSingleValuePropertyDefinition("from"),
  createSingleValuePropertyDefinition("to"),
  createSingleValuePropertyDefinition("inset"),
  createSingleValuePropertyDefinition("direction"),
  createSingleValuePropertyDefinition("angle"),
  createSingleValuePropertyDefinition("center-x"),
  createSingleValuePropertyDefinition("center-y"),
  createSingleValuePropertyDefinition("radius"),
  createSingleValuePropertyDefinition("align"),
  createSingleValuePropertyDefinition("style"),
  createSingleValuePropertyDefinition("dash-length"),
  createSingleValuePropertyDefinition("gap-length"),
  createSingleValuePropertyDefinition("dot-spacing"),
  createSingleValuePropertyDefinition("top-left"),
  createSingleValuePropertyDefinition("top-right"),
  createSingleValuePropertyDefinition("bottom-right"),
  createSingleValuePropertyDefinition("bottom-left"),
  createSingleValuePropertyDefinition("top"),
  createSingleValuePropertyDefinition("right"),
  createSingleValuePropertyDefinition("bottom"),
  createSingleValuePropertyDefinition("left"),
  createSingleValuePropertyDefinition("x"),
  createSingleValuePropertyDefinition("y"),
  createSingleValuePropertyDefinition("x1"),
  createSingleValuePropertyDefinition("y1"),
  createSingleValuePropertyDefinition("x2"),
  createSingleValuePropertyDefinition("y2")
] satisfies CommandDefinition[];

export const COMMAND_REGISTRY = new Map(
  commandDefinitions.map((definition) => [definition.name, definition])
);

export function getCommandDefinition(
  name: string
): CommandDefinition | undefined {
  return COMMAND_REGISTRY.get(name);
}

export function getAllowedPropertyCommands(
  definition: CommandDefinition
): string[] {
  return definition.propertyArgs ?? [];
}
