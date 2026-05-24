import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, timingSafeEqual } from "crypto";
import { executeWorkflow } from "@/lib/ai-workflow.functions";

export const Route = createFileRoute("/api/public/wf/$path")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const path = params.path;
        const body = await request.text();
        const signature = request.headers.get("x-signature") || "";

        const { data: wf, error } = await supabaseAdmin
          .from("workflows")
          .select("id, workspace_id, webhook_secret, status, created_by")
          .eq("webhook_path", path)
          .maybeSingle();

        if (error || !wf || !wf.webhook_secret) {
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404, headers: { "Content-Type": "application/json" },
          });
        }

        // Verify HMAC
        const expected = createHmac("sha256", wf.webhook_secret).update(body).digest("hex");
        let valid = false;
        try {
          valid = signature.length === expected.length
            && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        } catch { valid = false; }

        // Log
        let payload: any = {};
        try { payload = body ? JSON.parse(body) : {}; } catch { payload = { raw: body }; }

        await supabaseAdmin.from("workflow_webhooks_log").insert({
          workspace_id: wf.workspace_id,
          workflow_id: wf.id,
          headers: Object.fromEntries(request.headers.entries()),
          payload,
          ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || null,
          signature_valid: valid,
        });

        if (!valid) {
          return new Response(JSON.stringify({ error: "invalid signature" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        if (wf.status !== "active") {
          return new Response(JSON.stringify({ error: "workflow not active" }), {
            status: 409, headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const result = await executeWorkflow({
            supabase: supabaseAdmin,
            workflowId: wf.id,
            input: payload,
            trigger: "webhook",
            startedBy: wf.created_by,
          });
          return new Response(JSON.stringify(result), {
            status: 200, headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () => new Response("Use POST with X-Signature header", { status: 405 }),
    },
  },
});
