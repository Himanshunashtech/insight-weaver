import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "archived";
  trigger_type: "manual" | "webhook" | "schedule";
  tags: string[];
  updated_at: string;
};

export const workflowsListQuery = (workspaceId: string | undefined) =>
  queryOptions({
    queryKey: ["workflows", workspaceId] as const,
    enabled: !!workspaceId,
    queryFn: async (): Promise<WorkflowRow[]> => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, name, description, status, trigger_type, tags, updated_at")
        .eq("workspace_id", workspaceId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as WorkflowRow[];
    },
  });

export const workflowDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["workflow", id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, workspace_id, name, description, status, trigger_type, schedule, tags")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

export const workflowGraphQuery = (id: string) =>
  queryOptions({
    queryKey: ["workflow-graph", id] as const,
    queryFn: async () => {
      const { data, error } = await supabase.from("workflows").select("graph").eq("id", id).single();
      if (error) throw error;
      const g = (data?.graph as any) ?? { nodes: [], edges: [] };
      return { nodes: g.nodes ?? [], edges: g.edges ?? [] };
    },
  });

export const runsListQuery = (workspaceId: string | undefined) =>
  queryOptions({
    queryKey: ["runs", workspaceId] as const,
    enabled: !!workspaceId,
    refetchInterval: 5000,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_runs")
        .select("*, workflows(name)")
        .eq("workspace_id", workspaceId!)
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

export const runDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["run", id] as const,
    queryFn: async () => {
      const [{ data: run }, { data: steps }] = await Promise.all([
        supabase.from("workflow_runs").select("*").eq("id", id).single(),
        supabase.from("workflow_run_steps").select("*").eq("run_id", id).order("step_order"),
      ]);
      return { run, steps: steps ?? [] };
    },
  });

export const workflowAuditQuery = (workflowId: string) =>
  queryOptions({
    queryKey: ["workflow-audit", workflowId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_audit_events")
        .select("*")
        .eq("workflow_id", workflowId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export const invalidateWorkflow = (qc: import("@tanstack/react-query").QueryClient, id: string, workspaceId?: string) => {
  qc.invalidateQueries({ queryKey: ["workflow", id] });
  qc.invalidateQueries({ queryKey: ["workflow-audit", id] });
  if (workspaceId) qc.invalidateQueries({ queryKey: ["workflows", workspaceId] });
};
