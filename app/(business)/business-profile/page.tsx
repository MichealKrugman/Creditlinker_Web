"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2, Pencil, Trash2, CheckCircle2, AlertCircle,
  FileSignature, Receipt, Plus, X, Save,
  Loader2, Info, Lock, ChevronRight, RefreshCw,
  ArrowUpRight, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { UndoToast } from "@/components/ui/undo-toast";

/* ─────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────── */
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
interface Supplier     { id: string; name: string; category: string; monthly_spend: number; tx_count: number; confidence: number; confirmed: boolean; }
interface Contract     { id: string; client: string; type: string; value_monthly: number; start: string; end: string; status: "active" | "expired"; }
interface Receivable   { id: string; client: string; amount: number; due_date: string; status: "current" | "overdue"; from_pipeline: boolean; }
interface Equipment    { id: string; name: string; model: string; purchase_year: number; est_value: number; condition: string; }
interface InventoryItem { id: string; item: string; qty: number; unit: string; value: number; }

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
  | null;

type PendingDelete = {
  label: string;
  description: string;
  onConfirm: () => void;
};

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
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #F3F4F6", gap: 12 }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
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
    <div style={{ display: "flex", alignItems: "center", padding: "13px 24px", borderBottom: "1px solid #F9FAFB", gap: 16 }}>
      <div style={{ minWidth: 180, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
        <OriginTag origin={origin} link={originLink} />
      </div>
      {editing ? (
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          <Input value={val} onChange={e => setVal(e.target.value)} style={{ height: 34, fontSize: 13 }} autoFocus placeholder={placeholder} />
          <button onClick={() => setEditing(false)} style={{ padding: "0 12px", borderRadius: 7, border: "none", background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
          <button onClick={() => { setVal(value); setEditing(false); }} style={{ padding: "0 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, cursor: "pointer" }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, color: val ? "#374151" : "#D1D5DB", fontWeight: 500 }}>{val || placeholder || "—"}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
   DELETE BUTTON (shows confirmation then undo)
───────────────────────────────────────────────────────── */
function DelBtn({ onRequest }: { onRequest: () => void }) {
  return (
    <button
      title="Delete"
      onClick={onRequest}
      style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
    >
      <Trash2 size={11} />
    </button>
  );
}

const TABS = [
  { id: "profile",     label: "Business Profile" },
  { id: "operational", label: "Operational Data" },
];

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const [suppliers,   setSuppliers]   = useState<Supplier[]>(INIT_SUPPLIERS);
  const [contracts,   setContracts]   = useState<Contract[]>(INIT_CONTRACTS);
  const [receivables, setReceivables] = useState<Receivable[]>(INIT_RECEIVABLES);
  const [equipment,   setEquipment]   = useState<Equipment[]>(INIT_EQUIPMENT);
  const [inventory,   setInventory]   = useState<InventoryItem[]>(INIT_INVENTORY);
  const [capital,     setCapital]     = useState<string[]>(INIT_CAPITAL);

  const [modal,         setModal]         = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [undoToast,     setUndoToast]     = useState<{ message: string; restore: () => void } | null>(null);

  /* ─── soft delete helper ─── */
  function softDelete<T extends { id: string }>(
    items: T[],
    id: string,
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    label: string,
    description: string,
  ) {
    const idx  = items.findIndex(x => x.id === id);
    const item = items[idx];
    if (!item) return;
    setPendingDelete({
      label,
      description,
      onConfirm: () => {
        setItems(prev => prev.filter(x => x.id !== id));
        setUndoToast({
          message: `"${label}" deleted`,
          restore: () => setItems(prev => {
            const n = [...prev];
            n.splice(idx, 0, item);
            return n;
          }),
        });
        setPendingDelete(null);
      },
    });
  }

  const confirmSupplier = (id: string) => setSuppliers(s => s.map(x => x.id === id ? { ...x, confirmed: true } : x));

  const requestDeleteSupplier   = (id: string) => softDelete(suppliers,   id, setSuppliers,   suppliers.find(x=>x.id===id)?.name   ?? "Supplier",   "This supplier will be removed from your profile.");
  const requestDeleteContract   = (id: string) => softDelete(contracts,   id, setContracts,   contracts.find(x=>x.id===id)?.client ?? "Contract",   "This contract will be removed from your profile.");
  const requestDeleteReceivable = (id: string) => softDelete(receivables, id, setReceivables, receivables.find(x=>x.id===id)?.client ?? "Receivable","This receivable will be removed from your profile.");
  const requestDeleteEquipment  = (id: string) => softDelete(equipment,   id, setEquipment,   equipment.find(x=>x.id===id)?.name   ?? "Equipment",  "This asset will be removed from your profile.");
  const requestDeleteInventory  = (id: string) => softDelete(inventory,   id, setInventory,   inventory.find(x=>x.id===id)?.item   ?? "Item",        "This inventory item will be removed from your profile.");

  const removeCapital = (cat: string) => {
    const idx = capital.indexOf(cat);
    const label = CAPITAL_LABELS[cat] ?? cat;
    setPendingDelete({
      label,
      description: `"${label}" will be removed from your capital preferences.`,
      onConfirm: () => {
        setCapital(prev => prev.filter(x => x !== cat));
        setUndoToast({
          message: `"${label}" preference removed`,
          restore: () => setCapital(prev => { const n = [...prev]; n.splice(idx, 0, cat); return n; }),
        });
        setPendingDelete(null);
      },
    });
  };

  return (
    <>
      {/* ── CONFIRM DELETE MODAL ── */}
      {pendingDelete && (
        <ConfirmDeleteModal
          title={`Delete ${pendingDelete.label}?`}
          description={pendingDelete.description}
          onConfirm={pendingDelete.onConfirm}
          onClose={() => setPendingDelete(null)}
        />
      )}

      {/* ── UNDO TOAST ── */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={() => { undoToast.restore(); setUndoToast(null); }}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      {/* ── ITEM MODALS ── */}
      {modal?.type === "edit_supplier" && (
        <ItemModal title="Edit supplier"
          fields={[
            { label: "Supplier name",     key: "name",          placeholder: "e.g. Flour Mills Nigeria" },
            { label: "Category",          key: "category",      placeholder: "e.g. Raw materials" },
            { label: "Monthly spend (₦)", key: "monthly_spend", type: "number" },
          ]}
          initial={{ name: modal.item.name, category: modal.item.category, monthly_spend: String(modal.item.monthly_spend) }}
          onSave={v => setSuppliers(s => s.map(x => x.id === modal.item.id ? { ...x, name: v.name ?? x.name, category: v.category ?? x.category, monthly_spend: Number(v.monthly_spend) || x.monthly_spend } : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_contract" && (
        <ItemModal title="Add client contract"
          fields={[
            { label: "Client name",       key: "client",        placeholder: "e.g. Jumia Food" },
            { label: "Contract type",     key: "type",          placeholder: "e.g. Supply agreement" },
            { label: "Monthly value (₦)", key: "value_monthly", type: "number", placeholder: "0" },
            { label: "Start date",        key: "start",         placeholder: "e.g. Jan 2024" },
            { label: "End date",          key: "end",           placeholder: "e.g. Dec 2024" },
          ]}
          onSave={v => setContracts(s => [...s, { id: uid(), client: v.client ?? "", type: v.type ?? "", value_monthly: Number(v.value_monthly) || 0, start: v.start ?? "", end: v.end ?? "", status: "active" }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_contract" && (
        <ItemModal title="Edit contract"
          fields={[
            { label: "Client name",       key: "client" },
            { label: "Contract type",     key: "type" },
            { label: "Monthly value (₦)", key: "value_monthly", type: "number" },
            { label: "Start date",        key: "start" },
            { label: "End date",          key: "end" },
          ]}
          initial={{ client: modal.item.client, type: modal.item.type, value_monthly: String(modal.item.value_monthly), start: modal.item.start, end: modal.item.end }}
          onSave={v => setContracts(s => s.map(x => x.id === modal.item.id ? { ...x, ...v, value_monthly: Number(v.value_monthly) || x.value_monthly } as Contract : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_receivable" && (
        <ItemModal title="Add receivable"
          fields={[
            { label: "Client name", key: "client",   placeholder: "e.g. Lagos State Canteen" },
            { label: "Amount (₦)",  key: "amount",   type: "number", placeholder: "0" },
            { label: "Due date",    key: "due_date", placeholder: "e.g. Jan 15, 2025" },
          ]}
          onSave={v => setReceivables(s => [...s, { id: uid(), client: v.client ?? "", amount: Number(v.amount) || 0, due_date: v.due_date ?? "", status: "current", from_pipeline: false }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_equipment" && (
        <ItemModal title="Add equipment"
          fields={[
            { label: "Equipment name",  key: "name",          placeholder: "e.g. Industrial Oven" },
            { label: "Model",           key: "model",         placeholder: "e.g. Miwe Roll-in" },
            { label: "Purchase year",   key: "purchase_year", type: "number", placeholder: "2023" },
            { label: "Est. value (₦)",  key: "est_value",     type: "number", placeholder: "0" },
            { label: "Condition",       key: "condition",     placeholder: "Good / Fair / Excellent" },
          ]}
          onSave={v => setEquipment(s => [...s, { id: uid(), name: v.name ?? "", model: v.model ?? "", purchase_year: Number(v.purchase_year) || 0, est_value: Number(v.est_value) || 0, condition: v.condition ?? "" }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_equipment" && (
        <ItemModal title="Edit equipment"
          fields={[
            { label: "Equipment name",  key: "name" },
            { label: "Model",           key: "model" },
            { label: "Purchase year",   key: "purchase_year", type: "number" },
            { label: "Est. value (₦)",  key: "est_value",     type: "number" },
            { label: "Condition",       key: "condition" },
          ]}
          initial={{ name: modal.item.name, model: modal.item.model, purchase_year: String(modal.item.purchase_year), est_value: String(modal.item.est_value), condition: modal.item.condition }}
          onSave={v => setEquipment(s => s.map(x => x.id === modal.item.id ? { ...x, name: v.name ?? x.name, model: v.model ?? x.model, purchase_year: Number(v.purchase_year) || x.purchase_year, est_value: Number(v.est_value) || x.est_value, condition: v.condition ?? x.condition } : x))}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "add_inventory" && (
        <ItemModal title="Add inventory item"
          fields={[
            { label: "Item name",      key: "item",  placeholder: "e.g. All-purpose flour (50kg)" },
            { label: "Quantity",       key: "qty",   type: "number", placeholder: "0" },
            { label: "Unit",           key: "unit",  placeholder: "bags, units, kg…" },
            { label: "Est. value (₦)", key: "value", type: "number", placeholder: "0" },
          ]}
          onSave={v => setInventory(s => [...s, { id: uid(), item: v.item ?? "", qty: Number(v.qty) || 0, unit: v.unit ?? "", value: Number(v.value) || 0 }])}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit_inventory" && (
        <ItemModal title="Edit inventory item"
          fields={[
            { label: "Item name", key: "item" },
            { label: "Quantity",  key: "qty",   type: "number" },
            { label: "Unit",      key: "unit" },
            { label: "Est. value (₦)", key: "value", type: "number" },
          ]}
          initial={{ item: modal.item.item, qty: String(modal.item.qty), unit: modal.item.unit, value: String(modal.item.value) }}
          onSave={v => setInventory(s => s.map(x => x.id === modal.item.id ? { ...x, item: v.item ?? x.item, qty: Number(v.qty) || x.qty, unit: v.unit ?? x.unit, value: Number(v.value) || x.value } : x))}
          onClose={() => setModal(null)} />
      )}
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
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}
                >
                  {CAPITAL_LABELS[t]}
                  <Plus size={13} style={{ color: "#9CA3AF" }} />
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
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 6 }}>
              {FROM_REGISTRATION.name.value}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <Badge variant="success">Active</Badge>
              <Badge variant="secondary">CAC Registered</Badge>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>{FROM_REGISTRATION.sector.value}</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
          {TABS.map((tab, i) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, border: "none", borderRight: i < TABS.length - 1 ? "1px solid #E5E7EB" : "none", background: activeTab === tab.id ? "#0A2540" : "white", color: activeTab === tab.id ? "white" : "#6B7280", cursor: "pointer", transition: "all 0.12s" }}>
              {tab.label}
            </button>
          ))}
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
              <FieldRow label="Business name"     value={FROM_REGISTRATION.name.value}    origin="registration" />
              <FieldRow label="Business status"   value="CAC Registered"                  origin="registration" />
              <FieldRow label="Sector / Industry" value={FROM_REGISTRATION.sector.value}  origin="registration" editable />
              <FieldRow label="RC number"         value={FROM_DOCUMENTS.rc_number.value}  origin="document" originLink="/documents" />
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
              <CardHeader
                title="Directors & Key Principals"
                sub="Populated from ownership documents at /documents."
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
                    {!dir.verified && (
                      <Link href="/documents" style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", textDecoration: "underline", textUnderlineOffset: 2, flexShrink: 0 }}>Re-upload ID</Link>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Capital Preferences" sub="The financing types you are open to receiving. Controls your discovery visibility." />
              <div style={{ padding: "16px 24px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
                  {capital.map(cat => (
                    <div key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9999, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      {CAPITAL_LABELS[cat] ?? cat}
                      <button onClick={() => removeCapital(cat)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex", lineHeight: 0 }} title={`Remove ${CAPITAL_LABELS[cat]}`}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setModal({ type: "add_capital" })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9999, border: "2px dashed #E5E7EB", background: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                  >
                    <Plus size={11} /> Add
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Capital providers matching these types will discover your anonymised profile when open to financing is enabled.</p>
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
              <CardHeader
                title="Supplier Relationships"
                sub="Detected from transaction counterparty clusters. Confirm, correct, or add."
                action={<Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#9CA3AF", textDecoration: "none" }}><RefreshCw size={11} /> From pipeline</Link>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {suppliers.map((sup, i) => (
                  <div key={sup.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < suppliers.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#EFF6FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontSize: 10, fontWeight: 800 }}>
                      {sup.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
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
                      {!sup.confirmed && (
                        <button title="Confirm" onClick={() => confirmSupplier(sup.id)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#10B981" }}>
                          <CheckCircle2 size={11} />
                        </button>
                      )}
                      <button title="Edit" onClick={() => setModal({ type: "edit_supplier", item: sup })}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                        <Pencil size={11} />
                      </button>
                      <DelBtn onRequest={() => requestDeleteSupplier(sup.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 24px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                  Total monthly spend: <strong style={{ color: "#0A2540" }}>{fmt(suppliers.reduce((s, x) => s + x.monthly_spend, 0))}</strong>
                  {" "}· Derived from <Link href="/transactions" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>transaction analysis</Link>
                </p>
              </div>
            </Card>

            {/* CONTRACTS */}
            <Card>
              <CardHeader
                title="Client Contracts"
                sub="Manually declared. Back with a document to increase confidence."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_contract" })} style={{ gap: 5 }}><Plus size={12} /> Add contract</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {contracts.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < contracts.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: c.status === "active" ? "#ECFDF5" : "#F9FAFB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.status === "active" ? "#10B981" : "#9CA3AF" }}>
                      <FileSignature size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
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
                      <button title="Edit" onClick={() => setModal({ type: "edit_contract", item: c })}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                        <Pencil size={11} />
                      </button>
                      <Link href="/documents" title="Upload contract document" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#3B82F6", textDecoration: "none" }}>
                        <ArrowUpRight size={11} />
                      </Link>
                      <DelBtn onRequest={() => requestDeleteContract(c.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* RECEIVABLES */}
            <Card>
              <CardHeader
                title="Accounts Receivable"
                sub="Pipeline-detected patterns confirmed or supplemented manually."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_receivable" })} style={{ gap: 5 }}><Plus size={12} /> Add receivable</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {receivables.map((rec, i) => (
                  <div key={rec.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < receivables.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: rec.status === "overdue" ? "#FEF2F2" : "#ECFDF5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: rec.status === "overdue" ? "#EF4444" : "#10B981" }}>
                      <Receipt size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.client}</p>
                        <Badge variant={rec.status === "overdue" ? "destructive" : "success"} style={{ fontSize: 9 }}>{rec.status === "overdue" ? "Overdue" : "Current"}</Badge>
                        {rec.from_pipeline
                          ? <OriginTag origin="pipeline" link="/data-sources" />
                          : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Self-reported</span>
                        }
                      </div>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>Due {rec.due_date}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: rec.status === "overdue" ? "#EF4444" : "#0A2540", flexShrink: 0 }}>{fmt(rec.amount)}</p>
                    <DelBtn onRequest={() => requestDeleteReceivable(rec.id)} />
                  </div>
                ))}
              </div>
            </Card>

            {/* EQUIPMENT */}
            <Card>
              <CardHeader
                title="Equipment & Physical Assets"
                sub="Self-reported. Upload purchase invoices or valuations to verify."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_equipment" })} style={{ gap: 5 }}><Plus size={12} /> Add equipment</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                {equipment.map((eq, i) => (
                  <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderBottom: i < equipment.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>
                      {eq.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
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
                      <button title="Edit" onClick={() => setModal({ type: "edit_equipment", item: eq })}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                        <Pencil size={11} />
                      </button>
                      <Link href="/documents" title="Upload valuation doc" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", textDecoration: "none" }}>
                        <ArrowUpRight size={11} />
                      </Link>
                      <DelBtn onRequest={() => requestDeleteEquipment(eq.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 24px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total asset value: <strong style={{ color: "#0A2540" }}>{fmt(equipment.reduce((s, e) => s + e.est_value, 0))}</strong></p>
              </div>
            </Card>

            {/* INVENTORY */}
            <Card>
              <CardHeader
                title="Inventory"
                sub="Self-reported stock levels."
                action={<Button variant="outline" size="sm" onClick={() => setModal({ type: "add_inventory" })} style={{ gap: 5 }}><Plus size={12} /> Add item</Button>}
              />
              <div style={{ padding: "10px 0 8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}>
                  {["Item", "Qty", "Unit", "Est. Value", ""].map(h => (
                    <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {inventory.map((item, i) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "12px 24px", borderBottom: i < inventory.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.item}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.qty.toLocaleString()}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.unit}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{fmt(item.value)}</p>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button title="Edit" onClick={() => setModal({ type: "edit_inventory", item })}
                        style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}>
                        <Pencil size={11} />
                      </button>
                      <DelBtn onRequest={() => requestDeleteInventory(item.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 24px 14px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total inventory value: <strong style={{ color: "#0A2540" }}>{fmt(inventory.reduce((s, i) => s + i.value, 0))}</strong></p>
              </div>
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
