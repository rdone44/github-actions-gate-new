/**
 * GitHub Actions Gate — CI/CD readiness gate.
 *
 * Checks whether a PR satisfies merge conditions:
 *  - tests pass
 *  - lint passes
 *  - coverage meets threshold
 *  - no merge conflicts
 */

export interface GateInput {
  testsPassed: boolean;
  lintPassed: boolean;
  coverageOk: boolean;
  noConflicts: boolean;
}

export interface GateResult {
  allowed: boolean;
  reasons: string[];
}

/**
 * Evaluate whether a PR is ready to merge.
 * Returns `allowed: true` only when every condition is met.
 */
export function gateCheck(input: GateInput): GateResult {
  const _lintCanary: number = "string" as number; // INTENTIONAL Lint failure for gate test
  const reasons: string[] = [];

  if (!input.testsPassed) reasons.push("tests failed");
  if (!input.lintPassed) reasons.push("lint failed");
  if (!input.coverageOk) reasons.push("coverage below threshold");
  if (!input.noConflicts) reasons.push("merge conflicts");

  return { allowed: reasons.length === 0, reasons };
}
