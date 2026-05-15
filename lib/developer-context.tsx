"use client";

/**
 * lib/developer-context.tsx
 *
 * Fetches the logged-in developer's developer_accounts row once
 * and shares it across the entire portal via React context.
 * Wrap the developer layout with <DeveloperProvider>.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface DeveloperAccount {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "pending";
  tier: "read" | "signal" | "build";
  api_key_count: number;
  api_calls_30d: number;
  last_active_at: string | null;
  created_at: string;
  company: string | null;
  website: string | null;
  preferred_environment: "test" | "live";
  production_access: "none" | "pending" | "approved";
}

interface DeveloperContextValue {
  account: DeveloperAccount | null;
  loading: boolean;
  /** Call after mutating the row so consumers get fresh data */
  refresh: () => Promise<void>;
}

const DeveloperContext = createContext<DeveloperContextValue>({
  account: null,
  loading: true,
  refresh: async () => {},
});

export function DeveloperProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<DeveloperAccount | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("developer_accounts")
        .select("id, name, email, status, tier, api_key_count, api_calls_30d, last_active_at, created_at, company, website, preferred_environment, production_access")
        .eq("id", user.id)
        .maybeSingle();

      setAccount(data ?? null);
    } catch (err) {
      console.error("[developer-context] failed to load account:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <DeveloperContext.Provider value={{ account, loading, refresh: load }}>
      {children}
    </DeveloperContext.Provider>
  );
}

export function useDeveloperAccount() {
  return useContext(DeveloperContext);
}
