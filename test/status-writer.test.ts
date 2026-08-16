import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  gateState,
  buildStatusRequest,
  writeStatus,
  type StatusTarget,
  type RequestFn,
} from "../src/status-writer.ts";

const target: StatusTarget = {
  token: "ghp_test123",
  owner: "rdone44",
  repo: "agent-video",
  sha: "abc123def456",
};

// --- gateState ---

describe("gateState", () => {
  it("maps passed → success", () => {
    const r = gateState("passed", "gate passed");
    assert.equal(r.state, "success");
    assert.match(r.description, /ready to merge/);
  });

  it("maps blocked → failure with reason", () => {
    const r = gateState("blocked", "gate blocked: tests failed");
    assert.equal(r.state, "failure");
    assert.match(r.description, /tests failed/);
  });

  it("truncates descriptions over 130 chars", () => {
    const long = "gate blocked: " + "x".repeat(200);
    const r = gateState("blocked", long);
    assert.ok(r.description.length <= 131);
    assert.ok(r.description.endsWith("…"));
  });
});

// --- buildStatusRequest ---

describe("buildStatusRequest", () => {
  it("builds correct path / headers / body", () => {
    const { opts, body } = buildStatusRequest(
      target,
      { state: "success", description: "ok" },
    );
    assert.equal(opts.method, "POST");
    assert.equal(opts.hostname, "api.github.com");
    assert.equal(
      opts.path,
      "/repos/rdone44/agent-video/statuses/abc123def456",
    );
    const headers = opts.headers as Record<string, string | number | string[]>;
    assert.match(headers.Authorization as string, /Bearer ghp_test123/);
    assert.equal(headers.Accept, "application/vnd.github+json");
    assert.equal(headers["User-Agent"], "github-actions-gate");

    const parsed = JSON.parse(body);
    assert.equal(parsed.state, "success");
    assert.equal(parsed.description, "ok");
    assert.equal(parsed.context, "github-actions-gate");
    assert.equal(parsed.target_url, undefined);
  });

  it("includes target_url when provided", () => {
    const { body } = buildStatusRequest(target, {
      state: "failure",
      description: "tests failed",
      targetUrl: "https://logs.example/gate/1",
    });
    const parsed = JSON.parse(body);
    assert.equal(parsed.target_url, "https://logs.example/gate/1");
    assert.equal(parsed.state, "failure");
  });
});

// --- writeStatus (network stub) ---

describe("writeStatus", () => {
  it("resolves when request returns 2xx", async () => {
    const stub: RequestFn = async () => 201;
    await writeStatus(
      target,
      { state: "success", description: "ok" },
      stub,
    );
    // no throw = pass
  });

  it("rejects when request returns non-2xx", async () => {
    const stub: RequestFn = async () => 422;
    await assert.rejects(
      () => writeStatus(
        target,
        { state: "failure", description: "bad" },
        stub,
      ),
      /returned 422/,
    );
  });

  it("passes opts and body to the injected request fn", async () => {
    let seenPath = "";
    let seenMethod = "";
    let seenBody = "";
    const stub: RequestFn = async (opts, body) => {
      seenPath = opts.path ?? "";
      seenMethod = opts.method ?? "";
      seenBody = body;
      return 201;
    };
    await writeStatus(
      target,
      { state: "success", description: "ok" },
      stub,
    );
    assert.equal(seenMethod, "POST");
    assert.match(seenPath, /statuses\/abc123def456/);
    assert.match(seenBody, /"state":"success"/);
  });
});
