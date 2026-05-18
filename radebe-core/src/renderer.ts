import { compileDocument } from "./compiler.js";
import { parseSource } from "./parser.js";

import type {
  CompiledDocument,
  CompiledDrawCommand,
  LinearGradientFill,
  RadialGradientFill,
  RectFill,
  PipelineResult,
  RenderArtifact,
  RenderResult,
  SourceDocument,
  StrokeAppearance
} from "./types.js";

type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const NAMED_COLORS: Record<string, RgbaColor> = {
  black: { r: 0, g: 0, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  white: { r: 255, g: 255, b: 255, a: 1 }
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(color: string): RgbaColor | null {
  const hex = color.slice(1);

  if (hex.length === 3 || hex.length === 4) {
    const [r = "", g = "", b = "", a = "f"] = hex.split("");
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: Number.parseInt(`${a}${a}`, 16) / 255
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    const alpha = hex.length === 8 ? hex.slice(6, 8) : "ff";
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: Number.parseInt(alpha, 16) / 255
    };
  }

  return null;
}

function parseColor(color: string): RgbaColor | null {
  const normalized = color.trim().toLowerCase();

  if (normalized.startsWith("#")) {
    return parseHexColor(normalized);
  }

  return NAMED_COLORS[normalized] ?? null;
}

function blendColors(
  destination: RgbaColor | null,
  source: RgbaColor
): RgbaColor {
  if (destination === null) {
    return { ...source };
  }

  const outputAlpha = source.a + destination.a * (1 - source.a);

  if (outputAlpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r:
      (source.r * source.a +
        destination.r * destination.a * (1 - source.a)) /
      outputAlpha,
    g:
      (source.g * source.a +
        destination.g * destination.a * (1 - source.a)) /
      outputAlpha,
    b:
      (source.b * source.a +
        destination.b * destination.a * (1 - source.a)) /
      outputAlpha,
    a: outputAlpha
  };
}

function formatColor(color: RgbaColor | null): string | null {
  if (color === null || color.a <= 0) {
    return null;
  }

  const r = clampByte(color.r).toString(16).padStart(2, "0");
  const g = clampByte(color.g).toString(16).padStart(2, "0");
  const b = clampByte(color.b).toString(16).padStart(2, "0");
  const alpha = clampByte(color.a * 255).toString(16).padStart(2, "0");

  return alpha === "ff" ? `#${r}${g}${b}` : `#${r}${g}${b}${alpha}`;
}

function withOpacity(color: RgbaColor, opacity: number): RgbaColor {
  return {
    ...color,
    a: clampUnit(color.a * opacity)
  };
}

function setPixel(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  x: number,
  y: number,
  color: string,
  opacity = 1
): void {
  if (y < 0 || y >= pixels.length) {
    return;
  }

  if (x < 0 || x >= pixels[y]!.length) {
    return;
  }

  const parsed = parseColor(color);

  if (parsed === null) {
    return;
  }

  pixels[y]![x] = blendColors(pixels[y]![x] ?? null, withOpacity(parsed, opacity));
  drawnPixels[y]![x] = true;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function isPointInsidePolygon(
  pointX: number,
  pointY: number,
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index]!;
    const previousPoint = polygon[previous]!;
    const intersects =
      currentPoint.y > pointY !== previousPoint.y > pointY &&
      pointX <
        ((previousPoint.x - currentPoint.x) * (pointY - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function buildCutPolygon(
  rect: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height" | "cut">
): Array<{ x: number; y: number }> | null {
  if (!rect.cut) {
    return null;
  }

  return [
    { x: rect.x + rect.cut.topLeft, y: rect.y },
    { x: rect.x + rect.width - rect.cut.topRight, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.cut.topRight },
    { x: rect.x + rect.width, y: rect.y + rect.height - rect.cut.bottomRight },
    { x: rect.x + rect.width - rect.cut.bottomRight, y: rect.y + rect.height },
    { x: rect.x + rect.cut.bottomLeft, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height - rect.cut.bottomLeft },
    { x: rect.x, y: rect.y + rect.cut.topLeft }
  ];
}

function sampleGradientStops(
  stops: { color: string; position: number }[],
  position: number
): string | null {
  const sortedStops = [...stops].sort((left, right) => left.position - right.position);
  const clampedPosition = clampUnit(position);

  if (clampedPosition <= sortedStops[0]!.position) {
    return sortedStops[0]!.color;
  }

  if (clampedPosition >= sortedStops[sortedStops.length - 1]!.position) {
    return sortedStops[sortedStops.length - 1]!.color;
  }

  for (let index = 0; index < sortedStops.length - 1; index += 1) {
    const current = sortedStops[index]!;
    const next = sortedStops[index + 1]!;

    if (
      clampedPosition >= current.position &&
      clampedPosition <= next.position
    ) {
      const currentColor = parseColor(current.color);
      const nextColor = parseColor(next.color);

      if (currentColor === null || nextColor === null) {
        return current.color;
      }

      const interval =
        next.position === current.position
          ? 0
          : (clampedPosition - current.position) /
            (next.position - current.position);
      const mixed: RgbaColor = {
        r: lerp(currentColor.r, nextColor.r, interval),
        g: lerp(currentColor.g, nextColor.g, interval),
        b: lerp(currentColor.b, nextColor.b, interval),
        a: lerp(currentColor.a, nextColor.a, interval)
      };

      return formatColor(mixed);
    }
  }

  return sortedStops[sortedStops.length - 1]!.color;
}

function resolveLinearGradientPosition(
  fill: LinearGradientFill,
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  x: number,
  y: number
): number {
  const normalizedX =
    command.width <= 1 ? 0.5 : (x - command.x) / (command.width - 1);
  const normalizedY =
    command.height <= 1 ? 0.5 : (y - command.y) / (command.height - 1);
  const angleRadians =
    fill.angle === null
      ? fill.direction === "vertical"
        ? Math.PI / 2
        : 0
      : (fill.angle * Math.PI) / 180;
  const directionX = Math.cos(angleRadians);
  const directionY = Math.sin(angleRadians);
  const corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ];
  const cornerProjections = corners.map(
    (corner) => corner.x * directionX + corner.y * directionY
  );
  const minProjection = Math.min(...cornerProjections);
  const maxProjection = Math.max(...cornerProjections);
  const projection = normalizedX * directionX + normalizedY * directionY;

  if (maxProjection === minProjection) {
    return 0;
  }

  return (projection - minProjection) / (maxProjection - minProjection);
}

function resolveRadialGradientPosition(
  fill: RadialGradientFill,
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  x: number,
  y: number
): number {
  const normalizedX =
    command.width <= 1 ? 0.5 : (x - command.x) / (command.width - 1);
  const normalizedY =
    command.height <= 1 ? 0.5 : (y - command.y) / (command.height - 1);
  const deltaX = normalizedX - fill.centerX;
  const deltaY = normalizedY - fill.centerY;
  const corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ];
  const maxCornerDistance = Math.max(
    ...corners.map((corner) =>
      Math.hypot(corner.x - fill.centerX, corner.y - fill.centerY)
    )
  );

  if (maxCornerDistance === 0) {
    return 0;
  }

  return Math.hypot(deltaX, deltaY) / (maxCornerDistance * fill.radius);
}

function drawRectFill(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height" | "cut">,
  fill: RectFill
): void {
  const polygon = buildCutPolygon(command);

  for (let y = command.y; y < command.y + command.height; y += 1) {
    for (let x = command.x; x < command.x + command.width; x += 1) {
      if (
        polygon !== null &&
        !isPointInsidePolygon(x + 0.5, y + 0.5, polygon)
      ) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, command, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, command, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, fill.alpha);
      }
    }
  }
}

function resolveStrokeExtents(
  width: number,
  align: "inside" | "center" | "outside"
): { inner: number; outer: number } {
  if (align === "inside") {
    return { inner: width, outer: 0 };
  }

  if (align === "outside") {
    return { inner: 0, outer: width };
  }

  const inside = Math.ceil(width / 2);
  const outside = Math.floor(width / 2);

  return {
    inner: inside,
    outer: outside
  };
}

function getStrokePatternState(
  style: "solid" | "dashed" | "dotted",
  position: number,
  strokeWidth: number,
  dashLength: number | null,
  gapLength: number | null,
  dotSpacing: number | null
): boolean {
  if (style === "solid") {
    return true;
  }

  if (style === "dashed") {
    const dash = Math.max(Math.round(dashLength ?? strokeWidth * 3), 1);
    const gap = Math.max(Math.round(gapLength ?? strokeWidth * 2), 0);
    const cycle = dash + gap;

    if (cycle <= 0) {
      return true;
    }

    return position % cycle < dash;
  }

  const dot = Math.max(strokeWidth, 1);
  const gap = Math.max(Math.round(dotSpacing ?? strokeWidth * 2), 0);
  const cycle = dot + gap;

  if (cycle <= 0) {
    return true;
  }

  return position % cycle < dot;
}

function drawStrokeRectBand(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  rect: { x: number; y: number; width: number; height: number },
  sampleRect: { x: number; y: number; width: number; height: number },
  fill: RectFill,
  style: "solid" | "dashed" | "dotted",
  strokeWidth: number,
  dashLength: number | null,
  gapLength: number | null,
  dotSpacing: number | null,
  opacity: number,
  axis: "x" | "y"
): void {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const patternPosition = axis === "x" ? x - rect.x : y - rect.y;

      if (
        !getStrokePatternState(
          style,
          patternPosition,
          strokeWidth,
          dashLength,
          gapLength,
          dotSpacing
        )
      ) {
        continue;
      }

      const color =
        fill.kind === "solid"
          ? fill.color
          : fill.kind === "gradient-linear"
            ? sampleGradientStops(
                fill.stops,
                resolveLinearGradientPosition(fill, sampleRect, x, y)
              )
            : sampleGradientStops(
                fill.stops,
                resolveRadialGradientPosition(fill, sampleRect, x, y)
              );

      if (color !== null) {
        setPixel(pixels, drawnPixels, x, y, color, opacity);
      }
    }
  }
}

function buildStrokeEnvelopeRect(
  rect: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  stroke: StrokeAppearance
): { x: number; y: number; width: number; height: number; inner: number; outer: number } {
  const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);

  return {
    x: rect.x - outer,
    y: rect.y - outer,
    width: rect.width + outer * 2,
    height: rect.height + outer * 2,
    inner,
    outer
  };
}

function drawRectStroke(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: Pick<Extract<CompiledDrawCommand, { kind: "rect" }>, "x" | "y" | "width" | "height">,
  stroke: StrokeAppearance
): void {
  const outerRect = buildStrokeEnvelopeRect(command, stroke);
  const inner = outerRect.inner;
  const topBand = {
    x: outerRect.x,
    y: outerRect.y,
    width: outerRect.width,
    height: stroke.width
  };
  const bottomBand = {
    x: outerRect.x,
    y: command.y + command.height - inner,
    width: outerRect.width,
    height: stroke.width
  };
  const middleHeight = command.height - inner - inner;
  const leftBand = {
    x: outerRect.x,
    y: command.y + inner,
    width: stroke.width,
    height: Math.max(middleHeight, 0)
  };
  const rightBand = {
    x: command.x + command.width - inner,
    y: command.y + inner,
    width: stroke.width,
    height: Math.max(middleHeight, 0)
  };

  if (stroke.fill !== null) {
    drawStrokeRectBand(
      pixels,
      drawnPixels,
      topBand,
      outerRect,
      stroke.fill,
      stroke.style,
      stroke.width,
      stroke.dashLength,
      stroke.gapLength,
      stroke.dotSpacing,
      stroke.alpha * stroke.fill.alpha,
      "x"
    );
    drawStrokeRectBand(
      pixels,
      drawnPixels,
      bottomBand,
      outerRect,
      stroke.fill,
      stroke.style,
      stroke.width,
      stroke.dashLength,
      stroke.gapLength,
      stroke.dotSpacing,
      stroke.alpha * stroke.fill.alpha,
      "x"
    );

    if (leftBand.height > 0) {
      drawStrokeRectBand(
        pixels,
        drawnPixels,
        leftBand,
        outerRect,
        stroke.fill,
        stroke.style,
        stroke.width,
        stroke.dashLength,
        stroke.gapLength,
        stroke.dotSpacing,
        stroke.alpha * stroke.fill.alpha,
        "y"
      );
    }

    if (rightBand.height > 0) {
      drawStrokeRectBand(
        pixels,
        drawnPixels,
        rightBand,
        outerRect,
        stroke.fill,
        stroke.style,
        stroke.width,
        stroke.dashLength,
        stroke.gapLength,
        stroke.dotSpacing,
        stroke.alpha * stroke.fill.alpha,
        "y"
      );
    }
  }

  stroke.strokes.forEach((nestedStroke) => {
    drawRectStroke(pixels, drawnPixels, outerRect, nestedStroke);
  });
}

function drawCommand(
  pixels: (RgbaColor | null)[][],
  drawnPixels: boolean[][],
  command: CompiledDrawCommand
): void {
  if (command.kind === "plot") {
    setPixel(pixels, drawnPixels, command.x, command.y, command.color);
    return;
  }

  if (command.kind === "rect") {
    command.fills.forEach((fill) => {
      drawRectFill(pixels, drawnPixels, command, fill);
    });
    command.strokes.forEach((stroke) => {
      drawRectStroke(pixels, drawnPixels, command, stroke);
    });
    return;
  }

  let currentX = command.x1;
  let currentY = command.y1;
  const deltaX = Math.abs(command.x2 - command.x1);
  const deltaY = Math.abs(command.y2 - command.y1);
  const stepX = command.x1 < command.x2 ? 1 : -1;
  const stepY = command.y1 < command.y2 ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    setPixel(pixels, drawnPixels, currentX, currentY, command.color);

    if (currentX === command.x2 && currentY === command.y2) {
      break;
    }

    const doubleError = error * 2;

    if (doubleError > -deltaY) {
      error -= deltaY;
      currentX += stepX;
    }

    if (doubleError < deltaX) {
      error += deltaX;
      currentY += stepY;
    }
  }
}

function buildSpriteGridArtifact(document: CompiledDocument): RenderArtifact {
  const width = document.sprite?.width ?? 0;
  const height = document.sprite?.height ?? 0;
  const background = document.sprite?.background ?? "transparent";
  const backgroundColor = background === "transparent" ? null : parseColor(background);
  const pixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => backgroundColor)
  );
  const drawnPixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  document.commands.forEach((command) => {
    drawCommand(pixels, drawnPixels, command);
  });

  const formattedPixels = pixels.map((row) => row.map((pixel) => formatColor(pixel)));
  const rows = formattedPixels.map((row, y) =>
    row
      .map((pixel, x) => {
        if (drawnPixels[y]![x]) {
          return "#";
        }

        return pixel === null ? "." : ":";
      })
      .join("")
  );

  return {
    kind: "sprite-grid",
    width,
    height,
    background,
    rows,
    pixels: formattedPixels
  };
}

export function renderDocument(document: CompiledDocument): RenderResult {
  return {
    artifact: buildSpriteGridArtifact(document),
    diagnostics: []
  };
}

export function renderSource(request: SourceDocument): PipelineResult {
  const parsed = parseSource(request);
  const compiled = compileDocument(parsed.document);
  const rendered = renderDocument(compiled.document);

  return {
    parsed: parsed.document,
    compiled: compiled.document,
    artifact: rendered.artifact,
    diagnostics: [
      ...parsed.diagnostics,
      ...compiled.diagnostics,
      ...rendered.diagnostics
    ]
  };
}
