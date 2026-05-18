import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Workflow, FileText, LayoutDashboard, Zap, Shield, Repeat, MousePointerClick, Bot } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import heroImg from "@/assets/hero-workflow.jpg";
import featRecorder from "@/assets/feature-recorder.jpg";
import featDocs from "@/assets/feature-documents.jpg";
import featOrch from "@/assets/feature-orchestration.jpg";
import featData from "@/assets/feature-data.jpg";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sola — The agentic automation platform" },
      { name: "description", content: "From screen recording to a fully automated workflow in minutes. Sola brings intelligent, context-aware automation to repetitive enterprise work." },
      { property: "og:title", content: "Sola — The agentic automation platform" },
      { property: "og:description", content: "From screen recording to a fully automated workflow in minutes." },
    ],
  }),
  component: HomePage,
});

const logos = ["kintsugi", "morgan & morgan", "ally logistics", "KCH", "Chapter", "Armstrong", "firstbase", "dart"];

const whyCards = [
  { icon: Zap, title: "Fastest time-to-value", body: "From screen recording to a fully automated workflow in minutes — instant impact and ROI with Sola." },
  { icon: Repeat, title: "Flexible automations", body: "Lower build and maintenance time with bots you can trust. Sola adapts to your business over time." },
  { icon: MousePointerClick, title: "Intuitive tooling", body: "Sola's no-code visual approach brings business users directly to the tool — build, edit, maintain." },
  { icon: Bot, title: "Agentic engine", body: "More than a sequence of actions — Sola learns, decides, and self-optimizes in real time." },
];

const capabilities = [
  { title: "AI-Powered Workflow Generation", desc: "Sola transforms recorded actions directly into fully functional bots. LLMs and computer vision interpret user behavior to generate enterprise workflows in real time.", img: featRecorder },
  { title: "Adaptive Automations", desc: "Workflows adapt dynamically to changing conditions. Real-time error handling learns from feedback and stays resilient to minor UI changes.", img: featData },
  { title: "Powerful Integrations", desc: "Connect data, trigger actions, and maintain continuity across systems. Pre-configured actions and custom connections fit seamlessly into your environment.", img: featOrch },
  { title: "Visual Workflow Editor", desc: "Design automations with clarity using Sola's intuitive editor. Every step, action, and integration in a clean interface built for collaboration.", img: featOrch },
  { title: "Transparent Monitoring", desc: "Track every automation with full visibility — what ran, when, and the outcome of each step. Real-time logs and detailed audit trails.", img: featOrch },
  { title: "API Support", desc: "Robust developer tools for seamless integration. Workflows are composable — triggered via API and capable of calling internal or external services.", img: featData },
];

const industries = [
  { slug: "bfsi", title: "Banking, Financial Services & Insurance", body: "Automate data entry, compliance checks, and transaction processing across banking, insurance, and financial services." },
  { slug: "healthcare", title: "Healthcare", body: "Automate patient intake, claims processing, and data entry to reduce admin workload and improve accuracy." },
  { slug: "logistics", title: "Transportation & Logistics", body: "Automate back-office workflows across brokers, carriers, and 3PLs to boost speed and accuracy." },
  { slug: "legal", title: "Legal, Compliance & Government", body: "Automate case management, document review, and regulatory reporting to reduce manual effort." },
  { slug: "manufacturing", title: "Manufacturing", body: "Streamline inventory, production scheduling, quality control, and supplier onboarding." },
];

const testimonials = [
  { quote: "Sola makes automation accessible. With Sola, our legal operations team can create bots without needing developers. It's truly gamechanging.", name: "Michael Frederickson", title: "Director of Project Management, Morgan & Morgan" },
  { quote: "Sola is quite possibly the most flexible and powerful process automation tool I've ever come across.", name: "Dan Manshaem", title: "CEO, Ally Logistics" },
];

function HomePage() {
  const [tab, setTab] = useState(0);
  const cap = capabilities[tab];

  return (
    <MarketingShell>
      {/* Series A banner */}
      <div className="bg-gradient-banner text-white text-sm">
        <div className="container-x mx-auto max-w-7xl py-2.5 flex items-center justify-center gap-3">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>We raised <strong>$17M</strong> in Series A from <strong>a16z</strong></span>
          <Link to="/series-a-announcement" className="underline underline-offset-4 hidden sm:inline-flex items-center gap-1">
            Read more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" width={1600} height={1200} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="relative container-x mx-auto max-w-7xl pt-20 pb-28 md:pt-28 md:pb-36 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-[color:var(--ink)] max-w-4xl mx-auto">
            The agentic automation platform.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            From screen recording to a fully automated workflow in minutes. Intelligent, context-aware automation for the work that runs your business.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 font-medium hover:bg-foreground/90 transition">
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/product" className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/60 backdrop-blur px-5 py-3 font-medium hover:bg-background transition">
              Explore the product
            </Link>
          </div>
        </div>
      </section>

      {/* Logo wall */}
      <section className="border-y border-border/60 bg-background">
        <div className="container-x mx-auto max-w-7xl py-10">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by leading companies</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6 items-center">
            {logos.map((name) => (
              <div key={name} className="text-center text-foreground/55 font-medium text-sm capitalize tracking-wide">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Sola */}
      <section className="container-x mx-auto max-w-7xl py-24">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Why Sola</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tighter">
            Intelligent automation for repetitive work — fast, flexible, and built to last.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyCards.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl bg-card p-6 shadow-card border border-border/50">
              <div className="h-10 w-10 rounded-2xl bg-gradient-flame text-white inline-flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities tabs */}
      <section className="bg-[color:var(--sand)]/40 border-y border-border/50">
        <div className="container-x mx-auto max-w-7xl py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Capabilities</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tighter">
              Automation that works the way you do.
            </h2>
            <p className="mt-4 text-muted-foreground">
              From AI-powered creation to enterprise-grade control, Sola transforms how automation gets done.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-2">
              {capabilities.map((c, i) => (
                <button
                  key={c.title}
                  onClick={() => setTab(i)}
                  className={`w-full text-left rounded-2xl p-4 transition border ${i === tab ? "bg-card border-border shadow-card" : "border-transparent hover:bg-card/60"}`}
                >
                  <div className={`font-semibold ${i === tab ? "text-foreground" : "text-foreground/70"}`}>{c.title}</div>
                  {i === tab && <div className="mt-2 text-sm text-muted-foreground">{c.desc}</div>}
                </button>
              ))}
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-card border border-border shadow-lift overflow-hidden aspect-[4/3]">
                <img src={cap.img} alt="" className="w-full h-full object-cover" width={1200} height={900} loading="lazy" />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link to="/product" className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
              View all product features <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Product pillars grid */}
      <section className="container-x mx-auto max-w-7xl py-24">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Product</div>
        <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tighter max-w-3xl">
          A unified platform built with the tools modern teams need.
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Workflow, title: "Robotic Process Automation", body: "Sola bots visually interact with screens and applications across browser and desktop, replicating user behavior to automate workflows at the UI level.", img: featRecorder },
            { icon: FileText, title: "Document Processing", body: "AI-powered document understanding. Extract, validate, and structure data from documents — streamlining manual work.", img: featDocs },
            { icon: LayoutDashboard, title: "Orchestration", body: "Run and manage automations with confidence. Real-time visibility, audit trails, and centralized oversight.", img: featOrch },
            { icon: Shield, title: "Data Transformation", body: "Shape, clean, and prepare data for action. Sola handles inconsistencies so automations stay robust.", img: featData },
          ].map(({ icon: Icon, title, body, img }) => (
            <div key={title} className="rounded-3xl bg-card border border-border/60 overflow-hidden shadow-card flex flex-col">
              <div className="aspect-[16/9] overflow-hidden bg-[color:var(--sand)]">
                <img src={img} alt="" className="w-full h-full object-cover" width={1200} height={900} loading="lazy" />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-2 text-foreground/70">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-widest">{title}</span>
                </div>
                <p className="mt-3 text-foreground/90 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="bg-[color:var(--ink)] text-[color:var(--cream)]">
        <div className="container-x mx-auto max-w-7xl py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-[color:var(--cream)]/60">Industries</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tighter">
              Sola unlocks digital transformation across industries.
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((i) => (
              <Link
                key={i.slug}
                to="/industries/$slug"
                params={{ slug: i.slug }}
                className="group rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 p-7 transition"
              >
                <h3 className="text-xl font-semibold">{i.title}</h3>
                <p className="mt-3 text-sm text-[color:var(--cream)]/75 leading-relaxed">{i.body}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm text-[color:var(--cream)]/85 group-hover:text-[color:var(--cream)]">
                  Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x mx-auto max-w-7xl py-24">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Customer stories</div>
        <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tighter max-w-3xl">
          Teams ship more — with less custom work.
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-3xl bg-card border border-border/60 p-8 shadow-card">
              <blockquote className="text-xl md:text-2xl font-medium tracking-tight leading-snug">"{t.quote}"</blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x mx-auto max-w-7xl pb-24">
        <div className="rounded-[2rem] bg-gradient-flame text-white p-10 md:p-16 text-center shadow-lift overflow-hidden relative">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter max-w-2xl mx-auto">
            Bring agentic automation to your team.
          </h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">
            See Sola in action — record a process and watch it become a working bot in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-white text-[color:var(--ink)] px-5 py-3 font-medium hover:bg-white/90">
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full border border-white/40 text-white px-5 py-3 font-medium hover:bg-white/10">
              Start free
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
