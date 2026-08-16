/**
 * Status Writer — posts gate results back to GitHub as commit statuses.
 *
 * POST /repos/{owner}/{repo}/statuses/{sha}
 *   state: "success" when gate passes, "failure" when blocked.
 *   context: "github-actions-gate"
 *   description: truncated gate reason or pass message.
 *
 * Uses only the Node.js standard library (node:https) — no third-party deps.
 */

import https from "node:https";
import type { IncomingMessage } from "node:http";

export interface StatusTarget {
  token: string;        // GitHub PAT or Actions token (Bearer)
  owner: string;        // repo owner
  repo: string;         // repo name
  sha: string;          // commit SHA to stamp
}

export interface StatusResult {
  state: "success" | "failure";
  description: string;
  targetUrl?: string;   // optional link (logs, PR page)
}

const GATE_CONTEXT = "github-actions-gate";

/**
 * Map HandlerResponse status → GitHub commit-status state.
 * Only resolved gate outcomes (passed / blocked) are postable;
 * "ignored" / "denied" are not stamped.
 */
export function gateState(
  status: "passed" | "blocked",
  message: string,
): StatusResult {
  if (status === "passed") {
    return { state: "success", description: "gate passed — ready to merge" };
  }
  return { state: "failure", description: truncate(message, 130) };
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** Injectable request dispatcher for testing. Defaults to node:https.request. */
export type RequestFn = (
  opts: https.RequestOptions,
  body: string,
) => Promise<number>; // resolves with HTTP status code

const defaultRequest: RequestFn = (opts, body) =>
  new Promise((resolve, reject) => {
    const req = https.request(opts, (res: IncomingMessage) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });

/**
 * Build the https.RequestOptions for a GitHub statuses POST.
 * Exported so tests can assert shape without hitting the network.
 */
export function buildStatusRequest(
  target: StatusTarget,
  result: StatusResult,
): { opts: https.RequestOptions; body: string } {
  const path = `/repos/${target.owner}/${target.repo}/statuses/${target.sha}`;
  const body = JSON.stringify({
    state: result.state,
    description: result.description,
    ...(result.targetUrl ? { target_url: result.targetUrl } : {}),
    context: GATE_CONTEXT,
  });
  const opts: https.RequestOptions = {
    method: "POST",
    hostname: "api.github.com",
    path,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${target.token}`,
      "Accept": "application/vnd.github+json",
      "Content-Length": Buffer.byteLength(body),
      "User-Agent": "github-actions-gate",
    },
  };
  return { opts, body };
}

/**
 * POST commit status to GitHub. Resolves on 2xx, rejects on error.
 */
export async function writeStatus(
  target: StatusTarget,
  result: StatusResult,
  request: RequestFn = defaultRequest,
): Promise<void> {
  const { opts, body } = buildStatusRequest(target, result);
  const code = await request(opts, body);
  if (code < 200 || code >= 300) {
    throw new Error(
      `GitHub status API returned ${code} for ${opts.path}`,
    );
  }
}
