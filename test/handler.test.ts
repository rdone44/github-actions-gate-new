import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleWebhook, type WebhookPayload } from "../src/handler.ts";

function basePayload(overrides: Partial<WebhookPayload> = {}): WebhookPayload {
  return {
    action: "created",
    comment: { body: "/gate" },
    commenter: { permission: "admin" },
    ...overrides,
  };
}

const greenGate = {
  gateInput: {
    testsPassed: true,
    lintPassed: true,
    checksOk: true,
    noConflicts: true,
  },
};

const redGate = {
  gateInput: {
    testsPassed: false,
    lintPassed: true,
    checksOk: true,
    noConflicts: true,
  },
};

describe("handleWebhook — three main paths", () => {
  it("Path 1: ignores non-trigger comments", () => {
    const result = handleWebhook(
      basePayload({ comment: { body: "looks good" } }),
      greenGate,
    );
    assert.equal(result.status, "ignored");
    assert.ok(result.message.includes("does not trigger"));
  });

  it("Path 1: ignores edited comments even if body is /gate", () => {
    const result = handleWebhook(
      basePayload({ action: "edited" }),
      greenGate,
    );
    assert.equal(result.status, "ignored");
  });

  it("Path 2: denies trigger from insufficient permission", () => {
    const result = handleWebhook(
      basePayload({ commenter: { permission: "write" } }),
      greenGate,
    );
    assert.equal(result.status, "denied");
    assert.ok(result.message.includes("write"));
  });

  it("Path 3: passes when trigger + permission + all gate conditions met", () => {
    const result = handleWebhook(basePayload(), greenGate);
    assert.equal(result.status, "passed");
    assert.equal(result.gateResult?.allowed, true);
  });

  it("Path 4: blocks when trigger + permission but gate conditions fail", () => {
    const result = handleWebhook(basePayload(), redGate);
    assert.equal(result.status, "blocked");
    assert.equal(result.gateResult?.allowed, false);
    assert.ok(result.gateResult?.reasons.includes("tests failed"));
  });
});
