import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createServer } from "../src/server.ts";

const greenGate = {
  gateInput: {
    testsPassed: true,
    lintPassed: true,
    checksOk: true,
    noConflicts: true,
  },
};

function sendRequest(
  server: http.Server,
  body: string,
  headers: Record<string, string> = {},
): Promise<{ statusCode: number; body: string }> {
  const { port } = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        port,
        method: "POST",
        path: "/",
        headers: { "content-type": "application/json", ...headers },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

describe("server — webhook HTTP entrypoint", () => {
  let server: http.Server;

  beforeEach(() => {
    server = createServer({ context: greenGate });
    server.listen(0); // ephemeral port
  });

  afterEach(() => {
    server.close();
  });

  it("returns 200 for passed path (trigger + permission + green gate)", async () => {
    const res = await sendRequest(
      server,
      JSON.stringify({
        action: "created",
        comment: { body: "/gate" },
        commenter: { permission: "admin" },
      }),
      { "x-github-event": "issue_comment" },
    );
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, "passed");
  });

  it("returns 200 for ignored path (non-trigger comment)", async () => {
    const res = await sendRequest(
      server,
      JSON.stringify({
        action: "created",
        comment: { body: "nice work" },
        commenter: { permission: "admin" },
      }),
      { "x-github-event": "issue_comment" },
    );
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, "ignored");
  });

  it("returns 200 and ignores non-issue_comment events", async () => {
    const res = await sendRequest(
      server,
      JSON.stringify({
        action: "opened",
        pull_request: { number: 1 },
      }),
      { "x-github-event": "pull_request" },
    );
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, "ignored");
    assert.ok(json.message.includes("non-issue_comment"));
  });
});
