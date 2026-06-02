import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Copy, RotateCw, Webhook as WebhookIcon, Clock, Send, Eye, EyeOff, CheckCircle2, XCircle, Globe2,
} from "lucide-react";
import { CronExpressionParser } from "cron-parser";

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
  timezone: string;
  onTimezoneChange: (tz: string) => void;
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

// Curated common IANA timezones. The user can also paste any IANA name into the input.
const COMMON_TZS = [
  "UTC",
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Madrid",
  "Europe/Istanbul", "Africa/Cairo", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Bangkok", "Asia/Singapore",
  "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland",
];

function browserTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
}

function computeNextRuns(cron: string, tz: string, count = 3): { ok: true; runs: Date[] } | { ok: false; error: string } {
  if (!cron.trim()) return { ok: false, error: "Enter a cron expression to preview next runs." };
  try {
    const it = CronExpressionParser.parse(cron, { tz, currentDate: new Date() });
    const runs: Date[] = [];
    for (let i = 0; i < count; i++) runs.push(it.next().toDate());
    return { ok: true, runs };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid cron expression" };
  }
}

function formatInTz(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz, weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function relativeFromNow(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return "in <1 min";
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `in ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `in ${days} d`;
}

function SchedulePanel({ schedule, onScheduleChange, timezone, onTimezoneChange, isActive, onToggleActive, toggling }: Props) {
  const preview = useMemo(() => computeNextRuns(schedule, timezone, 3), [schedule, timezone]);
  const tzList = useMemo(() => {
    const browser = browserTz();
    const set = new Set<string>([browser, ...COMMON_TZS]);
    return Array.from(set);
  }, []);

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

      <div className="mt-4 space-y-4">
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

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Cron expression</label>
            <input
              value={schedule}
              onChange={(e) => onScheduleChange(e.target.value)}
              placeholder="0 9 * * 1-5"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium flex items-center gap-1">
              <Globe2 className="h-3 w-3" /> Timezone
            </label>
            <input
              list="wf-tz-list"
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              placeholder="UTC"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <datalist id="wf-tz-list">
              {tzList.map((tz) => <option key={tz} value={tz} />)}
            </datalist>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">IANA zone. Defaults from your browser.</p>
              {timezone !== browserTz() && (
                <button
                  type="button"
                  onClick={() => onTimezoneChange(browserTz())}
                  className="text-[11px] text-foreground/80 hover:underline"
                >
                  Use {browserTz()}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Next runs</p>
          {preview.ok ? (
            <ul className="space-y-1.5 text-sm">
              {preview.runs.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">{formatInTz(d, timezone)}</span>
                  <span className="text-[11px] text-muted-foreground">{relativeFromNow(d)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-destructive">{preview.error}</p>
          )}
          {preview.ok && !isActive && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              These are previews — enable the schedule below for runs to fire.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {isActive ? "This schedule is live." : "Schedule is paused — no runs will be triggered."}
          </p>
          <button
            onClick={onToggleActive}
            disabled={toggling || !preview.ok}
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
