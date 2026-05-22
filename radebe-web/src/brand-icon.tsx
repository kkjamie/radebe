import { renderSource } from "@radebe/core";
import { useEffect, useMemo, useRef } from "preact/hooks";

import { radebeIconSource } from "./content/brand-icon.js";

export function BrandIcon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const result = useMemo(
    () => renderSource({ source: radebeIconSource }),
    []
  );
  const width = Math.max(result.artifact.width, 1);
  const height = Math.max(result.artifact.height, 1);

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
    <canvas
      aria-hidden="true"
      className="brand-icon-canvas"
      height={height}
      ref={canvasRef}
      width={width}
    />
  );
}
