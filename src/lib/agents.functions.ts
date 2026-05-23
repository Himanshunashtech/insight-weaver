import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ChatInput = z.object({
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(8000),
});

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
          agent_id: agent.id,
          workspace_id: agent.workspace_id,
          user_id: userId,
          title: data.message.slice(0, 60),
        })
        .select("id").single();
      if (cerr) throw new Error(cerr.message);
      convoId = conv.id;
    }

    const { data: history } = await supabase
      .from("agent_messages").select("role,content")
      .eq("conversation_id", convoId!).order("created_at", { ascending: true });

    await supabase.from("agent_messages").insert({
      conversation_id: convoId!,
      workspace_id: agent.workspace_id,
      role: "user",
      content: data.message,
    });

    const messages = [
      { role: "system", content: agent.system_prompt || "You are a helpful AI agent." },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agent.model || "google/gemini-3-flash-preview",
        messages,
        temperature: Number(agent.temperature ?? 0.7),
      }),
    });
    if (resp.status === 429) throw new Error("Rate limited. Try again shortly.");
    if (resp.status === 402) throw new Error("Lovable AI credits exhausted.");
    if (!resp.ok) throw new Error(`AI error ${resp.status}`);
    const j = await resp.json();
    const reply = j.choices?.[0]?.message?.content ?? "(no response)";

    await supabase.from("agent_messages").insert({
      conversation_id: convoId!,
      workspace_id: agent.workspace_id,
      role: "assistant",
      content: reply,
    });

    return { conversationId: convoId!, reply };
  });

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

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
