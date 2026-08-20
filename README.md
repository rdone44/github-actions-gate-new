# GitHub Actions Gate

CI/CD readiness gate for GitHub Actions. Listens for `/gate` comments on PRs via GitHub issue_comment webhooks, evaluates four merge conditions, and posts a commit status back to GitHub.

## How It Works

```
GitHub PR comment "/gate"
  → webhook (POST /) → trigger match (exact "/gate", case-sensitive)
  → permission check (admin/maintain only)
  → gate evaluation (4 conditions)
  → commit status posted to GitHub (success/failure)
```

Status codes: `200` ignored/passed, `403` denied, `422` blocked, `400` bad JSON.

## Quick Start

### Docker Compose (已验证)

```bash
cp .env.example .env   # 按需修改环境变量
docker compose up -d  # 构建并后台启动
curl localhost:3000/webhook   # 健康检查，返回 200 即正常
docker compose logs -f        # 查看日志
docker compose down           # 停止
```

### Docker (手动构建)

```bash
docker build -t github-actions-gate .

docker run -d \
  -p 3000:3000 \
  -e GATE_TESTS_PASSED=true \
  -e GATE_LINT_PASSED=true \
  -e GATE_CHECKS_OK=true \
  -e GATE_NO_CONFLICTS=true \
  github-actions-gate
```

### Local (no Docker)

```bash
npm install
npm run build   # tsc
node --import tsx src/main.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `GATE_TESTS_PASSED` | `true` | CI test suite passed |
| `GATE_LINT_PASSED` | `true` | Linter passed |
| `GATE_CHECKS_OK` | `true` | No check-runs failed |
| `GATE_NO_CONFLICTS` | `true` | No merge conflicts |

Values: `"1"` or `"true"` (case-insensitive) → true, anything else → false.

## GitHub Webhook Configuration

1. Go to repo **Settings → Webhooks → Add webhook**.
2. **Payload URL**: `http://<your-host>:3000/`
3. **Content type**: `application/json`
4. **Events**: select **Issue comments** only.
5. **Secret**: set a value (see below).

### Webhook Secret

> **Note**: The server does not yet validate the `X-Hub-Signature-256` header. A `WEBHOOK_SECRET` env var and HMAC verification is a planned TODO. Until then, run behind a reverse proxy that enforces webhook signature validation, or restrict exposure via network/firewall rules.

## Usage (Library)

```ts
import { gateCheck } from "github-actions-gate";

const result = gateCheck({
  testsPassed: true,
  lintPassed: true,
  checksOk: true,
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
| Checks pass | `checksOk` | `checks failed` | No check-runs failed (excluding Gate) |
| No merge conflicts | `noConflicts` | `merge conflicts` | `git merge-tree` reports no conflicts |

If any condition fails, `allowed` is `false` and `reasons` contains the corresponding message(s).

## Trigger Rules

| Rule | Behavior |
|------|----------|
| Exact `/gate` | Matches |
| `/gate` + trailing whitespace | Matches |
| `/gate` inside other text | No match |
| Case variants (`/Gate`, `/GATE`) | No match |
| Edited comments | No match (action must be `created`) |
| Permission: `admin` or `maintain` | Allowed |
| Permission: `write`, `read`, `none` | Denied (403) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests with `node:test` |
| `npm run lint` | Type-check without emitting |

## License

MIT
