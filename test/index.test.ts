import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gateCheck } from "../src/index.ts";

describe("gateCheck", () => {
  it("allows merge when all conditions pass", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      coverageOk: true,
      noConflicts: true,
    });
    assert.equal(result.allowed, true);
    assert.equal(result.reasons.length, 0);
  });

  it("blocks merge when tests fail", () => {
    const result = gateCheck({
      testsPassed: false,
      lintPassed: true,
      coverageOk: true,
      noConflicts: true,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("tests failed"));
  });

  it("blocks merge when lint fails", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: false,
      coverageOk: true,
      noConflicts: true,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("lint failed"));
  });

  it("blocks merge when coverage below threshold", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      coverageOk: false,
      noConflicts: true,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("coverage below threshold"));
  });

  it("blocks merge when merge conflicts exist", () => {
    const result = gateCheck({
      testsPassed: true,
      lintPassed: true,
      coverageOk: true,
      noConflicts: false,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("merge conflicts"));
  });

  it("blocks merge and aggregates all reasons in order when every condition fails", () => {
    const result = gateCheck({
      testsPassed: false,
      lintPassed: false,
      coverageOk: false,
      noConflicts: false,
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reasons.length, 4);
    assert.deepEqual(result.reasons, [
      "tests failed",
      "lint failed",
      "coverage below threshold",
      "merge conflicts",
    ]);
  });
});
