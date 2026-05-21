import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import {
  Power, Pencil, Save, Trash2, Plus, History, type LucideIcon,
} from "lucide-react";

type Event = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor_id: string;
};

type Profile = { id: string; display_name: string | null; avatar_url: string | null };

const ICONS: Record<string, LucideIcon> = {
  created: Plus,
  renamed: Pencil,
  updated: Save,
  activated: Power,
  paused: Power,
  deleted: Trash2,
};

const COLORS: Record<string, string> = {
  created: "text-blue-600 bg-blue-500/10",
  renamed: "text-foreground bg-muted",
  updated: "text-foreground bg-muted",
  activated: "text-emerald-700 bg-emerald-500/10",
  paused: "text-amber-700 bg-amber-500/10",
  deleted: "text-destructive bg-destructive/10",
};

export function WorkflowAuditLog({ workflowId }: { workflowId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["workflow-audit", workflowId],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("workflow_audit_events")
        .select("id, action, details, created_at, actor_id")
        .eq("workflow_id", workflowId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (events ?? []) as Event[];
      const ids = Array.from(new Set(list.map((e) => e.actor_id)));
      let profiles: Record<string, Profile> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids);
        profiles = Object.fromEntries(((profs ?? []) as Profile[]).map((p) => [p.id, p]));
      }
      return { list, profiles };
    },
  });

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Audit log</h3>
      </div>
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.list.map((e) => {
            const Icon = ICONS[e.action] ?? History;
            const color = COLORS[e.action] ?? "text-foreground bg-muted";
            const actor = data.profiles[e.actor_id];
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{actor?.display_name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{describe(e)}</span>
                  </p>
                  <p
                    className="text-[11px] text-muted-foreground"
                    title={format(new Date(e.created_at), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function describe(e: Event): string {
  const d = e.details ?? {};
  switch (e.action) {
    case "created": return "created this workflow";
    case "renamed": return `renamed it${d.from ? ` from "${d.from}"` : ""}${d.to ? ` to "${d.to}"` : ""}`;
    case "updated": {
      const fields = Array.isArray(d.fields) ? (d.fields as string[]) : [];
      return fields.length ? `updated ${fields.join(", ")}` : "updated the workflow";
    }
    case "activated": return "activated the workflow";
    case "paused": return "paused the workflow";
    case "deleted": return "deleted the workflow";
    default: return e.action;
  }
}
