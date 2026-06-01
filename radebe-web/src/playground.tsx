import { useEffect, useRef, useState } from "preact/hooks";

import { markPerfDuration, markPerfPoint } from "./perf.js";
import {
  getNowMs,
  requestPlaygroundActivation,
  type PlaygroundActivationLease
} from "./playground/activation.js";
import type { CachedPreview } from "./playground/preview-presenter.js";
import {
  mountPlaygroundRuntime,
  type PlaygroundRuntimeElements
} from "./playground/runtime.js";
import type { ExamplePlayground } from "./types.js";

type ElementRef<T> = {
  current: T | null;
};

type PlaygroundElementRefs = {
  argumentHelp: ElementRef<HTMLDivElement>;
  cachedPreviewImage: ElementRef<HTMLImageElement>;
  completionList: ElementRef<HTMLDivElement>;
  diagnosticsOutput: ElementRef<HTMLPreElement>;
  previewMeta: ElementRef<HTMLParagraphElement>;
  previewState: ElementRef<HTMLSpanElement>;
  root: ElementRef<HTMLElement>;
  sourceAssist: ElementRef<HTMLDivElement>;
  sourceEditor: ElementRef<HTMLDivElement>;
  spriteCanvas: ElementRef<HTMLCanvasElement>;
  spriteSurface: ElementRef<HTMLDivElement>;
  spriteViewport: ElementRef<HTMLDivElement>;
  status: ElementRef<HTMLParagraphElement>;
  zoomSelect: ElementRef<HTMLSelectElement>;
};

function getRuntimeElements(refs: PlaygroundElementRefs): PlaygroundRuntimeElements {
  return {
    argumentHelp: refs.argumentHelp.current,
    cachedPreviewImage: refs.cachedPreviewImage.current,
    completionList: refs.completionList.current,
    diagnosticsOutput: refs.diagnosticsOutput.current,
    previewMeta: refs.previewMeta.current,
    previewState: refs.previewState.current,
    sourceAssist: refs.sourceAssist.current,
    sourceEditor: refs.sourceEditor.current,
    spriteCanvas: refs.spriteCanvas.current,
    spriteSurface: refs.spriteSurface.current,
    spriteViewport: refs.spriteViewport.current,
    status: refs.status.current,
    zoomSelect: refs.zoomSelect.current
  };
}

function usePlaygroundActivation(config: {
  activationLeaseRef: { current: PlaygroundActivationLease | null };
  activationQueuedAtRef: { current: number };
  activationStartedAtRef: { current: number | null };
  immersive: boolean;
  playgroundId: string;
  rootRef: ElementRef<HTMLElement>;
  setIsActivated: (value: boolean) => void;
}): void {
  useEffect(() => {
    const root = config.rootRef.current;

    if (!root) {
      return;
    }

    const clearLease = (): void => {
      config.activationLeaseRef.current?.release();
      config.activationLeaseRef.current = null;
    };

    config.activationQueuedAtRef.current = getNowMs();

    if (config.immersive) {
      config.activationStartedAtRef.current = config.activationQueuedAtRef.current;
      markPerfDuration("playground-activation-wait", 0, config.playgroundId);
      markPerfPoint("playground-activation-start", config.playgroundId);
      config.setIsActivated(true);

      return () => {
        clearLease();
      };
    }

    config.setIsActivated(false);
    config.activationStartedAtRef.current = null;
    markPerfPoint("playground-activation-queued", config.playgroundId);

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
        config.activationLeaseRef.current = lease;
        config.activationStartedAtRef.current = getNowMs();
        markPerfDuration(
          "playground-activation-wait",
          config.activationStartedAtRef.current - config.activationQueuedAtRef.current,
          config.playgroundId
        );
        markPerfPoint("playground-activation-start", config.playgroundId);
        config.setIsActivated(true);
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
  }, [
    config.activationLeaseRef,
    config.activationQueuedAtRef,
    config.activationStartedAtRef,
    config.immersive,
    config.playgroundId,
    config.rootRef,
    config.setIsActivated
  ]);
}

function useMountedPlaygroundRuntime(config: {
  activationLeaseRef: { current: PlaygroundActivationLease | null };
  activationQueuedAtRef: { current: number };
  activationStartedAtRef: { current: number | null };
  cachedPreview?: CachedPreview;
  isActivated: boolean;
  playground: ExamplePlayground;
  refs: PlaygroundElementRefs;
  sourceState: Map<string, string>;
}): void {
  useEffect(() => {
    if (!config.isActivated) {
      return;
    }

    markPerfPoint("playground-effect-start", config.playground.id);

    return (
      mountPlaygroundRuntime({
        activationLeaseRef: config.activationLeaseRef,
        activationQueuedAtRef: config.activationQueuedAtRef,
        activationStartedAtRef: config.activationStartedAtRef,
        cachedPreview: config.cachedPreview,
        elements: getRuntimeElements(config.refs),
        playground: config.playground,
        sourceState: config.sourceState
      }) ?? undefined
    );
  }, [
    config.activationLeaseRef,
    config.activationQueuedAtRef,
    config.activationStartedAtRef,
    config.cachedPreview?.height,
    config.cachedPreview?.src,
    config.cachedPreview?.width,
    config.isActivated,
    config.playground.id,
    config.playground.source,
    config.sourceState
  ]);
}

function PlaygroundMarkup(props: {
  cachedPreview?: CachedPreview;
  immersive: boolean;
  isActivated: boolean;
  playground: ExamplePlayground;
  refs: PlaygroundElementRefs;
  sourceState: Map<string, string>;
}) {
  return (
    <section
      className={`playground${props.immersive ? " playground--immersive" : ""}${
        !props.isActivated ? " playground--queued" : ""
      }`}
      ref={props.refs.root}
    >
      <h3 className="playground-title">{props.playground.title}</h3>
      <p className="playground-summary">{props.playground.summary}</p>
      <section className="playground-layout">
        <article className="playground-panel editor-panel">
          <div className="source-label">
            Source
            <div className="source-editor" ref={props.refs.sourceEditor}>
              {!props.isActivated ? (
                <div className="playground-deferred-note">
                  Queued editor startup so the nearest row can initialize first.
                </div>
              ) : null}
              <div className="editor-assist" hidden ref={props.refs.sourceAssist}>
                <div className="completion-list" hidden ref={props.refs.completionList} />
                <div className="argument-help" hidden ref={props.refs.argumentHelp} />
              </div>
            </div>
          </div>
          <p className="playground-status" ref={props.refs.status} />
        </article>
        <article className="playground-panel preview-panel">
          <h4 className="preview-heading">Preview</h4>
          {!props.isActivated ? (
            <p className="playground-status">
              Queued preview startup. Higher rows activate first.
            </p>
          ) : null}
          <div className="sprite-viewport" ref={props.refs.spriteViewport}>
            <div className="sprite-surface canvas-checkerboard" ref={props.refs.spriteSurface}>
              {props.cachedPreview ? (
                <img
                  alt={`${props.playground.title} cached preview`}
                  className="sprite-cached-preview"
                  hidden={props.sourceState.has(props.playground.id)}
                  ref={props.refs.cachedPreviewImage}
                  src={props.cachedPreview.src}
                />
              ) : null}
              <canvas
                className="sprite-canvas"
                hidden={
                  props.cachedPreview !== undefined &&
                  !props.sourceState.has(props.playground.id)
                }
                ref={props.refs.spriteCanvas}
              />
            </div>
          </div>
          <div className="preview-toolbar">
            <p className="preview-meta" ref={props.refs.previewMeta} />
            <span
              className="preview-state"
              data-state="queued"
              ref={props.refs.previewState}
            >
              Queued
            </span>
            <label className="zoom-label">
              Zoom
              <select className="zoom-select" defaultValue="fit" ref={props.refs.zoomSelect}>
                <option value="fit">Fit</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
                <option value="8">8x</option>
              </select>
            </label>
          </div>
          <h4 className="diagnostics-heading">Diagnostics</h4>
          <pre className="diagnostics-output" ref={props.refs.diagnosticsOutput} />
        </article>
      </section>
    </section>
  );
}

export function Playground(props: {
  playground: ExamplePlayground;
  sourceState: Map<string, string>;
  cachedPreview?: CachedPreview;
  immersive?: boolean;
}) {
  const refs: PlaygroundElementRefs = {
    argumentHelp: useRef<HTMLDivElement>(null),
    cachedPreviewImage: useRef<HTMLImageElement>(null),
    completionList: useRef<HTMLDivElement>(null),
    diagnosticsOutput: useRef<HTMLPreElement>(null),
    previewMeta: useRef<HTMLParagraphElement>(null),
    previewState: useRef<HTMLSpanElement>(null),
    root: useRef<HTMLElement>(null),
    sourceAssist: useRef<HTMLDivElement>(null),
    sourceEditor: useRef<HTMLDivElement>(null),
    spriteCanvas: useRef<HTMLCanvasElement>(null),
    spriteSurface: useRef<HTMLDivElement>(null),
    spriteViewport: useRef<HTMLDivElement>(null),
    status: useRef<HTMLParagraphElement>(null),
    zoomSelect: useRef<HTMLSelectElement>(null)
  };
  const immersive = props.immersive === true;
  const activationLeaseRef = useRef<PlaygroundActivationLease | null>(null);
  const activationQueuedAtRef = useRef(getNowMs());
  const activationStartedAtRef = useRef<number | null>(immersive ? getNowMs() : null);
  const [isActivated, setIsActivated] = useState(immersive);

  usePlaygroundActivation({
    activationLeaseRef,
    activationQueuedAtRef,
    activationStartedAtRef,
    immersive,
    playgroundId: props.playground.id,
    rootRef: refs.root,
    setIsActivated
  });
  useMountedPlaygroundRuntime({
    activationLeaseRef,
    activationQueuedAtRef,
    activationStartedAtRef,
    cachedPreview: props.cachedPreview,
    isActivated,
    playground: props.playground,
    refs,
    sourceState: props.sourceState
  });

  return (
    <PlaygroundMarkup
      cachedPreview={props.cachedPreview}
      immersive={immersive}
      isActivated={isActivated}
      playground={props.playground}
      refs={refs}
      sourceState={props.sourceState}
    />
  );
}
