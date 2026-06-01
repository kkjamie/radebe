import type { PipelineResult, RadebeDiagnostic } from "@radebe/core/types";

export type CachedPreview = {
  src: string;
  width: number;
  height: number;
};

export type PreviewState =
  | "cached"
  | "dirty"
  | "error"
  | "queued"
  | "refreshing"
  | "rendered";

export type PlaygroundPreviewPresenterElements = {
  cachedPreviewImage: HTMLImageElement | null;
  diagnosticsOutput: HTMLPreElement;
  previewMeta: HTMLParagraphElement;
  previewState: HTMLSpanElement;
  spriteCanvas: HTMLCanvasElement;
  spriteSurface: HTMLDivElement;
  spriteViewport: HTMLDivElement;
  status: HTMLParagraphElement;
  zoomSelect: HTMLSelectElement;
};

export function formatPipelineDiagnostics(diagnostics: RadebeDiagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const location =
        diagnostic.line === undefined
          ? diagnostic.stage
          : `${diagnostic.stage}:${diagnostic.line}:${diagnostic.column ?? 1}`;

      return `${location} ${diagnostic.message}`;
    })
    .join("\n");
}

export class PlaygroundPreviewPresenter {
  private currentArtifactSize = { width: 1, height: 1 };

  public constructor(
    private readonly elements: PlaygroundPreviewPresenterElements,
    private readonly cachedPreview: CachedPreview | undefined
  ) {}

  public get artifactSize(): { width: number; height: number } {
    return this.currentArtifactSize;
  }

  public setState(state: PreviewState, label: string): void {
    this.elements.previewState.dataset.state = state;
    this.elements.previewState.textContent = label;
  }

  public applyCurrentScale(): void {
    this.applyCanvasScale(
      this.currentArtifactSize.width,
      this.currentArtifactSize.height
    );
  }

  public applyCanvasScale(width: number, height: number): void {
    this.currentArtifactSize = {
      width: Math.max(width, 1),
      height: Math.max(height, 1)
    };

    let scale = Number.parseInt(this.elements.zoomSelect.value, 10);

    if (this.elements.zoomSelect.value === "fit") {
      const viewportSize = this.getViewportContentSize();

      scale = Math.max(
        Math.min(
          Math.floor(
            Math.min(
              viewportSize.width / this.currentArtifactSize.width,
              viewportSize.height / this.currentArtifactSize.height
            )
          ),
          32
        ),
        1
      );
    }

    const scaledWidth = `${this.currentArtifactSize.width * scale}px`;
    const scaledHeight = `${this.currentArtifactSize.height * scale}px`;

    this.elements.spriteCanvas.style.width = scaledWidth;
    this.elements.spriteCanvas.style.height = scaledHeight;
    if (this.elements.cachedPreviewImage) {
      this.elements.cachedPreviewImage.style.width = scaledWidth;
      this.elements.cachedPreviewImage.style.height = scaledHeight;
    }
    this.elements.spriteSurface.style.width = this.elements.spriteCanvas.style.width;
    this.elements.spriteSurface.style.height = this.elements.spriteCanvas.style.height;
  }

  public showCachedPreview(): void {
    if (!this.cachedPreview) {
      return;
    }

    this.elements.spriteCanvas.hidden = true;
    if (this.elements.cachedPreviewImage) {
      this.elements.cachedPreviewImage.hidden = false;
    }
    this.applyCanvasScale(this.cachedPreview.width, this.cachedPreview.height);
    this.elements.status.textContent = "Cached preview.";
    this.setState("cached", "Cached");
    this.elements.previewMeta.textContent =
      `Rendered image: ${this.cachedPreview.width}x${this.cachedPreview.height}`;
    this.elements.diagnosticsOutput.textContent = "(cached preview)";
  }

  public showRenderError(message: string): void {
    this.setState("error", "Error");
    this.elements.status.textContent = "Preview render failed.";
    this.elements.previewMeta.textContent = "Rendered image: unavailable";
    this.elements.diagnosticsOutput.textContent = message;
  }

  public applyResult(result: PipelineResult): void {
    const diagnosticsText = formatPipelineDiagnostics(result.diagnostics);

    this.showLiveCanvas();
    this.setState("rendered", "Rendered");
    this.elements.status.textContent = `Parsed ${result.parsed.commands.length} root command(s), compiled ${result.compiled.commands.length} draw command(s).`;
    this.elements.previewMeta.textContent = `Rendered image: ${result.artifact.width}x${result.artifact.height} background=${result.artifact.background}`;
    this.elements.diagnosticsOutput.textContent =
      diagnosticsText === "" ? "(no diagnostics)" : diagnosticsText;

    if (result.artifact.width === 0 || result.artifact.height === 0) {
      this.applyCanvasScale(1, 1);
      this.drawCheckerboardFallback(1, 1);
      return;
    }

    this.drawSprite(
      result.artifact.pixels,
      result.artifact.width,
      result.artifact.height,
      result.artifact.background
    );
  }

  private getViewportContentSize(): { width: number; height: number } {
    const viewportRect = this.elements.spriteViewport.getBoundingClientRect();
    const viewportStyle = window.getComputedStyle(this.elements.spriteViewport);
    const horizontalPadding =
      (Number.parseFloat(viewportStyle.paddingLeft) || 0) +
      (Number.parseFloat(viewportStyle.paddingRight) || 0);
    const verticalPadding =
      (Number.parseFloat(viewportStyle.paddingTop) || 0) +
      (Number.parseFloat(viewportStyle.paddingBottom) || 0);

    return {
      width: Math.max(viewportRect.width - horizontalPadding, 1),
      height: Math.max(viewportRect.height - verticalPadding, 1)
    };
  }

  private showLiveCanvas(): void {
    this.elements.spriteCanvas.hidden = false;
    if (this.elements.cachedPreviewImage) {
      this.elements.cachedPreviewImage.hidden = true;
    }
  }

  private drawCheckerboardFallback(width: number, height: number): void {
    const context = this.elements.spriteCanvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#151311";
    context.fillRect(0, 0, width, height);
  }

  private drawSprite(
    pixels: (string | null)[][],
    width: number,
    height: number,
    background: string
  ): void {
    this.elements.spriteCanvas.width = Math.max(width, 1);
    this.elements.spriteCanvas.height = Math.max(height, 1);
    this.applyCanvasScale(width, height);

    const context = this.elements.spriteCanvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      this.elements.spriteCanvas.width,
      this.elements.spriteCanvas.height
    );

    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }

    pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel === null) {
          return;
        }

        context.fillStyle = pixel;
        context.fillRect(x, y, 1, 1);
      });
    });
  }
}
