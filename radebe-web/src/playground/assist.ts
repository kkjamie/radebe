import type {
  LanguageArgumentHelp,
  LanguageServiceRequest,
  LanguageTextEdit
} from "@radebe/core/language-service";

type ArgumentHelpDefinition = LanguageArgumentHelp["arguments"][number];

export function getLanguagePosition(
  source: string,
  offset: number
): LanguageServiceRequest["position"] {
  const beforeCursor = source.slice(0, offset).replace(/\r\n/g, "\n");
  const lines = beforeCursor.split("\n");

  return {
    line: lines.length,
    column: lines[lines.length - 1]!.length + 1
  };
}

export function formatArgumentKind(argument: ArgumentHelpDefinition): string {
  return argument.enumValues?.join("|") ?? argument.valueKind;
}

export function formatArgumentName(argument: ArgumentHelpDefinition): string {
  return argument.required ? argument.name : `${argument.name}?`;
}

export function isCompletionRequestShortcut(event: KeyboardEvent): boolean {
  return (
    event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    (event.key === " " || event.code === "Space")
  );
}

export function isCursorNavigationKey(event: KeyboardEvent): boolean {
  return [
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "PageUp",
    "PageDown"
  ].includes(event.key);
}

export function adjustOffsetForEdit(
  offset: number,
  edit: LanguageTextEdit
): number {
  if (edit.end <= offset) {
    return offset + edit.text.length - (edit.end - edit.start);
  }

  if (edit.start < offset) {
    return edit.start + edit.text.length;
  }

  return offset;
}
