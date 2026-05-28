import {
  getCommandArgumentDefinition,
  getCommandArgumentDefinitions,
  getShorthandArgumentDefinitions,
  type CommandArgumentDefinition,
  type CommandDefinition
} from "./schema.js";

const RECT_INSET_POSITIONS = ["top", "right", "bottom", "left"] as const;

export function isStrictIntegerTokenText(token: string): boolean {
  return /^-?\d+$/.test(token);
}

function getRectInsetPositionalArgumentName(
  positionalCount: number,
  positionalIndex: number
): string | null {
  if (positionalIndex < 0 || positionalIndex >= positionalCount) {
    return null;
  }

  if (positionalCount === 1) {
    return positionalIndex === 0 ? "inset" : null;
  }

  if (positionalCount === 2) {
    return positionalIndex === 0 ? "inset" : "color";
  }

  if (positionalCount === 4 || positionalCount === 5) {
    if (positionalIndex === 4) {
      return "color";
    }

    return RECT_INSET_POSITIONS[positionalIndex] ?? null;
  }

  return null;
}

export function getPositionalArgumentDefinitionForBinding(
  definition: CommandDefinition,
  positionalTokenTexts: string[],
  positionalIndex: number,
  options?: {
    positionalCount?: number;
    activeTokenText?: string;
  }
): CommandArgumentDefinition | null {
  const positionalCount = options?.positionalCount ?? positionalTokenTexts.length;
  const activeTokenText =
    options?.activeTokenText ?? positionalTokenTexts[positionalIndex] ?? "";

  if (definition.name === "rect-inset") {
    const argumentName = getRectInsetPositionalArgumentName(
      positionalCount,
      positionalIndex
    );

    return argumentName
      ? getCommandArgumentDefinition(definition, argumentName) ?? null
      : null;
  }

  const shorthandArgument =
    getShorthandArgumentDefinitions(definition)[positionalIndex] ?? null;

  if (shorthandArgument !== null) {
    return shorthandArgument;
  }

  const argument =
    getCommandArgumentDefinitions(definition)[positionalIndex] ?? null;

  if (argument !== null) {
    return argument;
  }

  const variadic = definition.variadicArguments;
  const trailingArgument = variadic?.trailingArgument;

  if (!variadic || !trailingArgument) {
    return null;
  }

  const minimumTokenCount = (variadic.minRepeats ?? 0) * variadic.sequence.length;
  const isPotentialTrailingToken =
    positionalIndex === positionalCount - 1 &&
    positionalCount > minimumTokenCount &&
    activeTokenText.length > 0 &&
    !isStrictIntegerTokenText(activeTokenText);

  return isPotentialTrailingToken ? trailingArgument : null;
}
