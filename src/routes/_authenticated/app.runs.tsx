import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/runs")({
  component: RunsPage,
});

function RunsPage() {
  const { current } = useWorkspaces();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: runs = [] } = useQuery({
    queryKey: ["runs", current?.id],
    enabled: !!current,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase.from("workflow_runs")
        .select("*, workflows(name)").eq("workspace_id", current!.id)
        .order("started_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
        <p className="text-sm text-muted-foreground mt-1">Live execution history across all workflows.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Status</th><th className="text-left px-4 py-2.5">Workflow</th><th className="text-left px-4 py-2.5">Trigger</th><th className="text-left px-4 py-2.5">Started</th><th className="text-left px-4 py-2.5">Duration</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-xs">No runs yet. Execute a workflow to see history here.</td></tr>}
            {runs.map((r: any) => (
              <tr key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setOpenId(r.id)}>
                <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-2.5 font-medium">{r.workflows?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">{r.trigger}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(r.started_at).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.finished_at ? `${Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 100) / 10}s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && <RunDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; i: any }> = {
    succeeded: { c: "text-emerald-600", i: CheckCircle2 },
    failed: { c: "text-destructive", i: XCircle },
    running: { c: "text-blue-600", i: Loader2 },
    queued: { c: "text-muted-foreground", i: Clock },
  };
  const m = map[status] ?? map.queued;
  const I = m.i;
  return <span className={`inline-flex items-center gap-1.5 text-xs ${m.c}`}><I className={`h-3.5 w-3.5 ${status === "running" ? "animate-spin" : ""}`} />{status}</span>;
}

function RunDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["run", id],
    queryFn: async () => {
      const [{ data: run }, { data: steps }] = await Promise.all([
        supabase.from("workflow_runs").select("*").eq("id", id).single(),
        supabase.from("workflow_run_steps").select("*").eq("run_id", id).order("step_order"),
      ]);
      return { run, steps: steps ?? [] };
    },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-background border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Run details</h2>
          <p className="text-xs text-muted-foreground mt-1">{data?.run && new Date(data.run.started_at).toLocaleString()}</p>
        </div>
        <div className="p-5 space-y-3">
          {(data?.steps ?? []).map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.step_order}. {s.node_label ?? s.node_type}</p>
                <StatusBadge status={s.status} />
              </div>
              {s.error && <p className="mt-2 text-xs text-destructive">{s.error}</p>}
              {s.output && (
                <pre className="mt-2 text-[10px] bg-muted/50 rounded p-2 overflow-x-auto max-h-40">{JSON.stringify(s.output, null, 2)}</pre>
              )}
            </div>
          ))}
          {!data?.steps?.length && <p className="text-sm text-muted-foreground">No steps recorded.</p>}
        </div>
      </div>
    </div>
  );
}
