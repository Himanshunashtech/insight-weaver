import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenInput = z.object({
  workflowId: z.string().uuid(),
  prompt: z.string().min(3).max(2000),
});

const KINDS = [
  "trigger.manual","trigger.webhook","trigger.schedule",
  "ai.agent","ai.completion","ai.classify","ai.extract",
  "logic.condition","logic.loop","logic.filter",
  "action.http","action.email","action.slack","action.database",
  "action.transform","action.document","action.output",
] as const;

export const generateWorkflowGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { supabase } = context;
    const { data: wf, error: wfErr } = await supabase
      .from("workflows").select("id, workspace_id, name").eq("id", data.workflowId).single();
    if (wfErr || !wf) throw new Error("Workflow not found or no access");

    const systemPrompt = `You design n8n-style automation workflows.
Return a JSON object describing the workflow with nodes and edges.
Available node kinds: ${KINDS.join(", ")}.
Rules:
- Start with a single trigger node (trigger.manual/webhook/schedule).
- Use ai.agent or ai.completion for any AI step.
- Use logic.condition for branching.
- End with action.output if returning data.
- Position nodes left-to-right with x increments of 280 and y around 100, branches offset by 180.
- Keep node ids short and unique (n1, n2, ...).
- Each node must have a clear, human-readable label.`;

    const tool = {
      type: "function",
      function: {
        name: "emit_workflow",
        description: "Emit a workflow graph.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  kind: { type: "string", enum: [...KINDS] },
                  label: { type: "string" },
                  x: { type: "number" },
                  y: { type: "number" },
                  config: { type: "object", additionalProperties: true },
                },
                required: ["id","kind","label","x","y"],
              },
            },
            edges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  source: { type: "string" },
                  target: { type: "string" },
                  label: { type: "string" },
                },
                required: ["id","source","target"],
              },
            },
          },
          required: ["name","nodes","edges"],
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.prompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_workflow" } },
      }),
    });

    if (resp.status === 429) throw new Error("Rate limit exceeded. Please retry shortly.");
    if (resp.status === 402) throw new Error("Lovable AI credits exhausted. Add funds in Settings → Workspace → Usage.");
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI gateway error: ${resp.status} ${t.slice(0,200)}`);
    }

    const json = await resp.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI returned no workflow");
    let parsed: { name: string; description?: string; nodes: any[]; edges: any[] };
    try { parsed = JSON.parse(call.function.arguments); }
    catch { throw new Error("AI returned invalid JSON"); }

    const graph = {
      nodes: parsed.nodes.map((n) => ({
        id: n.id,
        type: "wfnode",
        position: { x: Number(n.x) || 0, y: Number(n.y) || 0 },
        data: { kind: n.kind, label: n.label, config: n.config ?? {} },
      })),
      edges: parsed.edges.map((e) => ({
        id: e.id || `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    };

    const { error: upErr } = await supabase
      .from("workflows")
      .update({ graph, description: parsed.description ?? null, name: parsed.name || wf.name })
      .eq("id", data.workflowId);
    if (upErr) throw new Error(upErr.message);

    return { graph, name: parsed.name, description: parsed.description ?? null };
  });

const RunInput = z.object({ workflowId: z.string().uuid() });

export const runWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RunInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: wf, error } = await supabase
      .from("workflows").select("id, workspace_id, graph").eq("id", data.workflowId).single();
    if (error || !wf) throw new Error("Workflow not found");

    const graph = (wf.graph as { nodes: any[]; edges: any[] }) ?? { nodes: [], edges: [] };

    const { data: run, error: runErr } = await supabase.from("workflow_runs").insert({
      workspace_id: wf.workspace_id,
      workflow_id: wf.id,
      started_by: userId,
      status: "running",
      trigger: "manual",
    }).select("id").single();
    if (runErr) throw new Error(runErr.message);

    const sorted = topoSort(graph.nodes, graph.edges);
    let stepOrder = 0;
    let context_data: any = { startedAt: new Date().toISOString() };
    let failed = false;
    let failedMsg: string | null = null;

    for (const node of sorted) {
      stepOrder++;
      const kind = node.data?.kind as string;
      const label = node.data?.label as string;
      const cfg = node.data?.config ?? {};
      let status: "succeeded"|"failed" = "succeeded";
      let output: any = {};
      let err: string | null = null;

      try {
        if (kind === "ai.completion" || kind === "ai.agent") {
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
          const sys = kind === "ai.agent" ? (cfg.system || "You are a helpful agent.") : "You are a helpful assistant.";
          const user = kind === "ai.agent" ? (cfg.goal || "Proceed with the task.") : (cfg.prompt || "Hello");
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: cfg.model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: sys },
                { role: "user", content: `${user}\n\nContext: ${JSON.stringify(context_data).slice(0,1500)}` },
              ],
            }),
          });
          if (!r.ok) throw new Error(`AI ${r.status}`);
          const j = await r.json();
          output = { text: j.choices?.[0]?.message?.content ?? "" };
        } else if (kind === "action.http") {
          output = { simulated: true, method: cfg.method, url: cfg.url, status: 200 };
        } else {
          output = { simulated: true, kind };
        }
        context_data = { ...context_data, [node.id]: output };
      } catch (e: any) {
        status = "failed";
        err = e?.message || String(e);
        failed = true;
        failedMsg = err;
      }

      await supabase.from("workflow_run_steps").insert({
        run_id: run.id,
        workspace_id: wf.workspace_id,
        node_id: node.id,
        node_type: kind,
        node_label: label,
        status,
        input: { context: context_data },
        output,
        error: err,
        step_order: stepOrder,
        finished_at: new Date().toISOString(),
      });

      if (failed) break;
    }

    await supabase.from("workflow_runs").update({
      status: failed ? "failed" : "succeeded",
      finished_at: new Date().toISOString(),
      output: context_data,
      error: failedMsg,
    }).eq("id", run.id);

    return { runId: run.id, status: failed ? "failed" : "succeeded" };
  });

function topoSort(nodes: any[], edges: any[]) {
  if (!nodes?.length) return [];
  const idTo = new Map(nodes.map((n) => [n.id, n]));
  const indeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const e of edges) indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
  const queue = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id);
  const out: any[] = [];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = idTo.get(id);
    if (n) out.push(n);
    for (const e of edges.filter((e) => e.source === id)) {
      indeg.set(e.target, (indeg.get(e.target) || 1) - 1);
      if ((indeg.get(e.target) || 0) <= 0) queue.push(e.target);
    }
  }
  for (const n of nodes) if (!seen.has(n.id)) out.push(n);
  return out;
}
