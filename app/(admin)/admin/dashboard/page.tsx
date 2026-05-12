"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2, Landmark, ShieldCheck, Activity,
  TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle,
  Clock, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, Zap, Database, ScrollText,
  Users, BarChart2, Circle, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMockAdminUser, canView, canManage, isSuperAdmin,
} from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";
import { useAdminUser } from "@/lib/admin-user-context";

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("/rest/v1", "") + "/functions/v1";

async function callFn(name: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #E5E7EB",
      borderRadius: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "18px 22px 0",
    }}>
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em",
      }}>
        {title}
      </p>
      {action}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none",
    }}>
      View all <ChevronRight size={13} />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
//  METRIC CARD
// ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, delta, trend, icon, href, accent = false,
}: {
  label: string; value: string | number; delta: string;
  trend: "up" | "down" | "warn" | "neutral";
  icon: React.ReactNode; href?: string; accent?: boolean;
}) {
  const trendColor = trend === "up" ? "#10B981"
    : trend === "down" ? "#EF4444"
    : trend === "warn" ? "#F59E0B"
    : "#6B7280";

  const TrendIcon = trend === "up" ? TrendingUp
    : trend === "down" ? TrendingDown
    : trend === "warn" ? AlertTriangle
    : Activity;

  const content = (
    <Card style={{ padding: "20px 22px", cursor: href ? "pointer" : "default" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: accent ? "#0A2540" : "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent ? "#00D4FF" : "#6B7280",
        }}>
          {icon}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TrendIcon size={12} style={{ color: trendColor }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: trendColor }}>{delta}</span>
        </div>
      </div>
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 26, color: "#0A2540", letterSpacing: "-0.04em",
        lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{label}</p>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }
  return content;
}

// ─────────────────────────────────────────────────────────────
//  PIPELINE HEALTH CARD
// ─────────────────────────────────────────────────────────────

function PipelineHealthCard() {
  const [stages,  setStages]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callFn("admin-get-pipeline-health")
      .then(d => setStages(d.stage_health ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const degraded = stages.filter(s => s.status === "degraded").length;

  return (
    <Card>
      <CardHeader
        title="Pipeline Health"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!loading && degraded > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 700, color: "#F59E0B",
                background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)",
                padding: "2px 8px", borderRadius: 9999,
              }}>
                <AlertTriangle size={8} /> {degraded} degraded
              </span>
            )}
            <Link href="/admin/financial-data" style={{
              fontSize: 12, fontWeight: 600, color: "#0A2540",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 3,
            }}>
              Details <ChevronRight size={13} />
            </Link>
          </div>
        }
      />
      <div style={{ padding: "14px 0 8px" }}>
        {loading ? (
          <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} style={{ color: "#9CA3AF" }} className="animate-spin" />
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
          </div>
        ) : stages.length === 0 ? (
          <div style={{ padding: "20px 22px" }}>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>No pipeline data. Enable logging to track health.</p>
          </div>
        ) : stages.map((stage: any, i: number) => {
          const latencyStr = stage.avg_latency_ms != null
            ? stage.avg_latency_ms >= 1000 ? `${(stage.avg_latency_ms / 1000).toFixed(2)}s` : `${stage.avg_latency_ms}ms`
            : "—";
          const sr = stage.success_rate ?? 100;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "9px 22px",
              borderBottom: i < stages.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: stage.status === "healthy" ? "#10B981"
                  : stage.status === "degraded" ? "#F59E0B" : "#EF4444",
              }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#374151" }}>{stage.name}</span>
              <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 48, textAlign: "right" as const }}>{latencyStr}</span>
              <div style={{ width: 80 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sr >= 99 ? "#10B981" : sr >= 97 ? "#F59E0B" : "#EF4444" }}>{sr}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${sr}%`, background: sr >= 99 ? "#10B981" : sr >= 97 ? "#F59E0B" : "#EF4444", borderRadius: 9999 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
//  AUDIT LOG STRIP
// ─────────────────────────────────────────────────────────────

function AuditStrip() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("platform_events")
      .select("id, actor_id, actor_type, event_type, severity, message, created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setEntries(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Recent Audit Activity" action={<ViewAllLink href="/admin/audit-logs" />} />
      <div style={{ padding: "10px 0 8px" }}>
        {loading ? (
          <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} style={{ color: "#9CA3AF" }} className="animate-spin" />
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: "20px 22px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No recent audit events.</p></div>
        ) : entries.map((entry: any, i: number) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "9px 22px",
            borderBottom: i < entries.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: entry.severity === "error" ? "#FEF2F2" : entry.severity === "warn" ? "#FFFBEB" : "#F0FDFF",
              color: entry.severity === "error" ? "#EF4444" : entry.severity === "warn" ? "#F59E0B" : "#0891B2",
              marginTop: 1,
            }}>
              {entry.severity === "error" ? <XCircle size={13} /> : entry.severity === "warn" ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{entry.actor ?? entry.actor_email ?? "System"}</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{entry.action ?? entry.event_type}</span>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                {entry.target ?? entry.resource_id ?? ""}
              </p>
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, marginTop: 2 }}>
              {entry.time ?? (entry.created_at ? new Date(entry.created_at).toLocaleTimeString() : "")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
//  VERIFICATION QUEUE CARD
// ─────────────────────────────────────────────────────────────

function VerificationQueueCard() {
  const [queue,   setQueue]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callFn("admin-get-verification-queue")
      .then(d => setQueue((d.queue ?? d.data ?? []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Verification Queue" action={<ViewAllLink href="/admin/verifications" />} />
      <div style={{ padding: "10px 0 8px" }}>
        {loading ? (
          <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} style={{ color: "#9CA3AF" }} className="animate-spin" />
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
          </div>
        ) : queue.length === 0 ? (
          <div style={{ padding: "20px 22px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No pending verifications.</p></div>
        ) : queue.map((item: any, i: number) => (
          <div key={item.id ?? i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 22px",
            borderBottom: i < queue.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540" }}>
              {(item.name ?? item.business_name ?? "??").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>
                {item.name ?? item.business_name}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                {item.type ?? item.verification_type} · {item.submitted ?? (item.created_at ? new Date(item.created_at).toLocaleDateString() : "")}
              </p>
            </div>
            {(item.priority === "high" || item.urgency === "high") && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#EF4444", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase" as const, flexShrink: 0 }}>Urgent</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
        <Link href="/admin/verifications">
          <Button variant="primary" size="sm" style={{ width: "100%" }}>
            <ShieldCheck size={13} /> Review queue ({queue.length})
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
//  RECENT PIPELINE RUNS
// ─────────────────────────────────────────────────────────────

function PipelineRunsCard() {
  const [runs,    setRuns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callFn("admin-get-pipeline-health")
      .then(d => setRuns((d.recent_runs ?? []).slice(0, 2)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Recent Pipeline Runs" action={<ViewAllLink href="/admin/financial-data" />} />
      <div style={{ padding: "10px 0 8px" }}>
        {loading ? (
          <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} style={{ color: "#9CA3AF" }} className="animate-spin" />
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
          </div>
        ) : runs.length === 0 ? (
          <div style={{ padding: "20px 22px" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No pipeline runs yet.</p></div>
        ) : runs.map((run: any, i: number) => (
          <div key={run.id ?? i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "9px 22px",
            borderBottom: i < runs.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: (run.status === "success" || run.status === "completed") ? "#ECFDF5" : run.status === "failed" ? "#FEF2F2" : "#F0FDFF",
              color: (run.status === "success" || run.status === "completed") ? "#10B981" : run.status === "failed" ? "#EF4444" : "#0891B2",
            }}>
              {(run.status === "success" || run.status === "completed") ? <CheckCircle2 size={13} /> : run.status === "failed" ? <XCircle size={13} /> : <RefreshCw size={13} style={{ animation: "spin 1.2s linear infinite" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>
                {run.business ?? run.business_name ?? run.business_id ?? "—"}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"} · {run.created_at ? new Date(run.created_at).toLocaleTimeString() : ""}
              </p>
            </div>
            {run.score != null && (
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)" }}>{run.score}</span>
            )}
            {run.status === "failed" && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", padding: "2px 7px", borderRadius: 9999, flexShrink: 0 }}>Failed</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECONDARY STATS ROW
// ─────────────────────────────────────────────────────────────

function SecondaryStats({ metrics }: { metrics: any }) {
  const activeConsents  = metrics?.active_consents  ?? 0;
  const activeFinancing = metrics?.active_financing  ?? 0;
  const disputesOpen   = metrics?.disputes_open     ?? 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {[
        { label: "Active Consents",  value: activeConsents,  icon: <ShieldCheck size={14} />, color: "#10B981", bg: "#ECFDF5", href: "/admin/businesses" },
        { label: "Active Financing", value: activeFinancing, icon: <Landmark size={14} />,   color: "#0891B2", bg: "#F0FDFF", href: "/admin/financers" },
        { label: "Open Disputes",    value: disputesOpen,    icon: <AlertTriangle size={14} />, color: disputesOpen > 5 ? "#EF4444" : "#F59E0B", bg: disputesOpen > 5 ? "#FEF2F2" : "#FFFBEB", href: "/admin/disputes" },
      ].map((stat, i) => (
        <Link key={i} href={stat.href} style={{ textDecoration: "none" }}>
          <Card style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "box-shadow 0.12s" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 3 }}>{stat.value}</p>
              <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{stat.label}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const user = getMockAdminUser();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    callFn("admin-get-platform-metrics").then(d => setMetrics(d)).catch(() => {});
  }, []);

  const m = metrics ?? {};
  const pipelineRunsToday = m.pipeline_runs_today ?? 0;
  const dataQualityAvg   = m.data_quality_avg    ?? 0;
  const disputesOpen     = m.disputes_open        ?? 0;
  const verificationQueue = m.verification_queue  ?? 0;
  const verificationUrgent = m.verification_urgent ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── WELCOME ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            {greeting}, {user.name.split(" ")[0]}.
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge variant="success">Platform Online</Badge>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            {pipelineRunsToday} pipeline runs today
          </span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            Avg data quality {dataQualityAvg}%
          </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canView(user, "reports") && (
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" style={{ gap: 6 }}>
                <BarChart2 size={13} /> Reports
              </Button>
            </Link>
          )}
          {canView(user, "system") && (
            <Link href="/admin/system">
              <Button variant="primary" size="sm" style={{ gap: 6 }}>
                <Activity size={13} /> System Status
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── PRIMARY METRICS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14,
      }}>
        {canView(user, "businesses") && (
          <MetricCard
            label="Total Businesses"
            value={(m.total_businesses ?? 0).toLocaleString()}
            delta={m.businesses_delta ?? ""}
            trend={m.businesses_trend ?? "neutral"}
            icon={<Building2 size={16} />}
            href="/admin/businesses"
            accent
          />
        )}
        {canView(user, "financers") && (
          <MetricCard
            label="Active Financers"
            value={m.active_financers ?? 0}
            delta={m.financers_delta ?? ""}
            trend={m.financers_trend ?? "neutral"}
            icon={<Landmark size={16} />}
            href="/admin/financers"
          />
        )}
        {canView(user, "financial_data") && (
          <MetricCard
            label="Pipeline Runs Today"
            value={pipelineRunsToday}
            delta={m.pipeline_runs_delta ?? ""}
            trend={m.pipeline_runs_trend ?? "neutral"}
            icon={<Zap size={16} />}
            href="/admin/financial-data"
          />
        )}
        {canView(user, "verifications") && (
          <MetricCard
            label="Verification Queue"
            value={verificationQueue}
            delta={verificationUrgent > 0 ? `${verificationUrgent} urgent` : "Up to date"}
            trend={verificationUrgent > 0 ? "warn" : "neutral"}
            icon={<ShieldCheck size={16} />}
            href="/admin/verifications"
          />
        )}
      </div>

      {/* ── SECONDARY STATS ── */}
      <SecondaryStats metrics={m} />

      {/* ── MAIN GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 14,
        alignItems: "start",
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {canView(user, "financial_data") && <PipelineHealthCard />}
          {canView(user, "audit_logs") && <AuditStrip />}
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {canView(user, "verifications") && <VerificationQueueCard />}
          {canView(user, "financial_data") && <PipelineRunsCard />}

          {/* 5B — Quick-action shortcuts */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 12 }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/admin/verifications" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", textDecoration: "none", background: "#FAFAFA" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0A2540")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={14} style={{ color: "#0891B2" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>View pending verifications</span>
                </div>
                <ArrowUpRight size={13} style={{ color: "#9CA3AF" }} />
              </Link>
              <Link href="/admin/disputes" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", textDecoration: "none", background: "#FAFAFA" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0A2540")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: "#F59E0B" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>Resolve oldest dispute</span>
                </div>
                <ArrowUpRight size={13} style={{ color: "#9CA3AF" }} />
              </Link>
              <Link href="/admin/audit-logs" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", textDecoration: "none", background: "#FAFAFA" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0A2540")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ScrollText size={14} style={{ color: "#6366F1" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>View audit log</span>
                </div>
                <ArrowUpRight size={13} style={{ color: "#9CA3AF" }} />
              </Link>
            </div>
          </div>

          {/* Disputes alert — visible if there are open disputes */}
          {canView(user, "verifications") && disputesOpen > 0 && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <AlertTriangle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 3 }}>
                  {disputesOpen} open disputes
                </p>
                <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5, marginBottom: 10 }}>
                  Active financing disputes require admin review to proceed.
                </p>
                <Link href="/admin/disputes" style={{
                  fontSize: 12, fontWeight: 700, color: "#991B1B",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}>
                  Review disputes →
                </Link>
              </div>
            </div>
          )}

          {/* Scoped admin info card */}
          {!isSuperAdmin(user) && (
            <div style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 14,
              padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <ShieldCheck size={13} style={{ color: "#6B7280" }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Your access scope
                </p>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
                You have restricted access. Some platform sections are hidden. Contact a Super Admin to adjust your permissions.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
