/**
 * HTTP server entrypoint — receives GitHub webhooks and routes
 * issue_comment events through handleWebhook.
 *
 * Status code mapping:
 *   ignored  → 200
 *   passed   → 200
 *   denied   → 403
 *   blocked  → 422
 *
 * Non-issue_comment events are acknowledged with 200 and ignored.
 */

import http from "node:http";
import { handleWebhook, type GateContext, type WebhookPayload } from "./handler.ts";

export interface ServerOptions {
  context: GateContext;
  port?: number;
  hostname?: string;
}

const STATUS_MAP: Record<string, number> = {
  ignored: 200,
  passed: 200,
  denied: 403,
  blocked: 422,
};

export function createServer(options: ServerOptions): http.Server {
  const { context } = options;
  return http.createServer((req, res) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));

    req.on("end", () => {
      const event = req.headers["x-github-event"];

      // Only issue_comment events are handled; everything else → 200 + ignore
      if (event !== "issue_comment") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ignored", message: "non-issue_comment event" }));
        return;
      }

      let payload: WebhookPayload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "invalid JSON body" }));
        return;
      }

      const result = handleWebhook(payload, context);
      const code = STATUS_MAP[result.status] ?? 200;

      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
    });

    req.on("error", () => {
      if (!res.writableEnded) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "request error" }));
      }
    });
  });
}

export function startServer(options: ServerOptions): http.Server {
  const { port = 3000, hostname = "0.0.0.0" } = options;
  const server = createServer(options);
  server.listen(port, hostname);
  return server;
}
