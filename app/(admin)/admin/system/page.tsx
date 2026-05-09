"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server, Activity, Database, Cpu, HardDrive,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Zap, Clock, Globe, ShieldCheck, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, isSuperAdmin } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

async function callFn(name: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function statusDot(status: string) {
  const color = status === "healthy" || status === "operational" ? "#10B981"
    : status === "degraded" ? "#F59E0B"
    : "#EF4444";
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function normaliseStatus(s: string) {
  if (s === "operational") return "healthy";
  if (s === "outage")      return "down";
  return s; // degraded → degraded
}

function incidentSeverityBadge(s: string) {
  if (s === "error")   return <Badge variant="destructive" style={{ fontSize: 10 }}>Critical</Badge>;
  if (s === "warning" || s === "warn") return <Badge variant="warning" style={{ fontSize: 10 }}>Warning</Badge>;
  return <Badge variant="secondary" style={{ fontSize: 10 }}>Info</Badge>;
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminSystemPage() {
  const user = getMockAdminUser();

  const [health,  setHealth]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callFn("admin-get-system-health");
      setHealth(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("[system] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived ────────────────────────────────────────────────
  const services        = (health?.services ?? []).map((s: any) => ({ ...s, status: normaliseStatus(s.status) }));
  const degraded        = services.filter((s: any) => s.status === "degraded").length;
  const down            = services.filter((s: any) => s.status === "down").length;
  const recentErrors    = health?.recent_errors ?? [];
  const dbMetrics       = health?.db_metrics ?? {};
  const apiMetrics      = health?.api_metrics ?? {};
  const queueDepth      = health?.queue_depth ?? {};

  const infrastructure = [
    { label: "Transactions (total)",   value: (dbMetrics.normalized_transactions ?? 0).toLocaleString(), bar: Math.min(100, Math.round((dbMetrics.normalized_transactions ?? 0) / 1000)), color: "#10B981", icon: <Activity size={14} />,  sub: "normalized_transactions table" },
    { label: "Platform Events",        value: (dbMetrics.platform_events ?? 0).toLocaleString(),          bar: Math.min(100, Math.round((dbMetrics.platform_events ?? 0) / 500)),         color: "#818CF8", icon: <Database size={14} />,  sub: "platform_events table" },
    { label: "API Req / hour",         value: (apiMetrics.requests_1h ?? 0).toLocaleString(),             bar: Math.min(100, Math.round((apiMetrics.requests_1h ?? 0) / 20)),              color: "#38BDF8", icon: <Zap size={14} />,       sub: `${apiMetrics.error_rate_pct ?? 0}% error rate` },
    { label: "KYC Queue",              value: String(queueDepth.kyc_pending ?? 0),                        bar: Math.min(100, (queueDepth.kyc_pending ?? 0) * 5),                           color: "#F59E0B", icon: <ShieldCheck size={14} />,sub: `${queueDepth.disputes_open ?? 0} open disputes` },
  ];

  // Map recent_errors → incident-like entries
  const incidents = recentErrors.slice(0, 4).map((e: any) => ({
    id:       e.id?.slice(0, 12) ?? "—",
    title:    e.event_type ?? e.message ?? "Unknown error",
    severity: e.severity ?? "error",
    status:   "resolved",
    started:  e.time ? new Date(e.time).toLocaleString() : "—",
    resolved: null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>System</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <Badge variant="secondary">Checking…</Badge>
              : down > 0    ? <Badge variant="destructive">{down} service down</Badge>
              : degraded > 0 ? <Badge variant="warning">{degraded} degraded</Badge>
              : <Badge variant="success">All systems operational</Badge>}
            {lastRefresh && !loading && (
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                Last checked {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Loader2 size={22} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading system health…</p>
        </div>
      )}

      {!loading && health && (
        <>
          {/* ACTIVE INCIDENT BANNER */}
          {(health.overall_status === "degraded" || health.overall_status === "outage") && (
            <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <AlertTriangle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
                  Platform health degraded — {degraded} surface{degraded > 1 ? "s" : ""} with elevated error rate
                </p>
                <p style={{ fontSize: 12, color: "#B45309" }}>
                  {services.filter((s: any) => s.status !== "healthy").map((s: any) => s.name).join(", ")} · Engineering team notified.
                </p>
              </div>
              <Badge variant="warning" style={{ flexShrink: 0 }}>Investigating</Badge>
            </div>
          )}

          {/* INFRA METRICS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {infrastructure.map((m) => (
              <div key={m.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>{m.icon}</div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em" }}>{m.value}</p>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${m.bar}%`, background: m.color, borderRadius: 9999, transition: "width 0.6s ease" }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 1 }}>{m.label}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

            {/* SERVICES TABLE */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Service Status</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px", padding: "8px 22px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Service", "", "Error Rate", "Events/hr", "Surface"].map((h) => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
                ))}
              </div>
              {services.length === 0 ? (
                <div style={{ padding: "32px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No service data. Enable platform logging to track health.</p>
                </div>
              ) : services.map((svc: any, i: number) => (
                <div key={svc.surface}
                  style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px", padding: "11px 22px", borderBottom: i < services.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540" }}>{svc.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {statusDot(svc.status)}
                    <span style={{ fontSize: 11, fontWeight: 600, color: svc.status === "healthy" ? "#10B981" : svc.status === "degraded" ? "#F59E0B" : "#EF4444", textTransform: "capitalize" }}>{svc.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: (svc.error_rate_pct ?? 0) > 10 ? "#F59E0B" : "#374151" }}>
                    {svc.error_rate_pct ?? 0}%
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{(svc.events_1h ?? 0).toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{svc.surface}</p>
                </div>
              ))}
            </div>

            {/* RECENT ERRORS */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Recent Errors</p>
              </div>
              <div>
                {incidents.length === 0 ? (
                  <div style={{ padding: "32px 22px", textAlign: "center" }}>
                    <CheckCircle2 size={20} style={{ color: "#10B981", margin: "0 auto 8px", display: "block" }} />
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>No recent errors.</p>
                  </div>
                ) : incidents.map((inc: any, i: number) => (
                  <div key={inc.id} style={{ padding: "14px 22px", borderBottom: i < incidents.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.title}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 21 }}>
                      {incidentSeverityBadge(inc.severity)}
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{inc.started}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* DB summary */}
              <div style={{ padding: "14px 22px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>DB Row Counts</p>
                {[
                  { label: "Pipeline Runs",   value: dbMetrics.pipeline_runs ?? 0 },
                  { label: "Scores",          value: dbMetrics.creditlinker_scores ?? 0 },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{r.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* UPTIME + LOGGING STATUS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity size={18} style={{ color: "#10B981" }} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", marginBottom: 2 }}>{health.uptime_pct ?? 100}%</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>Platform Uptime (24h)</p>
              </div>
            </div>
            <div style={{ background: health.logging_enabled ? "#F0FDFF" : "#FEF9C3", border: `1px solid ${health.logging_enabled ? "rgba(56,189,248,0.25)" : "rgba(234,179,8,0.3)"}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: health.logging_enabled ? "rgba(8,145,178,0.1)" : "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Database size={18} style={{ color: health.logging_enabled ? "#0891B2" : "#CA8A04" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>Event Logging {health.logging_enabled ? "On" : "Off"}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{health.logging_enabled ? "Platform events are being recorded" : "Logging paused — toggle in Settings"}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUPER ADMIN NOTE */}
      {!isSuperAdmin(user) && (
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 10, alignItems: "center" }}>
          <ShieldCheck size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>System configuration and service restarts are restricted to Super Admins only. You are viewing in read-only mode.</p>
        </div>
      )}
    </div>
  );
}
