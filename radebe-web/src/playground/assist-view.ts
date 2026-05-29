import type {
  LanguageArgumentHelp,
  LanguageCompletionItem,
  LanguageCompletionResult
} from "@radebe/core/language-service";

import { formatArgumentKind, formatArgumentName } from "./assist.js";

export function renderCompletionList(
  completionList: HTMLDivElement,
  items: LanguageCompletionItem[],
  activeCompletionIndex: number,
  applyCompletion: (index: number) => void
): number {
  completionList.replaceChildren();
  completionList.hidden = items.length === 0;

  if (items.length === 0) {
    return activeCompletionIndex;
  }

  const nextActiveCompletionIndex = Math.min(
    Math.max(activeCompletionIndex, 0),
    items.length - 1
  );

  items.slice(0, 12).forEach((item, index) => {
    const option = document.createElement("button");
    const label = document.createElement("span");
    const detail = document.createElement("span");

    option.type = "button";
    option.className = "completion-item";
    option.dataset.active =
      index === nextActiveCompletionIndex ? "true" : "false";
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

  return nextActiveCompletionIndex;
}

export function renderArgumentHelp(
  argumentHelp: HTMLDivElement,
  help: LanguageArgumentHelp | null
): void {
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

export function getVisibleCompletionCount(
  completionList: HTMLDivElement,
  completionResult: LanguageCompletionResult | null
): number {
  return completionList.hidden
    ? 0
    : Math.min(completionResult?.items.length ?? 0, 12);
}
