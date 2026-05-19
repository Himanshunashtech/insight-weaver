import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { ArrowLeft, Save, Play, Power } from "lucide-react";
import { toast } from "sonner";

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
        .select("id, workspace_id, name, description, status, trigger_type, tags")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Workflow;
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<Workflow["trigger_type"]>("manual");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setDescription(data.description ?? "");
    setTrigger(data.trigger_type);
    setTags(data.tags.join(", "));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("workflows")
        .update({
          name: name.trim() || "Untitled workflow",
          description: description.trim() || null,
          trigger_type: trigger,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow", id] });
      qc.invalidateQueries({ queryKey: ["workflows", current?.id] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      const next = data?.status === "active" ? "paused" : "active";
      const { error } = await supabase.from("workflows").update({ status: next }).eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["workflow", id] });
      qc.invalidateQueries({ queryKey: ["workflows", current?.id] });
      toast.success(next === "active" ? "Workflow activated" : "Workflow paused");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="max-w-5xl mx-auto p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/app/workflows" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-semibold tracking-tight bg-transparent outline-none min-w-0 truncate"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Power className="h-3.5 w-3.5" /> {data.status === "active" ? "Pause" : "Activate"}
          </button>
          <button
            onClick={() => toast.info("Test run lands with the execution engine.")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Play className="h-3.5 w-3.5" /> Test run
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Save"}
          </button>
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

      <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Visual canvas (React Flow) and AI generation arrive in the next phase.
      </div>
    </div>
  );
}
