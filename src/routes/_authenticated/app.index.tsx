import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpRight, Workflow, PlayCircle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

const trend = Array.from({ length: 14 }).map((_, i) => ({
  d: `D${i + 1}`,
  runs: Math.round(40 + Math.sin(i / 2) * 18 + i * 2),
}));

const kpis = [
  { label: "Runs today", value: "1,284", delta: "+12%", icon: PlayCircle },
  { label: "Success rate", value: "98.4%", delta: "+0.6pp", icon: CheckCircle2 },
  { label: "Active workflows", value: "27", delta: "+3", icon: Workflow },
  { label: "Hours saved (mo)", value: "412", delta: "+38", icon: Clock },
];

function DashboardPage() {
  const { current } = useWorkspaces();
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
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-semibold tracking-tight">{k.value}</p>
              <span className="text-xs text-emerald-600">{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Runs (last 14 days)</h3>
            <span className="text-xs text-muted-foreground">Updated just now</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="runs" stroke="oklch(0.68 0.22 25)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
          <ul className="space-y-3 text-sm">
            {[
              "Invoice intake completed (124 docs)",
              "KYC verification workflow activated",
              "Sheets sync ran successfully",
              "New API key created",
              "Workflow draft saved",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40" />
                <div>
                  <p className="text-foreground">{t}</p>
                  <p className="text-xs text-muted-foreground">{i + 1}h ago</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
        Workflows, runs, documents and integrations land in the next phase.
      </div>
    </div>
  );
}
