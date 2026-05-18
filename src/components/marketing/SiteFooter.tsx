import { Link } from "@tanstack/react-router";

const cols = [
  {
    title: "Product",
    links: [
      { to: "/product", label: "Overview" },
      { to: "/product", label: "Robotic Process Automation" },
      { to: "/product", label: "Document Processing" },
      { to: "/product", label: "Orchestration" },
      { to: "/product", label: "Data Transformation" },
    ],
  },
  {
    title: "Industries",
    links: [
      { to: "/industries/bfsi", label: "Banking & Insurance" },
      { to: "/industries/healthcare", label: "Healthcare" },
      { to: "/industries/logistics", label: "Logistics" },
      { to: "/industries/legal", label: "Legal & Government" },
      { to: "/industries/manufacturing", label: "Manufacturing" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/customers", label: "Customers" },
      { to: "/series-a-announcement", label: "Series A" },
      { to: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[color:var(--ink)] text-[color:var(--cream)]">
      <div className="container-x mx-auto max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 rounded-full bg-gradient-flame" />
              <span className="text-lg font-semibold tracking-tight">Sola</span>
            </Link>
            <p className="mt-4 text-sm text-[color:var(--cream)]/70 max-w-sm">
              The agentic automation platform. From screen to bot in minutes — built for the teams who run the work.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center rounded-full bg-[color:var(--cream)] text-[color:var(--ink)] text-sm font-medium px-4 py-2 hover:bg-[color:var(--cream)]/90"
            >
              Book a demo
            </Link>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <div className="text-xs uppercase tracking-wider text-[color:var(--cream)]/60">{c.title}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[color:var(--cream)]/85 hover:text-[color:var(--cream)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[color:var(--cream)]/60">
          <div>© {new Date().getFullYear()} Sola Solutions, Inc. All rights reserved.</div>
          <div className="flex gap-5">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
