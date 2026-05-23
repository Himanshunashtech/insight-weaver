import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { chatWithAgent } from "@/lib/agents.functions";
import { Bot, Plus, Send, Trash2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/agents")({
  component: AgentsPage,
});

const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.4",
  "openai/gpt-5.5",
];

function AgentsPage() {
  const { current } = useWorkspaces();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.from("agents")
        .select("*").eq("workspace_id", current!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("agents").insert({
        workspace_id: current!.id,
        created_by: user!.id,
        name: "Untitled agent",
        description: "Describe what this agent does",
        model: "google/gemini-3-flash-preview",
        system_prompt: "You are a helpful AI agent.",
      }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ["agents"] }); setOpenId(id); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure autonomous agents powered by Gemini and GPT.</p>
        </div>
        <button onClick={() => create.mutate()} disabled={!current || create.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50">
          <Plus className="h-4 w-4" /> New agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No agents yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a: any) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition group cursor-pointer"
              onClick={() => setOpenId(a.id)}>
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete agent?")) remove.mutate(a.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-3 font-semibold text-sm">{a.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">{a.model}</p>
            </div>
          ))}
        </div>
      )}

      {openId && <AgentDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function AgentDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const chatFn = useServerFn(chatWithAgent);
  const [tab, setTab] = useState<"config" | "chat">("config");
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const { data: agent } = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await supabase.from("agents").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents"] }); qc.invalidateQueries({ queryKey: ["agent", id] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async (text: string) => chatFn({ data: { agentId: id, conversationId: convoId, message: text } }),
    onSuccess: (res, text) => {
      setConvoId(res.conversationId);
      setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: res.reply }]);
      setInput("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-background border-l border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">{agent.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex border-b border-border">
          {(["config", "chat"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm capitalize ${tab === t ? "border-b-2 border-foreground font-medium" : "text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        {tab === "config" ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <Field label="Name">
              <input defaultValue={agent.name} onBlur={(e) => save.mutate({ name: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Description">
              <input defaultValue={agent.description ?? ""} onBlur={(e) => save.mutate({ description: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Model">
              <select defaultValue={agent.model} onChange={(e) => save.mutate({ model: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="System prompt">
              <textarea defaultValue={agent.system_prompt} rows={8} onBlur={(e) => save.mutate({ system_prompt: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
            </Field>
            <Field label={`Temperature: ${agent.temperature}`}>
              <input type="range" min={0} max={2} step={0.1} defaultValue={agent.temperature}
                onChange={(e) => save.mutate({ temperature: Number(e.target.value) })} className="w-full" />
            </Field>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <Sparkles className="h-6 w-6 mx-auto mb-2" />
                  Send a message to test your agent.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-foreground text-background" : "bg-muted"
                  }`}>{m.content}</div>
                </div>
              ))}
              {send.isPending && <div className="text-xs text-muted-foreground">Agent is thinking…</div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) send.mutate(input.trim()); }}
              className="border-t border-border p-3 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" disabled={send.isPending || !input.trim()}
                className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
