/**
 * Webhook handler — orchestrates a single issue_comment event end-to-end.
 *
 * Chain: trigger match → permission check → gate evaluation → response.
 */

import {
  isGateTrigger,
  hasTriggerPermission,
} from "./comment-trigger.ts";
import { gateCheck, type GateInput, type GateResult } from "./index.ts";

export interface WebhookPayload {
  action: string;
  comment: {
    body: string;
  };
  commenter: {
    permission: string; // "admin" | "maintain" | "write" | "read" | "none"
  };
}

export interface GateContext {
  /** Merge-readiness inputs used by gateCheck. */
  gateInput: GateInput;
}

export type HandlerResponse = {
  status: "ignored" | "denied" | "passed" | "blocked";
  message: string;
  gateResult?: GateResult;
};

/**
 * Process a raw issue_comment webhook payload.
 *
 * Path 1 — ignored: non-trigger comment or non-`created` action.
 * Path 2 — denied: trigger matched but commenter lacks permission.
 * Path 3 — passed: trigger + permission + all gate conditions met.
 * Path 4 — blocked: trigger + permission but one or more gate conditions fail.
 */
export function handleWebhook(
  payload: WebhookPayload,
  context: GateContext,
): HandlerResponse {
  // Path 1 — not a /gate trigger
  if (!isGateTrigger(payload.comment.body, { action: payload.action })) {
    return {
      status: "ignored",
      message: "comment does not trigger /gate",
    };
  }

  // Path 2 — trigger matched, but permission insufficient
  if (!hasTriggerPermission({ permission: payload.commenter.permission })) {
    return {
      status: "denied",
      message: `commenter permission '${payload.commenter.permission}' is not allowed to trigger /gate`,
    };
  }

  // Evaluate merge gate
  const gateResult = gateCheck(context.gateInput);

  // Path 3 — all conditions pass
  if (gateResult.allowed) {
    return {
      status: "passed",
      message: "gate passed — PR is ready to merge",
      gateResult,
    };
  }

  // Path 4 — one or more conditions fail
  return {
    status: "blocked",
    message: `gate blocked: ${gateResult.reasons.join(", ")}`,
    gateResult,
  };
}
