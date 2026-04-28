"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronRight,
  ArrowUpRight, ArrowDownLeft, RefreshCw,
  AlertCircle, GitBranch, Building2,
} from "lucide-react";
import { useActiveBusiness } from "@/lib/business-context";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface MonthlyRow {
  month: string;
  monthKey: string;
  revenue: number;
  expenses: number;
  net: number;
}

interface MetricTileData {
  label: string;
  value: string;
  positive: boolean | null;
  sub: string;
}

interface ExpenseItem {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

interface Counterparty {
  name: string;
  type: "Customer" | "Supplier" | "Expense" | "Other";
  txn_count: number;
  total: number;
  pct: number;
}

interface RawTransaction {
  date: string;
  amount: number;
  direction: "credit" | "debit";
  category: string | null;
  counterparty_cluster: string | null;
}

interface HistoricalMonth {
  month: string;
  inflow: number;
  outflow: number;
  net_cashflow: number;
  trend: number;
  seasonality: number;
  residual: number;
}

interface ForecastMonth {
  month: string;
  inflow: number;
  outflow: number;
  forecast: number;
  upper_bound: number;
  lower_bound: number;
}

interface CashflowForecast {
  forecast_id: string;
  trend_direction: "improving" | "declining" | "stable";
  trend_slope: number;
  seasonality_detected: boolean;
  peak_month: string | null;
  trough_month: string | null;
  data_months_used: number;
  historical: HistoricalMonth[];
  forecast_months: ForecastMonth[];
}

interface AggregatedMetrics {
  monthly_revenue_avg?: number;
  monthly_expense_avg?: number;
  net_cashflow_avg?: number;
  revenue_growth_rate?: number;
  transaction_count_total?: number;
}

const PERIODS = ["6M", "12M", "24M"] as const;
type Period = typeof PERIODS[number];

const EXPENSE_COLORS = ["#818CF8", "#F59E0B", "#38BDF8", "#EF4444", "#10B981", "#D1D5DB"];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n == null || isNaN(n)) return "₦—";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toFixed(0)}`;
}

function periodStartDate(period: Period): string {
  const d = new Date();
  d.setMonth(d.getMonth() - (period === "6M" ? 6 : period === "12M" ? 12 : 24));
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function aggregateByMonth(txs: RawTransaction[]): MonthlyRow[] {
  const map: Record<string, { revenue: number; expenses: number }> = {};
  for (const tx of txs) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { revenue: 0, expenses: 0 };
    if (tx.direction === "credit") map[key].revenue += Number(tx.amount);
    else map[key].expenses += Number(tx.amount);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: new Date(Number(key.split("-")[0]), Number(key.split("-")[1]) - 1, 1)
        .toLocaleDateString("en-GB", { month: "short" }),
      monthKey: key,
      revenue: v.revenue,
      expenses: v.expenses,
      net: v.revenue - v.expenses,
    }));
}

function computeMetrics(rows: MonthlyRow[], saved: AggregatedMetrics): MetricTileData[] {
  if (!rows.length) return [];
  const avgRev  = rows.reduce((s, r) => s + r.revenue,  0) / rows.length;
  const avgExp  = rows.reduce((s, r) => s + r.expenses, 0) / rows.length;
  const avgNet  = rows.reduce((s, r) => s + r.net,      0) / rows.length;
  const margin  = avgRev > 0 ? (avgNet / avgRev) * 100 : 0;
  const expRatio = avgRev > 0 ? (avgExp / avgRev) * 100 : 0;
  const stdDev  = Math.sqrt(rows.reduce((s, r) => s + Math.pow(r.revenue - avgRev, 2), 0) / rows.length);
  const volatility = avgRev > 0 ? (stdDev / avgRev) * 100 : 0;
  const half = Math.floor(rows.length / 2);
  const firstH = rows.slice(0, half).reduce((s, r) => s + r.revenue, 0) / (half || 1);
  const secH   = rows.slice(half).reduce((s, r) => s + r.revenue, 0) / ((rows.length - half) || 1);
  const growth = saved.revenue_growth_rate ?? (firstH > 0 ? (secH - firstH) / firstH : 0);

  return [
    { label: "Avg Monthly Revenue",  value: fmt(avgRev),                       sub: `over ${rows.length} months`,        positive: null },
    { label: "Avg Monthly Expenses", value: fmt(avgExp),                       sub: `over ${rows.length} months`,        positive: null },
    { label: "Avg Net Cashflow",     value: fmt(avgNet),                       sub: "revenue minus expenses",            positive: avgNet >= 0 },
    { label: "Operating Margin",     value: `${margin.toFixed(1)}%`,           sub: "net / revenue",                     positive: margin > 30 ? true : margin > 0 ? null : false },
    { label: "Revenue Volatility",   value: `${volatility.toFixed(1)}%`,       sub: "monthly std dev",                   positive: volatility < 15 ? true : volatility < 30 ? null : false },
    { label: "Expense Ratio",        value: `${expRatio.toFixed(1)}%`,         sub: "expenses / revenue",                positive: expRatio < 70 ? true : expRatio < 85 ? null : false },
    { label: "Revenue Growth",       value: `${growth >= 0 ? "+" : ""}${(growth * 100).toFixed(1)}%`, sub: "first vs second half", positive: growth > 0 ? true : growth === 0 ? null : false },
    { label: "Months of Data",       value: `${rows.length}`,                  sub: rows.length >= 12 ? "sufficient history" : "building history", positive: rows.length >= 12 ? true : null },
  ];
}

function computeExpenses(txs: RawTransaction[]): ExpenseItem[] {
  const map: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.direction !== "debit") continue;
    const cat = tx.category || "Other";
    map[cat] = (map[cat] || 0) + Number(tx.amount);
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount], i) => ({
      category, amount,
      pct: Math.round((amount / total) * 100),
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    }));
}

function computeCounterparties(txs: RawTransaction[]): Counterparty[] {
  const map: Record<string, { total: number; count: number; dir: string }> = {};
  for (const tx of txs) {
    const name = tx.counterparty_cluster || "Unknown";
    if (!map[name]) map[name] = { total: 0, count: 0, dir: tx.direction };
    map[name].total += Number(tx.amount);
    map[name].count++;
  }
  const grand = Object.values(map).reduce((s, v) => s + v.total, 0) || 1;
  return Object.entries(map)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)
    .map(([name, v]) => ({
      name,
      type: v.dir === "credit" ? "Customer" : "Expense" as "Customer" | "Expense",
      txn_count: v.count,
      total: v.total,
      pct: Math.round((v.total / grand) * 100),
    }));
}

// ─────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 0", gap: 12 }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function SkeletonBox({ w = "100%", h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#F3F4F6", animation: "pulse 1.5s infinite" }} />;
}

function MetricTile({ label, value, positive, sub }: MetricTileData) {
  const cc   = positive === true ? "#10B981" : positive === false ? "#EF4444" : "#9CA3AF";
  const Icon = positive === true ? TrendingUp : positive === false ? TrendingDown : Minus;
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={11} style={{ color: cc }} />
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG BAR CHART — grouped revenue + expense bars per month
// ─────────────────────────────────────────────────────────────

function BarChart({ data }: { data: MonthlyRow[] }) {
  if (!data.length) return (
    <div style={{ padding: "24px", textAlign: "center" as const }}>
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>No transactions in this period.</p>
    </div>
  );

  const W = 700, H = 130, PAD_LEFT = 40, PAD_BOTTOM = 24, PAD_TOP = 10;
  const chartW = W - PAD_LEFT;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const max    = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);
  const colW   = chartW / data.length;
  const barW   = Math.max(Math.min(colW * 0.35, 24), 4);
  const gap    = barW * 0.4;

  const yGrids = [0.25, 0.5, 0.75, 1];
  const toY    = (v: number) => PAD_TOP + chartH - (v / max) * chartH;
  const toX    = (i: number) => PAD_LEFT + i * colW + colW / 2;

  return (
    <div style={{ padding: "16px 24px 16px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130, overflow: "visible" }}>
        {/* Y-axis grid lines + labels */}
        {yGrids.map(p => {
          const y = toY(max * p);
          return (
            <g key={p}>
              <line x1={PAD_LEFT} y1={y} x2={W} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={PAD_LEFT - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#D1D5DB">
                {fmt(max * p)}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={PAD_LEFT} y1={toY(0)} x2={W} y2={toY(0)} stroke="#E5E7EB" strokeWidth="1" />

        {/* Bars */}
        {data.map((d, i) => {
          const cx   = toX(i);
          const revH = (d.revenue  / max) * chartH;
          const expH = (d.expenses / max) * chartH;
          const base = toY(0);
          return (
            <g key={d.monthKey}>
              {/* Revenue bar */}
              <rect
                x={cx - gap / 2 - barW}
                y={base - revH}
                width={barW}
                height={Math.max(revH, 2)}
                fill="#0A2540"
                rx="2"
              />
              {/* Expense bar */}
              <rect
                x={cx + gap / 2}
                y={base - expH}
                width={barW}
                height={Math.max(expH, 2)}
                fill="#00D4FF"
                opacity="0.55"
                rx="2"
              />
              {/* Month label */}
              <text x={cx} y={H - 4} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {[
          { label: "Revenue",  color: "#0A2540" },
          { label: "Expenses", color: "#00D4FF", opacity: 0.55 },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, opacity: l.opacity ?? 1 }} />
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG CASHFLOW LINE CHART
// ─────────────────────────────────────────────────────────────

function CashflowChart({ data }: { data: MonthlyRow[] }) {
  if (!data.length) return (
    <div style={{ padding: "24px", textAlign: "center" as const }}>
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>No data for this period.</p>
    </div>
  );

  // Single data point — SVG line path would be degenerate (invisible); show a value card instead
  if (data.length === 1) {
    const net = data[0].net;
    return (
      <div style={{ padding: "16px 24px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 130, background: "#F9FAFB", borderRadius: 10, border: "1px dashed #E5E7EB" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: net >= 0 ? "#10B981" : "#EF4444", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{fmt(net)}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Net cashflow · {data[0].month} · only 1 month in this range</p>
        </div>
      </div>
    );
  }

  const W = 700, H = 130, PAD_LEFT = 40, PAD_BOTTOM = 24, PAD_TOP = 10;
  const chartW = W - PAD_LEFT;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const nets   = data.map(d => d.net);
  const maxAbs = Math.max(...nets.map(Math.abs), 1);
  const mid    = PAD_TOP + chartH / 2;

  const toY = (v: number) => mid - (v / maxAbs) * (chartH / 2 - 4);
  const toX = (i: number) => PAD_LEFT + (data.length > 1 ? (i / (data.length - 1)) : 0.5) * chartW;

  const points = nets.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${mid} L${points[0].x},${mid} Z`;

  const trend = nets.length >= 2 ? nets[nets.length - 1] - nets[0] : 0;
  const trendColor = trend >= 0 ? "#10B981" : "#EF4444";

  return (
    <div style={{ padding: "16px 24px 16px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130, overflow: "visible" }}>
        <defs>
          <linearGradient id="cf-grad-fa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {[-0.5, 0, 0.5].map(p => {
          const y = mid - p * (chartH / 2);
          return (
            <g key={p}>
              <line x1={PAD_LEFT} y1={y} x2={W} y2={y} stroke={p === 0 ? "#E5E7EB" : "#F3F4F6"} strokeWidth={p === 0 ? 1.5 : 1} strokeDasharray={p === 0 ? "4 3" : "none"} />
              {p !== 0 && (
                <text x={PAD_LEFT - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#D1D5DB">
                  {fmt(maxAbs * Math.abs(p))}
                </text>
              )}
            </g>
          );
        })}

        {/* Area + line */}
        <path d={areaPath} fill="url(#cf-grad-fa)" />
        <path d={linePath} fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#00D4FF" stroke="white" strokeWidth="1.5" />
        ))}

        {/* Month labels */}
        {data.map((d, i) => (
          <text key={d.monthKey} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
        ))}
      </svg>

      {nets.length >= 2 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          {trend >= 0
            ? <TrendingUp size={12} style={{ color: trendColor }} />
            : <TrendingDown size={12} style={{ color: trendColor }} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: trendColor }}>
            {trend >= 0 ? "+" : ""}{fmt(trend)} vs first month
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ENTITY PERFORMANCE (single entity, expandable for branches)
// ─────────────────────────────────────────────────────────────

function EntityPerformance({ rows, businessName, period }: { rows: MonthlyRow[]; businessName: string; period: Period }) {
  if (!rows.length) return null;
  const totalRevenue  = rows.reduce((s, r) => s + r.revenue,  0);
  const totalCashflow = rows.reduce((s, r) => s + r.net,      0);
  const margin        = totalRevenue > 0 ? ((totalCashflow / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <Card>
      <CardHeader
        title="Entity Performance"
        sub="Revenue contribution and financial health"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 7, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <GitBranch size={11} style={{ color: "#9CA3AF" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF" }}>Single entity</span>
          </div>
        }
      />
      <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Revenue share bar — single entity = 100% */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Revenue share</p>
          <div style={{ height: 14, borderRadius: 9999, background: "#0A2540", overflow: "hidden" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#0A2540" }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{businessName} — 100%</span>
          </div>
        </div>

        {/* Table */}
        <div className="cl-table-scroll">
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6", minWidth: 500 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px", padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
              {["Entity", `Revenue (${period})`, "Net Cashflow", "Margin", "Status"].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px 80px", padding: "14px 16px", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2540", flexShrink: 0 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{businessName}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#4338CA", background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "1px 6px", borderRadius: 9999 }}>HQ</span>
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(totalRevenue)}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: totalCashflow >= 0 ? "#10B981" : "#EF4444" }}>{fmt(totalCashflow)}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: Number(margin) >= 20 ? "#10B981" : "#F59E0B" }}>{margin}%</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function FinancialAnalysisPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();

  const [period,         setPeriod]         = useState<Period>("12M");
  const [loading,        setLoading]        = useState(true);
  const [monthlyData,    setMonthlyData]    = useState<MonthlyRow[]>([]);
  const [metrics,        setMetrics]        = useState<MetricTileData[]>([]);
  const [expenses,       setExpenses]       = useState<ExpenseItem[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [forecast,        setForecast]        = useState<CashflowForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError,   setForecastError]   = useState<string | null>(null);

  const loadForecast = useCallback(async () => {
    if (!activeBusiness) return;
    setForecastLoading(true);
    setForecastError(null);
    try {
      const { data: cached, error } = await supabase
        .from("cashflow_forecasts")
        .select("forecast, computed_at")
        .eq("business_id", activeBusiness.business_id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found, anything else is a real error
        throw new Error(error.message);
      }

      if (cached?.forecast) {
        const f = cached.forecast as any;
        setForecast({
          forecast_id:          f.forecast_id,
          trend_direction:      f.trend_direction,
          trend_slope:          f.trend_slope,
          seasonality_detected: f.seasonality_detected,
          peak_month:           f.peak_month,
          trough_month:         f.trough_month,
          data_months_used:     f.data_months_used,
          historical:           (f.historical ?? []).map((m: any) => ({
            month:        m.month,
            inflow:       m.inflow       ?? 0,
            outflow:      m.outflow      ?? 0,
            net_cashflow: m.net_cashflow ?? 0,
            trend:        m.trend        ?? 0,
            seasonality:  m.seasonality  ?? 0,
            residual:     m.residual     ?? 0,
          })),
          forecast_months: (f.forecast ?? []).map((m: any) => ({
            month:       m.month,
            inflow:      m.inflow      ?? 0,
            outflow:     m.outflow     ?? 0,
            forecast:    m.forecast    ?? 0,
            upper_bound: m.upper_bound ?? 0,
            lower_bound: m.lower_bound ?? 0,
          })),
        });
      }
      // If no cached forecast, leave forecast null — pipeline hasn't run yet
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setForecastLoading(false);
    }
  }, [activeBusiness?.business_id]);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);

    const startDate = periodStartDate(period);
    const bizId     = activeBusiness.business_id;

    const [txRes, metricsRes] = await Promise.all([
      supabase
        .from("normalized_transactions")
        .select("date, amount, direction, category, counterparty_cluster")
        .eq("business_id", bizId)
        .gte("date", startDate)
        .order("date", { ascending: true }),
      supabase
        .from("aggregated_metrics")
        .select("metrics")
        .eq("business_id", bizId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const txs:   RawTransaction[]  = (txRes.data ?? []) as RawTransaction[];
    const saved: AggregatedMetrics = (metricsRes.data as any)?.metrics ?? {};

    const monthly = aggregateByMonth(txs);
    setMonthlyData(monthly);
    setMetrics(computeMetrics(monthly, saved));
    setExpenses(computeExpenses(txs));
    setCounterparties(computeCounterparties(txs));
    setLoading(false);
  }, [activeBusiness?.business_id, period]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadForecast(); }, [loadForecast]);

  if (bizLoading) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading...</div>;
  if (!activeBusiness) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No business found.</div>;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Financial Analysis
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Revenue, cashflow and financial health — {activeBusiness.name}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: loading ? "not-allowed" : "pointer" }}
          >
            <RefreshCw size={12} style={{ opacity: loading ? 0.4 : 1 }} />
            Refresh
          </button>
          <div style={{ display: "flex", gap: 4, background: "#F3F4F6", borderRadius: 9, padding: 3 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, background: period === p ? "white" : "transparent", color: period === p ? "#0A2540" : "#9CA3AF", boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.12s" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KEY METRICS ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {[1,2,3,4,5,6,7,8].map(i => <SkeletonBox key={i} h={90} r={12} />)}
        </div>
      ) : metrics.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {metrics.map(m => <MetricTile key={m.label} {...m} />)}
        </div>
      ) : (
        <div style={{ padding: "24px", textAlign: "center" as const, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>No transactions found for this period.</p>
        </div>
      )}

      {/* ── CHARTS ── */}
      <div className="fa-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader
            title="Revenue vs Expenses"
            sub={`Monthly breakdown · ${period} · ${activeBusiness.name}${
              !loading && monthlyData.length
                ? ` · ${monthlyData.length} month${monthlyData.length !== 1 ? "s" : ""} found`
                : ""
            }`}
          />
          {loading
            ? <div style={{ padding: "20px 24px" }}><SkeletonBox h={130} r={8} /></div>
            : <BarChart data={monthlyData} />}
        </Card>
        <Card>
          <CardHeader
            title="Net Cashflow"
            sub={`Operating cashflow · ${period}${
              !loading && monthlyData.length
                ? ` · ${monthlyData.length} month${monthlyData.length !== 1 ? "s" : ""} found`
                : ""
            }`}
            action={
              !loading && monthlyData.length >= 2 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendingUp size={12} style={{ color: "#10B981" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>
                    {fmt(monthlyData.reduce((s, d) => s + d.net, 0) / monthlyData.length)}/mo avg
                  </span>
                </div>
              ) : undefined
            }
          />
          {loading
            ? <div style={{ padding: "16px 24px 20px" }}><SkeletonBox h={130} r={8} /></div>
            : <CashflowChart data={monthlyData} />}
        </Card>
      </div>

      {/* ── CASH FLOW FORECAST ── */}
      <Card>
        <CardHeader
          title="Cash Flow Forecast"
          sub={forecast
            ? `6-month projection based on ${forecast.data_months_used} months of verified data · Consolidated`
            : "6-month projection"}
          action={
            forecastLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818CF8", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>Computing…</span>
              </div>
            ) : forecast ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#065F46" }}>
                  {forecast.trend_direction === "improving" ? "Improving" : forecast.trend_direction === "declining" ? "Declining" : "Stable"}
                </span>
              </div>
            ) : (
              <button onClick={loadForecast} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "#0A2540", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <RefreshCw size={11} /> Retry
              </button>
            )
          }
        />
        <div style={{ padding: "16px 24px 24px" }}>
          {forecastLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SkeletonBox h={180} r={8} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[1,2,3,4].map(i => <SkeletonBox key={i} h={60} r={8} />)}
              </div>
            </div>
          ) : forecastError ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
              <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#991B1B" }}>{forecastError}</p>
            </div>
          ) : forecast ? (() => {
            const months     = forecast.forecast_months;
            const trendColor = forecast.trend_direction === "improving" ? "#10B981" : forecast.trend_direction === "declining" ? "#EF4444" : "#00D4FF";
            const monthLabel = (key: string) => new Date(key + "-01").toLocaleDateString("en-GB", { month: "short" });

            // All stats come directly from SDK — no browser computation
            const totalNet     = months.reduce((s, m) => s + m.forecast, 0);
            const totalInflow  = months.reduce((s, m) => s + m.inflow,   0);
            const totalOutflow = months.reduce((s, m) => s + m.outflow,  0);
            const avgNet       = totalNet / (months.length || 1);
            const margin       = totalInflow > 0 ? (totalNet / totalInflow) * 100 : 0;
            const peakM        = months.reduce((b, m) => m.forecast > b.forecast ? m : b, months[0]);
            const troughM      = months.reduce((b, m) => m.forecast < b.forecast ? m : b, months[0]);

            // Chart uses SDK historical[] for past months — no dependency on transaction query
            const histSlice = forecast.historical.slice(-4);
            const histPts   = histSlice.map(m => ({ key: m.month, val: m.net_cashflow, projected: false as const }));
            const projPts   = months.map(m => ({ key: m.month, val: m.forecast, projected: true as const, upper: m.upper_bound, lower: m.lower_bound }));
            const allPts    = [...histPts, ...projPts];

            const W = 700, H = 180, PAD_L = 44, PAD_B = 28, PAD_T = 12;
            const chartW = W - PAD_L;
            const chartH = H - PAD_B - PAD_T;
            const allVals = allPts.map(p => p.val).concat(projPts.flatMap(p => [p.upper, p.lower]));
            const maxV = Math.max(...allVals, 1);
            const minV = Math.min(...allVals, 0);
            const range = maxV - minV || 1;
            const toY = (v: number) => PAD_T + chartH - ((v - minV) / range) * chartH;
            const toX = (i: number) => PAD_L + (allPts.length > 1 ? (i / (allPts.length - 1)) : 0.5) * chartW;

            const histLine    = histPts.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(p.val)}`).join(" ");
            const joinX       = toX(histPts.length - 1);
            const joinY       = toY(histPts[histPts.length - 1]?.val ?? 0);
            const projLine    = projPts.map((p, i) => `${i === 0 ? `M${joinX},${joinY} L` : "L"}${toX(histPts.length + i)},${toY(p.val)}`).join(" ");
            const upperLine   = projPts.map((p, i) => `${i === 0 ? `M${joinX},${joinY} L` : "L"}${toX(histPts.length + i)},${toY(p.upper)}`).join(" ");
            const lowerPtsArr = projPts.map((p, i) => ({ x: toX(histPts.length + i), y: toY(p.lower) }));
            const bandPath    = [`M${joinX},${joinY}`, ...projPts.map((p, i) => `L${toX(histPts.length + i)},${toY(p.upper)}`), ...[...lowerPtsArr].reverse().map(p => `L${p.x},${p.y}`), `L${joinX},${joinY} Z`].join(" ");

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Chart — historical from SDK, projected from SDK */}
                <div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 180, overflow: "visible" }}>
                    <defs>
                      <linearGradient id="fc-band2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={trendColor} stopOpacity="0.12" />
                        <stop offset="100%" stopColor={trendColor} stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map(p => { const v = minV + range * p; const y = toY(v); return (<g key={p}><line x1={PAD_L} y1={y} x2={W} y2={y} stroke="#F3F4F6" strokeWidth="1" /><text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#D1D5DB">{fmt(v)}</text></g>); })}
                    <line x1={joinX} y1={PAD_T} x2={joinX} y2={PAD_T + chartH} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
                    <path d={bandPath} fill="url(#fc-band2)" />
                    <path d={upperLine} fill="none" stroke={trendColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
                    <path d={lowerPtsArr.map((p, i) => `${i === 0 ? `M${joinX},${joinY} L` : "L"}${p.x},${p.y}`).join(" ")} fill="none" stroke={trendColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
                    <path d={histLine} fill="none" stroke="#0A2540" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {histPts.map((p, i) => <circle key={i} cx={toX(i)} cy={toY(p.val)} r="3" fill="#0A2540" stroke="white" strokeWidth="1.5" />)}
                    <path d={projLine} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
                    {projPts.map((p, i) => <circle key={i} cx={toX(histPts.length + i)} cy={toY(p.val)} r="4" fill={trendColor} stroke="white" strokeWidth="1.5" />)}
                    {allPts.map((p, i) => <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill={p.projected ? "#9CA3AF" : "#6B7280"}>{monthLabel(p.key)}</text>)}
                    <text x={toX(1)} y={PAD_T + 8} textAnchor="middle" fontSize="8" fill="#9CA3AF">Historical</text>
                    <text x={toX(histPts.length + 2)} y={PAD_T + 8} textAnchor="middle" fontSize="8" fill={trendColor}>Projected (central)</text>
                  </svg>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    {[{ label: "Historical", color: "#0A2540", dash: false, band: false }, { label: "Projected (central)", color: trendColor, dash: true, band: false }, { label: "Confidence band", color: trendColor, dash: false, band: true }].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {l.band ? <div style={{ width: 14, height: 8, borderRadius: 2, background: trendColor, opacity: 0.15, border: `1px solid ${trendColor}` }} /> : <div style={{ width: 14, height: 2, background: l.color, borderRadius: 1, backgroundImage: l.dash ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none" }} />}
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary stat tiles — inflow/outflow from SDK */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { label: "Projected net (6M)",     value: fmt(totalNet),             sub: "Central estimate" },
                    { label: "Avg monthly surplus",    value: fmt(avgNet),               sub: "Central estimate" },
                    { label: "Peak month",              value: monthLabel(peakM.month),   sub: fmt(peakM.forecast) },
                    { label: "Lowest month",            value: monthLabel(troughM.month), sub: fmt(troughM.forecast) },
                    { label: "Projected inflows (6M)",  value: fmt(totalInflow),          sub: "From SDK" },
                    { label: "Projected outflows (6M)", value: fmt(totalOutflow),         sub: "From SDK" },
                    { label: "Projected margin",        value: `${margin.toFixed(1)}%`,   sub: "Net / inflow" },
                    { label: forecast.seasonality_detected ? "Seasonality" : "Trend slope", value: forecast.seasonality_detected ? "Detected" : `${fmt(forecast.trend_slope)}/mo`, sub: forecast.seasonality_detected ? "Seasonal pattern found" : "Monthly change" },
                  ].map((tile, i) => (
                    <div key={i} style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 5 }}>{tile.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 3 }}>{tile.value}</p>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{tile.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly breakdown table — inflow/outflow/net directly from SDK */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Monthly Breakdown</p>
                  <div className="cl-table-scroll">
                    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6", minWidth: 500 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Month</p>
                        {months.map((m, i) => <p key={i} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{monthLabel(m.month)}</p>)}
                      </div>
                      {[
                        { label: "Inflow",  vals: months.map(m => fmt(m.inflow)),   color: "#0A2540" },
                        { label: "Outflow", vals: months.map(m => fmt(m.outflow)),  color: "#EF4444" },
                        { label: "Net",     vals: months.map(m => fmt(m.forecast)), color: trendColor },
                      ].map((row, ri) => (
                        <div key={ri} style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", padding: "10px 16px", borderBottom: ri < 2 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF" }}>{row.label}</p>
                          {row.vals.map((v, i) => <p key={i} style={{ fontSize: 12, fontWeight: 700, color: row.color, fontFamily: "var(--font-display)" }}>{v}</p>)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })() : (
            <div style={{ height: 80, borderRadius: 10, background: "#F9FAFB", border: "1px dashed #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>No forecast yet — run the pipeline to generate a 6-month projection.</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── ENTITY PERFORMANCE ── */}
      {!loading && <EntityPerformance rows={monthlyData} businessName={activeBusiness.name} period={period} />}

      {/* ── EXPENSE + COUNTERPARTIES ── */}
      <div className="fa-expense-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <Card>
          <CardHeader title="Expense Breakdown" sub={`By category · last ${period} · debits only`} />
          <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
              <><SkeletonBox h={20} /><SkeletonBox h={20} /><SkeletonBox h={20} /><SkeletonBox h={20} /></>
            ) : expenses.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" as const, padding: "12px 0" }}>No expense data for this period.</p>
            ) : (
              <>
                {expenses.map(item => (
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(totalExpenses)}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Top Counterparties"
            sub={`By transaction volume · last ${period}`}
            action={
              <Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                View all <ChevronRight size={12} />
              </Link>
            }
          />
          <div style={{ padding: "12px 0 8px" }}>
            {loading ? (
              <div style={{ padding: "12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                <SkeletonBox h={44} /><SkeletonBox h={44} /><SkeletonBox h={44} />
              </div>
            ) : counterparties.length === 0 ? (
              <div style={{ padding: "16px 24px", textAlign: "center" as const }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>No counterparty data for this period.</p>
              </div>
            ) : counterparties.map((cp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 24px", borderBottom: i < counterparties.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D1D5DB", width: 14, flexShrink: 0, textAlign: "center" as const }}>{i + 1}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: cp.type === "Customer" ? "#ECFDF5" : cp.type === "Supplier" ? "#EFF6FF" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: cp.type === "Customer" ? "#10B981" : cp.type === "Supplier" ? "#3B82F6" : "#EF4444" }}>
                  {cp.type === "Customer" ? <ArrowDownLeft size={14} /> : cp.type === "Supplier" ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{cp.name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{cp.type} · {cp.txn_count} transaction{cp.txn_count !== 1 ? "s" : ""}</p>
                </div>
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
      {!loading && monthlyData.length >= 2 && (() => {
        const revenues   = monthlyData.map(d => d.revenue);
        const mean       = revenues.reduce((s, v) => s + v, 0) / revenues.length;
        const stdDev     = Math.sqrt(revenues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / revenues.length);
        const volatility = mean > 0 ? (stdDev / mean) * 100 : 0;
        const half       = Math.floor(monthlyData.length / 2);
        const firstH     = monthlyData.slice(0, half).reduce((s, d) => s + d.revenue, 0) / (half || 1);
        const secH       = monthlyData.slice(half).reduce((s, d) => s + d.revenue, 0) / ((monthlyData.length - half) || 1);
        const growth     = firstH > 0 ? ((secH - firstH) / firstH * 100) : 0;
        const bestMonth  = monthlyData.reduce((b, d) => d.revenue > b.revenue ? d : b, monthlyData[0]);
        const avgNet     = monthlyData.reduce((s, d) => s + d.net, 0) / monthlyData.length;

        const patterns: { label: string; value: string; sub: string; positive: boolean | null }[] = [
          { label: "Revenue Trend",      value: secH > firstH ? "Upward" : secH < firstH ? "Downward" : "Flat", sub: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% over ${period}`, positive: secH > firstH ? true : secH < firstH ? false : null },
          { label: "Seasonality",        value: volatility < 15 ? "Low" : volatility < 30 ? "Medium" : "High",  sub: `${volatility.toFixed(1)}% monthly std dev`,                    positive: volatility < 15 ? true : volatility < 30 ? null : false },
          { label: "Revenue Months",     value: `${monthlyData.filter(d => d.revenue > 0).length}/${monthlyData.length}`, sub: "months with revenue activity",                        positive: monthlyData.every(d => d.revenue > 0) ? true : null },
          { label: "Best Month",         value: bestMonth.month,                                                           sub: fmt(bestMonth.revenue),                                positive: true },
          { label: "Revenue Volatility", value: `${volatility.toFixed(1)}%`,                                              sub: "month-on-month std dev",                              positive: volatility < 15 ? true : volatility < 30 ? null : false },
          { label: "Avg Net / Month",    value: fmt(avgNet),                                                               sub: "average monthly surplus",                             positive: avgNet > 0 ? true : false },
        ];

        return (
          <Card>
            <CardHeader title="Revenue Pattern Analysis" sub={`Stability, seasonality, and growth signals · ${period}`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid #F3F4F6", marginTop: 4 }}>
              {patterns.map((item, i) => (
                <div key={item.label} className="fa-pattern-item" style={{ padding: "16px 24px 20px", borderRight: i % 3 !== 2 ? "1px solid #F3F4F6" : "none", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>{item.value}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {item.positive === true  && <TrendingUp   size={11} style={{ color: "#10B981" }} />}
                    {item.positive === false && <TrendingDown size={11} style={{ color: "#EF4444" }} />}
                    {item.positive === null  && <Minus        size={11} style={{ color: "#9CA3AF" }} />}
                    <span style={{ fontSize: 11, color: item.positive === true ? "#10B981" : item.positive === false ? "#EF4444" : "#9CA3AF" }}>{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* ── IDENTITY NUDGE ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>These metrics feed directly into your financial identity score.</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Improving revenue stability and cashflow predictability will raise your score dimensions.</p>
        </div>
        <Link href="/financial-identity" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
          View Identity <ChevronRight size={13} />
        </Link>
      </div>

    </div>
  );
}
