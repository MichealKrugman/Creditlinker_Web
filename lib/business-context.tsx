'use client';

/**
 * lib/business-context.tsx
 *
 * Provides the active business and all businesses owned by the logged-in user.
 * Reads real data from the `businesses` table via Supabase.
 *
 * What it provides:
 *   currentUser     — from SessionContext (real Supabase auth user)
 *   memberships     — all businesses where owner_id = current user's id
 *   activeBusiness  — the business currently selected
 *   switchBusiness  — change the active business, persisted in localStorage
 *   isSwitching     — true briefly during a switch (for loading UI)
 *   isLoading       — true while businesses are being fetched on mount
 *   error           — set if the Supabase query fails
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from './supabase';
import { useSession } from './session-context';

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
export type BusinessRole   = 'owner' | 'admin' | 'viewer';
export type SetupStage     = 'complete' | 'data_pending' | 'fresh';
export type KycStatus      = 'unverified' | 'pending' | 'verified' | 'flagged';
export type ProfileStatus  = 'incomplete' | 'building' | 'active' | 'stale';

export interface BusinessMembership {
  business_id:             string;
  persistent_business_id:  string;
  financial_identity_id:   string;
  creditlinker_id:         string;
  name:                    string;
  shortName:               string;
  sector:                  string | null;
  registration_number:     string | null;
  profile_status:          ProfileStatus;
  kyc_status:              KycStatus;
  open_to_financing:       boolean;
  selected_capital_categories: string[];
  tier:                    string;
  cl_score?:               number;
  role:                    BusinessRole;
  initials:                string;
  avatarGradient:          string;
  setup_stage:             SetupStage;
  created_at:              string;
  last_synced_at:          string | null;
  data_coverage_start:     string | null;
  data_coverage_end:       string | null;
  branch_count:            number;
  last_active:             string;
  address?:                string | null;
}

export interface CurrentUser {
  user_id:   string;
  full_name: string;
  email:     string;
  initials:  string;
}

interface BusinessContextValue {
  currentUser:    CurrentUser;
  memberships:    BusinessMembership[];
  activeBusiness: BusinessMembership | null;
  switchBusiness: (businessId: string) => Promise<void>;
  isSwitching:    boolean;
  isLoading:      boolean;
  error:          string | null;
  refetch:        () => Promise<void>;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const LS_KEY = 'cl_active_business_id';

// Deterministic avatar gradient based on business id
const GRADIENTS = [
  'linear-gradient(135deg, #0A2540, #1a3a5c)',
  'linear-gradient(135deg, #065f46, #047857)',
  'linear-gradient(135deg, #7c2d12, #9a3412)',
  'linear-gradient(135deg, #1e1b4b, #3730a3)',
  'linear-gradient(135deg, #701a75, #a21caf)',
  'linear-gradient(135deg, #0c4a6e, #0369a1)',
];

function pickGradient(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

function formatRelative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (minutes < 2)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  if (days    < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function deriveSetupStage(b: {
  kyc_status: KycStatus;
  profile_status: ProfileStatus;
  last_synced_at: string | null;
}): SetupStage {
  if (b.profile_status === 'active' && b.kyc_status === 'verified') return 'complete';
  if (b.last_synced_at) return 'data_pending';
  return 'fresh';
}

// Map a raw Supabase row into our BusinessMembership shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): BusinessMembership {
  return {
    business_id:             row.business_id,
    persistent_business_id:  row.persistent_business_id,
    financial_identity_id:   row.financial_identity_id,
    creditlinker_id:         row.creditlinker_id,
    name:                    row.name,
    shortName:               row.name.split(' ').slice(0, 2).join(' '),
    sector:                  row.sector ?? null,
    registration_number:     row.registration_number ?? null,
    profile_status:          row.profile_status as ProfileStatus,
    kyc_status:              row.kyc_status as KycStatus,
    open_to_financing:       row.open_to_financing,
    selected_capital_categories: row.selected_capital_categories ?? [],
    tier:                    row.tier,
    cl_score:                undefined, // fetched separately from creditlinker_scores
    role:                    'owner',   // MVP: only owners can register businesses
    initials:                getInitials(row.name),
    avatarGradient:          pickGradient(row.business_id),
    setup_stage:             deriveSetupStage({
      kyc_status:     row.kyc_status,
      profile_status: row.profile_status,
      last_synced_at: row.last_synced_at,
    }),
    created_at:          row.created_at,
    last_synced_at:      row.last_synced_at ?? null,
    data_coverage_start: row.data_coverage_start ?? null,
    data_coverage_end:   row.data_coverage_end ?? null,
    // enriched after the parallel fetch below
    branch_count: 0,
    last_active:  row.last_synced_at ? formatRelative(row.last_synced_at) : 'Never synced',
  };
}

/* ─────────────────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────────────────── */
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();

  const [memberships,  setMemberships]  = useState<BusinessMembership[]>([]);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [isSwitching,  setIsSwitching]  = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    // Read session directly — don't depend on SessionContext timing
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setMemberships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('[BusinessContext] fetching for userId:', userId);

    const { data, error: dbError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });

    console.log('[BusinessContext] result:', { data, error: dbError });

    if (dbError) {
      setError('Failed to load your businesses. Please refresh.');
      setIsLoading(false);
      return;
    }

    const mapped = (data ?? []).map(mapRow);

    // Enrich with branch counts and latest CL score in parallel
    const ids = mapped.map((m) => m.business_id);
    const [branchRes, scoreRes] = await Promise.all([
      ids.length > 0
        ? supabase.from('branches').select('business_id').in('business_id', ids)
        : Promise.resolve({ data: [], error: null }),
      ids.length > 0
        ? supabase
            .from('creditlinker_scores')
            .select('business_id, composite_score, computed_at')
            .in('business_id', ids)
            .order('computed_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const branchMap: Record<string, number> = {};
    for (const row of branchRes.data ?? []) {
      branchMap[row.business_id] = (branchMap[row.business_id] ?? 0) + 1;
    }

    // Keep only the latest score per business (rows already ordered desc)
    const scoreMap: Record<string, number> = {};
    for (const row of scoreRes.data ?? []) {
      if (scoreMap[row.business_id] === undefined && row.composite_score != null) {
        scoreMap[row.business_id] = row.composite_score;
      }
    }

    const enriched = mapped.map((m) => ({
      ...m,
      branch_count: branchMap[m.business_id] ?? 0,
      cl_score:     scoreMap[m.business_id],
    }));

    setMemberships(enriched);

    // Restore the previously active business from localStorage, or default to first
    const stored = localStorage.getItem(LS_KEY);
    const valid  = enriched.find((m) => m.business_id === stored);
    setActiveId(valid ? valid.business_id : (enriched[0]?.business_id ?? null));

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const activeBusiness = memberships.find((m) => m.business_id === activeId) ?? null;

  const switchBusiness = useCallback(async (businessId: string) => {
    if (businessId === activeId) return;
    setIsSwitching(true);
    localStorage.setItem(LS_KEY, businessId);
    setActiveId(businessId);
    // Small delay so any loading spinners in child components feel intentional
    await new Promise((r) => setTimeout(r, 200));
    setIsSwitching(false);
  }, [activeId]);

  // Build the currentUser shape from SessionContext so the rest of the
  // codebase can use useActiveBusiness().currentUser as before
  const currentUser: CurrentUser = user
    ? {
        user_id:   user.id,
        full_name: user.fullName,
        email:     user.email,
        initials:  user.initials,
      }
    : {
        user_id:   '',
        full_name: '',
        email:     '',
        initials:  '',
      };

  return (
    <BusinessContext.Provider
      value={{
        currentUser,
        memberships,
        activeBusiness,
        switchBusiness,
        isSwitching,
        isLoading,
        error,
        refetch: fetchBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────── */
export function useActiveBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useActiveBusiness must be used inside <BusinessProvider>');
  return ctx;
}
