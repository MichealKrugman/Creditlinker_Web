"use client";

import { useState, useMemo } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  Landmark, CheckCircle2, Ban, RefreshCw, Eye,
  Download, Building2, ShieldCheck, AlertTriangle,
  TrendingUp, DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/financers (paginated)
// ─────────────────────────────────────────────────────────────

const FINANCERS = [
  { id: "inst_001", name: "Stanbic IBTC Bank",       type: "Commercial Bank",      status: "active",   approval: "approved",  active_consents: 34, active_financing: 12, portfolio_ngn: 480_000_000, disputes: 0, created: "2022-09-10" },
  { id: "inst_002", name: "Lapo Microfinance",        type: "Microfinance Bank",    status: "active",   approval: "approved",  active_consents: 21, active_financing: 8,  portfolio_ngn: 42_500_000,  disputes: 1, created: "2023-01-22" },
  { id: "inst_003", name: "QuickCash Capital",        type: "Non-Bank Lender",      status: "suspended",approval: "approved",  active_consents: 3,  active_financing: 2,  portfolio_ngn: 8_000_000,   disputes: 3, created: "2023-04-05" },
  { id: "inst_004", name: "Providus Bank",            type: "Commercial Bank",      status: "active",   approval: "approved",  active_consents: 18, active_financing: 5,  portfolio_ngn: 210_000_000, disputes: 0, created: "2022-11-14" },
  { id: "inst_005", name: "Trove Finance Ltd",        type: "Fintech Lender",       status: "active",   approval: "approved",  active_consents: 9,  active_financing: 3,  portfolio_ngn: 28_000_000,  disputes: 0, created: "2023-06-08" },
  { id: "inst_006", name: "Infinity Leasing Co.",     type: "Asset Financier",      status: "pending",  approval: "pending",   active_consents: 0,  active_financing: 0,  portfolio_ngn: 0,           disputes: 0, created: "2024-01-30" },
  { id: "inst_007", name: "Agrosprint Capital",       type: "Agri Lender",          status: "pending",  approval: "pending",   active_consents: 0,  active_financing: 0,  portfolio_ngn: 0,           disputes: 0, created: "2024-02-12" },
  { id: "inst_008", name: "Zenith Leasing",           type: "Asset Financier",      status: "active",   approval: "approved",  active_consents: 7,  active_financing: 4,  portfolio_ngn: 67_000_000,  disputes: 0, created: "2023-03-19" },
];

const PAGE_SIZE = 10;
const STATUSES = ["All", "active", "suspended", "pending"];
const TYPES = ["All", "Commercial Bank", "Microfinance Bank", "Non-Bank Lender", "Fintech Lender", "Asset Financier", "Agri Lender"];

function fmtNgn(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `₦${n}` : "—";
}

function statusVariant(s: string): "success" | "warning" | "destructive" | "secondary" {
  if (s === "active")    return "success";
  if (s === "suspended") return "destructive";
  return "secondary";
}

function ConfirmModal({
  title, description, confirmLabel, confirmDanger, onConfirm, onClose,
}: {
  title: string; description: string;
  confirmLabel: string; confirmDanger?: boolean;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 440, padding: 28 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 18 }}>{description}</p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Reason <span style={{ color: "#EF4444" }}>*</span></label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason (recorded in audit log)…" rows={3}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} style={confirmDanger ? { background: "#EF4444" } : {}}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinancersPage() {
  const user = getMockAdminUser();
  const canAct = canManage(user, "financers");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type,   setType]   = useState("All");
  const [page,   setPage]   = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{ type: "approve" | "suspend" | "unsuspend"; id: string; name: string } | null>(null);

  const filtered = useMemo(() => FINANCERS.filter((f) => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || f.status === status;
    const matchType   = type   === "All" || f.type   === type;
    return matchSearch && matchStatus && matchType;
  }), [search, status, type]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const hasFilters = search || status !== "All" || type !== "All";

  function handleAction(reason: string) {
    if (!modal) return;
    // TODO:
    // approve:   POST /admin/financers/:id/approve  { reason }
    // suspend:   POST /admin/financers/:id/suspend  { reason }
    // unsuspend: POST /admin/financers/:id/activate { reason }
    console.log("Action:", modal.type, modal.id, reason);
    setModal(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Financers</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {FINANCERS.length} institutions · {FINANCERS.filter(f => f.approval === "pending").length} awaiting approval
          </p>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }}><Download size={13} /> Export</Button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Active",          value: FINANCERS.filter(f => f.status === "active").length,    color: "#10B981" },
          { label: "Pending Approval",value: FINANCERS.filter(f => f.approval === "pending").length, color: "#6366F1" },
          { label: "Suspended",       value: FINANCERS.filter(f => f.status === "suspended").length, color: "#EF4444" },
          { label: "Total Portfolio", value: fmtNgn(FINANCERS.reduce((s, f) => s + f.portfolio_ngn, 0)), color: "#0A2540" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* PENDING APPROVALS BANNER */}
      {canAct && FINANCERS.filter(f => f.approval === "pending").length > 0 && (
        <div style={{ background: "#EEF2FF", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldCheck size={16} style={{ color: "#6366F1", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#312E81", marginBottom: 2 }}>
              {FINANCERS.filter(f => f.approval === "pending").length} institution{FINANCERS.filter(f => f.approval === "pending").length > 1 ? "s" : ""} awaiting approval
            </p>
            <p style={{ fontSize: 12, color: "#4338CA" }}>Review their documents before granting platform access.</p>
          </div>
          <button onClick={() => setStatus("pending")} style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", background: "none", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            Review
          </button>
        </div>
      )}

      {/* SEARCH + FILTERS */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input placeholder="Search institutions…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, height: 38, fontSize: 13 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={13} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <SlidersHorizontal size={13} /> Filters
          </button>
          {hasFilters && <button onClick={() => { setSearch(""); setStatus("All"); setType("All"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} /> Clear</button>}
        </div>
        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Status", options: STATUSES, val: status, set: setStatus },
              { label: "Type",   options: TYPES,    val: type,   set: setType },
            ].map(({ label, options, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 60 }}>{label}</span>
                {options.map((o) => (
                  <button key={o} onClick={() => { set(o); setPage(1); }} style={{ padding: "4px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: val === o ? "#0A2540" : "#E5E7EB", background: val === o ? "#0A2540" : "white", color: val === o ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>{o}</button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 90px 110px 90px 80px 90px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Institution", "Type", "Portfolio", "Active Fin.", "Consents", "Disputes", ""].map((h) => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}><p style={{ fontSize: 14, color: "#6B7280" }}>No financers match.</p></div>
        ) : rows.map((f, i) => (
          <div key={f.id}
            style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 90px 110px 90px 80px 90px", padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                {f.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 1 }}>{f.name}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{f.id}</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{f.type}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540" }}>{fmtNgn(f.portfolio_ngn)}</p>
            <p style={{ fontSize: 13, color: "#374151" }}>{f.active_financing}</p>
            <p style={{ fontSize: 13, color: "#374151" }}>{f.active_consents}</p>
            <p style={{ fontSize: 13, fontWeight: f.disputes > 0 ? 700 : 400, color: f.disputes > 0 ? "#EF4444" : "#374151" }}>{f.disputes}</p>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {canAct && f.approval === "pending" && (
                <button onClick={() => setModal({ type: "approve", id: f.id, name: f.name })}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "#ECFDF5", color: "#10B981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  Approve
                </button>
              )}
              {canAct && f.status === "active" && f.approval === "approved" && (
                <button onClick={() => setModal({ type: "suspend", id: f.id, name: f.name })}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                  <Ban size={12} />
                </button>
              )}
              {canAct && f.status === "suspended" && (
                <button onClick={() => setModal({ type: "unsuspend", id: f.id, name: f.name })}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D1D5DB" : "#374151" }}><ChevronLeft size={15} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (<button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid", borderColor: page === p ? "#0A2540" : "#E5E7EB", background: page === p ? "#0A2540" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D1D5DB" : "#374151" }}><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {modal && (
        <ConfirmModal
          title={modal.type === "approve" ? `Approve ${modal.name}?` : modal.type === "suspend" ? `Suspend ${modal.name}?` : `Reactivate ${modal.name}?`}
          description={modal.type === "approve" ? "Grant this institution access to the Creditlinker platform. They will be able to browse businesses and make financing offers." : modal.type === "suspend" ? "This will revoke the institution's platform access immediately. Active consents will be preserved but no new requests can be made." : "Restore platform access for this institution."}
          confirmLabel={modal.type === "approve" ? "Approve" : modal.type === "suspend" ? "Suspend" : "Reactivate"}
          confirmDanger={modal.type === "suspend"}
          onConfirm={handleAction}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
