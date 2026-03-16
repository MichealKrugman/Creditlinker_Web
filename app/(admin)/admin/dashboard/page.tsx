"use client";

import Link from "next/link";
import {
  Building2, Landmark, ShieldCheck, Activity,
  TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle,
  Clock, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, Zap, Database, ScrollText,
  Users, BarChart2, Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMockAdminUser, canView, canManage, isSuperAdmin,
} from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
//  Replace each section with real API calls:
//    GET /admin/observability/business/:id
//    GET /admin/audit?limit=8
//    GET /admin/events?limit=10
// ─────────────────────────────────────────────────────────────

const PLATFORM_METRICS = {
  total_businesses:        1_842,
  businesses_delta:        "+34 this week",
  businesses_trend:        "up" as const,
  active_financers:        28,
  financers_delta:         "+2 this week",
  financers_trend:         "up" as const,
  pipeline_runs_today:     317,
  pipeline_runs_delta:     "+12% vs yesterday",
  pipeline_runs_trend:     "up" as const,
  verification_queue:      14,
  verification_delta:      "6 urgent",
  verification_trend:      "warn" as const,
  active_consents:         562,
  active_financing:        89,
  disputes_open:           7,
  data_quality_avg:        87.4,
};

const PIPELINE_HEALTH = [
  { label: "Ingestion",      status: "healthy",  latency: "142ms",  success_rate: 99.1 },
  { label: "Normalisation",  status: "healthy",  latency: "388ms",  success_rate: 98.7 },
  { label: "Feature Gen",    status: "healthy",  latency: "621ms",  success_rate: 99.3 },
  { label: "Scoring",        status: "degraded", latency: "1.84s",  success_rate: 96.2 },
  { label: "Risk Detection", status: "healthy",  latency: "204ms",  success_rate: 99.8 },
  { label: "Snapshot",       status: "healthy",  latency: "91ms",   success_rate: 100  },
];

const RECENT_AUDIT = [
  { actor: "Tunde Adeyemi",   action: "Verified business",        target: "Aduke Bakeries Ltd",     time: "3m ago",   severity: "info" },
  { actor: "Chisom Eze",      action: "Suspended financer",       target: "QuickCash Capital",       time: "18m ago",  severity: "warn" },
  { actor: "System",          action: "Pipeline run completed",   target: "biz_0041",               time: "22m ago",  severity: "info" },
  { actor: "Tunde Adeyemi",   action: "Resolved dispute",         target: "DISP-2024-0091",         time: "1h ago",   severity: "info" },
  { actor: "System",          action: "Risk flag raised",         target: "biz_0099 · Anomaly",     time: "1h ago",   severity: "error" },
  { actor: "Fatima Bello",    action: "Approved financer",        target: "Lapo Microfinance",      time: "2h ago",   severity: "info" },
  { actor: "System",          action: "Pipeline run failed",      target: "biz_0118 · Stage 3",     time: "3h ago",   severity: "error" },
  { actor: "Chisom Eze",      action: "Viewed financial profile", target: "Konga Fulfilment Co.",   time: "3h ago",   severity: "info" },
];

const VERIFICATION_QUEUE = [
  { name: "Greenfield Farms Ltd",   type: "CAC + Bank",     submitted: "Today, 08:14",   priority: "high" },
  { name: "TechPay Solutions",      type: "Identity",        submitted: "Today, 09:30",   priority: "high" },
  { name: "Amaka Tailoring Co.",    type: "Bank Statement",  submitted: "Yesterday",       priority: "normal" },
  { name: "SabiSabi Wholesale",     type: "Full KYB",        submitted: "Yesterday",       priority: "normal" },
];

const RECENT_PIPELINE_RUNS = [
  { business: "Aduke Bakeries Ltd",   status: "success",  duration: "4.2s",  score: 742, time: "2m ago" },
  { business: "TechPay Solutions",    status: "success",  duration: "3.8s",  score: 681, time: "8m ago" },
  { business: "biz_0118",             status: "failed",   duration: "1.1s",  score: null, time: "1h ago" },
  { business: "Konga Fulfilment Co.", status: "success",  duration: "5.1s",  score: 795, time: "1h ago" },
  { business: "SabiSabi Wholesale",   status: "running",  duration: "—",     score: null, time: "Now" },
];

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
  return (
    <Card>
      <CardHeader
        title="Pipeline Health"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, color: "#F59E0B",
              background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)",
              padding: "2px 8px", borderRadius: 9999,
            }}>
              <AlertTriangle size={8} /> 1 degraded
            </span>
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
        {PIPELINE_HEALTH.map((stage, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "9px 22px",
            borderBottom: i < PIPELINE_HEALTH.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            {/* Status dot */}
            <div style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: stage.status === "healthy" ? "#10B981"
                : stage.status === "degraded" ? "#F59E0B"
                : "#EF4444",
            }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#374151" }}>
              {stage.label}
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 48, textAlign: "right" }}>
              {stage.latency}
            </span>
            <div style={{ width: 80 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 3 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: stage.success_rate >= 99 ? "#10B981"
                    : stage.success_rate >= 97 ? "#F59E0B"
                    : "#EF4444",
                }}>
                  {stage.success_rate}%
                </span>
              </div>
              <div style={{
                height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${stage.success_rate}%`,
                  background: stage.success_rate >= 99 ? "#10B981"
                    : stage.success_rate >= 97 ? "#F59E0B"
                    : "#EF4444",
                  borderRadius: 9999,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
//  AUDIT LOG STRIP
// ─────────────────────────────────────────────────────────────

function AuditStrip() {
  return (
    <Card>
      <CardHeader title="Recent Audit Activity" action={<ViewAllLink href="/admin/audit-logs" />} />
      <div style={{ padding: "10px 0 8px" }}>
        {RECENT_AUDIT.map((entry, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "9px 22px",
            borderBottom: i < RECENT_AUDIT.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            {/* Severity icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: entry.severity === "error" ? "#FEF2F2"
                : entry.severity === "warn" ? "#FFFBEB"
                : "#F0FDFF",
              color: entry.severity === "error" ? "#EF4444"
                : entry.severity === "warn" ? "#F59E0B"
                : "#0891B2",
              marginTop: 1,
            }}>
              {entry.severity === "error" ? <XCircle size={13} />
                : entry.severity === "warn" ? <AlertTriangle size={13} />
                : <CheckCircle2 size={13} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>
                  {entry.actor}
                </span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{entry.action}</span>
              </div>
              <p style={{
                fontSize: 11, color: "#9CA3AF", marginTop: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {entry.target}
              </p>
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, marginTop: 2 }}>
              {entry.time}
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
  return (
    <Card>
      <CardHeader
        title="Verification Queue"
        action={<ViewAllLink href="/admin/verifications" />}
      />
      <div style={{ padding: "10px 0 8px" }}>
        {VERIFICATION_QUEUE.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 22px",
            borderBottom: i < VERIFICATION_QUEUE.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#0A2540",
            }}>
              {item.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: "#0A2540",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                marginBottom: 2,
              }}>
                {item.name}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                {item.type} · {item.submitted}
              </p>
            </div>
            {item.priority === "high" && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                color: "#EF4444", background: "#FEF2F2",
                border: "1px solid rgba(239,68,68,0.2)",
                padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase",
                flexShrink: 0,
              }}>
                Urgent
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
        <Link href="/admin/verifications">
          <Button variant="primary" size="sm" style={{ width: "100%" }}>
            <ShieldCheck size={13} /> Review queue ({PLATFORM_METRICS.verification_queue})
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
  return (
    <Card>
      <CardHeader
        title="Recent Pipeline Runs"
        action={<ViewAllLink href="/admin/financial-data" />}
      />
      <div style={{ padding: "10px 0 8px" }}>
        {RECENT_PIPELINE_RUNS.map((run, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "9px 22px",
            borderBottom: i < RECENT_PIPELINE_RUNS.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            {/* Status icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: run.status === "success" ? "#ECFDF5"
                : run.status === "failed" ? "#FEF2F2"
                : "#F0FDFF",
              color: run.status === "success" ? "#10B981"
                : run.status === "failed" ? "#EF4444"
                : "#0891B2",
            }}>
              {run.status === "success" ? <CheckCircle2 size={13} />
                : run.status === "failed" ? <XCircle size={13} />
                : <RefreshCw size={13} style={{ animation: "spin 1.2s linear infinite" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: "#0A2540",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                marginBottom: 2,
              }}>
                {run.business}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                {run.duration} · {run.time}
              </p>
            </div>
            {run.score != null && (
              <span style={{
                fontSize: 13, fontWeight: 800, color: "#0A2540",
                fontFamily: "var(--font-display)",
              }}>
                {run.score}
              </span>
            )}
            {run.status === "failed" && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#EF4444",
                background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)",
                padding: "2px 7px", borderRadius: 9999, flexShrink: 0,
              }}>
                Failed
              </span>
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

function SecondaryStats() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 14,
    }}>
      {[
        {
          label: "Active Consents",
          value: PLATFORM_METRICS.active_consents,
          icon: <ShieldCheck size={14} />,
          color: "#10B981",
          bg: "#ECFDF5",
          href: "/admin/businesses",
        },
        {
          label: "Active Financing",
          value: PLATFORM_METRICS.active_financing,
          icon: <Landmark size={14} />,
          color: "#0891B2",
          bg: "#F0FDFF",
          href: "/admin/financers",
        },
        {
          label: "Open Disputes",
          value: PLATFORM_METRICS.disputes_open,
          icon: <AlertTriangle size={14} />,
          color: PLATFORM_METRICS.disputes_open > 5 ? "#EF4444" : "#F59E0B",
          bg: PLATFORM_METRICS.disputes_open > 5 ? "#FEF2F2" : "#FFFBEB",
          href: "/admin/disputes",
        },
      ].map((stat, i) => (
        <Link key={i} href={stat.href} style={{ textDecoration: "none" }}>
          <Card style={{
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            cursor: "pointer", transition: "box-shadow 0.12s",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: stat.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: stat.color,
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em",
                lineHeight: 1, marginBottom: 3,
              }}>
                {stat.value}
              </p>
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
              {PLATFORM_METRICS.pipeline_runs_today} pipeline runs today
            </span>
            <span style={{ color: "#E5E7EB" }}>·</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              Avg data quality {PLATFORM_METRICS.data_quality_avg}%
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
            value={PLATFORM_METRICS.total_businesses.toLocaleString()}
            delta={PLATFORM_METRICS.businesses_delta}
            trend={PLATFORM_METRICS.businesses_trend}
            icon={<Building2 size={16} />}
            href="/admin/businesses"
            accent
          />
        )}
        {canView(user, "financers") && (
          <MetricCard
            label="Active Financers"
            value={PLATFORM_METRICS.active_financers}
            delta={PLATFORM_METRICS.financers_delta}
            trend={PLATFORM_METRICS.financers_trend}
            icon={<Landmark size={16} />}
            href="/admin/financers"
          />
        )}
        {canView(user, "financial_data") && (
          <MetricCard
            label="Pipeline Runs Today"
            value={PLATFORM_METRICS.pipeline_runs_today}
            delta={PLATFORM_METRICS.pipeline_runs_delta}
            trend={PLATFORM_METRICS.pipeline_runs_trend}
            icon={<Zap size={16} />}
            href="/admin/financial-data"
          />
        )}
        {canView(user, "verifications") && (
          <MetricCard
            label="Verification Queue"
            value={PLATFORM_METRICS.verification_queue}
            delta={PLATFORM_METRICS.verification_delta}
            trend={PLATFORM_METRICS.verification_trend}
            icon={<ShieldCheck size={16} />}
            href="/admin/verifications"
          />
        )}
      </div>

      {/* ── SECONDARY STATS ── */}
      <SecondaryStats />

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

          {/* Disputes alert — visible if there are open disputes */}
          {canView(user, "verifications") && PLATFORM_METRICS.disputes_open > 0 && (
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
                  {PLATFORM_METRICS.disputes_open} open disputes
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
