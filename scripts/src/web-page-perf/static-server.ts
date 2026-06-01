import { existsSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { PerfSuiteProgress } from "./types.js";

export type StaticPerfServer = {
  close: () => Promise<void>;
  getProgress: (token: string) => PerfSuiteProgress[];
  origin: string;
  progressFilePath: (token: string) => string;
  waitForReport: (token: string, timeoutMs: number) => Promise<string>;
};

type ReportWaiter = {
  resolve: (body: string) => void;
  timeout: NodeJS.Timeout;
};

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function isSafeRelativePath(relativePath: string): boolean {
  return !relativePath.split("/").some((segment) => segment === "..");
}

async function serveStaticFile(
  distDir: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const relativePath = requestUrl.pathname === "/"
    ? "index.html"
    : requestUrl.pathname.slice(1);
  const normalizedPath = relativePath.replace(/\\/g, "/");

  if (!isSafeRelativePath(normalizedPath)) {
    response.statusCode = 400;
    response.end("Invalid path.");
    return;
  }

  const targetPath = path.join(distDir, normalizedPath);
  const fallbackPath = path.join(distDir, "index.html");
  const filePath = existsSync(targetPath) ? targetPath : fallbackPath;
  const fileStat = await stat(filePath);

  response.statusCode = 200;
  response.setHeader("Content-Length", fileStat.size);
  response.setHeader("Content-Type", getContentType(filePath));
  response.end(await readFile(filePath));
}

function getProgressFilePath(token: string): string {
  return path.join(os.tmpdir(), `radebe-web-page-perf-progress-${token}.json`);
}

function readRequestBody(
  request: IncomingMessage,
  onBody: (body: string) => void
): void {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk: string) => {
    body += chunk;
  });
  request.on("end", () => {
    onBody(body);
  });
}

function handlePerfReportPost(
  request: IncomingMessage,
  response: ServerResponse,
  token: string,
  reportBodies: Map<string, string>,
  reportWaiters: Map<string, ReportWaiter>
): void {
  readRequestBody(request, (body) => {
    const waiter = reportWaiters.get(token);

    if (waiter) {
      clearTimeout(waiter.timeout);
      reportWaiters.delete(token);
      waiter.resolve(body);
    } else {
      reportBodies.set(token, body);
    }

    response.statusCode = 200;
    response.end("ok");
  });
}

function handlePerfProgressPost(
  request: IncomingMessage,
  response: ServerResponse,
  token: string,
  progressBodies: Map<string, PerfSuiteProgress[]>
): void {
  readRequestBody(request, (body) => {
    const payload = JSON.parse(body) as PerfSuiteProgress;
    const progress = progressBodies.get(token) ?? [];
    progress.push(payload);
    progressBodies.set(token, progress);
    void writeFile(
      getProgressFilePath(token),
      `${JSON.stringify(progress, null, 2)}\n`,
      "utf8"
    );
    response.statusCode = 200;
    response.end("ok");
  });
}

export async function startStaticServer(
  distDir: string,
  port: number
): Promise<StaticPerfServer> {
  const progressBodies = new Map<string, PerfSuiteProgress[]>();
  const reportBodies = new Map<string, string>();
  const reportWaiters = new Map<string, ReportWaiter>();
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

    if (request.method === "POST" && requestUrl.pathname === "/__perf-report") {
      const token = requestUrl.searchParams.get("token") ?? "";
      handlePerfReportPost(request, response, token, reportBodies, reportWaiters);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/__perf-progress") {
      const token = requestUrl.searchParams.get("token") ?? "";
      handlePerfProgressPost(request, response, token, progressBodies);
      return;
    }

    void serveStaticFile(distDir, request, response).catch((error) => {
      response.statusCode = 500;
      response.end(
        error instanceof Error ? error.message : "Unexpected server error."
      );
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve();
    });
  });

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    getProgress: (token: string) => {
      return progressBodies.get(token) ?? [];
    },
    origin: `http://127.0.0.1:${port}`,
    progressFilePath: (token: string) => {
      return getProgressFilePath(token);
    },
    waitForReport: async (token: string, timeoutMs: number) => {
      const existingBody = reportBodies.get(token);

      if (existingBody !== undefined) {
        reportBodies.delete(token);
        return existingBody;
      }

      return await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reportWaiters.delete(token);
          reject(new Error(`Timed out waiting for perf report token ${token}.`));
        }, timeoutMs);

        reportWaiters.set(token, {
          resolve,
          timeout
        });
      });
    }
  };
}
