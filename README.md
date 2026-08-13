# GitHub Actions Gate

CI/CD readiness gate for GitHub Actions. Detects whether a PR satisfies merge conditions — tests pass, lint passes, coverage meets threshold, no merge conflicts — and blocks the merge otherwise.

## Usage

```ts
import { gateCheck } from "github-actions-gate";

const result = gateCheck({
  testsPassed: true,
  lintPassed: true,
  coverageOk: true,
  noConflicts: true,
});

if (!result.allowed) {
  console.error("Merge blocked:", result.reasons.join(", "));
  process.exit(1);
}
```

## Acceptance Criteria

The gate returns `allowed: true` only when **all four** conditions are met:

| Condition | Input field | Fail reason | Rule |
|-----------|------------|-------------|------|
| Tests pass | `testsPassed` | `tests failed` | CI test suite exits 0 |
| Lint passes | `lintPassed` | `lint failed` | Linter exits 0, no errors |
| Coverage meets threshold | `coverageOk` | `coverage below threshold` | Coverage ≥ configured minimum |
| No merge conflicts | `noConflicts` | `merge conflicts` | `git merge-tree` reports no conflicts |

If any condition fails, `allowed` is `false` and `reasons` contains the corresponding message(s).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests with `node:test` |
| `npm run lint` | Type-check without emitting |

## License

MIT

<!-- trigger-gate: verify CI pipeline -->
