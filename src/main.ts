/**
 * Container entrypoint — boot the webhook HTTP server.
 *
 * Gate context is injected via env vars so the same image can be
 * reused across environments without rebuilding.
 */
import { startServer } from "./server.ts";
import type { GateContext, GateInput } from "./handler.ts";

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

const gateInput: GateInput = {
  testsPassed: parseBool(process.env.GATE_TESTS_PASSED, true),
  lintPassed: parseBool(process.env.GATE_LINT_PASSED, true),
  checksOk: parseBool(process.env.GATE_CHECKS_OK, true),
  noConflicts: parseBool(process.env.GATE_NO_CONFLICTS, true),
};

const context: GateContext = { gateInput };

const port = parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

startServer({ context, port, hostname });

console.log(`github-actions-gate listening on ${hostname}:${port}`);
