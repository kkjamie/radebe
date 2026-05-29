import { drawCircleCommand } from "./commands/circle/index.js";
import { drawPolygonCommand } from "./commands/polygon/index.js";
import { drawRectCommand } from "./commands/rect/index.js";
import {
  buildAlphaMask,
  buildSpreadMask,
  compositeLayer,
  createBoxBlurredAlphaSampler,
  createLayer,
  drawGlowFromAlpha,
  expandBounds,
  formatColor,
  getAlphaMaskBounds,
  getClosestPathSegmentSample,
  getGlowBlurRadius,
  getMaskAlpha,
  getPathStrokeBounds,
  getPixelCoverage,
  resolveStrokeExtents,
  getShadowBlurRadius,
  getStrokePatternState,
  offsetAndExpandBounds,
  parseColor,
  sampleFillColor,
  sampleMaskAlpha,
  setPixel,
  withOpacity,
  type AlphaMask,
  type DrawnGrid,
  type Layer,
  type PixelGrid,
  type RectBounds
} from "./shared.js";

import type {
  CompiledDocument,
  CompiledDrawCommand,
  GlowAppearance,
  RectFill,
  RenderArtifact,
  RenderResult,
  ShadowAppearance,
  StrokeAppearance
} from "../types.js";

/**
 * Owns the renderer stage after compilation.
 *
 * The source pipeline is:
 * 1. `parseSource` normalizes source text into an indentation-based syntax tree.
 * 2. `compileDocument` lowers that tree into plain compiled draw instructions.
 * 3. `DocumentRenderer` rasterizes the compiled document into a sprite-grid artifact.
 */
export class DocumentRenderer {
  public constructor(private readonly document: CompiledDocument) {}

  public render(): RenderResult {
    return {
      artifact: this.buildSpriteGridArtifact(),
      diagnostics: []
    };
  }

  private drawMaskFill(
    layer: Layer,
    mask: AlphaMask,
    bounds: RectBounds,
    fill: RectFill
  ): void {
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const coverage = getMaskAlpha(mask, x, y);

        if (coverage <= 0) {
          continue;
        }

        const color = sampleFillColor(fill, bounds, x, y);

        if (color !== null) {
          setPixel(layer.pixels, layer.drawnPixels, x, y, color, fill.alpha * coverage);
        }
      }
    }
  }

  private drawMaskShadow(
    layer: Layer,
    mask: AlphaMask,
    bounds: RectBounds,
    shadow: ShadowAppearance
  ): void {
    if (shadow.fill === null) {
      return;
    }

    const blurRadius = getShadowBlurRadius(shadow);
    const expansion = Math.max(Math.ceil(Math.abs(shadow.spread)), 0);
    const shadowBounds = offsetAndExpandBounds(
      bounds,
      shadow.offsetX,
      shadow.offsetY,
      expansion
    );
    const drawBounds =
      blurRadius === 0 ? shadowBounds : expandBounds(shadowBounds, blurRadius);
    const sampleShadowAlpha = (sampleX: number, sampleY: number) => {
      const sourceX = Math.round(sampleX - shadow.offsetX);
      const sourceY = Math.round(sampleY - shadow.offsetY);

      return sampleMaskAlpha(mask, sourceX, sourceY, shadow.spread);
    };
    const sampleShadowCoverage = createBoxBlurredAlphaSampler(
      drawBounds,
      blurRadius,
      sampleShadowAlpha
    );

    for (let y = drawBounds.y; y < drawBounds.y + drawBounds.height; y += 1) {
      for (let x = drawBounds.x; x < drawBounds.x + drawBounds.width; x += 1) {
        const coverage = sampleShadowCoverage(x, y);

        if (coverage <= 0) {
          continue;
        }

        const color = sampleFillColor(shadow.fill, shadowBounds, x, y);

        if (color !== null) {
          setPixel(
            layer.pixels,
            layer.drawnPixels,
            x,
            y,
            color,
            shadow.alpha * shadow.fill.alpha * coverage
          );
        }
      }
    }
  }

  private drawMaskGlow(
    layer: Layer,
    mask: AlphaMask,
    bounds: RectBounds,
    glow: GlowAppearance
  ): void {
    if (glow.fill === null) {
      return;
    }

    const spread = Math.max(glow.spread, 0);
    const blurRadius = getGlowBlurRadius(glow);
    const glowBounds =
      glow.mode === "outer" ? expandBounds(bounds, spread) : bounds;
    const drawBounds =
      glow.mode === "outer" ? expandBounds(glowBounds, blurRadius) : bounds;
    const sampleSourceAlpha = (sampleX: number, sampleY: number) =>
      getMaskAlpha(mask, Math.round(sampleX), Math.round(sampleY));
    const sampleGlowBaseAlpha = (sampleX: number, sampleY: number) =>
      sampleMaskAlpha(
        mask,
        Math.round(sampleX),
        Math.round(sampleY),
        glow.mode === "outer" ? spread : -spread
      );

    drawGlowFromAlpha(
      layer.pixels,
      layer.drawnPixels,
      glow,
      drawBounds,
      glowBounds,
      sampleSourceAlpha,
      sampleGlowBaseAlpha
    );
  }

  private drawMaskStroke(
    layer: Layer,
    mask: AlphaMask,
    bounds: RectBounds,
    stroke: StrokeAppearance
  ): void {
    const { inner, outer } = resolveStrokeExtents(stroke.width, stroke.align);
    const strokeBounds = expandBounds(bounds, outer);

    if (stroke.fill !== null) {
      for (let y = strokeBounds.y; y < strokeBounds.y + strokeBounds.height; y += 1) {
        for (let x = strokeBounds.x; x < strokeBounds.x + strokeBounds.width; x += 1) {
          const patternPosition = x - strokeBounds.x + (y - strokeBounds.y);

          if (
            !getStrokePatternState(
              stroke.style,
              patternPosition,
              stroke.width,
              stroke.dashLength,
              stroke.gapLength,
              stroke.dotSpacing
            )
          ) {
            continue;
          }

          const outerAlpha =
            outer > 0 ? sampleMaskAlpha(mask, x, y, outer) : getMaskAlpha(mask, x, y);
          const innerAlpha =
            inner > 0 ? sampleMaskAlpha(mask, x, y, -inner) : getMaskAlpha(mask, x, y);
          const coverage = Math.max(outerAlpha - innerAlpha, 0);

          if (coverage <= 0) {
            continue;
          }

          const color = sampleFillColor(stroke.fill, strokeBounds, x, y);

          if (color !== null) {
            setPixel(
              layer.pixels,
              layer.drawnPixels,
              x,
              y,
              color,
              stroke.alpha * stroke.fill.alpha * coverage
            );
          }
        }
      }
    }

    const nestedMask = buildSpreadMask(mask, outer);
    const nestedBounds = outer > 0 ? strokeBounds : bounds;

    stroke.strokes.forEach((nestedStroke) => {
      this.drawMaskStroke(layer, nestedMask, nestedBounds, nestedStroke);
    });
  }

  private groupHasPasses(command: Extract<CompiledDrawCommand, { kind: "group" }>): boolean {
    return (
      command.fills.length > 0 ||
      (command.glows?.length ?? 0) > 0 ||
      (command.shadows?.length ?? 0) > 0 ||
      command.strokes.length > 0
    );
  }

  private drawPixelLine(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: Pick<
      Extract<CompiledDrawCommand, { kind: "line" }>,
      "x1" | "y1" | "x2" | "y2" | "color"
    >
  ): void {
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

      const doubledError = error * 2;

      if (doubledError > -deltaY) {
        error -= deltaY;
        currentX += stepX;
      }

      if (doubledError < deltaX) {
        error += deltaX;
        currentY += stepY;
      }
    }
  }

  private drawAntialiasedLine(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: Pick<
      Extract<CompiledDrawCommand, { kind: "line" }>,
      "x1" | "y1" | "x2" | "y2" | "color"
    >
  ): void {
    const minX = Math.min(command.x1, command.x2);
    const minY = Math.min(command.y1, command.y2);
    const maxX = Math.max(command.x1, command.x2);
    const maxY = Math.max(command.y1, command.y2);
    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
    const start = { x: command.x1 + 0.5, y: command.y1 + 0.5 };
    const end = { x: command.x2 + 0.5, y: command.y2 + 0.5 };

    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        const coverage = getPixelCoverage(x, y, true, (pointX, pointY) =>
          getClosestPathSegmentSample(pointX, pointY, [start, end]).distance <= 0.5
        );

        if (coverage <= 0) {
          continue;
        }

        setPixel(pixels, drawnPixels, x, y, command.color, coverage);
      }
    }
  }

  private drawPathStroke(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: Pick<Extract<CompiledDrawCommand, { kind: "path" }>, "points">,
    stroke: StrokeAppearance,
    antialias: boolean
  ): void {
    const bounds = getPathStrokeBounds(command.points, stroke);

    if (stroke.fill !== null) {
      for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
        for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
          const coverage = getPixelCoverage(x, y, antialias, (pointX, pointY) => {
            const closestSegment = getClosestPathSegmentSample(
              pointX,
              pointY,
              command.points
            );

            return (
              closestSegment.distance <= bounds.radius &&
              getStrokePatternState(
                stroke.style,
                closestSegment.perimeterPosition,
                stroke.width,
                stroke.dashLength,
                stroke.gapLength,
                stroke.dotSpacing
              )
            );
          });

          if (coverage <= 0) {
            continue;
          }

          const color = sampleFillColor(stroke.fill, bounds, x, y);

          if (color !== null) {
            setPixel(
              pixels,
              drawnPixels,
              x,
              y,
              color,
              stroke.alpha * stroke.fill.alpha * coverage
            );
          }
        }
      }
    }

    stroke.strokes.forEach((nestedStroke) => {
      this.drawPathStroke(pixels, drawnPixels, command, nestedStroke, antialias);
    });
  }

  private drawGroup(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: Extract<CompiledDrawCommand, { kind: "group" }>,
    defaultAntialias: boolean
  ): void {
    if (!this.groupHasPasses(command)) {
      command.commands.forEach((childCommand) => {
        this.drawCommand(pixels, drawnPixels, childCommand, defaultAntialias);
      });
      return;
    }

    const height = pixels.length;
    const width = pixels[0]?.length ?? 0;
    const childLayer = createLayer(width, height);

    command.commands.forEach((childCommand) => {
      this.drawCommand(
        childLayer.pixels,
        childLayer.drawnPixels,
        childCommand,
        defaultAntialias
      );
    });

    const mask = buildAlphaMask(childLayer.pixels);
    const bounds = getAlphaMaskBounds(mask);

    if (bounds === null) {
      return;
    }

    const finalLayer = createLayer(width, height);

    (command.shadows ?? []).forEach((shadow) => {
      this.drawMaskShadow(finalLayer, mask, bounds, shadow);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "outer")
      .forEach((glow) => {
        this.drawMaskGlow(finalLayer, mask, bounds, glow);
      });
    compositeLayer(finalLayer.pixels, finalLayer.drawnPixels, childLayer);
    command.fills.forEach((fill) => {
      this.drawMaskFill(finalLayer, mask, bounds, fill);
    });
    (command.glows ?? [])
      .filter((glow) => glow.mode === "inner")
      .forEach((glow) => {
        this.drawMaskGlow(finalLayer, mask, bounds, glow);
      });
    command.strokes.forEach((stroke) => {
      this.drawMaskStroke(finalLayer, mask, bounds, stroke);
    });

    compositeLayer(pixels, drawnPixels, finalLayer);
  }

  private applyAlphaMaskToLayer(layer: Layer, mask: AlphaMask, invert: boolean): void {
    for (let y = 0; y < layer.height; y += 1) {
      for (let x = 0; x < layer.width; x += 1) {
        const color = layer.pixels[y]![x];

        if (color === null || color.a <= 0) {
          layer.pixels[y]![x] = null;
          layer.drawnPixels[y]![x] = false;
          continue;
        }

        const maskAlpha = getMaskAlpha(mask, x, y);
        const coverage = invert ? 1 - maskAlpha : maskAlpha;

        if (coverage <= 0) {
          layer.pixels[y]![x] = null;
          layer.drawnPixels[y]![x] = false;
          continue;
        }

        layer.pixels[y]![x] = withOpacity(color, coverage);
        layer.drawnPixels[y]![x] = true;
      }
    }
  }

  private drawMask(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: Extract<CompiledDrawCommand, { kind: "mask" }>,
    defaultAntialias: boolean
  ): void {
    const height = pixels.length;
    const width = pixels[0]?.length ?? 0;
    const shapeLayer = createLayer(width, height);
    const contentLayer = createLayer(width, height);

    command.shapeCommands.forEach((shapeCommand) => {
      this.drawCommand(
        shapeLayer.pixels,
        shapeLayer.drawnPixels,
        shapeCommand,
        defaultAntialias
      );
    });

    command.contentCommands.forEach((contentCommand) => {
      this.drawCommand(
        contentLayer.pixels,
        contentLayer.drawnPixels,
        contentCommand,
        defaultAntialias
      );
    });

    if (command.show === "shape-only") {
      compositeLayer(pixels, drawnPixels, shapeLayer);
      return;
    }

    if (command.show === "content-only") {
      compositeLayer(pixels, drawnPixels, contentLayer);
      return;
    }

    this.applyAlphaMaskToLayer(contentLayer, buildAlphaMask(shapeLayer.pixels), command.invert);
    compositeLayer(pixels, drawnPixels, contentLayer);
  }

  private drawCommand(
    pixels: PixelGrid,
    drawnPixels: DrawnGrid,
    command: CompiledDrawCommand,
    defaultAntialias: boolean
  ): void {
    if (command.kind === "plot") {
      setPixel(pixels, drawnPixels, command.x, command.y, command.color);
      return;
    }

    if (command.kind === "rect") {
      drawRectCommand(pixels, drawnPixels, command, defaultAntialias);
      return;
    }

    if (command.kind === "circle") {
      drawCircleCommand(pixels, drawnPixels, command, defaultAntialias);
      return;
    }

    if (command.kind === "polygon") {
      drawPolygonCommand(pixels, drawnPixels, command, defaultAntialias);
      return;
    }

    if (command.kind === "path") {
      const antialias = command.antialias ?? defaultAntialias;
      command.strokes.forEach((stroke) => {
        this.drawPathStroke(pixels, drawnPixels, command, stroke, antialias);
      });
      return;
    }

    if (command.kind === "group") {
      this.drawGroup(pixels, drawnPixels, command, defaultAntialias);
      return;
    }

    if (command.kind === "mask") {
      this.drawMask(pixels, drawnPixels, command, defaultAntialias);
      return;
    }

    if (command.antialias ?? defaultAntialias) {
      this.drawAntialiasedLine(pixels, drawnPixels, command);
      return;
    }

    this.drawPixelLine(pixels, drawnPixels, command);
  }

  private buildSpriteGridArtifact(): RenderArtifact {
    const width = this.document.sprite?.width ?? 0;
    const height = this.document.sprite?.height ?? 0;
    const background = this.document.sprite?.background ?? "transparent";
    const backgroundColor = background === "transparent" ? null : parseColor(background);
    const layer = createLayer(width, height, backgroundColor);

    this.document.commands.forEach((command) => {
      this.drawCommand(
        layer.pixels,
        layer.drawnPixels,
        command,
        this.document.sprite?.antialias ?? false
      );
    });

    const formattedPixels = layer.pixels.map((row) =>
      row.map((pixel) => formatColor(pixel))
    );
    const rows = formattedPixels.map((row, y) =>
      row
        .map((pixel, x) => {
          if (layer.drawnPixels[y]![x]) {
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
}
