"use client";

import { useState } from "react";
import { ScrollText, Search, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
type LogEntry = {
  id: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  status: number;
  duration_ms: number;
  time: string;
  ip: string;
  request_id: string;
  request_body?: string;
  response_body?: string;
};

const LOGS: LogEntry[] = [
  { id: "req_01", method: "GET",   path: "/business/score",            status: 200, duration_ms: 138, time: "2 min ago",   ip: "102.89.4.22",  request_id: "req_01HX2K9mP", response_body: '{"score_id":"scr_01","overall_score":742}' },
  { id: "req_02", method: "POST",  path: "/business/consent/grant",    status: 200, duration_ms: 210, time: "14 min ago",  ip: "102.89.4.22",  request_id: "req_01HX2K8mP", request_body: '{"institution_id":"inst_abc","duration_days":30}', response_body: '{"consent_id":"con_01","is_active":true}' },
  { id: "req_03", method: "GET",   path: "/business/profile",          status: 200, duration_ms: 89,  time: "1 hr ago",    ip: "102.89.4.22",  request_id: "req_01HX2K7mP" },
  { id: "req_04", method: "POST",  path: "/business/mono/initiate",    status: 503, duration_ms: 3200, time: "1 hr ago",   ip: "102.89.4.22",  request_id: "req_01HX2K6mP", response_body: '{"error":"upstream_timeout","message":"Mono service unavailable"}' },
  { id: "req_05", method: "GET",   path: "/business/readiness",        status: 200, duration_ms: 194, time: "2 hrs ago",   ip: "102.89.4.22",  request_id: "req_01HX2K5mP" },
  { id: "req_06", method: "POST",  path: "/business/consent/revoke",   status: 200, duration_ms: 77,  time: "3 hrs ago",   ip: "102.89.4.22",  request_id: "req_01HX2K4mP", request_body: '{"consent_id":"con_00"}' },
  { id: "req_07", method: "GET",   path: "/institution/discovery",     status: 401, duration_ms: 22,  time: "5 hrs ago",   ip: "192.168.1.10", request_id: "req_01HX2K3mP", response_body: '{"error":"unauthorized","message":"Invalid API key"}' },
  { id: "req_08", method: "GET",   path: "/health",                    status: 200, duration_ms: 8,   time: "6 hrs ago",   ip: "102.89.4.22",  request_id: "req_01HX2K2mP" },
  { id: "req_09", method: "POST",  path: "/institution/discovery/criteria", status: 200, duration_ms: 162, time: "1 day ago", ip: "102.89.4.22", request_id: "req_01HX2K1mP" },
  { id: "req_10", method: "GET",   path: "/business/snapshots",        status: 200, duration_ms: 220, time: "1 day ago",   ip: "102.89.4.22",  request_id: "req_01HX2K0mP" },
];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:   { bg: "#ECFDF5", text: "#059669" },
  POST:  { bg: "#EFF6FF", text: "#2563EB" },
  PATCH: { bg: "#FEF3C7", text: "#D97706" },
};

/* ─────────────────────────────────────────────────────────
   LOG ROW
───────────────────────────────────────────────────────── */
function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const ok = entry.status >= 200 && entry.status < 300;
  const mc = METHOD_COLORS[entry.method] ?? { bg: "#F3F4F6", text: "#374151" };
  const slow = entry.duration_ms > 1000;

  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      {/* Row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "11px 22px", cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
      >
        {/* Status icon */}
        <div style={{ flexShrink: 0 }}>
          {ok
            ? <CheckCircle2 size={13} style={{ color: "#10B981" }} />
            : <XCircle size={13} style={{ color: "#EF4444" }} />
          }
        </div>

        {/* Status code */}
        <span style={{
          fontSize: 12, fontWeight: 700, width: 36, flexShrink: 0,
          color: ok ? "#10B981" : "#EF4444",
        }}>
          {entry.status}
        </span>

        {/* Method */}
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
          background: mc.bg, color: mc.text, flexShrink: 0,
          fontFamily: "var(--font-mono, monospace)",
          minWidth: 40, textAlign: "center" as const,
        }}>
          {entry.method}
        </span>

        {/* Path */}
        <code style={{ flex: 1, fontSize: 12, color: "#374151", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.path}
        </code>

        {/* Latency */}
        <span style={{
          fontSize: 11, fontWeight: 600, flexShrink: 0,
          color: slow ? "#F59E0B" : "#9CA3AF",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          <Clock size={10} />
          {entry.duration_ms >= 1000 ? `${(entry.duration_ms / 1000).toFixed(1)}s` : `${entry.duration_ms}ms`}
        </span>

        {/* Time */}
        <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{entry.time}</span>

        {/* Expand icon */}
        <span style={{ color: "#D1D5DB", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ background: "#0A2540", padding: "14px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Meta */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Request ID", value: entry.request_id },
              { label: "IP Address", value: entry.ip },
              { label: "Latency",    value: `${entry.duration_ms}ms` },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{m.label}</p>
                <code style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono, monospace)" }}>{m.value}</code>
              </div>
            ))}
          </div>
          {/* Bodies */}
          <div style={{ display: "grid", gridTemplateColumns: entry.request_body ? "1fr 1fr" : "1fr", gap: 12 }}>
            {entry.request_body && (
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Request Body</p>
                <pre style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-mono, monospace)", background: "rgba(0,0,0,0.3)", borderRadius: 7, padding: "10px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {entry.request_body}
                </pre>
              </div>
            )}
            {entry.response_body && (
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Response Body</p>
                <pre style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-mono, monospace)", background: "rgba(0,0,0,0.3)", borderRadius: 7, padding: "10px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {entry.response_body}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function LogsPage() {
  const [query,       setQuery]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");

  const filtered = LOGS.filter(l => {
    const matchQuery  = !query || l.path.includes(query) || l.request_id.includes(query);
    const ok = l.status >= 200 && l.status < 300;
    const matchStatus = statusFilter === "all" ? true : statusFilter === "success" ? ok : !ok;
    return matchQuery && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Request Logs
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>API request history — last 30 days</p>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by path or request ID…"
            style={{
              width: "100%", padding: "9px 36px 9px 34px",
              border: "1px solid #E5E7EB", borderRadius: 9,
              fontSize: 13, color: "#374151", outline: "none",
              background: "white", boxSizing: "border-box",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        {(["all", "success", "error"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${statusFilter === f ? "#0A2540" : "#E5E7EB"}`,
              background: statusFilter === f ? "#0A2540" : "white",
              color: statusFilter === f ? "white" : "#374151",
              textTransform: "capitalize" as const, transition: "all 0.12s",
            }}
          >
            {f === "all" ? "All" : f === "success" ? "2xx" : "4xx/5xx"}
          </button>
        ))}

        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} requests</span>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        {/* Column heads */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "10px 22px", background: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
        }}>
          {[{ w: 13, label: "" }, { w: 36, label: "Status" }, { w: 40, label: "Method" }, { label: "Path", flex: 1 }, { w: 60, label: "Duration" }, { w: 80, label: "Time" }, { w: 13, label: "" }].map((col, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase",
              ...(col.flex ? { flex: 1 } : { width: col.w, flexShrink: 0 }),
            }}>
              {col.label}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
            <ScrollText size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>No logs match your filters.</p>
          </div>
        ) : (
          filtered.map(entry => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
