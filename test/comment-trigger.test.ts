import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGateTrigger,
  hasTriggerPermission,
} from "../src/comment-trigger.ts";

describe("isGateTrigger", () => {
  it("matches exact /gate comment", () => {
    assert.equal(isGateTrigger("/gate"), true);
  });

  it("matches /gate with trailing whitespace", () => {
    assert.equal(isGateTrigger("/gate\n"), true);
    assert.equal(isGateTrigger("/gate  "), true);
  });

  it("does not match /gate embedded in other text", () => {
    assert.equal(isGateTrigger("please /gate now"), false);
    assert.equal(isGateTrigger("/gate review"), false);
  });

  it("does not match case-insensitive variants", () => {
    assert.equal(isGateTrigger("/Gate"), false);
    assert.equal(isGateTrigger("/GATE"), false);
  });

  it("does not match edited comments", () => {
    assert.equal(
      isGateTrigger("/gate", { action: "edited" }),
      false,
    );
  });

  it("ignores similar but non-matching triggers", () => {
    assert.equal(isGateTrigger("/gate-check"), false);
    assert.equal(isGateTrigger("/gated"), false);
  });
});

describe("hasTriggerPermission", () => {
  it("allows admin role", () => {
    assert.equal(
      hasTriggerPermission({ permission: "admin" }),
      true,
    );
  });

  it("allows maintain role (owner-equivalent)", () => {
    assert.equal(
      hasTriggerPermission({ permission: "maintain" }),
      true,
    );
  });

  it("denies write role", () => {
    assert.equal(
      hasTriggerPermission({ permission: "write" }),
      false,
    );
  });

  it("denies read role", () => {
    assert.equal(
      hasTriggerPermission({ permission: "read" }),
      false,
    );
  });

  it("denies none role", () => {
    assert.equal(
      hasTriggerPermission({ permission: "none" }),
      false,
    );
  });
});
