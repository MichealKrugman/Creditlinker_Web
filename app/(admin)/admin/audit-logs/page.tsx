"use client";

import { useState, useMemo } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle2, AlertTriangle, XCircle, Info,
  Download, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockAdminUser } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/audit
//  AuditEntry model: { audit_id, action_type, actor, business_id, occurred_at, detail }
// ─────────────────────────────────────────────────────────────

const AUDIT_ENTRIES = [
  { id: "aud_0148", actor: "Tunde Adeyemi",  actor_role: "super_admin", action_type: "BUSINESS_VERIFIED",     entity: "Aduke Bakeries Ltd",     entity_id: "biz_001", occurred_at: "Today, 10:42",    detail: "Verified CAC + bank statement", severity: "info" },
  { id: "aud_0147", actor: "Chisom Eze",     actor_role: "admin",       action_type: "FINANCER_SUSPENDED",    entity: "QuickCash Capital",      entity_id: "inst_003", occurred_at: "Today, 10:18",   detail: "Multiple unresolved disputes", severity: "warn" },
  { id: "aud_0146", actor: "System",         actor_role: "system",      action_type: "PIPELINE_RUN_FAILED",   entity: "biz_0118",               entity_id: "biz_0118", occurred_at: "Today, 09:54",   detail: "Stage 3 timeout — feature generation", severity: "error" },
  { id: "aud_0145", actor: "Tunde Adeyemi",  actor_role: "super_admin", action_type: "DISPUTE_RESOLVED",      entity: "DISP-2024-0091",         entity_id: "fin_066",  occurred_at: "Today, 09:32",   detail: "Resolved in favour of business. Financer notified.", severity: "info" },
  { id: "aud_0144", actor: "System",         actor_role: "system",      action_type: "RISK_FLAG_RAISED",      entity: "biz_0099",               entity_id: "biz_0099", occurred_at: "Today, 08:50",   detail: "Anomalous transaction velocity detected", severity: "error" },
  { id: "aud_0143", actor: "Fatima Bello",   actor_role: "admin",       action_type: "FINANCER_APPROVED",     entity: "Lapo Microfinance",      entity_id: "inst_002", occurred_at: "Yesterday, 16:20",detail: "KYB documents verified", severity: "info" },
  { id: "aud_0142", actor: "Chisom Eze",     actor_role: "admin",       action_type: "BUSINESS_PROFILE_VIEW", entity: "Konga Fulfilment Co.",   entity_id: "biz_004",  occurred_at: "Yesterday, 15:44",detail: "Admin viewed full financial profile", severity: "info" },
  { id: "aud_0141", actor: "System",         actor_role: "system",      action_type: "CONSENT_EXPIRED",       entity: "biz_002 / inst_005",     entity_id: "con_019",  occurred_at: "Yesterday, 12:00",detail: "Consent validity period ended", severity: "info" },
  { id: "aud_0140", actor: "Tunde Adeyemi",  actor_role: "super_admin", action_type: "ADMIN_CREATED",         entity: "Chisom Eze",             entity_id: "usr_admin_002", occurred_at: "Jan 8, 11:00", detail: "Created scoped admin: businesses:manage, verifications:manage, reports:view", severity: "warn" },
  { id: "aud_0139", actor: "Tunde Adeyemi",  actor_role: "super_admin", action_type: "BUSINESS_SUSPENDED",    entity: "QuickBuild Contractors", entity_id: "biz_006",  occurred_at: "Jan 8, 10:05",   detail: "Fraudulent transaction patterns detected", severity: "warn" },
  { id: "aud_0138", actor: "System",         actor_role: "system",      action_type: "PIPELINE_RUN_SUCCESS",  entity: "NovaChem Industries",    entity_id: "biz_008",  occurred_at: "Jan 8, 09:30",   detail: "Score: 714 · DQ: 88%", severity: "info" },
  { id: "aud_0137", actor: "Fatima Bello",   actor_role: "admin",       action_type: "VERIFICATION_REJECTED", entity: "Lagos Auto Spares",      entity_id: "biz_012",  occurred_at: "Jan 7, 14:20",   detail: "Mismatched bank statement dates", severity: "warn" },
];

const PAGE_SIZE = 10;
const ACTION_TYPES = ["All", "BUSINESS_VERIFIED", "BUSINESS_SUSPENDED", "FINANCER_APPROVED", "FINANCER_SUSPENDED", "DISPUTE_RESOLVED", "RISK_FLAG_RAISED", "PIPELINE_RUN_FAILED", "ADMIN_CREATED", "VERIFICATION_REJECTED"];
const SEVERITIES = ["All", "info", "warn", "error"];
const ACTORS = ["All", "Tunde Adeyemi", "Chisom Eze", "Fatima Bello", "System"];

function severityIcon(s: string) {
  if (s === "error") return <XCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />;
  if (s === "warn")  return <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />;
  return <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />;
}

function roleBadge(role: string) {
  if (role === "super_admin") return <span style={{ fontSize: 9, fontWeight: 700, color: "#00D4FF", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em" }}>Super</span>;
  if (role === "admin")       return <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin</span>;
  return <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em" }}>System</span>;
}

export default function AdminAuditLogsPage() {
  const [search,   setSearch]   = useState("");
  const [action,   setAction]   = useState("All");
  const [severity, setSeverity] = useState("All");
  const [actor,    setActor]    = useState("All");
  const [page,     setPage]     = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => AUDIT_ENTRIES.filter((e) => {
    const matchSearch = !search ||
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.entity.toLowerCase().includes(search.toLowerCase()) ||
      e.action_type.toLowerCase().includes(search.toLowerCase()) ||
      e.detail.toLowerCase().includes(search.toLowerCase());
    const matchAction   = action   === "All" || e.action_type === action;
    const matchSeverity = severity === "All" || e.severity    === severity;
    const matchActor    = actor    === "All" || e.actor       === actor;
    return matchSearch && matchAction && matchSeverity && matchActor;
  }), [search, action, severity, actor]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const hasFilters = search || action !== "All" || severity !== "All" || actor !== "All";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Audit Logs</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {AUDIT_ENTRIES.length} entries · Immutable record of all platform actions
          </p>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }}><Download size={13} /> Export</Button>
      </div>

      {/* NOTE */}
      <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <Info size={14} style={{ color: "#0891B2", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "#0E7490" }}>Audit entries cannot be modified or deleted. All admin actions including reads of sensitive data are recorded here.</p>
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input placeholder="Search actor, entity, action, detail…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, height: 38, fontSize: 13 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={13} /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Filter size={13} /> Filters {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: showFilters ? "#00D4FF" : "#0A2540" }} />}
          </button>
          {hasFilters && <button onClick={() => { setSearch(""); setAction("All"); setSeverity("All"); setActor("All"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} /> Clear</button>}
        </div>

        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Severity", options: SEVERITIES, val: severity, set: setSeverity },
              { label: "Actor",    options: ACTORS,     val: actor,    set: setActor },
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
        <div style={{ display: "grid", gridTemplateColumns: "20px 1.2fr 1.6fr 1fr 1.8fr 110px", padding: "10px 22px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA", gap: 12 }}>
          {["", "Actor", "Action", "Entity", "Detail", "Time"].map((h) => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "48px 22px", textAlign: "center" }}><p style={{ fontSize: 14, color: "#6B7280" }}>No audit entries match.</p></div>
        ) : rows.map((entry, i) => (
          <div key={entry.id}
            style={{ display: "grid", gridTemplateColumns: "20px 1.2fr 1.6fr 1fr 1.8fr 110px", padding: "12px 22px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", gap: 12, transition: "background 0.1s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {severityIcon(entry.severity)}

            {/* Actor */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.actor}</p>
              {roleBadge(entry.actor_role)}
            </div>

            {/* Action */}
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", background: "#F3F4F6", padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.action_type}
            </p>

            {/* Entity */}
            <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.entity}
            </p>

            {/* Detail */}
            <p style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.detail}
            </p>

            {/* Time */}
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{entry.occurred_at}</p>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
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
    </div>
  );
}
