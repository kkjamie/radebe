import { renderSource } from "@radebe/core/renderer";

import type { PipelineResult } from "@radebe/core/types";
import type {
  PreviewRenderRequestMessage,
  PreviewRenderResponseMessage
} from "./playground-preview-worker-types.js";

function getNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

globalThis.onmessage = (
  event: MessageEvent<PreviewRenderRequestMessage>
): void => {
  const message = event.data;

  if (message.kind !== "render") {
    return;
  }

  try {
    const startedAt = getNowMs();
    const result: PipelineResult = renderSource({ source: message.source });
    const response: PreviewRenderResponseMessage = {
      durationMs: getNowMs() - startedAt,
      jobId: message.jobId,
      kind: "rendered",
      result
    };

    globalThis.postMessage(response);
  } catch (error) {
    const response: PreviewRenderResponseMessage = {
      jobId: message.jobId,
      kind: "error",
      message: error instanceof Error ? error.message : String(error)
    };

    globalThis.postMessage(response);
  }
};

export {};
