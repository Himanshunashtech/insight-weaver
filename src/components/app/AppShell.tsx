import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, Workflow, PlayCircle, FileText, Plug,
  KeyRound, Users, Settings, Search, Bell, LogOut, ChevronDown, Check, Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/workflows", label: "Workflows", icon: Workflow },
  { to: "/app/runs", label: "Runs", icon: PlayCircle },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/integrations", label: "Integrations", icon: Plug },
  { to: "/app/api", label: "API & Webhooks", icon: KeyRound },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <Link to="/app" className="h-14 flex items-center gap-2 px-5 border-b border-border">
          <span className="inline-flex h-7 w-7 rounded-full bg-gradient-flame" />
          <span className="text-base font-semibold tracking-tight">Sola</span>
        </Link>
        <WorkspacePicker />
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-foreground text-background" : "text-foreground/75 hover:bg-muted"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-border text-xs text-muted-foreground">
          v0.1 · web/API runtime
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function WorkspacePicker() {
  const { workspaces, current, setCurrentId } = useWorkspaces();
  return (
    <div className="px-3 py-3 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-6 w-6 rounded-md bg-gradient-flame items-center justify-center text-[10px] text-white font-semibold shrink-0">
              {current?.name?.[0]?.toUpperCase() ?? "·"}
            </span>
            <span className="truncate font-medium">{current?.name ?? "Workspace"}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => setCurrentId(w.id)} className="flex items-center justify-between">
              <span className="truncate">{w.name}</span>
              {current?.id === w.id && <Check className="h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <CreateWorkspaceDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="h-3.5 w-3.5 mr-2" /> Create workspace
            </DropdownMenuItem>
          </CreateWorkspaceDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function TopBar() {
  const { user, signOut } = useAuth();
  return (
    <header className="h-14 flex items-center gap-3 px-5 border-b border-border bg-background/85 backdrop-blur sticky top-0 z-30">
      <div className="flex-1 max-w-md relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search workflows, runs, docs…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
      <button className="p-2 rounded-lg hover:bg-muted transition" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition">
          <span className="inline-flex h-7 w-7 rounded-full bg-foreground text-background items-center justify-center text-xs font-semibold">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </span>
          <span className="hidden md:inline text-sm max-w-[140px] truncate">{user?.email}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/app/settings"><Settings className="h-3.5 w-3.5 mr-2" /> Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
