import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { ArrowLeft, Save, Power, Pencil, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logWorkflowEvent } from "@/lib/audit";
import { WorkflowAuditLog } from "@/components/app/WorkflowAuditLog";
import { WorkflowCanvas, type Graph } from "@/components/workflow/WorkflowCanvas";
import { runWorkflow } from "@/lib/ai-workflow.functions";

export const Route = createFileRoute("/_authenticated/app/workflows_/$id")({
  component: WorkflowEditor,
});

type Workflow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "archived";
  trigger_type: "manual" | "webhook" | "schedule";
  schedule: string | null;
  tags: string[];
};

function WorkflowEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { current } = useWorkspaces();

  const { data, isLoading } = useQuery({
    queryKey: ["workflow", id],
    queryFn: async (): Promise<Workflow> => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, workspace_id, name, description, status, trigger_type, schedule, tags")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Workflow;
    },
  });

  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<Workflow["trigger_type"]>("manual");
  const [schedule, setSchedule] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setDescription(data.description ?? "");
    setTrigger(data.trigger_type);
    setSchedule(data.schedule ?? "");
    setTags(data.tags.join(", "));
  }, [data]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["workflow", id] });
    qc.invalidateQueries({ queryKey: ["workflows", current?.id] });
    qc.invalidateQueries({ queryKey: ["workflow-audit", id] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const nextName = name.trim() || "Untitled workflow";
      const nextDesc = description.trim() || null;
      const nextSchedule = trigger === "schedule" ? (schedule.trim() || null) : null;
      const nextTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const fields: string[] = [];
      if (data) {
        if (nextDesc !== (data.description ?? null)) fields.push("description");
        if (trigger !== data.trigger_type) fields.push("trigger");
        if (nextSchedule !== (data.schedule ?? null)) fields.push("schedule");
        if (JSON.stringify(nextTags) !== JSON.stringify(data.tags)) fields.push("tags");
      }
      const { error } = await supabase
        .from("workflows")
        .update({
          name: nextName,
          description: nextDesc,
          trigger_type: trigger,
          schedule: nextSchedule,
          tags: nextTags,
        })
        .eq("id", id);
      if (error) throw error;
      if (data && fields.length) {
        await logWorkflowEvent({
          workspaceId: data.workspace_id,
          workflowId: id,
          action: "updated",
          details: { fields },
        });
      }
    },
    onSuccess: () => { invalidate(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameMut = useMutation({
    mutationFn: async (next: string) => {
      const trimmed = next.trim() || "Untitled workflow";
      const from = data?.name;
      const { error } = await supabase.from("workflows").update({ name: trimmed }).eq("id", id);
      if (error) throw error;
      if (data && trimmed !== from) {
        await logWorkflowEvent({
          workspaceId: data.workspace_id,
          workflowId: id,
          action: "renamed",
          details: { from, to: trimmed },
        });
      }
      return trimmed;
    },
    onSuccess: (next) => {
      setName(next);
      setRenaming(false);
      invalidate();
      toast.success("Renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      const next = data?.status === "active" ? "paused" : "active";
      const { error } = await supabase.from("workflows").update({ status: next }).eq("id", id);
      if (error) throw error;
      if (data) {
        await logWorkflowEvent({
          workspaceId: data.workspace_id,
          workflowId: id,
          action: next === "active" ? "activated" : "paused",
        });
      }
      return next;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["workflow", id] });
      const prev = qc.getQueryData<Workflow>(["workflow", id]);
      if (prev) {
        const next = prev.status === "active" ? "paused" : "active";
        qc.setQueryData<Workflow>(["workflow", id], { ...prev, status: next });
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["workflow", id], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: (next) => {
      invalidate();
      toast.success(next === "active" ? "Workflow activated" : "Workflow paused");
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (data) {
        await logWorkflowEvent({
          workspaceId: data.workspace_id,
          workflowId: id,
          action: "deleted",
          details: { name: data.name },
        });
      }
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows", current?.id] });
      toast.success("Workflow deleted");
      navigate({ to: "/app/workflows" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="max-w-5xl mx-auto p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const isActive = data.status === "active";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/app/workflows" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {renaming ? (
            <div className="flex items-center gap-1 min-w-0">
              <input
                ref={renameRef}
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameMut.mutate(renameDraft);
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="text-2xl font-semibold tracking-tight bg-transparent outline-none border-b border-foreground/30 min-w-0"
              />
              <button
                onClick={() => renameMut.mutate(renameDraft)}
                disabled={renameMut.isPending}
                className="p-1.5 rounded hover:bg-muted text-emerald-600"
              >
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setRenaming(false)} className="p-1.5 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setRenameDraft(name); setRenaming(true); }}
              className="group flex items-center gap-2 min-w-0 text-left"
            >
              <h1 className="text-2xl font-semibold tracking-tight truncate">{name}</h1>
              <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition" />
            </button>
          )}
          <StatusPill status={data.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm disabled:opacity-50 transition ${
              isActive
                ? "border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
            }`}
          >
            <Power className="h-3.5 w-3.5" /> {isActive ? "Pause" : "Activate"}
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Save"}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 text-destructive px-3 py-1.5 text-sm hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{name}" and any associated configuration. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Details</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this workflow do?"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Trigger</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as Workflow["trigger_type"])}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="webhook">Webhook</option>
                  <option value="schedule">Schedule</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Tags (comma-separated)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ops, finance"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h3 className="font-semibold">Status</h3>
          <p className="mt-2 capitalize text-muted-foreground">{data.status}</p>
          <h3 className="mt-5 font-semibold">Workflow ID</h3>
          <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{id}</p>
        </div>
      </div>

      <div className="mt-4">
        <WorkflowTriggerPanel
          workflowId={id}
          triggerType={trigger}
          schedule={schedule}
          onScheduleChange={setSchedule}
          isActive={isActive}
          onToggleActive={() => toggleActive.mutate()}
          toggling={toggleActive.isPending}
        />
      </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h3 className="font-semibold">Status</h3>
          <p className="mt-2 capitalize text-muted-foreground">{data.status}</p>
          <h3 className="mt-5 font-semibold">Workflow ID</h3>
          <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{id}</p>
        </div>
      </div>

      <div className="mt-4">
        <CanvasBlock workflowId={id} workspaceId={data.workspace_id} />
      </div>

      <WorkflowAuditLog workflowId={id} />
    </div>
  );
}

function CanvasBlock({ workflowId, workspaceId }: { workflowId: string; workspaceId: string }) {
  const qc = useQueryClient();
  const runFn = useServerFn(runWorkflow);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: graph } = useQuery({
    queryKey: ["workflow-graph", workflowId],
    queryFn: async (): Promise<Graph> => {
      const { data, error } = await supabase.from("workflows").select("graph").eq("id", workflowId).single();
      if (error) throw error;
      const g = (data?.graph as any) ?? { nodes: [], edges: [] };
      return { nodes: g.nodes ?? [], edges: g.edges ?? [] };
    },
  });

  const onSave = async (g: Graph) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("workflows").update({ graph: g as any }).eq("id", workflowId);
      if (error) throw error;
      await logWorkflowEvent({ workspaceId, workflowId, action: "canvas_saved", details: { nodes: g.nodes.length, edges: g.edges.length } });
      qc.invalidateQueries({ queryKey: ["workflow-graph", workflowId] });
      qc.invalidateQueries({ queryKey: ["workflow-audit", workflowId] });
      toast.success("Canvas saved");
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const onRun = async () => {
    setRunning(true);
    try {
      const r = await runFn({ data: { workflowId } });
      toast.success(`Run ${r.status}`);
      qc.invalidateQueries({ queryKey: ["runs"] });
    } catch (e: any) { toast.error(e?.message || "Run failed"); }
    finally { setRunning(false); }
  };

  return (
    <WorkflowCanvas
      workflowId={workflowId}
      initial={graph ?? { nodes: [], edges: [] }}
      onSave={onSave}
      onRun={onRun}
      onRegenerated={() => qc.invalidateQueries({ queryKey: ["workflow-graph", workflowId] })}
      saving={saving}
      running={running}
    />
  );
}


function StatusPill({ status }: { status: Workflow["status"] }) {
  const map = {
    active: "bg-emerald-500/15 text-emerald-700",
    draft: "bg-muted text-foreground/70",
    paused: "bg-amber-500/15 text-amber-700",
    archived: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
