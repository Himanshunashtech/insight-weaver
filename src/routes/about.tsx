import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sola" },
      { name: "description", content: "Sola is building agentic automation for the world's largest enterprises." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <section className="container-x mx-auto max-w-4xl pt-20 pb-24">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">About</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter">
          We're building the automation layer for enterprise work.
        </h1>
        <div className="mt-10 prose prose-lg max-w-none text-foreground/85">
          <p>
            Sola is an agentic automation platform that turns repetitive human work into resilient,
            self-improving software. We believe that every team should be able to build the tools
            that run their business — without waiting on a developer queue.
          </p>
          <p>
            Backed by Andreessen Horowitz, we're a small team of engineers, designers, and
            operators who have built and scaled automation at some of the world's largest companies.
          </p>
          <p>
            We're hiring across engineering, design, and go-to-market. If you want to build the
            future of how work gets done, we'd love to hear from you.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
