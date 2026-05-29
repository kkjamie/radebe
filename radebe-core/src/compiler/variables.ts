import { getCommandDefinition } from "../schema.js";

import type {
  ParsedCommandNode,
  RadebeDiagnostic
} from "../types.js";

import {
  createCompilerDiagnostic,
  readRequiredString,
  resolveCommandProperties,
  validateChildren
} from "./shared.js";

const VARIABLE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const VARIABLE_REFERENCE_PATTERN = /^\$([A-Za-z][A-Za-z0-9_-]*)$/;

export type VariableEnvironment = Map<string, string>;

function resolveVariableToken(
  token: string,
  variables: VariableEnvironment,
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): string | null {
  if (!token.includes("$")) {
    return token;
  }

  const variableMatch = token.match(VARIABLE_REFERENCE_PATTERN);

  if (!variableMatch) {
    diagnostics.push(
      createCompilerDiagnostic(
        `Variable references must occupy a whole value token, such as "$accent". Received "${token}".`,
        node
      )
    );
    return null;
  }

  const variableName = variableMatch[1]!;
  const value = variables.get(variableName);

  if (value === undefined) {
    diagnostics.push(
      createCompilerDiagnostic(`Unknown variable "$${variableName}".`, node)
    );
    return null;
  }

  return value;
}

function resolveVariableArgumentToken(
  token: string,
  variables: VariableEnvironment,
  node: ParsedCommandNode,
  diagnostics: RadebeDiagnostic[]
): string | null {
  const equalsIndex = token.indexOf("=");

  if (equalsIndex > 0) {
    const key = token.slice(0, equalsIndex);
    const value = token.slice(equalsIndex + 1);
    const resolvedValue = resolveVariableToken(value, variables, node, diagnostics);

    return resolvedValue === null ? null : `${key}=${resolvedValue}`;
  }

  return resolveVariableToken(token, variables, node, diagnostics);
}

export function resolveVariableReferencesInNode(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): ParsedCommandNode | null {
  const resolvedArgs: string[] = [];
  const resolvedChildren: ParsedCommandNode[] = [];

  for (const token of node.args) {
    const resolvedToken = resolveVariableArgumentToken(
      token,
      variables,
      node,
      diagnostics
    );

    if (resolvedToken === null) {
      return null;
    }

    resolvedArgs.push(resolvedToken);
  }

  for (const child of node.children) {
    const resolvedChild = resolveVariableReferencesInNode(
      child,
      variables,
      diagnostics
    );

    if (resolvedChild === null) {
      return null;
    }

    resolvedChildren.push(resolvedChild);
  }

  return {
    ...node,
    args: resolvedArgs,
    children: resolvedChildren
  };
}

export function compileVariableDefinition(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): void {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return;
  }

  const resolvedProperties = resolveCommandProperties(node, definition);
  diagnostics.push(...resolvedProperties.diagnostics);

  const name = readRequiredString(
    node,
    resolvedProperties.values,
    "name",
    diagnostics
  );
  const valueToken = readRequiredString(
    node,
    resolvedProperties.values,
    "value",
    diagnostics
  );

  if (name === null || valueToken === null) {
    return;
  }

  if (!VARIABLE_NAME_PATTERN.test(name)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The var command expects "name" to start with a letter and contain only letters, numbers, underscores, or hyphens.`,
        node
      )
    );
    return;
  }

  if (variables.has(name)) {
    diagnostics.push(
      createCompilerDiagnostic(`Variable "$${name}" is already defined.`, node)
    );
    return;
  }

  const value = resolveVariableToken(valueToken, variables, node, diagnostics);

  if (value === null) {
    return;
  }

  variables.set(name, value);
}

export function compileVariableGroup(
  node: ParsedCommandNode,
  variables: VariableEnvironment,
  diagnostics: RadebeDiagnostic[]
): void {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return;
  }

  validateChildren(node, definition, diagnostics);

  node.children.forEach((child) => {
    if (child.name === "var") {
      compileVariableDefinition(child, variables, diagnostics);
    }
  });
}
