import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  Plus, Search, Workflow as WorkflowIcon, Webhook, Clock, Hand,
  MoreVertical, Trash2, Tag, Pencil, Check, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/workflows")({
  component: WorkflowsList,
});

type Row = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "archived";
  trigger_type: "manual" | "webhook" | "schedule";
  tags: string[];
  updated_at: string;
};

const STATUSES = ["all", "active", "draft", "paused", "archived"] as const;

function WorkflowsList() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const wsId = current?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["workflows", wsId],
    enabled: !!wsId,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, name, description, status, trigger_type, tags, updated_at")
        .eq("workspace_id", wsId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((w) => {
      if (status !== "all" && w.status !== status) return false;
      if (q && !`${w.name} ${w.description ?? ""} ${w.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, status]);

  const create = useMutation({
    mutationFn: async () => {
      if (!wsId || !user) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("workflows")
        .insert({
          workspace_id: wsId,
          name: "Untitled workflow",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["workflows", wsId] });
      navigate({ to: "/app/workflows/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows", wsId] });
      toast.success("Workflow deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Library</p>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">All saved automations in {current?.name ?? "this workspace"}.</p>
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !wsId}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "New workflow"}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workflows, tags…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition ${
                status === s ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-36 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={() => create.mutate()} busy={create.isPending} hasAny={(data?.length ?? 0) > 0} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((w) => (
              <WorkflowCard key={w.id} w={w} onDelete={() => remove.mutate(w.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowCard({ w, onDelete }: { w: Row; onDelete: () => void }) {
  const TriggerIcon = w.trigger_type === "webhook" ? Webhook : w.trigger_type === "schedule" ? Clock : Hand;
  return (
    <div className="group rounded-2xl border border-border bg-card p-4 hover:border-foreground/30 transition">
      <div className="flex items-start justify-between">
        <Link
          to="/app/workflows/$id"
          params={{ id: w.id }}
          className="flex items-start gap-3 min-w-0 flex-1"
        >
          <span className="inline-flex h-9 w-9 rounded-lg bg-gradient-flame/10 items-center justify-center shrink-0">
            <WorkflowIcon className="h-4 w-4 text-flame" />
          </span>
          <div className="min-w-0">
            <p className="font-medium truncate">{w.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {w.description || "No description"}
            </p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <StatusBadge status={w.status} />
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <TriggerIcon className="h-3 w-3" /> {w.trigger_type}
          </span>
        </div>
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(w.updated_at), { addSuffix: true })}
        </span>
      </div>

      {w.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {w.tags.slice(0, 4).map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/70">
              <Tag className="h-2.5 w-2.5" />{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const map = {
    active: "bg-emerald-500/15 text-emerald-700",
    draft: "bg-muted text-foreground/70",
    paused: "bg-amber-500/15 text-amber-700",
    archived: "bg-muted text-muted-foreground",
  } as const;
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${map[status]}`}>{status}</span>;
}

function EmptyState({ onCreate, busy, hasAny }: { onCreate: () => void; busy: boolean; hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <span className="inline-flex h-12 w-12 rounded-xl bg-gradient-flame/10 items-center justify-center mx-auto">
        <WorkflowIcon className="h-5 w-5 text-flame" />
      </span>
      <h3 className="mt-4 font-semibold">{hasAny ? "No matches" : "No workflows yet"}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        {hasAny ? "Adjust filters or search to find what you're looking for." : "Create your first workflow to start automating tasks across your stack."}
      </p>
      {!hasAny && (
        <button
          onClick={onCreate}
          disabled={busy}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New workflow
        </button>
      )}
    </div>
  );
}
