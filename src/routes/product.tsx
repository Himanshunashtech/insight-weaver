import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Workflow, FileText, LayoutDashboard, Database, Bot, Network, Eye, Code2 } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import featRecorder from "@/assets/feature-recorder.jpg";
import featDocs from "@/assets/feature-documents.jpg";
import featOrch from "@/assets/feature-orchestration.jpg";
import featData from "@/assets/feature-data.jpg";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Product — Sola" },
      { name: "description", content: "RPA, document processing, orchestration, and data transformation in one unified platform." },
      { property: "og:title", content: "Product — Sola" },
    ],
  }),
  component: ProductPage,
});

const pillars = [
  { icon: Workflow, title: "Robotic Process Automation", body: "Bots that visually interact with browser and desktop applications, replicating user behavior to automate workflows at the UI level.", img: featRecorder },
  { icon: FileText, title: "Document Processing", body: "Extract, validate, and structure data from documents with AI. Streamline manual work and accelerate workflow automation.", img: featDocs },
  { icon: LayoutDashboard, title: "Orchestration", body: "Coordinate automations across teams and systems with real-time visibility, audit trails, and centralized oversight.", img: featOrch },
  { icon: Database, title: "Data Transformation", body: "Shape, clean, and prepare structured and unstructured data within workflows. Handle inconsistencies and complexity.", img: featData },
];

const capabilities = [
  { icon: Bot, title: "AI-Powered Workflow Generation", body: "Recorded actions become fully functional bots — LLMs and computer vision interpret user behavior to generate workflows in real time." },
  { icon: Workflow, title: "Adaptive Automations", body: "Workflows adapt dynamically to changing conditions. Real-time error handling learns from feedback and stays resilient to UI changes." },
  { icon: Network, title: "Powerful Integrations", body: "Pre-configured actions for common platforms, plus custom connections wherever needed." },
  { icon: LayoutDashboard, title: "Visual Workflow Editor", body: "Every step, action, and integration in a clean interface built for both technical and non-technical teams." },
  { icon: Eye, title: "Transparent Monitoring", body: "Real-time logs, detailed audit trails, and full visibility into every run." },
  { icon: Code2, title: "API Support", body: "Composable workflows triggered via API and capable of calling internal or external services." },
];

function ProductPage() {
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-7xl pt-20 pb-16 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Product</div>
        <h1 className="mt-3 text-5xl md:text-7xl font-semibold tracking-tighter max-w-4xl mx-auto">
          One platform. Four pillars. Endless automation.
        </h1>
        <p className="mt-6 text-lg text-foreground/70 max-w-2xl mx-auto">
          Sola unifies RPA, document AI, orchestration, and data transformation so your team can automate any process — and trust it to keep running.
        </p>
      </section>

      <section className="container-x mx-auto max-w-7xl pb-20 space-y-16">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${idx % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div className="lg:col-span-7 rounded-3xl bg-card border border-border/60 overflow-hidden shadow-lift aspect-[16/10]">
                <img src={p.img} alt="" className="w-full h-full object-cover" width={1200} height={900} loading="lazy" />
              </div>
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-flame text-white px-3 py-1 text-xs uppercase tracking-widest">
                  <Icon className="h-3.5 w-3.5" /> Pillar {idx + 1}
                </div>
                <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tighter">{p.title}</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="bg-[color:var(--sand)]/40 border-y border-border/50">
        <div className="container-x mx-auto max-w-7xl py-24">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter max-w-3xl">
            Built for the way modern teams actually work.
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-3xl bg-card border border-border/60 p-7 shadow-card">
                  <div className="h-10 w-10 rounded-2xl bg-foreground text-background inline-flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-x mx-auto max-w-7xl py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter">Ready to see Sola in motion?</h2>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 font-medium">Book a demo <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-medium">See pricing</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
