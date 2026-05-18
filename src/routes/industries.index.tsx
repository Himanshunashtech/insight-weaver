import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/industries/")({
  head: () => ({
    meta: [
      { title: "Industries — Sola" },
      { name: "description", content: "Sola is used across banking, healthcare, logistics, legal, and manufacturing organizations." },
    ],
  }),
  component: IndustriesIndex,
});

const items = [
  { slug: "bfsi", title: "Banking, Financial Services & Insurance", body: "Onboarding, KYC, claims, loans, payments, reconciliation, fraud detection, and regulatory reporting." },
  { slug: "healthcare", title: "Healthcare", body: "Medical billing, patient registration, insurance claims, records management, inventory and supply chain." },
  { slug: "logistics", title: "Transportation & Logistics", body: "Brokerage, AP/AR processing, status updates, documentation and customs, quote and rate management." },
  { slug: "legal", title: "Legal, Compliance & Government", body: "Filings, case retrieval, regulatory reporting, payments, license and permit management." },
  { slug: "manufacturing", title: "Manufacturing", body: "Inventory, production scheduling, quality control, procurement, regulatory and safety reporting." },
  { slug: "real-estate", title: "Real Estate", body: "Lease processing, tenant onboarding, document review, payment reconciliation, and reporting." },
];

function IndustriesIndex() {
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-16">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Industries</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter max-w-3xl">
          Built for the teams who run the work — in any industry.
        </h1>
      </section>
      <section className="container-x mx-auto max-w-7xl pb-24 grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((i) => (
          <Link key={i.slug} to="/industries/$slug" params={{ slug: i.slug }} className="rounded-3xl bg-card border border-border/60 p-8 shadow-card hover:shadow-lift transition group">
            <h2 className="text-2xl font-semibold tracking-tight">{i.title}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{i.body}</p>
            <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium">
              Explore use cases <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </section>
    </MarketingShell>
  );
}
