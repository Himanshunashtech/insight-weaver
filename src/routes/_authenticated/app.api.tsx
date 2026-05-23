import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { KeyRound, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/app/api")({
  component: ApiPage,
});

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ApiPage() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [shown, setShown] = useState<string | null>(null);

  const { data: keys = [] } = useQuery({
    queryKey: ["apikeys", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys")
        .select("*").eq("workspace_id", current!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const name = prompt("Key name?") ?? "Untitled key";
      const raw = "sk_" + Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
      const hash = await sha256(raw);
      const prefix = raw.slice(0, 10);
      const { error } = await supabase.from("api_keys").insert({
        workspace_id: current!.id, created_by: user!.id, name, prefix, hash,
      });
      if (error) throw error;
      return raw;
    },
    onSuccess: (raw) => { setShown(raw); qc.invalidateQueries({ queryKey: ["apikeys"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apikeys"] }),
  });

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/webhooks/${current?.id}` : "";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API & Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">Trigger workflows externally with API keys and inbound webhooks.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-2">Inbound webhook URL</h3>
        <div className="flex gap-2">
          <input readOnly value={webhookUrl} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-xs font-mono" />
          <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }}
            className="px-3 py-2 rounded-md border border-border hover:bg-muted"><Copy className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">POST a JSON body to this URL to trigger Webhook nodes in this workspace.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> API keys</h3>
          <button onClick={() => create.mutate()} className="text-xs inline-flex items-center gap-1 rounded-md bg-foreground text-background px-3 py-1.5">
            <Plus className="h-3 w-3" /> New key
          </button>
        </div>
        <div className="divide-y divide-border">
          {keys.length === 0 && <p className="px-5 py-8 text-center text-xs text-muted-foreground">No keys yet.</p>}
          {keys.map((k: any) => (
            <div key={k.id} className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{k.prefix}…</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</span>
              <button onClick={() => { if (confirm("Revoke key?")) remove.mutate(k.id); }}
                className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {shown && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShown(null)}>
          <div className="bg-background rounded-2xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">Your new API key</h3>
            <p className="text-xs text-muted-foreground mt-1">Copy it now — you won't see it again.</p>
            <code className="block mt-3 p-3 bg-muted rounded-md text-xs font-mono break-all">{shown}</code>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { navigator.clipboard.writeText(shown); toast.success("Copied"); }}
                className="flex-1 rounded-md bg-foreground text-background py-2 text-sm">Copy</button>
              <button onClick={() => setShown(null)} className="flex-1 rounded-md border border-border py-2 text-sm">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
