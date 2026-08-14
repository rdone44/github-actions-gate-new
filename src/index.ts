/**
 * GitHub Actions Gate — CI/CD readiness gate.
 *
 * Checks whether a PR satisfies merge conditions:
 *  - tests pass
 *  - lint passes
 *  - no check-runs failed (excludes this Gate job)
 *  - no merge conflicts
 */

export interface GateInput {
  testsPassed: boolean;
  lintPassed: boolean;
  checksOk: boolean;
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
  const reasons: string[] = [];

  if (!input.testsPassed) reasons.push("tests failed");
  if (!input.lintPassed) reasons.push("lint failed");
  if (!input.checksOk) reasons.push("checks failed");
  if (!input.noConflicts) reasons.push("merge conflicts");

  return { allowed: reasons.length === 0, reasons };
}
