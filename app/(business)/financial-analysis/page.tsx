"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Calendar, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /business/score → Score + AggregatedMetrics
───────────────────────────────────────────────────────── */
const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 1820000, expenses: 1240000 },
  { month: "Feb", revenue: 1650000, expenses: 1180000 },
  { month: "Mar", revenue: 2100000, expenses: 1390000 },
  { month: "Apr", revenue: 1940000, expenses: 1310000 },
  { month: "May", revenue: 2280000, expenses: 1450000 },
  { month: "Jun", revenue: 2050000, expenses: 1380000 },
  { month: "Jul", revenue: 2400000, expenses: 1520000 },
  { month: "Aug", revenue: 2310000, expenses: 1490000 },
  { month: "Sep", revenue: 2560000, expenses: 1600000 },
  { month: "Oct", revenue: 2720000, expenses: 1680000 },
  { month: "Nov", revenue: 2890000, expenses: 1740000 },
  { month: "Dec", revenue: 3120000, expenses: 1820000 },
];

const CASHFLOW = [
  { month: "Jan", net:  580000 },
  { month: "Feb", net:  470000 },
  { month: "Mar", net:  710000 },
  { month: "Apr", net:  630000 },
  { month: "May", net:  830000 },
  { month: "Jun", net:  670000 },
  { month: "Jul", net:  880000 },
  { month: "Aug", net:  820000 },
  { month: "Sep", net:  960000 },
  { month: "Oct", net: 1040000 },
  { month: "Nov", net: 1150000 },
  { month: "Dec", net: 1300000 },
];

const EXPENSE_BREAKDOWN = [
  { category: "Supplier / COGS", amount: 7820000, pct: 42, color: "#818CF8" },
  { category: "Payroll",         amount: 5180000, pct: 28, color: "#F59E0B" },
  { category: "Operations",      amount: 2960000, pct: 16, color: "#38BDF8" },
  { category: "Tax & Levies",    amount: 1480000, pct: 8,  color: "#EF4444" },
  { category: "Other",           amount: 1110000, pct: 6,  color: "#D1D5DB" },
];

const KEY_METRICS = [
  { label: "Avg Monthly Revenue",   value: "₦2.32M",  change: "+14%",  positive: true  },
  { label: "Avg Monthly Expenses",  value: "₦1.48M",  change: "+9%",   positive: null  },
  { label: "Avg Net Cashflow",      value: "₦840K",   change: "+22%",  positive: true  },
  { label: "Operating Margin",      value: "36.2%",   change: "+3.1%", positive: true  },
  { label: "Revenue Volatility",    value: "8.4%",    change: "-1.2%", positive: true  },
  { label: "Expense Ratio",         value: "63.8%",   change: "-3.1%", positive: true  },
  { label: "Cash Reserve Ratio",    value: "24.1%",   change: "+4.8%", positive: true  },
  { label: "Recurring Revenue %",   value: "61%",     change: "+7%",   positive: true  },
];

const COUNTERPARTIES = [
  { name: "Jumia Food",           type: "Customer",  txn_count: 48, total: 4120000, pct: 22 },
  { name: "Flour Mills Nigeria",  type: "Supplier",  txn_count: 36, total: 2840000, pct: 15 },
  { name: "Catering Contracts",   type: "Customer",  txn_count: 24, total: 2560000, pct: 14 },
  { name: "Staff Payroll",        type: "Expense",   txn_count: 12, total: 1920000, pct: 10 },
  { name: "Wholesale Distributors",type: "Customer", txn_count: 18, total: 1740000, pct: 9  },
];

const PERIODS = ["6M", "12M", "24M"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

/* ─────────────────────────────────────────────────────────
   CARD SHELL
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 0", gap: 12 }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>
          {title}
        </p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MINI CHART — bar
───────────────────────────────────────────────────────── */
function BarChart({
  data, height = 120,
}: {
  data: { month: string; revenue: number; expenses: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.revenue));

  return (
    <div style={{ padding: "20px 24px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {data.map((d) => (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
              {/* Revenue bar */}
              <div style={{
                width: "100%",
                height: `${(d.revenue / max) * 100}%`,
                background: "#0A2540",
                borderRadius: "3px 3px 0 0",
                minHeight: 4,
                position: "relative" as const,
              }} />
              {/* Expense bar overlay */}
              <div style={{
                width: "100%",
                height: `${(d.expenses / max) * 100}%`,
                background: "#E5E7EB",
                borderRadius: "3px 3px 0 0",
                minHeight: 3,
                marginTop: -((d.expenses / max) * height) - 2,
                opacity: 0.8,
              }} />
            </div>
            <span style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.02em" }}>
              {d.month}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[
          { label: "Revenue",  color: "#0A2540" },
          { label: "Expenses", color: "#E5E7EB", border: true },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: l.border ? "1px solid #D1D5DB" : "none" }} />
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CASHFLOW CHART — area-style using SVG
───────────────────────────────────────────────────────── */
function CashflowChart({ data }: { data: { month: string; net: number }[] }) {
  const W = 600;
  const H = 100;
  const max = Math.max(...data.map(d => d.net));
  const min = 0;
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((d.net - min) / range) * (H - 12),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div style={{ padding: "16px 24px 20px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100, overflow: "visible" }}>
        <defs>
          <linearGradient id="cashflow-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={H * pct} x2={W} y2={H * pct}
            stroke="#F3F4F6" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="url(#cashflow-grad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00D4FF" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>

      {/* X axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.map((d) => (
          <span key={d.month} style={{ fontSize: 9, color: "#9CA3AF" }}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────────────────── */
function MetricTile({ label, value, change, positive }: {
  label: string; value: string; change: string; positive: boolean | null;
}) {
  const changeColor = positive === true ? "#10B981" : positive === false ? "#EF4444" : "#9CA3AF";
  const Icon = positive === true ? TrendingUp : positive === false ? TrendingDown : Minus;

  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={11} style={{ color: changeColor }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: changeColor }}>{change}</span>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>vs prev period</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancialAnalysisPage() {
  const [period, setPeriod] = useState("12M");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Financial Analysis
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Derived from 1,233 normalised transactions · Jan 2023 – Dec 2024
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Period selector */}
          <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
            {PERIODS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  border: "none",
                  borderRight: i < PERIODS.length - 1 ? "1px solid #E5E7EB" : "none",
                  background: period === p ? "#0A2540" : "white",
                  color: period === p ? "white" : "#6B7280",
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KEY METRICS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {KEY_METRICS.map((m) => (
          <MetricTile key={m.label} {...m} />
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader
            title="Revenue vs Expenses"
            sub={`Monthly breakdown · ${period}`}
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={12} style={{ color: "#9CA3AF" }} />
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>2024</span>
              </div>
            }
          />
          <BarChart data={MONTHLY_REVENUE} />
        </Card>

        {/* Net Cashflow */}
        <Card>
          <CardHeader
            title="Net Cashflow"
            sub={`Operating cashflow per month · ${period}`}
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <TrendingUp size={12} style={{ color: "#10B981" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>+22% trend</span>
              </div>
            }
          />
          <CashflowChart data={CASHFLOW} />
        </Card>
      </div>

      {/* ── EXPENSE BREAKDOWN + COUNTERPARTIES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Expense breakdown */}
        <Card>
          <CardHeader title="Expense Breakdown" sub="By category · last 12 months" />
          <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {EXPENSE_BREAKDOWN.map((item) => (
              <div key={item.category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{item.category}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmt(item.amount)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", minWidth: 32, textAlign: "right" as const }}>{item.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>
                {fmt(EXPENSE_BREAKDOWN.reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
          </div>
        </Card>

        {/* Top counterparties */}
        <Card>
          <CardHeader
            title="Top Counterparties"
            sub="By transaction volume · last 12 months"
            action={
              <Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                View all <ChevronRight size={12} />
              </Link>
            }
          />
          <div style={{ padding: "12px 0 8px" }}>
            {COUNTERPARTIES.map((cp, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "11px 24px",
                borderBottom: i < COUNTERPARTIES.length - 1 ? "1px solid #F9FAFB" : "none",
              }}>
                {/* Rank */}
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D1D5DB", width: 14, flexShrink: 0, textAlign: "center" as const }}>
                  {i + 1}
                </span>

                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: cp.type === "Customer" ? "#ECFDF5" : cp.type === "Supplier" ? "#EFF6FF" : "#FEF2F2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cp.type === "Customer" ? "#10B981" : cp.type === "Supplier" ? "#3B82F6" : "#EF4444",
                }}>
                  {cp.type === "Customer"
                    ? <ArrowDownLeft size={14} />
                    : cp.type === "Supplier"
                    ? <ArrowUpRight size={14} />
                    : <Minus size={14} />
                  }
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {cp.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{cp.type} · {cp.txn_count} transactions</p>
                </div>

                {/* Amount + pct */}
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{fmt(cp.total)}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{cp.pct}% of vol.</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── REVENUE PATTERN ANALYSIS ── */}
      <Card>
        <CardHeader
          title="Revenue Pattern Analysis"
          sub="Stability, seasonality, and growth signals from your transaction data."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, padding: "16px 0 0", borderTop: "1px solid #F3F4F6", marginTop: 4 }}>
          {[
            { label: "Revenue Trend",       value: "Strong upward",  sub: "+52% over 12 months",   positive: true },
            { label: "Seasonality",          value: "Low",           sub: "Consistent year-round",  positive: true },
            { label: "Recurring Revenue",    value: "61%",           sub: "Of total inflows",       positive: true },
            { label: "Client Concentration", value: "Medium",        sub: "Top client = 22%",       positive: null },
            { label: "Revenue Volatility",   value: "8.4%",          sub: "Month-on-month std dev", positive: true },
            { label: "Growth Rate",          value: "+14% MoM avg",  sub: "Trailing 12 months",     positive: true },
          ].map((item, i) => (
            <div key={item.label} style={{
              padding: "16px 24px 20px",
              borderRight: i % 3 !== 2 ? "1px solid #F3F4F6" : "none",
              borderBottom: i < 3 ? "1px solid #F3F4F6" : "none",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>
                {item.value}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {item.positive === true && <TrendingUp size={11} style={{ color: "#10B981" }} />}
                {item.positive === false && <TrendingDown size={11} style={{ color: "#EF4444" }} />}
                {item.positive === null && <Minus size={11} style={{ color: "#9CA3AF" }} />}
                <span style={{ fontSize: 11, color: item.positive === true ? "#10B981" : item.positive === false ? "#EF4444" : "#9CA3AF" }}>
                  {item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── LINK TO IDENTITY ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>
            These metrics feed directly into your financial identity score.
          </p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>
            Improving revenue stability and cashflow predictability will raise your score dimensions.
          </p>
        </div>
        <Link href="/financial-identity" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
          View Identity <ChevronRight size={13} />
        </Link>
      </div>

    </div>
  );
}
