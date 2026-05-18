import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/series-a-announcement")({
  head: () => ({
    meta: [
      { title: "Sola raises $17M Series A from a16z" },
      { name: "description", content: "We raised $17 million in Series A funding to bring agentic automation to every team." },
    ],
  }),
  component: AnnouncementPage,
});

function AnnouncementPage() {
  return (
    <MarketingShell>
      <article className="container-x mx-auto max-w-3xl pt-20 pb-24">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Announcement</div>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tighter">
          Sola raises $17M Series A from a16z.
        </h1>
        <div className="mt-6 text-muted-foreground">By the Sola team</div>
        <div className="mt-10 space-y-6 text-lg text-foreground/85 leading-relaxed">
          <p>
            Today we're announcing $17 million in Series A funding led by Andreessen Horowitz to
            accelerate our mission of bringing agentic automation to every team.
          </p>
          <p>
            Sola is the only automation platform that combines no-code visual workflow generation,
            adaptive RPA, AI document processing, and enterprise orchestration in a single product.
            Our customers — from Morgan & Morgan to Ally Logistics — are using Sola to turn weeks
            of manual back-office work into minutes of automated processing.
          </p>
          <p>
            With this funding, we're investing in our agentic engine, expanding integrations, and
            hiring across engineering, design, and go-to-market. If you'd like to be part of what
            we're building, we'd love to hear from you.
          </p>
        </div>
        <div className="mt-12">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 font-medium">
            Talk to us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </MarketingShell>
  );
}
