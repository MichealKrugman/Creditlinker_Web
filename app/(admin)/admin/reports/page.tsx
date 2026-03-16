"use client";

import {
  TrendingUp, TrendingDown, Building2, Landmark, Zap,
  ShieldCheck, DollarSign, Activity, BarChart2, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMockAdminUser } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/reports
// ─────────────────────────────────────────────────────────────

const GROWTH = [
  { month: "Jul", businesses: 1520, financers: 22, pipelines: 4100 },
  { month: "Aug", businesses: 1590, financers: 23, pipelines: 4480 },
  { month: "Sep", businesses: 1640, financers: 24, pipelines: 5200 },
  { month: "Oct", businesses: 1700, financers: 25, pipelines: 5900 },
  { month: "Nov", businesses: 1780, financers: 26, pipelines: 6400 },
  { month: "Dec", businesses: 1842, financers: 28, pipelines: 7200 },
];

const SECTOR_BREAKDOWN = [
  { sector: "Food & Beverage", count: 312, color: "#10B981" },
  { sector: "Retail",          count: 284, color: "#38BDF8" },
  { sector: "Agriculture",     count: 218, color: "#F59E0B" },
  { sector: "Tech Services",   count: 176, color: "#818CF8" },
  { sector: "Manufacturing",   count: 149, color: "#F472B6" },
  { sector: "Logistics",       count: 128, color: "#34D399" },
  { sector: "Healthcare",      count: 98,  color: "#60A5FA" },
  { sector: "Others",          count: 477, color: "#D1D5DB" },
];

const SCORE_DIST = [
  { band: "800–1000 (Excellent)", count: 89,  pct: 5,  color: "#10B981" },
  { band: "650–799  (Good)",      count: 538, pct: 29, color: "#38BDF8" },
  { band: "500–649  (Fair)",      count: 720, pct: 39, color: "#F59E0B" },
  { band: "Below 500 (Poor)",     count: 495, pct: 27, color: "#EF4444" },
];

const FINANCING_SUMMARY = {
  total_disbursed_ngn:   2_840_000_000,
  active_count:          89,
  avg_ticket_ngn:        31_900_000,
  settlement_rate_pct:   84.2,
  dispute_rate_pct:      3.1,
};

const KPI_DELTA = [
  { label: "Businesses",        value: "1,842", delta: "+34", trend: "up",   period: "this week",  icon: <Building2 size={16} /> },
  { label: "Pipeline Runs",     value: "7,200", delta: "+12%",trend: "up",   period: "vs last mo", icon: <Zap size={16} /> },
  { label: "Avg Score",         value: "634",   delta: "+8",   trend: "up",   period: "vs last mo", icon: <ShieldCheck size={16} /> },
  { label: "Avg Data Quality",  value: "87.4%", delta: "+1.2%",trend: "up",  period: "vs last mo", icon: <Activity size={16} /> },
  { label: "Active Consents",   value: "562",   delta: "+18",  trend: "up",  period: "vs last mo", icon: <ShieldCheck size={16} /> },
  { label: "Dispute Rate",      value: "3.1%",  delta: "-0.4%",trend: "up",  period: "vs last mo", icon: <Activity size={16} /> },
];

function fmtNgn(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n}`;
}

// ─────────────────────────────────────────────────────────────
//  MINI BAR CHART (inline SVG)
// ─────────────────────────────────────────────────────────────

function MiniBarChart({ data, valueKey, color }: { data: typeof GROWTH; valueKey: "businesses" | "financers" | "pipelines"; color: string }) {
  const values = data.map(d => d[valueKey]);
  const max = Math.max(...values);
  const H = 56;
  const W = 220;
  const barW = W / values.length - 4;

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      {values.map((v, i) => {
        const h = (v / max) * H;
        const x = i * (W / values.length);
        const y = H - h;
        return (
          <g key={i}>
            <rect x={x + 2} y={y} width={barW} height={h} fill={color} rx={3} opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Reports</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Platform analytics · Last updated: today</p>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }}><Download size={13} /> Export Report</Button>
      </div>

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {KPI_DELTA.map((kpi) => (
          <div key={kpi.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>{kpi.icon}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={11} style={{ color: "#10B981" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>{kpi.delta}</span>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", marginBottom: 2 }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{kpi.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{kpi.period}</p>
          </div>
        ))}
      </div>

      {/* GROWTH + SECTOR */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Growth chart */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 18 }}>Business Growth (6 months)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(["businesses", "pipelines"] as const).map((key) => {
              const last = GROWTH[GROWTH.length - 1][key];
              const prev = GROWTH[GROWTH.length - 2][key];
              const pct = (((last - prev) / prev) * 100).toFixed(1);
              const color = key === "businesses" ? "#0A2540" : "#00D4FF";
              const label = key === "businesses" ? "Businesses" : "Pipeline Runs";
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540" }}>{last.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>+{pct}%</span>
                    </div>
                  </div>
                  <MiniBarChart data={GROWTH} valueKey={key} color={color} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {GROWTH.map(g => <span key={g.month} style={{ fontSize: 10, color: "#9CA3AF" }}>{g.month}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector breakdown */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Businesses by Sector</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SECTOR_BREAKDOWN.map((s) => {
              const total = SECTOR_BREAKDOWN.reduce((a, b) => a + b.count, 0);
              const pct = (s.count / total) * 100;
              return (
                <div key={s.sector}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{s.sector}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.count}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 9999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCORE DISTRIBUTION + FINANCING SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Score dist */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Score Distribution</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SCORE_DIST.map((band) => (
              <div key={band.band}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{band.band}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: band.color }}>{band.count} ({band.pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 9999, background: "#F3F4F6" }}>
                  <div style={{ height: "100%", width: `${band.pct}%`, background: band.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financing summary */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Financing Summary</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Disbursed",    value: fmtNgn(FINANCING_SUMMARY.total_disbursed_ngn), color: "#0A2540", large: true },
              { label: "Active Financing",   value: String(FINANCING_SUMMARY.active_count),        color: "#0891B2" },
              { label: "Avg Ticket Size",    value: fmtNgn(FINANCING_SUMMARY.avg_ticket_ngn),      color: "#374151" },
              { label: "Settlement Rate",    value: `${FINANCING_SUMMARY.settlement_rate_pct}%`,   color: "#10B981" },
              { label: "Dispute Rate",       value: `${FINANCING_SUMMARY.dispute_rate_pct}%`,      color: FINANCING_SUMMARY.dispute_rate_pct > 5 ? "#EF4444" : "#F59E0B" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: item.large ? 20 : 16, color: item.color, letterSpacing: "-0.03em" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
