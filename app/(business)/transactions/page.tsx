"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, ArrowDownLeft, ArrowUpRight, SlidersHorizontal,
  ChevronLeft, ChevronRight, RefreshCw, Download,
  Repeat2, ArrowLeftRight, X, Tag, CheckCircle2, Sparkles,
  Building2, MapPin, Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────────────────
   ENTITY DEFINITIONS
   Mirrors the entities in financial-analysis and data-sources.
   In production: derived from GET /business/profile/branches
───────────────────────────────────────────────────────── */
type EntityType = "hq" | "branch" | "franchise" | "office" | "warehouse";

interface Entity {
  id: string;
  shortName: string;
  type: EntityType;
  location: string;
  accounts: string[];      // account strings that belong to this entity
  tx_count: number;
  data_linked: boolean;
}

const ENTITIES: Entity[] = [
  {
    id:          "hq",
    shortName:   "HQ",
    type:        "hq",
    location:    "Victoria Island, Lagos",
    accounts:    ["Zenith Bank ****4821"],
    tx_count:    842,
    data_linked: true,
  },
  {
    id:          "br_001",
    shortName:   "Lekki Store",
    type:        "branch",
    location:    "Lekki Phase 1, Lagos",
    accounts:    ["GTBank ****0034"],
    tx_count:    391,
    data_linked: true,
  },
  {
    id:          "fr_001",
    shortName:   "Abuja",
    type:        "franchise",
    location:    "Wuse 2, Abuja",
    accounts:    [],
    tx_count:    0,
    data_linked: false,   // no accounts linked yet
  },
];

/*
  ACCOUNT → ENTITY MAP
  Derived from Data Sources assignments (PUT /business/data-sources/accounts/:id/entity).
  When the owner assigns "GTBank ****0034 → Lekki Store" in Data Sources,
  all transactions from that account flow into the Lekki Store entity view here.
*/
const ACCOUNT_ENTITY_MAP: Record<string, string> = {
  "Zenith Bank ****4821": "hq",
  "GTBank ****0034":      "br_001",
};

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

/* ─────────────────────────────────────────────────────────
   TAG TAXONOMY
───────────────────────────────────────────────────────── */
type CostType = "revenue_inflow" | "variable_opex" | "fixed_opex" | "capex" | "non_operating" | "internal";

interface TagOption {
  category: string;
  label: string;
  cost_type: CostType;
  color: string;
  bg: string;
  description: string;
}

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

const COST_TYPE_IMPACT: Record<CostType, string> = {
  revenue_inflow: "Improves Revenue Stability & Cashflow Predictability scores",
  variable_opex:  "Improves Expense Discipline accuracy",
  fixed_opex:     "Updates Fixed Cost Weight metric",
  capex:          "Excluded from expense ratios — counted as a capital purchase",
  non_operating:  "Tracked separately, not counted in operating expense ratios",
  internal:       "Excluded from all financial metrics",
};

/* ─────────────────────────────────────────────────────────
   TRANSACTION DATA
   Each transaction carries entity_id, derived from which
   account it came through (ACCOUNT_ENTITY_MAP).
───────────────────────────────────────────────────────── */
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: "credit" | "debit";
  category: string;
  account: string;
  entity_id: string;      // ← scopes this transaction to an entity
  is_recurring: boolean;
  is_internal_transfer: boolean;
  flags: string[];
  human_verified?: boolean;
  user_tag?: TagOption;
}

// Helper: derive entity_id from account
function entityFromAccount(account: string): string {
  return ACCOUNT_ENTITY_MAP[account] ?? "hq";
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx_001", date: "2024-12-28", description: "Retail Sales — Lekki",         amount: 920000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_002", date: "2024-12-28", description: "Flour Mills Nigeria",           amount: 480000,  direction: "debit",  category: "unknown",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_003", date: "2024-12-27", description: "Lagos State Tax",               amount: 125000,  direction: "debit",  category: "Tax",        account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_004", date: "2024-12-27", description: "Jumia Food — Payout",          amount: 340000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_005", date: "2024-12-26", description: "Staff Salaries — Dec",         amount: 1200000, direction: "debit",  category: "Payroll",    account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_006", date: "2024-12-26", description: "NGN 85,000",                   amount: 85000,   direction: "debit",  category: "unknown",    account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: false, is_internal_transfer: false, flags: ["round_number_suspicious"] },
  { id: "tx_007", date: "2024-12-25", description: "Retail Sales — Victoria Is.",  amount: 670000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_008", date: "2024-12-24", description: "Account Transfer — Internal",  amount: 300000,  direction: "debit",  category: "Transfer",   account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: true,  flags: [] },
  { id: "tx_009", date: "2024-12-24", description: "Account Transfer — Internal",  amount: 300000,  direction: "credit", category: "Transfer",   account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: false, is_internal_transfer: true,  flags: [] },
  { id: "tx_010", date: "2024-12-23", description: "Packaging Supplies",           amount: 56000,   direction: "debit",  category: "unknown",    account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_011", date: "2024-12-22", description: "Retail Sales — Ikeja",         amount: 430000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_012", date: "2024-12-21", description: "Diesel — Generator",           amount: 42000,   direction: "debit",  category: "Operations", account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_013", date: "2024-12-20", description: "Catering Contract — Dec",      amount: 850000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_014", date: "2024-12-19", description: "LAWMA Levy",                   amount: 18000,   direction: "debit",  category: "Tax",        account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_015", date: "2024-12-18", description: "Cold Room Rental",             amount: 120000,  direction: "debit",  category: "Rent",       account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_016", date: "2024-12-17", description: "Wholesale — Kano Distributor", amount: 1450000, direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_017", date: "2024-12-16", description: "VAT Remittance — Nov",         amount: 95000,   direction: "debit",  category: "Tax",        account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_018", date: "2024-12-15", description: "Raw Materials — Sugar",        amount: 220000,  direction: "debit",  category: "unknown",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_019", date: "2024-12-14", description: "Catering Contract — Mid Dec",  amount: 620000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", entity_id: entityFromAccount("Zenith Bank ****4821"), is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_020", date: "2024-12-13", description: "Internet & Utilities",         amount: 35000,   direction: "debit",  category: "Operations", account: "GTBank ****0034",      entity_id: entityFromAccount("GTBank ****0034"),      is_recurring: true,  is_internal_transfer: false, flags: [] },
];

const CATEGORIES_FILTER = ["All", "Revenue", "Payroll", "Tax", "Rent", "Operations", "Transfer", "unknown"];
const PAGE_SIZE = 10;

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
   ENTITY BADGE
───────────────────────────────────────────────────────── */
function EntityBadge({ type, small = false }: { type: EntityType; small?: boolean }) {
  const c = ENTITY_TYPE_COLORS[type];
  return (
    <span style={{ fontSize: small ? 9 : 10, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: small ? "1px 6px" : "2px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>
      {ENTITY_TYPE_LABELS[type]}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   TAG DROPDOWN
───────────────────────────────────────────────────────── */
function TagDropdown({ tx, currentTag, onTag, onClose }: {
  tx: Transaction; currentTag?: TagOption;
  onTag: (tag: TagOption, counterparty?: string) => void; onClose: () => void;
}) {
  const [counterparty, setCounterparty] = useState("");
  const [selected, setSelected]         = useState<TagOption | null>(currentTag ?? null);
  const [step, setStep]                 = useState<"select" | "confirm">("select");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const groups: Record<string, TagOption[]> = {};
  for (const t of TAG_TAXONOMY) {
    const g = t.cost_type === "revenue_inflow" ? "Income" : t.cost_type === "fixed_opex" ? "Fixed Costs" : t.cost_type === "capex" ? "Capital Expenses" : t.cost_type === "non_operating" ? "Non-Operating" : t.cost_type === "internal" ? "Internal" : "Operating Costs";
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  }

  if (step === "confirm" && selected) return (
    <div ref={ref} style={{ position: "absolute", zIndex: 200, top: "calc(100% + 8px)", right: 0, width: 320, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.14)", overflow: "hidden" }}>
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
          <input value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="e.g. Dangote Cement, First Bank..."
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
    </div>
  );

  return (
    <div ref={ref} style={{ position: "absolute", zIndex: 200, top: "calc(100% + 8px)", right: 0, width: 268, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.14)", overflow: "hidden" }}>
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
    </div>
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
  const [transactions,   setTransactions]   = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeEntity,   setActiveEntity]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [direction,      setDirection]      = useState("All");
  const [category,       setCategory]       = useState("All");
  const [page,           setPage]           = useState(1);
  const [showFilters,    setShowFilters]    = useState(false);
  const [openTagId,      setOpenTagId]      = useState<string | null>(null);
  const [showTaggedOnly, setShowTaggedOnly] = useState(false);
  const [recentlyTagged, setRecentlyTagged] = useState<Set<string>>(new Set());

  const linkedEntities    = ENTITIES.filter(e => e.data_linked);
  const selectedEntity    = activeEntity === "all" ? null : ENTITIES.find(e => e.id === activeEntity) ?? null;
  const franchiseNoData   = selectedEntity?.type === "franchise" && !selectedEntity.data_linked;

  const applyTag = (txId: string, tag: TagOption, counterparty?: string) => {
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, user_tag: tag, human_verified: true, category: tag.category } : tx));
    setRecentlyTagged(prev => new Set([...prev, txId]));
    setTimeout(() => setRecentlyTagged(prev => { const n = new Set(prev); n.delete(txId); return n; }), 2400);
    // TODO: POST /business/transactions/:txId/tag
  };

  const filtered = useMemo(() => transactions.filter(tx => {
    const matchEntity = activeEntity === "all" || tx.entity_id === activeEntity;
    const matchDir    = direction === "All"    || tx.direction  === direction.toLowerCase();
    const matchCat    = category  === "All"    || tx.category   === category;
    const matchTag    = !showTaggedOnly        || tx.human_verified;
    const matchSrc    = search === ""          || tx.description.toLowerCase().includes(search.toLowerCase()) || tx.account.toLowerCase().includes(search.toLowerCase());
    return matchEntity && matchDir && matchCat && matchTag && matchSrc;
  }), [transactions, activeEntity, search, direction, category, showTaggedOnly]);

  const totalIn      = filtered.filter(t => t.direction === "credit").reduce((s, t) => s + t.amount, 0);
  const totalOut     = filtered.filter(t => t.direction === "debit").reduce((s, t) => s + t.amount, 0);
  const netFlow      = totalIn - totalOut;
  const unknownCount = transactions
    .filter(t => activeEntity === "all" || t.entity_id === activeEntity)
    .filter(t => t.category === "unknown" && t.amount >= 50_000).length;
  const taggedCount  = transactions.filter(t => t.human_verified).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search !== "" || direction !== "All" || category !== "All" || showTaggedOnly;

  const clearEntityAndFilters = () => { setSearch(""); setDirection("All"); setCategory("All"); setShowTaggedOnly(false); setPage(1); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Transactions</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {activeEntity === "all"
              ? `${transactions.length} transactions · All entities · Jan 2023 – Dec 2024`
              : selectedEntity
              ? `${selectedEntity.tx_count.toLocaleString()} transactions · ${selectedEntity.shortName} · ${selectedEntity.accounts.join(", ")}`
              : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" style={{ gap: 6 }}
            onClick={() => {
              const headers = ["Date","Description","Category","Account","Entity","Direction","Amount (NGN)","Human Verified"];
              const rows = filtered.map(tx => {
                const ent = ENTITIES.find(e => e.id === tx.entity_id);
                return [tx.date, `"${tx.description}"`, tx.category, tx.account, ent?.shortName ?? tx.entity_id, tx.direction, tx.amount, tx.human_verified ? "Yes" : "No"];
              });
              const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `creditlinker_transactions_${activeEntity}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
            }}>
            <Download size={13} /> Export
          </Button>
          <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={() => { window.location.href = "/data-sources"; }}>
            <RefreshCw size={13} /> Sync
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
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9999, border: `2px solid ${activeEntity === "all" ? "#0A2540" : "#E5E7EB"}`, background: activeEntity === "all" ? "#0A2540" : "white", color: activeEntity === "all" ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
          >
            <Building2 size={13} />
            All Entities
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: activeEntity === "all" ? "rgba(255,255,255,0.2)" : "#F3F4F6", color: activeEntity === "all" ? "white" : "#6B7280" }}>
              {transactions.length}
            </span>
          </button>

          {/* Per-entity */}
          {ENTITIES.map(entity => {
            const isActive = activeEntity === entity.id;
            const tc       = ENTITY_TYPE_COLORS[entity.type];
            const noData   = !entity.data_linked;
            const count    = transactions.filter(t => t.entity_id === entity.id).length;
            return (
              <button key={entity.id}
                onClick={() => { if (!noData) { setActiveEntity(entity.id); setPage(1); } }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9999, border: `2px solid ${isActive ? tc.color : "#E5E7EB"}`, background: isActive ? tc.bg : "white", color: isActive ? tc.color : noData ? "#C0C0C0" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: noData ? "not-allowed" : "pointer", transition: "all 0.12s", opacity: noData ? 0.5 : 1 }}
              >
                <MapPin size={12} />
                {entity.shortName}
                <EntityBadge type={entity.type} small />
                {noData
                  ? <Lock size={10} style={{ color: "#D97706" }} />
                  : <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: isActive ? "rgba(255,255,255,0.4)" : "#F3F4F6", color: isActive ? tc.color : "#9CA3AF" }}>{count}</span>
                }
              </button>
            );
          })}
        </div>

        {/* Entity context sub-row */}
        {selectedEntity && !franchiseNoData && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: ENTITY_TYPE_COLORS[selectedEntity.type].bg, border: `1px solid ${ENTITY_TYPE_COLORS[selectedEntity.type].border}`, borderRadius: 9, flexWrap: "wrap" as const }}>
            <MapPin size={11} style={{ color: ENTITY_TYPE_COLORS[selectedEntity.type].color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: ENTITY_TYPE_COLORS[selectedEntity.type].color }}>
              {selectedEntity.shortName}
            </span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>·</span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{selectedEntity.location}</span>
            {selectedEntity.accounts.length > 0 && (
              <>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
                {selectedEntity.accounts.map(a => (
                  <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#374151", background: "white", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block", flexShrink: 0 }} />
                    {a}
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
      </div>

      {/* ── FRANCHISE NO DATA STATE ── */}
      {franchiseNoData && selectedEntity && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "24px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Lock size={18} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>{selectedEntity.shortName} — No transactions available</p>
            <p style={{ fontSize: 13, color: "#B45309", lineHeight: 1.7 }}>
              This franchise is a separate legal entity with its own bank accounts.
              To view their transactions, they need to link their accounts and consent to share data with you.
            </p>
          </div>
          <Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
            <Share2 size={13} /> Invite to share
          </Link>
        </div>
      )}

      {!franchiseNoData && (
        <>
          {/* TAGGING NUDGE */}
          {unknownCount > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Tag size={16} style={{ color: "#F59E0B" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{unknownCount} uncategorised transaction{unknownCount !== 1 ? "s" : ""} above ₦50,000{selectedEntity ? ` · ${selectedEntity.shortName}` : ""}</p>
                <p style={{ fontSize: 12, color: "#92400E" }}>Tagging them helps the platform accurately compute your Expense Discipline and Cashflow scores.</p>
              </div>
              <button onClick={() => { setCategory("unknown"); setPage(1); }}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "white", fontSize: 12, fontWeight: 600, color: "#D97706", cursor: "pointer" }}>
                Show untagged
              </button>
            </div>
          )}

          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <Stat label="Total In"      value={fmt(totalIn)}           color="#10B981" />
            <Stat label="Total Out"     value={fmt(totalOut)}          color="#EF4444" />
            <Stat label="Net Flow"      value={fmt(Math.abs(netFlow))} color={netFlow >= 0 ? "#10B981" : "#EF4444"} />
            <Stat label="Transactions"  value={String(filtered.length)} />
            <Stat label="Tagged by You" value={String(taggedCount)} sub={`/ ${transactions.length}`} />
          </div>

          {/* SEARCH + FILTERS */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                <Input placeholder="Search transactions…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, height: 38, fontSize: 13 }} />
                {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={13} /></button>}
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                <SlidersHorizontal size={13} /> Filters
                {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: showFilters ? "#00D4FF" : "#0A2540", flexShrink: 0 }} />}
              </button>
              {hasFilters && <button onClick={clearEntityAndFilters} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} /> Clear</button>}
            </div>

            {showFilters && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Direction</span>
                  {["All","Credit","Debit"].map(d => <FilterPill key={d} label={d} active={direction === d} onClick={() => { setDirection(d); setPage(1); }} />)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Category</span>
                  {CATEGORIES_FILTER.map(c => <FilterPill key={c} label={c === "unknown" ? "Untagged" : c} active={category === c} onClick={() => { setCategory(c); setPage(1); }} />)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 70 }}>Tagged</span>
                  <FilterPill label="Human-tagged only" active={showTaggedOnly} onClick={() => { setShowTaggedOnly(!showTaggedOnly); setPage(1); }} />
                </div>
              </div>
            )}
          </div>

          {/* TABLE */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>

            {/* ── DESKTOP TABLE (hidden on mobile via CSS) ── */}
            <div className="tx-desktop-table">
              <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                {["","Description","Category","Account","Date","Amount",""].map((h, i) => (
                  <p key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</p>
                ))}
              </div>

              {paginated.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center" as const }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No transactions found.</p>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try adjusting your filters or search query.</p>
                </div>
              ) : paginated.map((tx, i) => {
                const isUnknown  = tx.category === "unknown";
                const justTagged = recentlyTagged.has(tx.id);
                const txEntity   = ENTITIES.find(e => e.id === tx.entity_id);
                return (
                  <div key={tx.id}
                    style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "13px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", background: justTagged ? "rgba(16,185,129,0.03)" : isUnknown ? "rgba(245,158,11,0.02)" : "transparent", transition: "background 0.15s", position: "relative" as const }}
                    onMouseEnter={e => { if (!justTagged && !isUnknown) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                    onMouseLeave={e => { if (!justTagged && !isUnknown) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                      {tx.is_internal_transfer ? <ArrowLeftRight size={12} style={{ color: "#38BDF8" }} /> : tx.direction === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    </div>
                    <div style={{ minWidth: 0, paddingRight: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" as const }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</p>
                        {tx.is_recurring && <Repeat2 size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                        {tx.is_internal_transfer && <span style={{ fontSize: 9, fontWeight: 700, color: "#38BDF8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Internal</span>}
                        {tx.flags.includes("round_number_suspicious") && <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Flag</span>}
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
                    <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{tx.account.split(" ")[0]}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(tx.date)}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, textAlign: "right" as const, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>{tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}</p>
                    <div style={{ display: "flex", justifyContent: "flex-end", position: "relative" as const }}>
                      {justTagged ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981" }}><CheckCircle2 size={13} /> Tagged</div>
                      ) : (
                        <button onClick={() => setOpenTagId(openTagId === tx.id ? null : tx.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1.5px solid", borderColor: isUnknown ? "#F59E0B" : openTagId === tx.id ? "#0A2540" : "#E5E7EB", background: isUnknown ? "#FFFBEB" : openTagId === tx.id ? "#0A2540" : "white", color: isUnknown ? "#D97706" : openTagId === tx.id ? "white" : "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                          <Tag size={10} />{tx.user_tag ? "Retag" : "Tag"}
                        </button>
                      )}
                      {openTagId === tx.id && (
                        <TagDropdown tx={tx} currentTag={tx.user_tag} onTag={(tag, cp) => applyTag(tx.id, tag, cp)} onClose={() => setOpenTagId(null)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── MOBILE CARDS (hidden on desktop via CSS) ── */}
            <div className="tx-mobile-list">
              {paginated.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center" as const }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No transactions found.</p>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try adjusting your filters or search query.</p>
                </div>
              ) : paginated.map((tx, i) => {
                const isUnknown  = tx.category === "unknown";
                const justTagged = recentlyTagged.has(tx.id);
                const txEntity   = ENTITIES.find(e => e.id === tx.entity_id);
                return (
                  <div key={tx.id} style={{ padding: "14px 16px", borderBottom: i < paginated.length - 1 ? "1px solid #F3F4F6" : "none", background: justTagged ? "rgba(16,185,129,0.03)" : isUnknown ? "rgba(245,158,11,0.02)" : "white" }}>

                    {/* Row 1: icon + description + amount */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                        {tx.is_internal_transfer ? <ArrowLeftRight size={13} style={{ color: "#38BDF8" }} /> : tx.direction === "credit" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1, minWidth: 0 }}>{tx.description}</p>
                          {tx.is_recurring && <Repeat2 size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                          {tx.flags.includes("round_number_suspicious") && <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>Flag</span>}
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(tx.date)} · {tx.account.split(" ")[0]}</p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>{tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}</p>
                    </div>

                    {/* Row 2: category + entity + tag button */}
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
                      <div style={{ position: "relative" as const, flexShrink: 0 }}>
                        {justTagged ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981" }}><CheckCircle2 size={13} /> Tagged</div>
                        ) : (
                          <button onClick={() => setOpenTagId(openTagId === tx.id ? null : tx.id)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1.5px solid", borderColor: isUnknown ? "#F59E0B" : openTagId === tx.id ? "#0A2540" : "#E5E7EB", background: isUnknown ? "#FFFBEB" : openTagId === tx.id ? "#0A2540" : "white", color: isUnknown ? "#D97706" : openTagId === tx.id ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                            <Tag size={11} />{tx.user_tag ? "Retag" : "Tag"}
                          </button>
                        )}
                        {openTagId === tx.id && (
                          <TagDropdown tx={tx} currentTag={tx.user_tag} onTag={(tag, cp) => applyTag(tx.id, tag, cp)} onClose={() => setOpenTagId(null)} />
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D1D5DB" : "#374151" }}><ChevronLeft size={15} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid", borderColor: page === p ? "#0A2540" : "#E5E7EB", background: page === p ? "#0A2540" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D1D5DB" : "#374151" }}><ChevronRight size={15} /></button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div style={{ background: "#0A2540", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={16} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.02em", marginBottom: 2 }}>Tags improve your financial scores.</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Your tags are applied on the next pipeline run and override the system's category. They directly improve Expense Discipline, Cashflow Predictability, and Risk Profile accuracy.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Fix missing import for franchise no-data state
function Share2({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
