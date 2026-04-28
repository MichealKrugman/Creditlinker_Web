'use client';

/**
 * lib/session-context.tsx
 *
 * Global session context — sits at the root layout and is available
 * everywhere in the app. Holds the authenticated Supabase user.
 *
 * What it provides:
 *   user          — the logged-in user (id, email, full_name, account_type)
 *   loading       — true while the initial session check is running
 *   refreshSession — call this after profile updates to re-sync
 *
 * Components read this with: const { user } = useSession()
 * AuthGuard still handles redirect logic — this context just shares data.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from './supabase';
import type { AccountType } from './auth';

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  accountType: AccountType;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

/* ─────────────────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────────────────── */
const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refreshSession: async () => {},
});

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

/* ─────────────────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────────────────── */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    const meta = session.user.user_metadata ?? {};
    const fullName: string = meta.full_name ?? session.user.email ?? 'User';

    setUser({
      id: session.user.id,
      email: session.user.email ?? '',
      fullName,
      initials: getInitials(fullName),
      accountType: (meta.account_type as AccountType) ?? 'business',
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    buildUser();

    // Keep session in sync when the user signs in/out in another tab,
    // or when the JWT is refreshed automatically by Supabase.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      buildUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [buildUser]);

  return (
    <SessionContext.Provider
      value={{ user, loading, refreshSession: buildUser }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────── */
export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
