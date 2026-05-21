import { getCommandDefinition } from "@radebe/core";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function spanSyntax(className: string, value: string): string {
  return `<span class="${className}">${escapeHtml(value)}</span>`;
}

function highlightCommandToken(token: string): string {
  const definition = getCommandDefinition(token);

  if (!definition) {
    return spanSyntax("syntax-unknown", token);
  }

  if (definition.kind === "property") {
    return spanSyntax("syntax-property-command", token);
  }

  return spanSyntax("syntax-command", token);
}

export function isVariableUsageToken(token: string): boolean {
  return /^\$[A-Za-z][A-Za-z0-9_-]*$/.test(token);
}

function highlightValueToken(token: string): string {
  return isVariableUsageToken(token)
    ? spanSyntax("syntax-variable", token)
    : spanSyntax("syntax-value", token);
}

function highlightArgumentToken(
  token: string,
  context: { commandName: string; argumentIndex: number }
): string {
  const equalsIndex = token.indexOf("=");

  if (equalsIndex > 0) {
    const key = token.slice(0, equalsIndex);
    const value = token.slice(equalsIndex + 1);
    const valueClass =
      context.commandName === "var" && key === "name"
        ? "syntax-variable"
        : isVariableUsageToken(value)
          ? "syntax-variable"
          : "syntax-value";

    return [
      spanSyntax("syntax-property", key),
      spanSyntax("syntax-punctuation", "="),
      value.length === 0 ? "" : spanSyntax(valueClass, value)
    ].join("");
  }

  if (context.commandName === "var" && context.argumentIndex === 0) {
    return spanSyntax("syntax-variable", token);
  }

  if (isVariableUsageToken(token)) {
    return spanSyntax("syntax-variable", token);
  }

  const definition = getCommandDefinition(token);

  if (definition && definition.kind !== "property") {
    return spanSyntax("syntax-child-command", token);
  }

  return highlightValueToken(token);
}

function highlightSourceLine(line: string): string {
  if (line.trimStart().startsWith("#")) {
    return spanSyntax("syntax-comment", line);
  }

  const tokens = line.match(/\s+|\S+/g) ?? [];
  let hasCommandToken = false;
  let commandName = "";
  let argumentIndex = 0;

  return tokens
    .map((token) => {
      if (/^\s+$/.test(token)) {
        return escapeHtml(token);
      }

      if (!hasCommandToken) {
        hasCommandToken = true;
        commandName = token;
        return highlightCommandToken(token);
      }

      const highlighted = highlightArgumentToken(token, {
        commandName,
        argumentIndex
      });
      argumentIndex += 1;
      return highlighted;
    })
    .join("");
}

export function highlightSource(source: string): string {
  const highlighted = source
    .split("\n")
    .map(highlightSourceLine)
    .join("\n");

  if (highlighted.length === 0) {
    return " ";
  }

  return source.endsWith("\n") ? `${highlighted} ` : highlighted;
}
