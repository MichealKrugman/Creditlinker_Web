"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown,
  Building2, ShieldCheck, ArrowUpRight, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   ACCESSIBLE BUSINESSES
   Replace with: GET /institution/discovery (status: access_granted)
   Only businesses where consent is active can be analysed.
───────────────────────────────────────────────────────── */
const ACCESSIBLE_BUSINESSES = [
  {
    id: "BIZ-1R8T",
    financial_identity_id: "fid_1r8t",
    name: "Kemi Superstores Ltd",
    sector: "Retail",
    data_months: 24,
    coverage: "Jan 2023 – Dec 2024",
    consent_expiry: "Mar 31, 2025",
    revenue: [4.1, 4.8, 3.9, 5.2, 5.8, 4.6, 6.1, 5.5, 6.8, 7.2, 6.4, 7.9],
    cashflow: [1.2, 1.5, 0.8, 1.8, 2.1, 1.4, 2.4, 2.0, 2.6, 2.9, 2.3, 3.1],
    metrics: [
      { label: "Avg Monthly Revenue",  value: "₦5.8M",   trend: "up"   as const, change: "+22% YoY" },
      { label: "Avg Monthly Cashflow", value: "₦2.1M",   trend: "up"   as const, change: "+18% YoY" },
      { label: "Operating Margin",     value: "36%",     trend: "up"   as const, change: "+4pp YoY" },
      { label: "Cash Reserve Ratio",   value: "1.4x",    trend: "flat" as const, change: "Stable"   },
      { label: "Revenue Volatility",   value: "12%",     trend: "down" as const, change: "Low risk"  },
      { label: "Receivable Turnover",  value: "18 days", trend: "up"   as const, change: "Improving" },
    ],
    expenses: [
      { label: "Payroll",          pct: 38, amount: "₦2.8M/mo", color: "#0A2540" },
      { label: "Suppliers",        pct: 29, amount: "₦2.1M/mo", color: "#00D4FF" },
      { label: "Rent & Utilities", pct: 14, amount: "₦1.0M/mo", color: "#818CF8" },
      { label: "Tax & Compliance", pct: 10, amount: "₦0.7M/mo", color: "#F59E0B" },
      { label: "Other",            pct: 9,  amount: "₦0.7M/mo", color: "#E5E7EB" },
    ],
    dimensions: [
      { label: "Revenue Stability",      value: 88, color: "#10B981" },
      { label: "Cashflow Predictability",value: 82, color: "#38BDF8" },
      { label: "Expense Discipline",     value: 84, color: "#818CF8" },
      { label: "Liquidity Strength",     value: 76, color: "#F59E0B" },
      { label: "Financial Consistency",  value: 85, color: "#10B981" },
      { label: "Risk Profile",           value: 74, color: "#EF4444" },
    ],
  },
  {
    id: "BIZ-4F9T",
    financial_identity_id: "fid_4f9t",
    name: "Aduke Bakeries Ltd",
    sector: "Food & Beverage",
    data_months: 20,
    coverage: "Mar 2023 – Oct 2024",
    consent_expiry: "Feb 15, 2025",
    revenue: [2.1, 2.4, 1.9, 3.1, 3.8, 2.9, 3.4, 3.1, 4.0, 4.4, 3.8, 4.2],
    cashflow: [0.6, 0.8, 0.4, 1.0, 1.3, 0.9, 1.1, 0.9, 1.4, 1.6, 1.2, 1.5],
    metrics: [
      { label: "Avg Monthly Revenue",  value: "₦3.3M",   trend: "up"   as const, change: "+15% YoY" },
      { label: "Avg Monthly Cashflow", value: "₦1.0M",   trend: "up"   as const, change: "+11% YoY" },
      { label: "Operating Margin",     value: "31%",     trend: "flat" as const, change: "Stable"   },
      { label: "Cash Reserve Ratio",   value: "1.1x",    trend: "flat" as const, change: "Stable"   },
      { label: "Revenue Volatility",   value: "18%",     trend: "down" as const, change: "Moderate"  },
      { label: "Receivable Turnover",  value: "22 days", trend: "flat" as const, change: "Stable"   },
    ],
    expenses: [
      { label: "Raw Materials",    pct: 42, amount: "₦1.4M/mo", color: "#0A2540" },
      { label: "Payroll",          pct: 24, amount: "₦0.8M/mo", color: "#00D4FF" },
      { label: "Rent & Utilities", pct: 18, amount: "₦0.6M/mo", color: "#818CF8" },
      { label: "Distribution",     pct: 10, amount: "₦0.3M/mo", color: "#F59E0B" },
      { label: "Other",            pct: 6,  amount: "₦0.2M/mo", color: "#E5E7EB" },
    ],
    dimensions: [
      { label: "Revenue Stability",      value: 74, color: "#10B981" },
      { label: "Cashflow Predictability",value: 79, color: "#38BDF8" },
      { label: "Expense Discipline",     value: 81, color: "#818CF8" },
      { label: "Liquidity Strength",     value: 68, color: "#F59E0B" },
      { label: "Financial Consistency",  value: 77, color: "#10B981" },
      { label: "Risk Profile",           value: 80, color: "#EF4444" },
    ],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
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
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />)}
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   BUSINESS PICKER
───────────────────────────────────────────────────────── */
function BusinessPicker({
  selected,
  onSelect,
}: {
  selected: typeof ACCESSIBLE_BUSINESSES[0];
  onSelect: (b: typeof ACCESSIBLE_BUSINESSES[0]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 10,
          border: open ? "1px solid #0A2540" : "1px solid #E5E7EB",
          background: "white", cursor: "pointer",
          transition: "all 0.12s",
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00D4FF", flexShrink: 0 }}>
          {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ textAlign: "left" as const }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{selected.name}</p>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{selected.sector} · {selected.data_months}mo data</p>
        </div>
        <ChevronDown size={14} style={{ color: "#9CA3AF", marginLeft: 8, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)", minWidth: 300, overflow: "hidden",
        }}>
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Businesses with active consent
            </p>
          </div>
          {ACCESSIBLE_BUSINESSES.map(b => (
            <button
              key={b.id}
              onClick={() => { onSelect(b); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 14px",
                background: b.id === selected.id ? "#F9FAFB" : "white",
                border: "none", cursor: "pointer", textAlign: "left" as const,
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00D4FF", flexShrink: 0 }}>
                {b.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: b.id === selected.id ? 700 : 500, color: "#0A2540", marginBottom: 1 }}>{b.name}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{b.sector} · {b.data_months}mo · consent expires {b.consent_expiry}</p>
              </div>
              {b.id === selected.id && (
                <ShieldCheck size={13} style={{ color: "#10B981", flexShrink: 0 }} />
              )}
            </button>
          ))}
          <div style={{ padding: "10px 14px" }}>
            <Link href="/financer/businesses" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Browse all businesses <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerFinancialAnalysis() {
  const [biz, setBiz] = useState(ACCESSIBLE_BUSINESSES[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Financial Analysis
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {biz.data_months} months of verified financial data · {biz.coverage}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BusinessPicker selected={biz} onSelect={setBiz} />
          <Link
            href={`/financer/business-profile?id=${biz.id}`}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 9, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const }}
          >
            Full Identity <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* Consent notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <ShieldCheck size={13} style={{ color: "#00A8CC" }} />
        <p style={{ fontSize: 12, color: "#0A5060" }}>
          Viewing financial analysis for <strong>{biz.name}</strong> under active consent. Access expires <strong>{biz.consent_expiry}</strong>.
        </p>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        {biz.dimensions.map(d => (
          <Card key={d.label} style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{d.label}</p>
              <span style={{ fontSize: 16, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{d.value}</span>
            </div>
            <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* KPI metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {biz.metrics.map(m => (
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ padding: "18px 22px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 2 }}>Monthly Revenue</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{biz.coverage}</p>
          </div>
          <div style={{ padding: "14px 22px 18px" }}>
            <SparkLine data={biz.revenue} color="#0A2540" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {MONTHS.map(m => <span key={m} style={{ fontSize: 9, color: "#9CA3AF", flex: 1, textAlign: "center" as const }}>{m}</span>)}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: "18px 22px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 2 }}>Operating Cashflow</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{biz.coverage}</p>
          </div>
          <div style={{ padding: "14px 22px 18px" }}>
            <SparkLine data={biz.cashflow} color="#10B981" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {MONTHS.map(m => <span key={m} style={{ fontSize: 9, color: "#9CA3AF", flex: 1, textAlign: "center" as const }}>{m}</span>)}
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
          {biz.expenses.map(e => (
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

      {/* Data provenance note */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
        <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
          All metrics are derived from verified bank transaction data ingested via Creditlinker's financial identity pipeline.
          Data provenance — including source accounts, transaction count, and time range — is available on the{" "}
          <Link href={`/financer/business-profile?id=${biz.id}`} style={{ color: "#0A2540", fontWeight: 600 }}>
            financial identity page
          </Link>.
        </p>
      </div>
    </div>
  );
}
