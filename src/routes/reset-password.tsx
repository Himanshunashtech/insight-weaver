import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
});

function ResetPage() {
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("set");
    }
  }, []);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reset link sent. Check your email.");
  };

  const onSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <span className="inline-flex h-7 w-7 rounded-full bg-gradient-flame" />
          <span className="text-lg font-semibold">Sola</span>
        </Link>
        {mode === "request" ? (
          <>
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
            <form onSubmit={onRequest} className="mt-6 space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button disabled={busy} className="w-full rounded-full bg-foreground text-background py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Set a new password</h1>
            <form onSubmit={onSet} className="mt-6 space-y-3">
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button disabled={busy} className="w-full rounded-full bg-foreground text-background py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/login" className="underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
