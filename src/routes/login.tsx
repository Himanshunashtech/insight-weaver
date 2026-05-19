import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading]);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/app" });
  };

  const onGoogle = async () => {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (r.error) {
      setBusy(false);
      toast.error(r.error.message ?? "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-ink text-cream">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 rounded-full bg-gradient-flame" />
          <span className="text-lg font-semibold">Sola</span>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">The agentic automation platform</h2>
          <p className="mt-3 text-cream/70 max-w-md">Sign in to orchestrate intelligent workflows across your stack.</p>
        </div>
        <p className="text-xs text-cream/50">© Sola. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace.</p>

          <button
            onClick={onGoogle}
            disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onEmail} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Password</label>
                <Link to="/reset-password" className="text-xs underline text-muted-foreground">Forgot?</Link>
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <button disabled={busy} className="w-full rounded-full bg-foreground text-background py-2.5 text-sm font-medium hover:bg-foreground/90 transition disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New to Sola? <Link to="/signup" className="text-foreground underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.4-1.05 2.6-2.16 3.41v2.85h3.49c2.04-1.89 3.69-4.69 3.69-8.5z"/><path fill="#34A853" d="M12 24c2.91 0 5.34-.96 7.12-2.6l-3.49-2.85c-.96.64-2.21 1.03-3.63 1.03-2.79 0-5.16-1.88-6.01-4.41H2.41v2.77C4.18 21.12 7.76 24 12 24z"/><path fill="#FBBC05" d="M5.99 14.17a7.2 7.2 0 010-4.6V6.8H2.41a12 12 0 000 10.4l3.58-3.03z"/><path fill="#EA4335" d="M12 4.75c1.57 0 2.99.54 4.1 1.61l3.08-3.08C17.34 1.45 14.91.5 12 .5 7.76.5 4.18 3.38 2.41 6.8l3.58 2.77C6.84 7.13 9.21 4.75 12 4.75z"/></svg>
  );
}
