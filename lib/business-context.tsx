'use client';

/**
 * BusinessContext
 * ─────────────────────────────────────────────────────────
 * Implements the two-layer model:
 *
 *   User   → single Keycloak account, owns/belongs to N businesses
 *   Business → each has its own financial data, score, and profile
 *
 * The context provides:
 *   activeBusiness  — the business currently being operated
 *   memberships     — all businesses this user has access to
 *   switchBusiness  — change the active business (updates context + localStorage)
 *   currentUser     — the logged-in human (never changes on switch)
 *
 * In production:
 *   • currentUser is decoded from the Keycloak JWT on the server
 *   • memberships comes from GET /user/businesses
 *   • switchBusiness calls POST /user/active-business { business_id }
 *     then invalidates all data-fetching caches for the new business
 *
 * For the mock:
 *   • We use localStorage to persist the active business across page loads
 *   • Default is 'biz_001' (Aduke Bakeries)
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
export type BusinessRole = 'owner' | 'admin' | 'viewer';
export type SetupStage   = 'complete' | 'data_pending' | 'fresh';

export interface BusinessMembership {
  business_id:  string;
  name:         string;
  shortName:    string;
  sector:       string;
  status:       'registered' | 'unregistered';
  role:         BusinessRole;
  cl_score?:    number;
  initials:     string;
  avatarGradient: string;
  last_active:  string;
  setup_stage:  SetupStage;
  branch_count: number;
  /** Accounts assigned to this business in Data Sources */
  accounts:     string[];
}

export interface CurrentUser {
  user_id:   string;
  full_name: string;
  email:     string;
  initials:  string;
}

interface BusinessContextValue {
  currentUser:     CurrentUser;
  memberships:     BusinessMembership[];
  activeBusiness:  BusinessMembership;
  switchBusiness:  (businessId: string) => Promise<void>;
  isSwitching:     boolean;
}

/* ─────────────────────────────────────────────────────────
   MASTER DATA
   This is the single source of truth for all mock business
   data. Every component in the (business) layout reads from
   this context — never from local hardcoded constants.
───────────────────────────────────────────────────────── */
export const CURRENT_USER: CurrentUser = {
  user_id:   'usr_001',
  full_name: 'Ada Okonkwo',
  email:     'ada@adukebakeries.ng',
  initials:  'AO',
};

export const MEMBERSHIPS: BusinessMembership[] = [
  {
    business_id:    'biz_001',
    name:           'Aduke Bakeries Ltd.',
    shortName:      'Aduke Bakeries',
    sector:         'Food & Beverage Manufacturing',
    status:         'registered',
    role:           'owner',
    cl_score:       742,
    initials:       'AB',
    avatarGradient: 'linear-gradient(135deg, #0A2540, #1a3a5c)',
    last_active:    '2 hours ago',
    setup_stage:    'complete',
    branch_count:   2,
    accounts:       ['Zenith Bank ****4821', 'GTBank ****0034'],
  },
  {
    business_id:    'biz_002',
    name:           'Okonkwo Farms',
    shortName:      'Okonkwo Farms',
    sector:         'Agriculture & Crop Farming',
    status:         'unregistered',
    role:           'owner',
    cl_score:       undefined,
    initials:       'OF',
    avatarGradient: 'linear-gradient(135deg, #065f46, #047857)',
    last_active:    '3 days ago',
    setup_stage:    'data_pending',
    branch_count:   0,
    accounts:       [],
  },
  {
    business_id:    'biz_003',
    name:           'Lagos Catering Services',
    shortName:      'Lagos Catering',
    sector:         'Restaurant & Catering',
    status:         'registered',
    role:           'admin',
    cl_score:       611,
    initials:       'LC',
    avatarGradient: 'linear-gradient(135deg, #7c2d12, #9a3412)',
    last_active:    '1 week ago',
    setup_stage:    'complete',
    branch_count:   1,
    accounts:       ['Access Bank ****7712'],
  },
];

const DEFAULT_BUSINESS_ID = 'biz_001';
const LS_KEY = 'cl_active_business_id';

/* ─────────────────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────────────────── */
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [activeId,    setActiveId]    = useState<string>(DEFAULT_BUSINESS_ID);
  const [isSwitching, setIsSwitching] = useState(false);

  /* Rehydrate from localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && MEMBERSHIPS.find(m => m.business_id === stored)) {
      setActiveId(stored);
    }
  }, []);

  const activeBusiness = MEMBERSHIPS.find(m => m.business_id === activeId) ?? MEMBERSHIPS[0];

  const switchBusiness = useCallback(async (businessId: string) => {
    if (businessId === activeId) return;
    setIsSwitching(true);
    // TODO: POST /user/active-business { business_id }
    // In production this also invalidates all SWR/React Query caches
    await new Promise(r => setTimeout(r, 400));
    localStorage.setItem(LS_KEY, businessId);
    setActiveId(businessId);
    setIsSwitching(false);
  }, [activeId]);

  return (
    <BusinessContext.Provider value={{
      currentUser: CURRENT_USER,
      memberships: MEMBERSHIPS,
      activeBusiness,
      switchBusiness,
      isSwitching,
    }}>
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
