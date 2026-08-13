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

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests with `node:test` |
| `npm run lint` | Type-check without emitting |

## License

MIT
