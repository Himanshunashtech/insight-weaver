import { supabase } from "@/integrations/supabase/client";

export type WorkflowAuditAction =
  | "created"
  | "renamed"
  | "updated"
  | "activated"
  | "paused"
  | "deleted";

export async function logWorkflowEvent(params: {
  workspaceId: string;
  workflowId: string;
  action: WorkflowAuditAction;
  details?: Record<string, unknown>;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return;
  await supabase.from("workflow_audit_events").insert({
    workspace_id: params.workspaceId,
    workflow_id: params.workflowId,
    actor_id: uid,
    action: params.action,
    details: params.details ?? {},
  });
}
