import type { PipelineResult } from "@radebe/core/types";

import { markPerfDuration } from "./perf.js";
import type {
  PreviewRenderRequestMessage,
  PreviewRenderResponseMessage
} from "./playground-preview-worker-types.js";

export type PreviewRenderResult = {
  durationMs: number;
  queueWaitMs: number;
  result: PipelineResult;
  source: string;
};

export type PreviewRenderError = {
  message: string;
  queueWaitMs: number;
  source: string;
};

export type PreviewRenderCallbacks = {
  onCancel?: () => void;
  onComplete: (result: PreviewRenderResult) => void;
  onError: (error: PreviewRenderError) => void;
  onStart?: (queueWaitMs: number) => void;
};

export type PreviewRenderTicket = {
  cancel: () => void;
  jobId: number;
};

type PreviewRenderJob = {
  callbacks: PreviewRenderCallbacks;
  canceled: boolean;
  jobId: number;
  ownerId: string;
  queuedAt: number;
  source: string;
  startedAt: number | null;
};

const pendingJobs = new Map<string, PreviewRenderJob>();
let activeJob: PreviewRenderJob | null = null;
let nextJobId = 1;
let previewWorker: Worker | null = null;
let workerUnavailable = false;
let fallbackRendererImport: Promise<typeof import("@radebe/core/renderer")> | null =
  null;

function getNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function completeActiveJob(): PreviewRenderJob | null {
  const job = activeJob;

  activeJob = null;
  return job;
}

function getPreviewWorker(): Worker | null {
  if (workerUnavailable) {
    return null;
  }

  if (previewWorker) {
    return previewWorker;
  }

  try {
    previewWorker = new Worker(
      new URL("./playground-preview-worker.ts", import.meta.url),
      { type: "module" }
    );
  } catch {
    workerUnavailable = true;
    return null;
  }

  previewWorker.addEventListener("message", handleWorkerMessage);
  previewWorker.addEventListener("error", handleWorkerFailure);

  return previewWorker;
}

function handleWorkerMessage(
  event: MessageEvent<PreviewRenderResponseMessage>
): void {
  const message = event.data;

  if (!activeJob || message.jobId !== activeJob.jobId) {
    return;
  }

  const job = completeActiveJob();

  if (!job) {
    pumpPreviewRenderQueue();
    return;
  }

  const queueWaitMs = Math.max((job.startedAt ?? getNowMs()) - job.queuedAt, 0);

  if (!job.canceled) {
    if (message.kind === "rendered") {
      markPerfDuration("playground-render-source", message.durationMs, job.ownerId);
      job.callbacks.onComplete({
        durationMs: message.durationMs,
        queueWaitMs,
        result: message.result,
        source: job.source
      });
    } else {
      job.callbacks.onError({
        message: message.message,
        queueWaitMs,
        source: job.source
      });
    }
  }

  pumpPreviewRenderQueue();
}

function handleWorkerFailure(): void {
  const failedJob = completeActiveJob();

  previewWorker?.terminate();
  previewWorker = null;
  workerUnavailable = true;

  if (failedJob) {
    void runFallbackJob(failedJob);
    return;
  }

  pumpPreviewRenderQueue();
}

async function runFallbackJob(job: PreviewRenderJob): Promise<void> {
  activeJob = job;

  try {
    fallbackRendererImport ??= import("@radebe/core/renderer");
    const renderer = await fallbackRendererImport;
    const startedAt = getNowMs();
    const result = renderer.renderSource({ source: job.source });
    const durationMs = getNowMs() - startedAt;

    completeActiveJob();

    if (!job.canceled) {
      markPerfDuration("playground-render-source", durationMs, job.ownerId);
      job.callbacks.onComplete({
        durationMs,
        queueWaitMs: Math.max(startedAt - job.queuedAt, 0),
        result,
        source: job.source
      });
    }
  } catch (error) {
    completeActiveJob();

    if (!job.canceled) {
      job.callbacks.onError({
        message: error instanceof Error ? error.message : String(error),
        queueWaitMs: Math.max(getNowMs() - job.queuedAt, 0),
        source: job.source
      });
    }
  } finally {
    pumpPreviewRenderQueue();
  }
}

function startJob(job: PreviewRenderJob): void {
  activeJob = job;
  const startedAt = getNowMs();
  const queueWaitMs = Math.max(startedAt - job.queuedAt, 0);

  job.startedAt = startedAt;
  markPerfDuration("playground-render-queue-wait", queueWaitMs, job.ownerId);
  if (!job.canceled) {
    job.callbacks.onStart?.(queueWaitMs);
  }

  const worker = getPreviewWorker();

  if (!worker) {
    void runFallbackJob(job);
    return;
  }

  const message: PreviewRenderRequestMessage = {
    jobId: job.jobId,
    kind: "render",
    source: job.source
  };

  worker.postMessage(message);
}

function pumpPreviewRenderQueue(): void {
  if (activeJob || pendingJobs.size === 0) {
    return;
  }

  const nextJob = pendingJobs.values().next().value as PreviewRenderJob | undefined;

  if (!nextJob) {
    return;
  }

  pendingJobs.delete(nextJob.ownerId);
  startJob(nextJob);
}

export function enqueuePreviewRender(
  ownerId: string,
  source: string,
  callbacks: PreviewRenderCallbacks
): PreviewRenderTicket {
  const previousJob = pendingJobs.get(ownerId);

  if (previousJob) {
    previousJob.canceled = true;
    previousJob.callbacks.onCancel?.();
    pendingJobs.delete(ownerId);
  }

  const job: PreviewRenderJob = {
    callbacks,
    canceled: false,
    jobId: nextJobId,
    ownerId,
    queuedAt: getNowMs(),
    source,
    startedAt: null
  };

  nextJobId += 1;
  pendingJobs.set(ownerId, job);
  pumpPreviewRenderQueue();

  return {
    cancel: () => {
      if (pendingJobs.get(ownerId)?.jobId === job.jobId) {
        pendingJobs.delete(ownerId);
        job.canceled = true;
        callbacks.onCancel?.();
        return;
      }

      if (activeJob?.jobId === job.jobId) {
        job.canceled = true;
      }
    },
    jobId: job.jobId
  };
}
