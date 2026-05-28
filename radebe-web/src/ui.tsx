import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";

import { markPerfPoint, timePerfSync } from "./perf.js";
import { highlightSource } from "./syntax-highlight.js";
import type { HighlightSourceOptions } from "./syntax-highlight.js";
import type { DownloadLink } from "./types.js";

export function InfoList(props: { title: string; items: string[] }) {
  return (
    <section className="info-list">
      <h3 className="info-list-title">{props.title}</h3>
      <ul className="info-list-items">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function PlainList(props: { title: string; items: string[] }) {
  return (
    <section className="plain-list">
      <h4 className="plain-list-title">{props.title}</h4>
      <ul className="plain-list-items">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function CodeBlock(props: { source: string }) {
  return (
    <pre className="code-block">
      <code>{props.source}</code>
    </pre>
  );
}

export function HighlightedCodeBlock(props: {
  source: string;
  options?: HighlightSourceOptions;
}) {
  const optionsKey = JSON.stringify(props.options ?? {});
  const highlightedSource = useMemo(
    () =>
      timePerfSync(
        "highlighted-code-block-render",
        () => highlightSource(props.source, props.options ?? {}),
        `${props.source.split("\n").length} lines`
      ),
    [optionsKey, props.source]
  );

  return (
    <pre className="code-block">
      <code
        dangerouslySetInnerHTML={{
          __html: highlightedSource
        }}
      />
    </pre>
  );
}

export function ActionLink(props: { link: DownloadLink }) {
  return (
    <a
      className="action-link"
      download={props.link.download ? true : undefined}
      href={props.link.href}
    >
      {props.link.label}
    </a>
  );
}

export function Hero(props: {
  title: string;
  summary?: string;
  children?: ComponentChildren;
}) {
  return (
    <section className="hero">
      <h2 className="hero-heading">{props.title}</h2>
      {props.summary !== undefined ? (
        <p className="hero-summary">{props.summary}</p>
      ) : null}
      {props.children}
    </section>
  );
}

export function MiniPreview(props: {
  source: string;
  previewSrc: string;
  previewWidth: number;
  previewHeight: number;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const highlightedSource = useMemo(
    () =>
      timePerfSync("mini-preview-highlight-source", () => {
        return highlightSource(props.source);
      }),
    [props.source]
  );
  const width = Math.max(props.previewWidth, 1);
  const height = Math.max(props.previewHeight, 1);
  const scale = 3;

  useEffect(() => {
    markPerfPoint("mini-preview-effect-start");
    const image = imageRef.current;

    if (!image) {
      return;
    }

    window.requestAnimationFrame(() => {
      markPerfPoint("mini-preview-frame-ready");
    });
  }, [height, width]);

  return (
    <section className="mini-preview">
      <div>
        <pre className="code-block">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightedSource
            }}
          />
        </pre>
      </div>
      <div className="mini-preview-panel">
        <p className="mini-preview-label">Rendered artifact</p>
        <div className="mini-preview-canvas-wrap">
          <img
            alt="Rendered artifact preview"
            className="mini-preview-canvas canvas-checkerboard"
            height={height}
            onLoad={() => {
              markPerfPoint("mini-preview-image-loaded");
            }}
            ref={imageRef}
            src={props.previewSrc}
            style={{
              height: `${height * scale}px`,
              width: `${width * scale}px`
            }}
            width={width}
          />
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid(props: {
  items: { title: string; body: string }[];
}) {
  return (
    <section className="feature-grid">
      {props.items.map((item) => (
        <article className="feature-card" key={item.title}>
          <h3 className="feature-card-title">{item.title}</h3>
          <p className="feature-card-body">{item.body}</p>
        </article>
      ))}
    </section>
  );
}
