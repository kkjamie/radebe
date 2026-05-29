import { EditorSelection, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
  type ViewUpdate
} from "@codemirror/view";
import {
  formatRadebeColor,
  getRadebeColorTokens,
  parseRadebeColorToken,
  type RadebeRgbaColor
} from "@radebe/core/colors";
import { getCommandDefinition } from "@radebe/core/schema";
import type { RadebeDiagnostic } from "@radebe/core/types";

import { isVariableUsageToken } from "../syntax-highlight.js";

type SourceTokenSpan = {
  text: string;
  from: number;
  to: number;
};

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

export function createSourceDiagnosticDecorations(
  view: EditorView,
  diagnostics: RadebeDiagnostic[]
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const ranges = diagnostics
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

export const setDiagnosticDecorations = StateEffect.define<DecorationSet>();

export const diagnosticDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, transaction) {
    let nextDecorations = decorations.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (effect.is(setDiagnosticDecorations)) {
        nextDecorations = effect.value;
      }
    }

    return nextDecorations;
  },
  provide: (field) => EditorView.decorations.from(field)
});

export const sourceSyntaxHighlighter = ViewPlugin.fromClass(
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

export const sourceColorSwatches = ViewPlugin.fromClass(
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
