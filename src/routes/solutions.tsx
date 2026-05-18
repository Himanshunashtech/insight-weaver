import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { useState } from "react";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — Sola" },
      { name: "description", content: "Use Sola to automate the workflows that matter most to your team." },
    ],
  }),
  component: SolutionsPage,
});

const groups = [
  { id: "ops", label: "Operations", items: ["Order processing", "Inventory reconciliation", "Vendor onboarding", "Status updates"] },
  { id: "finance", label: "Finance", items: ["Invoice processing", "Payment reconciliation", "Expense audit", "Month-end close"] },
  { id: "people", label: "People", items: ["Candidate screening", "Onboarding tasks", "Benefits enrollment", "Compliance training"] },
  { id: "support", label: "Customer", items: ["Ticket triage", "Refund processing", "Account updates", "SLA monitoring"] },
];

function SolutionsPage() {
  const [tab, setTab] = useState(0);
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-12">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Solutions</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter max-w-3xl">
          The workflows your team already runs — only automated.
        </h1>
      </section>
      <section className="container-x mx-auto max-w-7xl pb-24">
        <div className="flex flex-wrap gap-2 border-b border-border">
          {groups.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${i === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups[tab].items.map((item) => (
            <div key={item} className="rounded-3xl bg-card border border-border/60 p-7 shadow-card">
              <h3 className="text-lg font-semibold">{item}</h3>
              <p className="mt-2 text-sm text-muted-foreground">A pre-built workflow template you can customize in the visual editor.</p>
              <Link to="/contact" className="mt-5 inline-block text-sm font-medium underline underline-offset-4">Talk to us</Link>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
