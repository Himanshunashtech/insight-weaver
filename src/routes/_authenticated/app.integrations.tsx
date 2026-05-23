import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { Plug, Check, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/integrations")({
  component: IntegrationsPage,
});

const CATALOG = [
  { kind: "slack", name: "Slack", desc: "Send messages and alerts" },
  { kind: "gmail", name: "Gmail", desc: "Send and receive email" },
  { kind: "sheets", name: "Google Sheets", desc: "Read and write rows" },
  { kind: "notion", name: "Notion", desc: "Sync pages and databases" },
  { kind: "stripe", name: "Stripe", desc: "Payments and customers" },
  { kind: "hubspot", name: "HubSpot", desc: "CRM contacts and deals" },
  { kind: "github", name: "GitHub", desc: "Issues, PRs, automations" },
  { kind: "openai", name: "OpenAI", desc: "Direct OpenAI API access" },
  { kind: "anthropic", name: "Anthropic Claude", desc: "Connect Claude models" },
  { kind: "postgres", name: "Postgres", desc: "Direct SQL connection" },
];

function IntegrationsPage() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: installed = [] } = useQuery({
    queryKey: ["integrations", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations")
        .select("*").eq("workspace_id", current!.id);
      if (error) throw error;
      return data;
    },
  });

  const install = useMutation({
    mutationFn: async (kind: string) => {
      const item = CATALOG.find((c) => c.kind === kind)!;
      const { error } = await supabase.from("integrations").insert({
        workspace_id: current!.id, created_by: user!.id, name: item.name, kind, enabled: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); toast.success("Connected"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (it: any) => {
      const { error } = await supabase.from("integrations").update({ enabled: !it.enabled }).eq("id", it.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });

  const isInstalled = (kind: string) => installed.find((i: any) => i.kind === kind);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect external apps and AI providers.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATALOG.map((c) => {
          const inst = isInstalled(c.kind);
          return (
            <div key={c.kind} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><Plug className="h-4 w-4" /></span>
                {inst && <span className="text-[10px] uppercase tracking-wider text-emerald-600 inline-flex items-center gap-1"><Check className="h-3 w-3" /> Installed</span>}
              </div>
              <h3 className="mt-3 font-semibold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              <div className="mt-3">
                {inst ? (
                  <button onClick={() => toggle.mutate(inst)} className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted">
                    {inst.enabled ? "Disable" : "Enable"}
                  </button>
                ) : (
                  <button onClick={() => install.mutate(c.kind)} className="text-xs inline-flex items-center gap-1 rounded-md bg-foreground text-background px-3 py-1.5">
                    <Plus className="h-3 w-3" /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
