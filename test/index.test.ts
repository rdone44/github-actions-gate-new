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
});
