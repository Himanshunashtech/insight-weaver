import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { toast } from "sonner";

export function CreateWorkspaceDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { refresh, setCurrentId } = useWorkspaces();

  const submit = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) +
      "-" + Math.random().toString(36).slice(2, 8);
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), slug, created_by: user.id })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      return toast.error(error?.message ?? "Failed to create workspace");
    }
    const { error: mErr } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: data.id, user_id: user.id, role: "owner" });
    setBusy(false);
    if (mErr) return toast.error(mErr.message);
    toast.success("Workspace created");
    await refresh();
    setCurrentId(data.id);
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs font-medium">Workspace name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Operations"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
