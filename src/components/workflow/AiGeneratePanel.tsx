import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateWorkflowGraph } from "@/lib/ai-workflow.functions";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  "When a webhook receives a new lead, classify intent with AI, send Slack alert, and email a personalized reply.",
  "Every weekday at 9am, fetch new Stripe charges, summarize with AI, and post to Slack.",
  "On form submit, extract fields, score the lead with an AI agent, and write the result to the database.",
  "Watch a Gmail inbox, classify support tickets, and create rows in a database with the categorized fields.",
];

export function AiGeneratePanel({
  workflowId, onClose, onGenerated,
}: { workflowId: string; onClose: () => void; onGenerated: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = useServerFn(generateWorkflowGraph);

  const submit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      await generate({ data: { workflowId, prompt: prompt.trim() } });
      toast.success("Workflow generated");
      onGenerated();
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate");
    } finally { setLoading(false); }
  };

  return (
    <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 rounded-md bg-gradient-to-br from-orange-500 to-rose-500 items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold">Generate workflow with AI</p>
              <p className="text-[11px] text-muted-foreground">Describe what you want to automate.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. When a webhook fires, classify the message with AI, and post to Slack…"
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setPrompt(p)}
                className="text-[11px] px-2 py-1 rounded-full border border-border hover:bg-muted text-left max-w-full truncate"
                title={p}
              >{p.length > 50 ? p.slice(0, 50) + "…" : p}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
            <button
              onClick={submit}
              disabled={loading || !prompt.trim()}
              className="rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >{loading ? "Generating…" : "Generate"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
