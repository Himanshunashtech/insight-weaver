import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ArrowRight, Check } from "lucide-react";

type Detail = { title: string; tagline: string; useCases: { title: string; body: string }[] };

const DATA: Record<string, Detail> = {
  bfsi: {
    title: "Banking, Financial Services & Insurance",
    tagline: "Automate the workflows that keep money moving — accurately and at scale.",
    useCases: [
      { title: "Customer onboarding & KYC", body: "Automate identity checks, document processing, and system entries across banking, investment, and insurance products." },
      { title: "Claims, loans & application processing", body: "Accelerate reviews, validations, and approvals by automating intake, cross-system data extraction, and decision logic." },
      { title: "Payment processing & reconciliation", body: "Streamline handling of payment requests, transaction verification, and account reconciliation." },
      { title: "Fraud detection & prevention", body: "Collect, enrich, and escalate flagged transactions across payment, investment, and policy systems." },
      { title: "Regulatory compliance & reporting", body: "Automate data gathering, validation, and report generation to ensure compliance." },
    ],
  },
  healthcare: {
    title: "Healthcare",
    tagline: "Cut administrative load so clinical teams can focus on patients.",
    useCases: [
      { title: "Medical billing", body: "Connect disparate systems and reduce manual data handling for invoicing and payment tracking." },
      { title: "Patient registration & scheduling", body: "Automate form intake, insurance checks, and booking." },
      { title: "Insurance claims processing", body: "Validate and process claims by extracting data and verifying coverage." },
      { title: "Records management", body: "Update EHRs, organize patient files, and ensure data accuracy." },
      { title: "Inventory & supply chain", body: "Track supplies, manage orders, and handle restocking automatically." },
    ],
  },
  logistics: {
    title: "Transportation & Logistics",
    tagline: "Integrate brokers, carriers, and 3PLs into one continuous flow.",
    useCases: [
      { title: "Logistics operations", body: "Automate repetitive back-office processes across the supply chain." },
      { title: "Invoice & payment processing", body: "AP, AR, and cash application — fewer errors, faster cycles." },
      { title: "Status updates", body: "Real-time tracking and customer notifications across platforms." },
      { title: "Documentation & customs", body: "Generate and verify BOLs, customs declarations, and required documents." },
      { title: "Quote & rate management", body: "Auto-fetch and compare carrier rates, manage quotes, update pricing." },
    ],
  },
  legal: {
    title: "Legal, Compliance & Government",
    tagline: "Move filings, records, and reports without the manual handoffs.",
    useCases: [
      { title: "Filings & submissions", body: "Populate forms, gather documents, track submissions across courts and agencies." },
      { title: "Case retrieval & updates", body: "Extract case details and keep records accurate and timely." },
      { title: "Regulatory reporting & auditing", body: "Consolidate data into compliance reports with full audit trails." },
      { title: "Payment & fee processing", body: "Automate fee calculation, payments, and reconciliation for licenses and filings." },
      { title: "License & permit management", body: "Automate applications, renewals, and approvals." },
    ],
  },
  manufacturing: {
    title: "Manufacturing",
    tagline: "Connect the shop floor to the back office.",
    useCases: [
      { title: "Inventory & supply chain", body: "Automate stock checks, order triggers, and supplier communications." },
      { title: "Production scheduling", body: "Consolidate data to schedule runs and surface real-time status." },
      { title: "Quality control & compliance", body: "Capture inspection data, identify defects, generate compliance docs." },
      { title: "Procurement & supplier onboarding", body: "Streamline vendor selection, contract processing, and evaluations." },
      { title: "Regulatory & safety reporting", body: "Compile safety logs and compliance records for audits." },
    ],
  },
  "real-estate": {
    title: "Real Estate",
    tagline: "Operate properties and portfolios with less manual work.",
    useCases: [
      { title: "Lease processing", body: "Automate document review, approvals, and signature workflows." },
      { title: "Tenant onboarding", body: "Verify identities, screen applications, and create records." },
      { title: "Payments & reconciliation", body: "Match incoming payments to leases and surface exceptions." },
      { title: "Maintenance routing", body: "Triage and dispatch tickets automatically." },
      { title: "Portfolio reporting", body: "Pull data from PMS, accounting, and CRM into unified reports." },
    ],
  },
};

export const Route = createFileRoute("/industries/$slug")({
  loader: ({ params }) => {
    const d = DATA[params.slug];
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Sola` },
          { name: "description", content: loaderData.tagline },
          { property: "og:title", content: `${loaderData.title} — Sola` },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <MarketingShell>
      <div className="container-x mx-auto max-w-7xl py-32 text-center">
        <h1 className="text-3xl font-semibold">Industry not found</h1>
        <Link to="/industries" className="mt-4 inline-block underline">Back to industries</Link>
      </div>
    </MarketingShell>
  ),
  errorComponent: ({ error }) => (
    <MarketingShell>
      <div className="container-x mx-auto max-w-7xl py-32 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">{error.message}</p>
      </div>
    </MarketingShell>
  ),
  component: IndustryPage,
});

function IndustryPage() {
  const data = Route.useLoaderData();
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-16">
        <Link to="/industries" className="text-sm text-muted-foreground hover:text-foreground">← All industries</Link>
        <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tighter max-w-3xl">{data.title}</h1>
        <p className="mt-6 text-lg text-foreground/70 max-w-2xl">{data.tagline}</p>
      </section>
      <section className="container-x mx-auto max-w-7xl pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.useCases.map((u: { title: string; body: string }) => (
            <div key={u.title} className="rounded-3xl bg-card border border-border/60 p-7 shadow-card">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-flame text-white inline-flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{u.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex gap-3">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 font-medium">
            Book a demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
