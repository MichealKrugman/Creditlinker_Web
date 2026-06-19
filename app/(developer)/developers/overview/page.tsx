"use client";

import Link from "next/link";
import {
  Key, Webhook, FlaskConical, Activity,
  ArrowUpRight, Code2, Copy, CheckCircle2,
  BookOpen, Package, ChevronRight, Zap,
  Clock, TrendingUp, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useDeveloperAccount } from "@/lib/developer-context";
import { usePlatformSettings } from "@/lib/platform-settings-context";
import { tierLabel } from "@/lib/dev-utils";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { label: "API Keys",      href: "/developers/api-keys",      icon: Key,          desc: "Create and manage keys" },
  { label: "API Reference", href: "/developers/api-reference", icon: Code2,        desc: "Browse all endpoints" },
  { label: "Webhooks",      href: "/developers/webhooks",      icon: Webhook,      desc: "Configure event delivery" },
  { label: "Sandbox",       href: "/developers/sandbox",       icon: FlaskConical, desc: "Test without real data" },
  { label: "SDKs",          href: "/developers/sdks",          icon: Package,      desc: "Node, Python, Go" },
  { label: "Docs",          href: "/developers/docs",          icon: BookOpen,     desc: "Integration guides" },
];

// API Status is driven by platform_settings — admin-controlled, not computed.
// When no platform_settings rows exist for these keys, we show "Unknown".
const API_SERVICES = [
  { key: "status_rest_api",     name: "REST API" },
  { key: "status_webhooks",     name: "Webhooks" },
  { key: "status_pipeline",     name: "Pipeline" },
  { key: "status_mono_connect", name: "Mono Connect" },
];

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

type RecentLog = {
  id:               string;
  method:           string;
  endpoint:         string;
  status_code:      number;
  response_time_ms: number | null;
  requested_at:     string;
};

type ServiceStatus = "operational" | "degraded" | "outage" | "unknown";

type ApiServiceStatus = {
  name:   string;
  status: ServiceStatus;
};

type LiveMetrics = {
  successRate:      number | null;  // 0–100
  successRateTrend: number | null;  // pp delta vs previous 30d (positive = improved)
  avgLatencyMs:     number | null;
  // trend: compare last 30d calls vs prev 30d calls
  requestsTrend:    number | null; // positive = growth %, negative = decline %
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function formatEventTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusColor(s: ServiceStatus): string {
  return s === "operational" ? "#10B981"
       : s === "degraded"    ? "#F59E0B"
       : s === "outage"      ? "#EF4444"
       : "#9CA3AF";
}

function formatTrend(trend: number | null): string {
  if (trend === null) return "New";
  if (trend === 0)    return "Stable";
  return trend > 0 ? `+${trend.toFixed(0)}%` : `${trend.toFixed(0)}%`;
}

function formatSuccessRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${rate.toFixed(1)}%`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  return `${Math.round(ms)}ms`;
}

/* ─────────────────────────────────────────────────────────
   SHARED CARD SHELL
───────────────────────────────────────────────────────── */

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
        {title}
      </p>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.55)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   METRIC CARD
   trend=null → "New" badge (no historical data yet)
───────────────────────────────────────────────────────── */

function MetricCard({
  label, value, sub, icon: Icon, trend,
}: {
  label: string;
  value: string;
  sub:   string;
  icon:  React.ComponentType<{ size?: number }>;
  trend: string;
}) {
  const isNew      = trend === "New";
  const isPositive = !isNew && (trend.startsWith("+") || trend === "Stable");
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6B7280",
        }}>
          <Icon size={16} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color:      isNew ? "#6B7280"  : isPositive ? "#10B981" : "#EF4444",
          background: isNew ? "#F3F4F6"  : isPositive ? "#ECFDF5" : "#FEF2F2",
          padding: "2px 8px", borderRadius: 9999,
        }}>
          {trend}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */

export default function DeveloperOverviewPage() {
  const { account } = useDeveloperAccount();
  const { settings } = usePlatformSettings();

  const BASE_URL    = settings.apiBaseUrl;
  const CODE_SNIPPET = `curl -X GET ${BASE_URL}/business/score \\
  -H "Authorization: Bearer sk_test_••••••••" \\
  -H "Content-Type: application/json"`;

  // ── Live state ──────────────────────────────────────────
  const [recentEvents,   setRecentEvents]   = useState<RecentLog[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics>({ successRate: null, successRateTrend: null, avgLatencyMs: null, requestsTrend: null });
  const [serviceStatuses,setServiceStatuses]= useState<ApiServiceStatus[]>(
    API_SERVICES.map(s => ({ name: s.name, status: "unknown" as ServiceStatus }))
  );
  const [metricsLoading, setMetricsLoading] = useState(true);

  // ── Fetch recent API log entries ────────────────────────────
  useEffect(() => {
    if (!account) return;
    supabase
      .from("developer_api_logs")
      .select("id, method, endpoint, status_code, response_time_ms, requested_at")
      .eq("developer_id", account.id)
      .order("requested_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) console.error("[overview] recent events fetch failed", error);
        if (data) setRecentEvents(data);
      });
  }, [account]);

  // ── Fetch live metrics from developer_api_logs ───────────
  useEffect(() => {
    if (!account) return;

    async function loadMetrics() {
      setMetricsLoading(true);
      try {
        const now        = new Date();
        const ago30      = new Date(now.getTime() - 30 * 86400_000).toISOString();
        const ago60      = new Date(now.getTime() - 60 * 86400_000).toISOString();

        // Last 30 days of logs for this developer
        const { data: logs30 } = await supabase
          .from("developer_api_logs")
          .select("status_code, response_time_ms")
          .eq("developer_id", account!.id)
          .gte("requested_at", ago30);

        // Previous 30 days (30–60 days ago) — for trend comparison
        const { data: logs60, count: prevCount } = await supabase
          .from("developer_api_logs")
          .select("status_code", { count: "exact" })
          .eq("developer_id", account!.id)
          .gte("requested_at", ago60)
          .lt("requested_at", ago30);

        if (!logs30 || logs30.length === 0) {
          // No log data yet — leave nulls so UI shows "—" / "New"
          setMetrics({ successRate: null, successRateTrend: null, avgLatencyMs: null, requestsTrend: null });
          return;
        }

        const total        = logs30.length;
        const successful   = logs30.filter(l => l.status_code < 400).length;
        const successRate  = (successful / total) * 100;

        const latencies    = logs30.map(l => l.response_time_ms).filter((v): v is number => v !== null);
        const avgLatencyMs = latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : null;

        // Success rate trend: current period pp minus previous period pp
        let successRateTrend: number | null = null;
        if (logs60 && logs60.length > 0) {
          const prevSuccessful  = logs60.filter(l => l.status_code < 400).length;
          const prevSuccessRate = (prevSuccessful / logs60.length) * 100;
          successRateTrend = successRate - prevSuccessRate;
          // Treat < 0.1pp delta as stable
          if (Math.abs(successRateTrend) < 0.1) successRateTrend = 0;
        }

        let requestsTrend: number | null = null;
        if (prevCount !== null && prevCount > 0) {
          requestsTrend = ((total - prevCount) / prevCount) * 100;
        } else if (prevCount === 0 && total > 0) {
          // First period with data — don't show a % (would be +∞)
          requestsTrend = null;
        }

        setMetrics({ successRate, successRateTrend, avgLatencyMs, requestsTrend });
      } catch (err) {
        console.error("[overview] metrics fetch failed", err);
      } finally {
        setMetricsLoading(false);
      }
    }

    loadMetrics();
  }, [account]);

  // ── Fetch API service statuses from platform_settings ────
  // Admin sets these via the admin panel. Keys: status_rest_api, etc.
  // Values (text column): "operational" | "degraded" | "outage"
  // If a key is missing or the fetch fails we show "unknown".
  useEffect(() => {
    async function loadStatuses() {
      const keys = API_SERVICES.map(s => s.key);
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", keys);

      if (error) {
        console.error("[overview] failed to load service statuses", error);
        return;
      }

      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        // value column is now text — plain strings, no parsing needed
        map[row.key] = typeof row.value === "string" ? row.value : String(row.value ?? "");
      }

      setServiceStatuses(
        API_SERVICES.map(s => ({
          name:   s.name,
          status: (map[s.key] as ServiceStatus) ?? "unknown",
        }))
      );
    }
    loadStatuses();
  }, []);

  // ── Derived stats for the metric cards ──────────────────
  const hasActivity = !metricsLoading && metrics.successRate !== null;

  const STATS = [
    {
      label: "API Requests",
      value: account ? account.api_calls_30d.toLocaleString() : "—",
      sub:   "Last 30 days",
      icon:  Activity,
      trend: formatTrend(metrics.requestsTrend),
    },
    {
      label: "Success Rate",
      value: formatSuccessRate(metrics.successRate),
      sub:   hasActivity ? "Last 30 days" : "No requests yet",
      icon:  CheckCircle2,
      trend: hasActivity ? formatTrend(metrics.successRateTrend) : "New",
    },
    {
      label: "Avg Latency",
      value: formatLatency(metrics.avgLatencyMs),
      sub:   hasActivity ? "p50 response" : "No requests yet",
      icon:  Zap,
      trend: hasActivity ? "Stable" : "New",
    },
    {
      label: "Active Keys",
      value: account ? String(account.api_key_count) : "—",
      sub:   account?.preferred_environment === "live" ? "Live environment" : "Sandbox environment",
      icon:  Key,
      trend: account?.api_key_count ? `+${account.api_key_count}` : "New",
    },
  ];

  // ── Overall API health banner ────────────────────────────
  const anyOutage   = serviceStatuses.some(s => s.status === "outage");
  const anyDegraded = serviceStatuses.some(s => s.status === "degraded");
  const allUnknown  = serviceStatuses.every(s => s.status === "unknown");
  const overallBadgeVariant = anyOutage ? "destructive" : anyDegraded ? "warning" : allUnknown ? "secondary" : "success";
  const overallBadgeLabel   = anyOutage ? "Outage detected" : anyDegraded ? "Degraded performance" : allUnknown ? "Status unknown" : "All systems operational";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Developer Overview
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning">Sandbox</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>API {settings.apiVersion} · {tierLabel(account?.tier)} plan</span>
          </div>
        </div>
        <div className="dev-ov-btns" style={{ display: "flex", gap: 8 }}>
          <style>{`@media (max-width: 480px) { .dev-ov-btns { display: none !important; } }`}</style>
          <Button variant="outline" size="sm" href="/developers/docs" style={{ gap: 6 }}>
            <BookOpen size={13} /> Read the docs
          </Button>
          <Button variant="primary" size="sm" href="/developers/sandbox" style={{ gap: 6 }}>
            <FlaskConical size={13} /> Open sandbox
          </Button>
        </div>
      </div>

      {/* ── NO KEYS ONBOARDING NUDGE ── */}
      {account && account.api_key_count === 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 10,
        }}>
          <AlertCircle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#92400E", flex: 1 }}>
            You don't have any API keys yet. Create one to start making requests and see live metrics here.
          </p>
          <Button variant="outline" size="sm" href="/developers/api-keys" style={{ gap: 5, flexShrink: 0 }}>
            <Key size={12} /> Create key
          </Button>
        </div>
      )}

      {/* ── METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {STATS.map(s => (
          <MetricCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <style>{`@media (max-width: 768px) { .dev-ov-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="dev-ov-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick start */}
          <Card style={{
            background: "linear-gradient(135deg, #0A2540 0%, #0d3465 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Zap size={15} style={{ color: "#00D4FF" }} />
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white" }}>
                  Quick Start
                </p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 18, lineHeight: 1.6 }}>
                Make your first authenticated request to the Creditlinker API.
              </p>

              {[
                { n: "1", text: "Create an API key below" },
                { n: "2", text: "Set Authorization: Bearer <key> header" },
                { n: "3", text: `Call any endpoint — start with ${BASE_URL}/business/score` },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#00D4FF",
                  }}>
                    {step.n}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{step.text}</span>
                </div>
              ))}

              <div style={{
                marginTop: 18,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                overflow: "hidden",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                    BASH
                  </span>
                  <CopyButton text={CODE_SNIPPET} />
                </div>
                <pre style={{
                  padding: "14px 16px", margin: 0,
                  fontSize: 12, lineHeight: 1.7,
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}>
                  {CODE_SNIPPET}
                </pre>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Button variant="accent" size="sm" href="/developers/api-keys" style={{ gap: 5 }}>
                  <Key size={13} /> Create API Key
                </Button>
                <Button variant="ghost-dark" size="sm" href="/developers/api-reference" style={{ gap: 5 }}>
                  <Code2 size={13} /> Browse endpoints
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent API calls */}
          <Card>
            <CardHeader
              title="Recent Events"
              action={
                <Link href="/developers/logs" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                  View all <ChevronRight size={13} />
                </Link>
              }
            />
            <div style={{ padding: "10px 0 8px" }}>
              {recentEvents.length === 0 ? (
                <div style={{ padding: "28px 22px", textAlign: "center" as const }}>
                  <Activity size={22} style={{ color: "#E5E7EB", marginBottom: 10 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No requests yet</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Make your first API call to see activity here.</p>
                </div>
              ) : recentEvents.map((ev, i) => {
                const ok = ev.status_code >= 200 && ev.status_code < 300;
                const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
                  GET:    { bg: "#ECFDF5", text: "#059669" },
                  POST:   { bg: "#EFF6FF", text: "#2563EB" },
                  PATCH:  { bg: "#FEF3C7", text: "#D97706" },
                  PUT:    { bg: "#FEF3C7", text: "#D97706" },
                  DELETE: { bg: "#FEF2F2", text: "#DC2626" },
                };
                const mc = METHOD_COLORS[ev.method] ?? { bg: "#F3F4F6", text: "#374151" };
                const ms = ev.response_time_ms;
                const latency = ms == null ? "—" : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
                return (
                  <div key={ev.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 22px",
                    borderBottom: i < recentEvents.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: ok ? "#10B981" : "#EF4444" }} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                      background: mc.bg, color: mc.text, fontFamily: "var(--font-mono, monospace)",
                    }}>
                      {ev.method}
                    </span>
                    <p style={{
                      flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: "#374151",
                      fontFamily: "var(--font-mono, monospace)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.endpoint}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: ok ? "#10B981" : "#EF4444" }}>{ev.status_code}</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{latency}</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{formatEventTime(ev.requested_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick links */}
          <Card>
            <CardHeader title="Developer Tools" />
            <div style={{ padding: "12px 0 8px" }}>
              {QUICK_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 22px",
                    borderBottom: i < QUICK_LINKS.length - 1 ? "1px solid #F3F4F6" : "none",
                    textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#6B7280",
                  }}>
                    <link.icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{link.label}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{link.desc}</p>
                  </div>
                  <ArrowUpRight size={13} style={{ color: "#D1D5DB", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </Card>

          {/* API status — driven by platform_settings */}
          <Card style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
                API Status
              </p>
              <Badge variant={overallBadgeVariant}>{overallBadgeLabel}</Badge>
            </div>

            {serviceStatuses.map((svc, i) => (
              <div
                key={svc.name}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: i < serviceStatuses.length - 1 ? 10 : 0,
                  marginBottom:  i < serviceStatuses.length - 1 ? 10 : 0,
                  borderBottom:  i < serviceStatuses.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(svc.status) }} />
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{svc.name}</span>
                </div>
                <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={10} />
                  {svc.status === "unknown" ? "—" : svc.status}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14 }}>
              <TrendingUp size={12} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 11, color: "#6B7280" }}>
                Status managed by the Creditlinker team
              </span>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
