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
import { useEffect, useRef, useState } from "preact/hooks";

import { markPerfDuration, markPerfPoint } from "./perf.js";
import {
  getNowMs,
  requestPlaygroundActivation,
  type PlaygroundActivationLease
} from "./playground/activation.js";
import {
  adjustOffsetForEdit,
  getLanguagePosition,
  isCompletionRequestShortcut,
  isCursorNavigationKey
} from "./playground/assist.js";
import {
  getVisibleCompletionCount,
  renderArgumentHelp,
  renderCompletionList
} from "./playground/assist-view.js";
import {
  createSourceDiagnosticDecorations,
  diagnosticDecorations,
  setDiagnosticDecorations,
  sourceColorSwatches,
  sourceSyntaxHighlighter
} from "./playground/editor-decorations.js";
import {
  PlaygroundPreviewPresenter,
  type CachedPreview
} from "./playground/preview-presenter.js";
import {
  enqueuePreviewRender,
  type PreviewRenderTicket
} from "./playground-preview-queue.js";
import type { ExamplePlayground } from "./types.js";

const ASSIST_UPDATE_DELAY_MS = 35;
const PREVIEW_RENDER_DELAY_MS = 120;

export function Playground(props: {
  playground: ExamplePlayground;
  sourceState: Map<string, string>;
  cachedPreview?: CachedPreview;
  immersive?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const sourceEditorRef = useRef<HTMLDivElement>(null);
  const sourceAssistRef = useRef<HTMLDivElement>(null);
  const completionListRef = useRef<HTMLDivElement>(null);
  const argumentHelpRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const previewMetaRef = useRef<HTMLParagraphElement>(null);
  const previewStateRef = useRef<HTMLSpanElement>(null);
  const zoomSelectRef = useRef<HTMLSelectElement>(null);
  const diagnosticsOutputRef = useRef<HTMLPreElement>(null);
  const spriteViewportRef = useRef<HTMLDivElement>(null);
  const spriteSurfaceRef = useRef<HTMLDivElement>(null);
  const cachedPreviewImageRef = useRef<HTMLImageElement>(null);
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);
  const immersive = props.immersive === true;
  const activationLeaseRef = useRef<PlaygroundActivationLease | null>(null);
  const activationQueuedAtRef = useRef(getNowMs());
  const activationStartedAtRef = useRef<number | null>(immersive ? getNowMs() : null);
  const [isActivated, setIsActivated] = useState(immersive);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const clearLease = (): void => {
      activationLeaseRef.current?.release();
      activationLeaseRef.current = null;
    };

    activationQueuedAtRef.current = getNowMs();

    if (immersive) {
      activationStartedAtRef.current = activationQueuedAtRef.current;
      markPerfDuration("playground-activation-wait", 0, props.playground.id);
      markPerfPoint("playground-activation-start", props.playground.id);
      setIsActivated(true);

      return () => {
        clearLease();
      };
    }

    setIsActivated(false);
    activationStartedAtRef.current = null;
    markPerfPoint("playground-activation-queued", props.playground.id);

    const activationRequest = requestPlaygroundActivation({
      getPriority: () => {
        const rect = root.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const visible = rect.bottom > 0 && rect.top < viewportHeight;
        const distanceFromViewportPx = visible
          ? 0
          : rect.top >= viewportHeight
            ? rect.top - viewportHeight
            : Math.abs(rect.bottom);

        return {
          distanceFromViewportPx,
          topPx: rect.top,
          visible
        };
      },
      grant: (lease) => {
        activationLeaseRef.current = lease;
        activationStartedAtRef.current = getNowMs();
        markPerfDuration(
          "playground-activation-wait",
          activationStartedAtRef.current - activationQueuedAtRef.current,
          props.playground.id
        );
        markPerfPoint("playground-activation-start", props.playground.id);
        setIsActivated(true);
      }
    });

    const handlePriorityChange = (): void => {
      activationRequest.reprioritize();
    };

    window.addEventListener("scroll", handlePriorityChange, { passive: true });
    window.addEventListener("resize", handlePriorityChange);
    handlePriorityChange();

    return () => {
      window.removeEventListener("scroll", handlePriorityChange);
      window.removeEventListener("resize", handlePriorityChange);
      activationRequest.cancel();
      clearLease();
    };
  }, [immersive, props.playground.id]);

  useEffect(() => {
    if (!isActivated) {
      return;
    }

    markPerfPoint("playground-effect-start", props.playground.id);
    const sourceEditor = sourceEditorRef.current!;
    const sourceAssist = sourceAssistRef.current!;
    const completionList = completionListRef.current!;
    const argumentHelp = argumentHelpRef.current!;
    const status = statusRef.current!;
    const previewMeta = previewMetaRef.current!;
    const previewState = previewStateRef.current!;
    const zoomSelect = zoomSelectRef.current!;
    const diagnosticsOutput = diagnosticsOutputRef.current!;
    const spriteViewport = spriteViewportRef.current!;
    const spriteSurface = spriteSurfaceRef.current!;
    const cachedPreviewImage = cachedPreviewImageRef.current;
    const spriteCanvas = spriteCanvasRef.current!;

    if (
      !sourceEditor ||
      !sourceAssist ||
      !completionList ||
      !argumentHelp ||
      !status ||
      !previewMeta ||
      !previewState ||
      !zoomSelect ||
      !diagnosticsOutput ||
      !spriteViewport ||
      !spriteSurface ||
      !spriteCanvas
    ) {
      return;
    }

    sourceEditor.dataset.focused = "false";
    const setupStart = performance.now();

    const initialSource =
      props.sourceState.get(props.playground.id) ?? props.playground.source;
    const cachedPreview = props.cachedPreview;
    const previewPresenter = new PlaygroundPreviewPresenter(
      {
        cachedPreviewImage,
        diagnosticsOutput,
        previewMeta,
        previewState,
        spriteCanvas,
        spriteSurface,
        spriteViewport,
        status,
        zoomSelect
      },
      cachedPreview
    );
    let editorView: EditorView;
    let livePreviewActive =
      cachedPreview === undefined || props.sourceState.has(props.playground.id);
    let completionResult: LanguageCompletionResult | null = null;
    let activeCompletionIndex = 0;
    let completionListExplicit = false;
    let completionSuppressedUntilInput = false;
    let suppressAssistForNextChange = false;
    let argumentHelpOpen = false;
    let previewUpdateTimer: number | null = null;
    let previewRenderTicket: PreviewRenderTicket | null = null;
    let previewSourceVersion = 0;
    let assistUpdateTimer: number | null = null;
    let fitScaleFrame: number | null = null;
    let disposed = false;
    let startupReleased = false;

    function releaseStartup(reason: string): void {
      if (startupReleased) {
        return;
      }

      startupReleased = true;
      markPerfDuration(
        "playground-startup-total",
        getNowMs() - activationQueuedAtRef.current,
        props.playground.id
      );

      const startedAt = activationStartedAtRef.current;
      if (startedAt !== null) {
        markPerfDuration(
          "playground-startup-active",
          getNowMs() - startedAt,
          props.playground.id
        );
      }

      markPerfPoint("playground-initial-ready", `${props.playground.id} ${reason}`);
      activationLeaseRef.current?.release();
      activationLeaseRef.current = null;
    }

    function getEditorSource(): string {
      return editorView.state.doc.toString();
    }

    function getEditorOffset(): number {
      return editorView.state.selection.main.head;
    }

    function clearPreviewUpdate(): void {
      if (previewUpdateTimer === null) {
        return;
      }

      window.clearTimeout(previewUpdateTimer);
      previewUpdateTimer = null;
    }

    function cancelPreviewRender(): void {
      previewRenderTicket?.cancel();
      previewRenderTicket = null;
    }

    function schedulePreviewUpdate(delayMs = PREVIEW_RENDER_DELAY_MS): void {
      clearPreviewUpdate();
      previewPresenter.setState(
        previewRenderTicket === null ? "queued" : "dirty",
        previewRenderTicket === null ? "Queued" : "Dirty"
      );
      previewUpdateTimer = window.setTimeout(() => {
        previewUpdateTimer = null;

        if (!disposed) {
          queuePreviewRender(getEditorSource(), previewSourceVersion);
        }
      }, delayMs);
    }

    function cancelAssistUpdate(): void {
      if (assistUpdateTimer === null) {
        return;
      }

      window.clearTimeout(assistUpdateTimer);
      assistUpdateTimer = null;
    }

    function cancelFitScaleUpdate(): void {
      if (fitScaleFrame === null) {
        return;
      }

      window.cancelAnimationFrame(fitScaleFrame);
      fitScaleFrame = null;
    }

    function scheduleFitScaleUpdate(): void {
      if (zoomSelect.value !== "fit") {
        return;
      }

      cancelFitScaleUpdate();
      fitScaleFrame = window.requestAnimationFrame(() => {
        fitScaleFrame = null;

        if (!disposed && zoomSelect.value === "fit") {
          previewPresenter.applyCurrentScale();
        }
      });
    }

    function scheduleAssistUpdate(): void {
      cancelAssistUpdate();

      assistUpdateTimer = window.setTimeout(() => {
        assistUpdateTimer = null;

        if (!disposed) {
          updateAssist();
        }
      }, ASSIST_UPDATE_DELAY_MS);
    }

    let hasReportedFirstPreview = false;

    function isCurrentPreviewSource(source: string, version: number): boolean {
      return version === previewSourceVersion && source === getEditorSource();
    }

    function queuePreviewRender(source: string, version: number): void {
      cancelPreviewRender();
      let renderTicket: PreviewRenderTicket | null = null;

      renderTicket = enqueuePreviewRender(props.playground.id, source, {
        onCancel: () => {
          if (previewRenderTicket === renderTicket) {
            previewRenderTicket = null;
          }
        },
        onComplete: (rendered) => {
          if (disposed || previewRenderTicket !== renderTicket) {
            return;
          }

          previewRenderTicket = null;

          if (!isCurrentPreviewSource(rendered.source, version)) {
            if (previewUpdateTimer === null) {
              schedulePreviewUpdate(0);
            }
            return;
          }

          applyPreviewResult(rendered.result);
        },
        onError: (error) => {
          if (disposed || previewRenderTicket !== renderTicket) {
            return;
          }

          previewRenderTicket = null;

          if (!isCurrentPreviewSource(error.source, version)) {
            if (previewUpdateTimer === null) {
              schedulePreviewUpdate(0);
            }
            return;
          }

          previewPresenter.showRenderError(error.message);

          if (!hasReportedFirstPreview) {
            hasReportedFirstPreview = true;
            releaseStartup("preview-error");
          }
        },
        onStart: () => {
          if (!disposed) {
            previewPresenter.setState("refreshing", "Refreshing");
          }
        }
      });
      previewRenderTicket = renderTicket;
    }

    function applyPreviewResult(result: PipelineResult): void {
      previewPresenter.applyResult(result);
      editorView.dispatch({
        effects: setDiagnosticDecorations.of(
          createSourceDiagnosticDecorations(editorView, result.diagnostics)
        ),
        annotations: Transaction.addToHistory.of(false)
      });

      if (!hasReportedFirstPreview) {
        hasReportedFirstPreview = true;
        markPerfPoint("playground-first-preview-complete", props.playground.id);
        window.requestAnimationFrame(() => {
          markPerfPoint("playground-first-preview-frame", props.playground.id);
        });
        releaseStartup("live-preview");
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

    function updateAssist(): void {
      if (!editorView.hasFocus) {
        hideAssist();
        return;
      }

      const request = createLanguageRequest();
      completionResult = getLanguageCompletions(request);
      updateAssistPosition();
      activeCompletionIndex = renderCompletionList(
        completionList,
        shouldShowCompletionList(completionResult) ? completionResult.items : [],
        activeCompletionIndex,
        applyCompletion
      );
      renderArgumentHelp(
        argumentHelp,
        argumentHelpOpen ? getArgumentHelp(request) : null
      );
      sourceAssist.hidden = completionList.hidden && argumentHelp.hidden;
    }

    function showCompletionListNow(): void {
      completionListExplicit = true;
      completionSuppressedUntilInput = false;
      updateAssist();
    }

    function hideAssist(): void {
      cancelAssistUpdate();
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
      previewSourceVersion += 1;
      props.sourceState.set(props.playground.id, source);
      if (!livePreviewActive) {
        livePreviewActive = true;
      }
      schedulePreviewUpdate();
      scheduleAssistUpdate();
    }

    function moveActiveCompletion(delta: number): boolean {
      const completionCount = getVisibleCompletionCount(
        completionList,
        completionResult
      );

      if (completionCount === 0) {
        return false;
      }

      activeCompletionIndex =
        (activeCompletionIndex + delta + completionCount) % completionCount;
      activeCompletionIndex = renderCompletionList(
        completionList,
        completionResult?.items ?? [],
        activeCompletionIndex,
        applyCompletion
      );
      return true;
    }

    function acceptActiveCompletion(): boolean {
      if (getVisibleCompletionCount(completionList, completionResult) === 0) {
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
          diagnosticDecorations,
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
    markPerfDuration(
      "playground-editor-setup",
      performance.now() - setupStart,
      props.playground.id
    );
    markPerfPoint(
      "playground-editor-ready",
      `${props.playground.id} ${(performance.now() - setupStart).toFixed(1)}ms`
    );

    function handleZoomChange(): void {
      previewPresenter.applyCurrentScale();
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleFitScaleUpdate();
    });

    zoomSelect.addEventListener("change", handleZoomChange);
    resizeObserver.observe(spriteViewport);
    if (livePreviewActive) {
      schedulePreviewUpdate(0);
    } else {
      previewPresenter.showCachedPreview();
      markPerfPoint("playground-cached-preview-shown", props.playground.id);
      releaseStartup("cached-preview");
    }
    scheduleFitScaleUpdate();

    return () => {
      disposed = true;
      clearPreviewUpdate();
      cancelPreviewRender();
      cancelAssistUpdate();
      cancelFitScaleUpdate();
      zoomSelect.removeEventListener("change", handleZoomChange);
      resizeObserver.disconnect();
      editorView.destroy();
      activationLeaseRef.current?.release();
      activationLeaseRef.current = null;
    };
  }, [
    isActivated,
    props.cachedPreview?.height,
    props.cachedPreview?.src,
    props.cachedPreview?.width,
    props.playground.id,
    props.playground.source,
    props.sourceState
  ]);

  return (
    <section
      className={`playground${immersive ? " playground--immersive" : ""}${
        !isActivated ? " playground--queued" : ""
      }`}
      ref={rootRef}
    >
      <h3 className="playground-title">{props.playground.title}</h3>
      <p className="playground-summary">{props.playground.summary}</p>
      <section className="playground-layout">
        <article className="playground-panel editor-panel">
          <div className="source-label">
            Source
            <div className="source-editor" ref={sourceEditorRef}>
              {!isActivated ? (
                <div className="playground-deferred-note">
                  Queued editor startup so the nearest row can initialize first.
                </div>
              ) : null}
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
          {!isActivated ? (
            <p className="playground-status">
              Queued preview startup. Higher rows activate first.
            </p>
          ) : null}
          <div className="sprite-viewport" ref={spriteViewportRef}>
            <div className="sprite-surface canvas-checkerboard" ref={spriteSurfaceRef}>
              {props.cachedPreview ? (
                <img
                  alt={`${props.playground.title} cached preview`}
                  className="sprite-cached-preview"
                  hidden={props.sourceState.has(props.playground.id)}
                  ref={cachedPreviewImageRef}
                  src={props.cachedPreview.src}
                />
              ) : null}
              <canvas
                className="sprite-canvas"
                hidden={
                  props.cachedPreview !== undefined &&
                  !props.sourceState.has(props.playground.id)
                }
                ref={spriteCanvasRef}
              />
            </div>
          </div>
          <div className="preview-toolbar">
            <p className="preview-meta" ref={previewMetaRef} />
            <span
              className="preview-state"
              data-state="queued"
              ref={previewStateRef}
            >
              Queued
            </span>
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
          <h4 className="diagnostics-heading">Diagnostics</h4>
          <pre className="diagnostics-output" ref={diagnosticsOutputRef} />
        </article>
      </section>
    </section>
  );
}
