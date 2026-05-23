import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { current, refresh } = useWorkspaces();
  const { user, signOut } = useAuth();
  const qc = useQueryClient();

  const saveWs = useMutation({
    mutationFn: async (patch: { name?: string; slug?: string }) => {
      const { error } = await supabase.from("workspaces").update(patch).eq("id", current!.id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveProfile = useMutation({
    mutationFn: async (patch: { display_name?: string }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Saved"); },
  });

  const deleteWs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workspaces").delete().eq("id", current!.id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Workspace deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!current) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace and profile.</p>
      </div>

      <Section title="Workspace">
        <Field label="Name">
          <input defaultValue={current.name} onBlur={(e) => e.target.value !== current.name && saveWs.mutate({ name: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Slug">
          <input defaultValue={current.slug} onBlur={(e) => e.target.value !== current.slug && saveWs.mutate({ slug: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Workspace ID">
          <code className="block w-full rounded-md border border-border bg-muted px-3 py-2 text-xs font-mono">{current.id}</code>
        </Field>
      </Section>

      <Section title="Profile">
        <Field label="Display name">
          <input defaultValue={user?.user_metadata?.full_name ?? ""} onBlur={(e) => saveProfile.mutate({ display_name: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Email">
          <input readOnly value={user?.email ?? ""} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm" />
        </Field>
        <button onClick={() => signOut()} className="text-sm rounded-md border border-border px-3 py-2 hover:bg-muted">Sign out</button>
      </Section>

      <Section title="Danger zone">
        <button onClick={() => { if (confirm("Delete workspace? This cannot be undone.")) deleteWs.mutate(); }}
          className="text-sm rounded-md border border-destructive/40 text-destructive px-3 py-2 hover:bg-destructive/10">
          Delete workspace
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>{children}</div>;
}
