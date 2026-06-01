import type { CompiledDrawCommand } from "../../../types.js";
import {
  drawCoverageAppearancePasses,
  normalizeCoverageAppearancePasses,
  type CoverageAppearancePasses
} from "../../appearance.js";
import {
  createRectCoverageSource,
  type CoverageSource
} from "../../coverage.js";
import { type DrawnGrid, type PixelGrid } from "../../shared.js";

export function drawRectCommand(
  pixels: PixelGrid,
  drawnPixels: DrawnGrid,
  command: Extract<CompiledDrawCommand, { kind: "rect" }>,
  defaultAntialias: boolean
): void {
  const antialias = command.antialias ?? defaultAntialias;
  const coverage: CoverageSource = createRectCoverageSource(
    command,
    antialias
  );
  const passes: CoverageAppearancePasses =
    normalizeCoverageAppearancePasses(command);

  drawCoverageAppearancePasses(pixels, drawnPixels, coverage, passes);
}
