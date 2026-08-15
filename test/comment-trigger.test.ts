import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGateTrigger,
  hasTriggerPermission,
} from "../src/comment-trigger.ts";

describe("isGateTrigger", () => {
  it("matches exact /gate comment", () => {
    assert.strictEqual(isGateTrigger("/gate"), true);
  });

  it("matches /gate with trailing whitespace", () => {
    assert.strictEqual(isGateTrigger("/gate\n"), true);
    assert.strictEqual(isGateTrigger("/gate  "), true);
  });

  it("does not match /gate embedded in other text", () => {
    assert.strictEqual(isGateTrigger("please /gate now"), false);
    assert.strictEqual(isGateTrigger("/gate review"), false);
  });

  it("does not match case-insensitive variants", () => {
    assert.strictEqual(isGateTrigger("/Gate"), false);
    assert.strictEqual(isGateTrigger("/GATE"), false);
  });

  it("does not match edited comments", () => {
    assert.strictEqual(isGateTrigger("/gate", { action: "edited" }), false);
  });

  it("ignores similar but non-matching triggers", () => {
    assert.strictEqual(isGateTrigger("/gate-check"), false);
    assert.strictEqual(isGateTrigger("/gated"), false);
  });
});

describe("hasTriggerPermission", () => {
  it("allows admin role", () => {
    assert.strictEqual(hasTriggerPermission({ permission: "admin" }), true);
  });

  it("allows maintain role (owner-equivalent)", () => {
    assert.strictEqual(hasTriggerPermission({ permission: "maintain" }), true);
  });

  it("denies write role", () => {
    assert.strictEqual(hasTriggerPermission({ permission: "write" }), false);
  });

  it("denies read role", () => {
    assert.strictEqual(hasTriggerPermission({ permission: "read" }), false);
  });

  it("denies none role", () => {
    assert.strictEqual(hasTriggerPermission({ permission: "none" }), false);
  });
});
