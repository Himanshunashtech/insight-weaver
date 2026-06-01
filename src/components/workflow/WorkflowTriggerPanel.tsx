import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Copy, RotateCw, Webhook as WebhookIcon, Clock, Send, Eye, EyeOff, CheckCircle2, XCircle,
} from "lucide-react";

const PRESETS: { label: string; value: string }[] = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9am", value: "0 9 * * *" },
  { label: "Weekdays at 9am", value: "0 9 * * 1-5" },
  { label: "Every Monday at 8am", value: "0 8 * * 1" },
  { label: "First of month, midnight", value: "0 0 1 * *" },
];

type Props = {
  workflowId: string;
  triggerType: "manual" | "webhook" | "schedule";
  schedule: string;
  onScheduleChange: (s: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
  toggling?: boolean;
};

export function WorkflowTriggerPanel(props: Props) {
  if (props.triggerType === "schedule") return <SchedulePanel {...props} />;
  if (props.triggerType === "webhook") return <WebhookPanel workflowId={props.workflowId} />;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
      Manual trigger — run this workflow from the canvas, the runs page, or via an agent tool call.
    </div>
  );
}

function SchedulePanel({ schedule, onScheduleChange, isActive, onToggleActive, toggling }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Schedule</h3>
        <span className={`ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
          isActive ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"
        }`}>
          {isActive ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium">Presets</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onScheduleChange(p.value)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  schedule === p.value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Cron expression</label>
          <input
            value={schedule}
            onChange={(e) => onScheduleChange(e.target.value)}
            placeholder="0 9 * * 1-5"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Standard 5-field cron. Save the workflow to persist, then enable to start running on schedule.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {isActive ? "This schedule is live." : "Schedule is paused — no runs will be triggered."}
          </p>
          <button
            onClick={onToggleActive}
            disabled={toggling}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              isActive
                ? "border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
            }`}
          >
            {isActive ? "Disable schedule" : "Enable schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookPanel({ workflowId }: { workflowId: string }) {
  const qc = useQueryClient();
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["workflow-webhook", workflowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("webhook_path, webhook_secret")
        .eq("id", workflowId)
        .single();
      if (error) throw error;
      return data as { webhook_path: string | null; webhook_secret: string | null };
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = data?.webhook_path ? `${baseUrl}/api/public/wf/${data.webhook_path}` : null;

  const rotate = useMutation({
    mutationFn: async () => {
      const { data: r, error } = await supabase.rpc("rotate_workflow_webhook", {
        _workflow_id: workflowId,
      });
      if (error) throw error;
      const row = Array.isArray(r) ? r[0] : r;
      return row as { webhook_path: string; webhook_secret: string };
    },
    onSuccess: (r) => {
      setRevealedSecret(r.webhook_secret);
      qc.invalidateQueries({ queryKey: ["workflow-webhook", workflowId] });
      toast.success("Webhook rotated — copy the secret now, it won't be shown again.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <WebhookIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Webhook trigger</h3>
        <button
          onClick={() => rotate.mutate()}
          disabled={rotate.isPending}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
        >
          <RotateCw className={`h-3 w-3 ${rotate.isPending ? "animate-spin" : ""}`} />
          {data?.webhook_path ? "Rotate" : "Generate"}
        </button>
      </div>

      {!data?.webhook_path ? (
        <p className="text-sm text-muted-foreground">
          No webhook configured yet. Click <span className="font-medium">Generate</span> to create an endpoint URL and signing secret.
        </p>
      ) : (
        <>
          <Field label="Endpoint URL">
            <code className="flex-1 text-xs font-mono break-all bg-muted/40 rounded px-2 py-1.5">{url}</code>
            <IconBtn onClick={() => url && copy(url, "URL")} icon={Copy} title="Copy URL" />
          </Field>

          <Field label="Signing secret">
            {revealedSecret ? (
              <>
                <code className="flex-1 text-xs font-mono break-all bg-amber-500/10 text-amber-900 rounded px-2 py-1.5">
                  {revealedSecret}
                </code>
                <IconBtn onClick={() => copy(revealedSecret, "Secret")} icon={Copy} title="Copy secret" />
                <IconBtn onClick={() => setRevealedSecret(null)} icon={EyeOff} title="Hide" />
              </>
            ) : (
              <>
                <code className="flex-1 text-xs font-mono bg-muted/40 rounded px-2 py-1.5 text-muted-foreground">
                  ••••••••••••••••••••••••••••••••
                </code>
                <span className="text-[10px] text-muted-foreground">Visible only after rotation</span>
              </>
            )}
          </Field>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
            <p className="font-semibold">HMAC verification</p>
            <p><span className="text-muted-foreground">Algorithm:</span> <code className="font-mono">HMAC-SHA256</code></p>
            <p><span className="text-muted-foreground">Header:</span> <code className="font-mono">x-signature</code></p>
            <p><span className="text-muted-foreground">Encoding:</span> hex digest of <code className="font-mono">HMAC(secret, raw_body)</code></p>
            <p><span className="text-muted-foreground">Method:</span> <code className="font-mono">POST</code> with <code className="font-mono">application/json</code></p>
          </div>

          <WebhookTester url={url!} secret={revealedSecret} workflowId={workflowId} />
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function IconBtn({ onClick, icon: Icon, title }: { onClick: () => void; icon: any; title: string }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-md border border-border hover:bg-muted">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function WebhookTester({ url, secret, workflowId }: { url: string; secret: string | null; workflowId: string }) {
  const qc = useQueryClient();
  const [payload, setPayload] = useState('{\n  "hello": "world"\n}');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; status: number; body: any }
    | { ok: false; status?: number; error: string }
    | null
  >(null);

  const send = async () => {
    if (!secret) {
      toast.error("Rotate the webhook first to reveal the signing secret, then test.");
      return;
    }
    let body = payload;
    try { body = JSON.stringify(JSON.parse(payload)); } catch {
      toast.error("Payload is not valid JSON"); return;
    }
    setSending(true);
    setResult(null);
    try {
      const signature = await hmacSha256Hex(secret, body);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-signature": signature },
        body,
      });
      const text = await res.text();
      let parsed: any = text;
      try { parsed = JSON.parse(text); } catch {}
      if (res.ok) {
        setResult({ ok: true, status: res.status, body: parsed });
        toast.success(`Webhook accepted (${res.status})`);
        qc.invalidateQueries({ queryKey: ["runs"] });
      } else {
        setResult({ ok: false, status: res.status, error: typeof parsed === "string" ? parsed : parsed?.error ?? "Request failed" });
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || "Network error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Test webhook</h4>
        <button
          onClick={send}
          disabled={sending || !secret}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/90 disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> {sending ? "Sending…" : "Send test"}
        </button>
      </div>
      {!secret && (
        <p className="text-[11px] text-muted-foreground">Rotate the webhook above to reveal the signing secret, then send a signed test payload from here.</p>
      )}
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={6}
        spellCheck={false}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
      />
      {result && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            result.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium">
            {result.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-destructive" />
            )}
            {result.ok ? `Run ${result.body?.status ?? "created"}` : `Failed${result.status ? ` (${result.status})` : ""}`}
          </div>
          <pre className="mt-2 max-h-48 overflow-auto bg-background/50 rounded p-2 text-[10px]">
            {result.ok ? JSON.stringify(result.body, null, 2) : result.error}
          </pre>
          {result.ok && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              See full run details on the <a href="/app/runs" className="underline">Runs</a> page.
            </p>
          )}
        </div>
      )}
      {/* placeholder ref to silence unused warning */}
      <span className="hidden">{workflowId}</span>
    </div>
  );
}
