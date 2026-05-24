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

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ---------- helpers ----------
function interpolate(tpl: string, ctx: Record<string, any>): string {
  if (typeof tpl !== "string") return tpl;
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    let v: any = ctx;
    for (const p of parts) v = v == null ? v : v[p];
    return v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  });
}

function safeEval(expr: string, ctx: Record<string, any>): any {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("ctx", "input", `with(ctx){ return (${expr}); }`);
    return fn(ctx, ctx.input ?? {});
  } catch {
    return undefined;
  }
}

async function callAI(opts: {
  model?: string;
  system: string;
  user: string;
  json?: boolean;
  tools?: any[];
}): Promise<any> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const body: any = {
    model: opts.model || "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.json) body.response_format = { type: "json_object" };
  if (opts.tools) body.tools = opts.tools;
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("AI rate limit exceeded");
  if (r.status === 402) throw new Error("AI credits exhausted");
  if (!r.ok) throw new Error(`AI gateway ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// ---------- generation ----------
export const generateWorkflowGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
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
- Use logic.condition for branching (provide an "expression" in config).
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

    const j = await callAI({ system: systemPrompt, user: data.prompt, tools: [tool] });
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
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

// ---------- run ----------
const RunInput = z.object({
  workflowId: z.string().uuid(),
  input: z.record(z.unknown()).optional(),
  trigger: z.enum(["manual","webhook","schedule"]).optional(),
});

export const runWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RunInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = await executeWorkflow({
      supabase,
      workflowId: data.workflowId,
      input: data.input ?? {},
      trigger: data.trigger ?? "manual",
      startedBy: userId,
    });
    return result;
  });

// ---------- core executor (shared by manual + webhook) ----------
export async function executeWorkflow(opts: {
  supabase: any;
  workflowId: string;
  input: Record<string, unknown>;
  trigger: "manual"|"webhook"|"schedule";
  startedBy: string;
}) {
  const { supabase, workflowId, input, trigger, startedBy } = opts;

  const { data: wf, error } = await supabase
    .from("workflows").select("id, workspace_id, graph, status").eq("id", workflowId).single();
  if (error || !wf) throw new Error("Workflow not found");

  const graph = (wf.graph as { nodes: any[]; edges: any[] }) ?? { nodes: [], edges: [] };

  const { data: run, error: runErr } = await supabase.from("workflow_runs").insert({
    workspace_id: wf.workspace_id,
    workflow_id: wf.id,
    started_by: startedBy,
    status: "running",
    trigger,
    input,
  }).select("id").single();
  if (runErr) throw new Error(runErr.message);

  const sorted = topoSort(graph.nodes, graph.edges);
  const ctx: Record<string, any> = { input, trigger, startedAt: new Date().toISOString() };
  const skipped = new Set<string>();
  let stepOrder = 0;
  let failed = false;
  let failedMsg: string | null = null;

  // Map condition edges by source (label "true"/"false") for branching
  const edgesBySource = new Map<string, any[]>();
  for (const e of graph.edges) {
    if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
    edgesBySource.get(e.source)!.push(e);
  }

  for (const node of sorted) {
    stepOrder++;
    if (skipped.has(node.id)) {
      await supabase.from("workflow_run_steps").insert({
        run_id: run.id, workspace_id: wf.workspace_id,
        node_id: node.id, node_type: node.data?.kind, node_label: node.data?.label,
        status: "skipped", input: {}, output: { reason: "branch not taken" },
        step_order: stepOrder, finished_at: new Date().toISOString(),
      });
      continue;
    }

    const kind = node.data?.kind as string;
    const label = node.data?.label as string;
    const cfg = node.data?.config ?? {};
    let status: "succeeded"|"failed" = "succeeded";
    let output: any = {};
    let err: string | null = null;
    const startedAt = Date.now();

    try {
      output = await executeNode(kind, cfg, ctx, wf.workspace_id, supabase);
      ctx[node.id] = output;
      ctx.last = output;
      // Branching for logic.condition
      if (kind === "logic.condition") {
        const taken = output?.result ? "true" : "false";
        const children = edgesBySource.get(node.id) ?? [];
        for (const e of children) {
          const eLabel = String(e.label ?? "").toLowerCase();
          if (eLabel && eLabel !== taken) markBranchSkipped(e.target, graph.edges, skipped);
        }
      }
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
      input: { config: cfg },
      output,
      error: err,
      step_order: stepOrder,
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
    });

    if (failed) break;
  }

  await supabase.from("workflow_runs").update({
    status: failed ? "failed" : "succeeded",
    finished_at: new Date().toISOString(),
    output: ctx,
    error: failedMsg,
  }).eq("id", run.id);

  return { runId: run.id, status: failed ? "failed" : "succeeded", output: ctx };
}

function markBranchSkipped(nodeId: string, edges: any[], skipped: Set<string>) {
  if (skipped.has(nodeId)) return;
  skipped.add(nodeId);
  for (const e of edges.filter((x) => x.source === nodeId)) {
    markBranchSkipped(e.target, edges, skipped);
  }
}

async function executeNode(
  kind: string,
  cfg: any,
  ctx: Record<string, any>,
  workspaceId: string,
  supabase: any,
): Promise<any> {
  switch (kind) {
    case "trigger.manual":
    case "trigger.webhook":
    case "trigger.schedule":
      return { triggered: true, input: ctx.input };

    case "ai.completion": {
      const j = await callAI({
        model: cfg.model,
        system: "You are a helpful assistant.",
        user: `${interpolate(cfg.prompt || "", ctx)}\n\nContext: ${JSON.stringify(ctx).slice(0, 1500)}`,
      });
      return { text: j.choices?.[0]?.message?.content ?? "" };
    }
    case "ai.agent": {
      const j = await callAI({
        model: cfg.model,
        system: cfg.system || "You are a helpful agent.",
        user: `${interpolate(cfg.goal || "", ctx)}\n\nContext: ${JSON.stringify(ctx).slice(0, 1500)}`,
      });
      return { text: j.choices?.[0]?.message?.content ?? "" };
    }
    case "ai.classify": {
      const labels = String(cfg.labels || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      const j = await callAI({
        system: `Classify the input into exactly one of: ${labels.join(", ")}. Reply with just the label.`,
        user: JSON.stringify(ctx.input ?? ctx.last ?? ""),
      });
      const text = (j.choices?.[0]?.message?.content ?? "").trim();
      return { label: text, confidence: 1 };
    }
    case "ai.extract": {
      const fields = String(cfg.fields || "");
      const j = await callAI({
        system: "Extract structured fields. Return JSON only.",
        user: `Fields: ${fields}\nInput: ${JSON.stringify(ctx.input ?? ctx.last ?? "")}`,
        json: true,
      });
      try { return JSON.parse(j.choices?.[0]?.message?.content ?? "{}"); }
      catch { return { raw: j.choices?.[0]?.message?.content }; }
    }

    case "logic.condition": {
      const result = !!safeEval(String(cfg.expression || "false"), ctx);
      return { result, expression: cfg.expression };
    }
    case "logic.filter": {
      const items = Array.isArray(ctx.input?.items) ? ctx.input.items : (ctx.last?.items ?? []);
      const kept = items.filter((item: any) => !!safeEval(String(cfg.predicate || "true"), { ...ctx, item }));
      return { items: kept, count: kept.length };
    }
    case "logic.loop": {
      const list = safeEval(String(cfg.source || "input.items"), ctx);
      return { iterations: Array.isArray(list) ? list.length : 0, items: list };
    }

    case "action.http": {
      const url = interpolate(String(cfg.url || ""), ctx);
      if (!/^https?:\/\//.test(url)) throw new Error("Invalid URL");
      const method = String(cfg.method || "GET").toUpperCase();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (cfg.headers && typeof cfg.headers === "object") Object.assign(headers, cfg.headers);
      const body = method === "GET" || method === "HEAD"
        ? undefined
        : (cfg.body ? interpolate(String(cfg.body), ctx) : JSON.stringify(ctx.input ?? {}));
      const r = await fetch(url, { method, headers, body });
      const text = await r.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch { /* not JSON */ }
      return { status: r.status, ok: r.ok, body: json ?? text };
    }
    case "action.slack": {
      // Look up Slack integration for this workspace
      const { data: integ } = await supabase
        .from("integrations").select("config").eq("workspace_id", workspaceId).eq("kind", "slack").maybeSingle();
      const webhookUrl = integ?.config?.webhook_url as string | undefined;
      if (!webhookUrl) throw new Error("Slack integration not connected. Add a webhook URL in Integrations.");
      const text = interpolate(String(cfg.text || ""), ctx) || "Workflow notification";
      const r = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, channel: cfg.channel }),
      });
      if (!r.ok) throw new Error(`Slack ${r.status}`);
      return { posted: true, channel: cfg.channel };
    }
    case "action.email": {
      // Queue an email — actual delivery requires Resend integration
      return {
        queued: true,
        to: interpolate(String(cfg.to || ""), ctx),
        subject: interpolate(String(cfg.subject || ""), ctx),
        preview: interpolate(String(cfg.body || ""), ctx).slice(0, 200),
      };
    }
    case "action.database": {
      const table = String(cfg.table || "");
      const op = String(cfg.op || "select");
      if (!table) throw new Error("Table required");
      if (op === "select") {
        const { data, error } = await supabase.from(table).select("*").limit(50);
        if (error) throw new Error(error.message);
        return { rows: data, count: data?.length ?? 0 };
      }
      if (op === "insert") {
        const row = ctx.input ?? {};
        const { data, error } = await supabase.from(table).insert(row).select().single();
        if (error) throw new Error(error.message);
        return { inserted: data };
      }
      return { skipped: true, op };
    }
    case "action.transform": {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function("input", "ctx", String(cfg.code || "return input;"));
        return { result: fn(ctx.input ?? ctx.last ?? {}, ctx) };
      } catch (e: any) {
        throw new Error(`Transform error: ${e.message}`);
      }
    }
    case "action.document":
      return { source: interpolate(String(cfg.source || ""), ctx), processed: false, note: "Use the Documents page to extract." };
    case "action.output":
      return { output: ctx.last ?? ctx.input ?? null };
    default:
      return { skipped: true, kind };
  }
}

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

// ---------- webhook secret rotation ----------
export const rotateWebhookSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workflowId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.rpc("rotate_workflow_webhook", { _workflow_id: data.workflowId });
    if (error) throw new Error(error.message);
    const r = Array.isArray(row) ? row[0] : row;
    return { path: r?.webhook_path as string, secret: r?.webhook_secret as string };
  });

export const getWebhookInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workflowId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: wf, error } = await supabase
      .from("workflows").select("webhook_path, webhook_secret").eq("id", data.workflowId).single();
    if (error || !wf) throw new Error("Not found");
    return { path: wf.webhook_path as string | null, secret: wf.webhook_secret as string | null };
  });
