import { basicSetup } from "codemirror";
import {
  EditorSelection,
  EditorState,
  Prec,
  RangeSetBuilder,
  Transaction,
  type TransactionSpec
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  WidgetType,
  type ViewUpdate
} from "@codemirror/view";
import {
  formatRadebeColor,
  getArgumentHelp,
  getCommandDefinition,
  getEnterIndentation,
  getLanguageCompletions,
  getLanguageSmartEdits,
  getRadebeColorTokens,
  parseRadebeColorToken,
  renderSource,
  type LanguageArgumentHelp,
  type LanguageCompletionItem,
  type LanguageCompletionResult,
  type LanguageServiceRequest,
  type LanguageTextEdit,
  type RadebeDiagnostic,
  type RadebeRgbaColor
} from "@radebe/core";
import { useEffect, useRef } from "preact/hooks";

import { isVariableUsageToken } from "./syntax-highlight.js";
import type { ExamplePlayground } from "./types.js";

type SourceTokenSpan = {
  text: string;
  from: number;
  to: number;
};

function getLanguagePosition(source: string, offset: number): LanguageServiceRequest["position"] {
  const beforeCursor = source.slice(0, offset).replace(/\r\n/g, "\n");
  const lines = beforeCursor.split("\n");

  return {
    line: lines.length,
    column: lines[lines.length - 1]!.length + 1
  };
}

type ArgumentHelpDefinition = LanguageArgumentHelp["arguments"][number];

function formatArgumentKind(argument: ArgumentHelpDefinition): string {
  return argument.enumValues?.join("|") ?? argument.valueKind;
}

function formatArgumentName(argument: ArgumentHelpDefinition): string {
  return argument.required ? argument.name : `${argument.name}?`;
}

function isCompletionRequestShortcut(event: KeyboardEvent): boolean {
  return (
    event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    (event.key === " " || event.code === "Space")
  );
}

function isCursorNavigationKey(event: KeyboardEvent): boolean {
  return [
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "PageUp",
    "PageDown"
  ].includes(event.key);
}

function adjustOffsetForEdit(offset: number, edit: LanguageTextEdit): number {
  if (edit.end <= offset) {
    return offset + edit.text.length - (edit.end - edit.start);
  }

  if (edit.start < offset) {
    return edit.start + edit.text.length;
  }

  return offset;
}

function getSourceTokenSpans(lineText: string, lineFrom: number): SourceTokenSpan[] {
  return [...lineText.matchAll(/\S+/g)].map((match) => {
    const from = lineFrom + (match.index ?? 0);

    return {
      text: match[0],
      from,
      to: from + match[0].length
    };
  });
}

function getCommandTokenSyntaxClass(token: string): string {
  const definition = getCommandDefinition(token);

  if (!definition) {
    return "syntax-unknown";
  }

  return definition.kind === "property"
    ? "syntax-property-command"
    : "syntax-command";
}

function getArgumentTokenSyntaxClass(
  token: string,
  context: { commandName: string; argumentIndex: number }
): string {
  const equalsIndex = token.indexOf("=");

  if (equalsIndex > 0) {
    return "syntax-property";
  }

  if (context.commandName === "var" && context.argumentIndex === 0) {
    return "syntax-variable";
  }

  if (isVariableUsageToken(token)) {
    return "syntax-variable";
  }

  const definition = getCommandDefinition(token);

  if (definition && definition.kind !== "property") {
    return "syntax-child-command";
  }

  return "syntax-value";
}

function createSourceSyntaxDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let position = from;

    while (position <= to) {
      const line = view.state.doc.lineAt(position);
      const lineText = line.text;

      if (lineText.trimStart().startsWith("#")) {
        builder.add(line.from, line.to, Decoration.mark({ class: "syntax-comment" }));
      } else {
        const tokens = getSourceTokenSpans(lineText, line.from);
        let commandName = "";
        let argumentIndex = 0;

        tokens.forEach((token, tokenIndex) => {
          const className =
            tokenIndex === 0
              ? getCommandTokenSyntaxClass(token.text)
              : getArgumentTokenSyntaxClass(token.text, {
                  commandName,
                  argumentIndex
                });

          builder.add(token.from, token.to, Decoration.mark({ class: className }));

          if (tokenIndex === 0) {
            commandName = token.text;
          } else {
            argumentIndex += 1;
          }
        });
      }

      if (line.to >= to || line.number === view.state.doc.lines) {
        break;
      }

      position = line.to + 1;
    }
  }

  return builder.finish();
}

function formatNativeColorInputValue(color: RadebeRgbaColor): string {
  return formatRadebeColor({ ...color, a: 1 });
}

function formatCssColor(color: RadebeRgbaColor): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
}

function applyColorSwatchBackground(element: HTMLElement, color: RadebeRgbaColor): void {
  const cssColor = formatCssColor(color);

  if (color.a >= 1) {
    element.style.background = cssColor;
    element.style.backgroundPosition = "";
    element.style.backgroundSize = "";
    return;
  }

  element.style.background = [
    `linear-gradient(${cssColor}, ${cssColor})`,
    "linear-gradient(45deg, #8b8174 25%, transparent 25%)",
    "linear-gradient(-45deg, #8b8174 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #8b8174 75%)",
    "linear-gradient(-45deg, transparent 75%, #8b8174 75%)"
  ].join(", ");
  element.style.backgroundPosition = "0 0, 0 0, 0 4px, 4px -4px, -4px 0";
  element.style.backgroundSize =
    "100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px";
}

let closeActiveNativeColorPicker: (() => void) | null = null;

function openNativeColorPicker(
  view: EditorView,
  from: number,
  to: number,
  color: RadebeRgbaColor,
  anchor: DOMRect
): void {
  const input = document.createElement("input");

  closeActiveNativeColorPicker?.();

  function cleanup(): void {
    window.removeEventListener("focus", handleWindowFocus);
    input.remove();
    if (closeActiveNativeColorPicker === cleanup) {
      closeActiveNativeColorPicker = null;
    }
  }

  function handleWindowFocus(): void {
    window.setTimeout(cleanup, 0);
  }

  input.type = "color";
  input.className = "source-color-native-picker";
  input.value = formatNativeColorInputValue(color);
  input.style.left = `${Math.round(anchor.left)}px`;
  input.style.top = `${Math.round(anchor.top)}px`;
  input.style.width = `${Math.max(Math.round(anchor.width), 18)}px`;
  input.style.height = `${Math.max(Math.round(anchor.height), 18)}px`;
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.addEventListener("change", () => {
    const nextColor = parseRadebeColorToken(input.value);

    if (nextColor === null) {
      cleanup();
      return;
    }

    const replacement = formatRadebeColor({ ...nextColor, a: color.a });
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: EditorSelection.cursor(from + replacement.length)
    });
    cleanup();
    view.focus();
  });
  input.addEventListener("cancel", cleanup);

  document.body.append(input);
  closeActiveNativeColorPicker = cleanup;
  window.addEventListener("focus", handleWindowFocus);
  input.focus({ preventScroll: true });

  try {
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
    } else {
      input.click();
    }
  } catch {
    input.click();
  }
}

class SourceColorSwatchWidget extends WidgetType {
  constructor(
    readonly from: number,
    readonly to: number,
    readonly tokenText: string,
    readonly color: RadebeRgbaColor
  ) {
    super();
  }

  eq(other: SourceColorSwatchWidget): boolean {
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.tokenText === other.tokenText &&
      formatRadebeColor(this.color) === formatRadebeColor(other.color)
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "source-color-swatch";
    button.title = `Edit color ${this.tokenText}`;
    button.setAttribute("aria-label", `Edit color ${this.tokenText}`);
    applyColorSwatchBackground(button, this.color);
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openNativeColorPicker(
        view,
        this.from,
        this.to,
        this.color,
        button.getBoundingClientRect()
      );
    });

    return button;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function createSourceColorDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const source = view.state.doc.toString();
  const colorTokens = getRadebeColorTokens(source);

  colorTokens.forEach((token) => {
    const isVisible = view.visibleRanges.some((range) => {
      return token.start >= range.from && token.start <= range.to;
    });

    if (!isVisible) {
      return;
    }

    builder.add(
      token.start,
      token.start,
      Decoration.widget({
        side: -1,
        widget: new SourceColorSwatchWidget(
          token.start,
          token.end,
          token.text,
          token.color
        )
      })
    );
  });

  return builder.finish();
}

function findTokenAtOffset(
  tokens: SourceTokenSpan[],
  offset: number
): SourceTokenSpan | null {
  return (
    tokens.find((token) => token.from <= offset && offset <= token.to) ??
    tokens.find((token) => token.from > offset) ??
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

function getDiagnosticTokenRange(
  view: EditorView,
  diagnostic: RadebeDiagnostic
): { from: number; to: number } | null {
  if (
    diagnostic.line === undefined ||
    diagnostic.line < 1 ||
    diagnostic.line > view.state.doc.lines
  ) {
    return null;
  }

  const line = view.state.doc.line(diagnostic.line);
  const tokens = getSourceTokenSpans(line.text, line.from);

  if (tokens.length === 0) {
    return null;
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
      line.from + Math.max((diagnostic.column ?? 1) - 1, 0)
    );

  if (!inferredToken) {
    return null;
  }

  return {
    from: inferredToken.from,
    to: inferredToken.to
  };
}

function createSourceDiagnosticDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const source = view.state.doc.toString();
  const ranges = renderSource({ source }).diagnostics
    .map((diagnostic) => {
      const range = getDiagnosticTokenRange(view, diagnostic);

      return range === null
        ? null
        : {
            ...range,
            message: diagnostic.message
          };
    })
    .filter((range): range is { from: number; to: number; message: string } => {
      return range !== null && range.from < range.to;
    })
    .sort((left, right) => left.from - right.from || left.to - right.to);

  ranges.forEach((range) => {
    builder.add(
      range.from,
      range.to,
      Decoration.mark({
        attributes: { title: range.message },
        class: "diagnostic-squiggle"
      })
    );
  });

  return builder.finish();
}

const sourceSyntaxHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createSourceSyntaxDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createSourceSyntaxDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
);

const sourceDiagnosticHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createSourceDiagnosticDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createSourceDiagnosticDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
);

const sourceColorSwatches = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createSourceColorDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createSourceColorDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
);

export function Playground(props: {
  playground: ExamplePlayground;
  sourceState: Map<string, string>;
  immersive?: boolean;
}) {
  const sourceEditorRef = useRef<HTMLDivElement>(null);
  const sourceAssistRef = useRef<HTMLDivElement>(null);
  const completionListRef = useRef<HTMLDivElement>(null);
  const argumentHelpRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const previewMetaRef = useRef<HTMLParagraphElement>(null);
  const zoomSelectRef = useRef<HTMLSelectElement>(null);
  const diagnosticsOutputRef = useRef<HTMLPreElement>(null);
  const spriteViewportRef = useRef<HTMLDivElement>(null);
  const spriteSurfaceRef = useRef<HTMLDivElement>(null);
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
  const immersive = props.immersive === true;

  useEffect(() => {
    const sourceEditor = sourceEditorRef.current!;
    const sourceAssist = sourceAssistRef.current!;
    const completionList = completionListRef.current!;
    const argumentHelp = argumentHelpRef.current!;
    const status = statusRef.current!;
    const previewMeta = previewMetaRef.current!;
    const zoomSelect = zoomSelectRef.current!;
    const diagnosticsOutput = diagnosticsOutputRef.current!;
    const spriteViewport = spriteViewportRef.current!;
    const spriteSurface = spriteSurfaceRef.current!;
    const spriteCanvas = spriteCanvasRef.current!;

    if (
      !sourceEditor ||
      !sourceAssist ||
      !completionList ||
      !argumentHelp ||
      !status ||
      !previewMeta ||
      !zoomSelect ||
      !diagnosticsOutput ||
      !spriteViewport ||
      !spriteSurface ||
      !spriteCanvas
    ) {
      return;
    }

    sourceEditor.dataset.focused = "false";

    const initialSource =
      props.sourceState.get(props.playground.id) ?? props.playground.source;
    let editorView: EditorView;
    let currentArtifactSize = { width: 1, height: 1 };
    let completionResult: LanguageCompletionResult | null = null;
    let activeCompletionIndex = 0;
    let completionListExplicit = false;
    let completionSuppressedUntilInput = false;
    let suppressAssistForNextChange = false;
    let argumentHelpOpen = false;

    function applyCanvasScale(width: number, height: number): void {
      currentArtifactSize = {
        width: Math.max(width, 1),
        height: Math.max(height, 1)
      };

      let scale = Number.parseInt(zoomSelect.value, 10);

      if (zoomSelect.value === "fit") {
        const viewportWidth = Math.max(spriteViewport.clientWidth - 40, 1);
        const viewportHeight = Math.max(spriteViewport.clientHeight - 40, 1);
        scale = Math.max(
          Math.min(
            Math.floor(
              Math.min(
                viewportWidth / currentArtifactSize.width,
                viewportHeight / currentArtifactSize.height
              )
            ),
            32
          ),
          1
        );
      }

      spriteCanvas.style.width = `${currentArtifactSize.width * scale}px`;
      spriteCanvas.style.height = `${currentArtifactSize.height * scale}px`;
      spriteSurface.style.width = spriteCanvas.style.width;
      spriteSurface.style.height = spriteCanvas.style.height;
    }

    function drawCheckerboardFallback(width: number, height: number): void {
      const context = spriteCanvas.getContext("2d");

      if (!context) {
        return;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#151311";
      context.fillRect(0, 0, width, height);
    }

    function drawSprite(
      pixels: (string | null)[][],
      width: number,
      height: number,
      background: string
    ): void {
      spriteCanvas.width = Math.max(width, 1);
      spriteCanvas.height = Math.max(height, 1);
      applyCanvasScale(width, height);

      const context = spriteCanvas.getContext("2d");

      if (!context) {
        return;
      }

      context.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);

      if (background !== "transparent") {
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }

      pixels.forEach((row, y) => {
        row.forEach((pixel, x) => {
          if (pixel === null) {
            return;
          }

          context.fillStyle = pixel;
          context.fillRect(x, y, 1, 1);
        });
      });
    }

    function getEditorSource(): string {
      return editorView.state.doc.toString();
    }

    function getEditorOffset(): number {
      return editorView.state.selection.main.head;
    }

    function updatePreview(source: string): void {
      const result = renderSource({ source });
      const diagnosticsText = result.diagnostics
        .map((diagnostic) => {
          const location =
            diagnostic.line === undefined
              ? diagnostic.stage
              : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

          return `${location} ${diagnostic.message}`;
        })
        .join("\n");

      status.textContent = `Parsed ${result.parsed.commands.length} root command(s), compiled ${result.compiled.commands.length} draw command(s).`;
      previewMeta.textContent = `Artifact: ${result.artifact.kind} ${result.artifact.width}x${result.artifact.height} background=${result.artifact.background}`;
      diagnosticsOutput.textContent =
        diagnosticsText === "" ? "(no diagnostics)" : diagnosticsText;

      if (result.artifact.width === 0 || result.artifact.height === 0) {
        applyCanvasScale(1, 1);
        drawCheckerboardFallback(1, 1);
      } else {
        drawSprite(
          result.artifact.pixels,
          result.artifact.width,
          result.artifact.height,
          result.artifact.background
        );
      }
    }

    function createLanguageRequestFor(
      source: string,
      offset: number
    ): LanguageServiceRequest {
      return {
        source,
        position: getLanguagePosition(source, offset)
      };
    }

    function createLanguageRequest(): LanguageServiceRequest {
      return createLanguageRequestFor(getEditorSource(), getEditorOffset());
    }

    function shouldShowCompletionList(result: LanguageCompletionResult): boolean {
      return (
        result.items.length > 0 &&
        !completionSuppressedUntilInput &&
        (completionListExplicit || result.context.prefix.length > 0)
      );
    }

    function updateAssistPosition(): void {
      const coords = editorView.coordsAtPos(getEditorOffset());
      const editorRect = sourceEditor.getBoundingClientRect();
      const top =
        coords === null ? 46 : Math.max(14, coords.bottom - editorRect.top + 6);

      sourceAssist.style.top = `${top}px`;
    }

    function renderCompletionList(items: LanguageCompletionItem[]): void {
      completionList.replaceChildren();
      completionList.hidden = items.length === 0;

      if (items.length === 0) {
        return;
      }

      activeCompletionIndex = Math.min(
        Math.max(activeCompletionIndex, 0),
        items.length - 1
      );

      items.slice(0, 12).forEach((item, index) => {
        const option = document.createElement("button");
        const label = document.createElement("span");
        const detail = document.createElement("span");

        option.type = "button";
        option.className = "completion-item";
        option.dataset.active = index === activeCompletionIndex ? "true" : "false";
        label.textContent = item.label;
        detail.className = "completion-detail";
        detail.textContent = item.detail ?? item.kind;
        option.append(label, detail);
        option.addEventListener("mousedown", (event) => {
          event.preventDefault();
          applyCompletion(index);
        });
        completionList.append(option);
      });
    }

    function renderArgumentHelp(help: LanguageArgumentHelp | null): void {
      argumentHelp.replaceChildren();
      argumentHelp.hidden = help === null || help.arguments.length === 0;

      if (help === null || help.arguments.length === 0) {
        return;
      }

      const command = document.createElement("span");
      command.className = "argument-command";
      command.textContent = help.parentCommandName
        ? `${help.parentCommandName} ${help.commandName}`
        : help.commandName;
      argumentHelp.append(command);

      help.arguments.forEach((argument, index) => {
        const token = document.createElement("span");
        const kind = document.createElement("span");

        token.className = "argument-token";
        token.dataset.active = index === help.activeArgumentIndex ? "true" : "false";
        token.append(formatArgumentName(argument));
        kind.className = "argument-kind";
        kind.textContent = `:${formatArgumentKind(argument)}`;
        token.append(kind);
        argumentHelp.append(token);
      });
    }

    function updateAssist(): void {
      if (!editorView.hasFocus) {
        hideAssist();
        return;
      }

      const request = createLanguageRequest();
      completionResult = getLanguageCompletions(request);
      updateAssistPosition();
      renderCompletionList(
        shouldShowCompletionList(completionResult) ? completionResult.items : []
      );
      renderArgumentHelp(argumentHelpOpen ? getArgumentHelp(request) : null);
      sourceAssist.hidden = completionList.hidden && argumentHelp.hidden;
    }

    function showCompletionListNow(): void {
      completionListExplicit = true;
      completionSuppressedUntilInput = false;
      updateAssist();
    }

    function hideAssist(): void {
      completionResult = null;
      completionListExplicit = false;
      completionSuppressedUntilInput = true;
      argumentHelpOpen = false;
      completionList.hidden = true;
      argumentHelp.hidden = true;
      sourceAssist.hidden = true;
    }

    function replaceSourceRange(
      start: number,
      end: number,
      text: string,
      options?: { suppressAssistAfterChange?: boolean }
    ): void {
      const nextCursor = start + text.length;

      suppressAssistForNextChange =
        suppressAssistForNextChange || options?.suppressAssistAfterChange === true;
      editorView.dispatch({
        changes: { from: start, to: end, insert: text },
        selection: EditorSelection.cursor(nextCursor),
        scrollIntoView: true
      });
    }

    function insertAtSelection(
      text: string,
      options?: { suppressAssistAfterChange?: boolean }
    ): void {
      const selection = editorView.state.selection.main;
      replaceSourceRange(selection.from, selection.to, text, options);
    }

    function getSmartTextEditsFor(source: string, offset: number): LanguageTextEdit[] {
      const smartEdits = getLanguageSmartEdits(
        createLanguageRequestFor(source, offset)
      ).edits;

      return smartEdits.map((smartEdit) => smartEdit.edit);
    }

    function getSelectionAfterTextEdits(
      selection: EditorSelection,
      edits: LanguageTextEdit[]
    ): EditorSelection {
      return EditorSelection.create(
        selection.ranges.map((range) =>
          EditorSelection.range(
            edits.reduce(adjustOffsetForEdit, range.anchor),
            edits.reduce(adjustOffsetForEdit, range.head)
          )
        ),
        selection.mainIndex
      );
    }

    function applyCompletion(index: number): void {
      const item = completionResult?.items[index];
      const prefix = completionResult?.context.prefix ?? "";

      if (!item) {
        return;
      }

      const cursor = getEditorOffset();
      completionListExplicit = false;
      completionSuppressedUntilInput = true;
      argumentHelpOpen = false;
      replaceSourceRange(cursor - prefix.length, cursor, item.insertText, {
        suppressAssistAfterChange: true
      });
      editorView.focus();
      hideAssist();
    }

    function handleSourceChange(): void {
      const source = getEditorSource();
      props.sourceState.set(props.playground.id, source);
      updatePreview(source);
      updateAssist();
    }

    function getVisibleCompletionCount(): number {
      return completionList.hidden
        ? 0
        : Math.min(completionResult?.items.length ?? 0, 12);
    }

    function moveActiveCompletion(delta: number): boolean {
      const completionCount = getVisibleCompletionCount();

      if (completionCount === 0) {
        return false;
      }

      activeCompletionIndex =
        (activeCompletionIndex + delta + completionCount) % completionCount;
      renderCompletionList(completionResult?.items ?? []);
      return true;
    }

    function acceptActiveCompletion(): boolean {
      if (getVisibleCompletionCount() === 0) {
        return false;
      }

      applyCompletion(activeCompletionIndex);
      return true;
    }

    function handleTabCommand(): boolean {
      if (acceptActiveCompletion()) {
        return true;
      }

      completionListExplicit = false;
      completionSuppressedUntilInput = false;
      argumentHelpOpen = false;
      insertAtSelection("  ", { suppressAssistAfterChange: true });
      return true;
    }

    function handleEnterCommand(): boolean {
      if (acceptActiveCompletion()) {
        return true;
      }

      completionListExplicit = false;
      completionSuppressedUntilInput = false;
      argumentHelpOpen = false;
      insertAtSelection(`\n${getEnterIndentation(createLanguageRequest())}`, {
        suppressAssistAfterChange: true
      });
      return true;
    }

    function getInsertedText(update: ViewUpdate): string {
      let text = "";

      update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
        text += inserted.toString();
      });

      return text;
    }

    function shouldOpenArgumentHelpAfterUpdate(update: ViewUpdate): boolean {
      const help = getArgumentHelp(createLanguageRequest());

      if (!help) {
        return false;
      }

      if (!update.docChanged) {
        return argumentHelpOpen;
      }

      if (update.transactions.some((transaction) => transaction.isUserEvent("delete"))) {
        return false;
      }

      return /\s/.test(getInsertedText(update)) || argumentHelpOpen;
    }

    function handleEditorKeydown(event: KeyboardEvent): boolean {
      if (event.key === "ArrowDown" && moveActiveCompletion(1)) {
        event.preventDefault();
        return true;
      }

      if (event.key === "ArrowUp" && moveActiveCompletion(-1)) {
        event.preventDefault();
        return true;
      }

      if (event.key === "Escape") {
        hideAssist();
        return false;
      }

      if (isCompletionRequestShortcut(event)) {
        event.preventDefault();
        showCompletionListNow();
        return true;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        return handleTabCommand();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        return handleEnterCommand();
      }

      return false;
    }

    function handleEditorFocus(): void {
      sourceEditor.dataset.focused = "true";
      completionListExplicit = false;
      completionSuppressedUntilInput = true;
      argumentHelpOpen = false;
      updateAssist();
    }

    function handleEditorBlur(): void {
      sourceEditor.dataset.focused = "false";
      window.setTimeout(() => {
        if (!editorView.hasFocus) {
          hideAssist();
        }
      }, 120);
    }

    function handleEditorKeyup(event: KeyboardEvent): void {
      if (isCursorNavigationKey(event)) {
        updateAssist();
      }
    }

    function handleEditorMouseup(): void {
      completionListExplicit = false;
      completionSuppressedUntilInput = true;
      argumentHelpOpen = false;
      updateAssist();
    }

    const radebeEditorKeymap = Prec.highest(
      keymap.of([
        {
          key: "ArrowDown",
          run: () => moveActiveCompletion(1)
        },
        {
          key: "ArrowUp",
          run: () => moveActiveCompletion(-1)
        },
        {
          key: "Ctrl-Space",
          run: () => {
            showCompletionListNow();
            return true;
          }
        },
        {
          key: "Escape",
          run: () => {
            if (sourceAssist.hidden) {
              return false;
            }

            hideAssist();
            return true;
          }
        },
        {
          key: "Tab",
          run: () => handleTabCommand()
        },
        {
          key: "Enter",
          run: () => handleEnterCommand()
        }
      ])
    );

    const smartEditTransactionFilter = EditorState.transactionFilter.of(
      (transaction) => {
        if (
          !transaction.docChanged ||
          transaction.isUserEvent("undo") ||
          transaction.isUserEvent("redo") ||
          transaction.isUserEvent("delete") ||
          transaction.annotation(Transaction.remote) === true ||
          transaction.annotation(Transaction.addToHistory) === false
        ) {
          return transaction as unknown as TransactionSpec;
        }

        const source = transaction.newDoc.toString();
        const smartEdits = getSmartTextEditsFor(
          source,
          transaction.newSelection.main.head
        );

        if (smartEdits.length === 0) {
          return transaction as unknown as TransactionSpec;
        }

        const userEvent = transaction.annotation(Transaction.userEvent);
        const addToHistory = transaction.annotation(Transaction.addToHistory);
        const originalSpec: TransactionSpec = {
          changes: transaction.changes,
          effects: transaction.effects,
          scrollIntoView: transaction.scrollIntoView,
          selection: transaction.selection,
          ...(userEvent === undefined ? {} : { userEvent }),
          ...(addToHistory === undefined
            ? {}
            : { annotations: Transaction.addToHistory.of(addToHistory) })
        };
        const sortedEdits = [...smartEdits].sort(
          (left, right) => left.start - right.start
        );

        return [
          originalSpec,
          {
            changes: sortedEdits.map((edit) => ({
              from: edit.start,
              to: edit.end,
              insert: edit.text
            })),
            selection: getSelectionAfterTextEdits(
              transaction.newSelection,
              smartEdits
            ),
            sequential: true
          }
        ];
      }
    );

    editorView = new EditorView({
      parent: sourceEditor,
      state: EditorState.create({
        doc: initialSource,
        extensions: [
          radebeEditorKeymap,
          basicSetup,
          EditorView.lineWrapping,
          sourceSyntaxHighlighter,
          sourceColorSwatches,
          sourceDiagnosticHighlighter,
          smartEditTransactionFilter,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const suppressAssist = suppressAssistForNextChange;

              suppressAssistForNextChange = false;
              completionListExplicit = false;
              completionSuppressedUntilInput = suppressAssist;
              argumentHelpOpen = suppressAssist
                ? false
                : shouldOpenArgumentHelpAfterUpdate(update);
              handleSourceChange();
              return;
            }

            if (update.selectionSet || update.viewportChanged) {
              updateAssist();
            }
          }),
          EditorView.domEventHandlers({
            blur: () => {
              handleEditorBlur();
            },
            focus: () => {
              handleEditorFocus();
            },
            keydown: (event) => handleEditorKeydown(event),
            keyup: (event) => {
              handleEditorKeyup(event);
            },
            mouseup: () => {
              handleEditorMouseup();
            }
          })
        ]
      })
    });

    function handleZoomChange(): void {
      applyCanvasScale(currentArtifactSize.width, currentArtifactSize.height);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (zoomSelect.value === "fit") {
        applyCanvasScale(currentArtifactSize.width, currentArtifactSize.height);
      }
    });

    zoomSelect.addEventListener("change", handleZoomChange);
    resizeObserver.observe(spriteViewport);
    updatePreview(initialSource);

    return () => {
      zoomSelect.removeEventListener("change", handleZoomChange);
      resizeObserver.disconnect();
      editorView.destroy();
    };
  }, [props.playground.id, props.playground.source, props.sourceState]);

  return (
    <section className={`playground${immersive ? " playground--immersive" : ""}`}>
      <h3 className="playground-title">{props.playground.title}</h3>
      <p className="playground-summary">{props.playground.summary}</p>
      <section className="playground-layout">
        <article className="playground-panel editor-panel">
          <div className="source-label">
            Source
            <div className="source-editor" ref={sourceEditorRef}>
              <div className="editor-assist" hidden ref={sourceAssistRef}>
                <div className="completion-list" hidden ref={completionListRef} />
                <div className="argument-help" hidden ref={argumentHelpRef} />
              </div>
            </div>
          </div>
          <p className="playground-status" ref={statusRef} />
        </article>
        <article className="playground-panel preview-panel">
          <h4 className="preview-heading">Preview</h4>
          <div className="preview-toolbar">
            <p className="preview-meta" ref={previewMetaRef} />
            <label className="zoom-label">
              Zoom
              <select className="zoom-select" defaultValue="fit" ref={zoomSelectRef}>
                <option value="fit">Fit</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
                <option value="8">8x</option>
              </select>
            </label>
          </div>
          <div className="sprite-viewport canvas-checkerboard" ref={spriteViewportRef}>
            <div className="sprite-surface canvas-checkerboard" ref={spriteSurfaceRef}>
              <canvas className="sprite-canvas" ref={spriteCanvasRef} />
            </div>
          </div>
          <h4 className="diagnostics-heading">Diagnostics</h4>
          <pre className="diagnostics-output" ref={diagnosticsOutputRef} />
        </article>
      </section>
    </section>
  );
}
