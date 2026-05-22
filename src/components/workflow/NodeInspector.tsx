import type { Node } from "@xyflow/react";
import { NODE_BY_KIND } from "@/lib/workflow-nodes";
import { Trash2 } from "lucide-react";

type Props = {
  selected: Node | null;
  onChange: (patch: { label?: string; config?: Record<string, unknown> }) => void;
  onDelete: () => void;
};

export function NodeInspector({ selected, onChange, onDelete }: Props) {
  if (!selected) {
    return (
      <div className="w-72 shrink-0 border-l border-border bg-background/60 p-4 text-xs text-muted-foreground">
        Select a node to edit its configuration. Drag nodes from the left panel onto the canvas, then connect them.
      </div>
    );
  }
  const data = selected.data as { kind: string; label: string; config?: Record<string, unknown> };
  const def = NODE_BY_KIND[data.kind];
  const cfg = data.config ?? {};

  const setCfg = (key: string, val: unknown) =>
    onChange({ config: { ...cfg, [key]: val } });

  return (
    <div className="w-72 shrink-0 border-l border-border bg-background/60 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{def?.label}</p>
        <input
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="mt-1 w-full bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-foreground/30"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">{def?.description}</p>
      </div>
      <div className="p-4 space-y-3">
        {(def?.fields ?? []).map((f) => {
          const val = (cfg as any)[f.key] ?? "";
          if (f.type === "textarea") return (
            <div key={f.key}>
              <label className="text-[11px] font-medium">{f.label}</label>
              <textarea
                value={String(val)}
                rows={3}
                placeholder={f.placeholder}
                onChange={(e) => setCfg(f.key, e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          );
          if (f.type === "select") return (
            <div key={f.key}>
              <label className="text-[11px] font-medium">{f.label}</label>
              <select
                value={String(val)}
                onChange={(e) => setCfg(f.key, e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              >
                {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
          return (
            <div key={f.key}>
              <label className="text-[11px] font-medium">{f.label}</label>
              <input
                value={String(val)}
                placeholder={f.placeholder}
                onChange={(e) => setCfg(f.key, e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          );
        })}
        {(!def?.fields || def.fields.length === 0) && (
          <p className="text-[11px] text-muted-foreground">No configuration for this node.</p>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <button
          onClick={onDelete}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-destructive border border-destructive/30 rounded-md py-1.5 hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" /> Delete node
        </button>
      </div>
    </div>
  );
}
