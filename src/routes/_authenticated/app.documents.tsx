import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { extractDocument } from "@/lib/agents.functions";
import { FileText, Upload, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/app/documents")({
  component: DocsPage,
});

function DocsPage() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const extractFn = useServerFn(extractDocument);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.from("documents")
        .select("*").eq("workspace_id", current!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        const path = `${current!.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        if (upErr) throw upErr;
        const { error } = await supabase.from("documents").insert({
          workspace_id: current!.id, uploaded_by: user!.id,
          name: file.name, size_bytes: file.size, mime_type: file.type, storage_path: path,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Uploaded"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("documents").remove([doc.storage_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const extract = useMutation({
    mutationFn: async (id: string) =>
      extractFn({ data: { documentId: id, fields: "title, date, total, parties, summary" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Extracted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openDoc = docs.find((d: any) => d.id === openId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload files and run AI extraction.</p>
        </div>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => e.target.files && upload.mutate(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={!current || upload.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50">
          <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload"}
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {docs.map((d: any) => (
            <div key={d.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 cursor-pointer" onClick={() => setOpenId(d.id)}>
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{(d.size_bytes / 1024).toFixed(1)} KB · {d.status}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); extract.mutate(d.id); }} disabled={extract.isPending}
                className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border hover:bg-muted">
                <Sparkles className="h-3 w-3" /> Extract
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) remove.mutate(d); }}
                className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {openDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setOpenId(null)}>
          <div className="w-full max-w-xl h-full bg-background border-l border-border overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">{openDoc.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{openDoc.mime_type} · {(openDoc.size_bytes / 1024).toFixed(1)} KB</p>
            <h3 className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Extracted data</h3>
            <pre className="mt-2 text-xs bg-muted/50 rounded-xl p-3 overflow-x-auto">
              {openDoc.extracted ? JSON.stringify(openDoc.extracted, null, 2) : "No extraction yet. Click Extract to run AI."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
