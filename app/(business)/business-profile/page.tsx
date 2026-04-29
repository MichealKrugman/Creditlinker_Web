"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Pencil, Trash2, CheckCircle2, AlertCircle,
  FileSignature, Receipt, Plus, X, Save,
  Loader2, Info, Lock, ChevronRight, RefreshCw,
  ArrowUpRight, ExternalLink, Mail, MapPin,
  CheckCircle, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { UndoToast } from "@/components/ui/undo-toast";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────
   ENV
───────────────────────────────────────────────────────── */
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("/rest/v1", "") + "/functions/v1";

/* ─────────────────────────────────────────────────────────
   API HELPER
   Gets a fresh JWT and POSTs / GETs to an Edge Function.
───────────────────────────────────────────────────────── */
async function callFn(name: string, body?: Record<string, unknown>, method: "POST" | "GET" = "POST"): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const url = `${FUNCTIONS_URL}/${name}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `${name} failed (${res.status})`);
  return json;
}

/* ─────────────────────────────────────────────────────────
   STATIC LOOKUP DATA
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
interface Director      { name: string; role: string; verified: boolean; }

interface Branch {
  id: string;
  name: string;
  type: "branch" | "franchise" | "office" | "warehouse" | "other";
  location: string;
  is_default: boolean;
  linked_accounts_count: number;
  manager?: string;
  established?: string;
  invite_email?: string;
  invite_status?: "none" | "sent" | "accepted";
}

interface BusinessProfile {
  business_id:         string;
  name:                string;
  status:              string;
  profile_status?:     string | null;
  sector:              string | null;
  capital_preferences: string[];
  branches:            any[];
  suppliers:           any[];
  contracts:           any[];
  receivables:         any[];
  equipment:           any[];
  inventory:           any[];
  custom_categories:   any[];
  directors:           any[];
}

type ModalState =
  | { type: "edit_sector" }
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
   MAP API RESPONSE SHAPES → INTERNAL TYPES
───────────────────────────────────────────────────────── */
function mapSupplier(s: any): Supplier {
  return { id: s.supplier_id, name: s.name, category: s.category ?? "", monthly_spend: s.monthly_spend ?? 0, tx_count: s.tx_count ?? 0, confidence: s.confidence ?? 0, confirmed: s.confirmed ?? false };
}
function mapContract(c: any): Contract {
  return { id: c.contract_id, client: c.client, type: c.type ?? "", value_monthly: c.value_monthly ?? 0, start: c.start_date ?? "", end: c.end_date ?? "", status: c.status ?? "active" };
}
function mapReceivable(r: any): Receivable {
  return { id: r.receivable_id, client: r.client, amount: r.amount ?? 0, due_date: r.due_date ?? "", status: r.status ?? "current", from_pipeline: r.source === "pipeline" };
}
function mapEquipment(e: any): Equipment {
  return { id: e.equipment_id, name: e.name, model: e.model ?? "", purchase_year: e.purchase_year ?? 0, est_value: e.est_value ?? 0, condition: e.condition ?? "" };
}
function mapInventory(i: any): InventoryItem {
  return { id: i.inventory_id, item: i.item, qty: i.qty ?? 0, unit: i.unit ?? "", value: i.value ?? 0 };
}
const BRANCH_TYPE_NORMALIZE: Record<string, Branch["type"]> = { hq: "branch" };
function mapBranch(b: any): Branch {
  const rawType = b.type as string;
  const type: Branch["type"] = (BRANCH_TYPE_NORMALIZE[rawType] ?? (rawType in BRANCH_TYPE_LABELS ? rawType as Branch["type"] : "other"));
  return { id: b.branch_id, name: b.name, type, location: b.location, is_default: b.is_default ?? false, linked_accounts_count: b.linked_accounts_count ?? 0, manager: b.manager ?? undefined, established: b.established ?? undefined, invite_email: b.invite_email ?? undefined, invite_status: b.invite_status ?? "none" };
}
function mapCustomCategory(c: any): CustomCategory {
  return { id: c.category_id, name: c.name, description: c.description ?? "", doc_ref: c.doc_ref ?? undefined };
}
function mapDirector(d: any): Director {
  const meta = d.metadata ?? {};
  return { name: meta.director_name ?? d.filename, role: meta.director_role ?? "Director", verified: d.status === "verified" };
}

/* ─────────────────────────────────────────────────────────
   BRANCH TYPE DISPLAY
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
function Skeleton({ h = 16, w = "100%", radius = 6 }: { h?: number; w?: number | string; radius?: number }) {
  return (
    <div style={{ height: h, width: w, borderRadius: radius, background: "linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)", backgroundSize: "200% 100%", animation: "cl-shimmer 1.4s infinite" }} />
  );
}
function CardSkeleton() {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}><Skeleton h={14} w={160} /></div>
      {[1,2,3].map(i => (
        <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid #F9FAFB", display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton h={36} w={36} radius={9} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton h={13} w="60%" />
            <Skeleton h={11} w="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ERROR TOAST (extends UndoToast pattern with error variant)
───────────────────────────────────────────────────────── */
function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxWidth: 420, width: "calc(100vw - 48px)" }}>
      <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
      <p style={{ fontSize: 13, color: "#991B1B", flex: 1 }}>{message}</p>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2 }}><X size={13} /></button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}
function CardHeader({ title, sub, action, hideMobileSub }: { title: string; sub?: string; action?: React.ReactNode; hideMobileSub?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F3F4F6", gap: 12, flexWrap: "wrap" as const }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p className={hideMobileSub ? "bp-hide-mobile" : undefined} style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
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
function FieldRow({ label, value, origin, originLink }: {
  label: string; value: string;
  origin: "registration" | "document" | "pipeline" | "account";
  originLink?: string;
}) {
  return (
    <div className="bp-field-row" style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: "1px solid #F9FAFB", gap: 12 }}>
      <div className="bp-field-label">
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
        <OriginTag origin={origin} link={originLink} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "space-between", minWidth: 0 }}>
        <p style={{ fontSize: 13, color: value ? "#374151" : "#D1D5DB", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{value || "—"}</p>
        <Lock size={11} style={{ color: "#D1D5DB", flexShrink: 0 }} />
      </div>
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
  onSave: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const [values,  setValues]  = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(values);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
              <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
            </div>
          )}
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
───────────────────────────────────────────────────────── */
function BranchForm({
  initial, businessId, onSaved, onClose,
}: {
  initial?: Branch;
  businessId: string;
  onSaved: (branch: Branch) => void;
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
  const [error,       setError]       = useState<string | null>(null);
  // Holds the saved branch_id after step 1 create, needed for step 2 invite
  const savedBranchIdRef = useRef<string | null>(initial?.id ?? null);

  const isFranchise = type === "franchise";

  const handleStep1Save = async () => {
    if (!name || !location) return;
    setError(null);

    if (isFranchise && !initial) {
      // Save branch first, then proceed to invite step
      setLoading(true);
      try {
        const res = await callFn("manage-branches", { action: "create", business_id: businessId, name, type, location, manager: manager || undefined, established: established || undefined });
        savedBranchIdRef.current = res.branch.branch_id;
        setStep(2);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const action = initial ? "update" : "create";
        const res = await callFn("manage-branches", { action, business_id: businessId, branch_id: initial?.id, name, type, location, manager: manager || undefined, established: established || undefined });
        onSaved(mapBranch(res.branch));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendInvite = async () => {
    setSending(true);
    setError(null);
    try {
      await callFn("invite-franchise", {
        business_id:    businessId,
        branch_id:      savedBranchIdRef.current,
        invited_email:  inviteEmail,
      });
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleSkip = async () => {
    // Branch already created in step 1 — just close and refresh
    if (savedBranchIdRef.current) {
      const res = await callFn("manage-branches", { action: "update", business_id: businessId, branch_id: savedBranchIdRef.current, invite_status: "none" }).catch(() => null);
      if (res?.branch) onSaved(mapBranch(res.branch));
    }
    onClose();
  };

  const handleDone = () => {
    // Re-fetch the branch to get the latest invite_status
    callFn("get-business-profile", undefined, "GET").then(profile => {
      const updated = profile.branches?.find((b: any) => b.branch_id === savedBranchIdRef.current);
      if (updated) onSaved(mapBranch(updated));
    }).catch(() => {});
    onClose();
  };

  /* ── STEP 2: FRANCHISE DATA SHARING SETUP ── */
  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column" }}>
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
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
          <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.7 }}>
            <strong>Franchises are separate legal entities.</strong> Send them an invitation to share financial data with you on Creditlinker.
          </p>
        </div>
        {error && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
            <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
          </div>
        )}
        {!sent ? (
          <>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>
                Franchise owner's email <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span>
              </label>
              <Input type="email" placeholder={`e.g. owner@${name.toLowerCase().replace(/\s+/g, "")}.ng`} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ height: 40, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSkip} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Skip for now</button>
              <Button variant="primary" onClick={handleSendInvite} disabled={!inviteEmail || sending} style={{ flex: 2, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
                {sending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Mail size={13} /> Send invitation</>}
              </Button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, padding: "16px 16px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10 }}>
              <CheckCircle2 size={20} style={{ color: "#10B981", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", marginBottom: 2 }}>Invitation sent to {inviteEmail}</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Once they accept, their financials will flow into your consolidated view automatically.</p>
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
          {isFranchise && <span style={{ marginLeft: "auto", fontSize: 11, color: "#C2410C", fontWeight: 600, background: "#FFF7ED", border: "1px solid #FED7AA", padding: "2px 8px", borderRadius: 9999 }}>Separate legal entity</span>}
        </div>
      )}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {isFranchise && !initial && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 9 }}>
            <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>Franchises are independent businesses. You'll be able to send them a data-sharing invitation on the next step.</p>
          </div>
        )}
        {error && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
            <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
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
                <button key={t} onClick={() => setType(t)} style={{ padding: "8px 0", borderRadius: 7, border: "1.5px solid", borderColor: type === t ? tc.color : "#E5E7EB", background: type === t ? tc.bg : "white", color: type === t ? tc.color : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", textTransform: "capitalize" as const }}>
                  {BRANCH_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
            {type === "franchise" ? "Franchises are separate legal entities. You'll invite them to share financial data on the next step." : "Branches, offices, and warehouses share your legal entity. Assign them a dedicated bank account in Data Sources."}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Address / Location *</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos" style={{ height: 40, fontSize: 13 }} />
        </div>
        <div className="bp-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Manager <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(opt.)</span></label>
            <Input value={manager} onChange={e => setManager(e.target.value)} placeholder="Name" style={{ height: 40, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Est. year <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(opt.)</span></label>
            <Input type="number" value={established} onChange={e => setEstablished(e.target.value)} placeholder="2021" style={{ height: 40, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
          <Button variant="primary" onClick={handleStep1Save} disabled={!name || !location || loading} style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isFranchise && !initial ? <>Continue →</> : <><Save size={13} /> Save location</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CUSTOM CATEGORY FORM
───────────────────────────────────────────────────────── */
function CustomCategoryForm({ businessId, onSaved, onClose }: {
  businessId: string;
  onSaved: (cat: CustomCategory) => void;
  onClose: () => void;
}) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callFn("manage-business-custom-categories", { action: "create", business_id: businessId, name, description });
      onSaved(mapCustomCategory(res.category));
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
        <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>After adding, upload supporting documents at <strong>Documents → Other Supporting Documents</strong>.</p>
      </div>
      {error && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
          <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Category name *</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cold Chain Assets, Solar Equipment" style={{ height: 40, fontSize: 13 }} autoFocus />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Description <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this category covers and why it's relevant…" rows={3}
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
   BRANCH STATUS CHIP
───────────────────────────────────────────────────────── */
function BranchStatusChip({ branch, onResendInvite }: { branch: Branch; onResendInvite: (id: string) => void; }) {
  if (branch.type !== "franchise") return <span style={{ fontSize: 10, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 9999 }}>Same entity</span>;
  if (branch.invite_status === "accepted") return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 9999 }}><CheckCircle2 size={9} /> Data linked</span>;
  if (branch.invite_status === "sent") return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "1px solid #FCD34D", padding: "2px 8px", borderRadius: 9999 }}>Invite pending</span>
      <button onClick={() => onResendInvite(branch.id)} style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2, padding: 0 }}>Resend</button>
    </div>
  );
  return <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>Not invited</span>;
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Core identity (from API, locked)
  const [businessId,   setBusinessId]   = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bizStatus,    setBizStatus]    = useState("");
  const [ownerName,    setOwnerName]    = useState("");
  const [directors,    setDirectors]    = useState<Director[]>([]);

  // Editable fields
  const [sector,        setSector]        = useState("");
  const [capital,       setCapital]       = useState<string[]>([]);
  const [capitalSaving, setCapitalSaving] = useState(false);

  // Collections
  const [suppliers,        setSuppliers]        = useState<Supplier[]>([]);
  const [contracts,        setContracts]        = useState<Contract[]>([]);
  const [receivables,      setReceivables]      = useState<Receivable[]>([]);
  const [equipment,        setEquipment]        = useState<Equipment[]>([]);
  const [inventory,        setInventory]        = useState<InventoryItem[]>([]);
  const [branches,         setBranches]         = useState<Branch[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // UI state
  const [modal,         setModal]         = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [undoToast,     setUndoToast]     = useState<{ message: string; restore: () => void } | null>(null);
  const [errorToast,    setErrorToast]    = useState<string | null>(null);

  /* ── LOAD PROFILE ─────────────────────────────────────── */
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile: BusinessProfile = await callFn("get-business-profile", undefined, "GET");
      setBusinessId(profile.business_id);
      setBusinessName(profile.name);
      setBizStatus(profile.profile_status ?? "");
      setOwnerName((profile as any).owner_full_name ?? "");
      setSector(profile.sector ?? "");
      setCapital(profile.capital_preferences ?? []);
      setSuppliers(profile.suppliers.map(mapSupplier));
      setContracts(profile.contracts.map(mapContract));
      setReceivables(profile.receivables.map(mapReceivable));
      setEquipment(profile.equipment.map(mapEquipment));
      setInventory(profile.inventory.map(mapInventory));
      setBranches(profile.branches.map(mapBranch));
      setCustomCategories(profile.custom_categories.map(mapCustomCategory));
      setDirectors(profile.directors.map(mapDirector));
    } catch (e: any) {
      setError(e.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /* ── SECTOR SAVE ─────────────────────────────────────── */
  const saveSector = async (value: string) => {
    await callFn("upsert-business-profile-field", { business_id: businessId, field: "sector", value });
    setSector(value);
  };

  /* ── CAPITAL SAVE (shared helper) ────────────────────── */
  const saveCapital = async (updated: string[]) => {
    setCapitalSaving(true);
    try {
      await callFn("upsert-business-profile-field", { business_id: businessId, field: "capital_preferences", value: updated });
    } catch (e: any) {
      setErrorToast(e.message);
      // Revert on failure — re-fetch is safest
      loadProfile();
    } finally {
      setCapitalSaving(false);
    }
  };

  const addCapital = async (cat: string) => {
    const updated = [...capital, cat];
    setCapital(updated);
    setModal(null);
    await saveCapital(updated);
  };

  /* ── SOFT DELETE (optimistic + undo) ─────────────────── */
  function softDelete<T extends { id: string }>(
    items: T[], id: string, setItems: React.Dispatch<React.SetStateAction<T[]>>,
    label: string, description: string,
    apiFn: () => Promise<void>,
  ) {
    const idx  = items.findIndex(x => x.id === id);
    const item = items[idx];
    if (!item) return;
    setPendingDelete({
      label, description,
      onConfirm: async () => {
        // Optimistic remove
        setItems(prev => prev.filter(x => x.id !== id));
        setPendingDelete(null);
        setUndoToast({
          message: `"${label}" deleted`,
          restore: () => setItems(prev => { const n = [...prev]; n.splice(idx, 0, item); return n; }),
        });
        try {
          await apiFn();
        } catch (e: any) {
          // Rollback
          setItems(prev => { const n = [...prev]; n.splice(idx, 0, item); return n; });
          setUndoToast(null);
          setErrorToast(e.message);
        }
      },
    });
  }

  /* ── SUPPLIER ACTIONS ────────────────────────────────── */
  const confirmSupplier = async (id: string) => {
    setSuppliers(s => s.map(x => x.id === id ? { ...x, confirmed: true } : x));
    try {
      await callFn("manage-business-suppliers", { action: "confirm", business_id: businessId, supplier_id: id });
    } catch (e: any) {
      setSuppliers(s => s.map(x => x.id === id ? { ...x, confirmed: false } : x));
      setErrorToast(e.message);
    }
  };

  const requestDeleteSupplier = (id: string) => softDelete(
    suppliers, id, setSuppliers,
    suppliers.find(x => x.id === id)?.name ?? "Supplier", "This supplier will be removed from your profile.",
    () => callFn("manage-business-suppliers", { action: "delete", business_id: businessId, supplier_id: id }),
  );

  /* ── CONTRACT ACTIONS ────────────────────────────────── */
  const requestDeleteContract = (id: string) => softDelete(
    contracts, id, setContracts,
    contracts.find(x => x.id === id)?.client ?? "Contract", "This contract will be removed from your profile.",
    () => callFn("manage-business-contracts", { action: "delete", business_id: businessId, contract_id: id }),
  );

  /* ── RECEIVABLE ACTIONS ──────────────────────────────── */
  const requestDeleteReceivable = (id: string) => softDelete(
    receivables, id, setReceivables,
    receivables.find(x => x.id === id)?.client ?? "Receivable", "This receivable will be removed from your profile.",
    () => callFn("manage-business-receivables", { action: "delete", business_id: businessId, receivable_id: id }),
  );

  /* ── EQUIPMENT ACTIONS ───────────────────────────────── */
  const requestDeleteEquipment = (id: string) => softDelete(
    equipment, id, setEquipment,
    equipment.find(x => x.id === id)?.name ?? "Equipment", "This asset will be removed from your profile.",
    () => callFn("manage-business-equipment", { action: "delete", business_id: businessId, equipment_id: id }),
  );

  /* ── INVENTORY ACTIONS ───────────────────────────────── */
  const requestDeleteInventory = (id: string) => softDelete(
    inventory, id, setInventory,
    inventory.find(x => x.id === id)?.item ?? "Item", "This inventory item will be removed from your profile.",
    () => callFn("manage-business-inventory", { action: "delete", business_id: businessId, inventory_id: id }),
  );

  /* ── BRANCH ACTIONS ──────────────────────────────────── */
  const requestDeleteBranch = (id: string) => softDelete(
    branches, id, setBranches,
    branches.find(x => x.id === id)?.name ?? "Branch", "This branch will be removed from your profile.",
    () => callFn("manage-branches", { action: "delete", business_id: businessId, branch_id: id }),
  );

  const handleResendInvite = async (id: string) => {
    try {
      await callFn("manage-branches", { action: "resend_invite", business_id: businessId, branch_id: id });
      setUndoToast({ message: "Invitation resent", restore: () => {} });
    } catch (e: any) {
      setErrorToast(e.message);
    }
  };

  /* ── CUSTOM CATEGORY ACTIONS ─────────────────────────── */
  const requestDeleteCustomCategory = (id: string) => softDelete(
    customCategories, id, setCustomCategories,
    customCategories.find(x => x.id === id)?.name ?? "Custom category", "This custom category will be removed.",
    () => callFn("manage-business-custom-categories", { action: "delete", business_id: businessId, category_id: id }),
  );

  /* ── CAPITAL REMOVE ──────────────────────────────────── */
  const removeCapital = (cat: string) => {
    const idx   = capital.indexOf(cat);
    const label = CAPITAL_LABELS[cat] ?? cat;
    setPendingDelete({
      label, description: `"${label}" will be removed from your capital preferences.`,
      onConfirm: async () => {
        const updated = capital.filter(x => x !== cat);
        setCapital(updated);
        setPendingDelete(null);
        setUndoToast({
          message: `"${label}" preference removed`,
          restore: () => {
            const restored = [...updated]; restored.splice(idx, 0, cat); setCapital(restored);
            saveCapital(restored);
          },
        });
        await saveCapital(updated);
      },
    });
  };

  /* ── LOADING STATE ───────────────────────────────────── */
  if (loading) return (
    <>
      <style>{`@keyframes cl-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton h={24} w={220} />
          <Skeleton h={14} w={160} />
        </div>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
  );

  /* ── HARD ERROR STATE ────────────────────────────────── */
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 24px", textAlign: "center" as const }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AlertTriangle size={22} style={{ color: "#EF4444" }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", marginBottom: 6 }}>Couldn't load your profile</p>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>{error}</p>
      </div>
      <button onClick={loadProfile} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}>
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <>
      <style>{`@keyframes cl-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} @media(max-width:768px){.bp-hide-mobile{display:none!important}}`}</style>

      {pendingDelete && (
        <ConfirmDeleteModal title={`Delete ${pendingDelete.label}?`} description={pendingDelete.description} onConfirm={pendingDelete.onConfirm} onClose={() => setPendingDelete(null)} />
      )}
      {undoToast && (
        <UndoToast message={undoToast.message} onUndo={() => { undoToast.restore(); setUndoToast(null); }} onDismiss={() => setUndoToast(null)} />
      )}
      {errorToast && <ErrorToast message={errorToast} onDismiss={() => setErrorToast(null)} />}

      {/* ── MODALS ─────────────────────────────────────── */}
      {modal?.type === "edit_sector" && (
        <ItemModal title="Edit sector / industry"
          fields={[{ label: "Sector / Industry", key: "sector", placeholder: "e.g. Food & Beverage Manufacturing" }]}
          initial={{ sector }}
          onSave={async v => { await saveSector(v.sector); }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "edit_supplier" && (
        <ItemModal title="Edit supplier"
          fields={[{ label: "Supplier name", key: "name" }, { label: "Category", key: "category" }, { label: "Monthly spend (₦)", key: "monthly_spend", type: "number" }]}
          initial={{ name: modal.item.name, category: modal.item.category, monthly_spend: String(modal.item.monthly_spend) }}
          onSave={async v => {
            const res = await callFn("manage-business-suppliers", { action: "update", business_id: businessId, supplier_id: modal.item.id, name: v.name, category: v.category, monthly_spend: v.monthly_spend });
            setSuppliers(s => s.map(x => x.id === modal.item.id ? mapSupplier(res.supplier) : x));
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "add_contract" && (
        <ItemModal title="Add client contract"
          fields={[{ label: "Client name", key: "client", placeholder: "e.g. Jumia Food" }, { label: "Contract type", key: "type", placeholder: "e.g. Supply agreement" }, { label: "Monthly value (₦)", key: "value_monthly", type: "number", placeholder: "0" }, { label: "Start date", key: "start", placeholder: "e.g. Jan 2024" }, { label: "End date", key: "end", placeholder: "e.g. Dec 2024" }]}
          onSave={async v => {
            const res = await callFn("manage-business-contracts", { action: "create", business_id: businessId, client: v.client, type: v.type, value_monthly: v.value_monthly, start_date: v.start, end_date: v.end });
            setContracts(s => [...s, mapContract(res.contract)]);
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "edit_contract" && (
        <ItemModal title="Edit contract"
          fields={[{ label: "Client name", key: "client" }, { label: "Contract type", key: "type" }, { label: "Monthly value (₦)", key: "value_monthly", type: "number" }, { label: "Start date", key: "start" }, { label: "End date", key: "end" }]}
          initial={{ client: modal.item.client, type: modal.item.type, value_monthly: String(modal.item.value_monthly), start: modal.item.start, end: modal.item.end }}
          onSave={async v => {
            const res = await callFn("manage-business-contracts", { action: "update", business_id: businessId, contract_id: modal.item.id, client: v.client, type: v.type, value_monthly: v.value_monthly, start_date: v.start, end_date: v.end });
            setContracts(s => s.map(x => x.id === modal.item.id ? mapContract(res.contract) : x));
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "add_receivable" && (
        <ItemModal title="Add receivable"
          fields={[{ label: "Client name", key: "client", placeholder: "e.g. Lagos State Canteen" }, { label: "Amount (₦)", key: "amount", type: "number", placeholder: "0" }, { label: "Due date", key: "due_date", placeholder: "e.g. Jan 15, 2025" }]}
          onSave={async v => {
            const res = await callFn("manage-business-receivables", { action: "create", business_id: businessId, client: v.client, amount: v.amount, due_date: v.due_date });
            setReceivables(s => [...s, mapReceivable(res.receivable)]);
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "add_equipment" && (
        <ItemModal title="Add equipment"
          fields={[{ label: "Equipment name", key: "name", placeholder: "e.g. Industrial Oven" }, { label: "Model", key: "model", placeholder: "e.g. Miwe Roll-in" }, { label: "Purchase year", key: "purchase_year", type: "number", placeholder: "2023" }, { label: "Est. value (₦)", key: "est_value", type: "number", placeholder: "0" }, { label: "Condition", key: "condition", placeholder: "Good / Fair / Excellent" }]}
          onSave={async v => {
            const res = await callFn("manage-business-equipment", { action: "create", business_id: businessId, ...v });
            setEquipment(s => [...s, mapEquipment(res.equipment)]);
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "edit_equipment" && (
        <ItemModal title="Edit equipment"
          fields={[{ label: "Equipment name", key: "name" }, { label: "Model", key: "model" }, { label: "Purchase year", key: "purchase_year", type: "number" }, { label: "Est. value (₦)", key: "est_value", type: "number" }, { label: "Condition", key: "condition" }]}
          initial={{ name: modal.item.name, model: modal.item.model, purchase_year: String(modal.item.purchase_year), est_value: String(modal.item.est_value), condition: modal.item.condition }}
          onSave={async v => {
            const res = await callFn("manage-business-equipment", { action: "update", business_id: businessId, equipment_id: modal.item.id, ...v });
            setEquipment(s => s.map(x => x.id === modal.item.id ? mapEquipment(res.equipment) : x));
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "add_inventory" && (
        <ItemModal title="Add inventory item"
          fields={[{ label: "Item name", key: "item", placeholder: "e.g. All-purpose flour (50kg)" }, { label: "Quantity", key: "qty", type: "number", placeholder: "0" }, { label: "Unit", key: "unit", placeholder: "bags, units, kg…" }, { label: "Est. value (₦)", key: "value", type: "number", placeholder: "0" }]}
          onSave={async v => {
            const res = await callFn("manage-business-inventory", { action: "create", business_id: businessId, ...v });
            setInventory(s => [...s, mapInventory(res.inventory)]);
          }}
          onClose={() => setModal(null)} />
      )}

      {modal?.type === "edit_inventory" && (
        <ItemModal title="Edit inventory item"
          fields={[{ label: "Item name", key: "item" }, { label: "Quantity", key: "qty", type: "number" }, { label: "Unit", key: "unit" }, { label: "Est. value (₦)", key: "value", type: "number" }]}
          initial={{ item: modal.item.item, qty: String(modal.item.qty), unit: modal.item.unit, value: String(modal.item.value) }}
          onSave={async v => {
            const res = await callFn("manage-business-inventory", { action: "update", business_id: businessId, inventory_id: modal.item.id, ...v });
            setInventory(s => s.map(x => x.id === modal.item.id ? mapInventory(res.inventory) : x));
          }}
          onClose={() => setModal(null)} />
      )}

      {/* BRANCH MODAL */}
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
              businessId={businessId}
              onSaved={branch => {
                if (modal.type === "add_branch") setBranches(b => [...b, branch]);
                else setBranches(b => b.map(x => x.id === branch.id ? branch : x));
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
            <CustomCategoryForm
              businessId={businessId}
              onSaved={cat => { setCustomCategories(c => [...c, cat]); setModal(null); }}
              onClose={() => setModal(null)}
            />
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
              {capitalSaving && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#F9FAFB", borderRadius: 8 }}><Loader2 size={13} className="animate-spin" style={{ color: "#9CA3AF" }} /><p style={{ fontSize: 12, color: "#9CA3AF" }}>Saving…</p></div>}
              {ALL_CAPITAL_TYPES.filter(t => !capital.includes(t)).map(t => (
                <button key={t} onClick={() => addCapital(t)} disabled={capitalSaving}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 9, border: "1.5px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer", textAlign: "left" as const, opacity: capitalSaving ? 0.5 : 1 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                  {CAPITAL_LABELS[t]}<Plus size={13} style={{ color: "#9CA3AF" }} />
                </button>
              ))}
              {ALL_CAPITAL_TYPES.filter(t => !capital.includes(t)).length === 0 && <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" as const, padding: "12px 0" }}>All capital types already added.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE BODY ──────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 6 }}>{businessName}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <Badge variant="success">Active</Badge>
              <Badge variant="secondary">CAC Registered</Badge>
              {sector && <span style={{ fontSize: 13, color: "#9CA3AF" }}>{sector}</span>}
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
            <div className="bp-hide-mobile" style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Fields are populated from registration, your uploaded documents, and your Creditlinker account. Locked fields can only change by updating their source.</p>
            </div>

            <Card>
              <CardHeader title="Business Information" sub="Core registration details." />
              <FieldRow label="Business name"   value={businessName}  origin="registration" />
              <FieldRow label="Business status" value="CAC Registered" origin="registration" />

              {/* SECTOR — editable */}
              <div style={{ display: "flex", alignItems: "center", padding: "13px 24px", borderBottom: "1px solid #F9FAFB", gap: 16 }}>
                <div style={{ minWidth: 180, flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>Sector / Industry</p>
                  <OriginTag origin="registration" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "space-between" }}>
                  <p style={{ fontSize: 13, color: sector ? "#374151" : "#D1D5DB", fontWeight: 500 }}>{sector || "Not set"}</p>
                  <button onClick={() => setModal({ type: "edit_sector" })} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Account Owner" />
              <FieldRow label="Full name" value={ownerName} origin="account" />
              <div style={{ padding: "12px 24px", borderTop: "1px solid #F9FAFB" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>To update your name or email, <Link href="/settings" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>go to Settings</Link>.</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Directors & Key Principals" sub="Populated from ownership documents."
                action={<Link href="/documents" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Upload ID <ChevronRight size={12} /></Link>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {directors.length === 0 ? (
                  <div className="bp-hide-mobile" style={{ padding: "20px 24px" }}>
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>No ownership documents uploaded yet. <Link href="/documents" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>Upload now</Link>.</p>
                  </div>
                ) : directors.map((dir, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < directors.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                      {dir.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
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
              <CardHeader title="Capital Preferences" sub="The financing types you are open to receiving." hideMobileSub />
              <div style={{ padding: "16px 24px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
                  {capital.map(cat => (
                    <div key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9999, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      {CAPITAL_LABELS[cat] ?? cat}
                      <button onClick={() => removeCapital(cat)} disabled={capitalSaving} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex", lineHeight: 0 }}><X size={11} /></button>
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

            {/* BRANCHES */}
            <Card>
              <CardHeader
                title="Branches, Franchises & Locations"
                sub="All operating entities. Branches share your legal entity. Franchises are independent — invite them to share data."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_branch" })} style={{ gap: 5 }}><Plus size={12} /> Add location</Button>}
                hideMobileSub
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
                  const tc = BRANCH_TYPE_COLORS[br.type] ?? BRANCH_TYPE_COLORS["other"];
                  return (
                    <div key={br.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < branches.length - 1 ? "1px solid #F9FAFB" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: tc.bg, border: `1px solid ${tc.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: tc.color }}>
                        {br.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{br.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}`, padding: "2px 7px", borderRadius: 9999 }}>{BRANCH_TYPE_LABELS[br.type]}</span>
                          <BranchStatusChip branch={br} onResendInvite={handleResendInvite} />
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{br.location}{br.manager ? ` · ${br.manager}` : ""}{br.established ? ` · Est. ${br.established}` : ""}</p>
                        {br.type === "franchise" && br.invite_status === "none" && (
                          <button onClick={() => setModal({ type: "edit_branch", item: br })} style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#C2410C", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <Mail size={10} /> Send data invitation
                          </button>
                        )}
                        {br.type !== "franchise" && br.linked_accounts_count === 0 && (
                          <Link href="/data-sources" style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#059669", textDecoration: "none" }}>
                            <MapPin size={10} /> Assign bank account in Data Sources
                          </Link>
                        )}
                      </div>
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
              <div className="bp-hide-mobile" style={{ padding: "10px 24px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {branches.length} location{branches.length !== 1 ? "s" : ""}{branches.filter(b => b.type === "franchise").length > 0 ? ` · ${branches.filter(b => b.type === "franchise").length} franchise${branches.filter(b => b.type === "franchise").length !== 1 ? "s" : ""}` : ""} · Visible to financers evaluating your operational footprint.
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
                {suppliers.length === 0 ? (
                  <div style={{ padding: "20px 24px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No suppliers detected yet. Connect your bank account in Data Sources to let the pipeline detect supplier relationships.</p></div>
                ) : suppliers.map((sup, i) => (
                  <div key={sup.id} style={{ borderBottom: i < suppliers.length - 1 ? "1px solid #F9FAFB" : "none" }}>
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
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#EFF6FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontSize: 10, fontWeight: 800 }}>{sup.name.slice(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{sup.name}</p>
                            <OriginTag origin="pipeline" link="/data-sources" />
                            {sup.confirmed && <Badge variant="success" style={{ fontSize: 9 }}>Confirmed</Badge>}
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sup.category} · {sup.tx_count} txns · {Math.round(sup.confidence * 100)}%</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{fmt(sup.monthly_spend)}<span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!sup.confirmed && <button onClick={() => confirmSupplier(sup.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#10B981" }}><CheckCircle2 size={13} /></button>}
                          <button onClick={() => setModal({ type: "edit_supplier", item: sup })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <DelBtn onRequest={() => requestDeleteSupplier(sup.id)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {suppliers.length > 0 && (
                <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total monthly spend: <strong style={{ color: "#0A2540" }}>{fmt(suppliers.reduce((s, x) => s + x.monthly_spend, 0))}</strong> · Derived from <Link href="/transactions" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>transaction analysis</Link></p>
                </div>
              )}
            </Card>

            {/* CONTRACTS */}
            <Card>
              <CardHeader title="Client Contracts" sub="Manually declared. Back with a document to increase confidence."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_contract" })} style={{ gap: 5 }}><Plus size={12} /> Add contract</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {contracts.length === 0 ? (
                  <div style={{ padding: "20px 24px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No contracts added yet. Add a contract to show recurring client relationships to financers.</p></div>
                ) : contracts.map((c, i) => (
                  <div key={c.id} style={{ borderBottom: i < contracts.length - 1 ? "1px solid #F9FAFB" : "none" }}>
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
                        <Link href="/documents" title="Upload contract document" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={11} /></Link>
                        <DelBtn onRequest={() => requestDeleteContract(c.id)} />
                      </div>
                    </div>
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
                          <button onClick={() => setModal({ type: "edit_contract", item: c })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <Link href="/documents" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={13} /></Link>
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
                {receivables.length === 0 ? (
                  <div style={{ padding: "20px 24px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No receivables yet. Add manually or connect your bank to let the pipeline detect them.</p></div>
                ) : receivables.map((rec, i) => (
                  <div key={rec.id} style={{ borderBottom: i < receivables.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: rec.status === "overdue" ? "#FEF2F2" : "#ECFDF5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: rec.status === "overdue" ? "#EF4444" : "#10B981" }}><Receipt size={15} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.client}</p>
                          <Badge variant={rec.status === "overdue" ? "destructive" : "success"} style={{ fontSize: 9 }}>{rec.status === "overdue" ? "Overdue" : "Current"}</Badge>
                          {rec.from_pipeline ? <OriginTag origin="pipeline" link="/data-sources" /> : <span style={{ display: "inline-flex", gap: 4, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>Due {rec.due_date}</p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: rec.status === "overdue" ? "#EF4444" : "#0A2540", flexShrink: 0 }}>{fmt(rec.amount)}</p>
                      <DelBtn onRequest={() => requestDeleteReceivable(rec.id)} />
                    </div>
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: rec.status === "overdue" ? "#FEF2F2" : "#ECFDF5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: rec.status === "overdue" ? "#EF4444" : "#10B981" }}><Receipt size={14} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.client}</p>
                            <Badge variant={rec.status === "overdue" ? "destructive" : "success"} style={{ fontSize: 9 }}>{rec.status === "overdue" ? "Overdue" : "Current"}</Badge>
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Due {rec.due_date}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                {equipment.length === 0 ? (
                  <div style={{ padding: "20px 24px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No equipment added yet.</p></div>
                ) : equipment.map((eq, i) => (
                  <div key={eq.id} style={{ borderBottom: i < equipment.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div className="bp-op-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>{eq.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{eq.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>
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
                    <div className="bp-op-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>{eq.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{eq.name}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{eq.model} · {eq.purchase_year} · {eq.condition}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div><p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{fmt(eq.est_value)}</p><p style={{ fontSize: 10, color: "#9CA3AF" }}>est. value</p></div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setModal({ type: "edit_equipment", item: eq })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <Link href="/documents" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}><ArrowUpRight size={13} /></Link>
                          <DelBtn onRequest={() => requestDeleteEquipment(eq.id)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {equipment.length > 0 && (
                <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total asset value: <strong style={{ color: "#0A2540" }}>{fmt(equipment.reduce((s, e) => s + e.est_value, 0))}</strong></p>
                </div>
              )}
            </Card>

            {/* INVENTORY */}
            <Card>
              <CardHeader title="Inventory" sub="Self-reported stock levels."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_inventory" })} style={{ gap: 5 }}><Plus size={12} /> Add item</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                <div className="bp-inv-desktop">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                    {["Item","Qty","Unit","Est. Value",""].map(h => <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>)}
                  </div>
                  {inventory.length === 0 ? (
                    <div style={{ padding: "16px 24px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No inventory items yet.</p></div>
                  ) : inventory.map((item, i) => (
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
                <div className="bp-inv-mobile">
                  {inventory.map((item, i) => (
                    <div key={item.id} style={{ padding: "12px 16px", borderBottom: i < inventory.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.item}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{item.qty.toLocaleString()}</span>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{item.unit}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{fmt(item.value)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setModal({ type: "edit_inventory", item })} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}><Pencil size={13} /></button>
                          <DelBtn onRequest={() => requestDeleteInventory(item.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {inventory.length > 0 && (
                <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total inventory value: <strong style={{ color: "#0A2540" }}>{fmt(inventory.reduce((s, i) => s + i.value, 0))}</strong></p>
                </div>
              )}
            </Card>

            {/* CUSTOM CATEGORIES */}
            <Card>
              <CardHeader title="Custom Data Categories" sub="Don't see a category that applies? Create your own and back it with documents."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_custom_category" })} style={{ gap: 5 }}><Plus size={12} /> Add category</Button>}
              />
              {customCategories.length === 0 ? (
                <div className="bp-custom-empty" style={{ padding: "24px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                  <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6, flex: 1 }}>Examples: Cold Chain Assets, Solar Equipment, Livestock, Intellectual Property, Franchise Rights, Carbon Credits…</p>
                  <button onClick={() => setModal({ type: "add_custom_category" })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "2px dashed #E5E7EB", background: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", whiteSpace: "nowrap" as const }}
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
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F5F3FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#7C3AED" }}>{cat.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{cat.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#7C3AED", background: "#F5F3FF", padding: "2px 7px", borderRadius: 9999 }}>Custom</span>
                          <Link href="/documents" style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, background: "#EFF6FF", padding: "2px 7px", borderRadius: 9999 }}>Upload docs <ArrowUpRight size={8} /></Link>
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
