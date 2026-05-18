import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Sola" },
      { name: "description", content: "Flexible plans for teams of every size." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Starter",
    price: "$0",
    sub: "For trying Sola on a few simple workflows",
    cta: "Start free",
    href: "/signup",
    features: ["Up to 3 active workflows", "100 runs / month", "Visual editor & AI generation", "Community support"],
  },
  {
    name: "Pro",
    price: "$499",
    sub: "/month — for growing automation teams",
    cta: "Start trial",
    href: "/signup",
    highlight: true,
    features: ["Unlimited workflows", "25,000 runs / month", "Document processing", "Scheduled & webhook triggers", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "For mission-critical, high-scale automation",
    cta: "Contact sales",
    href: "/contact",
    features: ["Unlimited runs", "SSO & SAML", "Dedicated CSM", "VPC deployment available", "Custom SLA & audit"],
  },
];

function PricingPage() {
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-12 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Pricing</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter max-w-3xl mx-auto">
          Pay for what you automate.
        </h1>
        <p className="mt-6 text-lg text-foreground/70 max-w-xl mx-auto">
          Start free. Scale as your team builds more.
        </p>
      </section>
      <section className="container-x mx-auto max-w-7xl pb-24 grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-3xl p-8 border ${t.highlight ? "bg-[color:var(--ink)] text-[color:var(--cream)] border-transparent shadow-lift" : "bg-card border-border/60 shadow-card"}`}
          >
            <div className="text-sm font-medium opacity-80">{t.name}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tighter">{t.price}</span>
            </div>
            <p className={`mt-2 text-sm ${t.highlight ? "text-[color:var(--cream)]/70" : "text-muted-foreground"}`}>{t.sub}</p>
            <Link
              to={t.href}
              className={`mt-6 inline-flex w-full justify-center rounded-full px-4 py-2.5 font-medium ${t.highlight ? "bg-[color:var(--cream)] text-[color:var(--ink)]" : "bg-foreground text-background"}`}
            >
              {t.cta}
            </Link>
            <ul className="mt-8 space-y-3 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
