import { CATEGORIES, NODE_CATALOG } from "@/lib/workflow-nodes";
import { Sparkles } from "lucide-react";

export function NodePalette({ onAiClick }: { onAiClick: () => void }) {
  return (
    <div className="w-56 shrink-0 border-r border-border bg-background/60 overflow-y-auto">
      <div className="p-3 border-b border-border">
        <button
          onClick={onAiClick}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-medium px-3 py-2 hover:opacity-90 transition"
        >
          <Sparkles className="h-3.5 w-3.5" /> Generate with AI
        </button>
      </div>
      <div className="p-3 space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">{cat}</p>
            <div className="space-y-1">
              {NODE_CATALOG.filter((n) => n.category === cat).map((n) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.kind}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/node-kind", n.kind);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-transparent hover:bg-muted hover:border-border cursor-grab active:cursor-grabbing text-xs"
                    title={n.description}
                  >
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-white shrink-0"
                      style={{ background: n.accent }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="truncate">{n.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
