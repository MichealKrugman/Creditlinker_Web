"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Search, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDeveloperAccount } from "@/lib/developer-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type LogEntry = {
  id:              string;
  method:          string;
  endpoint:        string;
  status_code:     number;
  response_time_ms: number | null;
  environment:     "live" | "test";
  requested_at:    string;
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: "#ECFDF5", text: "#059669" },
  POST:   { bg: "#EFF6FF", text: "#2563EB" },
  PATCH:  { bg: "#FEF3C7", text: "#D97706" },
  PUT:    { bg: "#FEF3C7", text: "#D97706" },
  DELETE: { bg: "#FEF2F2", text: "#DC2626" },
};

function formatTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─────────────────────────────────────────────────────────
   LOG ROW
───────────────────────────────────────────────────────── */
function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const ok   = entry.status_code >= 200 && entry.status_code < 300;
  const mc   = METHOD_COLORS[entry.method] ?? { bg: "#F3F4F6", text: "#374151" };
  const slow = (entry.response_time_ms ?? 0) > 1000;
  const ms   = entry.response_time_ms;
  const latencyStr = ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 22px", cursor: "pointer", transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
      >
        <div style={{ flexShrink: 0 }}>
          {ok
            ? <CheckCircle2 size={13} style={{ color: "#10B981" }} />
            : <XCircle size={13} style={{ color: "#EF4444" }} />
          }
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, width: 36, flexShrink: 0, color: ok ? "#10B981" : "#EF4444" }}>
          {entry.status_code}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
          background: mc.bg, color: mc.text, flexShrink: 0,
          fontFamily: "var(--font-mono, monospace)",
          minWidth: 40, textAlign: "center" as const,
        }}>
          {entry.method}
        </span>
        <code style={{ flex: 1, fontSize: 12, color: "#374151", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
          {entry.endpoint}
        </code>
        <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, color: slow ? "#F59E0B" : "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={10} /> {latencyStr}
        </span>
        <span className="dev-log-time" style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
          {formatTime(entry.requested_at)}
        </span>
        <span style={{ color: "#D1D5DB", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {expanded && (
        <div style={{ background: "#0A2540", padding: "14px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Log ID",      value: entry.id },
              { label: "Environment", value: entry.environment },
              { label: "Latency",     value: latencyStr },
              { label: "Timestamp",   value: new Date(entry.requested_at).toLocaleString("en-NG") },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 3 }}>{m.label}</p>
                <code style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono, monospace)" }}>{m.value}</code>
              </div>
            ))}
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
  const { account } = useDeveloperAccount();
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [envFilter,    setEnvFilter]    = useState<"all" | "live" | "test">("all");

  const loadLogs = useCallback(async () => {
    if (!account) return;
    setLoading(true);

    let q = supabase
      .from("developer_api_logs")
      .select("id, method, endpoint, status_code, response_time_ms, environment, requested_at")
      .eq("developer_id", account.id)
      .order("requested_at", { ascending: false })
      .limit(200);

    if (envFilter !== "all") q = q.eq("environment", envFilter);

    const { data, error } = await q;
    if (!error && data) setLogs(data);
    setLoading(false);
  }, [account, envFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(l => {
    const matchQuery  = !query || l.endpoint.includes(query) || l.id.includes(query);
    const ok          = l.status_code >= 200 && l.status_code < 300;
    const matchStatus = statusFilter === "all" ? true : statusFilter === "success" ? ok : !ok;
    return matchQuery && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .dev-log-time { display: none !important; } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Request Logs
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>API request history — last 30 days</p>
        </div>
        <button
          onClick={loadLogs}
          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", gap: 5 }}
        >
          {loading ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : "↻"} Refresh
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by endpoint or log ID…"
            style={{ width: "100%", padding: "9px 36px 9px 34px", border: "1px solid #E5E7EB", borderRadius: 9, fontSize: 13, color: "#374151", outline: "none", background: "white", boxSizing: "border-box" as const }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {(["all", "success", "error"] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${statusFilter === f ? "#0A2540" : "#E5E7EB"}`,
            background: statusFilter === f ? "#0A2540" : "white",
            color: statusFilter === f ? "white" : "#374151",
            textTransform: "capitalize" as const, transition: "all 0.12s",
          }}>
            {f === "all" ? "All" : f === "success" ? "2xx" : "4xx/5xx"}
          </button>
        ))}

        {(["all", "live", "test"] as const).map(f => (
          <button key={f} onClick={() => setEnvFilter(f)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${envFilter === f ? "#0A2540" : "#E5E7EB"}`,
            background: envFilter === f ? "#0A2540" : "white",
            color: envFilter === f ? "white" : "#374151",
            textTransform: "capitalize" as const, transition: "all 0.12s",
          }}>
            {f === "all" ? "All envs" : f}
          </button>
        ))}

        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} requests</span>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
          {[
            { w: 13,  label: "" },
            { w: 36,  label: "Status" },
            { w: 40,  label: "Method" },
            { label: "Endpoint", flex: true },
            { w: 60,  label: "Duration" },
            { w: 80,  label: "Time", cls: "dev-log-time" },
            { w: 13,  label: "" },
          ].map((col, i) => (
            <span key={i} className={(col as { cls?: string }).cls} style={{
              fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" as const,
              ...((col as { flex?: boolean }).flex ? { flex: 1 } : { width: col.w, flexShrink: 0 }),
            }}>
              {col.label}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <Loader2 size={24} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading request logs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <ScrollText size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              {logs.length === 0 ? "No requests yet" : "No logs match your filters"}
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              {logs.length === 0
                ? "Make your first API call using an API key and it will appear here."
                : "Try clearing your filters."}
            </p>
          </div>
        ) : (
          filtered.map(entry => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
