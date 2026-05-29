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

export async function startStaticServer(
  distDir: string,
  port: number
): Promise<StaticPerfServer> {
  const progressBodies = new Map<string, PerfSuiteProgress[]>();
  const reportBodies = new Map<string, string>();
  const reportWaiters = new Map<
    string,
    {
      resolve: (body: string) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

    if (request.method === "POST" && requestUrl.pathname === "/__perf-report") {
      const token = requestUrl.searchParams.get("token") ?? "";
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        body += chunk;
      });
      request.on("end", () => {
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
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/__perf-progress") {
      const token = requestUrl.searchParams.get("token") ?? "";
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        body += chunk;
      });
      request.on("end", () => {
        const payload = JSON.parse(body) as PerfSuiteProgress;
        const progress = progressBodies.get(token) ?? [];
        progress.push(payload);
        progressBodies.set(token, progress);
        void writeFile(
          path.join(os.tmpdir(), `radebe-web-page-perf-progress-${token}.json`),
          `${JSON.stringify(progress, null, 2)}\n`,
          "utf8"
        );
        response.statusCode = 200;
        response.end("ok");
      });
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
      return path.join(os.tmpdir(), `radebe-web-page-perf-progress-${token}.json`);
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
