import type {
  GlowAppearance,
  RectFill,
  ShadowAppearance,
  StrokeAppearance
} from "../../types.js";
import type { CoverageSource } from "../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../shared.js";
import { drawCoverageFill } from "./fill.js";
import { drawCoverageGlow } from "./glow.js";
import { drawCoverageShadow } from "./shadow.js";
import { drawCoverageStroke } from "./stroke.js";

export type CoverageAppearancePasses = {
  fills: readonly RectFill[];
  shadows: readonly ShadowAppearance[];
  glows: readonly GlowAppearance[];
  strokes: readonly StrokeAppearance[];
};

export type CoverageAppearancePassInput = {
  fills: readonly RectFill[];
  shadows?: readonly ShadowAppearance[];
  glows?: readonly GlowAppearance[];
  strokes: readonly StrokeAppearance[];
};

const EMPTY_SHADOWS: readonly ShadowAppearance[] = [];
const EMPTY_GLOWS: readonly GlowAppearance[] = [];

export function normalizeCoverageAppearancePasses(
  passes: CoverageAppearancePassInput
): CoverageAppearancePasses {
  return {
    fills: passes.fills,
    shadows: passes.shadows ?? EMPTY_SHADOWS,
    glows: passes.glows ?? EMPTY_GLOWS,
    strokes: passes.strokes
  };
}

export function drawCoverageAppearancePasses(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  source: CoverageSource,
  passes: CoverageAppearancePasses
): void {
  passes.shadows.forEach((shadow) => {
    drawCoverageShadow(pixels, drawnPixels, source, shadow);
  });
  passes.glows
    .filter((glow) => glow.mode === "outer")
    .forEach((glow) => {
      drawCoverageGlow(pixels, drawnPixels, source, glow);
    });
  passes.fills.forEach((fill) => {
    drawCoverageFill(pixels, drawnPixels, source, fill);
  });
  passes.glows
    .filter((glow) => glow.mode === "inner")
    .forEach((glow) => {
      drawCoverageGlow(pixels, drawnPixels, source, glow);
    });
  passes.strokes.forEach((stroke) => {
    drawCoverageStroke(pixels, drawnPixels, source, stroke);
  });
}
