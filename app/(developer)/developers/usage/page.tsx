"use client";

import { Activity, Zap, AlertCircle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
const PLAN = {
  name: "Free",
  requests_limit: 10000,
  requests_used: 4312,
  webhooks_limit: 500,
  webhooks_used: 214,
  pipeline_runs_limit: 20,
  pipeline_runs_used: 7,
  reset_date: "Feb 1, 2025",
};

const DAILY_REQUESTS = [
  { day: "Jan 9",  count: 320 },
  { day: "Jan 10", count: 490 },
  { day: "Jan 11", count: 210 },
  { day: "Jan 12", count: 580 },
  { day: "Jan 13", count: 430 },
  { day: "Jan 14", count: 670 },
  { day: "Jan 15", count: 612 },
];

const TOP_ENDPOINTS = [
  { path: "/business/score",     method: "GET",  count: 1840, avg_ms: 142, success_rate: 99.8 },
  { path: "/business/profile",   method: "GET",  count: 730,  avg_ms: 88,  success_rate: 100  },
  { path: "/business/readiness", method: "GET",  count: 490,  avg_ms: 200, success_rate: 99.2 },
  { path: "/business/consent",   method: "GET",  count: 310,  avg_ms: 95,  success_rate: 100  },
  { path: "/institution/discovery", method: "GET", count: 280, avg_ms: 310, success_rate: 98.6 },
  { path: "/business/consent/grant", method: "POST", count: 120, avg_ms: 160, success_rate: 100 },
];

const PLANS = [
  { name: "Free",       requests: "10K/mo",  webhooks: "500/mo",  price: "₦0",       current: true  },
  { name: "Growth",     requests: "100K/mo", webhooks: "10K/mo",  price: "₦25,000/mo", current: false },
  { name: "Scale",      requests: "1M/mo",   webhooks: "100K/mo", price: "₦90,000/mo", current: false },
  { name: "Enterprise", requests: "Unlimited", webhooks: "Unlimited", price: "Custom",  current: false },
];

/* ─────────────────────────────────────────────────────────
   SHARED CARD
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
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QUOTA BAR
───────────────────────────────────────────────────────── */
function QuotaBar({
  label, used, limit, unit = "",
}: { label: string; used: number; limit: number; unit?: string }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          <b style={{ color: "#0A2540" }}>{used.toLocaleString()}{unit}</b> / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{pct.toFixed(0)}% of monthly quota used</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SPARKBAR CHART
───────────────────────────────────────────────────────── */
function SparkBars({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 4px", height: 80 }}>
      {data.map(d => (
        <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            title={`${d.count} requests on ${d.day}`}
            style={{
              width: "100%", borderRadius: "4px 4px 0 0",
              height: `${(d.count / max) * 68}px`,
              background: "linear-gradient(180deg, #00D4FF44, #00D4FF99)",
              border: "1px solid rgba(0,212,255,0.35)",
              transition: "height 0.4s ease",
              cursor: "default",
              minHeight: 4,
            }}
          />
          <span style={{ fontSize: 9, color: "#9CA3AF", whiteSpace: "nowrap" }}>{d.day.split(" ")[1]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function UsagePage() {
  const totalToday = DAILY_REQUESTS[DAILY_REQUESTS.length - 1].count;
  const totalYesterday = DAILY_REQUESTS[DAILY_REQUESTS.length - 2].count;
  const trend = totalToday - totalYesterday;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Usage
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="outline">{PLAN.name} Plan</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Resets {PLAN.reset_date}</span>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {[
          {
            label: "Requests Today",
            value: totalToday.toLocaleString(),
            icon: Activity,
            trend: trend,
            trendLabel: `${Math.abs(trend)} vs yesterday`,
          },
          {
            label: "Avg Latency",
            value: "142ms",
            icon: Zap,
            trend: -8,
            trendLabel: "down 8ms this week",
          },
          {
            label: "Monthly Used",
            value: `${((PLAN.requests_used / PLAN.requests_limit) * 100).toFixed(0)}%`,
            icon: TrendingUp,
            trend: null,
            trendLabel: `${PLAN.requests_used.toLocaleString()} of ${PLAN.requests_limit.toLocaleString()}`,
          },
          {
            label: "Success Rate",
            value: "99.4%",
            icon: AlertCircle,
            trend: null,
            trendLabel: "last 30 days",
          },
        ].map(card => (
          <Card key={card.label} style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280",
              }}>
                <card.icon size={16} />
              </div>
              {card.trend !== null && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: card.trend >= 0 ? "#10B981" : "#F59E0B",
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {card.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(card.trend)}
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
              {card.value}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{card.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{card.trendLabel}</p>
          </Card>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <style>{`@media (max-width: 768px) { .dev-usage-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="dev-usage-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Daily chart */}
          <Card>
            <CardHeader
              title="Daily Requests — Last 7 Days"
              action={<span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> UTC</span>}
            />
            <div style={{ padding: "18px 22px 22px" }}>
              <SparkBars data={DAILY_REQUESTS} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
                    {DAILY_REQUESTS.reduce((a, d) => a + d.count, 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 13, color: "#6B7280", marginLeft: 6 }}>total this week</span>
                </div>
                <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={13} /> +18% vs last week
                </span>
              </div>
            </div>
          </Card>

          {/* Top endpoints */}
          <Card>
            <CardHeader title="Top Endpoints" />
            <div style={{ padding: "12px 0 8px" }}>
              {TOP_ENDPOINTS.map((ep, i) => (
                <div key={ep.path} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 22px",
                  borderBottom: i < TOP_ENDPOINTS.length - 1 ? "1px solid #F3F4F6" : "none",
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                    background: ep.method === "GET" ? "#ECFDF5" : "#EFF6FF",
                    color: ep.method === "GET" ? "#059669" : "#2563EB",
                    fontFamily: "var(--font-mono, monospace)",
                    flexShrink: 0,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ flex: 1, fontSize: 11, color: "#374151", fontFamily: "var(--font-mono, monospace)", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, whiteSpace: "nowrap" }}>
                    {ep.path}
                  </code>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{ep.count.toLocaleString()}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{ep.avg_ms}ms avg</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: ep.success_rate >= 99.5 ? "#10B981" : "#F59E0B",
                    minWidth: 40, textAlign: "right" as const, flexShrink: 0,
                  }}>
                    {ep.success_rate}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Monthly quota */}
          <Card style={{ padding: "18px 22px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 18 }}>
              Monthly Quota
            </p>
            <QuotaBar label="API Requests"   used={PLAN.requests_used}       limit={PLAN.requests_limit} />
            <QuotaBar label="Webhooks"        used={PLAN.webhooks_used}       limit={PLAN.webhooks_limit} />
            <QuotaBar label="Pipeline Runs"   used={PLAN.pipeline_runs_used}  limit={PLAN.pipeline_runs_limit} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 0", borderTop: "1px solid #F3F4F6" }}>
              <Clock size={11} style={{ color: "#9CA3AF" }} />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Quota resets {PLAN.reset_date}</span>
            </div>
          </Card>

          {/* Plan cards */}
          <Card>
            <div style={{ padding: "18px 22px 0" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Upgrade Plan</p>
            </div>
            <div style={{ padding: "12px 0 8px" }}>
              {PLANS.map((plan, i) => (
                <div key={plan.name} style={{
                  padding: "12px 22px",
                  borderBottom: i < PLANS.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: plan.current ? "rgba(0,212,255,0.03)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{plan.name}</span>
                      {plan.current && <Badge variant="secondary" style={{ fontSize: 9 }}>Current</Badge>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0A2540" }}>{plan.price}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {plan.requests} · {plan.webhooks}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 22px 16px" }}>
              <a href="/developers/support" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "9px 0",
                borderRadius: 8, background: "#0A2540",
                fontSize: 13, fontWeight: 600, color: "white",
                textDecoration: "none", transition: "opacity 0.12s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                Upgrade Plan
              </a>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
