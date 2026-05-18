import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const nav = [
  { to: "/product", label: "Product" },
  { to: "/industries", label: "Industries" },
  { to: "/solutions", label: "Solutions" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/customers", label: "Customers" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border/60">
      <div className="container-x mx-auto max-w-7xl flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 rounded-full bg-gradient-flame" />
          <span className="text-lg font-semibold tracking-tight">Sola</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-foreground/75 hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" className="text-sm text-foreground/80 hover:text-foreground px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-full bg-foreground text-background text-sm font-medium px-4 py-2 hover:bg-foreground/90 transition-colors"
          >
            Book a demo
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container-x mx-auto max-w-7xl py-3 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-foreground/80"
              >
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 text-center py-2 rounded-full border border-border">Sign in</Link>
              <Link to="/contact" className="flex-1 text-center py-2 rounded-full bg-foreground text-background">Book a demo</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
