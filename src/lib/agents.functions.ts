import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const ChatInput = z.object({
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(8000),
});

// ---------- Tool definitions ----------
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the public web for current information. Returns top results with snippets.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "http_fetch",
      description: "Fetch a URL and return its text content. Use for reading public APIs or web pages.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          method: { type: "string", enum: ["GET","POST"] },
          body: { type: "string" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Read rows from a workspace database table.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", enum: ["workflows","workflow_runs","documents","agents"] },
          limit: { type: "number" },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_workflow",
      description: "Trigger an existing workflow by name and return its result.",
      parameters: {
        type: "object",
        properties: {
          workflow_name: { type: "string" },
          input: { type: "object", additionalProperties: true },
        },
        required: ["workflow_name"],
      },
    },
  },
];

async function execTool(
  name: string,
  args: any,
  ctx: { supabase: any; workspaceId: string; userId: string },
): Promise<any> {
  if (name === "web_search") {
    // Use DuckDuckGo's instant answer + HTML fallback — no key required.
    const q = encodeURIComponent(String(args.query || ""));
    const r = await fetch(`https://duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`);
    const j = await r.json().catch(() => ({}));
    const results = (j.RelatedTopics || []).slice(0, 5).map((t: any) => ({
      text: t.Text, url: t.FirstURL,
    }));
    return {
      abstract: j.AbstractText || j.Abstract || "",
      heading: j.Heading || "",
      results,
    };
  }
  if (name === "http_fetch") {
    const url = String(args.url || "");
    if (!/^https?:\/\//.test(url)) throw new Error("Invalid URL");
    const r = await fetch(url, {
      method: String(args.method || "GET"),
      body: args.body,
      headers: { "User-Agent": "SolaAgent/1.0" },
    });
    const text = (await r.text()).slice(0, 8000);
    return { status: r.status, body: text };
  }
  if (name === "query_database") {
    const table = String(args.table);
    const limit = Math.min(Number(args.limit) || 20, 100);
    const { data, error } = await ctx.supabase
      .from(table).select("*").eq("workspace_id", ctx.workspaceId).limit(limit);
    if (error) throw new Error(error.message);
    return { rows: data, count: data?.length ?? 0 };
  }
  if (name === "run_workflow") {
    const { data: wf } = await ctx.supabase
      .from("workflows").select("id").eq("workspace_id", ctx.workspaceId)
      .ilike("name", String(args.workflow_name)).maybeSingle();
    if (!wf) throw new Error(`Workflow "${args.workflow_name}" not found`);
    const { executeWorkflow } = await import("./ai-workflow.functions");
    const out = await executeWorkflow({
      supabase: ctx.supabase, workflowId: wf.id,
      input: args.input ?? {}, trigger: "manual", startedBy: ctx.userId,
    });
    return out;
  }
  throw new Error(`Unknown tool: ${name}`);
}

export const chatWithAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: agent, error: aerr } = await supabase
      .from("agents").select("*").eq("id", data.agentId).single();
    if (aerr || !agent) throw new Error("Agent not found");

    let convoId = data.conversationId ?? null;
    if (!convoId) {
      const { data: conv, error: cerr } = await supabase
        .from("agent_conversations")
        .insert({
          agent_id: agent.id, workspace_id: agent.workspace_id,
          user_id: userId, title: data.message.slice(0, 60),
        })
        .select("id").single();
      if (cerr) throw new Error(cerr.message);
      convoId = conv.id;
    }

    const { data: history } = await supabase
      .from("agent_messages").select("role,content")
      .eq("conversation_id", convoId!).order("created_at", { ascending: true });

    await supabase.from("agent_messages").insert({
      conversation_id: convoId!, workspace_id: agent.workspace_id,
      role: "user", content: data.message,
    });

    const toolNames = Array.isArray(agent.tools) ? (agent.tools as unknown[]).map(String) : [];
    const enabledTools = toolNames.length > 0
      ? AGENT_TOOLS.filter((t) => toolNames.includes(t.function.name))
      : AGENT_TOOLS;

    const messages: any[] = [
      { role: "system", content: agent.system_prompt || "You are a helpful AI agent. Use tools when they help answer the user." },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    let toolCallsTotal = 0;
    const MAX_STEPS = 6;
    let finalReply = "";

    for (let step = 0; step < MAX_STEPS; step++) {
      const resp = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: agent.model || "google/gemini-3-flash-preview",
          messages,
          tools: enabledTools,
          temperature: Number(agent.temperature ?? 0.7),
        }),
      });
      if (resp.status === 429) throw new Error("Rate limited. Try again shortly.");
      if (resp.status === 402) throw new Error("Lovable AI credits exhausted.");
      if (!resp.ok) throw new Error(`AI error ${resp.status}: ${(await resp.text()).slice(0,200)}`);
      const j = await resp.json();
      const choice = j.choices?.[0]?.message;
      if (!choice) throw new Error("Empty AI response");

      const toolCalls = choice.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        messages.push(choice);
        for (const tc of toolCalls) {
          toolCallsTotal++;
          let toolArgs: any = {};
          try { toolArgs = JSON.parse(tc.function.arguments || "{}"); } catch { /* */ }
          const startedAt = Date.now();
          let toolOut: any; let status = "succeeded"; let err: string | null = null;
          try {
            toolOut = await execTool(tc.function.name, toolArgs, {
              supabase, workspaceId: agent.workspace_id, userId,
            });
          } catch (e: any) {
            status = "failed"; err = e.message; toolOut = { error: e.message };
          }
          await supabase.from("agent_tool_calls").insert({
            workspace_id: agent.workspace_id,
            conversation_id: convoId!,
            tool_name: tc.function.name,
            input: toolArgs, output: toolOut, status, error: err,
            latency_ms: Date.now() - startedAt,
          });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(toolOut).slice(0, 6000),
          });
        }
        continue;
      }

      finalReply = choice.content || "(no response)";
      break;
    }

    if (!finalReply) finalReply = "I reached the maximum number of tool steps without producing a final answer.";

    await supabase.from("agent_messages").insert({
      conversation_id: convoId!,
      workspace_id: agent.workspace_id,
      role: "assistant",
      content: finalReply,
    });

    return { conversationId: convoId!, reply: finalReply, toolCalls: toolCallsTotal };
  });

// ---------- Document extraction ----------
const ExtractInput = z.object({
  documentId: z.string().uuid(),
  fields: z.string().min(1).max(500),
});

export const extractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ExtractInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: doc, error } = await supabase
      .from("documents").select("*").eq("id", data.documentId).single();
    if (error || !doc) throw new Error("Document not found");

    const { data: signed } = await supabase.storage
      .from("documents").createSignedUrl(doc.storage_path, 600);

    const prompt = `Extract the following fields as JSON from the document at ${signed?.signedUrl}.\nFields: ${data.fields}\nFile name: ${doc.name}\nReturn only valid JSON.`;

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You extract structured data from documents. Return only JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`AI ${resp.status}`);
    const j = await resp.json();
    let parsed: any = {};
    try { parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}"); }
    catch { parsed = { raw: j.choices?.[0]?.message?.content ?? "" }; }

    await supabase.from("documents")
      .update({ extracted: parsed, status: "extracted" })
      .eq("id", doc.id);

    return { extracted: parsed };
  });
