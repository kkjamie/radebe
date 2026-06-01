import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses
} from "../../appearance.js";
import { createRectCoverageSource } from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawRectCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "rect" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage = createRectCoverageSource(command, antialias);
  const passes = normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
