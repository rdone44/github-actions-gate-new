export interface GateCommentPayload {
  body: string;
  action?: string;
}

export function isGateTrigger(
  body: string,
  options?: { action?: string },
): boolean {
  if (options?.action && options.action !== "created") return false;
  return /^\/gate$/.test(body.trim());
}

export function hasTriggerPermission(
  author: { permission: string },
): boolean {
  return author.permission === "admin" || author.permission === "maintain";
}
