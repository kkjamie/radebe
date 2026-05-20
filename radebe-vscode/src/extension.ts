import * as vscode from "vscode";
import {
  createRenderPreviewText,
  formatArgumentKind,
  formatArgumentName,
  formatDocumentColor,
  getArgumentHelpAtOffset,
  getCompletionResultAtOffset,
  getDiagnosticRanges,
  getDocumentColors,
  getEnterIndentationAtOffset,
  getSmartTextEditsAtOffset,
  type RadebeDiagnosticRange
} from "./language-adapter.js";

const RADEBE_LANGUAGE_ID = "radebe";
const RADEBE_SELECTOR = [
  { language: RADEBE_LANGUAGE_ID, scheme: "file" },
  { language: RADEBE_LANGUAGE_ID, scheme: "untitled" }
];

function isRadebeDocument(document: vscode.TextDocument): boolean {
  return document.languageId === RADEBE_LANGUAGE_ID;
}

function getDocumentOffset(
  document: vscode.TextDocument,
  position: vscode.Position
): number {
  return document.offsetAt(position);
}

function createRangeFromOffsets(
  document: vscode.TextDocument,
  start: number,
  end: number
): vscode.Range {
  return new vscode.Range(document.positionAt(start), document.positionAt(end));
}

function getCompletionKind(kind: string): unknown {
  switch (kind) {
    case "argument-name":
      return vscode.CompletionItemKind.Property;
    case "enum-value":
      return vscode.CompletionItemKind.EnumMember;
    case "inline-command":
      return vscode.CompletionItemKind.Constructor;
    case "command":
    default:
      return vscode.CompletionItemKind.Function;
  }
}

function createCompletionProvider(): unknown {
  return {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position
    ) {
      const source = document.getText();
      const offset = getDocumentOffset(document, position);
      const result = getCompletionResultAtOffset(source, offset);
      const range = new vscode.Range(
        new vscode.Position(
          position.line,
          Math.max(position.character - result.context.prefix.length, 0)
        ),
        position
      );

      return result.items.map((item, index) => {
        const completion = new vscode.CompletionItem(
          item.label,
          getCompletionKind(item.kind)
        );

        completion.detail = item.detail ?? item.kind;
        completion.insertText = item.insertText;
        completion.range = range;
        completion.sortText = `${index.toString().padStart(3, "0")}-${item.label}`;
        return completion;
      });
    }
  };
}

function createSignatureDocumentation(
  help: NonNullable<ReturnType<typeof getArgumentHelpAtOffset>>
): string {
  return help.arguments
    .map((argument) => {
      return `- \`${formatArgumentName(argument)}\`: ${formatArgumentKind(argument)}`;
    })
    .join("\n");
}

function createSignatureProvider(): unknown {
  return {
    provideSignatureHelp(
      document: vscode.TextDocument,
      position: vscode.Position
    ) {
      const source = document.getText();
      const offset = getDocumentOffset(document, position);
      const help = getArgumentHelpAtOffset(source, offset);

      if (!help || help.arguments.length === 0) {
        return null;
      }

      const signatureHelp = new vscode.SignatureHelp();
      const commandLabel = help.parentCommandName
        ? `${help.parentCommandName} ${help.commandName}`
        : help.commandName;
      const signature = new vscode.SignatureInformation(
        `${commandLabel} ${help.arguments.map(formatArgumentName).join(" ")}`,
        createSignatureDocumentation(help)
      );

      signature.parameters = help.arguments.map((argument) => {
        return new vscode.ParameterInformation(
          formatArgumentName(argument),
          formatArgumentKind(argument)
        );
      });

      signatureHelp.signatures = [signature];
      signatureHelp.activeSignature = 0;
      signatureHelp.activeParameter = Math.max(
        0,
        Math.min(help.activeArgumentIndex, help.arguments.length - 1)
      );

      return signatureHelp;
    }
  };
}

function createDiagnostic(
  document: vscode.TextDocument,
  diagnosticRange: RadebeDiagnosticRange
): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    createRangeFromOffsets(
      document,
      diagnosticRange.start,
      Math.max(diagnosticRange.end, diagnosticRange.start + 1)
    ),
    diagnosticRange.message,
    vscode.DiagnosticSeverity.Error
  );

  diagnostic.source = `radebe-${diagnosticRange.stage}`;
  return diagnostic;
}

function registerDiagnostics(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection("radebe");

  function updateDiagnostics(document: vscode.TextDocument): void {
    if (!isRadebeDocument(document)) {
      collection.delete(document.uri);
      return;
    }

    collection.set(
      document.uri,
      getDiagnosticRanges(document.getText()).map((diagnostic) =>
        createDiagnostic(document, diagnostic)
      )
    );
  }

  vscode.workspace.textDocuments.forEach(updateDiagnostics);

  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
    vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
      updateDiagnostics(event.document);
    }),
    vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
      collection.delete(document.uri);
    })
  );
}

function registerColorProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerColorProvider(RADEBE_SELECTOR, {
      provideDocumentColors(document: vscode.TextDocument) {
        return getDocumentColors(document.getText()).map((colorToken) => {
          return new vscode.ColorInformation(
            createRangeFromOffsets(document, colorToken.start, colorToken.end),
            new vscode.Color(
              colorToken.color.r / 255,
              colorToken.color.g / 255,
              colorToken.color.b / 255,
              colorToken.color.a
            )
          );
        });
      },
      provideColorPresentations(color: vscode.Color) {
        return [
          new vscode.ColorPresentation(
            formatDocumentColor({
              r: color.red * 255,
              g: color.green * 255,
              b: color.blue * 255,
              a: color.alpha
            })
          )
        ];
      }
    })
  );
}

function registerSmartEdits(context: vscode.ExtensionContext): void {
  let isApplyingSmartEdit = false;

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      async (event: vscode.TextDocumentChangeEvent) => {
        if (
          isApplyingSmartEdit ||
          !isRadebeDocument(event.document) ||
          event.contentChanges.length !== 1
        ) {
          return;
        }

        const editor = vscode.window.activeTextEditor;
        const change = event.contentChanges[0]!;

        if (
          !editor ||
          editor.document.uri.toString() !== event.document.uri.toString() ||
          change.text.length === 0
        ) {
          return;
        }

        const source = event.document.getText();
        const offset = change.rangeOffset + change.text.length;
        const edits = getSmartTextEditsAtOffset(source, offset);

        if (edits.length === 0) {
          return;
        }

        isApplyingSmartEdit = true;

        try {
          await editor.edit(
            (editBuilder: vscode.TextEditorEdit) => {
              edits.forEach((edit) => {
                editBuilder.replace(
                  createRangeFromOffsets(event.document, edit.start, edit.end),
                  edit.text
                );
              });
            },
            { undoStopAfter: false, undoStopBefore: false }
          );
        } finally {
          isApplyingSmartEdit = false;
        }
      }
    )
  );
}

function registerSmartNewline(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "radebe.insertSmartNewline",
      (editor: vscode.TextEditor, editBuilder: vscode.TextEditorEdit) => {
        if (!isRadebeDocument(editor.document)) {
          editBuilder.insert(editor.selection.active, "\n");
          return;
        }

        const source = editor.document.getText();
        const selections = [...editor.selections].sort((left, right) => {
          return (
            editor.document.offsetAt(right.active) -
            editor.document.offsetAt(left.active)
          );
        });

        selections.forEach((selection) => {
          const offset = getDocumentOffset(editor.document, selection.active);
          const text = `\n${getEnterIndentationAtOffset(source, offset)}`;

          if (selection.isEmpty) {
            editBuilder.insert(selection.active, text);
          } else {
            editBuilder.replace(selection, text);
          }
        });
      }
    )
  );
}

function registerRenderPreview(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("radebe.openTextRenderPreview", async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor || !isRadebeDocument(editor.document)) {
        await vscode.window.showInformationMessage(
          "Open a Radebe .rdb file before rendering a preview."
        );
        return;
      }

      const previewDocument = await vscode.workspace.openTextDocument({
        content: createRenderPreviewText(editor.document.getText()),
        language: "plaintext"
      });

      await vscode.window.showTextDocument(previewDocument, {
        preview: true,
        viewColumn: vscode.ViewColumn.Beside
      });
    })
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      RADEBE_SELECTOR,
      createCompletionProvider(),
      " ",
      "=",
      "-"
    ),
    vscode.languages.registerSignatureHelpProvider(
      RADEBE_SELECTOR,
      createSignatureProvider(),
      " ",
      "="
    )
  );

  registerDiagnostics(context);
  registerColorProvider(context);
  registerSmartEdits(context);
  registerSmartNewline(context);
  registerRenderPreview(context);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions from the extension context.
}
