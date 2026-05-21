import type { CommandKind } from "./types.js";

export type ArgumentValueKind =
  | "boolean"
  | "color"
  | "enum"
  | "identifier"
  | "integer"
  | "number"
  | "token"
  | "variable-name";

export interface CommandArgumentDefinition {
  name: string;
  valueKind: ArgumentValueKind;
  required?: boolean;
  enumValues?: string[];
  min?: number;
  max?: number;
}

export interface VariadicArgumentDefinition {
  name: string;
  sequence: CommandArgumentDefinition[];
  minRepeats?: number;
  trailingArgument?: CommandArgumentDefinition;
}

export interface InlineChildCommandDefinition {
  argumentName: string;
  allowedCommands: string[];
  consumesRemainingArguments: boolean;
}

export interface ShorthandExpansionDefinition {
  argument: string;
  childCommand: string;
  childCommandArgs?: string[];
  description: string;
  removeWhenChildCommandStarted?: boolean;
}

export type EditorIndentBehavior = "same" | "child" | "child-when-no-args";

export interface CommandEditorHints {
  indentBehavior?: EditorIndentBehavior;
}

export interface CommandDefinition {
  name: string;
  kind: CommandKind;
  capabilities?: string[];
  allowedChildKinds?: CommandKind[];
  allowedChildCapabilities?: string[];
  allowedChildCommands?: string[];
  propertyArgs?: string[];
  shorthandSchema?: string[];
  arguments?: CommandArgumentDefinition[];
  variadicArguments?: VariadicArgumentDefinition;
  inlineChildCommand?: InlineChildCommandDefinition;
  shorthandExpansions?: ShorthandExpansionDefinition[];
  editorHints?: CommandEditorHints;
}

export type AllowedChildSource =
  | "capability"
  | "explicit"
  | "kind"
  | "property";

export interface AllowedChildCommandDefinition {
  definition: CommandDefinition;
  source: AllowedChildSource;
  parentArgument?: CommandArgumentDefinition;
}

export const FILE_DEFINITION: CommandDefinition = {
  name: "$file",
  kind: "file",
  allowedChildCommands: [
    "sprite",
    "plot",
    "line",
    "rect",
    "rect-absolute",
    "rect-inset",
    "circle",
    "polygon",
    "path",
    "group",
    "var",
    "vars"
  ],
  editorHints: {
    indentBehavior: "same"
  }
};

const booleanValues = ["true", "false"];
const directionValues = ["horizontal", "vertical"];
const glowModeValues = ["inner", "outer"];
const strokeAlignValues = ["inside", "center", "outside"];
const strokeStyleValues = ["solid", "dashed", "dotted"];

function arg(
  name: string,
  valueKind: ArgumentValueKind,
  options: Omit<CommandArgumentDefinition, "name" | "valueKind"> = {}
): CommandArgumentDefinition {
  return {
    name,
    valueKind,
    ...options
  };
}

function colorFillExpansion(argument = "color"): ShorthandExpansionDefinition {
  return {
    argument,
    childCommand: "fill",
    childCommandArgs: ["solid", `{${argument}}`],
    description: `The "${argument}" shorthand lowers into a solid fill appearance.`,
    removeWhenChildCommandStarted: true
  };
}

function createSingleValuePropertyDefinition(
  name: string,
  valueKind: ArgumentValueKind = "token",
  options: Omit<CommandArgumentDefinition, "name" | "valueKind"> = {}
): CommandDefinition {
  return {
    name,
    kind: "property",
    arguments: [arg("value", valueKind, { required: true, ...options })],
    propertyArgs: ["value"],
    shorthandSchema: ["value"],
    editorHints: {
      indentBehavior: "same"
    }
  };
}

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    name: "sprite",
    kind: "header",
    allowedChildCommands: ["size", "background"],
    propertyArgs: ["name", "antialias"],
    shorthandSchema: ["name"],
    arguments: [
      arg("name", "identifier", { required: true }),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "size",
    kind: "property",
    propertyArgs: ["width", "height"],
    shorthandSchema: ["width", "height"],
    arguments: [
      arg("width", "integer", { required: true, min: 1 }),
      arg("height", "integer", { required: true, min: 1 })
    ],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "background",
    kind: "property",
    propertyArgs: ["color"],
    shorthandSchema: ["color"],
    arguments: [arg("color", "color", { required: true })],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "plot",
    kind: "geometry",
    propertyArgs: ["x", "y", "color"],
    shorthandSchema: ["x", "y", "color"],
    arguments: [
      arg("x", "integer", { required: true }),
      arg("y", "integer", { required: true }),
      arg("color", "color", { required: true })
    ],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "line",
    kind: "geometry",
    propertyArgs: ["x1", "y1", "x2", "y2", "color", "antialias"],
    shorthandSchema: ["x1", "y1", "x2", "y2", "color"],
    arguments: [
      arg("x1", "integer", { required: true }),
      arg("y1", "integer", { required: true }),
      arg("x2", "integer", { required: true }),
      arg("y2", "integer", { required: true }),
      arg("color", "color", { required: true }),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "rect-absolute",
    kind: "geometry",
    propertyArgs: ["x", "y", "width", "height", "color", "antialias"],
    shorthandSchema: ["x", "y", "width", "height", "color"],
    arguments: [
      arg("x", "integer", { required: true }),
      arg("y", "integer", { required: true }),
      arg("width", "integer", { required: true, min: 1 }),
      arg("height", "integer", { required: true, min: 1 }),
      arg("color", "color"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    allowedChildCapabilities: ["shape-appearance"],
    allowedChildCommands: ["cut", "radius"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "rect",
    kind: "geometry",
    propertyArgs: ["x", "y", "width", "height", "color", "antialias"],
    shorthandSchema: ["x", "y", "width", "height", "color"],
    arguments: [
      arg("x", "integer", { required: true }),
      arg("y", "integer", { required: true }),
      arg("width", "integer", { required: true, min: 1 }),
      arg("height", "integer", { required: true, min: 1 }),
      arg("color", "color"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    allowedChildCapabilities: ["shape-appearance"],
    allowedChildCommands: ["cut", "radius"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "rect-inset",
    kind: "geometry",
    propertyArgs: ["inset", "top", "right", "bottom", "left", "color", "antialias"],
    shorthandSchema: ["inset", "color"],
    arguments: [
      arg("inset", "integer", { min: 0 }),
      arg("top", "integer", { min: 0 }),
      arg("right", "integer", { min: 0 }),
      arg("bottom", "integer", { min: 0 }),
      arg("left", "integer", { min: 0 }),
      arg("color", "color"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    allowedChildCapabilities: ["shape-appearance"],
    allowedChildCommands: ["cut", "radius"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "circle",
    kind: "geometry",
    propertyArgs: ["x", "y", "radius", "color", "antialias"],
    shorthandSchema: ["x", "y", "radius", "color"],
    arguments: [
      arg("x", "integer", { required: true }),
      arg("y", "integer", { required: true }),
      arg("radius", "integer", { required: true, min: 1 }),
      arg("color", "color"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    allowedChildCapabilities: ["shape-appearance"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "polygon",
    kind: "geometry",
    propertyArgs: ["color", "antialias"],
    arguments: [
      arg("color", "color"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    variadicArguments: {
      name: "points",
      minRepeats: 3,
      sequence: [
        arg("x", "integer", { required: true }),
        arg("y", "integer", { required: true })
      ],
      trailingArgument: arg("color", "color")
    },
    allowedChildCapabilities: ["shape-appearance"],
    allowedChildCommands: ["point"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "path",
    kind: "geometry",
    propertyArgs: ["name", "antialias"],
    shorthandSchema: ["name"],
    arguments: [
      arg("name", "identifier"),
      arg("antialias", "boolean", { enumValues: booleanValues })
    ],
    allowedChildCommands: ["point", "stroke"],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "group",
    kind: "structural",
    propertyArgs: ["name"],
    shorthandSchema: ["name"],
    arguments: [arg("name", "identifier")],
    allowedChildCapabilities: ["shape-appearance"],
    allowedChildCommands: [
      "plot",
      "line",
      "rect",
      "rect-absolute",
      "rect-inset",
      "circle",
      "polygon",
      "path",
      "group"
    ],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "var",
    kind: "structural",
    propertyArgs: ["name", "value"],
    shorthandSchema: ["name", "value"],
    arguments: [
      arg("name", "variable-name", { required: true }),
      arg("value", "token", { required: true })
    ],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "vars",
    kind: "structural",
    allowedChildCommands: ["var"],
    editorHints: {
      indentBehavior: "child"
    }
  },
  {
    name: "point",
    kind: "structural",
    propertyArgs: ["x", "y"],
    shorthandSchema: ["x", "y"],
    arguments: [
      arg("x", "integer", { required: true }),
      arg("y", "integer", { required: true })
    ],
    editorHints: {
      indentBehavior: "same"
    }
  },
  {
    name: "cut",
    kind: "property",
    propertyArgs: ["top-left", "top-right", "bottom-right", "bottom-left"],
    shorthandSchema: ["top-left", "top-right", "bottom-right", "bottom-left"],
    arguments: [
      arg("top-left", "integer", { required: true, min: 0 }),
      arg("top-right", "integer", { required: true, min: 0 }),
      arg("bottom-right", "integer", { required: true, min: 0 }),
      arg("bottom-left", "integer", { required: true, min: 0 })
    ],
    allowedChildCommands: ["top-left", "top-right", "bottom-right", "bottom-left"],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "fill",
    kind: "appearance",
    capabilities: ["shape-appearance"],
    propertyArgs: ["alpha"],
    allowedChildCommands: ["solid", "gradient", "gradient-linear", "gradient-radial"],
    arguments: [arg("alpha", "number", { min: 0, max: 1 })],
    inlineChildCommand: {
      argumentName: "variant",
      allowedCommands: ["solid", "gradient", "gradient-linear", "gradient-radial"],
      consumesRemainingArguments: true
    },
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "shadow",
    kind: "appearance",
    capabilities: ["shape-appearance"],
    propertyArgs: ["x", "y", "color", "alpha", "spread", "blur"],
    shorthandSchema: ["x", "y", "color"],
    arguments: [
      arg("x", "number"),
      arg("y", "number"),
      arg("color", "color"),
      arg("alpha", "number", { min: 0, max: 1 }),
      arg("spread", "integer"),
      arg("blur", "integer", { min: 0 })
    ],
    allowedChildCommands: ["x", "y", "spread", "blur", "fill"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "glow",
    kind: "appearance",
    capabilities: ["shape-appearance"],
    propertyArgs: ["color", "mode", "alpha", "spread", "blur"],
    shorthandSchema: ["color"],
    arguments: [
      arg("color", "color"),
      arg("mode", "enum", { enumValues: glowModeValues }),
      arg("alpha", "number", { min: 0, max: 1 }),
      arg("spread", "integer", { min: 0 }),
      arg("blur", "integer", { min: 0 })
    ],
    allowedChildCommands: ["mode", "spread", "blur", "fill"],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "stroke",
    kind: "appearance",
    capabilities: ["shape-appearance"],
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
    arguments: [
      arg("width", "integer", { required: true, min: 1 }),
      arg("color", "color"),
      arg("alpha", "number", { min: 0, max: 1 }),
      arg("align", "enum", { enumValues: strokeAlignValues }),
      arg("style", "enum", { enumValues: strokeStyleValues }),
      arg("dash-length", "integer", { min: 1 }),
      arg("gap-length", "integer", { min: 0 }),
      arg("dot-spacing", "integer", { min: 0 })
    ],
    allowedChildCommands: [
      "width",
      "align",
      "style",
      "dash-length",
      "gap-length",
      "dot-spacing",
      "fill",
      "stroke"
    ],
    shorthandExpansions: [colorFillExpansion()],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "solid",
    kind: "appearance",
    propertyArgs: ["color"],
    shorthandSchema: ["color"],
    arguments: [arg("color", "color", { required: true })],
    allowedChildCommands: ["color"],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "gradient",
    kind: "appearance",
    propertyArgs: ["from", "to", "direction", "angle"],
    shorthandSchema: ["from", "to"],
    arguments: [
      arg("from", "color"),
      arg("to", "color"),
      arg("direction", "enum", { enumValues: directionValues }),
      arg("angle", "number")
    ],
    allowedChildCommands: ["stop", "direction", "angle"],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "gradient-linear",
    kind: "appearance",
    propertyArgs: ["from", "to", "direction", "angle"],
    shorthandSchema: ["from", "to"],
    arguments: [
      arg("from", "color"),
      arg("to", "color"),
      arg("direction", "enum", { enumValues: directionValues }),
      arg("angle", "number")
    ],
    allowedChildCommands: ["stop", "direction", "angle"],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "gradient-radial",
    kind: "appearance",
    propertyArgs: ["from", "to", "center-x", "center-y", "radius"],
    shorthandSchema: ["from", "to"],
    arguments: [
      arg("from", "color"),
      arg("to", "color"),
      arg("center-x", "number", { min: 0, max: 1 }),
      arg("center-y", "number", { min: 0, max: 1 }),
      arg("radius", "number", { min: 0.0001 })
    ],
    allowedChildCommands: ["stop", "center-x", "center-y", "radius"],
    editorHints: {
      indentBehavior: "child-when-no-args"
    }
  },
  {
    name: "stop",
    kind: "appearance",
    propertyArgs: ["color", "position"],
    shorthandSchema: ["color", "position"],
    arguments: [
      arg("color", "color", { required: true }),
      arg("position", "number", { required: true, min: 0, max: 1 })
    ],
    allowedChildCommands: ["color", "position"],
    editorHints: {
      indentBehavior: "same"
    }
  },
  createSingleValuePropertyDefinition("name", "identifier"),
  createSingleValuePropertyDefinition("value", "token"),
  createSingleValuePropertyDefinition("width", "integer", { min: 1 }),
  createSingleValuePropertyDefinition("height", "integer", { min: 1 }),
  createSingleValuePropertyDefinition("antialias", "boolean", {
    enumValues: booleanValues
  }),
  createSingleValuePropertyDefinition("alpha", "number", { min: 0, max: 1 }),
  createSingleValuePropertyDefinition("color", "color"),
  createSingleValuePropertyDefinition("position", "number", { min: 0, max: 1 }),
  createSingleValuePropertyDefinition("from", "color"),
  createSingleValuePropertyDefinition("to", "color"),
  createSingleValuePropertyDefinition("inset", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("direction", "enum", {
    enumValues: directionValues
  }),
  createSingleValuePropertyDefinition("mode", "enum", {
    enumValues: glowModeValues
  }),
  createSingleValuePropertyDefinition("angle", "number"),
  createSingleValuePropertyDefinition("center-x", "number", { min: 0, max: 1 }),
  createSingleValuePropertyDefinition("center-y", "number", { min: 0, max: 1 }),
  createSingleValuePropertyDefinition("spread", "integer"),
  createSingleValuePropertyDefinition("blur", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("radius", "number", { min: 0 }),
  createSingleValuePropertyDefinition("align", "enum", {
    enumValues: strokeAlignValues
  }),
  createSingleValuePropertyDefinition("style", "enum", {
    enumValues: strokeStyleValues
  }),
  createSingleValuePropertyDefinition("dash-length", "integer", { min: 1 }),
  createSingleValuePropertyDefinition("gap-length", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("dot-spacing", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("top-left", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("top-right", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("bottom-right", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("bottom-left", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("top", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("right", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("bottom", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("left", "integer", { min: 0 }),
  createSingleValuePropertyDefinition("x", "number"),
  createSingleValuePropertyDefinition("y", "number"),
  createSingleValuePropertyDefinition("x1", "integer"),
  createSingleValuePropertyDefinition("y1", "integer"),
  createSingleValuePropertyDefinition("x2", "integer"),
  createSingleValuePropertyDefinition("y2", "integer")
];

export const COMMAND_REGISTRY = new Map(
  COMMAND_DEFINITIONS.map((definition) => [definition.name, definition])
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

export function getCommandArgumentDefinitions(
  definition: CommandDefinition
): CommandArgumentDefinition[] {
  return definition.arguments ?? [];
}

export function getCommandArgumentDefinition(
  definition: CommandDefinition,
  name: string
): CommandArgumentDefinition | undefined {
  return getCommandArgumentDefinitions(definition).find(
    (argument) => argument.name === name
  );
}

export function getShorthandArgumentDefinitions(
  definition: CommandDefinition
): CommandArgumentDefinition[] {
  return (definition.shorthandSchema ?? []).map((name) => {
    return (
      getCommandArgumentDefinition(definition, name) ??
      arg(name, "token", { required: true })
    );
  });
}

export function getAllowedChildCommandDefinitions(
  parentDefinition: CommandDefinition
): AllowedChildCommandDefinition[] {
  const children: AllowedChildCommandDefinition[] = [];
  const seen = new Set<string>();

  function addChild(
    childName: string,
    source: AllowedChildSource,
    parentArgument?: CommandArgumentDefinition
  ): void {
    if (seen.has(childName)) {
      return;
    }

    const definition = getCommandDefinition(childName);

    if (!definition) {
      return;
    }

    seen.add(childName);
    children.push({
      definition,
      source,
      ...(parentArgument ? { parentArgument } : {})
    });
  }

  parentDefinition.allowedChildCommands?.forEach((childName) => {
    addChild(childName, "explicit");
  });

  getAllowedPropertyCommands(parentDefinition).forEach((childName) => {
    addChild(
      childName,
      "property",
      getCommandArgumentDefinition(parentDefinition, childName)
    );
  });

  COMMAND_DEFINITIONS.forEach((definition) => {
    if (
      parentDefinition.allowedChildCapabilities?.some((capability) =>
        hasCapability(definition, capability)
      )
    ) {
      addChild(definition.name, "capability");
      return;
    }

    if (parentDefinition.allowedChildKinds?.includes(definition.kind)) {
      addChild(definition.name, "kind");
    }
  });

  return children;
}

export function getAllowedChildCommandNames(
  parentDefinition: CommandDefinition
): string[] {
  return getAllowedChildCommandDefinitions(parentDefinition).map(
    (child) => child.definition.name
  );
}

export function hasCapability(
  definition: CommandDefinition,
  capability: string
): boolean {
  return definition.capabilities?.includes(capability) ?? false;
}
