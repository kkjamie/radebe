import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses
} from "../../appearance.js";
import { createCircleCoverageSource } from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawCircleCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "circle" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage = createCircleCoverageSource(command, antialias);
  const passes = normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
