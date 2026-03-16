"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /institution/score/:fid + provenance
───────────────────────────────────────────────────────── */
const MONTHLY_REVENUE = [4.1, 4.8, 3.9, 5.2, 5.8, 4.6, 6.1, 5.5, 6.8, 7.2, 6.4, 7.9];
const MONTHLY_CASHFLOW = [1.2, 1.5, 0.8, 1.8, 2.1, 1.4, 2.4, 2.0, 2.6, 2.9, 2.3, 3.1];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EXPENSE_CATEGORIES = [
  { label: "Payroll",         pct: 38, amount: "₦2.8M/mo", color: "#0A2540" },
  { label: "Suppliers",       pct: 29, amount: "₦2.1M/mo", color: "#00D4FF" },
  { label: "Rent & Utilities",pct: 14, amount: "₦1.0M/mo", color: "#818CF8" },
  { label: "Tax & Compliance",pct: 10, amount: "₦0.7M/mo", color: "#F59E0B" },
  { label: "Other",           pct: 9,  amount: "₦0.7M/mo", color: "#E5E7EB" },
];

const METRICS = [
  { label: "Avg Monthly Revenue",    value: "₦5.8M",  trend: "up"   as const, change: "+22% YoY" },
  { label: "Avg Monthly Cashflow",   value: "₦2.1M",  trend: "up"   as const, change: "+18% YoY" },
  { label: "Operating Margin",       value: "36%",    trend: "up"   as const, change: "+4pp YoY" },
  { label: "Cash Reserve Ratio",     value: "1.4x",   trend: "flat" as const, change: "Stable"   },
  { label: "Revenue Volatility",     value: "12%",    trend: "down" as const, change: "Low risk"  },
  { label: "Receivable Turnover",    value: "18 days",trend: "up"   as const, change: "Improving" },
];

function trendIcon(t: "up" | "down" | "flat") {
  if (t === "up")   return <TrendingUp   size={12} style={{ color: "#10B981" }} />;
  if (t === "down") return <TrendingDown size={12} style={{ color: "#EF4444" }} />;
  return                   <Minus        size={12} style={{ color: "#9CA3AF" }} />;
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 280, H = 72;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 8) - 4,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    + ` L${W},${H} L0,${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <path d={fill} fill={color} fillOpacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

export default function FinancerFinancialAnalysis() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Financial Analysis
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Kemi Superstores · 24 months of verified bank data · Jan 2023 – Dec 2024
        </p>
      </div>

      {/* KPI metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {METRICS.map(m => (
          <Card key={m.label} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              {trendIcon(m.trend)}
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{m.change}</span>
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
              {m.value}
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Revenue chart */}
        <Card>
          <div style={{ padding: "18px 22px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 2 }}>Monthly Revenue</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>Jan 2024 – Dec 2024</p>
          </div>
          <div style={{ padding: "14px 22px 18px" }}>
            <SparkLine data={MONTHLY_REVENUE} color="#0A2540" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {MONTHS.map((m, i) => (
                <span key={m} style={{ fontSize: 9, color: "#9CA3AF", flex: 1, textAlign: "center" }}>{m}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Cashflow chart */}
        <Card>
          <div style={{ padding: "18px 22px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 2 }}>Operating Cashflow</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>Jan 2024 – Dec 2024</p>
          </div>
          <div style={{ padding: "14px 22px 18px" }}>
            <SparkLine data={MONTHLY_CASHFLOW} color="#10B981" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {MONTHS.map(m => (
                <span key={m} style={{ fontSize: 9, color: "#9CA3AF", flex: 1, textAlign: "center" }}>{m}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Expense breakdown */}
      <Card>
        <div style={{ padding: "18px 22px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Expense Breakdown</p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Average monthly operating expenses by category</p>
        </div>
        <div style={{ padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {EXPENSE_CATEGORIES.map(e => (
            <div key={e.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: e.color }} />
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{e.label}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{e.amount}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{e.pct}%</span>
                </div>
              </div>
              <div style={{ height: 7, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${e.pct}%`, background: e.color, borderRadius: 9999 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
