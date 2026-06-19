"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Info,
  Download, Filter, RefreshCw, Activity,
  Calendar, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUser } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
type Severity = "info" | "warn" | "error";
type Surface  = "cards" | "scoring" | "portal" | "sdk" | "android" | "ios" | "whatsapp" | "system";

interface PlatformEventRow {
  id:          string;
  actor_id:    string;
  actor_type:  string;
  surface:     Surface;
  event_type:  string;
  severity:    Severity;
  target_type: string | null;
  target_id:   string | null;
  business_id: string | null;
  message:     string;
  metadata:    Record<string, unknown>;
  created_at:  string;
}

const PAGE_SIZE = 20;

const SURFACES:   Array<Surface | "All"> = ["All", "cards", "scoring", "portal", "sdk", "android", "ios", "whatsapp", "system"];
const SEVERITIES: Array<Severity | "All"> = ["All", "info", "warn", "error"];

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function severityIcon(s: Severity) {
  if (s === "error") return <XCircle    size={13} style={{ color: "#EF4444", flexShrink: 0 }} />;
  if (s === "warn")  return <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />;
  return                    <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />;
}

function surfaceBadge(surface: Surface) {
  const colors: Record<Surface, { bg: string; color: string; border: string }> = {
    cards:     { bg: "rgba(0,212,255,0.08)",   color: "#0891B2", border: "rgba(0,212,255,0.2)" },
    scoring:   { bg: "rgba(139,92,246,0.08)",  color: "#7C3AED", border: "rgba(139,92,246,0.2)" },
    portal:    { bg: "rgba(245,158,11,0.08)",  color: "#D97706", border: "rgba(245,158,11,0.2)" },
    sdk:       { bg: "rgba(16,185,129,0.08)",  color: "#059669", border: "rgba(16,185,129,0.2)" },
    android:   { bg: "rgba(52,211,153,0.08)",  color: "#10B981", border: "rgba(52,211,153,0.2)" },
    ios:       { bg: "rgba(99,102,241,0.08)",  color: "#6366F1", border: "rgba(99,102,241,0.2)" },
    whatsapp:  { bg: "rgba(34,197,94,0.08)",   color: "#16A34A", border: "rgba(34,197,94,0.2)" },
    system:    { bg: "#F3F4F6",                color: "#6B7280", border: "#E5E7EB" },
  };
  const c = colors[surface] ?? colors.system;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
      {surface}
    </span>
  );
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─────────────────────────────────────────────────────────────
//  LOGGING STATUS BANNER
// ─────────────────────────────────────────────────────────────
function LoggingStatusBanner({ enabled }: { enabled: boolean | null }) {
  if (enabled === null) return null;
  if (enabled) return null; // no banner when on — only show when OFF

  return (
    <div style={{ background: "#FEF9C3", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10,
      padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
      <AlertTriangle size={14} style={{ color: "#CA8A04", flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: "#854D0E" }}>
        <strong>Platform logging is currently OFF.</strong> New events are not being recorded.
        Turn it on in <strong>Settings → Platform</strong> when you need full observability.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminAuditLogsPage() {
  const [events,    setEvents]    = useState<PlatformEventRow[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [surface,   setSurface]   = useState<Surface | "All">("All");
  const [severity,  setSeverity]  = useState<Severity | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState<boolean | null>(null);
  const [activeTab,   setActiveTab]   = useState<"platform_events" | "admin_actions">("platform_events");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [adminActions, setAdminActions] = useState<any[]>([]);
  const [adminActionsLoading, setAdminActionsLoading] = useState(false);

  // Fetch logging toggle status
  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_logging_enabled")
      .single()
      .then(({ data }) => {
        if (data) setLoggingEnabled(data.value === true || data.value === "true");
      });
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("platform_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (surface  !== "All") query = query.eq("surface",  surface);
      if (severity !== "All") query = query.eq("severity", severity);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59");
      if (search.trim()) {
        // Supabase full-text style: search across event_type, message, actor_id
        query = query.or(
          `event_type.ilike.%${search}%,message.ilike.%${search}%,actor_id.ilike.%${search}%`
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setEvents(data ?? []);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("[audit-logs] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [page, surface, severity, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Admin actions loader
  const fetchAdminActions = useCallback(async () => {
    setAdminActionsLoading(true);
    try {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .eq("actor_type", "admin")
        .order("created_at", { ascending: false })
        .limit(100);
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
      const { data } = await q;
      setAdminActions(data ?? []);
    } catch (err) {
      console.error("[audit-logs] admin actions fetch failed", err);
    } finally {
      setAdminActionsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "admin_actions") fetchAdminActions();
  }, [activeTab, fetchAdminActions]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [surface, severity, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = search || surface !== "All" || severity !== "All" || dateFrom || dateTo;

  async function handleExport() {
    let query = supabase
      .from("platform_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (surface  !== "All") query = query.eq("surface",  surface);
    if (severity !== "All") query = query.eq("severity", severity);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59");
    if (search.trim()) {
      query = query.or(
        `event_type.ilike.%${search}%,message.ilike.%${search}%,actor_id.ilike.%${search}%`
      );
    }

    const { data } = await query;
    if (!data) return;
    const csv = [
      ["id", "created_at", "surface", "event_type", "severity", "actor_id", "actor_type", "target_type", "target_id", "business_id", "message"].join(","),
      ...data.map(r => [
        r.id, r.created_at, r.surface, r.event_type, r.severity,
        r.actor_id, r.actor_type, r.target_type ?? "", r.target_id ?? "",
        r.business_id ?? "", `"${r.message.replace(/"/g, '""')}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    const suffix = [surface !== "All" ? surface : "", severity !== "All" ? severity : "", dateFrom || dateTo ? "filtered" : ""].filter(Boolean).join("-");
    a.download = `platform-events-${new Date().toISOString().slice(0, 10)}${suffix ? `-${suffix}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* TABS */}
      <div style={{ display: "flex", gap: 2, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {([
          { id: "platform_events", label: "Platform Events", icon: <Activity size={13} /> },
          { id: "admin_actions",   label: "Admin Actions",   icon: <ShieldCheck size={13} /> },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: activeTab === t.id ? "#0A2540" : "transparent", color: activeTab === t.id ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Platform Events
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {loading ? "Loading…" : `${total.toLocaleString()} events · All surfaces`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={activeTab === "admin_actions" ? fetchAdminActions : fetchEvents} disabled={loading || adminActionsLoading}>
            <RefreshCw size={13} className={(loading || adminActionsLoading) ? "animate-spin" : ""} /> Refresh
          </Button>
          {activeTab === "platform_events" && (
            <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={handleExport}>
              <Download size={13} /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* LOGGING STATUS BANNER */}
      <LoggingStatusBanner enabled={loggingEnabled} />

      {/* INFO NOTE */}
      <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <Info size={14} style={{ color: "#0891B2", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "#0E7490" }}>
          Platform events are append-only — immutable records from all surfaces: cards, scoring, portal, SDK, mobile apps, and system jobs.
          Toggle logging on/off in <strong>Settings → Platform</strong>.
        </p>
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            <Input placeholder="Search event type, message, actor…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, border: "1.5px solid", borderRadius: 8, borderColor: showFilters ? "#0A2540" : "#E5E7EB", background: showFilters ? "#0A2540" : "white", color: showFilters ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Filter size={13} /> Filters {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: showFilters ? "#00D4FF" : "#0A2540" }} />}
          </button>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setSurface("All"); setSeverity("All"); }}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 60 }}>Date</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} style={{ color: "#9CA3AF" }} />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  style={{ height: 32, padding: "0 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12, color: "#374151", outline: "none", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  style={{ height: 32, padding: "0 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12, color: "#374151", outline: "none", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={11} /> Clear dates
                  </button>
                )}
              </div>
            </div>
            {activeTab === "platform_events" && [
              { label: "Surface",  options: SURFACES,   val: surface,  set: (v: string) => setSurface(v as Surface | "All") },
              { label: "Severity", options: SEVERITIES, val: severity, set: (v: string) => setSeverity(v as Severity | "All") },
            ].map(({ label, options, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 60 }}>{label}</span>
                {options.map((o) => (
                  <button key={o} onClick={() => set(o)}
                    style={{ padding: "4px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: val === o ? "#0A2540" : "#E5E7EB", background: val === o ? "#0A2540" : "white", color: val === o ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" as const }}>
                    {o}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADMIN ACTIONS TAB ─────────────────────────────────── */}
      {activeTab === "admin_actions" && (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 120px 100px", padding: "10px 22px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA", gap: 12 }}>
            {["Action", "Target", "Actor", "When"].map((h) => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
            ))}
          </div>
          {adminActionsLoading ? (
            <div style={{ padding: "48px 22px", textAlign: "center" }}>
              <Activity size={20} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading admin actions…</p>
            </div>
          ) : adminActions.length === 0 ? (
            <div style={{ padding: "48px 22px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#6B7280" }}>No admin actions found{(dateFrom || dateTo) ? " in the selected date range." : "."}</p>
            </div>
          ) : adminActions.map((a: any, i: number) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "130px 1fr 120px 100px", padding: "11px 22px", borderBottom: i < adminActions.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", gap: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <p style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", background: "#F3F4F6", padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.action}
              </p>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "#0A2540", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.target_type}{a.target_id ? ` · ${a.target_id.slice(0, 12)}…` : ""}
                </p>
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <p style={{ fontSize: 10, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {Object.entries(a.metadata).filter(([k]) => !["admin_id"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.actor_id?.slice(0, 16)}…
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{relativeTime(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── PLATFORM EVENTS TAB ──────────────────────────────── */}
      {activeTab === "platform_events" && (
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "16px 80px 130px 1fr 1.6fr 100px", padding: "10px 22px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA", gap: 12 }}>
          {["", "Surface", "Event", "Actor", "Message", "When"].map((h) => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <Activity size={20} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading events…</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#6B7280" }}>No events found.{hasFilters ? " Try adjusting your filters." : " Events will appear here once logging is active."}</p>
          </div>
        ) : events.map((ev, i) => (
          <div key={ev.id}
            style={{ display: "grid", gridTemplateColumns: "16px 80px 130px 1fr 1.6fr 100px", padding: "11px 22px", borderBottom: i < events.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", gap: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

            {severityIcon(ev.severity)}

            {/* Surface */}
            {surfaceBadge(ev.surface)}

            {/* Event type */}
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", background: "#F3F4F6", padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ev.event_type}
            </p>

            {/* Actor */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#0A2540", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {ev.actor_id}
              </p>
              <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "capitalize" }}>{ev.actor_type}</p>
            </div>

            {/* Message */}
            <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ev.message}
            </p>

            {/* When */}
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{relativeTime(ev.created_at)}</p>
          </div>
        ))}
      </div>
      )}

      {/* PAGINATION */}
      {activeTab === "platform_events" && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#D1D5DB" : "#374151" }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid", borderColor: page === p ? "#0A2540" : "#E5E7EB", background: page === p ? "#0A2540" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#D1D5DB" : "#374151" }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

