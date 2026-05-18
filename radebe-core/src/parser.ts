import type {
  ParseResult,
  ParsedCommandNode,
  ParsedLine,
  RadebeDiagnostic,
  SourceDocument
} from "./types.js";

function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n");
}

function createParserDiagnostic(
  message: string,
  lineNumber: number,
  column = 1
): RadebeDiagnostic {
  return {
    stage: "parser",
    message,
    line: lineNumber,
    column
  };
}

function isCommentLine(trimmed: string): boolean {
  return trimmed.startsWith("//") || trimmed.startsWith("#");
}

function parseCommandNode(
  text: string,
  lineNumber: number,
  indentLevel: number,
  column: number
): ParsedCommandNode {
  const [name = "", ...args] = text.trim().split(/\s+/);

  return {
    name,
    args,
    children: [],
    lineNumber,
    column,
    indentLevel
  };
}

export function parseSource(request: SourceDocument): ParseResult {
  const normalizedSource = normalizeSource(request.source);
  const lines = normalizedSource === "" ? [] : normalizedSource.split("\n");
  const parsedLines: ParsedLine[] = lines.map((text, index) => ({
    lineNumber: index + 1,
    text
  }));
  const diagnostics: RadebeDiagnostic[] = [];
  const commands: ParsedCommandNode[] = [];
  const commandStack: ParsedCommandNode[] = [];

  parsedLines.forEach((line) => {
    const trimmed = line.text.trim();

    if (trimmed.length === 0 || isCommentLine(trimmed)) {
      return;
    }

    const leadingWhitespaceMatch = line.text.match(/^[\t ]*/);
    const leadingWhitespace = leadingWhitespaceMatch?.[0] ?? "";

    if (leadingWhitespace.includes("\t")) {
      diagnostics.push(
        createParserDiagnostic(
          "Tabs are not supported for indentation. Use spaces only.",
          line.lineNumber
        )
      );
      return;
    }

    const leadingSpaces = leadingWhitespace.length;

    if (leadingSpaces % 2 !== 0) {
      diagnostics.push(
        createParserDiagnostic(
          "Indentation must use whole two-space levels.",
          line.lineNumber,
          1
        )
      );
    }

    let indentLevel = Math.floor(leadingSpaces / 2);

    if (indentLevel > commandStack.length) {
      diagnostics.push(
        createParserDiagnostic(
          "Indentation cannot jump more than one level at a time.",
          line.lineNumber,
          leadingSpaces + 1
        )
      );
      indentLevel = commandStack.length;
    }

    commandStack.length = indentLevel;

    const node = parseCommandNode(
      line.text,
      line.lineNumber,
      indentLevel,
      leadingSpaces + 1
    );

    if (indentLevel === 0) {
      commands.push(node);
    } else {
      commandStack[indentLevel - 1]?.children.push(node);
    }

    commandStack[indentLevel] = node;
  });

  return {
    document: {
      kind: "parsed-document",
      source: normalizedSource,
      lines: parsedLines,
      commands
    },
    diagnostics
  };
}
