import {
  FILE_DEFINITION,
  getAllowedChildCommandDefinitions,
  getCommandArgumentDefinition,
  getCommandArgumentDefinitions,
  getCommandDefinition,
  getShorthandArgumentDefinitions,
  type CommandArgumentDefinition,
  type CommandDefinition
} from "./schema.js";

const INDENT = "  ";

export interface LanguagePosition {
  line: number;
  column: number;
}

export interface LanguageServiceRequest {
  source: string;
  position: LanguagePosition;
}

export type CursorMode = "argument" | "command" | "comment";

export interface LanguageCursorContext {
  line: number;
  column: number;
  lineText: string;
  indent: string;
  indentLevel: number;
  mode: CursorMode;
  prefix: string;
  commandName: string | null;
  parentCommandName: string;
}

export type LanguageCompletionKind =
  | "argument-name"
  | "command"
  | "enum-value"
  | "inline-command";

export interface LanguageCompletionItem {
  label: string;
  kind: LanguageCompletionKind;
  insertText: string;
  detail?: string;
}

export interface LanguageCompletionResult {
  context: LanguageCursorContext;
  items: LanguageCompletionItem[];
}

export type LanguageArgumentMode =
  | "inline-child"
  | "named"
  | "positional";

export interface LanguageArgumentHelp {
  commandName: string;
  parentCommandName?: string;
  mode: LanguageArgumentMode;
  activeArgumentIndex: number;
  activeArgument: CommandArgumentDefinition | null;
  arguments: CommandArgumentDefinition[];
  valuePrefix: string;
}

interface TokenSpan {
  text: string;
  start: number;
  end: number;
}

interface InternalContext extends LanguageCursorContext {
  tokens: TokenSpan[];
  commandDefinition: CommandDefinition | null;
  parentDefinition: CommandDefinition | null;
}

interface ArgumentTokenState {
  activeArgumentIndex: number;
  argumentTokens: TokenSpan[];
  currentToken: TokenSpan | null;
  tokenPrefix: string;
}

function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n");
}

function getSourceLines(source: string): string[] {
  return normalizeSource(source).split("\n");
}

function getLineTokens(lineText: string): TokenSpan[] {
  return [...lineText.matchAll(/\S+/g)].map((match) => {
    const text = match[0];
    const start = (match.index ?? 0) + 1;

    return {
      text,
      start,
      end: start + text.length
    };
  });
}

function getIndent(lineText: string): string {
  return lineText.match(/^[ ]*/)?.[0] ?? "";
}

function getIndentLevel(lineText: string): number {
  return Math.floor(getIndent(lineText).length / INDENT.length);
}

function isIgnoredLine(lineText: string): boolean {
  const trimmed = lineText.trim();
  return trimmed.length === 0 || trimmed.startsWith("#");
}

function clampPosition(
  lines: string[],
  position: LanguagePosition
): LanguagePosition {
  const line = Math.min(Math.max(position.line, 1), Math.max(lines.length, 1));
  const lineText = lines[line - 1] ?? "";
  const column = Math.min(Math.max(position.column, 1), lineText.length + 1);

  return { line, column };
}

function findParentDefinition(
  lines: string[],
  lineIndex: number,
  indentLevel: number
): CommandDefinition | null {
  if (indentLevel === 0) {
    return FILE_DEFINITION;
  }

  const stack: Array<CommandDefinition | null> = [];

  for (let index = 0; index < lineIndex; index += 1) {
    const lineText = lines[index] ?? "";

    if (isIgnoredLine(lineText)) {
      continue;
    }

    const [commandName] = lineText.trim().split(/\s+/);

    if (!commandName) {
      continue;
    }

    const commandIndentLevel = getIndentLevel(lineText);
    stack.length = commandIndentLevel;
    stack[commandIndentLevel] = getCommandDefinition(commandName) ?? null;
  }

  return stack[indentLevel - 1] ?? null;
}

function getTokenPrefix(token: TokenSpan, column: number): string {
  const length = Math.max(Math.min(column - token.start, token.text.length), 0);
  return token.text.slice(0, length);
}

function isCommandMode(tokens: TokenSpan[], column: number): boolean {
  if (tokens.length === 0) {
    return true;
  }

  const commandToken = tokens[0]!;
  return column <= commandToken.end;
}

function createPublicContext(context: InternalContext): LanguageCursorContext {
  return {
    line: context.line,
    column: context.column,
    lineText: context.lineText,
    indent: context.indent,
    indentLevel: context.indentLevel,
    mode: context.mode,
    prefix: context.prefix,
    commandName: context.commandName,
    parentCommandName: context.parentCommandName
  };
}

function getInternalContext(request: LanguageServiceRequest): InternalContext {
  const lines = getSourceLines(request.source);
  const position = clampPosition(lines, request.position);
  const lineText = lines[position.line - 1] ?? "";
  const tokens = getLineTokens(lineText);
  const indent = getIndent(lineText);
  const indentLevel = getIndentLevel(lineText);
  const parentDefinition = findParentDefinition(
    lines,
    position.line - 1,
    indentLevel
  );

  if (lineText.trimStart().startsWith("#")) {
    return {
      line: position.line,
      column: position.column,
      lineText,
      indent,
      indentLevel,
      mode: "comment",
      prefix: "",
      commandName: null,
      parentCommandName: parentDefinition?.name ?? FILE_DEFINITION.name,
      tokens,
      commandDefinition: null,
      parentDefinition
    };
  }

  const commandToken = tokens[0] ?? null;
  const commandName = commandToken?.text ?? null;
  const commandDefinition =
    commandName === null ? null : getCommandDefinition(commandName) ?? null;

  if (isCommandMode(tokens, position.column)) {
    return {
      line: position.line,
      column: position.column,
      lineText,
      indent,
      indentLevel,
      mode: "command",
      prefix:
        commandToken === null ? "" : getTokenPrefix(commandToken, position.column),
      commandName,
      parentCommandName: parentDefinition?.name ?? FILE_DEFINITION.name,
      tokens,
      commandDefinition,
      parentDefinition
    };
  }

  const argumentState = getArgumentTokenState(tokens, position.column);

  return {
    line: position.line,
    column: position.column,
    lineText,
    indent,
    indentLevel,
    mode: "argument",
    prefix: argumentState.tokenPrefix,
    commandName,
    parentCommandName: parentDefinition?.name ?? FILE_DEFINITION.name,
    tokens,
    commandDefinition,
    parentDefinition
  };
}

function getArgumentTokenState(
  tokens: TokenSpan[],
  column: number
): ArgumentTokenState {
  const argumentTokens = tokens.slice(1);
  const currentToken =
    argumentTokens.find((token) => column >= token.start && column <= token.end) ??
    null;

  if (currentToken !== null) {
    return {
      activeArgumentIndex: argumentTokens.indexOf(currentToken),
      argumentTokens,
      currentToken,
      tokenPrefix: getTokenPrefix(currentToken, column)
    };
  }

  return {
    activeArgumentIndex: argumentTokens.filter((token) => token.end < column).length,
    argumentTokens,
    currentToken,
    tokenPrefix: ""
  };
}

function createSyntheticEnumArgument(
  name: string,
  enumValues: string[]
): CommandArgumentDefinition {
  return {
    name,
    valueKind: "enum",
    enumValues
  };
}

function getContextualArguments(
  commandDefinition: CommandDefinition,
  parentDefinition: CommandDefinition | null
): CommandArgumentDefinition[] {
  if (commandDefinition.kind === "property" && parentDefinition !== null) {
    const parentArgument = getCommandArgumentDefinition(
      parentDefinition,
      commandDefinition.name
    );

    if (parentArgument) {
      return [parentArgument];
    }
  }

  return getCommandArgumentDefinitions(commandDefinition);
}

function getContextualShorthandArguments(
  commandDefinition: CommandDefinition,
  parentDefinition: CommandDefinition | null
): CommandArgumentDefinition[] {
  if (commandDefinition.kind === "property" && parentDefinition !== null) {
    const parentArgument = getCommandArgumentDefinition(
      parentDefinition,
      commandDefinition.name
    );

    if (parentArgument) {
      return [parentArgument];
    }
  }

  return getShorthandArgumentDefinitions(commandDefinition);
}

function getNamedArgumentHelp(
  context: InternalContext,
  token: TokenSpan,
  column: number
): LanguageArgumentHelp | null {
  const commandDefinition = context.commandDefinition;

  if (!commandDefinition) {
    return null;
  }

  const equalsIndex = token.text.indexOf("=");

  if (equalsIndex <= 0) {
    return null;
  }

  const key = token.text.slice(0, equalsIndex);
  const valueStart = token.start + equalsIndex + 1;
  const valueLength = Math.max(Math.min(column - valueStart, token.text.length), 0);
  const allArguments = getContextualArguments(
    commandDefinition,
    context.parentDefinition
  );

  return {
    commandName: commandDefinition.name,
    mode: "named",
    activeArgumentIndex: allArguments.findIndex((argument) => argument.name === key),
    activeArgument:
      allArguments.find((argument) => argument.name === key) ?? null,
    arguments: allArguments,
    valuePrefix: token.text.slice(equalsIndex + 1, equalsIndex + 1 + valueLength)
  };
}

function getVariadicArgumentHelp(
  context: InternalContext,
  argumentState: ArgumentTokenState
): LanguageArgumentHelp | null {
  const commandDefinition = context.commandDefinition;
  const variadic = commandDefinition?.variadicArguments;

  if (!commandDefinition || !variadic) {
    return null;
  }

  const sequence = variadic.sequence;
  const minimumSequenceLength = (variadic.minRepeats ?? 0) * sequence.length;
  const currentToken = argumentState.currentToken;
  const activeIndex = argumentState.activeArgumentIndex;
  const activeTokenText = currentToken?.text ?? "";
  const shouldUseTrailingArgument =
    variadic.trailingArgument !== undefined &&
    activeIndex >= minimumSequenceLength &&
    activeTokenText.length > 0 &&
    Number.isNaN(Number.parseInt(activeTokenText, 10));
  const activeArgument = shouldUseTrailingArgument
    ? variadic.trailingArgument!
    : sequence[activeIndex % sequence.length] ?? null;

  return {
    commandName: commandDefinition.name,
    mode: "positional",
    activeArgumentIndex: activeIndex,
    activeArgument,
    arguments: sequence,
    valuePrefix: argumentState.tokenPrefix
  };
}

function getInlineChildArgumentHelp(
  context: InternalContext,
  argumentState: ArgumentTokenState
): LanguageArgumentHelp | null {
  const commandDefinition = context.commandDefinition;
  const inlineChild = commandDefinition?.inlineChildCommand;

  if (!commandDefinition || !inlineChild) {
    return null;
  }

  const firstArgument = argumentState.argumentTokens[0]?.text ?? "";

  if (
    argumentState.activeArgumentIndex === 0 ||
    !inlineChild.allowedCommands.includes(firstArgument)
  ) {
    const activeArgument = createSyntheticEnumArgument(
      inlineChild.argumentName,
      inlineChild.allowedCommands
    );

    return {
      commandName: commandDefinition.name,
      mode: "inline-child",
      activeArgumentIndex: 0,
      activeArgument,
      arguments: [activeArgument],
      valuePrefix: argumentState.tokenPrefix
    };
  }

  const childDefinition = getCommandDefinition(firstArgument);

  if (!childDefinition) {
    return null;
  }

  const childArguments = getShorthandArgumentDefinitions(childDefinition);
  const childArgumentIndex = argumentState.activeArgumentIndex - 1;

  return {
    commandName: childDefinition.name,
    parentCommandName: commandDefinition.name,
    mode: "positional",
    activeArgumentIndex: childArgumentIndex,
    activeArgument: childArguments[childArgumentIndex] ?? null,
    arguments: childArguments,
    valuePrefix: argumentState.tokenPrefix
  };
}

function getPositionalArgumentHelp(
  context: InternalContext,
  argumentState: ArgumentTokenState
): LanguageArgumentHelp | null {
  const commandDefinition = context.commandDefinition;

  if (!commandDefinition) {
    return null;
  }

  const argumentsForCommand = getContextualShorthandArguments(
    commandDefinition,
    context.parentDefinition
  );

  return {
    commandName: commandDefinition.name,
    mode: "positional",
    activeArgumentIndex: argumentState.activeArgumentIndex,
    activeArgument: argumentsForCommand[argumentState.activeArgumentIndex] ?? null,
    arguments: argumentsForCommand,
    valuePrefix: argumentState.tokenPrefix
  };
}

function getArgumentHelpFromContext(
  context: InternalContext
): LanguageArgumentHelp | null {
  if (context.mode !== "argument" || !context.commandDefinition) {
    return null;
  }

  const argumentState = getArgumentTokenState(context.tokens, context.column);

  if (argumentState.currentToken) {
    const namedHelp = getNamedArgumentHelp(
      context,
      argumentState.currentToken,
      context.column
    );

    if (namedHelp) {
      return namedHelp;
    }
  }

  return (
    getInlineChildArgumentHelp(context, argumentState) ??
    getVariadicArgumentHelp(context, argumentState) ??
    getPositionalArgumentHelp(context, argumentState)
  );
}

function createCommandCompletions(
  context: InternalContext
): LanguageCompletionItem[] {
  const parentDefinition = context.parentDefinition;

  if (!parentDefinition) {
    return [];
  }

  return getAllowedChildCommandDefinitions(parentDefinition)
    .filter((child) => child.definition.name.startsWith(context.prefix))
    .map((child) => ({
      label: child.definition.name,
      kind: "command",
      insertText: child.definition.name,
      detail: `${child.definition.kind} command`
    }));
}

function getUsedNamedArguments(argumentTokens: TokenSpan[]): Set<string> {
  const names = new Set<string>();

  argumentTokens.forEach((token) => {
    const equalsIndex = token.text.indexOf("=");

    if (equalsIndex > 0) {
      names.add(token.text.slice(0, equalsIndex));
    }
  });

  return names;
}

function createArgumentNameCompletions(
  context: InternalContext,
  argumentState: ArgumentTokenState
): LanguageCompletionItem[] {
  if (!context.commandDefinition || argumentState.currentToken === null) {
    return [];
  }

  const prefix = argumentState.tokenPrefix;

  if (!/^[A-Za-z-]+$/.test(prefix) || prefix.includes("=")) {
    return [];
  }

  const usedNamedArguments = getUsedNamedArguments(argumentState.argumentTokens);

  return getContextualArguments(
    context.commandDefinition,
    context.parentDefinition
  )
    .filter((argument) => !usedNamedArguments.has(argument.name))
    .filter((argument) => argument.name.startsWith(prefix))
    .map((argument) => ({
      label: `${argument.name}=`,
      kind: "argument-name",
      insertText: `${argument.name}=`,
      detail: argument.valueKind
    }));
}

function createValueCompletions(
  help: LanguageArgumentHelp | null
): LanguageCompletionItem[] {
  const activeArgument = help?.activeArgument;

  if (!help || !activeArgument?.enumValues) {
    return [];
  }

  const kind: LanguageCompletionKind =
    help.mode === "inline-child" ? "inline-command" : "enum-value";

  return activeArgument.enumValues
    .filter((value) => value.startsWith(help.valuePrefix))
    .map((value) => ({
      label: value,
      kind,
      insertText: value,
      detail: activeArgument.name
    }));
}

export function getLanguageContext(
  request: LanguageServiceRequest
): LanguageCursorContext {
  return createPublicContext(getInternalContext(request));
}

export function getArgumentHelp(
  request: LanguageServiceRequest
): LanguageArgumentHelp | null {
  return getArgumentHelpFromContext(getInternalContext(request));
}

export function getLanguageCompletions(
  request: LanguageServiceRequest
): LanguageCompletionResult {
  const context = getInternalContext(request);

  if (context.mode === "comment") {
    return {
      context: createPublicContext(context),
      items: []
    };
  }

  if (context.mode === "command") {
    return {
      context: createPublicContext(context),
      items: createCommandCompletions(context)
    };
  }

  const argumentState = getArgumentTokenState(context.tokens, context.column);
  const help = getArgumentHelpFromContext(context);

  return {
    context: createPublicContext(context),
    items: [
      ...createValueCompletions(help),
      ...createArgumentNameCompletions(context, argumentState)
    ]
  };
}

export function getEnterIndentation(request: LanguageServiceRequest): string {
  const context = getInternalContext(request);

  if (context.mode === "comment" || context.tokens.length === 0) {
    return context.indent;
  }

  const definition = context.commandDefinition;

  if (!definition) {
    return context.indent;
  }

  const argumentCount = context.tokens.length - 1;
  const behavior = definition.editorHints?.indentBehavior ?? "same";

  if (behavior === "child") {
    return `${context.indent}${INDENT}`;
  }

  if (behavior === "child-when-no-args" && argumentCount === 0) {
    return `${context.indent}${INDENT}`;
  }

  return context.indent;
}
