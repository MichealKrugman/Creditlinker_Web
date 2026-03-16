"use client";

import { useState, useMemo } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  Code2, Key, Activity, Ban, RefreshCw, Copy,
  Download, CheckCircle2, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/developers (paginated)
// ─────────────────────────────────────────────────────────────

const DEVELOPERS = [
  { id: "dev_001", name: "Paystack Engineering",       email: "api@paystack.com",       status: "active",    api_keys: 2, calls_30d: 148_200, last_active: "2 hours ago",  tier: "build",  integration: "Production" },
  { id: "dev_002", name: "Kora Platform",              email: "dev@korapay.com",         status: "active",    api_keys: 1, calls_30d: 82_400,  last_active: "Today",        tier: "signal", integration: "Production" },
  { id: "dev_003", name: "Mono Connect",               email: "eng@mono.co",             status: "active",    api_keys: 3, calls_30d: 320_000, last_active: "1 hour ago",   tier: "build",  integration: "Production" },
  { id: "dev_004", name: "Okra Technologies",          email: "api@okra.ng",             status: "suspended", api_keys: 1, calls_30d: 0,       last_active: "14 days ago",  tier: "read",   integration: "Suspended" },
  { id: "dev_005", name: "Bloc Fintech",               email: "dev@bloc.money",          status: "active",    api_keys: 2, calls_30d: 54_000,  last_active: "Yesterday",    tier: "read",   integration: "Production" },
  { id: "dev_006", name: "Solo Dev (John Okafor)",     email: "john.okafor@gmail.com",   status: "active",    api_keys: 1, calls_30d: 1_200,   last_active: "3 days ago",   tier: "read",   integration: "Sandbox" },
  { id: "dev_007", name: "CredTech Solutions",         email: "api@credtech.ng",         status: "pending",   api_keys: 0, calls_30d: 0,       last_active: "Never",        tier: "read",   integration: "Pending" },
  { id: "dev_008", name: "Zazu Financial",             email: "engineers@zazupay.com",   status: "active",    api_keys: 2, calls_30d: 28_700,  last_active: "Today",        tier: "signal", integration: "Production" },
];

const PAGE_SIZE = 10;
const STATUSES = ["All", "active", "suspended", "pending"];
const TIERS = ["All", "read", "signal", "build"];

function fmtCalls(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? String(n) : "0";
}

function tierColor(t: string): { color: string; bg: string } {
  if (t === "build")  return { color: "#6366F1", bg: "#EEF2FF" };
  if (t === "signal") return { color: "#0891B2", bg: "#F0FDFF" };
  return                      { color: "#6B7280", bg: "#F3F4F6" };
}

function statusVariant(s: string): "success" | "secondary" | "destructive" {
  if (s === "active")    return "success";
  if (s === "suspended") return "destructive";
  return "secondary";
}

function ConfirmModal({ title, description, confirmLabel, confirmDanger, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; confirmDanger?: boolean;
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
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (recorded in audit log)…" rows={3}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} style={confirmDanger ? { background: "#EF4444" } : {}}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDevelopersPage() {
  const user = getMockAdminUser();
  const canAct = canManage(user, "developers");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [tier,   setTier]   = useState("All");
  const [page,   setPage]   = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{ type: "suspend" | "unsuspend"; id: string; name: string } | null>(null);

  const filtered = useMemo(() => DEVELOPERS.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || d.status === status;
    const matchTier   = tier   === "All" || d.tier   === tier;
    return matchSearch && matchStatus && matchTier;
  }), [search, status, tier]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalCalls30d = DEVELOPERS.reduce((s, d) => s + d.calls_30d, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Developers</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {DEVELOPERS.length} registered · {fmtCalls(totalCalls30d)} API calls (30 days)
          </p>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }}><Download size={13} /> Export</Button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Active",       value: DEVELOPERS.filter(d => d.status === "active").length,   color: "#10B981" },
          { label: "Build Tier",   value: DEVELOPERS.filter(d => d.tier === "build").length,      color: "#6366F1" },
          { label: "Signal Tier",  value: DEVELOPERS.filter(d => d.tier === "signal").length,     color: "#0891B2" },
          { label: "30d API Calls",value: fmtCalls(totalCalls30d),                                color: "#0A2540" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input placeholder="Search by name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, height: 38, fontSize: 13 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={13} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <SlidersHorizontal size={13} /> Filters
          </button>
        </div>
        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Status", options: STATUSES, val: status, set: setStatus },
              { label: "Tier",   options: TIERS,    val: tier,   set: setTier },
            ].map(({ label, options, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 60 }}>{label}</span>
                {options.map((o) => (
                  <button key={o} onClick={() => { set(o); setPage(1); }} style={{ padding: "4px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: val === o ? "#0A2540" : "#E5E7EB", background: val === o ? "#0A2540" : "white", color: val === o ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" as const }}>{o}</button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 80px 90px 100px 80px 90px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Developer", "Email", "API Keys", "30d Calls", "Last Active", "Tier", ""].map((h) => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}><p style={{ fontSize: 14, color: "#6B7280" }}>No developers match.</p></div>
        ) : rows.map((d, i) => {
          const tc = tierColor(d.tier);
          return (
            <div key={d.id}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 80px 90px 100px 80px 90px", padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                  {d.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 1 }}>{d.name}</p>
                  <Badge variant={statusVariant(d.status)} style={{ fontSize: 10, textTransform: "capitalize" }}>{d.status}</Badge>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.email}</p>
              <p style={{ fontSize: 13, color: "#374151" }}>{d.api_keys}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmtCalls(d.calls_30d)}</p>
              <p style={{ fontSize: 12, color: "#6B7280" }}>{d.last_active}</p>
              <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: tc.color, background: tc.bg, padding: "3px 8px", borderRadius: 9999, textTransform: "capitalize" }}>{d.tier}</span>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {canAct && d.status === "active" && (
                  <button onClick={() => setModal({ type: "suspend", id: d.id, name: d.name })}
                    style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                    <Ban size={12} />
                  </button>
                )}
                {canAct && d.status === "suspended" && (
                  <button onClick={() => setModal({ type: "unsuspend", id: d.id, name: d.name })}
                    style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
          title={modal.type === "suspend" ? `Suspend ${modal.name}?` : `Reactivate ${modal.name}?`}
          description={modal.type === "suspend" ? "This will revoke all API keys and halt integration access. Partner consents will be preserved but all API calls will return 401." : "Restore API access for this developer. Their existing keys will be reactivated."}
          confirmLabel={modal.type === "suspend" ? "Suspend" : "Reactivate"}
          confirmDanger={modal.type === "suspend"}
          onConfirm={(r) => { console.log(modal.type, modal.id, r); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
