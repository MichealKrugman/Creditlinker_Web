"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, RefreshCw, Trash2, MoreHorizontal, CheckCircle2,
  AlertCircle, Upload, Link2, Building2,
  X, Loader2, BookOpen, ClipboardList,
  CheckCircle, XCircle, Clock, Activity, ChevronDown,
  MapPin, Lock, Mail, Save, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type EntityType    = "hq" | "branch" | "franchise" | "office" | "warehouse";
type SyncStatus    = "synced" | "error" | "syncing";
type UploadStatus  = "processed" | "processing" | "failed" | "pending";

interface Entity {
  id: string;
  name: string;
  shortName: string;
  type: EntityType;
  location: string;
  has_own_books: boolean;
  data_linked: boolean;
  sharing_consent: boolean;
  invite_email?: string;
  invite_status?: "pending" | "accepted" | "none";
}

interface LinkedAccount {
  account_id: string;
  bank_name: string;
  account_number_masked: string;
  account_type: string;
  currency: string;
  is_primary: boolean;
  source: string;
  last_synced: string;
  sync_status: SyncStatus;
  date_added: string;
  tx_count: number;
  entity_id: string;
}

interface LedgerUpload {
  upload_id: string;
  filename: string;
  ledger_type: string;
  size: string;
  uploaded_at: string;
  records_parsed: number;
  period: string;
  status: UploadStatus;
  entity_id: string;
}

interface UIReconciliationReport {
  report_id: string;
  ledger_upload_id: string | null;
  matched_count: number;
  ledger_only_count: number;
  bank_only_count: number;
  reconciliation_rate: number;
  match_method_breakdown: Record<string, number>;
  ledger_only_entries: {
    ledger_id: string;
    date: string;
    amount: number;
    direction: string;
    description: string;
    category?: string;
    counterparty?: string;
    probable_reason: string;
  }[];
  created_at: string;
}

interface PipelineLog {
  pipeline_run_id: string;
  status: string;
  stage_reached: string | null;
  duration_ms: number | null;
  raw_transaction_count: number | null;
  normalization_confidence_avg: number | null;
  data_quality_score: number | null;
  active_risk_flag_count: number | null;
  warnings_count: number | null;
  errors_count: number | null;
  recorded_at: string;
  stages: { name: string; status: string; duration_ms: number; note: string }[];
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; color: string; border: string }> = {
  hq:        { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  branch:    { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  franchise: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  office:    { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  warehouse: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
};
const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  hq: "HQ", branch: "Branch", franchise: "Franchise", office: "Office", warehouse: "Warehouse",
};

const LEDGER_TYPES = ["General Ledger", "Trial Balance", "Profit & Loss Statement", "Balance Sheet", "Chart of Accounts", "Cash Flow Statement"];
// These 7 keys map 1-to-1 to CanonicalColumn in the SDK (csv.mapper.ts).
// Required: date, amount, description. Optional: direction, category, counterparty, reference.
const CREDITLINKER_FIELDS = [
  { key: "date",         label: "Date",        required: true,  description: "Transaction or entry date" },
  { key: "amount",       label: "Amount",      required: true,  description: "Transaction amount (₦). Use a single column." },
  { key: "description",  label: "Description", required: true,  description: "Narration, memo, or particulars" },
  { key: "direction",    label: "Direction",   required: false, description: "Debit/credit indicator column (DR/CR, debit/credit, +/-)" },
  { key: "category",     label: "Category",    required: false, description: "Your own expense/income category label" },
  { key: "counterparty", label: "Counterparty",required: false, description: "Client or supplier name" },
  { key: "reference",    label: "Reference",   required: false, description: "Invoice number or transaction reference" },
];

/* ─────────────────────────────────────────────────────────
   DATA MAPPERS — DB rows → typed interfaces
───────────────────────────────────────────────────────── */
function fmtDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMonth(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function fmtRelative(iso: string): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return fmtDate(iso);
}

function mapAccount(row: any): LinkedAccount {
  const status = (row.status ?? "active") as string;
  return {
    account_id:            row.account_id,
    bank_name:             row.bank_name ?? "Unknown Bank",
    account_number_masked: row.account_number_masked ?? "****0000",
    account_type:          row.account_type ?? "Current",
    currency:              row.currency ?? "NGN",
    is_primary:            row.is_primary ?? row.is_default ?? false,
    source:                row.source ?? "mono",
    last_synced:           fmtRelative(row.last_synced_at ?? row.updated_at ?? ""),
    sync_status:           (status === "error" ? "error" : "synced") as SyncStatus,
    date_added:            fmtDate(row.created_at ?? ""),
    tx_count:              0,
    entity_id:             row.entity_id ?? "hq",
  };
}

function mapLedger(row: any): LedgerUpload {
  const period = row.period_from && row.period_to
    ? `${fmtMonth(row.period_from)} – ${fmtMonth(row.period_to)}`
    : "-";
  return {
    upload_id:     row.id,
    filename:      row.filename ?? "Unknown file",
    ledger_type:   row.ledger_type ?? "General Ledger",
    size:          "",
    uploaded_at:   fmtDate(row.created_at ?? ""),
    records_parsed: row.records_parsed ?? 0,
    period,
    status:        (row.status as UploadStatus) ?? "pending",
    entity_id:     row.entity_id ?? "hq",
  };
}

function mapPipelineLog(row: any): PipelineLog | null {
  if (!row) return null;
  return {
    pipeline_run_id:              row.pipeline_run_id ?? row.id ?? "N/A",
    status:                       row.status ?? "unknown",
    stage_reached:                row.stage_reached ?? null,
    duration_ms:                  row.duration_ms ?? null,
    raw_transaction_count:        row.raw_transaction_count ?? null,
    normalization_confidence_avg: row.normalization_confidence_avg ?? null,
    data_quality_score:           row.data_quality_score ?? null,
    active_risk_flag_count:       row.active_risk_flag_count ?? null,
    warnings_count:               row.warnings_count ?? null,
    errors_count:                 row.errors_count ?? null,
    recorded_at:                  fmtDate(row.recorded_at ?? row.created_at ?? ""),
    stages: Array.isArray(row.stages)
      ? row.stages.map((s: any) => ({
          name:        s.stage ?? s.name ?? "unknown",
          status:      s.succeeded === true ? "ok" : s.succeeded === false ? "error" : (s.status ?? "unknown"),
          duration_ms: s.duration_ms ?? 0,
          note:        s.note ?? (s.succeeded === false ? "Stage did not complete" : ""),
        }))
      : [],
  };
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function syncBadge(status: SyncStatus) {
  return {
    synced:  { variant: "success"     as const, label: "Synced",   icon: <CheckCircle2 size={11} /> },
    error:   { variant: "destructive" as const, label: "Error",    icon: <AlertCircle  size={11} /> },
    syncing: { variant: "secondary"   as const, label: "Syncing…", icon: <Loader2 size={11} className="animate-spin" /> },
  }[status];
}

function uploadBadge(status: UploadStatus) {
  return {
    processed:  { variant: "success"     as const, label: "Processed"  },
    processing: { variant: "secondary"   as const, label: "Processing" },
    failed:     { variant: "destructive" as const, label: "Failed"     },
    pending:    { variant: "secondary"   as const, label: "Pending"    },
  }[status] ?? { variant: "secondary" as const, label: status };
}

function stageIcon(status: string) {
  if (status === "ok")      return <CheckCircle size={14} style={{ color: "#10B981" }} />;
  if (status === "warning") return <AlertCircle size={14} style={{ color: "#F59E0B" }} />;
  if (status === "error")   return <XCircle     size={14} style={{ color: "#EF4444" }} />;
  return <Clock size={14} style={{ color: "#9CA3AF" }} />;
}

function parseCSVHeaders(content: string): { headers: string[]; preview: string[][] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], preview: [] };
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const preview = lines.slice(1, 4).map(line => line.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
  return { headers, preview };
}

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
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

function EntityBadge({ type, small = false }: { type: EntityType; small?: boolean }) {
  const c = ENTITY_TYPE_COLORS[type];
  return (
    <span style={{ fontSize: small ? 9 : 10, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: small ? "1px 6px" : "2px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>
      {ENTITY_TYPE_LABELS[type]}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   ENTITY PICKER
───────────────────────────────────────────────────────── */
function EntityPicker({
  value,
  onChange,
  entities,
  excludeFranchisesWithoutConsent = true,
}: {
  value: string;
  onChange: (id: string) => void;
  entities: Entity[];
  excludeFranchisesWithoutConsent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const availableEntities = entities.filter(e =>
    excludeFranchisesWithoutConsent
      ? !(e.type === "franchise" && !e.sharing_consent)
      : true
  );
  const selected = availableEntities.find(e => e.id === value) ?? entities[0];
  if (!selected) return null;
  const tc = ENTITY_TYPE_COLORS[selected.type];

  return (
    <div style={{ position: "relative" as const }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px 4px 8px", borderRadius: 7,
          border: `1.5px solid ${open ? tc.color : "#E5E7EB"}`,
          background: open ? tc.bg : "white",
          fontSize: 12, fontWeight: 600, color: open ? tc.color : "#374151",
          cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const,
        }}
      >
        <MapPin size={10} style={{ color: tc.color }} />
        {selected.shortName}
        <EntityBadge type={selected.type} small />
        <ChevronDown size={10} style={{ color: "#9CA3AF", marginLeft: 2 }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute" as const, top: 36, left: 0, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 220, overflow: "hidden" }}>
            <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Assign to entity</p>
            </div>
            {availableEntities.map((entity, i) => {
              const c = ENTITY_TYPE_COLORS[entity.type];
              return (
                <button
                  key={entity.id}
                  onClick={() => { onChange(entity.id); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 12px", background: entity.id === value ? c.bg : "white",
                    border: "none", borderBottom: i < availableEntities.length - 1 ? "1px solid #F9FAFB" : "none",
                    cursor: "pointer", textAlign: "left" as const, transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (entity.id !== value) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { if (entity.id !== value) (e.currentTarget as HTMLElement).style.background = "white"; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPin size={12} style={{ color: c.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{entity.shortName}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{entity.location}</p>
                  </div>
                  <EntityBadge type={entity.type} small />
                  {entity.id === value && <CheckCircle2 size={12} style={{ color: c.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ENTITY COVERAGE
───────────────────────────────────────────────────────── */
function EntityCoverage({
  entities,
  accounts,
  ledgers,
}: {
  entities: Entity[];
  accounts: LinkedAccount[];
  ledgers: LedgerUpload[];
}) {
  const entitiesWithData = entities.filter(e => {
    const hasAccounts   = accounts.filter(a => a.entity_id === e.id).length > 0;
    const hasLedgers    = ledgers.filter(l => l.entity_id === e.id).length > 0;
    return hasAccounts || hasLedgers;
  });

  return (
    <Card>
      <SectionHeader
        title="Entity Data Coverage"
        sub="Each operating entity needs its own data sources to appear in Financial Analysis."
        action={
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
            {entitiesWithData.length}/{entities.length} {entitiesWithData.length === 1 ? "entity has" : "entities have"} data
          </span>
        }
      />
      <div style={{ padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {entities.map(entity => {
            const entityAccounts   = accounts.filter(a => a.entity_id === entity.id);
            const entityLedgers    = ledgers.filter(l => l.entity_id === entity.id);
            const totalSources     = entityAccounts.length + entityLedgers.length;
            const tc               = ENTITY_TYPE_COLORS[entity.type];
            const isFranchise      = entity.has_own_books;
            const noData           = totalSources === 0;

            return (
              <div
                key={entity.id}
                style={{
                  padding: "14px 16px", borderRadius: 10,
                  border: `1.5px solid ${noData ? (isFranchise ? "#FCD34D" : "#E5E7EB") : tc.border}`,
                  background: noData ? (isFranchise ? "#FFFBEB" : "#F9FAFB") : tc.bg,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{entity.shortName}</p>
                      <EntityBadge type={entity.type} small />
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{entity.location}</p>
                  </div>
                  {isFranchise && !entity.sharing_consent && (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#FFF7ED", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Lock size={11} style={{ color: "#D97706" }} />
                    </div>
                  )}
                  {!noData && (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: tc.bg, border: `1px solid ${tc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={12} style={{ color: tc.color }} />
                    </div>
                  )}
                </div>

                {isFranchise && !entity.sharing_consent ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706" }}>
                      {entity.invite_status === "pending" ? "Invitation sent — awaiting acceptance" : "Not yet invited"}
                    </span>
                  </div>
                ) : noData ? (
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>No data sources assigned yet.</p>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                    {entityAccounts.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: tc.color }}>{entityAccounts.length} account{entityAccounts.length !== 1 ? "s" : ""}</span>}
                    {entityLedgers.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: tc.color }}>{entityLedgers.length} ledger{entityLedgers.length !== 1 ? "s" : ""}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="ds-coverage-note" style={{ display: "flex", gap: 5, padding: "10px 12px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, alignItems: "flex-start" }}>
          <AlertCircle size={12} style={{ color: "#0369A1", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#075985", lineHeight: 1.6 }}>
            Bank accounts and uploads are assigned to entities below. Each entity's assigned sources feed its view in{" "}
            <strong>Financial Analysis</strong>. Consolidated view includes all linked entities.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   FRANCHISE DATA SHARING
───────────────────────────────────────────────────────── */
const DATA_SHARING_OPTIONS = [
  { key: "bank_transactions",  label: "Bank Transactions",  sub: "Account statements & transaction history" },
  { key: "ledger_data",        label: "Accounting Ledger",  sub: "Uploaded P&L, trial balance, general ledger" },
  { key: "financial_metrics",  label: "Financial Metrics",  sub: "Scores, ratios, and computed metrics" },
  { key: "credit_score",       label: "Credit Score",       sub: "Creditlinker score and rating" },
];

function FranchiseDataSharing({
  franchises,
  businessId,
  supabaseUrl,
  authToken,
}: {
  franchises:  Entity[];
  businessId:  string;
  supabaseUrl: string;
  authToken:   string;
}) {
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [sending,     setSending]     = useState<Record<string, boolean>>({});
  const [sentFor,     setSentFor]     = useState<Set<string>>(new Set());
  const [error,       setError]       = useState<Record<string, string>>({});

  const getPerms = (entityId: string): Record<string, boolean> =>
    permissions[entityId] ?? { bank_transactions: true, ledger_data: true, financial_metrics: true, credit_score: false };

  const togglePerm = (entityId: string, key: string) => {
    setPermissions(prev => ({ ...prev, [entityId]: { ...getPerms(entityId), [key]: !getPerms(entityId)[key] } }));
  };

  const handleSendInvite = async (entity: Entity, resend = false) => {
    const email = resend ? entity.invite_email : inviteEmail[entity.id]?.trim();
    if (!email) return;
    setSending(s => ({ ...s, [entity.id]: true }));
    setError(e => ({ ...e, [entity.id]: "" }));
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/invite-franchise`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          business_id:           businessId,
          branch_id:             entity.id,
          invited_email:         email,
          requested_permissions: getPerms(entity.id),
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        setError(e => ({ ...e, [entity.id]: data.error ?? "Failed to send invitation" }));
      } else {
        setSentFor(s => new Set(s).add(entity.id));
      }
    } catch {
      setError(e => ({ ...e, [entity.id]: "Network error — please try again" }));
    } finally {
      setSending(s => ({ ...s, [entity.id]: false }));
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Franchise Data Sharing"
        sub="Franchises operate their own books. They must consent to share financial data with this account."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9CA3AF" }}>
            <Lock size={11} />
            Separate legal entities
          </div>
        }
      />
      <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { step: "1", title: "Send invitation",   sub: "Enter the franchise's email. They'll receive a link to their Creditlinker account." },
            { step: "2", title: "They accept",        sub: "The franchise owner links their own bank accounts and consents to share." },
            { step: "3", title: "Data flows in",      sub: "Their financials appear in consolidated view and can be analysed separately." },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#F9FAFB", borderRadius: 9, border: "1px solid #F3F4F6" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "white" }}>{s.step}</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {franchises.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center" as const, border: "2px dashed #E5E7EB", borderRadius: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ENTITY_TYPE_COLORS.franchise.bg, border: `1px solid ${ENTITY_TYPE_COLORS.franchise.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Lock size={18} style={{ color: ENTITY_TYPE_COLORS.franchise.color }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 6 }}>No franchise entities yet</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
              Franchise entities are added when you set up your business branches. Once a branch is marked as a franchise (separate legal entity), it will appear here for you to invite.
            </p>
          </div>
        ) : (
        <div style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {franchises.map((entity, i) => {
            const justSent  = sentFor.has(entity.id);
            const isSending = sending[entity.id];
            return (
              <div key={entity.id} style={{ padding: "18px 20px", borderBottom: i < franchises.length - 1 ? "1px solid #F3F4F6" : "none", background: entity.sharing_consent ? "#F0FDF4" : "white" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: "1 1 200px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: ENTITY_TYPE_COLORS.franchise.bg, border: `1px solid ${ENTITY_TYPE_COLORS.franchise.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: ENTITY_TYPE_COLORS.franchise.color }}>
                      {entity.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{entity.name}</p>
                        <EntityBadge type={entity.type} />
                        {entity.sharing_consent && <Badge variant="success" style={{ fontSize: 9 }}>Connected</Badge>}
                        {entity.invite_status === "pending" && !entity.sharing_consent && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#D97706", background: "#FFF7ED", border: "1px solid #FCD34D", padding: "2px 7px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>Invite pending</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{entity.location}</p>
                      {entity.invite_email && (
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Invitation sent to: <span style={{ color: "#374151", fontWeight: 500 }}>{entity.invite_email}</span></p>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {entity.sharing_consent ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>Data sharing active</span>
                      </div>
                    ) : justSent ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>Invitation sent</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {entity.invite_status === "pending" && (
                          <button onClick={() => handleSendInvite(entity, true)} disabled={isSending}
                            style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", background: "white", border: "1px solid #E5E7EB", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>
                            {isSending ? <><Loader2 size={11} className="animate-spin" /> Sending…</> : "Resend invite"}
                          </button>
                        )}
                        {entity.invite_status !== "pending" && (
                          <button onClick={() => handleSendInvite(entity)} disabled={isSending}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 700, cursor: isSending ? "not-allowed" : "pointer", border: "none", opacity: isSending ? 0.7 : 1 }}>
                            {isSending ? <><Loader2 size={11} className="animate-spin" /> Sending…</> : <><Mail size={11} /> Invite to share</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!entity.sharing_consent && entity.invite_status === "none" && !justSent && (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    <input type="email" placeholder={`Franchise owner's email at ${entity.name}…`}
                      value={inviteEmail[entity.id] ?? ""} onChange={e => setInviteEmail(m => ({ ...m, [entity.id]: e.target.value }))}
                      style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }} />
                    <div style={{ padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Shield size={12} style={{ color: "#6B7280" }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Data you're requesting access to</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                        {DATA_SHARING_OPTIONS.map(opt => (
                          <label key={opt.key} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${getPerms(entity.id)[opt.key] ? "#0A2540" : "#E5E7EB"}`, background: getPerms(entity.id)[opt.key] ? "#EEF2FF" : "white", cursor: "pointer" }}>
                            <input type="checkbox" checked={!!getPerms(entity.id)[opt.key]} onChange={() => togglePerm(entity.id, opt.key)} style={{ marginTop: 2, accentColor: "#0A2540", flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{opt.label}</p>
                              <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>{opt.sub}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>The franchise chooses exactly what to share — they can accept all, limit scope, or decline.</p>
                    </div>
                    {error[entity.id] && <p style={{ fontSize: 12, color: "#EF4444" }}>{error[entity.id]}</p>}
                    <button onClick={() => handleSendInvite(entity)} disabled={isSending || !inviteEmail[entity.id]?.trim()}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, cursor: (isSending || !inviteEmail[entity.id]?.trim()) ? "not-allowed" : "pointer", border: "none", opacity: (isSending || !inviteEmail[entity.id]?.trim()) ? 0.6 : 1 }}>
                      {isSending ? <><Loader2 size={12} className="animate-spin" /> Sending…</> : <><Mail size={12} /> Send invitation</>}
                    </button>
                  </div>
                )}
                {!entity.sharing_consent && (
                  <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Lock size={11} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
                      Until they connect and consent, {entity.shortName}'s data is completely separate.
                      Creditlinker never accesses a franchise's financials without their explicit consent.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   DROP ZONE
───────────────────────────────────────────────────────── */
function DropZone({ accept, inputId, file, onFile, label }: {
  accept: string; inputId: string; file: File | null; onFile: (f: File) => void; label: string;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => document.getElementById(inputId)?.click()}
      style={{ border: `2px dashed ${dragging ? "#0A2540" : file ? "#10B981" : "#E5E7EB"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" as const, cursor: "pointer", background: dragging ? "#F9FAFB" : file ? "#F0FDF4" : "white", transition: "all 0.15s", marginBottom: 16 }}
    >
      <input id={inputId} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {file ? (
        <>
          <CheckCircle2 size={26} style={{ color: "#10B981", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{file.name}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
        </>
      ) : (
        <>
          <Upload size={26} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>{label}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>or click to browse</p>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONNECT BANK MODAL
───────────────────────────────────────────────────────── */
function ConnectModal({
  onClose,
  entities,
  businessId,
  authToken,
  onRefresh,
}: {
  onClose:    () => void;
  entities:   Entity[];
  businessId: string;
  authToken:  string;
  onRefresh:  () => void;
}) {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [entityId, setEntityId] = useState(entities[0]?.id ?? "hq");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure Mono Connect script is loaded
      await new Promise<void>((resolve, reject) => {
        if ((window as any).MonoConnect) { resolve(); return; }
        const existing = document.getElementById("mono-connect-js");
        if (existing) { existing.addEventListener("load", () => resolve()); return; }
        const script    = document.createElement("script");
        script.id       = "mono-connect-js";
        script.src      = "https://connect.withmono.com/connect.js";
        script.onload   = () => resolve();
        script.onerror  = () => reject(new Error("Failed to load Mono script"));
        document.head.appendChild(script);
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const publicKey    = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY!;
      console.log("[Mono] Initialising widget with key:", publicKey?.slice(0, 12) + "…");

      // Mono requires a customer object with at minimum name + email
      const { data: { session: monoSession } } = await supabase.auth.getSession();
      const monoUser = monoSession?.user;
      const customer = {
        name:  monoUser?.user_metadata?.full_name ?? monoUser?.email?.split("@")[0] ?? "Customer",
        email: monoUser?.email ?? "",
      };
      console.log("[Mono] Customer:", customer.email);

      const mono = new (window as any).Connect({
        key:  publicKey,
        data: { customer },
        onLoad: () => console.log("[Mono] Widget loaded"),
        onSuccess: async ({ code }: { code: string }) => {
          console.log("[Mono] Success — exchanging code");
          const res = await fetch(`${supabaseUrl}/functions/v1/link-mono-account`, {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            body:    JSON.stringify({ code, entity_id: entityId, business_id: businessId }),
          });
          if (res.ok) {
            onRefresh();
            onClose();
          } else {
            const { error: errMsg } = await res.json().catch(() => ({}));
            setError(errMsg ?? "Failed to link account. Please try again.");
            setLoading(false);
          }
        },
        onClose: () => {
          // Mono widget closed without completing — stay on our modal so user can retry
          console.log("[Mono] Widget closed without success");
          setLoading(false);
        },
      });
      mono.setup();
      console.log("[Mono] Calling open()");
      mono.open();
    } catch (err) {
      console.error("Mono widget error:", err);
      setError("Could not load Mono. Check your connection and try again.");
      setLoading(false);
    }
  };

  const selectedEntity = entities.find(e => e.id === entityId) ?? entities[0];
  if (!selectedEntity) return null;
  const tc = ENTITY_TYPE_COLORS[selectedEntity.type];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Connect a bank account</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Powered by Mono · Step {step} of 2</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2].map(s => <div key={s} style={{ height: 3, width: s === step ? 20 : 10, borderRadius: 2, background: s === step ? "#0A2540" : "#E5E7EB", transition: "all 0.2s" }} />)}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
          </div>
        </div>

        {step === 1 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>Which entity is this account for?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {entities.filter(e => !e.has_own_books || e.sharing_consent).map(entity => {
                  const c   = ENTITY_TYPE_COLORS[entity.type];
                  const sel = entity.id === entityId;
                  return (
                    <button key={entity.id} onClick={() => setEntityId(entity.id)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `2px solid ${sel ? c.color : "#E5E7EB"}`, background: sel ? c.bg : "white", cursor: "pointer", textAlign: "left" as const, transition: "all 0.12s" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MapPin size={14} style={{ color: c.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{entity.shortName}</p>
                          <EntityBadge type={entity.type} small />
                        </div>
                        <p style={{ fontSize: 11, color: "#6B7280" }}>{entity.location}</p>
                      </div>
                      {sel && <CheckCircle2 size={16} style={{ color: c.color, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>Transactions from this account will be attributed to the selected entity.</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => setStep(2)} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10, marginTop: 4 }}>
              Continue → <Building2 size={14} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 9, marginBottom: 20 }}>
              <MapPin size={13} style={{ color: tc.color, flexShrink: 0 }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: tc.color }}>Account will be assigned to: <strong>{selectedEntity.shortName}</strong></p>
              <button onClick={() => setStep(1)} style={{ marginLeft: "auto", fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change</button>
            </div>
            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link2 size={15} color="#00D4FF" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>Secure open banking via Mono</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Your credentials are never stored. Mono connects directly to your bank and shares only transaction data with Creditlinker.</p>
              </div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Supported banks</p>
            <div className="ds-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
              {["Zenith Bank", "GTBank", "Access Bank", "UBA", "First Bank", "Stanbic IBTC"].map(bank => (
                <div key={bank} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#0A2540" }}>{bank.slice(0, 2).toUpperCase()}</div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>{bank}</span>
                </div>
              ))}
            </div>
            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 4 }}>
                <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#EF4444", lineHeight: 1.5 }}>{error}</p>
              </div>
            )}
            <Button variant="primary" size="lg" className="w-full" onClick={handleConnect} disabled={loading} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Launching Mono Link…</> : <><Building2 size={15} /> Open Mono Link</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LEDGER UPLOAD MODAL
───────────────────────────────────────────────────────── */
function LedgerModal({
  onClose,
  entities,
  businessId,
  onRefresh,
  initialStep = 1,
}: {
  onClose: () => void;
  entities: Entity[];
  businessId: string;
  onRefresh: () => void;
  initialStep?: 0 | 1;
}) {
  const [step,         setStep]         = useState<0 | 1 | 2>(initialStep);
  const [ledgerType,   setLedgerType]   = useState(LEDGER_TYPES[0]);
  const [file,         setFile]         = useState<File | null>(null);
  const [entityId,     setEntityId]     = useState(entities[0]?.id ?? "hq");
  const [periodFrom,   setPeriodFrom]   = useState("");
  const [periodTo,     setPeriodTo]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [csvHeaders,   setCsvHeaders]   = useState<string[]>([]);
  const [csvPreview,   setCsvPreview]   = useState<string[][]>([]);
  const [columnMap,    setColumnMap]    = useState<Record<string, string>>({});

  const isCSV = (f: File) => f.name.toLowerCase().endsWith(".csv");

  const handleFileSelected = (f: File) => {
    setFile(f);
    // Only attempt header parsing for CSV — xlsx/xls are binary and can't be read as text
    if (!isCSV(f)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { headers, preview } = parseCSVHeaders(content);
      setCsvHeaders(headers);
      setCsvPreview(preview);
      const autoMap: Record<string, string> = {};
      CREDITLINKER_FIELDS.forEach(field => {
        const match = headers.find(h => {
          const hl = h.toLowerCase();
          return hl === field.key ||
            hl.includes(field.key) ||
            (field.key === "description"  && (hl.includes("narration") || hl.includes("memo") || hl.includes("particulars"))) ||
            (field.key === "amount"       && (hl.includes("value") || hl.includes("amt"))) ||
            (field.key === "direction"    && (hl === "dr" || hl === "cr" || hl.includes("type") || hl.includes("direction"))) ||
            (field.key === "category"     && (hl.includes("category") || hl.includes("account") || hl.includes("head"))) ||
            (field.key === "counterparty" && (hl.includes("customer") || hl.includes("vendor") || hl.includes("payee") || hl.includes("supplier"))) ||
            (field.key === "date"         && (hl.includes("date") || hl.includes("trans") || hl.includes("value date"))) ||
            (field.key === "reference"    && (hl.includes("ref") || hl.includes("invoice")));
        });
        if (match) autoMap[field.key] = match;
      });
      setColumnMap(autoMap);
    };
    reader.readAsText(f);
  };

  const handleContinue = () => {
    if (!file) return;
    if (isCSV(file)) {
      if (csvHeaders.length === 0) {
        setError("Still reading file, please wait a moment and try again.");
        return;
      }
      // CSV: go to dropdown mapping step
      setStep(2);
    } else {
      // Excel (xlsx/xls): headers can't be auto-read in browser.
      // Show step 2 with manual text inputs so the user types their column names.
      setCsvHeaders([]);  // signal to step 2 renderer to show text inputs instead of dropdowns
      setCsvPreview([]);
      setColumnMap({});
      setStep(2);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    // Save column map
    let columnMapId: string | null = null;
    if (Object.keys(columnMap).length > 0) {
      const { data: mapData } = await supabase
        .from("ledger_column_maps")
        .insert({ business_id: businessId, name: ledgerType, map: columnMap })
        .select("id")
        .single();
      columnMapId = mapData?.id ?? null;
    }

    // Upload file to storage
    const uploadId = crypto.randomUUID();
    const filePath = `${businessId}/${uploadId}/${file.name}`;

    const { error: storageError } = await supabase.storage
      .from("ledger-files")
      .upload(filePath, file);

    if (storageError) {
      setError("Upload failed. Check that the storage bucket exists.");
      setLoading(false);
      return;
    }

    // Insert DB record
    const { error: dbError } = await supabase.from("ledger_uploads").insert({
      id:             uploadId,
      business_id:    businessId,
      entity_id:      entityId,
      filename:       file.name,
      ledger_type:    ledgerType,
      period_from:    periodFrom || null,
      period_to:      periodTo   || null,
      status:         "pending",
      file_path:      filePath,
      column_map_id:  columnMapId,
    });

    if (dbError) {
      setError("Failed to save upload record.");
      setLoading(false);
      return;
    }

    // Trigger ingest-ledger edge function to parse + reconcile
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token
        ? `Bearer ${session.access_token}`
        : `Bearer ${supabaseAnonKey}`;

      const ingestBody: Record<string, unknown> = {
        business_id: businessId,
        upload_id:   uploadId,
        reconcile:   true,
      };
      if (columnMapId) {
        ingestBody.column_map_id = columnMapId;
      } else {
        ingestBody.column_map = columnMap;
      }

      const res = await fetch(
        `${supabaseUrl}/functions/v1/ingest-ledger`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify(ingestBody),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("ingest-ledger error:", errText);
        setError("Ledger uploaded but processing failed. Check logs.");
        setLoading(false);
        onRefresh();
        return;
      }
    } catch (ingestErr) {
      console.error("ingest-ledger fetch error:", ingestErr);
      // Don't block the user — file is saved, just processing failed
      setError("Ledger saved but processing could not be triggered. Retry from the ledger list.");
      setLoading(false);
      onRefresh();
      return;
    }

    setLoading(false);
    onRefresh();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: step === 2 ? 620 : 500, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" as const, transition: "max-width 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>
              {step === 0 ? "Set up ledger structure" : step === 1 ? "Upload accounting ledger" : "Map your columns"}
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {step === 0 ? "Tell Creditlinker how your ledger is laid out — done once, reused on every upload"
                : step === 1 ? "CSV or Excel format"
                : `${file?.name} · Assign your column names to Creditlinker fields`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step > 0 && <div style={{ display: "flex", gap: 4 }}>{[1,2].map(s => <div key={s} style={{ height: 3, width: s === step ? 20 : 10, borderRadius: 2, background: s === step ? "#0A2540" : "#E5E7EB", transition: "all 0.2s" }} />)}</div>}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
          </div>
        </div>

        {step === 0 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <BookOpen size={14} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>Tell Creditlinker what your columns are called. This mapping is saved and reused on every future upload — you only need to do this once per ledger format.</p>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Creditlinker field", "Your column header name"].map(h => <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>)}
              </div>
              {CREDITLINKER_FIELDS.map((field, i) => (
                <div key={field.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 14px", alignItems: "center", borderBottom: i < CREDITLINKER_FIELDS.length - 1 ? "1px solid #F9FAFB" : "none", background: columnMap[field.key] ? "white" : field.required ? "#FFFBEB" : "white" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{field.label}</p>
                      {field.required && <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "1px 5px", borderRadius: 4 }}>Required</span>}
                      {columnMap[field.key] && <CheckCircle2 size={11} style={{ color: "#10B981" }} />}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{field.description}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. "${field.key === "date" ? "Trans Date" : field.key === "amount" ? "Amount (₦)" : field.key === "description" ? "Particulars" : field.key === "direction" ? "DR/CR" : field.key === "category" ? "Account Head" : field.key === "counterparty" ? "Customer" : "Invoice No"}"`}
                    value={columnMap[field.key] ?? ""}
                    onChange={e => setColumnMap(m => ({ ...m, [field.key]: e.target.value }))}
                    style={{ height: 34, padding: "0 10px", borderRadius: 7, border: `1px solid ${columnMap[field.key] ? "#0A2540" : "#E5E7EB"}`, fontSize: 12, color: "#0A2540", outline: "none", fontWeight: columnMap[field.key] ? 600 : 400 }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>Type the exact column header as it appears in your file. Required fields must be mapped before you can upload.</p>
            {error && <p style={{ fontSize: 12, color: "#EF4444" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <Button variant="primary" onClick={() => {
                const missing = CREDITLINKER_FIELDS.filter(f => f.required && !columnMap[f.key]?.trim());
                if (missing.length > 0) { setError(`Please map required fields: ${missing.map(f => f.label).join(", ")}`); return; }
                setError(null); setStep(1);
              }} style={{ flex: 2, height: 44, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
                <Save size={13} /> Save structure &amp; continue →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {csvPreview.length > 0 && (
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", overflowX: "auto" as const }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Preview (first 3 rows)</p>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11 }}>
                  <thead><tr>{csvHeaders.map(h => <th key={h} style={{ padding: "5px 10px", textAlign: "left" as const, background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 700, whiteSpace: "nowrap" as const }}>{h}</th>)}</tr></thead>
                  <tbody>{csvPreview.map((row, ri) => <tr key={ri}>{csvHeaders.map((_, ci) => <td key={ci} style={{ padding: "4px 10px", border: "1px solid #F3F4F6", color: "#6B7280", whiteSpace: "nowrap" as const, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{row[ci] ?? ""}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
            {csvHeaders.length === 0 && (
              <div style={{ padding: "12px 24px", borderBottom: "1px solid #F3F4F6", background: "#FFFBEB", display: "flex", gap: 8, alignItems: "center" }}>
                <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#92400E" }}>Excel file — headers can't be read in the browser. Type your column names exactly as they appear in the file.</p>
              </div>
            )}
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>Column assignments</p>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <div className="ds-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Creditlinker field", csvHeaders.length > 0 ? "Your column" : "Your column header name"].map(h => <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>)}
                </div>
                {CREDITLINKER_FIELDS.map((field, i) => (
                  <div key={field.key} className="ds-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 14px", alignItems: "center", borderBottom: i < CREDITLINKER_FIELDS.length - 1 ? "1px solid #F9FAFB" : "none", background: columnMap[field.key] ? "white" : field.required ? "#FFFBEB" : "white" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{field.label}</p>
                        {field.required && <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "1px 5px", borderRadius: 4 }}>Required</span>}
                        {columnMap[field.key] && <CheckCircle2 size={11} style={{ color: "#10B981" }} />}
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{field.description}</p>
                    </div>
                    {csvHeaders.length > 0 ? (
                      <select value={columnMap[field.key] ?? ""} onChange={e => setColumnMap(m => ({ ...m, [field.key]: e.target.value }))}
                        style={{ height: 34, padding: "0 10px", borderRadius: 7, border: `1px solid ${columnMap[field.key] ? "#0A2540" : "#E5E7EB"}`, fontSize: 12, color: columnMap[field.key] ? "#0A2540" : "#9CA3AF", background: "white", outline: "none", cursor: "pointer", fontWeight: columnMap[field.key] ? 600 : 400 }}>
                        <option value="">Select column...</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={`e.g. "${field.key === "date" ? "Trans Date" : field.key === "amount" ? "Amount (₦)" : field.key === "description" ? "Particulars" : field.key === "direction" ? "DR/CR" : field.key === "category" ? "Account Head" : field.key === "counterparty" ? "Customer" : "Invoice No"}"`}
                        value={columnMap[field.key] ?? ""}
                        onChange={e => setColumnMap(m => ({ ...m, [field.key]: e.target.value }))}
                        style={{ height: 34, padding: "0 10px", borderRadius: 7, border: `1px solid ${columnMap[field.key] ? "#0A2540" : "#E5E7EB"}`, fontSize: 12, color: "#0A2540", outline: "none", fontWeight: columnMap[field.key] ? 600 : 400 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {error && <p style={{ padding: "0 24px", fontSize: 12, color: "#EF4444" }}>{error}</p>}
            <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, height: 44, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>← Back</button>
              <Button variant="primary" onClick={handleUpload} disabled={loading} style={{ flex: 2, height: 44, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
                {loading ? <><Loader2 size={13} className="animate-spin" /> Processing…</> : <><BookOpen size={13} /> Submit ledger</>}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <BookOpen size={14} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>Your accounting ledger enables revenue recognition, expense categorisation, and ledger reconciliation — unlocking a significantly more accurate financial identity.</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>Assign to entity</label>
              <select value={entityId} onChange={e => setEntityId(e.target.value)}
                style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none", background: "white", cursor: "pointer" }}>
                {entities.filter(e => !e.has_own_books || e.sharing_consent).map(e => (
                <option key={e.id} value={e.id}>{e.shortName} ({ENTITY_TYPE_LABELS[e.type]})</option>
                ))}
                </select>
                </div>
                <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>Ledger type</label>
              <div style={{ position: "relative" as const }}>
                <button onClick={() => setShowTypeMenu(!showTypeMenu)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 14, color: "#0A2540", cursor: "pointer", fontWeight: 500 }}>
                  {ledgerType}<ChevronDown size={14} style={{ color: "#9CA3AF" }} />
                </button>
                {showTypeMenu && (
                  <div style={{ position: "absolute" as const, top: 48, left: 0, right: 0, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" }}>
                    {LEDGER_TYPES.map(t => (
                      <button key={t} onClick={() => { setLedgerType(t); setShowTypeMenu(false); }}
                        style={{ display: "block", width: "100%", padding: "10px 14px", background: t === ledgerType ? "#F9FAFB" : "white", border: "none", borderBottom: "1px solid #F3F4F6", fontSize: 13, fontWeight: t === ledgerType ? 600 : 400, color: "#0A2540", cursor: "pointer", textAlign: "left" as const }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>Period covered</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input type="month" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} style={{ height: 44, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }} />
                <input type="month" value={periodTo}   onChange={e => setPeriodTo(e.target.value)}   style={{ height: 44, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>Ledger file</label>
              <DropZone accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" inputId="ledger-file" file={file} onFile={handleFileSelected} label="Drop your CSV or Excel file here (.csv, .xlsx, .xls)" />
            </div>
            <Button variant="primary" size="lg" onClick={handleContinue} disabled={!file || loading} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Processing…</> : <>Continue — Map columns →</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PIPELINE LOGS MODAL
───────────────────────────────────────────────────────── */
function PipelineLogsModal({ onClose, log }: { onClose: () => void; log: PipelineLog | null }) {
  if (!log) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, padding: 32, textAlign: "center" as const }}>
          <Activity size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>No pipeline runs yet</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Pipeline data will appear here after the first run.</p>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    );
  }

  const successStages = log.stages.filter(s => s.status === "ok").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Pipeline run log</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Run ID: <span style={{ fontFamily: "monospace" }}>{log.pipeline_run_id}</span> · {log.recorded_at}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          {[
            { label: "Duration",     value: log.duration_ms != null ? `${(log.duration_ms / 1000).toFixed(2)}s` : "-" },
            { label: "Transactions", value: log.raw_transaction_count?.toLocaleString() ?? "-" },
            { label: "Data quality", value: log.data_quality_score != null ? `${log.data_quality_score}%` : "-" },
            { label: "Stages passed", value: log.stages.length > 0 ? `${successStages}/${log.stages.length}` : "-" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "14px 20px", borderRight: i < 3 ? "1px solid #F3F4F6" : "none" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ overflowY: "auto" as const, flex: 1 }}>
          {log.stages.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center" as const }}>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Stage details not available for this run.</p>
            </div>
          ) : (
            log.stages.map((stage, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 14, padding: "14px 24px", borderBottom: i < log.stages.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "flex-start" }}>
                <div style={{ paddingTop: 1 }}>{stageIcon(stage.status)}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{stage.name}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{stage.note}</p>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const, paddingTop: 2 }}>{stage.duration_ms}ms</p>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DataSourcesPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();

  const [entities,   setEntities]   = useState<Entity[]>([]);
  const [accounts,   setAccounts]   = useState<LinkedAccount[]>([]);
  const [ledgers,    setLedgers]    = useState<LedgerUpload[]>([]);
  const [pipelineLog, setPipelineLog] = useState<PipelineLog | null>(null);
  const [loading,    setLoading]    = useState(true);

  const [showConnect,      setShowConnect]      = useState(false);
  const [showLedger,       setShowLedger]       = useState(false);
  const [showLedgerStep,   setShowLedgerStep]   = useState<0 | 1>(1);
  const [showPipelineLogs, setShowPipelineLogs] = useState(false);
  const [activeMenu,       setActiveMenu]       = useState<string | null>(null);
  const [syncingAccounts,  setSyncingAccounts]  = useState<Set<string>>(new Set());
  const [authToken,        setAuthToken]        = useState("");

  /* ── Fetch all data ── */
  const loadAll = useCallback(async () => {
    if (!activeBusiness) return;
    const bid = activeBusiness.business_id;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    setAuthToken(session?.access_token ?? "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    const [branchesRes, accountsRes, ledgersRes, pipelineLogsRes] = await Promise.all([
      supabase
        .from("branches")
        .select("branch_id, name, short_name, type, is_default, location")
        .eq("business_id", bid),
      supabase
        .from("linked_accounts")
        .select("*")
        .eq("business_id", bid),
      supabase
        .from("ledger_uploads")
        .select("*")
        .eq("business_id", bid)
        .order("created_at", { ascending: false }),
      fetch(
        `${supabaseUrl}/functions/v1/get-pipeline-logs?business_id=${bid}&limit=10`,
        { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } }
      ).then(r => r.json() as Promise<{ records: any[] }>).catch(() => ({ records: [] })),
    ]);

    const pipelineRecords = pipelineLogsRes.records ?? [];

    // Build entity list from branches
    const branches  = branchesRes.data ?? [];
    const hqBranch  = branches.find((b: any) => b.type === "hq" || b.is_default);
    const builtEntities: Entity[] = [];

    if (hqBranch) {
      builtEntities.push({
        id:             hqBranch.branch_id,
        name:           `${activeBusiness.name} (HQ)`,
        shortName:      "HQ",
        type:           "hq",
        location:       hqBranch.location ?? "",
        has_own_books:  false,
        data_linked:    true,
        sharing_consent: true,
      });
    } else {
      builtEntities.push({
        id:             "hq",
        name:           `${activeBusiness.name} (HQ)`,
        shortName:      "HQ",
        type:           "hq",
        location:       "",
        has_own_books:  false,
        data_linked:    false,
        sharing_consent: true,
      });
    }

    for (const b of branches) {
      if (b.branch_id === hqBranch?.branch_id) continue;
      const isFranchise = b.type === "franchise";
      builtEntities.push({
        id:             b.branch_id as string,
        name:           (b.name as string) ?? (b.short_name as string) ?? "Branch",
        shortName:      (b.short_name as string) ?? (b.name as string) ?? "Branch",
        type:           (b.type as EntityType) ?? "branch",
        location:       (b.location as string) ?? "",
        has_own_books:  isFranchise,
        data_linked:    false,
        sharing_consent: !isFranchise,
        invite_status:  isFranchise ? "none" : undefined,
      });
    }

    setEntities(builtEntities);

    // Remap accounts whose entity_id is the string "hq" fallback to the actual HQ branch UUID.
    // mapAccount() falls back to "hq" when entity_id is null in DB, but the HQ entity
    // is built with its real branch UUID — so the coverage filter would never match otherwise.
    const hqEntityId = builtEntities.find(e => e.type === "hq")?.id ?? "hq";
    const rawAccounts = (accountsRes.data ?? []).map(mapAccount).map(a => ({
      ...a,
      entity_id: a.entity_id === "hq" ? hqEntityId : a.entity_id,
    }));

    setAccounts(rawAccounts);
    setLedgers((ledgersRes.data ?? []).map(mapLedger));
    setPipelineLog(mapPipelineLog(pipelineRecords[0] ?? null));
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    if (!bizLoading && activeBusiness) loadAll();
  }, [activeBusiness, bizLoading, loadAll]);

  /* ── Mutations ── */
  const updateAccountEntity = async (accountId: string, entityId: string) => {
    setAccounts(prev => prev.map(a => a.account_id === accountId ? { ...a, entity_id: entityId } : a));
    await supabase
      .from("linked_accounts")
      .update({ entity_id: entityId })
      .eq("account_id", accountId)
      .eq("business_id", activeBusiness!.business_id);
  };

  const updateLedgerEntity = async (uploadId: string, entityId: string) => {
    setLedgers(prev => prev.map(l => l.upload_id === uploadId ? { ...l, entity_id: entityId } : l));
    await supabase
      .from("ledger_uploads")
      .update({ entity_id: entityId })
      .eq("id", uploadId)
      .eq("business_id", activeBusiness!.business_id);
  };

  const handleSync = async (accountId: string) => {
    setSyncingAccounts(s => new Set(s).add(accountId));
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` };
      // Sync account data + fetch latest transactions in parallel
      await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/sync-mono-account`, {
          method: "POST", headers,
          body: JSON.stringify({ account_id: accountId, business_id: activeBusiness!.business_id }),
        }),
        fetch(`${supabaseUrl}/functions/v1/fetch-mono-transactions`, {
          method: "POST", headers,
          body: JSON.stringify({ account_id: accountId, business_id: activeBusiness!.business_id }),
        }),
      ]);
      await loadAll();
    } finally {
      setSyncingAccounts(s => { const n = new Set(s); n.delete(accountId); return n; });
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this account? This cannot be undone.")) return;
    await supabase
      .from("linked_accounts")
      .delete()
      .eq("account_id", accountId)
      .eq("business_id", activeBusiness!.business_id);
    setActiveMenu(null);
    await loadAll();
  };

  const handleSetPrimary = async (accountId: string) => {
    // Clear existing primary, then set new one
    await supabase
      .from("linked_accounts")
      .update({ is_primary: false })
      .eq("business_id", activeBusiness!.business_id);
    await supabase
      .from("linked_accounts")
      .update({ is_primary: true })
      .eq("account_id", accountId);
    setActiveMenu(null);
    await loadAll();
  };

  const franchises = entities.filter(e => e.has_own_books);
  const bid        = activeBusiness?.business_id ?? "";

  if (bizLoading || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} style={{ color: "#D1D5DB" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showConnect      && <ConnectModal      onClose={() => setShowConnect(false)}      entities={entities} businessId={bid} authToken={authToken} onRefresh={loadAll} />}
      {showLedger       && <LedgerModal       onClose={() => setShowLedger(false)}       entities={entities} businessId={bid} onRefresh={loadAll} initialStep={showLedgerStep} />}
      {showPipelineLogs && <PipelineLogsModal onClose={() => setShowPipelineLogs(false)} log={pipelineLog} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── ACTION BAR ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
          <p className="ds-action-sub" style={{ fontSize: 13, color: "#9CA3AF" }}>Bank accounts, statements, and ledgers — assigned per entity to power individual and consolidated analysis.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <Button variant="outline" size="sm" onClick={() => setShowLedger(true)}    style={{ gap: 6 }}><BookOpen size={13} /> Upload Ledger</Button>
            <Button variant="primary" size="sm" onClick={() => setShowConnect(true)}   style={{ gap: 6 }}><Plus     size={13} /> Connect Bank</Button>
          </div>
        </div>

        {/* ── ENTITY COVERAGE ── */}
        {entities.length > 0 && (
          <EntityCoverage entities={entities} accounts={accounts} ledgers={ledgers} />
        )}

        {/* ── CONNECTED BANK ACCOUNTS ── */}
        <Card>
          <SectionHeader
            title="Connected Bank Accounts"
          />
          <div style={{ padding: "12px 0 8px" }}>
            {accounts.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center" as const }}>
                <Link2 size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No bank accounts connected yet</p>
                <Button variant="outline" size="sm" onClick={() => setShowConnect(true)} style={{ gap: 6, marginTop: 8 }}><Plus size={13} /> Connect your first account</Button>
              </div>
            ) : (
              accounts.map((acc, i) => {
                const sync = syncBadge(acc.sync_status);
                return (
                  <div key={acc.account_id} style={{ borderBottom: i < accounts.length - 1 ? "1px solid #F3F4F6" : "none" }}>

                    {/* ── DESKTOP ROW ── */}
                    <div className="ds-acc-desktop" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0A2540" }}>
                        {acc.bank_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{acc.bank_name}</p>
                          {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 10, padding: "1px 6px" }}>Primary</Badge>}
                          <Badge variant={sync.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, padding: "1px 6px" }}>{sync.icon} {sync.label}</Badge>
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{acc.account_type} · {acc.account_number_masked}</span>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Added {acc.date_added}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Last synced</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{acc.last_synced}</p>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <EntityPicker value={acc.entity_id} onChange={id => updateAccountEntity(acc.account_id, id)} entities={entities} />
                      </div>
                      <button
                        onClick={() => handleSync(acc.account_id)}
                        disabled={syncingAccounts.has(acc.account_id)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: syncingAccounts.has(acc.account_id) ? "#9CA3AF" : "#6B7280", cursor: syncingAccounts.has(acc.account_id) ? "not-allowed" : "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const, opacity: syncingAccounts.has(acc.account_id) ? 0.7 : 1, flexShrink: 0 }}
                        onMouseEnter={e => { if (!syncingAccounts.has(acc.account_id)) { (e.currentTarget as HTMLElement).style.borderColor="#0A2540"; (e.currentTarget as HTMLElement).style.color="#0A2540"; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="#E5E7EB"; (e.currentTarget as HTMLElement).style.color=syncingAccounts.has(acc.account_id)?"#9CA3AF":"#6B7280"; }}
                      >
                        {syncingAccounts.has(acc.account_id) ? <><Loader2 size={11} className="animate-spin" /> Syncing…</> : <><RefreshCw size={11} /> Sync</>}
                      </button>
                      <div style={{ position: "relative" as const }}>
                        <button onClick={() => setActiveMenu(activeMenu === acc.account_id ? null : acc.account_id)}
                          style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", cursor: "pointer" }}>
                          <MoreHorizontal size={14} />
                        </button>
                        {activeMenu === acc.account_id && (
                          <div style={{ position: "absolute" as const, right: 0, top: 36, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
                            {!acc.is_primary && <button onClick={() => handleSetPrimary(acc.account_id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left" as const }}><CheckCircle2 size={13} /> Set as primary</button>}
                            <button onClick={() => handleDisconnect(acc.account_id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#EF4444", textAlign: "left" as const, borderTop: "1px solid #F3F4F6" }}><Trash2 size={13} /> Disconnect</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── MOBILE CARD ── */}
                    <div className="ds-acc-mobile" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                          {acc.bank_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{acc.bank_name}</p>
                            {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 9, padding: "1px 5px" }}>Primary</Badge>}
                            <Badge variant={sync.variant} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, padding: "1px 5px" }}>{sync.icon} {sync.label}</Badge>
                          </div>
                          <p style={{ fontSize: 12, color: "#9CA3AF" }}>{acc.account_type} · {acc.account_number_masked}</p>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Assigned entity</p>
                        <EntityPicker value={acc.entity_id} onChange={id => updateAccountEntity(acc.account_id, id)} entities={entities} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>Synced {acc.last_synced}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleSync(acc.account_id)} disabled={syncingAccounts.has(acc.account_id)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", opacity: syncingAccounts.has(acc.account_id) ? 0.7 : 1 }}>
                            {syncingAccounts.has(acc.account_id) ? <><Loader2 size={11} className="animate-spin" /> Syncing…</> : <><RefreshCw size={11} /> Sync</>}
                          </button>
                          <div style={{ position: "relative" as const }}>
                            <button onClick={() => setActiveMenu(activeMenu === acc.account_id ? null : acc.account_id)}
                              style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", cursor: "pointer" }}>
                              <MoreHorizontal size={14} />
                            </button>
                            {activeMenu === acc.account_id && (
                              <div style={{ position: "absolute" as const, right: 0, top: 36, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
                                {!acc.is_primary && <button onClick={() => handleSetPrimary(acc.account_id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left" as const }}><CheckCircle2 size={13} /> Set as primary</button>}
                                <button onClick={() => handleDisconnect(acc.account_id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#EF4444", textAlign: "left" as const, borderTop: "1px solid #F3F4F6" }}><Trash2 size={13} /> Disconnect</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6" }}>
            <button onClick={() => setShowConnect(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 16px", border: "2px dashed #E5E7EB", borderRadius: 10, background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#9CA3AF", transition: "all 0.15s", justifyContent: "center" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="#0A2540"; (e.currentTarget as HTMLElement).style.color="#0A2540"; (e.currentTarget as HTMLElement).style.background="#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="#E5E7EB"; (e.currentTarget as HTMLElement).style.color="#9CA3AF"; (e.currentTarget as HTMLElement).style.background="none"; }}>
              <Plus size={15} /> Connect another account
            </button>
          </div>
        </Card>

        {/* ── ACCOUNTING LEDGERS ── */}
        <Card>
          <SectionHeader
            title="Accounting Ledgers"
            sub="General ledgers, trial balances, and P&L statements. Assigned per entity."
            action={<Button variant="outline" size="sm" onClick={() => setShowLedger(true)} style={{ gap: 6 }}><BookOpen size={12} /> Upload Ledger</Button>}
          />
          {ledgers.length === 0 ? (
            <div style={{ padding: "36px 24px", textAlign: "center" as const }}>
              <ClipboardList size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No ledgers uploaded yet</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.6 }}>Before uploading, set up your ledger structure so Creditlinker knows how to read your file.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" as const }}>
                <Button variant="primary" size="sm" onClick={() => { setShowLedgerStep(0); setShowLedger(true); }} style={{ gap: 6 }}>
                  <ClipboardList size={13} /> Set up ledger structure
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowLedgerStep(1); setShowLedger(true); }} style={{ gap: 6 }}>
                  <BookOpen size={13} /> Upload your first ledger
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 0 8px" }}>
              <div className="ds-desktop-table">
                <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  {["", "Filename", "Period", "Records", "Entity", "Status"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {ledgers.map((upload, i) => {
                  const ub = uploadBadge(upload.status);
                  return (
                    <div key={upload.upload_id}
                      style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "13px 24px", borderBottom: i < ledgers.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", color: "#3B82F6" }}>
                        <BookOpen size={13} />
                      </div>
                      <div style={{ minWidth: 0, paddingRight: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{upload.filename}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{upload.ledger_type}</p>
                      </div>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{upload.period}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{upload.records_parsed.toLocaleString()}</p>
                      <EntityPicker value={upload.entity_id} onChange={id => updateLedgerEntity(upload.upload_id, id)} entities={entities} />
                      <Badge variant={ub.variant} style={{ fontSize: 10 }}>{ub.label}</Badge>
                    </div>
                  );
                })}
              </div>
              <div className="ds-mobile-list">
                {ledgers.map((upload, i) => {
                  const ub = uploadBadge(upload.status);
                  return (
                    <div key={upload.upload_id} style={{ padding: "14px 16px", borderBottom: i < ledgers.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", color: "#3B82F6" }}>
                          <BookOpen size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginBottom: 3 }}>{upload.filename}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{upload.ledger_type}</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {upload.period}</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {upload.records_parsed.toLocaleString()} records</span>
                          </div>
                        </div>
                        <Badge variant={ub.variant} style={{ fontSize: 10, flexShrink: 0 }}>{ub.label}</Badge>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Assigned entity</p>
                        <EntityPicker value={upload.entity_id} onChange={id => updateLedgerEntity(upload.upload_id, id)} entities={entities} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* ── FRANCHISE DATA SHARING ── */}
        <FranchiseDataSharing
          franchises={franchises}
          businessId={bid}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
          authToken={authToken}
        />

        {/* ── PIPELINE STATUS ── */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={17} color="#00D4FF" />
            </div>
            <div>
              {pipelineLog ? (
                <>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
                    Pipeline {pipelineLog.status === "failed" ? "failed" : pipelineLog.status === "success" ? "succeeded" : pipelineLog.status}
                    {pipelineLog.stage_reached && ` · stopped at ${pipelineLog.stage_reached.replace(/_/g, " ")}`}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    Last run: {pipelineLog.recorded_at}
                    {pipelineLog.raw_transaction_count != null && ` · ${pipelineLog.raw_transaction_count.toLocaleString()} transactions`}
                    {pipelineLog.warnings_count != null && pipelineLog.warnings_count > 0 && ` · ${pipelineLog.warnings_count} warnings`}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>No pipeline runs yet</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Pipeline will run automatically after data sources are connected.</p>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setShowPipelineLogs(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", flexShrink: 0, whiteSpace: "nowrap" as const }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color="white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.7)"; }}
          >
            <Activity size={13} /> View pipeline logs
          </button>
        </div>

      </div>
    </>
  );
}
