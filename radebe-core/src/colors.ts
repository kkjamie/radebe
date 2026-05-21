import {
  getCommandArgumentDefinition,
  getCommandArgumentDefinitions,
  getCommandDefinition,
  getShorthandArgumentDefinitions,
  type CommandArgumentDefinition,
  type CommandDefinition
} from "./schema.js";

export interface RadebeRgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RadebeColorToken {
  text: string;
  start: number;
  end: number;
  color: RadebeRgbaColor;
}

export const RADEBE_NAMED_COLORS: Readonly<Record<string, RadebeRgbaColor>> = {
  black: { r: 0, g: 0, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  white: { r: 255, g: 255, b: 255, a: 1 }
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

interface SourceTokenSpan {
  text: string;
  start: number;
  end: number;
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(token: string): RadebeRgbaColor | null {
  if (!HEX_COLOR_PATTERN.test(token)) {
    return null;
  }

  const hex = token.slice(1);

  if (hex.length === 3 || hex.length === 4) {
    const [r = "", g = "", b = "", a = "f"] = hex.split("");

    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: Number.parseInt(`${a}${a}`, 16) / 255
    };
  }

  const alpha = hex.length === 8 ? hex.slice(6, 8) : "ff";

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: Number.parseInt(alpha, 16) / 255
  };
}

function getLineStartOffsets(source: string): number[] {
  const offsets = [0];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r" && source[index + 1] === "\n") {
      offsets.push(index + 2);
      index += 1;
    } else if (source[index] === "\n") {
      offsets.push(index + 1);
    }
  }

  return offsets;
}

function getLineTokenSpans(
  lineText: string,
  lineStart: number
): SourceTokenSpan[] {
  return [...lineText.matchAll(/\S+/g)].map((match) => {
    const start = lineStart + (match.index ?? 0);

    return {
      text: match[0],
      start,
      end: start + match[0].length
    };
  });
}

function isColorValueArgument(
  commandName: string,
  argument: CommandArgumentDefinition | null
): boolean {
  return (
    argument?.valueKind === "color" ||
    (commandName === "var" && argument?.name === "value")
  );
}

function getPositionalArgumentDefinition(
  definition: CommandDefinition,
  token: SourceTokenSpan,
  positionalIndex: number,
  positionalTokens: SourceTokenSpan[]
): CommandArgumentDefinition | null {
  if (definition.name === "rect-inset") {
    if (
      (positionalTokens.length === 2 && positionalIndex === 1) ||
      (positionalTokens.length === 5 && positionalIndex === 4)
    ) {
      return getCommandArgumentDefinition(definition, "color") ?? null;
    }

    if (positionalTokens.length === 4 || positionalTokens.length === 5) {
      const sideName = ["top", "right", "bottom", "left"][positionalIndex];

      return sideName
        ? getCommandArgumentDefinition(definition, sideName) ?? null
        : null;
    }
  }

  const shorthandArgument =
    getShorthandArgumentDefinitions(definition)[positionalIndex] ?? null;

  if (shorthandArgument !== null) {
    return shorthandArgument;
  }

  const argument = getCommandArgumentDefinitions(definition)[positionalIndex] ?? null;

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
    positionalIndex === positionalTokens.length - 1 &&
    positionalTokens.length > minimumTokenCount &&
    Number.isNaN(Number.parseInt(token.text, 10));

  return isPotentialTrailingToken ? trailingArgument : null;
}

function getColorTokenCandidate(
  commandName: string,
  token: SourceTokenSpan,
  argument: CommandArgumentDefinition | null
): Pick<RadebeColorToken, "start" | "end" | "text" | "color"> | null {
  if (!isColorValueArgument(commandName, argument)) {
    return null;
  }

  const equalsIndex = token.text.indexOf("=");
  const valueText =
    equalsIndex > 0 ? token.text.slice(equalsIndex + 1) : token.text;
  const valueStart =
    equalsIndex > 0 ? token.start + equalsIndex + 1 : token.start;
  const color = parseRadebeColorToken(valueText);

  if (color === null) {
    return null;
  }

  return {
    text: valueText,
    start: valueStart,
    end: valueStart + valueText.length,
    color
  };
}

function getLineColorTokens(
  lineText: string,
  lineStart: number
): RadebeColorToken[] {
  if (lineText.trimStart().startsWith("#")) {
    return [];
  }

  const tokens = getLineTokenSpans(lineText, lineStart);
  const commandToken = tokens[0];
  const definition = commandToken ? getCommandDefinition(commandToken.text) : null;

  if (!commandToken || !definition) {
    return [];
  }

  const argumentTokens = tokens.slice(1);
  const inlineChildName = definition.inlineChildCommand
    ? argumentTokens[0]?.text
    : undefined;
  const inlineChildDefinition =
    inlineChildName &&
    definition.inlineChildCommand?.allowedCommands.includes(inlineChildName)
      ? getCommandDefinition(inlineChildName)
      : undefined;
  const positionalTokens = argumentTokens.filter((token) => {
    return token.text.indexOf("=") <= 0;
  });
  let positionalIndex = 0;
  const colorTokens: RadebeColorToken[] = [];

  argumentTokens.forEach((token, argumentTokenIndex) => {
    const equalsIndex = token.text.indexOf("=");
    const commandForToken =
      inlineChildDefinition && argumentTokenIndex > 0
        ? inlineChildDefinition
        : definition;
    const commandNameForToken =
      inlineChildDefinition && argumentTokenIndex > 0
        ? inlineChildDefinition.name
        : commandToken.text;

    if (equalsIndex > 0) {
      const argumentName = token.text.slice(0, equalsIndex);
      const argument = getCommandArgumentDefinition(commandForToken, argumentName);
      const candidate = getColorTokenCandidate(
        commandNameForToken,
        token,
        argument ?? null
      );

      if (candidate !== null) {
        colorTokens.push(candidate);
      }

      return;
    }

    if (inlineChildDefinition && argumentTokenIndex === 0) {
      positionalIndex += 1;
      return;
    }

    const inlineChildOffset = inlineChildDefinition ? 1 : 0;
    const argument = getPositionalArgumentDefinition(
      commandForToken,
      token,
      Math.max(positionalIndex - inlineChildOffset, 0),
      inlineChildDefinition ? positionalTokens.slice(1) : positionalTokens
    );
    const candidate = getColorTokenCandidate(
      commandNameForToken,
      token,
      argument
    );

    if (candidate !== null) {
      colorTokens.push(candidate);
    }

    positionalIndex += 1;
  });

  return colorTokens;
}

export function parseRadebeColorToken(token: string): RadebeRgbaColor | null {
  const normalized = token.trim().toLowerCase();

  if (normalized.startsWith("#")) {
    return parseHexColor(normalized);
  }

  return RADEBE_NAMED_COLORS[normalized] ?? null;
}

export function formatRadebeColor(color: RadebeRgbaColor): string {
  const r = clampByte(color.r).toString(16).padStart(2, "0");
  const g = clampByte(color.g).toString(16).padStart(2, "0");
  const b = clampByte(color.b).toString(16).padStart(2, "0");
  const alpha = clampByte(clampUnit(color.a) * 255)
    .toString(16)
    .padStart(2, "0");

  return alpha === "ff" ? `#${r}${g}${b}` : `#${r}${g}${b}${alpha}`;
}

export function getRadebeColorTokens(source: string): RadebeColorToken[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const lineStartOffsets = getLineStartOffsets(source);

  return lines.flatMap((lineText, lineIndex) => {
    return getLineColorTokens(lineText, lineStartOffsets[lineIndex] ?? 0);
  });
}
