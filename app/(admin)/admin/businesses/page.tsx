"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  Building2, ShieldCheck, AlertTriangle, CheckCircle2,
  Eye, Ban, RefreshCw, Download, TrendingUp,
  MoreHorizontal, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/businesses (paginated)
// ─────────────────────────────────────────────────────────────

const BUSINESSES = [
  { id: "biz_001", name: "Aduke Bakeries Ltd",       sector: "Food & Beverage",  status: "active",    score: 742, data_quality: 91, accounts: 2, months: 24, open_to_financing: true,  verification: "verified",   created: "2023-02-14" },
  { id: "biz_002", name: "TechPay Solutions",         sector: "Fintech",          status: "active",    score: 681, data_quality: 84, accounts: 1, months: 18, open_to_financing: true,  verification: "pending",    created: "2023-05-08" },
  { id: "biz_003", name: "Greenfield Farms Ltd",      sector: "Agriculture",      status: "active",    score: 598, data_quality: 76, accounts: 1, months: 12, open_to_financing: true,  verification: "pending",    created: "2023-09-21" },
  { id: "biz_004", name: "Konga Fulfilment Co.",      sector: "Logistics",        status: "active",    score: 795, data_quality: 95, accounts: 3, months: 30, open_to_financing: false, verification: "verified",   created: "2022-11-03" },
  { id: "biz_005", name: "SabiSabi Wholesale",        sector: "Retail",           status: "active",    score: 627, data_quality: 79, accounts: 2, months: 20, open_to_financing: true,  verification: "verified",   created: "2023-01-17" },
  { id: "biz_006", name: "QuickBuild Contractors",    sector: "Construction",     status: "suspended", score: 412, data_quality: 58, accounts: 1, months: 8,  open_to_financing: false, verification: "rejected",   created: "2023-07-30" },
  { id: "biz_007", name: "Amaka Tailoring Co.",       sector: "Fashion",          status: "incomplete",score: 0,   data_quality: 22, accounts: 0, months: 0,  open_to_financing: false, verification: "unverified", created: "2024-01-05" },
  { id: "biz_008", name: "NovaChem Industries",       sector: "Manufacturing",    status: "active",    score: 714, data_quality: 88, accounts: 2, months: 22, open_to_financing: true,  verification: "verified",   created: "2022-08-19" },
  { id: "biz_009", name: "Arise Digital Agency",      sector: "Tech Services",    status: "active",    score: 659, data_quality: 82, accounts: 1, months: 16, open_to_financing: true,  verification: "pending",    created: "2023-10-12" },
  { id: "biz_010", name: "PrimeMed Pharmacy",         sector: "Healthcare",       status: "active",    score: 731, data_quality: 90, accounts: 2, months: 24, open_to_financing: false, verification: "verified",   created: "2022-06-07" },
  { id: "biz_011", name: "Sunrise Poultry Farm",      sector: "Agriculture",      status: "active",    score: 576, data_quality: 71, accounts: 1, months: 14, open_to_financing: true,  verification: "verified",   created: "2023-04-25" },
  { id: "biz_012", name: "Lagos Auto Spares",         sector: "Retail",           status: "suspended", score: 390, data_quality: 49, accounts: 1, months: 6,  open_to_financing: false, verification: "rejected",   created: "2023-11-14" },
];

const PAGE_SIZE = 10;
const STATUSES = ["All", "active", "suspended", "incomplete"];
const VERIFICATIONS = ["All", "verified", "pending", "unverified", "rejected"];

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 700) return "#10B981";
  if (s >= 550) return "#F59E0B";
  if (s > 0)    return "#EF4444";
  return "#9CA3AF";
}

function statusVariant(s: string): "success" | "warning" | "destructive" | "outline" {
  if (s === "active")     return "success";
  if (s === "suspended")  return "destructive";
  if (s === "incomplete") return "warning";
  return "outline";
}

function verifVariant(v: string): "success" | "warning" | "destructive" | "secondary" | "outline" {
  if (v === "verified")   return "success";
  if (v === "pending")    return "secondary";
  if (v === "rejected")   return "destructive";
  return "outline";
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL (suspend / unsuspend / verify)
// ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, description, confirmLabel, confirmDanger,
  onConfirm, onClose,
}: {
  title: string; description: string;
  confirmLabel: string; confirmDanger?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(10,37,64,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "white", borderRadius: 16,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 440, padding: 28,
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 17, color: "#0A2540", marginBottom: 8,
        }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 18 }}>
          {description}
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Reason <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for this action (required for audit log)…"
            rows={3}
            style={{
              width: "100%", padding: "10px 12px",
              border: "1.5px solid #E5E7EB", borderRadius: 8,
              fontSize: 13, color: "#0A2540",
              resize: "none", outline: "none",
              fontFamily: "var(--font-body)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant={confirmDanger ? "primary" : "primary"}
            size="sm"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            style={confirmDanger ? { background: "#EF4444" } : {}}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminBusinessesPage() {
  const user = getMockAdminUser();
  const canAct = canManage(user, "businesses");

  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("All");
  const [verif,    setVerif]    = useState("All");
  const [page,     setPage]     = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{
    type: "suspend" | "unsuspend" | "verify";
    bizId: string; bizName: string;
  } | null>(null);

  const filtered = useMemo(() => BUSINESSES.filter((b) => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.sector.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || b.status === status;
    const matchVerif  = verif  === "All" || b.verification === verif;
    return matchSearch && matchStatus && matchVerif;
  }), [search, status, verif]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || status !== "All" || verif !== "All";

  function handleAction(reason: string) {
    if (!modal) return;
    // TODO: call relevant admin API
    // suspend:   PATCH /admin/businesses/:id/suspend   { reason }
    // unsuspend: PATCH /admin/businesses/:id/activate  { reason }
    // verify:    POST  /admin/verifications/:id/approve { reason }
    console.log("Action:", modal.type, modal.bizId, reason);
    setModal(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Businesses
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {BUSINESSES.length.toLocaleString()} total · {BUSINESSES.filter(b => b.status === "active").length} active · {BUSINESSES.filter(b => b.verification === "pending").length} pending verification
          </p>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }}>
          <Download size={13} /> Export
        </Button>
      </div>

      {/* STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Active",     value: BUSINESSES.filter(b => b.status === "active").length,     color: "#10B981", bg: "#ECFDF5" },
          { label: "Suspended",  value: BUSINESSES.filter(b => b.status === "suspended").length,  color: "#EF4444", bg: "#FEF2F2" },
          { label: "Incomplete", value: BUSINESSES.filter(b => b.status === "incomplete").length, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Pending KYB",value: BUSINESSES.filter(b => b.verification === "pending").length, color: "#6366F1", bg: "#EEF2FF" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input
              placeholder="Search by name or sector…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
          >
            <SlidersHorizontal size={13} /> Filters {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: showFilters ? "#00D4FF" : "#0A2540" }} />}
          </button>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setStatus("All"); setVerif("All"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Status", options: STATUSES, val: status, set: setStatus },
              { label: "Verification", options: VERIFICATIONS, val: verif, set: setVerif },
            ].map(({ label, options, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 80 }}>{label}</span>
                {options.map((o) => (
                  <button key={o} onClick={() => { set(o); setPage(1); }} style={{ padding: "4px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: val === o ? "#0A2540" : "#E5E7EB", background: val === o ? "#0A2540" : "white", color: val === o ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 0.12s", textTransform: "capitalize" as const }}>
                    {o}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 80px 90px 90px 100px 100px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Business", "Sector", "Score", "Accounts", "Status", "Verification", ""].map((h) => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#6B7280" }}>No businesses match your filters.</p>
          </div>
        ) : rows.map((b, i) => (
          <div
            key={b.id}
            style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 80px 90px 90px 100px 100px", padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Business name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 1 }}>{b.name}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{b.id} · {b.months}mo data</p>
              </div>
            </div>

            {/* Sector */}
            <p style={{ fontSize: 12, color: "#6B7280" }}>{b.sector}</p>

            {/* Score */}
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: scoreColor(b.score) }}>
              {b.score > 0 ? b.score : "—"}
            </p>

            {/* Accounts */}
            <p style={{ fontSize: 13, color: "#374151" }}>{b.accounts}</p>

            {/* Status */}
            <Badge variant={statusVariant(b.status)} style={{ textTransform: "capitalize", fontSize: 11 }}>{b.status}</Badge>

            {/* Verification */}
            <Badge variant={verifVariant(b.verification)} style={{ textTransform: "capitalize", fontSize: 11 }}>{b.verification}</Badge>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Link href={`/admin/businesses/${b.id}`}>
                <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", transition: "all 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                  title="View profile"
                >
                  <Eye size={12} />
                </button>
              </Link>
              {canAct && b.status === "active" && (
                <button
                  onClick={() => setModal({ type: "suspend", bizId: b.id, bizName: b.name })}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", transition: "all 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                  title="Suspend business"
                >
                  <Ban size={12} />
                </button>
              )}
              {canAct && b.status === "suspended" && (
                <button
                  onClick={() => setModal({ type: "unsuspend", bizId: b.id, bizName: b.name })}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", transition: "all 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                  title="Reactivate business"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D1D5DB" : "#374151" }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid", borderColor: page === p ? "#0A2540" : "#E5E7EB", background: page === p ? "#0A2540" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D1D5DB" : "#374151" }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {modal && (
        <ConfirmModal
          title={modal.type === "suspend" ? `Suspend ${modal.bizName}?`
            : modal.type === "unsuspend" ? `Reactivate ${modal.bizName}?`
            : `Verify ${modal.bizName}?`}
          description={modal.type === "suspend"
            ? "This will immediately block the business from accessing their account and appearing in financer discovery."
            : modal.type === "unsuspend"
            ? "This will restore full access for the business. They will be notified."
            : "Mark this business as verified. This improves their financial identity score and visibility."}
          confirmLabel={modal.type === "suspend" ? "Suspend" : modal.type === "unsuspend" ? "Reactivate" : "Verify"}
          confirmDanger={modal.type === "suspend"}
          onConfirm={handleAction}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
