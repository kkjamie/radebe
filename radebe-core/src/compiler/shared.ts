import {
  getAllowedPropertyCommands,
  getCommandDefinition,
  hasCapability,
  type CommandDefinition
} from "../schema.js";
import { isStrictIntegerTokenText } from "../argument-binding.js";

import type {
  ParsedCommandNode,
  RadebeDiagnostic,
  SolidFill
} from "../types.js";

export interface CompileDrawOptions {
  maskShape?: boolean;
}

export function createCompilerDiagnostic(
  message: string,
  node: Pick<ParsedCommandNode, "lineNumber" | "column">
): RadebeDiagnostic {
  return {
    stage: "compiler",
    message,
    line: node.lineNumber,
    column: node.column
  };
}

export function createMaskShapeFill(): SolidFill {
  return {
    kind: "solid",
    color: "white",
    alpha: 1
  };
}

export function parseArguments(
  node: ParsedCommandNode,
  definition: CommandDefinition
): { values: Map<string, string>; diagnostics: RadebeDiagnostic[] } {
  const values = new Map<string, string>();
  const diagnostics: RadebeDiagnostic[] = [];
  const shorthand = definition.shorthandSchema ?? [];
  let positionalIndex = 0;

  node.args.forEach((token) => {
    const equalsIndex = token.indexOf("=");

    if (equalsIndex > 0) {
      const key = token.slice(0, equalsIndex);
      const value = token.slice(equalsIndex + 1);

      if (value.length === 0) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The ${definition.name} command received an empty value for "${key}".`,
            node
          )
        );
        return;
      }

      if (values.has(key)) {
        diagnostics.push(
          createCompilerDiagnostic(
            `The ${definition.name} command received duplicate "${key}" values.`,
            node
          )
        );
        return;
      }

      values.set(key, value);
      return;
    }

    const shorthandKey = shorthand[positionalIndex];

    if (!shorthandKey) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command received too many positional arguments.`,
          node
        )
      );
      return;
    }

    if (values.has(shorthandKey)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command received duplicate "${shorthandKey}" values.`,
          node
        )
      );
      return;
    }

    values.set(shorthandKey, token);
    positionalIndex += 1;
  });

  return { values, diagnostics };
}

export function setResolvedValue(
  values: Map<string, string>,
  propertyName: string,
  value: string,
  ownerNode: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): void {
  if (values.has(propertyName)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${ownerNode.name} command received duplicate "${propertyName}" values.`,
        ownerNode
      )
    );
    return;
  }

  values.set(propertyName, value);
}

export function readPropertyChildValue(
  child: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): string | null {
  const childDefinition = getCommandDefinition(child.name);

  if (!childDefinition) {
    return null;
  }

  const childArguments = parseArguments(child, childDefinition);
  diagnostics.push(...childArguments.diagnostics);
  const value = childArguments.values.get("value");

  if (!value) {
    diagnostics.push(
      createCompilerDiagnostic(`The ${child.name} command requires "value".`, child)
    );
    return null;
  }

  return value;
}

export function allowsChild(
  parentDefinition: CommandDefinition,
  childDefinition: CommandDefinition
): boolean {
  if (parentDefinition.allowedChildCommands?.includes(childDefinition.name)) {
    return true;
  }

  if (getAllowedPropertyCommands(parentDefinition).includes(childDefinition.name)) {
    return true;
  }

  if (
    parentDefinition.allowedChildCapabilities?.some((capability) =>
      hasCapability(childDefinition, capability)
    )
  ) {
    return true;
  }

  return parentDefinition.allowedChildKinds?.includes(childDefinition.kind) ?? false;
}

export function readRequiredString(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[]
): string | null {
  const value = values.get(key);

  if (!value) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command requires "${key}".`,
        node
      )
    );
    return null;
  }

  return value;
}

export function readOptionalString(
  values: Map<string, string>,
  key: string
): string | null {
  return values.get(key) ?? null;
}

export function readOptionalBoolean(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[]
): boolean | null {
  const token = values.get(key);

  if (token === undefined) {
    return null;
  }

  const normalized = token.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      `The ${node.name} command expects "${key}" to be either "true" or "false".`,
      node
    )
  );
  return null;
}

export function readOptionalNumber(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number; max?: number }
): number | null {
  if (!values.has(key)) {
    return null;
  }

  return readRequiredNumber(node, values, key, diagnostics, options);
}

export function readRequiredInteger(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number }
): number | null {
  const token = readRequiredString(node, values, key, diagnostics);

  if (token === null) {
    return null;
  }

  const value = parseStrictIntegerToken(token);

  if (!Number.isInteger(value)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be an integer.`,
        node
      )
    );
    return null;
  }

  if (options?.min !== undefined && value < options.min) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at least ${options.min}.`,
        node
      )
    );
    return null;
  }

  return value;
}

export function readOptionalInteger(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number }
): number | null {
  if (!values.has(key)) {
    return null;
  }

  return readRequiredInteger(node, values, key, diagnostics, options);
}

export function readRequiredNumber(
  node: ParsedCommandNode,
  values: Map<string, string>,
  key: string,
  diagnostics: RadebeDiagnostic[],
  options?: { min?: number; max?: number }
): number | null {
  const token = readRequiredString(node, values, key, diagnostics);

  if (token === null) {
    return null;
  }

  const value = parseStrictNumberToken(token);

  if (!Number.isFinite(value)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be a number.`,
        node
      )
    );
    return null;
  }

  if (options?.min !== undefined && value < options.min) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at least ${options.min}.`,
        node
      )
    );
    return null;
  }

  if (options?.max !== undefined && value > options.max) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} command expects "${key}" to be at most ${options.max}.`,
        node
      )
    );
    return null;
  }

  return value;
}

export function parseStrictIntegerToken(token: string): number {
  if (!isStrictIntegerTokenText(token)) {
    return Number.NaN;
  }

  return Number.parseInt(token, 10);
}

export function parseStrictNumberToken(token: string): number {
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(token)) {
    return Number.NaN;
  }

  return Number.parseFloat(token);
}

export function validateChildren(
  node: ParsedCommandNode,
  definition: CommandDefinition,
  diagnostics: RadebeDiagnostic[]
): void {
  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      diagnostics.push(
        createCompilerDiagnostic(`Unknown command "${child.name}".`, child)
      );
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${definition.name} command does not allow child command "${child.name}".`,
          child
        )
      );
      return;
    }

    validateChildren(child, childDefinition, diagnostics);
  });
}

export function resolveCommandProperties(
  node: ParsedCommandNode,
  definition: CommandDefinition
): { values: Map<string, string>; diagnostics: RadebeDiagnostic[] } {
  const diagnostics: RadebeDiagnostic[] = [];
  const parsedArguments = parseArguments(node, definition);
  const values = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);
  validateChildren(node, definition, diagnostics);

  node.children.forEach((child) => {
    if (!getAllowedPropertyCommands(definition).includes(child.name)) {
      return;
    }

    const value = readPropertyChildValue(child, diagnostics);

    if (value === null) {
      return;
    }

    setResolvedValue(values, child.name, value, node, diagnostics);
  });

  return {
    values,
    diagnostics
  };
}
