import type { PipelineResult } from "@radebe/core/types";

export type PreviewRenderRequestMessage = {
  kind: "render";
  jobId: number;
  source: string;
};

export type PreviewRenderSuccessMessage = {
  durationMs: number;
  jobId: number;
  kind: "rendered";
  result: PipelineResult;
};

export type PreviewRenderErrorMessage = {
  jobId: number;
  kind: "error";
  message: string;
};

export type PreviewRenderResponseMessage =
  | PreviewRenderSuccessMessage
  | PreviewRenderErrorMessage;
