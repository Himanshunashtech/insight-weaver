import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/team")({
  component: TeamPage,
});

const ROLES = ["owner", "admin", "builder", "viewer"] as const;

function TeamPage() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["members", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data: m } = await supabase.from("workspace_members")
        .select("id,user_id,role,created_at").eq("workspace_id", current!.id);
      if (!m?.length) return [];
      const { data: profs } = await supabase.from("profiles")
        .select("id,display_name,avatar_url").in("id", m.map((x) => x.user_id));
      return m.map((mm) => ({ ...mm, profile: profs?.find((p) => p.id === mm.user_id) }));
    },
  });

  const myRole = members.find((m: any) => m.user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("workspace_members").update({ role: role as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspace_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who has access to {current?.name ?? "this workspace"}.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" /> {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
        <div className="divide-y divide-border">
          {members.map((m: any) => (
            <div key={m.id} className="px-5 py-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 rounded-full bg-foreground text-background items-center justify-center text-sm font-semibold">
                {(m.profile?.display_name ?? "?")[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.profile?.display_name ?? "Unknown"} {m.user_id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">Joined {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              {canManage && m.user_id !== user?.id ? (
                <select value={m.role} onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value })}
                  className="text-xs rounded-md border border-border bg-background px-2 py-1">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span className="text-xs px-2 py-1 rounded-md bg-muted capitalize">{m.role}</span>
              )}
              {canManage && m.user_id !== user?.id && (
                <button onClick={() => { if (confirm("Remove this member?")) removeMember.mutate(m.id); }}
                  className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Invites</p>
        Email invites require SMTP setup. For now, ask teammates to sign up and share this workspace ID:
        <code className="block mt-2 px-3 py-2 bg-muted rounded text-xs font-mono">{current?.id}</code>
      </div>
    </div>
  );
}
