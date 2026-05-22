import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_BY_KIND } from "@/lib/workflow-nodes";

function WorkflowNodeImpl({ data, selected }: NodeProps) {
  const d = data as { kind: string; label: string; config?: Record<string, unknown> };
  const def = NODE_BY_KIND[d.kind];
  const Icon = def?.icon;
  const accent = def?.accent ?? "#64748b";
  const isTrigger = d.kind?.startsWith("trigger.");

  return (
    <div
      className={`group rounded-xl border bg-card shadow-sm w-[210px] transition ${
        selected ? "border-foreground ring-2 ring-foreground/20" : "border-border"
      }`}
    >
      {!isTrigger && <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-foreground/60 !border-0" />}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white"
          style={{ background: accent }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{def?.label ?? d.kind}</p>
          <p className="text-xs font-semibold truncate">{d.label}</p>
        </div>
      </div>
      <div className="px-3 py-2 text-[11px] text-muted-foreground line-clamp-2 min-h-[32px]">
        {def?.description}
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-foreground/60 !border-0" />
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeImpl);
