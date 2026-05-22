import { renderSource } from "@radebe/core";
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";

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
  return (
    <pre className="code-block">
      <code
        dangerouslySetInnerHTML={{
          __html: highlightSource(props.source, props.options ?? {})
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
  summary: string;
  children?: ComponentChildren;
}) {
  return (
    <section className="hero">
      <h2 className="hero-heading">{props.title}</h2>
      <p className="hero-summary">{props.summary}</p>
      {props.children}
    </section>
  );
}

export function MiniPreview(props: { source: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const result = useMemo(
    () => renderSource({ source: props.source }),
    [props.source]
  );
  const width = Math.max(result.artifact.width, 1);
  const height = Math.max(result.artifact.height, 1);
  const scale = 3;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    if (result.artifact.background !== "transparent") {
      context.fillStyle = result.artifact.background;
      context.fillRect(0, 0, result.artifact.width, result.artifact.height);
    }

    result.artifact.pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel !== null) {
          context.fillStyle = pixel;
          context.fillRect(x, y, 1, 1);
        }
      });
    });
  }, [height, result, width]);

  return (
    <section className="mini-preview">
      <div>
        <HighlightedCodeBlock source={props.source} />
      </div>
      <div className="mini-preview-panel">
        <p className="mini-preview-label">Rendered artifact</p>
        <div className="mini-preview-canvas-wrap canvas-checkerboard">
          <canvas
            className="mini-preview-canvas"
            ref={canvasRef}
            style={{
              height: `${height * scale}px`,
              width: `${width * scale}px`
            }}
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
