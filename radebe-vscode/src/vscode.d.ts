declare module "vscode" {
  export const commands: any;
  export const CompletionItemKind: any;
  export const DiagnosticSeverity: any;
  export const languages: any;
  export const SignatureHelpTriggerKind: any;
  export const ViewColumn: any;
  export const window: any;
  export const workspace: any;

  export class CompletionItem {
    detail?: string;
    insertText?: string;
    range?: Range;
    sortText?: string;
    constructor(label: string, kind?: any);
  }

  export class Color {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
    readonly alpha: number;
    constructor(red: number, green: number, blue: number, alpha: number);
  }

  export class ColorInformation {
    readonly range: Range;
    readonly color: Color;
    constructor(range: Range, color: Color);
  }

  export class ColorPresentation {
    label: string;
    constructor(label: string);
  }

  export class Diagnostic {
    code?: string | number;
    source?: string;
    constructor(range: Range, message: string, severity?: any);
  }

  export class MarkdownString {
    appendCodeblock(value: string, language?: string): MarkdownString;
    appendMarkdown(value: string): MarkdownString;
  }

  export class ParameterInformation {
    constructor(label: string, documentation?: string);
  }

  export class Position {
    readonly line: number;
    readonly character: number;
    constructor(line: number, character: number);
    translate(lineDelta?: number, characterDelta?: number): Position;
  }

  export class Range {
    readonly start: Position;
    readonly end: Position;
    constructor(start: Position, end: Position);
    constructor(
      startLine: number,
      startCharacter: number,
      endLine: number,
      endCharacter: number
    );
  }

  export class SignatureHelp {
    activeParameter: number;
    activeSignature: number;
    signatures: SignatureInformation[];
  }

  export class SignatureInformation {
    parameters: ParameterInformation[];
    constructor(label: string, documentation?: string);
  }

  export interface CancellationToken {
    readonly isCancellationRequested: boolean;
  }

  export interface Disposable {
    dispose(): unknown;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
  }

  export interface Selection extends Range {
    readonly active: Position;
    readonly anchor: Position;
    readonly isEmpty: boolean;
  }

  export interface TextDocument {
    readonly languageId: string;
    readonly lineCount: number;
    readonly uri: Uri;
    getText(): string;
    lineAt(line: number): TextLine;
    offsetAt(position: Position): number;
    positionAt(offset: number): Position;
  }

  export interface TextDocumentChangeEvent {
    readonly contentChanges: Array<{
      readonly range: Range;
      readonly rangeLength: number;
      readonly rangeOffset: number;
      readonly text: string;
    }>;
    readonly document: TextDocument;
  }

  export interface TextEditor {
    readonly document: TextDocument;
    readonly selection: Selection;
    readonly selections: readonly Selection[];
    edit(
      callback: (editBuilder: TextEditorEdit) => void,
      options?: { undoStopAfter?: boolean; undoStopBefore?: boolean }
    ): Thenable<boolean>;
  }

  export interface TextEditorEdit {
    insert(location: Position, value: string): void;
    replace(location: Range | Selection, value: string): void;
  }

  export interface TextLine {
    readonly text: string;
  }

  export interface Uri {
    readonly scheme: string;
    toString(): string;
  }
}
