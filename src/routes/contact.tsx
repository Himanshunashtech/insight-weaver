import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Sola" },
      { name: "description", content: "Book a demo or talk to our team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-5xl pt-20 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Contact</div>
          <h1 className="mt-3 text-5xl font-semibold tracking-tighter">Let's talk.</h1>
          <p className="mt-4 text-muted-foreground">
            Tell us about your team and the workflows you'd like to automate. We'll get back to you within one business day.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4" /> hello@sola.ai</div>
            <div className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> Live chat — Mon–Fri</div>
          </div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="rounded-3xl bg-card border border-border/60 p-8 shadow-card space-y-4"
        >
          {sent ? (
            <div className="text-center py-10">
              <h2 className="text-2xl font-semibold tracking-tight">Thanks — we'll be in touch.</h2>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">First name</span>
                  <input required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Last name</span>
                  <input required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">Work email</span>
                <input required type="email" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Company</span>
                <input required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">What would you like to automate?</span>
                <textarea rows={4} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <button type="submit" className="w-full rounded-full bg-foreground text-background px-4 py-3 font-medium">
                Request a demo
              </button>
            </>
          )}
        </form>
      </section>
    </MarketingShell>
  );
}
