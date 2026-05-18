import type { CommandKind } from "./types.js";

export interface CommandDefinition {
  name: string;
  kind: CommandKind;
  allowedChildKinds?: CommandKind[];
  allowedChildCommands?: string[];
  shorthandSchema?: string[];
}

export const FILE_DEFINITION: CommandDefinition = {
  name: "$file",
  kind: "file",
  allowedChildCommands: ["sprite", "plot", "line"]
};

const commandDefinitions = [
  {
    name: "sprite",
    kind: "header",
    allowedChildCommands: ["size", "background"],
    shorthandSchema: ["name"]
  },
  {
    name: "size",
    kind: "property",
    shorthandSchema: ["width", "height"]
  },
  {
    name: "background",
    kind: "property",
    shorthandSchema: ["color"]
  },
  {
    name: "plot",
    kind: "geometry",
    shorthandSchema: ["x", "y", "color"]
  },
  {
    name: "line",
    kind: "geometry",
    shorthandSchema: ["x1", "y1", "x2", "y2", "color"]
  }
] satisfies CommandDefinition[];

export const COMMAND_REGISTRY = new Map(
  commandDefinitions.map((definition) => [definition.name, definition])
);

export function getCommandDefinition(
  name: string
): CommandDefinition | undefined {
  return COMMAND_REGISTRY.get(name);
}
