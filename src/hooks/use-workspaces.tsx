import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type WorkspaceCtx = {
  workspaces: Workspace[];
  current: Workspace | null;
  setCurrentId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<WorkspaceCtx>({
  workspaces: [],
  current: null,
  setCurrentId: () => {},
  loading: true,
  refresh: async () => {},
});

const STORAGE_KEY = "sola.current_workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, _setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentId = (id: string) => {
    _setCurrentId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const load = async () => {
    if (!user) {
      setWorkspaces([]);
      _setCurrentId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, slug, logo_url")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setWorkspaces(data);
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const pick = data.find((w) => w.id === stored) ?? data[0];
      if (pick) _setCurrentId(pick.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  return (
    <Ctx.Provider
      value={{
        workspaces,
        current: workspaces.find((w) => w.id === currentId) ?? null,
        setCurrentId,
        loading,
        refresh: load,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useWorkspaces = () => useContext(Ctx);
