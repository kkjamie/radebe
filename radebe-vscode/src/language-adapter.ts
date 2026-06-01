import {
  getArgumentHelp,
  getCommandDefinition,
  getRadebeColorTokens,
  getEnterIndentation,
  formatRadebeColor,
  getLanguageCompletions,
  getLanguageSmartEdits,
  renderSource,
  type LanguageArgumentHelp,
  type LanguageCompletionResult,
  type LanguagePosition,
  type LanguageSmartEdit,
  type LanguageTextEdit,
  type PipelineResult,
  type RadebeColorToken,
  type RadebeRgbaColor,
  type RadebeDiagnostic,
  type RadebeStage
} from "@radebe/core";

export interface OffsetRange {
  start: number;
  end: number;
}

export interface RadebeDiagnosticRange extends OffsetRange {
  stage: RadebeStage;
  message: string;
  line?: number;
  column?: number;
}

interface SourceTokenSpan extends OffsetRange {
  text: string;
}

function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n");
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

function getLineAt(source: string, lineNumber: number): string {
  return normalizeSource(source).split("\n")[lineNumber - 1] ?? "";
}

function getSourceTokenSpans(
  lineText: string,
  lineStartOffset: number
): SourceTokenSpan[] {
  return [...lineText.matchAll(/\S+/g)].map((match) => {
    const start = lineStartOffset + (match.index ?? 0);

    return {
      text: match[0],
      start,
      end: start + match[0].length
    };
  });
}

function findTokenAtOffset(
  tokens: SourceTokenSpan[],
  offset: number
): SourceTokenSpan | null {
  return (
    tokens.find((token) => token.start <= offset && offset <= token.end) ??
    tokens.find((token) => token.start > offset) ??
    tokens[0] ??
    null
  );
}

function findTokenMatchingValue(
  tokens: SourceTokenSpan[],
  value: string
): SourceTokenSpan | null {
  return (
    tokens.find(
      (token) =>
        token.text === value ||
        (token.text.includes("=") && token.text.split("=").at(-1) === value)
    ) ?? null
  );
}

function findFirstExtraPositionalToken(
  tokens: SourceTokenSpan[]
): SourceTokenSpan | null {
  const commandToken = tokens[0];
  const definition = commandToken ? getCommandDefinition(commandToken.text) : null;
  const shorthandLength = definition?.shorthandSchema?.length ?? 0;
  let positionalIndex = 0;

  for (const token of tokens.slice(1)) {
    if (token.text.includes("=")) {
      continue;
    }

    if (positionalIndex >= shorthandLength) {
      return token;
    }

    positionalIndex += 1;
  }

  return tokens.at(-1) ?? null;
}

function findArgumentTokenByName(
  tokens: SourceTokenSpan[],
  argumentName: string
): SourceTokenSpan | null {
  const commandToken = tokens[0];
  const definition = commandToken ? getCommandDefinition(commandToken.text) : null;
  let positionalIndex = 0;

  for (const token of tokens.slice(1)) {
    const equalsIndex = token.text.indexOf("=");

    if (equalsIndex > 0) {
      if (token.text.slice(0, equalsIndex) === argumentName) {
        return token;
      }

      continue;
    }

    const shorthandName = definition?.shorthandSchema?.[positionalIndex];

    if (shorthandName === argumentName) {
      return token;
    }

    positionalIndex += 1;
  }

  return null;
}

function getReceivedDiagnosticToken(message: string): string | null {
  return message.match(/Received "([^"]+)"/)?.[1] ?? null;
}

function getQuotedDiagnosticToken(message: string): string | null {
  return message.match(/"([^"]+)"/)?.[1] ?? null;
}

function getFallbackDiagnosticRange(
  source: string,
  diagnostic: RadebeDiagnostic
): OffsetRange {
  if (diagnostic.line === undefined) {
    return {
      start: 0,
      end: Math.min(source.length, 1)
    };
  }

  const lineStarts = getLineStartOffsets(source);
  const lineStart = lineStarts[diagnostic.line - 1] ?? 0;
  const lineText = getLineAt(source, diagnostic.line);
  const columnOffset = Math.max((diagnostic.column ?? 1) - 1, 0);
  const start = Math.min(lineStart + columnOffset, lineStart + lineText.length);

  return {
    start,
    end: Math.min(start + 1, lineStart + Math.max(lineText.length, 1))
  };
}

function getDiagnosticTokenRange(
  source: string,
  diagnostic: RadebeDiagnostic
): OffsetRange {
  if (diagnostic.line === undefined || diagnostic.line < 1) {
    return getFallbackDiagnosticRange(source, diagnostic);
  }

  const lineStarts = getLineStartOffsets(source);
  const lineStart = lineStarts[diagnostic.line - 1];

  if (lineStart === undefined) {
    return getFallbackDiagnosticRange(source, diagnostic);
  }

  const lineText = getLineAt(source, diagnostic.line);
  const tokens = getSourceTokenSpans(lineText, lineStart);

  if (tokens.length === 0) {
    return getFallbackDiagnosticRange(source, diagnostic);
  }

  const receivedToken = getReceivedDiagnosticToken(diagnostic.message);
  const quotedToken = getQuotedDiagnosticToken(diagnostic.message);
  const inferredToken =
    (receivedToken ? findTokenMatchingValue(tokens, receivedToken) : null) ??
    (diagnostic.message.includes("too many positional arguments")
      ? findFirstExtraPositionalToken(tokens)
      : null) ??
    (quotedToken ? findArgumentTokenByName(tokens, quotedToken) : null) ??
    (quotedToken ? findTokenMatchingValue(tokens, quotedToken) : null) ??
    findTokenAtOffset(
      tokens,
      lineStart + Math.max((diagnostic.column ?? 1) - 1, 0)
    );

  return inferredToken ?? getFallbackDiagnosticRange(source, diagnostic);
}

export function getLanguagePositionAtOffset(
  source: string,
  offset: number
): LanguagePosition {
  const beforeCursor = source
    .slice(0, Math.max(0, Math.min(offset, source.length)))
    .replace(/\r\n/g, "\n");
  const lines = beforeCursor.split("\n");

  return {
    line: lines.length,
    column: lines[lines.length - 1]!.length + 1
  };
}

export function getCompletionResultAtOffset(
  source: string,
  offset: number
): LanguageCompletionResult {
  return getLanguageCompletions({
    source,
    position: getLanguagePositionAtOffset(source, offset)
  });
}

export function getArgumentHelpAtOffset(
  source: string,
  offset: number
): LanguageArgumentHelp | null {
  return getArgumentHelp({
    source,
    position: getLanguagePositionAtOffset(source, offset)
  });
}

export function getEnterIndentationAtOffset(
  source: string,
  offset: number
): string {
  return getEnterIndentation({
    source,
    position: getLanguagePositionAtOffset(source, offset)
  });
}

export function getSmartEditsAtOffset(
  source: string,
  offset: number
): LanguageSmartEdit[] {
  return getLanguageSmartEdits({
    source,
    position: getLanguagePositionAtOffset(source, offset)
  }).edits;
}

export function getSmartTextEditsAtOffset(
  source: string,
  offset: number
): LanguageTextEdit[] {
  return getSmartEditsAtOffset(source, offset).map((smartEdit) => smartEdit.edit);
}

export function getDiagnosticRanges(source: string): RadebeDiagnosticRange[] {
  const result: PipelineResult = renderSource({ source });

  return result.diagnostics.map((diagnostic) => ({
    ...getDiagnosticTokenRange(source, diagnostic),
    stage: diagnostic.stage,
    message: diagnostic.message,
    line: diagnostic.line,
    column: diagnostic.column
  }));
}

export function getDocumentColors(source: string): RadebeColorToken[] {
  return getRadebeColorTokens(source);
}

export function formatDocumentColor(color: RadebeRgbaColor): string {
  return formatRadebeColor(color);
}

export function formatArgumentKind(
  argument: LanguageArgumentHelp["arguments"][number]
): string {
  return argument.enumValues?.join("|") ?? argument.valueKind;
}

export function formatArgumentName(
  argument: LanguageArgumentHelp["arguments"][number]
): string {
  return argument.required ? argument.name : `${argument.name}?`;
}

export function createRenderPreviewText(source: string): string {
  const result: PipelineResult = renderSource({ source });
  const diagnostics =
    result.diagnostics.length === 0
      ? ["(no diagnostics)"]
      : result.diagnostics.map((diagnostic) => {
          const location =
            diagnostic.line === undefined
              ? diagnostic.stage
              : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

          return `${location} ${diagnostic.message}`;
        });

  return [
    `Radebe rendered image: ${result.artifact.kind}`,
    `Size: ${result.artifact.width}x${result.artifact.height}`,
    `Background: ${result.artifact.background}`,
    "",
    "Rows:",
    ...result.artifact.rows,
    "",
    "Diagnostics:",
    ...diagnostics
  ].join("\n");
}
