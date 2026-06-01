import { basicSetup } from "codemirror";
import {
  EditorSelection,
  EditorState,
  Prec,
  Transaction,
  type TransactionSpec
} from "@codemirror/state";
import {
  EditorView,
  keymap,
  type ViewUpdate
} from "@codemirror/view";
import {
  getArgumentHelp,
  getEnterIndentation,
  getLanguageCompletions,
  getLanguageSmartEdits,
  type LanguageCompletionResult,
  type LanguageServiceRequest,
  type LanguageTextEdit
} from "@radebe/core/language-service";
import type { PipelineResult } from "@radebe/core/types";

import { markPerfDuration, markPerfPoint } from "../perf.js";
import {
  enqueuePreviewRender,
  type PreviewRenderTicket
} from "../playground-preview-queue.js";
import type { ExamplePlayground } from "../types.js";
import type { PlaygroundActivationLease } from "./activation.js";
import {
  adjustOffsetForEdit,
  getLanguagePosition,
  isCompletionRequestShortcut,
  isCursorNavigationKey
} from "./assist.js";
import {
  getVisibleCompletionCount,
  renderArgumentHelp,
  renderCompletionList
} from "./assist-view.js";
import {
  createSourceDiagnosticDecorations,
  diagnosticDecorations,
  setDiagnosticDecorations,
  sourceColorSwatches,
  sourceSyntaxHighlighter
} from "./editor-decorations.js";
import {
  PlaygroundPreviewPresenter,
  type CachedPreview
} from "./preview-presenter.js";

const ASSIST_UPDATE_DELAY_MS = 35;
const PREVIEW_RENDER_DELAY_MS = 120;

type MutableRef<T> = {
  current: T;
};

export type PlaygroundRuntimeElements = {
  argumentHelp: HTMLDivElement | null;
  cachedPreviewImage: HTMLImageElement | null;
  completionList: HTMLDivElement | null;
  diagnosticsOutput: HTMLPreElement | null;
  previewMeta: HTMLParagraphElement | null;
  previewState: HTMLSpanElement | null;
  sourceAssist: HTMLDivElement | null;
  sourceEditor: HTMLDivElement | null;
  spriteCanvas: HTMLCanvasElement | null;
  spriteSurface: HTMLDivElement | null;
  spriteViewport: HTMLDivElement | null;
  status: HTMLParagraphElement | null;
  zoomSelect: HTMLSelectElement | null;
};

type ResolvedPlaygroundRuntimeElements = {
  argumentHelp: HTMLDivElement;
  cachedPreviewImage: HTMLImageElement | null;
  completionList: HTMLDivElement;
  diagnosticsOutput: HTMLPreElement;
  previewMeta: HTMLParagraphElement;
  previewState: HTMLSpanElement;
  sourceAssist: HTMLDivElement;
  sourceEditor: HTMLDivElement;
  spriteCanvas: HTMLCanvasElement;
  spriteSurface: HTMLDivElement;
  spriteViewport: HTMLDivElement;
  status: HTMLParagraphElement;
  zoomSelect: HTMLSelectElement;
};

export type PlaygroundRuntimeConfig = {
  activationLeaseRef: MutableRef<PlaygroundActivationLease | null>;
  activationQueuedAtRef: MutableRef<number>;
  activationStartedAtRef: MutableRef<number | null>;
  cachedPreview?: CachedPreview;
  elements: PlaygroundRuntimeElements;
  playground: ExamplePlayground;
  sourceState: Map<string, string>;
};

function resolveRuntimeElements(
  elements: PlaygroundRuntimeElements
): ResolvedPlaygroundRuntimeElements | null {
  if (
    !elements.argumentHelp ||
    !elements.completionList ||
    !elements.diagnosticsOutput ||
    !elements.previewMeta ||
    !elements.previewState ||
    !elements.sourceAssist ||
    !elements.sourceEditor ||
    !elements.spriteCanvas ||
    !elements.spriteSurface ||
    !elements.spriteViewport ||
    !elements.status ||
    !elements.zoomSelect
  ) {
    return null;
  }

  return {
    argumentHelp: elements.argumentHelp,
    cachedPreviewImage: elements.cachedPreviewImage,
    completionList: elements.completionList,
    diagnosticsOutput: elements.diagnosticsOutput,
    previewMeta: elements.previewMeta,
    previewState: elements.previewState,
    sourceAssist: elements.sourceAssist,
    sourceEditor: elements.sourceEditor,
    spriteCanvas: elements.spriteCanvas,
    spriteSurface: elements.spriteSurface,
    spriteViewport: elements.spriteViewport,
    status: elements.status,
    zoomSelect: elements.zoomSelect
  };
}

export function mountPlaygroundRuntime(
  config: PlaygroundRuntimeConfig
): (() => void) | null {
  const elements = resolveRuntimeElements(config.elements);

  if (elements === null) {
    return null;
  }

  const runtime = new PlaygroundRuntime(config, elements);
  runtime.mount();

  return () => {
    runtime.dispose();
  };
}

class PlaygroundRuntime {
  private activeCompletionIndex = 0;
  private argumentHelpOpen = false;
  private assistUpdateTimer: number | null = null;
  private completionListExplicit = false;
  private completionResult: LanguageCompletionResult | null = null;
  private completionSuppressedUntilInput = false;
  private disposed = false;
  private editorView!: EditorView;
  private fitScaleFrame: number | null = null;
  private hasReportedFirstPreview = false;
  private readonly initialSource: string;
  private livePreviewActive: boolean;
  private previewRenderTicket: PreviewRenderTicket | null = null;
  private readonly previewPresenter: PlaygroundPreviewPresenter;
  private previewSourceVersion = 0;
  private previewUpdateTimer: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private startupReleased = false;
  private suppressAssistForNextChange = false;

  public constructor(
    private readonly config: PlaygroundRuntimeConfig,
    private readonly elements: ResolvedPlaygroundRuntimeElements
  ) {
    this.initialSource =
      config.sourceState.get(config.playground.id) ?? config.playground.source;
    this.livePreviewActive =
      config.cachedPreview === undefined ||
      config.sourceState.has(config.playground.id);
    this.previewPresenter = new PlaygroundPreviewPresenter(
      {
        cachedPreviewImage: elements.cachedPreviewImage,
        diagnosticsOutput: elements.diagnosticsOutput,
        previewMeta: elements.previewMeta,
        previewState: elements.previewState,
        spriteCanvas: elements.spriteCanvas,
        spriteSurface: elements.spriteSurface,
        spriteViewport: elements.spriteViewport,
        status: elements.status,
        zoomSelect: elements.zoomSelect
      },
      config.cachedPreview
    );
  }

  public mount(): void {
    this.elements.sourceEditor.dataset.focused = "false";
    const setupStart = performance.now();

    this.editorView = new EditorView({
      parent: this.elements.sourceEditor,
      state: EditorState.create({
        doc: this.initialSource,
        extensions: [
          this.createEditorKeymap(),
          basicSetup,
          EditorView.lineWrapping,
          sourceSyntaxHighlighter,
          sourceColorSwatches,
          diagnosticDecorations,
          this.createSmartEditTransactionFilter(),
          this.createUpdateListener(),
          this.createDomEventHandlers()
        ]
      })
    });

    markPerfDuration(
      "playground-editor-setup",
      performance.now() - setupStart,
      this.config.playground.id
    );
    markPerfPoint(
      "playground-editor-ready",
      `${this.config.playground.id} ${(performance.now() - setupStart).toFixed(1)}ms`
    );

    this.elements.zoomSelect.addEventListener("change", this.handleZoomChange);
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleFitScaleUpdate();
    });
    this.resizeObserver.observe(this.elements.spriteViewport);

    if (this.livePreviewActive) {
      this.schedulePreviewUpdate(0);
    } else {
      this.previewPresenter.showCachedPreview();
      markPerfPoint("playground-cached-preview-shown", this.config.playground.id);
      this.releaseStartup("cached-preview");
    }

    this.scheduleFitScaleUpdate();
  }

  public dispose(): void {
    this.disposed = true;
    this.clearPreviewUpdate();
    this.cancelPreviewRender();
    this.cancelAssistUpdate();
    this.cancelFitScaleUpdate();
    this.elements.zoomSelect.removeEventListener("change", this.handleZoomChange);
    this.resizeObserver?.disconnect();
    this.editorView.destroy();
    this.config.activationLeaseRef.current?.release();
    this.config.activationLeaseRef.current = null;
  }

  private releaseStartup(reason: string): void {
    if (this.startupReleased) {
      return;
    }

    this.startupReleased = true;
    markPerfDuration(
      "playground-startup-total",
      performance.now() - this.config.activationQueuedAtRef.current,
      this.config.playground.id
    );

    const startedAt = this.config.activationStartedAtRef.current;
    if (startedAt !== null) {
      markPerfDuration(
        "playground-startup-active",
        performance.now() - startedAt,
        this.config.playground.id
      );
    }

    markPerfPoint("playground-initial-ready", `${this.config.playground.id} ${reason}`);
    this.config.activationLeaseRef.current?.release();
    this.config.activationLeaseRef.current = null;
  }

  private getEditorSource(): string {
    return this.editorView.state.doc.toString();
  }

  private getEditorOffset(): number {
    return this.editorView.state.selection.main.head;
  }

  private clearPreviewUpdate(): void {
    if (this.previewUpdateTimer === null) {
      return;
    }

    window.clearTimeout(this.previewUpdateTimer);
    this.previewUpdateTimer = null;
  }

  private cancelPreviewRender(): void {
    this.previewRenderTicket?.cancel();
    this.previewRenderTicket = null;
  }

  private schedulePreviewUpdate(delayMs = PREVIEW_RENDER_DELAY_MS): void {
    this.clearPreviewUpdate();
    this.previewPresenter.setState(
      this.previewRenderTicket === null ? "queued" : "dirty",
      this.previewRenderTicket === null ? "Queued" : "Dirty"
    );
    this.previewUpdateTimer = window.setTimeout(() => {
      this.previewUpdateTimer = null;

      if (!this.disposed) {
        this.queuePreviewRender(this.getEditorSource(), this.previewSourceVersion);
      }
    }, delayMs);
  }

  private cancelAssistUpdate(): void {
    if (this.assistUpdateTimer === null) {
      return;
    }

    window.clearTimeout(this.assistUpdateTimer);
    this.assistUpdateTimer = null;
  }

  private cancelFitScaleUpdate(): void {
    if (this.fitScaleFrame === null) {
      return;
    }

    window.cancelAnimationFrame(this.fitScaleFrame);
    this.fitScaleFrame = null;
  }

  private scheduleFitScaleUpdate(): void {
    if (this.elements.zoomSelect.value !== "fit") {
      return;
    }

    this.cancelFitScaleUpdate();
    this.fitScaleFrame = window.requestAnimationFrame(() => {
      this.fitScaleFrame = null;

      if (!this.disposed && this.elements.zoomSelect.value === "fit") {
        this.previewPresenter.applyCurrentScale();
      }
    });
  }

  private scheduleAssistUpdate(): void {
    this.cancelAssistUpdate();

    this.assistUpdateTimer = window.setTimeout(() => {
      this.assistUpdateTimer = null;

      if (!this.disposed) {
        this.updateAssist();
      }
    }, ASSIST_UPDATE_DELAY_MS);
  }

  private isCurrentPreviewSource(source: string, version: number): boolean {
    return version === this.previewSourceVersion && source === this.getEditorSource();
  }

  private queuePreviewRender(source: string, version: number): void {
    this.cancelPreviewRender();
    let renderTicket: PreviewRenderTicket | null = null;

    renderTicket = enqueuePreviewRender(this.config.playground.id, source, {
      onCancel: () => {
        if (this.previewRenderTicket === renderTicket) {
          this.previewRenderTicket = null;
        }
      },
      onComplete: (rendered) => {
        if (this.disposed || this.previewRenderTicket !== renderTicket) {
          return;
        }

        this.previewRenderTicket = null;

        if (!this.isCurrentPreviewSource(rendered.source, version)) {
          if (this.previewUpdateTimer === null) {
            this.schedulePreviewUpdate(0);
          }
          return;
        }

        this.applyPreviewResult(rendered.result);
      },
      onError: (error) => {
        if (this.disposed || this.previewRenderTicket !== renderTicket) {
          return;
        }

        this.previewRenderTicket = null;

        if (!this.isCurrentPreviewSource(error.source, version)) {
          if (this.previewUpdateTimer === null) {
            this.schedulePreviewUpdate(0);
          }
          return;
        }

        this.previewPresenter.showRenderError(error.message);

        if (!this.hasReportedFirstPreview) {
          this.hasReportedFirstPreview = true;
          this.releaseStartup("preview-error");
        }
      },
      onStart: () => {
        if (!this.disposed) {
          this.previewPresenter.setState("refreshing", "Refreshing");
        }
      }
    });
    this.previewRenderTicket = renderTicket;
  }

  private applyPreviewResult(result: PipelineResult): void {
    this.previewPresenter.applyResult(result);
    this.editorView.dispatch({
      effects: setDiagnosticDecorations.of(
        createSourceDiagnosticDecorations(this.editorView, result.diagnostics)
      ),
      annotations: Transaction.addToHistory.of(false)
    });

    if (!this.hasReportedFirstPreview) {
      this.hasReportedFirstPreview = true;
      markPerfPoint("playground-first-preview-complete", this.config.playground.id);
      window.requestAnimationFrame(() => {
        markPerfPoint("playground-first-preview-frame", this.config.playground.id);
      });
      this.releaseStartup("live-preview");
    }
  }

  private createLanguageRequestFor(
    source: string,
    offset: number
  ): LanguageServiceRequest {
    return {
      source,
      position: getLanguagePosition(source, offset)
    };
  }

  private createLanguageRequest(): LanguageServiceRequest {
    return this.createLanguageRequestFor(this.getEditorSource(), this.getEditorOffset());
  }

  private shouldShowCompletionList(result: LanguageCompletionResult): boolean {
    return (
      result.items.length > 0 &&
      !this.completionSuppressedUntilInput &&
      (this.completionListExplicit || result.context.prefix.length > 0)
    );
  }

  private updateAssistPosition(): void {
    const coords = this.editorView.coordsAtPos(this.getEditorOffset());
    const editorRect = this.elements.sourceEditor.getBoundingClientRect();
    const top =
      coords === null ? 46 : Math.max(14, coords.bottom - editorRect.top + 6);

    this.elements.sourceAssist.style.top = `${top}px`;
  }

  private updateAssist(): void {
    if (!this.editorView.hasFocus) {
      this.hideAssist();
      return;
    }

    const request = this.createLanguageRequest();
    this.completionResult = getLanguageCompletions(request);
    this.updateAssistPosition();
    this.activeCompletionIndex = renderCompletionList(
      this.elements.completionList,
      this.shouldShowCompletionList(this.completionResult)
        ? this.completionResult.items
        : [],
      this.activeCompletionIndex,
      (index) => this.applyCompletion(index)
    );
    renderArgumentHelp(
      this.elements.argumentHelp,
      this.argumentHelpOpen ? getArgumentHelp(request) : null
    );
    this.elements.sourceAssist.hidden =
      this.elements.completionList.hidden && this.elements.argumentHelp.hidden;
  }

  private showCompletionListNow(): void {
    this.completionListExplicit = true;
    this.completionSuppressedUntilInput = false;
    this.updateAssist();
  }

  private hideAssist(): void {
    this.cancelAssistUpdate();
    this.completionResult = null;
    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = true;
    this.argumentHelpOpen = false;
    this.elements.completionList.hidden = true;
    this.elements.argumentHelp.hidden = true;
    this.elements.sourceAssist.hidden = true;
  }

  private replaceSourceRange(
    start: number,
    end: number,
    text: string,
    options?: { suppressAssistAfterChange?: boolean }
  ): void {
    const nextCursor = start + text.length;

    this.suppressAssistForNextChange =
      this.suppressAssistForNextChange ||
      options?.suppressAssistAfterChange === true;
    this.editorView.dispatch({
      changes: { from: start, to: end, insert: text },
      selection: EditorSelection.cursor(nextCursor),
      scrollIntoView: true
    });
  }

  private insertAtSelection(
    text: string,
    options?: { suppressAssistAfterChange?: boolean }
  ): void {
    const selection = this.editorView.state.selection.main;
    this.replaceSourceRange(selection.from, selection.to, text, options);
  }

  private getSmartTextEditsFor(source: string, offset: number): LanguageTextEdit[] {
    const smartEdits = getLanguageSmartEdits(
      this.createLanguageRequestFor(source, offset)
    ).edits;

    return smartEdits.map((smartEdit) => smartEdit.edit);
  }

  private getSelectionAfterTextEdits(
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

  private applyCompletion(index: number): void {
    const item = this.completionResult?.items[index];
    const prefix = this.completionResult?.context.prefix ?? "";

    if (!item) {
      return;
    }

    const cursor = this.getEditorOffset();
    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = true;
    this.argumentHelpOpen = false;
    this.replaceSourceRange(cursor - prefix.length, cursor, item.insertText, {
      suppressAssistAfterChange: true
    });
    this.editorView.focus();
    this.hideAssist();
  }

  private handleSourceChange(): void {
    const source = this.getEditorSource();
    this.previewSourceVersion += 1;
    this.config.sourceState.set(this.config.playground.id, source);

    if (!this.livePreviewActive) {
      this.livePreviewActive = true;
    }

    this.schedulePreviewUpdate();
    this.scheduleAssistUpdate();
  }

  private moveActiveCompletion(delta: number): boolean {
    const completionCount = getVisibleCompletionCount(
      this.elements.completionList,
      this.completionResult
    );

    if (completionCount === 0) {
      return false;
    }

    this.activeCompletionIndex =
      (this.activeCompletionIndex + delta + completionCount) % completionCount;
    this.activeCompletionIndex = renderCompletionList(
      this.elements.completionList,
      this.completionResult?.items ?? [],
      this.activeCompletionIndex,
      (index) => this.applyCompletion(index)
    );
    return true;
  }

  private acceptActiveCompletion(): boolean {
    if (getVisibleCompletionCount(this.elements.completionList, this.completionResult) === 0) {
      return false;
    }

    this.applyCompletion(this.activeCompletionIndex);
    return true;
  }

  private handleTabCommand(): boolean {
    if (this.acceptActiveCompletion()) {
      return true;
    }

    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = false;
    this.argumentHelpOpen = false;
    this.insertAtSelection("  ", { suppressAssistAfterChange: true });
    return true;
  }

  private handleEnterCommand(): boolean {
    if (this.acceptActiveCompletion()) {
      return true;
    }

    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = false;
    this.argumentHelpOpen = false;
    this.insertAtSelection(`\n${getEnterIndentation(this.createLanguageRequest())}`, {
      suppressAssistAfterChange: true
    });
    return true;
  }

  private getInsertedText(update: ViewUpdate): string {
    let text = "";

    update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
      text += inserted.toString();
    });

    return text;
  }

  private shouldOpenArgumentHelpAfterUpdate(update: ViewUpdate): boolean {
    if (!update.docChanged) {
      return this.argumentHelpOpen;
    }

    if (update.transactions.some((transaction) => transaction.isUserEvent("delete"))) {
      return false;
    }

    return /\s/.test(this.getInsertedText(update)) || this.argumentHelpOpen;
  }

  private handleEditorKeydown(event: KeyboardEvent): boolean {
    if (event.key === "ArrowDown" && this.moveActiveCompletion(1)) {
      event.preventDefault();
      return true;
    }

    if (event.key === "ArrowUp" && this.moveActiveCompletion(-1)) {
      event.preventDefault();
      return true;
    }

    if (event.key === "Escape") {
      this.hideAssist();
      return false;
    }

    if (isCompletionRequestShortcut(event)) {
      event.preventDefault();
      this.showCompletionListNow();
      return true;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      return this.handleTabCommand();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      return this.handleEnterCommand();
    }

    return false;
  }

  private handleEditorFocus(): void {
    this.elements.sourceEditor.dataset.focused = "true";
    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = true;
    this.argumentHelpOpen = false;
    this.updateAssist();
  }

  private handleEditorBlur(): void {
    this.elements.sourceEditor.dataset.focused = "false";
    window.setTimeout(() => {
      if (!this.editorView.hasFocus) {
        this.hideAssist();
      }
    }, 120);
  }

  private handleEditorKeyup(event: KeyboardEvent): void {
    if (isCursorNavigationKey(event)) {
      this.updateAssist();
    }
  }

  private handleEditorMouseup(): void {
    this.completionListExplicit = false;
    this.completionSuppressedUntilInput = true;
    this.argumentHelpOpen = false;
    this.updateAssist();
  }

  private readonly handleZoomChange = (): void => {
    this.previewPresenter.applyCurrentScale();
  };

  private createEditorKeymap() {
    return Prec.highest(
      keymap.of([
        {
          key: "ArrowDown",
          run: () => this.moveActiveCompletion(1)
        },
        {
          key: "ArrowUp",
          run: () => this.moveActiveCompletion(-1)
        },
        {
          key: "Ctrl-Space",
          run: () => {
            this.showCompletionListNow();
            return true;
          }
        },
        {
          key: "Escape",
          run: () => {
            if (this.elements.sourceAssist.hidden) {
              return false;
            }

            this.hideAssist();
            return true;
          }
        },
        {
          key: "Tab",
          run: () => this.handleTabCommand()
        },
        {
          key: "Enter",
          run: () => this.handleEnterCommand()
        }
      ])
    );
  }

  private createSmartEditTransactionFilter() {
    return EditorState.transactionFilter.of((transaction) => {
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
      const smartEdits = this.getSmartTextEditsFor(
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
          selection: this.getSelectionAfterTextEdits(
            transaction.newSelection,
            smartEdits
          ),
          sequential: true
        }
      ];
    });
  }

  private createUpdateListener() {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const suppressAssist = this.suppressAssistForNextChange;

        this.suppressAssistForNextChange = false;
        this.completionListExplicit = false;
        this.completionSuppressedUntilInput = suppressAssist;
        this.argumentHelpOpen = suppressAssist
          ? false
          : this.shouldOpenArgumentHelpAfterUpdate(update);
        this.handleSourceChange();
        return;
      }

      if (update.selectionSet || update.viewportChanged) {
        this.updateAssist();
      }
    });
  }

  private createDomEventHandlers() {
    return EditorView.domEventHandlers({
      blur: () => {
        this.handleEditorBlur();
      },
      focus: () => {
        this.handleEditorFocus();
      },
      keydown: (event) => this.handleEditorKeydown(event),
      keyup: (event) => {
        this.handleEditorKeyup(event);
      },
      mouseup: () => {
        this.handleEditorMouseup();
      }
    });
  }
}
