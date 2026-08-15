import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gateCheck } from "../src/index.ts";

describe("gateCheck", () => {
  it("allows merge when all conditions pass", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      checksOk: true,
      noConflicts: true,
    });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.reasons.length, 0);
  });

  it("blocks merge when tests fail", () => {
    const result = gateCheck({
      testsPassed: false,
      lintPassed: true,
      checksOk: true,
      noConflicts: true,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reasons.includes("tests failed"));
  });

  it("blocks merge when lint fails", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: false,
      checksOk: true,
      noConflicts: true,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reasons.includes("lint failed"));
  });

  it("blocks merge when checks fail", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      checksOk: false,
      noConflicts: true,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reasons.includes("checks failed"));
  });

  it("blocks merge when merge conflicts exist", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      checksOk: true,
      noConflicts: false,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reasons.includes("merge conflicts"));
  });

  it("blocks merge and aggregates all reasons in order when every condition fails", () => {
    const result = gateCheck({
      testsPassed: false,
      lintPassed: false,
      checksOk: false,
      noConflicts: false,
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reasons.length, 4);
    assert.deepStrictEqual(result.reasons, [
      "tests failed",
      "lint failed",
      "checks failed",
      "merge conflicts",
    ]);
  });
});
