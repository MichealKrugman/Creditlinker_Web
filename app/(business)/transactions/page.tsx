"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search, ArrowDownLeft, ArrowUpRight, SlidersHorizontal,
  ChevronLeft, ChevronRight, RefreshCw, Download,
  Repeat2, ArrowLeftRight, X, Tag, CheckCircle2, Sparkles,
  Building2, MapPin, Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type EntityType = "hq" | "branch" | "franchise" | "office" | "warehouse";
type CostType   = "revenue_inflow" | "variable_opex" | "fixed_opex" | "capex" | "non_operating" | "internal";

interface TagOption {
  category:  string;
  label:     string;
  cost_type: CostType;
  color:     string;
  bg:        string;
  description: string;
}

interface TxRow {
  id:                   string;
  date:                 string;
  description:          string;       // counterparty_cluster ?? category
  amount:               number;
  direction:            "credit" | "debit";
  category:             string;
  account_id:           string;
  account_display:      string;       // "GTBank ****0034"
  entity_id:            string;       // branch_id ?? "hq"
  is_recurring:         boolean;
  is_internal_transfer: boolean;
  flags:                string[];
  human_verified:       boolean;      // derived: !!user_tag
  user_tag?:            TagOption;
}

interface LiveEntity {
  id:          string;       // "hq" | branch_id
  shortName:   string;
  type:        EntityType;
  location:    string;
  accountIds:  string[];
  data_linked: boolean;
}

/* ─────────────────────────────────────────────────────────
   TAG TAXONOMY  (app config — not mock data)
───────────────────────────────────────────────────────── */
const TAG_TAXONOMY: TagOption[] = [
  { category: "Revenue",               label: "Revenue",               cost_type: "revenue_inflow", color: "#10B981", bg: "#ECFDF5", description: "Income from sales or services" },
  { category: "Loan Receipt",          label: "Loan Receipt",          cost_type: "revenue_inflow", color: "#38BDF8", bg: "#F0F9FF", description: "Money received from a loan" },
  { category: "Owner Injection",       label: "Owner Injection",       cost_type: "revenue_inflow", color: "#818CF8", bg: "#F5F3FF", description: "Capital put in by the owner" },
  { category: "Supplier Payment",      label: "Supplier Payment",      cost_type: "variable_opex",  color: "#818CF8", bg: "#F5F3FF", description: "Payment to a supplier or vendor" },
  { category: "Marketing",             label: "Marketing",             cost_type: "variable_opex",  color: "#F97316", bg: "#FFF7ED", description: "Advertising, promotions, branding" },
  { category: "Professional Services", label: "Professional Services", cost_type: "variable_opex",  color: "#8B5CF6", bg: "#F5F3FF", description: "Lawyers, accountants, consultants" },
  { category: "Logistics",             label: "Logistics & Transport", cost_type: "variable_opex",  color: "#0EA5E9", bg: "#F0F9FF", description: "Delivery, freight, transport costs" },
  { category: "Cost of Goods",         label: "Cost of Goods",         cost_type: "variable_opex",  color: "#78716C", bg: "#FAFAF9", description: "Raw materials, manufacturing inputs" },
  { category: "Repairs",               label: "Repairs & Maintenance", cost_type: "variable_opex",  color: "#D97706", bg: "#FFFBEB", description: "Fixing equipment or premises" },
  { category: "Payroll",               label: "Salaries / Payroll",    cost_type: "fixed_opex",     color: "#F59E0B", bg: "#FFFBEB", description: "Staff wages and payroll" },
  { category: "Rent",                  label: "Rent",                  cost_type: "fixed_opex",     color: "#F59E0B", bg: "#FFFBEB", description: "Office, warehouse, or shop space" },
  { category: "Utility",               label: "Utilities",             cost_type: "fixed_opex",     color: "#6B7280", bg: "#F9FAFB", description: "Electricity, water, internet" },
  { category: "Tax",                   label: "Tax",                   cost_type: "variable_opex",  color: "#EF4444", bg: "#FEF2F2", description: "FIRS, VAT, PAYE, state levies" },
  { category: "Equipment Purchase",    label: "Equipment Purchase",    cost_type: "capex",          color: "#7C3AED", bg: "#F5F3FF", description: "Machinery, vehicles, tools" },
  { category: "Loan Repayment",        label: "Loan Repayment",        cost_type: "non_operating",  color: "#EF4444", bg: "#FEF2F2", description: "Paying back a loan" },
  { category: "Owner Withdrawal",      label: "Owner Withdrawal",      cost_type: "non_operating",  color: "#9CA3AF", bg: "#F9FAFB", description: "Owner taking money out personally" },
  { category: "Internal Transfer",     label: "Internal Transfer",     cost_type: "internal",       color: "#38BDF8", bg: "#F0F9FF", description: "Moving money between own accounts" },
];

const TAG_MAP: Record<string, TagOption> = Object.fromEntries(TAG_TAXONOMY.map(t => [t.category, t]));

const COST_TYPE_IMPACT: Record<CostType, string> = {
  revenue_inflow: "Improves Revenue Stability & Cashflow Predictability scores",
  variable_opex:  "Improves Expense Discipline accuracy",
  fixed_opex:     "Updates Fixed Cost Weight metric",
  capex:          "Excluded from expense ratios — counted as a capital purchase",
  non_operating:  "Tracked separately, not counted in operating expense ratios",
  internal:       "Excluded from all financial metrics",
};

/* ─────────────────────────────────────────────────────────
   ENTITY DISPLAY CONFIG
───────────────────────────────────────────────────────── */
const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  hq: "HQ", branch: "Branch", franchise: "Franchise", office: "Office", warehouse: "Warehouse",
};
const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; color: string; border: string }> = {
  hq:        { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  branch:    { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  franchise: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  office:    { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  warehouse: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
};

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function systemCategoryColor(cat: string): string {
  return ({ Revenue: "#10B981", Payroll: "#F59E0B", Tax: "#EF4444", Operations: "#6B7280", Transfer: "#38BDF8", Rent: "#F59E0B" } as Record<string, string>)[cat] ?? "#9CA3AF";
}

/* ─────────────────────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────────────────────── */
function EntityBadge({ type, small = false }: { type: EntityType; small?: boolean }) {
  const c = ENTITY_TYPE_COLORS[type];
  return (
    <span style={{ fontSize: small ? 9 : 10, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: small ? "1px 6px" : "2px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>
      {ENTITY_TYPE_LABELS[type]}
    </span>
  );
}

function TagDropdown({ tx, currentTag, onTag, onClose, anchorRect }: {
  tx: TxRow; currentTag?: TagOption;
  onTag: (tag: TagOption, counterparty?: string) => void; onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [counterparty, setCounterparty] = useState("");
  const [selected, setSelected]         = useState<TagOption | null>(currentTag ?? null);
  const [step, setStep]                 = useState<"select" | "confirm">("select");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top  && e.clientY <= rect.bottom;
        if (!inside) onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Position fixed relative to anchor button, flipping up if too close to bottom
  const dropWidth = step === "confirm" ? 320 : 268;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const fitsBelow  = spaceBelow >= 360;
  const top    = fitsBelow ? anchorRect.bottom + 8 : anchorRect.top - 8;
  const right  = window.innerWidth - anchorRect.right;
  const fixedStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    top: fitsBelow ? top : undefined,
    bottom: fitsBelow ? undefined : window.innerHeight - anchorRect.top + 8,
    right,
    width: dropWidth,
    background: "white",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
    overflow: "hidden",
  };

  const groups: Record<string, TagOption[]> = {};
  for (const t of TAG_TAXONOMY) {
    const g = t.cost_type === "revenue_inflow" ? "Income" : t.cost_type === "fixed_opex" ? "Fixed Costs" : t.cost_type === "capex" ? "Capital Expenses" : t.cost_type === "non_operating" ? "Non-Operating" : t.cost_type === "internal" ? "Internal" : "Operating Costs";
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  }

  if (step === "confirm" && selected) return createPortal(
    <div ref={ref} style={fixedStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>Confirm tag</p>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={14} /></button>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: selected.bg, border: `1px solid ${selected.color}33` }}>
          <Tag size={12} style={{ color: selected.color, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: selected.color }}>{selected.label}</p>
            <p style={{ fontSize: 11, color: "#6B7280" }}>{selected.cost_type.replace(/_/g, " ")}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "9px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, alignItems: "flex-start" }}>
          <Sparkles size={12} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#0A5060", lineHeight: 1.6 }}>{COST_TYPE_IMPACT[selected.cost_type]}</p>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            Counterparty name <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span>
          </label>
          <input value={counterparty} onChange={e => setCounterparty(e.target.value)}
            placeholder="e.g. Dangote Cement, First Bank..."
            style={{ width: "100%", height: 34, padding: "0 10px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setStep("select")} style={{ flex: 1, height: 36, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Back</button>
          <button onClick={() => { onTag(selected, counterparty || undefined); onClose(); }}
            style={{ flex: 1, height: 36, borderRadius: 8, border: "none", background: "#0A2540", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <CheckCircle2 size={12} /> Apply Tag
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div ref={ref} style={fixedStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Tag transaction</p>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={13} /></button>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" as const }}>
        {Object.entries(groups).map(([groupName, tags]) => (
          <div key={groupName}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "10px 14px 4px" }}>{groupName}</p>
            {tags.map(tag => (
              <button key={tag.category} onClick={() => { setSelected(tag); setStep("confirm"); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 14px", border: "none", background: currentTag?.category === tag.category ? tag.bg : "transparent", cursor: "pointer", textAlign: "left" as const, transition: "background 0.1s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tag.bg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = currentTag?.category === tag.category ? tag.bg : "transparent"; }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{tag.label}</p>
                  <p style={{ fontSize: 10, color: "#9CA3AF" }}>{tag.description}</p>
                </div>
                {currentTag?.category === tag.category && <CheckCircle2 size={12} style={{ color: tag.color, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: 9999, border: "1.5px solid", borderColor: active ? "#0A2540" : "#E5E7EB", background: active ? "#0A2540" : "white", color: active ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
      {label}
    </button>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: color ?? "#0A2540" }}>
        {value}{sub && <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>{sub}</span>}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function TransactionsPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();

  // ── Metadata state (fetched once per business)
  const [entities,        setEntities]        = useState<LiveEntity[]>([]);
  const [accountDisplay,  setAccountDisplay]  = useState<Record<string, string>>({}); // account_id → "GTBank ****0034"
  const [accountEntityId, setAccountEntityId] = useState<Record<string, string>>({}); // account_id → entity_id
  const [entityAccountIds, setEntityAccountIds] = useState<Record<string, string[]>>({}); // entity_id → account_id[]
  const [categories,      setCategories]      = useState<string[]>(["All"]);
  const [taggedCount,     setTaggedCount]     = useState(0); // total tagged across all pages

  // ── Page state
  const [rows,            setRows]            = useState<TxRow[]>([]);
  const [totalCount,      setTotalCount]      = useState(0);
  const [statsIn,         setStatsIn]         = useState(0);
  const [statsOut,        setStatsOut]        = useState(0);
  const [unknownCount,    setUnknownCount]    = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [txLoading,       setTxLoading]       = useState(false);

  // ── Filter state
  const [activeEntity,   setActiveEntity]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [direction,      setDirection]      = useState("All");
  const [category,       setCategory]       = useState("All");
  const [showTaggedOnly, setShowTaggedOnly] = useState(false);
  const [page,           setPage]           = useState(1);

  // ── UI state
  const [showFilters,    setShowFilters]    = useState(false);
  const [openTagId,      setOpenTagId]      = useState<string | null>(null);
  const [openTagRect,    setOpenTagRect]    = useState<DOMRect | null>(null);
  const [recentlyTagged, setRecentlyTagged] = useState<Set<string>>(new Set());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // ── Date range (derived from all transactions for this business)
  const [dateRange,      setDateRange]      = useState<{ min: string; max: string } | null>(null);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Fetch metadata once per business ── */
  useEffect(() => {
    if (!activeBusiness) return;
    const bid = activeBusiness.business_id;

    async function loadMeta() {
      setLoading(true);

      const [accountsRes, branchesRes, catRes] = await Promise.all([
        supabase
          .from("linked_accounts")
          .select("account_id, bank_name, account_number_masked, entity_id")
          .eq("business_id", bid),
        supabase
          .from("branches")
          .select("branch_id, name, short_name, type, is_default, location")
          .eq("business_id", bid),
        supabase
          .from("normalized_transactions")
          .select("category")
          .eq("business_id", bid)
          .not("category", "is", null)
          .limit(500),
      ]);

      // Find the real HQ/default branch from DB so we can map null-branch_id accounts to it
      const hqBranch   = (branchesRes.data ?? []).find((b: any) => b.type === "hq" || b.is_default);
      const hqBranchId = hqBranch?.branch_id ?? null;

      // Build account maps
      const dispMap:   Record<string, string>   = {};
      const entMap:    Record<string, string>   = {};
      // Pre-seed every branch key so locked-state works even for branches with no accounts
      const entAccMap: Record<string, string[]> = {};
      for (const b of branchesRes.data ?? []) entAccMap[b.branch_id] = [];
      if (!hqBranchId) entAccMap["hq"] = []; // virtual fallback only when no real HQ branch exists

      for (const acc of accountsRes.data ?? []) {
        const display = `${acc.bank_name} ${acc.account_number_masked ?? ""}`.trim();
        dispMap[acc.account_id]  = display;
        // Accounts with no entity_id → assign to real HQ branch
        const eid                = acc.entity_id ?? hqBranchId ?? "hq";
        entMap[acc.account_id]   = eid;
        if (!entAccMap[eid]) entAccMap[eid] = [];
        entAccMap[eid].push(acc.account_id);
      }

      setAccountDisplay(dispMap);
      setAccountEntityId(entMap);
      setEntityAccountIds(entAccMap);

      // Build entity list from real DB branches + virtual HQ only as fallback
      const liveEntities: LiveEntity[] = [];

      // Virtual HQ: only synthesise if there is no real HQ/default branch in the DB
      if (!hqBranchId) {
        const hqAccIds = entAccMap["hq"] ?? [];
        liveEntities.push({
          id:          "hq",
          shortName:   "HQ",
          type:        "hq",
          location:    activeBusiness?.address ?? "",
          accountIds:  hqAccIds,
          data_linked: hqAccIds.length > 0,
        });
      }

      // Real DB branches (in the order returned — default/HQ branch comes first from the sort)
      for (const b of branchesRes.data ?? []) {
        const bAccIds = entAccMap[b.branch_id] ?? [];
        liveEntities.push({
          id:          b.branch_id as string,
          shortName:   (b.short_name as string) ?? (b.name as string) ?? "Branch",
          type:        (b.type as EntityType) ?? "branch",
          location:    (b.location as string) ?? "",
          accountIds:  bAccIds,
          data_linked: bAccIds.length > 0,
        });
      }
      setEntities(liveEntities);

      // Distinct categories
      const distinctCats = ["All", ...new Set((catRes.data ?? []).map((r: any) => r.category as string).filter(Boolean))];
      setCategories(distinctCats);

      // Date range — fetch min and max dates for this business
      const [minDateRes, maxDateRes] = await Promise.all([
        supabase
          .from("normalized_transactions")
          .select("date")
          .eq("business_id", bid)
          .order("date", { ascending: true })
          .limit(1)
          .single(),
        supabase
          .from("normalized_transactions")
          .select("date")
          .eq("business_id", bid)
          .order("date", { ascending: false })
          .limit(1)
          .single(),
      ]);
      if (minDateRes.data && maxDateRes.data) {
        setDateRange({ min: minDateRes.data.date, max: maxDateRes.data.date });
      }

      setLoading(false);
    }

    loadMeta();
  }, [activeBusiness?.business_id]);

  /* ── Fetch transactions page ── */
  const fetchPage = useCallback(async () => {
    if (!activeBusiness) return;
    const bid = activeBusiness.business_id;

    setTxLoading(true);

    // 1. Fetch all tags for this business (small table — human actions only)
    const { data: tagRows } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag_category")
      .eq("business_id", bid);

    const tagCatMap: Record<string, string> = {};
    const taggedIds: string[] = [];
    for (const t of tagRows ?? []) {
      tagCatMap[t.transaction_id] = t.tag_category;
      taggedIds.push(t.transaction_id);
    }
    // 2. Determine account_id filter for entity
    let scopeAccountIds: string[] | null = null;
    if (activeEntity !== "all") {
      scopeAccountIds = entityAccountIds[activeEntity] ?? [];
    }

    // Scoped tagged count: when viewing a specific entity, only count tags whose
    // transaction belongs to that entity's accounts — not the whole business.
    if (taggedIds.length === 0 || scopeAccountIds === null) {
      // All-entities view, or nothing tagged yet — total is fine as-is
      setTaggedCount(taggedIds.length);
    } else if (scopeAccountIds.length > 0) {
      const { count: scopedTagCount } = await supabase
        .from("normalized_transactions")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bid)
        .in("account_id", scopeAccountIds)
        .in("id", taggedIds);
      setTaggedCount(scopedTagCount ?? 0);
    } else {
      setTaggedCount(0); // entity has no linked accounts
    }

    // 3. If showTaggedOnly and nothing tagged → return empty immediately
    if (showTaggedOnly && taggedIds.length === 0) {
      setRows([]);
      setTotalCount(0);
      setStatsIn(0);
      setStatsOut(0);
      setUnknownCount(0);
      setTxLoading(false);
      return;
    }

    // 4. Build and execute paginated query
    const buildBase = () => {
      let q = supabase
        .from("normalized_transactions")
        .select("id, date, amount, direction, category, counterparty_cluster, description, account_id, is_recurring, is_internal_transfer, flags", { count: "exact" })
        .eq("business_id", bid);

      if (scopeAccountIds !== null) {
        if (scopeAccountIds.length === 0) return null; // entity has no accounts → empty
        q = q.in("account_id", scopeAccountIds);
      }
      if (direction !== "All")       q = q.eq("direction", direction.toLowerCase());
      if (category  !== "All")       q = q.eq("category",  category);
      if (debouncedSearch)           q = q.or(`counterparty_cluster.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      if (showTaggedOnly)            q = q.in("id", taggedIds);
      if (dateFrom)                  q = q.gte("date", dateFrom);
      if (dateTo)                    q = q.lte("date", dateTo);

      return q;
    };

    const baseQuery = buildBase();
    if (!baseQuery) {
      setRows([]); setTotalCount(0); setStatsIn(0); setStatsOut(0); setUnknownCount(0);
      setTxLoading(false);
      return;
    }

    // 5. Paginated rows + count
    const { data, count, error } = await baseQuery
      .order("date", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .returns<any[]>();

    if (error) {
      console.error("[transactions] fetch error:", error.message);
      setTxLoading(false);
      return;
    }

    // 6. Aggregate stats — two DB-side sum queries, no rows sent to client
    const buildBaseForStats = () => {
      let q = supabase
        .from("normalized_transactions")
        .select("amount", { count: "exact" })
        .eq("business_id", bid);
      if (scopeAccountIds !== null && scopeAccountIds.length > 0) q = q.in("account_id", scopeAccountIds);
      if (direction !== "All") q = q.eq("direction", direction.toLowerCase());
      if (category  !== "All") q = q.eq("category",  category);
      if (debouncedSearch)     q = q.or(`counterparty_cluster.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      if (showTaggedOnly)      q = q.in("id", taggedIds);
      if (dateFrom)            q = q.gte("date", dateFrom);
      if (dateTo)              q = q.lte("date", dateTo);
      return q;
    };

    const [creditRes, debitRes] = await Promise.all([
      buildBaseForStats().eq("direction", "credit").select("amount.sum()"),
      buildBaseForStats().eq("direction", "debit").select("amount.sum()"),
    ]);
    const totalIn  = Number((creditRes.data as any)?.[0]?.sum ?? 0);
    const totalOut = Number((debitRes.data  as any)?.[0]?.sum ?? 0);

    // 7. Unknown count (large-value uncategorised) for nudge banner — scoped to entity, no other filters
    const unknownBase = (() => {
      let q = supabase
        .from("normalized_transactions")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bid)
        .eq("category", "unknown")
        .gte("amount", 50000);
      if (scopeAccountIds !== null && scopeAccountIds.length > 0)
        q = q.in("account_id", scopeAccountIds);
      return q;
    })();
    const { count: unkCount } = await unknownBase;

    // 8. Merge tags into rows
    const merged: TxRow[] = (data ?? []).map((tx: any) => {
      const tagCat  = tagCatMap[tx.id];
      const userTag = tagCat ? (TAG_MAP[tagCat] ?? undefined) : undefined;
      return {
        id:                   tx.id,
        date:                 tx.date,
        description:          (tx.counterparty_cluster as string | null) ?? (tx.description as string | null) ?? (tx.category as string),
        amount:               Number(tx.amount),
        direction:            tx.direction as "credit" | "debit",
        category:             userTag ? userTag.category : (tx.category as string),
        account_id:           tx.account_id,
        account_display:      accountDisplay[tx.account_id] ?? "Unknown Account",
        entity_id:            accountEntityId[tx.account_id] ?? "hq",
        is_recurring:         Boolean(tx.is_recurring),
        is_internal_transfer: Boolean(tx.is_internal_transfer),
        flags:                Array.isArray(tx.flags) ? tx.flags : [],
        human_verified:       !!userTag,
        user_tag:             userTag,
      };
    });

    setRows(merged);
    setTotalCount(count ?? 0);
    setStatsIn(totalIn);
    setStatsOut(totalOut);
    setUnknownCount(unkCount ?? 0);
    setTxLoading(false);
  }, [
    activeBusiness?.business_id,
    activeEntity,
    debouncedSearch,
    direction,
    category,
    showTaggedOnly,
    page,
    entityAccountIds,
    accountDisplay,
    accountEntityId,
  ]);

  useEffect(() => {
    if (!activeBusiness || loading) return;
    fetchPage();
  }, [fetchPage, loading]);

  /* ── Apply tag: delete-then-insert to transaction_tags ── */
  const applyTag = async (txId: string, tag: TagOption, counterparty?: string) => {
    if (!activeBusiness) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete any existing tag for this transaction first, then insert fresh.
    // This avoids the ON CONFLICT DO UPDATE RLS ambiguity (with_check: null
    // makes Postgres evaluate USING for both old+new rows simultaneously on
    // upsert, which can silently block even when the policy should allow it).
    const { error: delError } = await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", txId)
      .eq("business_id", activeBusiness.business_id);

    if (delError) {
      console.error("[transactions] tag delete error:", delError.message);
      return;
    }

    const { error } = await supabase
      .from("transaction_tags")
      .insert({
        transaction_id: txId,
        business_id:    activeBusiness.business_id,
        tag_category:   tag.category,
        tag_cost_type:  tag.cost_type,
        tag_color:      tag.color,
        tag_bg:         tag.bg,
        counterparty:   counterparty ?? null,
        tagged_by:      user.id,
      });

    if (error) {
      console.error("[transactions] tag insert error:", error.message);
      return;
    }

    // Optimistic UI update for the current page
    setRows(prev => prev.map(tx =>
      tx.id === txId
        ? { ...tx, user_tag: tag, human_verified: true, category: tag.category }
        : tx
    ));
    setRecentlyTagged(prev => new Set([...prev, txId]));
    setTimeout(() => setRecentlyTagged(prev => { const n = new Set(prev); n.delete(txId); return n; }), 2400);

    // Re-fetch to sync tagged count + stats
    fetchPage();
  };

  /* ── Sync: fetch transactions for all accounts in current scope ── */
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!activeBusiness || syncing) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` };
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const bid = activeBusiness.business_id;

      // Determine which accounts to sync
      const accountIds = activeEntity === "all"
        ? Object.keys(accountDisplay)
        : (entityAccountIds[activeEntity] ?? []);

      // Fire all syncs in parallel
      await Promise.all(accountIds.map(aid =>
        fetch(`${supabaseUrl}/functions/v1/fetch-mono-transactions`, {
          method: "POST", headers,
          body: JSON.stringify({ account_id: aid, business_id: bid }),
        })
      ));

      // Refresh page data
      await fetchPage();
    } finally {
      setSyncing(false);
    }
  };

  /* ── Download ── */
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!activeBusiness) return;
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const body: Record<string, unknown> = {
        business_id: activeBusiness.business_id,
      };
      if (activeEntity !== 'all') {
        const scopeIds = entityAccountIds[activeEntity] ?? [];
        if (scopeIds.length > 0) body.account_ids = scopeIds;
      }

      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/export-transactions`;
      const response = await fetch(fnUrl, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Export failed (${response.status})`);
      }

      const blob     = await response.blob();
      const url      = URL.createObjectURL(blob);
      const date     = new Date().toISOString().slice(0, 10);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `statement-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
      alert(msg);
    } finally {
      setExporting(false);
    }
  };

  /* ── Derived ── */
  const netFlow       = statsIn - statsOut;
  const totalPages    = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilters    = search !== "" || direction !== "All" || category !== "All" || showTaggedOnly || !!dateFrom || !!dateTo;
  const selectedEntity = activeEntity === "all" ? null : entities.find(e => e.id === activeEntity) ?? null;

  const clearFilters = () => {
    setSearch(""); setDirection("All"); setCategory("All"); setShowTaggedOnly(false); setDateFrom(""); setDateTo(""); setPage(1);
  };

  /* ── Loading guard ── */
  if (bizLoading || loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" as const, color: "#9CA3AF" }}>
        <p style={{ fontSize: 14 }}>Loading transactions…</p>
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div style={{ padding: 48, textAlign: "center" as const, color: "#9CA3AF" }}>
        <p style={{ fontSize: 14 }}>No business found.</p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Transactions</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {(() => {
              const entityLabel = activeEntity === "all" ? "All entities" : selectedEntity?.shortName ?? "";
              const dateLabel = dateRange
                ? ` · ${new Date(dateRange.min).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} – ${new Date(dateRange.max).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
                : "";
              return `${totalCount.toLocaleString()} transactions · ${entityLabel}${dateLabel}`;
            })()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={handleDownload} disabled={exporting}>
            <Download size={13} /> {exporting ? 'Exporting…' : 'Export'}
          </Button>
          <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={handleSync} disabled={syncing}>
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing…" : "Sync"}
          </Button>
        </div>
      </div>

      {/* ── ENTITY SWITCHER ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Viewing</p>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {/* All */}
          <button
            onClick={() => { setActiveEntity("all"); setPage(1); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9999, border: `2px solid ${activeEntity === "all" ? "#0A2540" : "#E5E7EB"}`, background: activeEntity === "all" ? "#0A2540" : "white", color: activeEntity === "all" ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
            <Building2 size={13} />
            All Entities
          </button>

          {/* Per-entity */}
          {entities.map(entity => {
            const isActive = activeEntity === entity.id;
            const tc       = ENTITY_TYPE_COLORS[entity.type];
            const noData   = !entity.data_linked;
            return (
              <button key={entity.id}
                onClick={() => { if (!noData) { setActiveEntity(entity.id); setPage(1); } }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9999, border: `2px solid ${isActive ? tc.color : "#E5E7EB"}`, background: isActive ? tc.bg : "white", color: isActive ? tc.color : noData ? "#C0C0C0" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: noData ? "not-allowed" : "pointer", transition: "all 0.12s", opacity: noData ? 0.5 : 1 }}>
                <MapPin size={12} />
                {entity.shortName}
                <EntityBadge type={entity.type} small />
                {noData && <Lock size={10} style={{ color: "#D97706" }} />}
              </button>
            );
          })}
        </div>

        {/* Entity context sub-row */}
        {selectedEntity && selectedEntity.data_linked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: ENTITY_TYPE_COLORS[selectedEntity.type].bg, border: `1px solid ${ENTITY_TYPE_COLORS[selectedEntity.type].border}`, borderRadius: 9, flexWrap: "wrap" as const }}>
            <MapPin size={11} style={{ color: ENTITY_TYPE_COLORS[selectedEntity.type].color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: ENTITY_TYPE_COLORS[selectedEntity.type].color }}>{selectedEntity.shortName}</span>
            {selectedEntity.location && (
              <>
                <span style={{ fontSize: 11, color: "#6B7280" }}>·</span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{selectedEntity.location}</span>
              </>
            )}
            {selectedEntity.accountIds.length > 0 && (
              <>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
                {selectedEntity.accountIds.map(aid => (
                  <span key={aid} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#374151", background: "white", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block", flexShrink: 0 }} />
                    {accountDisplay[aid] ?? aid}
                  </span>
                ))}
              </>
            )}
            <Link href="/data-sources" style={{ fontSize: 11, fontWeight: 600, color: ENTITY_TYPE_COLORS[selectedEntity.type].color, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
              Manage accounts <ChevronRight size={10} />
            </Link>
            <button onClick={() => setActiveEntity("all")} style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6B7280", background: "white", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
              ← All
            </button>
          </div>
        )}

        {/* No-data entity state */}
        {selectedEntity && !selectedEntity.data_linked && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Lock size={18} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>{selectedEntity.shortName} — No transactions available</p>
              <p style={{ fontSize: 13, color: "#B45309", lineHeight: 1.7 }}>
                This entity has no linked bank accounts. Link an account to view its transactions.
              </p>
            </div>
            <Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
              Link account
            </Link>
          </div>
        )}
      </div>

      {/* ── TAGGING NUDGE ── */}
      {unknownCount > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Tag size={16} style={{ color: "#F59E0B" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>
              {unknownCount} uncategorised transaction{unknownCount !== 1 ? "s" : ""} above ₦50,000{selectedEntity ? ` · ${selectedEntity.shortName}` : ""}
            </p>
            <p style={{ fontSize: 12, color: "#92400E" }}>Tagging them helps the platform accurately compute your Expense Discipline and Cashflow scores.</p>
          </div>
          <button onClick={() => { setCategory("unknown"); setPage(1); }}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "white", fontSize: 12, fontWeight: 600, color: "#D97706", cursor: "pointer" }}>
            Show untagged
          </button>
        </div>
      )}

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat label="Total In"      value={fmt(statsIn)}            color="#10B981" />
        <Stat label="Total Out"     value={fmt(statsOut)}           color="#EF4444" />
        <Stat label="Net Flow"      value={fmt(Math.abs(netFlow))}  color={netFlow >= 0 ? "#10B981" : "#EF4444"} />
        <Stat label="Transactions"  value={totalCount.toLocaleString()} />
        <Stat label="Tagged by You" value={String(taggedCount)} />
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input
              placeholder="Search by counterparty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
            <SlidersHorizontal size={13} /> Filters
            {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: showFilters ? "#00D4FF" : "#0A2540", flexShrink: 0 }} />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Direction</span>
              {["All", "Credit", "Debit"].map(d => (
                <FilterPill key={d} label={d} active={direction === d} onClick={() => { setDirection(d); setPage(1); }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Category</span>
              {categories.map(c => (
                <FilterPill key={c} label={c === "unknown" ? "Untagged" : c} active={category === c} onClick={() => { setCategory(c); setPage(1); }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Tagged</span>
              <FilterPill label="Human-tagged only" active={showTaggedOnly} onClick={() => { setShowTaggedOnly(!showTaggedOnly); setPage(1); }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Date</span>
              <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                style={{ height: 32, padding: "0 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 12, color: dateFrom ? "#0A2540" : "#9CA3AF", cursor: "pointer", outline: "none" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>to</span>
              <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                style={{ height: 32, padding: "0 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 12, color: dateTo ? "#0A2540" : "#9CA3AF", cursor: "pointer", outline: "none" }} />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><X size={11} /> Clear dates</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", opacity: txLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>

        {/* DESKTOP */}
        <div className="tx-desktop-table">
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 130px 120px 106px 76px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            {["", "Description", "Category", "Account", "Date", "Amount", ""].map((h, i) => (
              <p key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</p>
            ))}
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" as const }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>
                {txLoading ? "Loading…" : "No transactions found."}
              </p>
              {!txLoading && <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try adjusting your filters or search query.</p>}
            </div>
          ) : rows.map((tx, i) => {
            const isUnknown  = tx.category === "unknown" && !tx.user_tag;
            const justTagged = recentlyTagged.has(tx.id);
            const txEntity   = entities.find(e => e.id === tx.entity_id);
            return (
              <div key={tx.id}
                style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 130px 120px 106px 76px", padding: "13px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", background: justTagged ? "rgba(16,185,129,0.03)" : isUnknown ? "rgba(245,158,11,0.02)" : "transparent", transition: "background 0.15s", position: "relative" as const }}
                onMouseEnter={e => { if (!justTagged && !isUnknown) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                onMouseLeave={e => { if (!justTagged && !isUnknown) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

                <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                  {tx.is_internal_transfer ? <ArrowLeftRight size={12} style={{ color: "#38BDF8" }} /> : tx.direction === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                </div>

                <div style={{ minWidth: 0, paddingRight: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" as const }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</p>
                    {tx.is_recurring && <Repeat2 size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                    {tx.is_internal_transfer && <span style={{ fontSize: 9, fontWeight: 700, color: "#38BDF8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Internal</span>}
                    {(tx.flags ?? []).includes("round_number_suspicious") && <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Flag</span>}
                  </div>
                  {activeEntity === "all" && txEntity && <EntityBadge type={txEntity.type} small />}
                </div>

                <div>
                  {tx.user_tag ? (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: tx.user_tag.color, background: tx.user_tag.bg, padding: "3px 8px", borderRadius: 6 }}><Tag size={9} />{tx.user_tag.label}</div>
                  ) : isUnknown ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />Untagged</span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: systemCategoryColor(tx.category) }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: systemCategoryColor(tx.category), flexShrink: 0 }} />{tx.category}</span>
                  )}
                </div>

                <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{tx.account_display.split(" ")[0]}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(tx.date)}</p>
                <p style={{ fontSize: 13, fontWeight: 700, textAlign: "right" as const, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>{tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}</p>

                <div style={{ display: "flex", justifyContent: "flex-end", position: "relative" as const }}>
                  {justTagged ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981" }}><CheckCircle2 size={13} /> Tagged</div>
                  ) : (
                    <button onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setOpenTagRect(r); setOpenTagId(openTagId === tx.id ? null : tx.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1.5px solid", borderColor: isUnknown ? "#F59E0B" : openTagId === tx.id ? "#0A2540" : "#E5E7EB", background: isUnknown ? "#FFFBEB" : openTagId === tx.id ? "#0A2540" : "white", color: isUnknown ? "#D97706" : openTagId === tx.id ? "white" : "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                      <Tag size={10} />{tx.user_tag ? "Retag" : "Tag"}
                    </button>
                  )}
                  {openTagId === tx.id && openTagRect && (
                    <TagDropdown tx={tx} currentTag={tx.user_tag} onTag={(tag, cp) => applyTag(tx.id, tag, cp)} onClose={() => setOpenTagId(null)} anchorRect={openTagRect} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE */}
        <div className="tx-mobile-list">
          {rows.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" as const }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>
                {txLoading ? "Loading…" : "No transactions found."}
              </p>
              {!txLoading && <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try adjusting your filters or search query.</p>}
            </div>
          ) : rows.map((tx, i) => {
            const isUnknown  = tx.category === "unknown" && !tx.user_tag;
            const justTagged = recentlyTagged.has(tx.id);
            const txEntity   = entities.find(e => e.id === tx.entity_id);
            return (
              <div key={tx.id} style={{ padding: "14px 16px", borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none", background: justTagged ? "rgba(16,185,129,0.03)" : isUnknown ? "rgba(245,158,11,0.02)" : "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                    {tx.is_internal_transfer ? <ArrowLeftRight size={13} style={{ color: "#38BDF8" }} /> : tx.direction === "credit" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1, minWidth: 0 }}>{tx.description}</p>
                      {tx.is_recurring && <Repeat2 size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                      {(tx.flags ?? []).includes("round_number_suspicious") && <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Flag</span>}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(tx.date)} · {tx.account_display.split(" ")[0]}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>{tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingLeft: 46 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" as const }}>
                    {tx.user_tag ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: tx.user_tag.color, background: tx.user_tag.bg, padding: "3px 8px", borderRadius: 6 }}><Tag size={9} />{tx.user_tag.label}</div>
                    ) : isUnknown ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />Untagged</span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: systemCategoryColor(tx.category) }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: systemCategoryColor(tx.category), flexShrink: 0 }} />{tx.category}</span>
                    )}
                    {tx.is_internal_transfer && <span style={{ fontSize: 9, fontWeight: 700, color: "#38BDF8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", padding: "1px 5px", borderRadius: 4 }}>Internal</span>}
                    {activeEntity === "all" && txEntity && <EntityBadge type={txEntity.type} small />}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {justTagged ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981" }}><CheckCircle2 size={13} /> Tagged</div>
                    ) : (
                      <button
                        onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setOpenTagRect(r); setOpenTagId(openTagId === tx.id ? null : tx.id); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1.5px solid", borderColor: isUnknown ? "#F59E0B" : openTagId === tx.id ? "#0A2540" : "#E5E7EB", background: isUnknown ? "#FFFBEB" : openTagId === tx.id ? "#0A2540" : "white", color: isUnknown ? "#D97706" : openTagId === tx.id ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                        <Tag size={11} />{tx.user_tag ? "Retag" : "Tag"}
                      </button>
                    )}
                    {openTagId === tx.id && openTagRect && (
                      <TagDropdown tx={tx} currentTag={tx.user_tag} onTag={(tag, cp) => applyTag(tx.id, tag, cp)} onClose={() => setOpenTagId(null)} anchorRect={openTagRect} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D1D5DB" : "#374151" }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show pages around current page when there are many
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid", borderColor: page === p ? "#0A2540" : "#E5E7EB", background: page === p ? "#0A2540" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D1D5DB" : "#374151" }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ background: "#0A2540", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={16} color="#00D4FF" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.02em", marginBottom: 2 }}>Tags improve your financial scores.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Your tags are applied on the next pipeline run and override the system's category. They directly improve Expense Discipline, Cashflow Predictability, and Risk Profile accuracy.</p>
        </div>
      </div>

    </div>
  );
}
