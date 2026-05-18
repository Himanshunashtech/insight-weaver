import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Sola" },
      { name: "description", content: "How leading teams use Sola to automate their most important workflows." },
    ],
  }),
  component: CustomersPage,
});

const stories = [
  { name: "Morgan & Morgan", role: "Legal operations", quote: "Sola makes automation accessible. With Sola, our legal operations team can create bots without needing developers. It's truly gamechanging.", author: "Michael Frederickson, Director of Project Management" },
  { name: "Ally Logistics", role: "Logistics", quote: "Sola is quite possibly the most flexible and powerful process automation tool I've ever come across.", author: "Dan Manshaem, CEO" },
];

function CustomersPage() {
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-16">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Customers</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter max-w-3xl">
          Leading teams ship faster with Sola.
        </h1>
      </section>
      <section className="container-x mx-auto max-w-7xl pb-24 grid grid-cols-1 md:grid-cols-2 gap-5">
        {stories.map((s) => (
          <div key={s.name} className="rounded-3xl bg-card border border-border/60 p-8 shadow-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.role}</div>
            <div className="text-xl font-semibold mt-1">{s.name}</div>
            <blockquote className="mt-6 text-xl tracking-tight leading-snug">"{s.quote}"</blockquote>
            <div className="mt-6 text-sm text-muted-foreground">{s.author}</div>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
