"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2, Pencil, Trash2, CheckCircle2, AlertCircle,
  FileSignature, Receipt, Plus, X, Save,
  Loader2, Info, Lock, ChevronRight, RefreshCw,
  ArrowUpRight, ExternalLink, Mail, Share2, MapPin,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { UndoToast } from "@/components/ui/undo-toast";

/* ─────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────── */
const SECTOR_OPTIONS = [
  "Agriculture & Crop Farming","Agro-processing & Milling","Fisheries & Aquaculture","Livestock & Animal Husbandry","Forestry & Timber","Horticulture & Floriculture",
  "Food & Beverage Manufacturing","Restaurant & Catering","Bakery & Confectionery","Packaged Foods & FMCG",
  "Retail & Consumer Goods","Wholesale & Distribution","E-commerce & Online Retail","Import & Export","Supermarkets & Grocery","Market Traders & Kiosk",
  "Manufacturing & Industrial","Textile & Garment","Leather & Footwear","Plastics & Rubber","Chemical & Cleaning Products","Furniture & Wood Products","Metal Fabrication & Steel","Printing & Packaging","Automotive Parts & Assembly",
  "Construction & Civil Engineering","Real Estate & Property Development","Building Materials & Hardware","Interior Design & Fit-out","Facility Management",
  "Logistics & Freight","Haulage & Trucking","Last-mile Delivery","Ride-hailing & Mobility","Maritime & Shipping","Aviation & Air Cargo",
  "Software & SaaS","Fintech & Payments","Edtech","Healthtech","Agritech","Logistics Tech","Telecommunications","Hardware & Electronics","Cybersecurity","Cryptocurrency & Web3",
  "Consulting & Advisory","Legal & Compliance","Accounting & Audit","Human Resources & Recruitment","Marketing & Advertising","Market Research & Analytics","Architecture & Engineering",
  "Healthcare & Clinics","Pharmaceuticals & Medical Supplies","Dental & Optical Services","Mental Health & Wellness","Veterinary Services",
  "Education & Schools","Vocational & Skills Training","Tutoring & Test Prep","Childcare & Early Learning",
  "Energy & Power","Solar & Renewables","Oil & Gas Services","Waste Management & Recycling","Water & Sanitation",
  "Hotels & Hospitality","Travel & Tourism","Events & Entertainment","Sports & Fitness","Fashion & Apparel","Beauty & Personal Care","Photography & Videography","Arts, Crafts & Creative",
  "Media & Publishing","Film & Music Production","Digital Content & Influencer",
  "Financial Services","Insurance","Microfinance & Cooperative","Pension & Investment",
  "Mining & Solid Minerals","Quarrying & Aggregates",
  "Security Services","Fire Safety & Equipment",
  "Non-profit & NGO","Religious & Faith-Based","Government & Public Sector","Social Enterprise",
  "Other",
];

const FROM_REGISTRATION = {
  name:            { value: "Aduke Bakeries Ltd." },
  business_status: { value: "registered" },
  sector:          { value: "Food & Beverage" },
};
const FROM_KEYCLOAK = { owner_name: "Ada Okonkwo", owner_email: "ada@adukebakeries.ng" };
const FROM_DOCUMENTS = {
  rc_number: { value: "RC-1234567", source_doc: "CAC_Certificate_Aduke_Bakeries.pdf", verified: true },
  directors: [
    { name: "Ada Okonkwo",   role: "CEO & Director",     verified: true  },
    { name: "Emeka Okonkwo", role: "Operations Director", verified: false },
  ],
};
const CAPITAL_LABELS: Record<string, string> = {
  working_capital_loan: "Working Capital Loan",
  invoice_financing:    "Invoice Financing",
  revenue_advance:      "Revenue Advance",
  equipment_financing:  "Equipment Financing",
  term_loan:            "Term Loan",
  overdraft_facility:   "Overdraft Facility",
};
const ALL_CAPITAL_TYPES = Object.keys(CAPITAL_LABELS);

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface Supplier      { id: string; name: string; category: string; monthly_spend: number; tx_count: number; confidence: number; confirmed: boolean; }
interface Contract      { id: string; client: string; type: string; value_monthly: number; start: string; end: string; status: "active" | "expired"; }
interface Receivable    { id: string; client: string; amount: number; due_date: string; status: "current" | "overdue"; from_pipeline: boolean; }
interface Equipment     { id: string; name: string; model: string; purchase_year: number; est_value: number; condition: string; }
interface InventoryItem { id: string; item: string; qty: number; unit: string; value: number; }
interface CustomCategory{ id: string; name: string; description: string; doc_ref?: string; }

interface Branch {
  id: string;
  name: string;
  type: "branch" | "franchise" | "office" | "warehouse" | "other";
  location: string;
  manager?: string;
  established?: string;
  /**
   * Franchises are separate legal entities — they have their own CAC, accounts,
   * and books. They are added here to declare the operating relationship.
   * To include their financials, they must accept a data-sharing invitation.
   *
   * Branches/offices/warehouses share the same legal entity as HQ.
   * The owner assigns a dedicated bank account to them in Data Sources.
   */
  invite_email?: string;
  invite_status?: "none" | "sent" | "accepted";
}

type ModalState =
  | { type: "add_contract" }
  | { type: "edit_contract";  item: Contract }
  | { type: "add_receivable" }
  | { type: "add_equipment" }
  | { type: "edit_equipment"; item: Equipment }
  | { type: "add_inventory" }
  | { type: "edit_inventory"; item: InventoryItem }
  | { type: "edit_supplier";  item: Supplier }
  | { type: "add_capital" }
  | { type: "add_branch" }
  | { type: "edit_branch";    item: Branch }
  | { type: "add_custom_category" }
  | null;

type PendingDelete = { label: string; description: string; onConfirm: () => void; };

/* ─────────────────────────────────────────────────────────
   INITIAL DATA
───────────────────────────────────────────────────────── */
const INIT_SUPPLIERS: Supplier[] = [
  { id: "sup_001", name: "Flour Mills Nigeria",    category: "Raw materials", monthly_spend: 480000, tx_count: 36, confidence: 0.97, confirmed: false },
  { id: "sup_002", name: "Dangote Sugar Refinery", category: "Raw materials", monthly_spend: 220000, tx_count: 24, confidence: 0.94, confirmed: false },
  { id: "sup_003", name: "Lagos Cold Chain Ltd.",  category: "Logistics",     monthly_spend: 120000, tx_count: 18, confidence: 0.89, confirmed: false },
];
const INIT_CONTRACTS: Contract[] = [
  { id: "con_001", client: "Jumia Food",          type: "Supply agreement",  value_monthly: 850000,  start: "Jan 2024", end: "Dec 2024", status: "active"  },
  { id: "con_002", client: "Lagos State Canteen", type: "Catering contract", value_monthly: 620000,  start: "Jul 2024", end: "Jun 2025", status: "active"  },
  { id: "con_003", client: "Shoprite Nigeria",    type: "Wholesale supply",  value_monthly: 1200000, start: "Mar 2023", end: "Feb 2024", status: "expired" },
];
const INIT_RECEIVABLES: Receivable[] = [
  { id: "rec_001", client: "Jumia Food",          amount: 340000, due_date: "Jan 5, 2025",  status: "current", from_pipeline: true  },
  { id: "rec_002", client: "Lagos State Canteen", amount: 620000, due_date: "Dec 31, 2024", status: "overdue", from_pipeline: false },
];
const INIT_EQUIPMENT: Equipment[] = [
  { id: "eq_001", name: "Industrial Bread Oven",  model: "Miwe Roll-in", purchase_year: 2021, est_value: 4500000, condition: "Good"      },
  { id: "eq_002", name: "Commercial Dough Mixer", model: "Hobart A200",  purchase_year: 2020, est_value: 1800000, condition: "Good"      },
  { id: "eq_003", name: "Delivery Van",           model: "Toyota Hiace", purchase_year: 2022, est_value: 6200000, condition: "Excellent" },
];
const INIT_INVENTORY: InventoryItem[] = [
  { id: "inv_001", item: "All-purpose flour (50kg bags)", qty: 120,  unit: "bags",  value: 960000  },
  { id: "inv_002", item: "Sugar (25kg bags)",             qty: 80,   unit: "bags",  value: 320000  },
  { id: "inv_003", item: "Packaged bread (loaves)",       qty: 2400, unit: "units", value: 1200000 },
];
const INIT_CAPITAL = ["working_capital_loan", "invoice_financing", "revenue_advance"];

const INIT_BRANCHES: Branch[] = [
  {
    id: "br_001",
    name: "Lekki Store",
    type: "branch",
    location: "Lekki Phase 1, Lagos",
    manager: "Funmi Adeleke",
    established: "2022",
    invite_status: "none",   // branches don't need invitations — same legal entity
  },
  {
    id: "fr_001",
    name: "Abuja Franchise",
    type: "franchise",
    location: "Wuse 2, Abuja",
    manager: "Chukwudi Eze",
    established: "2023",
    invite_email: "chukwudi@abujafranchise.ng",
    invite_status: "sent",   // invitation sent, awaiting acceptance
  },
];

const INIT_CUSTOM_CATEGORIES: CustomCategory[] = [];

const BRANCH_TYPE_LABELS: Record<Branch["type"], string> = {
  branch: "Branch", franchise: "Franchise", office: "Office", warehouse: "Warehouse", other: "Other",
};
const BRANCH_TYPE_COLORS: Record<Branch["type"], { bg: string; color: string; border: string }> = {
  branch:    { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  franchise: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  office:    { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  warehouse: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  other:     { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${(n / 1_000).toFixed(0)}K`;
}
function uid() { return Math.random().toString(36).slice(2, 9); }

/* ─────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}
function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F3F4F6", gap: 12, flexWrap: "wrap" as const }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
function OriginTag({ origin, link }: { origin: "registration" | "document" | "pipeline" | "account"; link?: string }) {
  const config = {
    registration: { label: "From registration", color: "#6B7280", bg: "#F3F4F6" },
    document:     { label: "From document",      color: "#3B82F6", bg: "#EFF6FF" },
    pipeline:     { label: "System-derived",     color: "#00A8CC", bg: "rgba(0,212,255,0.08)" },
    account:      { label: "From account",       color: "#6B7280", bg: "#F3F4F6" },
  }[origin];
  const inner = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: config.color, background: config.bg, padding: "2px 7px", borderRadius: 9999 }}>
      {origin === "pipeline"     && <RefreshCw    size={9} />}
      {origin === "document"     && <ExternalLink size={9} />}
      {origin === "registration" && <Lock         size={9} />}
      {config.label}
    </span>
  );
  if (link) return <Link href={link} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}
function FieldRow({ label, value, editable = false, origin, originLink, placeholder }: {
  label: string; value: string; editable?: boolean;
  origin: "registration" | "document" | "pipeline" | "account";
  originLink?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const isLocked = origin === "registration" || origin === "account";
  return (
    <div className="bp-field-row" style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: "1px solid #F9FAFB", gap: 12 }}>
      <div className="bp-field-label">
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
        <OriginTag origin={origin} link={originLink} />
      </div>
      {editing ? (
        <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" as const }}>
          <Input value={val} onChange={e => setVal(e.target.value)} style={{ height: 34, fontSize: 13, flex: 1, minWidth: 120 }} autoFocus placeholder={placeholder} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setEditing(false)} style={{ padding: "0 12px", height: 34, borderRadius: 7, border: "none", background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
            <button onClick={() => { setVal(value); setEditing(false); }} style={{ padding: "0 10px", height: 34, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "space-between", minWidth: 0 }}>
          <p style={{ fontSize: 13, color: val ? "#374151" : "#D1D5DB", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{val || placeholder || "—"}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {isLocked && <Lock size={11} style={{ color: "#D1D5DB" }} />}
            {editable && !isLocked && (
              <button onClick={() => setEditing(true)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}>
                <Pencil size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ITEM MODAL
───────────────────────────────────────────────────────── */
function ItemModal({ title, fields, initial = {}, onSave, onClose }: {
  title: string;
  fields: { label: string; key: string; type?: string; placeholder?: string }[];
  initial?: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    onSave(values);
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{f.label}</label>
              <Input type={f.type ?? "text"} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} style={{ height: 40, fontSize: 13 }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
            <Button variant="primary" onClick={handleSave} disabled={loading} style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
              {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DELETE BUTTON
───────────────────────────────────────────────────────── */
function DelBtn({ onRequest }: { onRequest: () => void }) {
  return (
    <button title="Delete" onClick={onRequest}
      style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}>
      <Trash2 size={11} />
    </button>
  );
}

const TABS = [
  { id: "profile",     label: "Business Profile" },
  { id: "operational", label: "Operational Data" },
];

/* ─────────────────────────────────────────────────────────
   BRANCH FORM
   ─────────────
   Two-step for franchises:
     Step 1 → Entity details (name, type, location, manager, year)
     Step 2 → Data sharing setup (invitation email)
   One-step for all other types (branch, office, warehouse, other).

   The distinction matters because:
   • Branches share the same legal entity as HQ. The owner simply
     assigns a dedicated bank account to them in Data Sources.
     No invitation needed — they're the same business.
   • Franchises are independent legal entities. Their financials
     live in a separate Creditlinker account. An invitation must
     be sent so they can consent to share data.
───────────────────────────────────────────────────────── */
function BranchForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Branch;
  onSave: (vals: Omit<Branch, "id">) => void;
  onClose: () => void;
}) {
  const [step,        setStep]        = useState<1 | 2>(1);
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [type,        setType]        = useState<Branch["type"]>(initial?.type ?? "branch");
  const [location,    setLocation]    = useState(initial?.location    ?? "");
  const [manager,     setManager]     = useState(initial?.manager     ?? "");
  const [established, setEstablished] = useState(initial?.established ?? "");
  const [inviteEmail, setInviteEmail] = useState(initial?.invite_email ?? "");
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [loading,     setLoading]     = useState(false);

  const isFranchise = type === "franchise";

  // Step 1 save — if franchise, move to step 2; otherwise save & close
  const handleStep1Save = async () => {
    if (!name || !location) return;
    if (isFranchise && !initial) {
      // New franchise → proceed to invitation step
      setStep(2);
    } else {
      // Branch / edit → save immediately
      setLoading(true);
      await new Promise(r => setTimeout(r, 700));
      setLoading(false);
      onSave({ name, type, location, manager: manager || undefined, established: established || undefined, invite_status: initial?.invite_status ?? "none", invite_email: initial?.invite_email });
    }
  };

  // Step 2: send invitation
  const handleSendInvite = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1100));
    setSending(false);
    setSent(true);
    // TODO: POST /business/franchise-invitations { entity_name: name, email: inviteEmail }
  };

  // Step 2: skip invitation (they might want to add it later)
  const handleSkip = () => {
    onSave({ name, type, location, manager: manager || undefined, established: established || undefined, invite_status: "none" });
  };

  // Step 2: finish after sending
  const handleDone = () => {
    onSave({ name, type, location, manager: manager || undefined, established: established || undefined, invite_email: inviteEmail || undefined, invite_status: sent ? "sent" : "none" });
  };

  /* ── STEP 2: FRANCHISE DATA SHARING SETUP ── */
  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
        {[{ n: 1, label: "Entity details" }, { n: 2, label: "Data sharing" }].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.n <= step ? "#0A2540" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: s.n <= step ? "white" : "#9CA3AF" }}>
                {s.n < step ? <CheckCircle size={11} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: s.n === step ? 700 : 500, color: s.n === step ? "#0A2540" : "#9CA3AF" }}>{s.label}</span>
            </div>
            {i === 0 && <div style={{ flex: 1, height: 1, background: step > 1 ? "#0A2540" : "#E5E7EB", maxWidth: 40 }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Summary of what was just added */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "white", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#C2410C" }}>
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{name}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{location}</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#C2410C", background: "#FFF7ED", border: "1px solid #FED7AA", padding: "2px 8px", borderRadius: 9999 }}>Franchise</span>
        </div>

        {/* Explainer */}
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
          <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.7 }}>
            <strong>Franchises are separate legal entities.</strong> They have their own CAC registration, bank accounts, and books.
            To include their financials in your consolidated view, they need to connect their own Creditlinker account and consent to share data with you.
            Send them an invitation to get started.
          </p>
        </div>

        {/* How it works steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { step: "1", label: "You send an invitation",      sub: `An email goes to ${name}'s Creditlinker account holder.` },
            { step: "2", label: "They create / log into their account", sub: "They have their own Creditlinker profile as an independent business." },
            { step: "3", label: "They link accounts & consent", sub: "They connect their bank and approve data sharing with you." },
            { step: "4", label: "Their data flows in",          sub: "Financials appear in your consolidated view and per-entity analysis." },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800, color: "white", marginTop: 1 }}>{s.step}</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Email input */}
        {!sent ? (
          <>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>
                Franchise owner's email <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span>
              </label>
              <Input
                type="email"
                placeholder={`e.g. owner@${name.toLowerCase().replace(/\s+/g, "")}.ng`}
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                style={{ height: 40, fontSize: 13 }}
              />
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>We'll email them a link to set up data sharing. You can also invite them later from Data Sources.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSkip} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
                Skip for now
              </button>
              <Button variant="primary" onClick={handleSendInvite} disabled={!inviteEmail || sending} style={{ flex: 2, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
                {sending
                  ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                  : <><Mail size={13} /> Send invitation</>
                }
              </Button>
            </div>
          </>
        ) : (
          /* Sent confirmation */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, padding: "16px 16px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10 }}>
              <CheckCircle2 size={20} style={{ color: "#10B981", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", marginBottom: 2 }}>Invitation sent to {inviteEmail}</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                  {name} will appear in your entity list with "Invite pending" status. Once they accept and link their account, their financials will flow into your consolidated view automatically.
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={handleDone} style={{ height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
              <CheckCircle2 size={13} /> Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── STEP 1: ENTITY DETAILS ── */
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Step indicator only for adding (not editing) */}
      {!initial && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
          {[{ n: 1, label: "Entity details" }, { n: 2, label: "Data sharing" }].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.n === 1 ? "#0A2540" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: s.n === 1 ? "white" : "#9CA3AF" }}>{s.n}</div>
                <span style={{ fontSize: 12, fontWeight: s.n === 1 ? 700 : 500, color: s.n === 1 ? "#0A2540" : "#9CA3AF" }}>{s.label}</span>
              </div>
              {i === 0 && <div style={{ flex: 1, height: 1, background: "#E5E7EB", maxWidth: 40 }} />}
            </React.Fragment>
          ))}
          {isFranchise && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#C2410C", fontWeight: 600, background: "#FFF7ED", border: "1px solid #FED7AA", padding: "2px 8px", borderRadius: 9999 }}>
              Separate legal entity
            </span>
          )}
        </div>
      )}

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Franchise notice */}
        {isFranchise && !initial && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 9 }}>
            <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
              Franchises are independent businesses. After adding, you'll be able to send them a data-sharing invitation on the next step.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lekki Store, Abuja Franchise" style={{ height: 40, fontSize: 13 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Type</label>
          <div className="bp-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
            {(["branch","franchise","office","warehouse","other"] as const).map(t => {
              const tc = BRANCH_TYPE_COLORS[t];
              return (
                <button key={t} onClick={() => setType(t)}
                  style={{ padding: "8px 0", borderRadius: 7, border: "1.5px solid", borderColor: type === t ? tc.color : "#E5E7EB", background: type === t ? tc.bg : "white", color: type === t ? tc.color : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", textTransform: "capitalize" as const }}>
                  {BRANCH_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
          {/* Contextual explanation below type selector */}
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
            {type === "franchise"
              ? "Franchises are separate legal entities. You'll invite them to share financial data on the next step."
              : "Branches, offices, and warehouses share your legal entity. Assign them a dedicated bank account in Data Sources."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Address / Location *</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos" style={{ height: 40, fontSize: 13 }} />
        </div>

        <div className="bp-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Manager <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span></label>
            <Input value={manager} onChange={e => setManager(e.target.value)} placeholder="Name" style={{ height: 40, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Year established <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span></label>
            <Input type="number" value={established} onChange={e => setEstablished(e.target.value)} placeholder="e.g. 2021" style={{ height: 40, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
          <Button variant="primary" onClick={handleStep1Save} disabled={!name || !location || loading}
            style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
              : isFranchise && !initial
              ? <>Continue →</>
              : <><Save size={13} /> Save location</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CUSTOM CATEGORY FORM
───────────────────────────────────────────────────────── */
function CustomCategoryForm({ onSave, onClose }: {
  onSave: (vals: Omit<CustomCategory, "id">) => void;
  onClose: () => void;
}) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    onSave({ name, description });
  };
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
        <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>After adding a custom category, upload supporting documents at <strong>Documents → Other Supporting Documents</strong> to back it with evidence.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Category name *</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cold Chain Assets, Solar Equipment, Livestock" style={{ height: 40, fontSize: 13 }} autoFocus />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Description <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What this category covers and why it's relevant…" rows={3}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
        <Button variant="primary" onClick={handleSave} disabled={!name || loading} style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
          {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Add category</>}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BRANCH ROW STATUS CHIP
───────────────────────────────────────────────────────── */
function BranchStatusChip({ branch, onResendInvite }: {
  branch: Branch;
  onResendInvite: (id: string) => void;
}) {
  if (branch.type !== "franchise") {
    // Non-franchise: same legal entity — data comes from account assignment
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 9999 }}>
        Same entity
      </span>
    );
  }
  // Franchise states
  if (branch.invite_status === "accepted") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 9999 }}>
        <CheckCircle2 size={9} /> Data linked
      </span>
    );
  }
  if (branch.invite_status === "sent") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "1px solid #FCD34D", padding: "2px 8px", borderRadius: 9999 }}>
          Invite pending
        </span>
        <button
          onClick={() => onResendInvite(branch.id)}
          style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2, padding: 0 }}>
          Resend
        </button>
      </div>
    );
  }
  // invite_status === "none" — not yet invited
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>
      Not invited
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const [suppliers,        setSuppliers]        = useState<Supplier[]>(INIT_SUPPLIERS);
  const [contracts,        setContracts]        = useState<Contract[]>(INIT_CONTRACTS);
  const [receivables,      setReceivables]      = useState<Receivable[]>(INIT_RECEIVABLES);
  const [equipment,        setEquipment]        = useState<Equipment[]>(INIT_EQUIPMENT);
  const [inventory,        setInventory]        = useState<InventoryItem[]>(INIT_INVENTORY);
  const [capital,          setCapital]          = useState<string[]>(INIT_CAPITAL);
  const [branches,         setBranches]         = useState<Branch[]>(INIT_BRANCHES);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(INIT_CUSTOM_CATEGORIES);
  const [sector,           setSector]           = useState(FROM_REGISTRATION.sector.value);
  const [sectorEditing,    setSectorEditing]    = useState(false);

  const [modal,         setModal]         = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [undoToast,     setUndoToast]     = useState<{ message: string; restore: () => void } | null>(null);

  function softDelete<T extends { id: string }>(
    items: T[], id: string, setItems: React.Dispatch<React.SetStateAction<T[]>>,
    label: string, description: string,
  ) {
    const idx = items.findIndex(x => x.id === id);
    const item = items[idx];
    if (!item) return;
    setPendingDelete({
      label, description,
      onConfirm: () => {
        setItems(prev => prev.filter(x => x.id !== id));
        setUndoToast({ message: `"${label}" deleted`, restore: () => setItems(prev => { const n = [...prev]; n.splice(idx, 0, item); return n; }) });
        setPendingDelete(null);
      },
    });
  }

  const confirmSupplier          = (id: string) => setSuppliers(s => s.map(x => x.id === id ? { ...x, confirmed: true } : x));
  const requestDeleteSupplier    = (id: string) => softDelete(suppliers,        id, setSuppliers,        suppliers.find(x=>x.id===id)?.name         ?? "Supplier",        "This supplier will be removed from your profile.");
  const requestDeleteContract    = (id: string) => softDelete(contracts,        id, setContracts,        contracts.find(x=>x.id===id)?.client       ?? "Contract",        "This contract will be removed from your profile.");
  const requestDeleteReceivable  = (id: string) => softDelete(receivables,      id, setReceivables,      receivables.find(x=>x.id===id)?.client     ?? "Receivable",       "This receivable will be removed from your profile.");
  const requestDeleteEquipment   = (id: string) => softDelete(equipment,        id, setEquipment,        equipment.find(x=>x.id===id)?.name         ?? "Equipment",       "This asset will be removed from your profile.");
  const requestDeleteInventory   = (id: string) => softDelete(inventory,        id, setInventory,        inventory.find(x=>x.id===id)?.item         ?? "Item",            "This inventory item will be removed from your profile.");
  const requestDeleteBranch      = (id: string) => softDelete(branches,         id, setBranches,         branches.find(x=>x.id===id)?.name          ?? "Branch",          "This branch will be removed from your profile.");
  const requestDeleteCustomCategory = (id: string) => softDelete(customCategories, id, setCustomCategories, customCategories.find(x=>x.id===id)?.name ?? "Custom category", "This custom category will be removed.");

  const handleResendInvite = (id: string) => {
    // TODO: POST /business/franchise-invitations/:id/resend
    alert("Invitation resent.");
  };

  const removeCapital = (cat: string) => {
    const idx = capital.indexOf(cat);
    const label = CAPITAL_LABELS[cat] ?? cat;
    setPendingDelete({
      label, description: `"${label}" will be removed from your capital preferences.`,
      onConfirm: () => {
        setCapital(prev => prev.filter(x => x !== cat));
        setUndoToast({ message: `"${label}" preference removed`, restore: () => setCapital(prev => { const n = [...prev]; n.splice(idx, 0, cat); return n; }) });
        setPendingDelete(null);
      },
    });
  };

  return (
    <>
      {pendingDelete && (
        <ConfirmDeleteModal title={`Delete ${pendingDelete.label}?`} description={pendingDelete.description} onConfirm={pendingDelete.onConfirm} onClose={() => setPendingDelete(null)} />
      )}
      {undoToast && (
        <UndoToast message={undoToast.message} onUndo={() => { undoToast.restore(); setUndoToast(null); }} onDismiss={() => setUndoToast(null)} />
      )}

      {/* ITEM MODALS */}
      {modal?.type === "edit_supplier" && (
        <ItemModal title="Edit supplier"
          fields={[{ label: "Supplier name", key: "name", placeholder: "e.g. Flour Mills Nigeria" }, { label: "Category", key: "category", placeholder: "e.g. Raw materials" }, { label: "Monthly spend (₦)", key: "monthly_spend", type: "number" }]}
          initial={{ name: modal.item.name, category: modal.item.category, monthly_spend: String(modal.item.monthly_spend) }}
          onSave={v => setSuppliers(s => s.map(x => x.id === modal.item.id ? { ...x, name: v.name ?? x.name, category: v.category ?? x.category, monthly_spend: Number(v.monthly_spend) || x.monthly_spend } : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_contract" && (
        <ItemModal title="Add client contract"
          fields={[{ label: "Client name", key: "client", placeholder: "e.g. Jumia Food" }, { label: "Contract type", key: "type", placeholder: "e.g. Supply agreement" }, { label: "Monthly value (₦)", key: "value_monthly", type: "number", placeholder: "0" }, { label: "Start date", key: "start", placeholder: "e.g. Jan 2024" }, { label: "End date", key: "end", placeholder: "e.g. Dec 2024" }]}
          onSave={v => setContracts(s => [...s, { id: uid(), client: v.client ?? "", type: v.type ?? "", value_monthly: Number(v.value_monthly) || 0, start: v.start ?? "", end: v.end ?? "", status: "active" }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_contract" && (
        <ItemModal title="Edit contract"
          fields={[{ label: "Client name", key: "client" }, { label: "Contract type", key: "type" }, { label: "Monthly value (₦)", key: "value_monthly", type: "number" }, { label: "Start date", key: "start" }, { label: "End date", key: "end" }]}
          initial={{ client: modal.item.client, type: modal.item.type, value_monthly: String(modal.item.value_monthly), start: modal.item.start, end: modal.item.end }}
          onSave={v => setContracts(s => s.map(x => x.id === modal.item.id ? { ...x, ...v, value_monthly: Number(v.value_monthly) || x.value_monthly } as Contract : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_receivable" && (
        <ItemModal title="Add receivable"
          fields={[{ label: "Client name", key: "client", placeholder: "e.g. Lagos State Canteen" }, { label: "Amount (₦)", key: "amount", type: "number", placeholder: "0" }, { label: "Due date", key: "due_date", placeholder: "e.g. Jan 15, 2025" }]}
          onSave={v => setReceivables(s => [...s, { id: uid(), client: v.client ?? "", amount: Number(v.amount) || 0, due_date: v.due_date ?? "", status: "current", from_pipeline: false }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_equipment" && (
        <ItemModal title="Add equipment"
          fields={[{ label: "Equipment name", key: "name", placeholder: "e.g. Industrial Oven" }, { label: "Model", key: "model", placeholder: "e.g. Miwe Roll-in" }, { label: "Purchase year", key: "purchase_year", type: "number", placeholder: "2023" }, { label: "Est. value (₦)", key: "est_value", type: "number", placeholder: "0" }, { label: "Condition", key: "condition", placeholder: "Good / Fair / Excellent" }]}
          onSave={v => setEquipment(s => [...s, { id: uid(), name: v.name ?? "", model: v.model ?? "", purchase_year: Number(v.purchase_year) || 0, est_value: Number(v.est_value) || 0, condition: v.condition ?? "" }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_equipment" && (
        <ItemModal title="Edit equipment"
          fields={[{ label: "Equipment name", key: "name" }, { label: "Model", key: "model" }, { label: "Purchase year", key: "purchase_year", type: "number" }, { label: "Est. value (₦)", key: "est_value", type: "number" }, { label: "Condition", key: "condition" }]}
          initial={{ name: modal.item.name, model: modal.item.model, purchase_year: String(modal.item.purchase_year), est_value: String(modal.item.est_value), condition: modal.item.condition }}
          onSave={v => setEquipment(s => s.map(x => x.id === modal.item.id ? { ...x, name: v.name ?? x.name, model: v.model ?? x.model, purchase_year: Number(v.purchase_year) || x.purchase_year, est_value: Number(v.est_value) || x.est_value, condition: v.condition ?? x.condition } : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_inventory" && (
        <ItemModal title="Add inventory item"
          fields={[{ label: "Item name", key: "item", placeholder: "e.g. All-purpose flour (50kg)" }, { label: "Quantity", key: "qty", type: "number", placeholder: "0" }, { label: "Unit", key: "unit", placeholder: "bags, units, kg…" }, { label: "Est. value (₦)", key: "value", type: "number", placeholder: "0" }]}
          onSave={v => setInventory(s => [...s, { id: uid(), item: v.item ?? "", qty: Number(v.qty) || 0, unit: v.unit ?? "", value: Number(v.value) || 0 }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_inventory" && (
        <ItemModal title="Edit inventory item"
          fields={[{ label: "Item name", key: "item" }, { label: "Quantity", key: "qty", type: "number" }, { label: "Unit", key: "unit" }, { label: "Est. value (₦)", key: "value", type: "number" }]}
          initial={{ item: modal.item.item, qty: String(modal.item.qty), unit: modal.item.unit, value: String(modal.item.value) }}
          onSave={v => setInventory(s => s.map(x => x.id === modal.item.id ? { ...x, item: v.item ?? x.item, qty: Number(v.qty) || x.qty, unit: v.unit ?? x.unit, value: Number(v.value) || x.value } : x))}
          onClose={() => setModal(null)} />
      )}

      {/* BRANCH MODAL — variable width because step 2 is taller */}
      {(modal?.type === "add_branch" || modal?.type === "edit_branch") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "92vh", overflowY: "auto" as const }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>
                {modal.type === "add_branch" ? "Add branch / location" : "Edit branch"}
              </p>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
            </div>
            <BranchForm
              initial={modal.type === "edit_branch" ? modal.item : undefined}
              onSave={vals => {
                if (modal.type === "add_branch") setBranches(b => [...b, { id: uid(), ...vals }]);
                else setBranches(b => b.map(x => x.id === (modal as { type: "edit_branch"; item: Branch }).item.id ? { ...x, ...vals } : x));
                setModal(null);
              }}
              onClose={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {/* CUSTOM CATEGORY MODAL */}
      {modal?.type === "add_custom_category" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Add custom data category</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Define a category not covered by the standard list.</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
            </div>
            <CustomCategoryForm onSave={vals => { setCustomCategories(c => [...c, { id: uid(), ...vals }]); setModal(null); }} onClose={() => setModal(null)} />
          </div>
        </div>
      )}

      {/* CAPITAL MODAL */}
      {modal?.type === "add_capital" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Add capital preference</p>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
            </div>
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {ALL_CAPITAL_TYPES.filter(t => !capital.includes(t)).map(t => (
                <button key={t} onClick={() => { setCapital(s => [...s, t]); setModal(null); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 9, border: "1.5px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer", textAlign: "left" as const, transition: "all 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                  {CAPITAL_LABELS[t]}<Plus size={13} style={{ color: "#9CA3AF" }} />
                </button>
              ))}
              {ALL_CAPITAL_TYPES.filter(t => !capital.includes(t)).length === 0 && (
                <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" as const, padding: "12px 0" }}>All capital types already added.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 6 }}>{FROM_REGISTRATION.name.value}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <Badge variant="success">Active</Badge>
              <Badge variant="secondary">CAC Registered</Badge>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>{FROM_REGISTRATION.sector.value}</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="cl-overflow-x-auto">
        <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", width: "fit-content", minWidth: "fit-content" }}>
          {TABS.map((tab, i) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, border: "none", borderRight: i < TABS.length - 1 ? "1px solid #E5E7EB" : "none", background: activeTab === tab.id ? "#0A2540" : "white", color: activeTab === tab.id ? "white" : "#6B7280", cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
              {tab.label}
            </button>
          ))}
        </div>
        </div>

        {/* ── TAB 1: PROFILE ── */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Fields are populated from registration, your uploaded documents, and your Creditlinker account. Locked fields can only change by updating their source.</p>
            </div>
            <Card>
              <CardHeader title="Business Information" sub="Core registration details." />
              <FieldRow label="Business name"   value={FROM_REGISTRATION.name.value} origin="registration" />
              <FieldRow label="Business status" value="CAC Registered"               origin="registration" />
              <div style={{ display: "flex", alignItems: "center", padding: "13px 24px", borderBottom: "1px solid #F9FAFB", gap: 16 }}>
                <div style={{ minWidth: 180, flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>Sector / Industry</p>
                  <OriginTag origin="registration" />
                </div>
                {sectorEditing ? (
                  <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <select value={sector} onChange={e => setSector(e.target.value)} style={{ width: "100%", height: 36, padding: "0 32px 0 10px", borderRadius: 8, border: "1.5px solid #0A2540", fontSize: 13, color: "#0A2540", background: "white", appearance: "none", outline: "none", cursor: "pointer" }}>
                        {SECTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: "#9CA3AF", pointerEvents: "none" }} />
                    </div>
                    <button onClick={() => setSectorEditing(false)} style={{ padding: "0 12px", height: 36, borderRadius: 7, border: "none", background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setSectorEditing(false)} style={{ padding: "0 10px", height: 36, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{sector}</p>
                    <button onClick={() => setSectorEditing(true)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={11} /></button>
                  </div>
                )}
              </div>
              <FieldRow label="RC number" value={FROM_DOCUMENTS.rc_number.value} origin="document" originLink="/documents" />
              <div style={{ padding: "10px 24px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#10B981" }}>
                  <CheckCircle2 size={11} /> Extracted from <span style={{ fontWeight: 600 }}>{FROM_DOCUMENTS.rc_number.source_doc}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Account Owner" sub="From your Creditlinker account. Update via account settings." />
              <FieldRow label="Full name" value={FROM_KEYCLOAK.owner_name}  origin="account" />
              <FieldRow label="Email"     value={FROM_KEYCLOAK.owner_email} origin="account" />
              <div style={{ padding: "12px 24px", borderTop: "1px solid #F9FAFB" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>To update your name or email, <Link href="/settings" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>go to Settings</Link>.</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Directors & Key Principals" sub="Populated from ownership documents at /documents."
                action={<Link href="/documents" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Upload ID <ChevronRight size={12} /></Link>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {FROM_DOCUMENTS.directors.map((dir, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < FROM_DOCUMENTS.directors.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                      {dir.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{dir.name}</p>
                        {dir.verified ? <Badge variant="success" style={{ fontSize: 9 }}>ID Verified</Badge> : <Badge variant="warning" style={{ fontSize: 9 }}>ID Pending</Badge>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{dir.role}</p>
                        <OriginTag origin="document" link="/documents" />
                      </div>
                    </div>
                    {!dir.verified && <Link href="/documents" style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", textDecoration: "underline", textUnderlineOffset: 2, flexShrink: 0 }}>Re-upload ID</Link>}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Capital Preferences" sub="The financing types you are open to receiving." />
              <div style={{ padding: "16px 24px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
                  {capital.map(cat => (
                    <div key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9999, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      {CAPITAL_LABELS[cat] ?? cat}
                      <button onClick={() => removeCapital(cat)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex", lineHeight: 0 }}><X size={11} /></button>
                    </div>
                  ))}
                  <button onClick={() => setModal({ type: "add_capital" })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9999, border: "2px dashed #E5E7EB", background: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                    <Plus size={11} /> Add
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Capital providers matching these types will discover your anonymised profile when open to financing is enabled.</p>
              </div>
            </Card>

            {/* ── BRANCHES, FRANCHISES & LOCATIONS ── */}
            <Card>
              <CardHeader
                title="Branches, Franchises & Locations"
                sub="All operating entities. Branches share your legal entity — assign them a bank account. Franchises are independent — invite them to share data."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_branch" })} style={{ gap: 5 }}><Plus size={12} /> Add location</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {branches.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center" as const }}>
                    <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>No branches or additional locations added yet.</p>
                    <button onClick={() => setModal({ type: "add_branch" })}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "2px dashed #E5E7EB", background: "none", fontSize: 13, fontWeight: 600, color: "#9CA3AF", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                      <Plus size={13} /> Add first location
                    </button>
                  </div>
                ) : branches.map((br, i) => {
                  const tc = BRANCH_TYPE_COLORS[br.type];
                  return (
                    <div key={br.id}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < branches.length - 1 ? "1px solid #F9FAFB" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: tc.bg, border: `1px solid ${tc.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: tc.color }}>
                        {br.name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{br.name}</p>
                          {/* Type chip */}
                          <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}`, padding: "2px 7px", borderRadius: 9999 }}>
                            {BRANCH_TYPE_LABELS[br.type]}
                          </span>
                          {/* Status chip */}
                          <BranchStatusChip branch={br} onResendInvite={handleResendInvite} />
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {br.location}
                          {br.manager ? ` · ${br.manager}` : ""}
                          {br.established ? ` · Est. ${br.established}` : ""}
                        </p>
                        {/* Franchise: show invite email or data-source hint */}
                        {br.type === "franchise" && br.invite_status === "none" && (
                          <button
                            onClick={() => setModal({ type: "edit_branch", item: br })}
                            style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#C2410C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <Mail size={10} /> Send data invitation
                          </button>
                        )}
                        {br.type !== "franchise" && (
                          <Link href="/data-sources" style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#059669", textDecoration: "none" }}>
                            <MapPin size={10} /> Assign bank account in Data Sources
                          </Link>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button title="Edit" onClick={() => setModal({ type: "edit_branch", item: br })}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                          <Pencil size={11} />
                        </button>
                        <DelBtn onRequest={() => requestDeleteBranch(br.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "10px 24px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {branches.length} location{branches.length !== 1 ? "s" : ""} ·{" "}
                  {branches.filter(b => b.type === "franchise").length > 0
                    ? `${branches.filter(b => b.type === "franchise").length} franchise${branches.filter(b => b.type === "franchise").length !== 1 ? "s" : ""} · `
                    : ""}
                  Visible to financers evaluating your operational footprint.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 2: OPERATIONAL DATA ── */}
        {activeTab === "operational" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                <strong style={{ color: "#0A2540" }}>System-derived</strong> rows are detected automatically from transaction data.{" "}
                <strong style={{ color: "#0A2540" }}>Self-reported</strong> data carries lower confidence weight until backed by a document.
              </p>
            </div>

            {/* SUPPLIERS */}
            <Card>
              <CardHeader title="Supplier Relationships" sub="Detected from transaction counterparty clusters. Confirm, correct, or add."
                action={<Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#9CA3AF", textDecoration: "none" }}><RefreshCw size={11} /> From pipeline</Link>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {suppliers.map((sup, i) => (
                  <div key={sup.id} style={{ borderBottom: i < suppliers.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    {/* Desktop row */}
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#EFF6FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontSize: 10, fontWeight: 800 }}>{sup.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{sup.name}</p>
                          <OriginTag origin="pipeline" link="/data-sources" />
                          {sup.confirmed && <Badge variant="success" style={{ fontSize: 9 }}>Confirmed</Badge>}
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{Math.round(sup.confidence * 100)}% confidence</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sup.category} · {sup.tx_count} transactions</p>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(sup.monthly_spend)}<span style={{ fontSize: 10, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></p>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        {!sup.confirmed && <button title="Confirm" onClick={() => confirmSupplier(sup.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#10B981" }}><CheckCircle2 size={11} /></button>}
                        <button title="Edit" onClick={() => setModal({ type: "edit_supplier", item: sup })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}><Pencil size={11} /></button>
                        <DelBtn onRequest={() => requestDeleteSupplier(sup.id)} />
                      </div>
                    </div>
                    {/* Mobile card */}
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#EFF6FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontSize: 10, fontWeight: 800 }}>{sup.name.slice(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{sup.name}</p>
                            <OriginTag origin="pipeline" link="/data-sources" />
                            {sup.confirmed && <Badge variant="success" style={{ fontSize: 9 }}>Confirmed</Badge>}
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sup.category} · {sup.tx_count} txns · {Math.round(sup.confidence * 100)}% confidence</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{fmt(sup.monthly_spend)}<span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!sup.confirmed && <button title="Confirm" onClick={() => confirmSupplier(sup.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#10B981" }}><CheckCircle2 size={13} /></button>}
                          <button title="Edit" onClick={() => setModal({ type: "edit_supplier", item: sup })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <DelBtn onRequest={() => requestDeleteSupplier(sup.id)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total monthly spend: <strong style={{ color: "#0A2540" }}>{fmt(suppliers.reduce((s, x) => s + x.monthly_spend, 0))}</strong> · Derived from <Link href="/transactions" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>transaction analysis</Link></p>
              </div>
            </Card>

            {/* CONTRACTS */}
            <Card>
              <CardHeader title="Client Contracts" sub="Manually declared. Back with a document to increase confidence."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_contract" })} style={{ gap: 5 }}><Plus size={12} /> Add contract</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {contracts.map((c, i) => (
                  <div key={c.id} style={{ borderBottom: i < contracts.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    {/* Desktop row */}
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: c.status === "active" ? "#ECFDF5" : "#F9FAFB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.status === "active" ? "#10B981" : "#9CA3AF" }}><FileSignature size={15} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.client}</p>
                          <Badge variant={c.status === "active" ? "success" : "outline"} style={{ fontSize: 9 }}>{c.status === "active" ? "Active" : "Expired"}</Badge>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{c.type} · {c.start} – {c.end}</p>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(c.value_monthly)}<span style={{ fontSize: 10, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></p>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button title="Edit" onClick={() => setModal({ type: "edit_contract", item: c })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}><Pencil size={11} /></button>
                        <Link href="/documents" title="Upload contract document" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={11} /></Link>
                        <DelBtn onRequest={() => requestDeleteContract(c.id)} />
                      </div>
                    </div>
                    {/* Mobile card */}
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: c.status === "active" ? "#ECFDF5" : "#F9FAFB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.status === "active" ? "#10B981" : "#9CA3AF" }}><FileSignature size={14} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.client}</p>
                            <Badge variant={c.status === "active" ? "success" : "outline"} style={{ fontSize: 9 }}>{c.status === "active" ? "Active" : "Expired"}</Badge>
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{c.type} · {c.start} – {c.end}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{fmt(c.value_monthly)}<span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button title="Edit" onClick={() => setModal({ type: "edit_contract", item: c })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <Link href="/documents" title="Upload doc" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={13} /></Link>
                          <DelBtn onRequest={() => requestDeleteContract(c.id)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* RECEIVABLES */}
            <Card>
              <CardHeader title="Accounts Receivable" sub="Pipeline-detected patterns confirmed or supplemented manually."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_receivable" })} style={{ gap: 5 }}><Plus size={12} /> Add receivable</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {receivables.map((rec, i) => (
                  <div key={rec.id} style={{ borderBottom: i < receivables.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    {/* Desktop row */}
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: rec.status === "overdue" ? "#FEF2F2" : "#ECFDF5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: rec.status === "overdue" ? "#EF4444" : "#10B981" }}><Receipt size={15} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.client}</p>
                          <Badge variant={rec.status === "overdue" ? "destructive" : "success"} style={{ fontSize: 9 }}>{rec.status === "overdue" ? "Overdue" : "Current"}</Badge>
                          {rec.from_pipeline ? <OriginTag origin="pipeline" link="/data-sources" /> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>Due {rec.due_date}</p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: rec.status === "overdue" ? "#EF4444" : "#0A2540", flexShrink: 0 }}>{fmt(rec.amount)}</p>
                      <DelBtn onRequest={() => requestDeleteReceivable(rec.id)} />
                    </div>
                    {/* Mobile card */}
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: rec.status === "overdue" ? "#FEF2F2" : "#ECFDF5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: rec.status === "overdue" ? "#EF4444" : "#10B981" }}><Receipt size={14} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.client}</p>
                            <Badge variant={rec.status === "overdue" ? "destructive" : "success"} style={{ fontSize: 9 }}>{rec.status === "overdue" ? "Overdue" : "Current"}</Badge>
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Due {rec.due_date}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: rec.status === "overdue" ? "#EF4444" : "#0A2540" }}>{fmt(rec.amount)}</p>
                        <DelBtn onRequest={() => requestDeleteReceivable(rec.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* EQUIPMENT */}
            <Card>
              <CardHeader title="Equipment & Physical Assets" sub="Self-reported. Upload purchase invoices or valuations to verify."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_equipment" })} style={{ gap: 5 }}><Plus size={12} /> Add equipment</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {equipment.map((eq, i) => (
                  <div key={eq.id} style={{ borderBottom: i < equipment.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    {/* Desktop row */}
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>{eq.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{eq.name}</p>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{eq.model} · {eq.purchase_year} · {eq.condition}</p>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(eq.est_value)}</p>
                        <p style={{ fontSize: 10, color: "#9CA3AF" }}>est. value</p>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button title="Edit" onClick={() => setModal({ type: "edit_equipment", item: eq })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}><Pencil size={11} /></button>
                        <Link href="/documents" title="Upload valuation doc" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={11} /></Link>
                        <DelBtn onRequest={() => requestDeleteEquipment(eq.id)} />
                      </div>
                    </div>
                    {/* Mobile card */}
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>{eq.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{eq.name}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{eq.model} · {eq.purchase_year} · {eq.condition}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{fmt(eq.est_value)}</p>
                          <p style={{ fontSize: 10, color: "#9CA3AF" }}>est. value</p>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button title="Edit" onClick={() => setModal({ type: "edit_equipment", item: eq })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <Link href="/documents" title="Upload valuation doc" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={13} /></Link>
                          <DelBtn onRequest={() => requestDeleteEquipment(eq.id)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total asset value: <strong style={{ color: "#0A2540" }}>{fmt(equipment.reduce((s, e) => s + e.est_value, 0))}</strong></p>
              </div>
            </Card>

            {/* INVENTORY */}
            <Card>
              <CardHeader title="Inventory" sub="Self-reported stock levels."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_inventory" })} style={{ gap: 5 }}><Plus size={12} /> Add item</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>

                {/* Desktop table */}
                <div className="bp-inv-desktop">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                    {["Item","Qty","Unit","Est. Value",""].map(h => <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>)}
                  </div>
                  {inventory.map((item, i) => (
                    <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "12px 24px", borderBottom: i < inventory.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.item}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.qty.toLocaleString()}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.unit}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{fmt(item.value)}</p>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Edit" onClick={() => setModal({ type: "edit_inventory", item })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}><Pencil size={11} /></button>
                        <DelBtn onRequest={() => requestDeleteInventory(item.id)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile cards */}
                <div className="bp-inv-mobile">
                  {inventory.map((item, i) => (
                    <div key={item.id} style={{ padding: "12px 16px", borderBottom: i < inventory.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.item}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{item.qty.toLocaleString()}</span>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{item.unit}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{fmt(item.value)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button title="Edit" onClick={() => setModal({ type: "edit_inventory", item })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <DelBtn onRequest={() => requestDeleteInventory(item.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total inventory value: <strong style={{ color: "#0A2540" }}>{fmt(inventory.reduce((s, i) => s + i.value, 0))}</strong></p>
              </div>
            </Card>

            {/* CUSTOM CATEGORIES */}
            <Card>
              <CardHeader title="Custom Data Categories" sub="Don't see a category that applies? Create your own and back it with documents."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_custom_category" })} style={{ gap: 5 }}><Plus size={12} /> Add category</Button>}
              />
              {customCategories.length === 0 ? (
                <div style={{ padding: "24px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Examples: Cold Chain Assets, Solar Equipment, Livestock, Intellectual Property, Franchise Rights, Carbon Credits…</p>
                  </div>
                  <button onClick={() => setModal({ type: "add_custom_category" })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "2px dashed #E5E7EB", background: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                    <Plus size={13} /> Create a custom category
                  </button>
                </div>
              ) : (
                <div style={{ padding: "10px 0 8px" }}>
                  {customCategories.map((cat, i) => (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < customCategories.length - 1 ? "1px solid #F9FAFB" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F5F3FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#7C3AED" }}>
                        {cat.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{cat.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#7C3AED", background: "#F5F3FF", padding: "2px 7px", borderRadius: 9999 }}>Custom</span>
                          <Link href="/documents" style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, background: "#EFF6FF", padding: "2px 7px", borderRadius: 9999 }}>
                            Upload docs <ArrowUpRight size={8} />
                          </Link>
                        </div>
                        {cat.description && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{cat.description}</p>}
                      </div>
                      <DelBtn onRequest={() => requestDeleteCustomCategory(cat.id)} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* NUDGE */}
            <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={18} color="#00D4FF" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>Back your data with documents to unlock verified status.</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Verified data carries significantly more weight in capital matching.</p>
                </div>
              </div>
              <Link href="/documents" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#00D4FF", color: "#0A2540", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                Upload documents <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
