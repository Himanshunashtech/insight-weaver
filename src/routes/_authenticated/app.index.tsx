import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpRight, Workflow, PlayCircle, CheckCircle2, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { current } = useWorkspaces();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const [wf, runs, agents, recent] = await Promise.all([
        supabase.from("workflows").select("id,status").eq("workspace_id", current!.id),
        supabase.from("workflow_runs").select("id,status,started_at").eq("workspace_id", current!.id).gte("started_at", since),
        supabase.from("agents").select("id").eq("workspace_id", current!.id),
        supabase.from("workflow_audit_events").select("action,created_at,details").eq("workspace_id", current!.id).order("created_at", { ascending: false }).limit(8),
      ]);
      const r = runs.data ?? [];
      const succ = r.filter((x) => x.status === "succeeded").length;
      const buckets = Array.from({ length: 14 }, (_, i) => {
        const day = new Date(Date.now() - (13 - i) * 86400000);
        const key = day.toISOString().slice(0, 10);
        return { d: day.toLocaleDateString(undefined, { weekday: "short" }), key, runs: 0 };
      });
      for (const run of r) {
        const k = run.started_at.slice(0, 10);
        const b = buckets.find((x) => x.key === k);
        if (b) b.runs++;
      }
      return {
        active: (wf.data ?? []).filter((w) => w.status === "active").length,
        totalWf: (wf.data ?? []).length,
        runs: r.length,
        success: r.length ? Math.round((succ / r.length) * 1000) / 10 : 100,
        agents: (agents.data ?? []).length,
        trend: buckets,
        recent: recent.data ?? [],
      };
    },
  });

  const kpis = [
    { label: "Runs (14d)", value: stats?.runs ?? 0, icon: PlayCircle },
    { label: "Success rate", value: `${stats?.success ?? 0}%`, icon: CheckCircle2 },
    { label: "Active workflows", value: `${stats?.active ?? 0}/${stats?.totalWf ?? 0}`, icon: Workflow },
    { label: "AI agents", value: stats?.agents ?? 0, icon: Bot },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight">{current?.name ?? "Dashboard"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational overview across your automations.</p>
        </div>
        <Link to="/app/workflows"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition">
          Build workflow <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Runs (last 14 days)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trend ?? []} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="runs" stroke="oklch(0.68 0.22 25)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
          <ul className="space-y-3 text-sm">
            {(stats?.recent ?? []).length === 0 && <li className="text-xs text-muted-foreground">No activity yet.</li>}
            {(stats?.recent ?? []).map((e: any, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40" />
                <div>
                  <p className="text-foreground capitalize">{e.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
