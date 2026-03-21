"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Calendar, RefreshCw,
  Building2, MapPin, AlertCircle, Share2, Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   ENTITY DEFINITIONS
   In production: derived from GET /business/profile/branches
   HQ is always the root entity.
───────────────────────────────────────────────────────── */
type EntityType = "hq" | "branch" | "franchise" | "office" | "warehouse";

interface Entity {
  id: string;
  name: string;
  shortName: string;
  type: EntityType;
  location: string;
  /**
   * has_own_books = true  → separate legal entity (franchise).
   *   Their data requires explicit data-sharing consent.
   * has_own_books = false → same entity as HQ (branch / office).
   *   The business owner may have assigned a dedicated bank account
   *   to this branch — all transactions from that account route here.
   *   See: Data Sources → entity assignment per account / upload.
   */
  has_own_books: boolean;
  data_linked: boolean;      // has at least one data source assigned
  sharing_consent: boolean;  // franchise: have they consented to share?
  tx_count?: number;
  last_synced?: string;
}

/*
  DATA SOURCE ATTRIBUTION MODEL
  ─────────────────────────────
  Each bank account, statement upload, and ledger upload carries
  an entity_id set by the business owner in Data Sources.
  Example: The owner has a Zenith Bank account for HQ operations and
  a GTBank account they use exclusively for the Lekki Store.
  In Data Sources they assign:
    Zenith ****4821  → HQ
    GTBank ****0034  → Lekki Store
  Financial Analysis then scopes all transaction data and metrics
  to the entity whose sources are active in the current view.
*/

const ENTITIES: Entity[] = [
  {
    id:             "hq",
    name:           "Aduke Bakeries Ltd. (HQ)",
    shortName:      "HQ",
    type:           "hq",
    location:       "Victoria Island, Lagos",
    has_own_books:  false,
    data_linked:    true,
    sharing_consent: true,
    tx_count:       842,
    last_synced:    "Today, 09:14",
  },
  {
    id:             "br_001",
    name:           "Lekki Store",
    shortName:      "Lekki Store",
    type:           "branch",
    location:       "Lekki Phase 1, Lagos",
    has_own_books:  false,
    data_linked:    true,
    sharing_consent: true,
    tx_count:       391,
    last_synced:    "Today, 09:14",
  },
  {
    id:             "fr_001",
    name:           "Abuja Franchise",
    shortName:      "Abuja",
    type:           "franchise",
    location:       "Wuse 2, Abuja",
    has_own_books:  true,
    data_linked:    false,
    sharing_consent: false,
    tx_count:       0,
    last_synced:    undefined,
  },
];

/*
  Mock data sources per entity (in production: derived from
  GET /business/data-sources?entity_id=xxx).
  The entity banner shows exactly which sources are feeding
  the current view so the owner knows why the numbers look
  the way they do.
*/
const ENTITY_SOURCES: Record<string, { label: string; type: "bank" | "statement" | "ledger" }[]> = {
  hq: [
    { label: "Zenith Bank ****4821",          type: "bank"      },
    { label: "Zenith statement Jan–Dec 2023", type: "statement" },
    { label: "General Ledger 2023",           type: "ledger"    },
  ],
  br_001: [
    { label: "GTBank ****0034",               type: "bank"      },
    { label: "GTBank statement Q3 2024",      type: "statement" },
  ],
};
const SOURCE_COLORS: Record<string, string> = { bank: "#10B981", statement: "#10B981", ledger: "#3B82F6" };

/* ─────────────────────────────────────────────────────────
   PER-ENTITY FINANCIAL DATA
   In production: GET /business/financial-analysis?entity_id=xxx
   Consolidated: entity_id=consolidated (sums all linked entities)
───────────────────────────────────────────────────────── */
const HQ_MONTHLY = [
  { month: "Jan", revenue: 1120000, expenses: 760000 },
  { month: "Feb", revenue: 1010000, expenses: 720000 },
  { month: "Mar", revenue: 1290000, expenses: 840000 },
  { month: "Apr", revenue: 1180000, expenses: 800000 },
  { month: "May", revenue: 1380000, expenses: 880000 },
  { month: "Jun", revenue: 1240000, expenses: 840000 },
  { month: "Jul", revenue: 1460000, expenses: 930000 },
  { month: "Aug", revenue: 1410000, expenses: 910000 },
  { month: "Sep", revenue: 1560000, expenses: 980000 },
  { month: "Oct", revenue: 1660000, expenses: 1020000 },
  { month: "Nov", revenue: 1760000, expenses: 1060000 },
  { month: "Dec", revenue: 1900000, expenses: 1110000 },
];
const HQ_CASHFLOW = HQ_MONTHLY.map(d => ({ month: d.month, net: d.revenue - d.expenses }));
const HQ_METRICS = [
  { label: "Avg Monthly Revenue",  value: "₦1.41M", change: "+12%",  positive: true  as const },
  { label: "Avg Monthly Expenses", value: "₦905K",  change: "+8%",   positive: null },
  { label: "Avg Net Cashflow",     value: "₦506K",  change: "+18%",  positive: true  as const },
  { label: "Operating Margin",     value: "35.9%",  change: "+2.8%", positive: true  as const },
  { label: "Revenue Volatility",   value: "9.1%",   change: "-0.9%", positive: true  as const },
  { label: "Expense Ratio",        value: "64.1%",  change: "-2.8%", positive: true  as const },
  { label: "Cash Reserve Ratio",   value: "22.4%",  change: "+3.9%", positive: true  as const },
  { label: "Recurring Revenue %",  value: "58%",    change: "+5%",   positive: true  as const },
];

const LEKKI_MONTHLY = [
  { month: "Jan", revenue:  700000, expenses: 480000 },
  { month: "Feb", revenue:  640000, expenses: 460000 },
  { month: "Mar", revenue:  810000, expenses: 550000 },
  { month: "Apr", revenue:  760000, expenses: 510000 },
  { month: "May", revenue:  900000, expenses: 570000 },
  { month: "Jun", revenue:  810000, expenses: 540000 },
  { month: "Jul", revenue:  940000, expenses: 590000 },
  { month: "Aug", revenue:  900000, expenses: 580000 },
  { month: "Sep", revenue: 1000000, expenses: 620000 },
  { month: "Oct", revenue: 1060000, expenses: 660000 },
  { month: "Nov", revenue: 1130000, expenses: 680000 },
  { month: "Dec", revenue: 1220000, expenses: 710000 },
];
const LEKKI_CASHFLOW = LEKKI_MONTHLY.map(d => ({ month: d.month, net: d.revenue - d.expenses }));
const LEKKI_METRICS = [
  { label: "Avg Monthly Revenue",  value: "₦906K", change: "+17%",  positive: true  as const },
  { label: "Avg Monthly Expenses", value: "₦583K", change: "+11%",  positive: null },
  { label: "Avg Net Cashflow",     value: "₦323K", change: "+29%",  positive: true  as const },
  { label: "Operating Margin",     value: "35.7%", change: "+3.5%", positive: true  as const },
  { label: "Revenue Volatility",   value: "7.4%",  change: "-1.6%", positive: true  as const },
  { label: "Expense Ratio",        value: "64.3%", change: "-3.5%", positive: true  as const },
  { label: "Cash Reserve Ratio",   value: "26.8%", change: "+6.1%", positive: true  as const },
  { label: "Recurring Revenue %",  value: "65%",   change: "+9%",   positive: true  as const },
];

const CONSOLIDATED_MONTHLY = HQ_MONTHLY.map((d, i) => ({
  month: d.month,
  revenue:  d.revenue  + LEKKI_MONTHLY[i].revenue,
  expenses: d.expenses + LEKKI_MONTHLY[i].expenses,
}));
const CONSOLIDATED_CASHFLOW = CONSOLIDATED_MONTHLY.map(d => ({ month: d.month, net: d.revenue - d.expenses }));
const CONSOLIDATED_METRICS = [
  { label: "Avg Monthly Revenue",  value: "₦2.32M", change: "+14%",  positive: true  as const },
  { label: "Avg Monthly Expenses", value: "₦1.49M", change: "+9%",   positive: null },
  { label: "Avg Net Cashflow",     value: "₦830K",  change: "+22%",  positive: true  as const },
  { label: "Operating Margin",     value: "35.8%",  change: "+3.1%", positive: true  as const },
  { label: "Revenue Volatility",   value: "8.4%",   change: "-1.2%", positive: true  as const },
  { label: "Expense Ratio",        value: "64.2%",  change: "-3.1%", positive: true  as const },
  { label: "Cash Reserve Ratio",   value: "24.1%",  change: "+4.8%", positive: true  as const },
  { label: "Recurring Revenue %",  value: "61%",    change: "+7%",   positive: true  as const },
];

const BRANCH_CONTRIBUTIONS = [
  { entity: ENTITIES[0], revenue_pct: 61, revenue_total: 16976000, cashflow_total:  6076000, margin: 35.9, color: "#0A2540" },
  { entity: ENTITIES[1], revenue_pct: 39, revenue_total: 10876000, cashflow_total:  3876000, margin: 35.7, color: "#00D4FF" },
];

const EXPENSE_BREAKDOWN = [
  { category: "Supplier / COGS", amount: 7820000, pct: 42, color: "#818CF8" },
  { category: "Payroll",         amount: 5180000, pct: 28, color: "#F59E0B" },
  { category: "Operations",      amount: 2960000, pct: 16, color: "#38BDF8" },
  { category: "Tax & Levies",    amount: 1480000, pct: 8,  color: "#EF4444" },
  { category: "Other",           amount: 1110000, pct: 6,  color: "#D1D5DB" },
];

const COUNTERPARTIES = [
  { name: "Jumia Food",             type: "Customer", txn_count: 48, total: 4120000, pct: 22 },
  { name: "Flour Mills Nigeria",    type: "Supplier", txn_count: 36, total: 2840000, pct: 15 },
  { name: "Catering Contracts",     type: "Customer", txn_count: 24, total: 2560000, pct: 14 },
  { name: "Staff Payroll",          type: "Expense",  txn_count: 12, total: 1920000, pct: 10 },
  { name: "Wholesale Distributors", type: "Customer", txn_count: 18, total: 1740000, pct: 9  },
];

const SCORE = { data_months_analyzed: 24 };

const PERIODS = ["6M", "12M", "24M"];

/* ─────────────────────────────────────────────────────────
   CASH FLOW FORECAST DATA
   In production: GET /business/forecast?entity_id=xxx&months=6
   Pipeline already has the signals (recurring patterns, revenue
   volatility, seasonal weights). This is a UI shell wired to
   mock data until the endpoint is implemented.

   Each month carries:
     projected  – central estimate (₦)
     upper      – optimistic bound (+1σ)
     lower      – conservative bound (-1σ)
     inflow     – projected gross credits
     outflow    – projected gross debits
───────────────────────────────────────────────────────── */
interface ForecastMonth {
  month: string;
  projected: number;
  upper: number;
  lower: number;
  inflow: number;
  outflow: number;
}

const HQ_FORECAST: ForecastMonth[] = [
  { month: "Jan", projected:  860000, upper: 1050000, lower:  680000, inflow: 2040000, outflow: 1180000 },
  { month: "Feb", projected:  900000, upper: 1120000, lower:  690000, inflow: 2110000, outflow: 1210000 },
  { month: "Mar", projected:  980000, upper: 1250000, lower:  720000, inflow: 2250000, outflow: 1270000 },
  { month: "Apr", projected: 1020000, upper: 1340000, lower:  720000, inflow: 2340000, outflow: 1320000 },
  { month: "May", projected: 1080000, upper: 1440000, lower:  730000, inflow: 2460000, outflow: 1380000 },
  { month: "Jun", projected: 1140000, upper: 1550000, lower:  740000, inflow: 2580000, outflow: 1440000 },
];

const LEKKI_FORECAST: ForecastMonth[] = [
  { month: "Jan", projected:  540000, upper:  660000, lower:  430000, inflow: 1300000, outflow:  760000 },
  { month: "Feb", projected:  570000, upper:  700000, lower:  440000, inflow: 1360000, outflow:  790000 },
  { month: "Mar", projected:  610000, upper:  770000, lower:  450000, inflow: 1450000, outflow:  840000 },
  { month: "Apr", projected:  640000, upper:  820000, lower:  450000, inflow: 1510000, outflow:  870000 },
  { month: "May", projected:  680000, upper:  890000, lower:  460000, inflow: 1600000, outflow:  920000 },
  { month: "Jun", projected:  720000, upper:  960000, lower:  470000, inflow: 1690000, outflow:  970000 },
];

const CONSOLIDATED_FORECAST: ForecastMonth[] = HQ_FORECAST.map((d, i) => ({
  month:     d.month,
  projected: d.projected  + LEKKI_FORECAST[i].projected,
  upper:     d.upper      + LEKKI_FORECAST[i].upper,
  lower:     d.lower      + LEKKI_FORECAST[i].lower,
  inflow:    d.inflow     + LEKKI_FORECAST[i].inflow,
  outflow:   d.outflow    + LEKKI_FORECAST[i].outflow,
}));

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  hq: "HQ", branch: "Branch", franchise: "Franchise", office: "Office", warehouse: "Warehouse",
};
const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; color: string; border: string }> = {
  hq:        { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  branch:    { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  franchise: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  office:    { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  warehouse: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
};

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
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

function EntityBadge({ type, small = false }: { type: EntityType; small?: boolean }) {
  const c = ENTITY_TYPE_COLORS[type];
  return (
    <span style={{ fontSize: small ? 9 : 10, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: small ? "1px 6px" : "2px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>
      {ENTITY_TYPE_LABELS[type]}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   BAR CHART
───────────────────────────────────────────────────────── */
function BarChart({ data, height = 120 }: {
  data: { month: string; revenue: number; expenses: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div style={{ padding: "20px 24px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
              <div style={{ width: "100%", height: `${(d.revenue / max) * 100}%`, background: "#0A2540", borderRadius: "3px 3px 0 0", minHeight: 4 }} />
              <div style={{ width: "100%", height: `${(d.expenses / max) * 100}%`, background: "#E5E7EB", borderRadius: "3px 3px 0 0", minHeight: 3, marginTop: -((d.expenses / max) * height) - 2, opacity: 0.8 }} />
            </div>
            <span style={{ fontSize: 9, color: "#9CA3AF" }}>{d.month}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[{ label: "Revenue", color: "#0A2540", border: false }, { label: "Expenses", color: "#E5E7EB", border: true }].map(l => (
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
   CASHFLOW CHART
───────────────────────────────────────────────────────── */
function CashflowChart({ data }: { data: { month: string; net: number }[] }) {
  const W = 600, H = 100;
  const max   = Math.max(...data.map(d => d.net));
  const range = max || 1;
  const points = data.map((d, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((d.net / range) * (H - 12)) }));
  const pathD  = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD  = `${pathD} L ${W} ${H} L 0 ${H} Z`;
  return (
    <div style={{ padding: "16px 24px 20px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100, overflow: "visible" }}>
        <defs>
          <linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" y1={H * p} x2={W} y2={H * p} stroke="#F3F4F6" strokeWidth="1" />)}
        <path d={areaD} fill="url(#cf-grad)" />
        <path d={pathD} fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00D4FF" stroke="white" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.map(d => <span key={d.month} style={{ fontSize: 9, color: "#9CA3AF" }}>{d.month}</span>)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FORECAST CHART
   Renders the last 4 historical months (solid cyan) joined
   seamlessly to 6 projected months (dashed indigo) with a
   shaded confidence band showing the upper/lower bounds.
───────────────────────────────────────────────────────── */
function ForecastChart({
  historical,
  forecast,
}: {
  historical: { month: string; net: number }[];
  forecast:   ForecastMonth[];
}) {
  const W = 700, H = 110;
  const HIST_COUNT = 4;

  const histSlice  = historical.slice(-HIST_COUNT);
  const allNets    = [...histSlice.map(d => d.net), ...forecast.map(d => d.projected)];
  const allUppers  = [...histSlice.map(d => d.net), ...forecast.map(d => d.upper)];
  const allLowers  = [...histSlice.map(d => d.net), ...forecast.map(d => d.lower)];
  const totalCount = allNets.length;
  const max        = Math.max(...allUppers, 1);
  const min        = Math.min(...allLowers, 0);
  const range      = max - min || 1;

  function toY(v: number) { return H - ((v - min) / range) * (H - 14) - 4; }
  function toX(i: number) { return (i / (totalCount - 1)) * W; }

  const histPoints = histSlice.map((_, i) => ({ x: toX(i), y: toY(allNets[i]) }));
  const histPath   = histPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const fcastPoints = forecast.map((_, i) => ({
    x: toX(HIST_COUNT - 1 + i),
    y: toY(forecast[i].projected),
  }));
  const fcastPath = [
    `M ${histPoints[histPoints.length - 1].x} ${histPoints[histPoints.length - 1].y}`,
    ...fcastPoints.map(p => `L ${p.x} ${p.y}`),
  ].join(" ");

  const upperPts = forecast.map((d, i) => ({ x: toX(HIST_COUNT - 1 + i), y: toY(d.upper) }));
  const lowerPts = forecast.map((d, i) => ({ x: toX(HIST_COUNT - 1 + i), y: toY(d.lower) }));
  const bandPath = [
    `M ${histPoints[histPoints.length - 1].x} ${histPoints[histPoints.length - 1].y}`,
    ...upperPts.map(p => `L ${p.x} ${p.y}`),
    ...lowerPts.slice().reverse().map(p => `L ${p.x} ${p.y}`),
    "Z",
  ].join(" ");

  const allMonths = [...histSlice.map(d => d.month), ...forecast.map(d => d.month)];

  return (
    <div style={{ padding: "16px 24px 20px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110, overflow: "visible" }}>
        <defs>
          <linearGradient id="hist-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="band-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" y1={H * p} x2={W} y2={H * p} stroke="#F3F4F6" strokeWidth="1" />
        ))}

        <line
          x1={toX(HIST_COUNT - 1)} y1="0"
          x2={toX(HIST_COUNT - 1)} y2={H}
          stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3"
        />

        <path d={bandPath} fill="url(#band-grad)" />

        <path
          d={`${histPath} L ${histPoints[histPoints.length - 1].x} ${H} L 0 ${H} Z`}
          fill="url(#hist-grad)"
        />

        <path d={histPath} fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={fcastPath} fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" />

        {upperPts.length > 1 && (
          <path
            d={upperPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none" stroke="#818CF8" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 4"
          />
        )}
        {lowerPts.length > 1 && (
          <path
            d={lowerPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none" stroke="#818CF8" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 4"
          />
        )}

        {histPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00D4FF" stroke="white" strokeWidth="1.5" />
        ))}
        {fcastPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#818CF8" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {allMonths.map((m, i) => (
          <span key={m + i} style={{ fontSize: 9, color: i < HIST_COUNT ? "#9CA3AF" : "#818CF8", fontWeight: i >= HIST_COUNT ? 600 : 400 }}>{m}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {[
          { label: "Historical",          color: "#00D4FF", dashed: false, band: false },
          { label: "Projected (central)", color: "#818CF8", dashed: true,  band: false },
          { label: "Confidence band",     color: "#818CF8", dashed: false, band: true  },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {l.band ? (
              <div style={{ width: 14, height: 8, borderRadius: 2, background: "rgba(129,140,248,0.18)", border: "1px solid rgba(129,140,248,0.35)" }} />
            ) : (
              <svg width="14" height="8">
                <line x1="0" y1="4" x2="14" y2="4" stroke={l.color} strokeWidth="2"
                  strokeDasharray={l.dashed ? "4 3" : "none"} strokeLinecap="round" />
              </svg>
            )}
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   METRIC TILE
───────────────────────────────────────────────────────── */
function MetricTile({ label, value, change, positive }: {
  label: string; value: string; change: string; positive: boolean | null;
}) {
  const cc   = positive === true ? "#10B981" : positive === false ? "#EF4444" : "#9CA3AF";
  const Icon = positive === true ? TrendingUp : positive === false ? TrendingDown : Minus;
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={11} style={{ color: cc }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: cc }}>{change}</span>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>vs prev period</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BRANCH CONTRIBUTIONS (consolidated view only)
───────────────────────────────────────────────────────── */
function BranchContributions({ contributions, unlinkedFranchises }: {
  contributions: typeof BRANCH_CONTRIBUTIONS;
  unlinkedFranchises: Entity[];
}) {
  return (
    <Card>
      <CardHeader
        title="Entity Performance Breakdown"
        sub="Revenue contribution and financial health per operating location"
        action={<Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#9CA3AF", textDecoration: "none" }}>Manage sources <ChevronRight size={12} /></Link>}
      />
      <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Stacked bar */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Revenue share</p>
          <div style={{ height: 14, borderRadius: 9999, overflow: "hidden", display: "flex" }}>
            {contributions.map((c, i) => (
              <div key={c.entity.id} style={{ width: `${c.revenue_pct}%`, background: c.color, borderRadius: i === 0 ? "9999px 0 0 9999px" : i === contributions.length - 1 ? "0 9999px 9999px 0" : "0" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 7, flexWrap: "wrap" as const }}>
            {contributions.map(c => (
              <div key={c.entity.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{c.entity.shortName} — {c.revenue_pct}%</span>
              </div>
            ))}
            {unlinkedFranchises.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#D97706", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#D97706" }}>{f.shortName} — no data</span>
              </div>
            ))}
          </div>
        </div>
        {/* Table */}
        <div className="cl-table-scroll"><div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6", minWidth: 540 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 80px 80px", padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
            {["Entity","Revenue (12M)","Net Cashflow","Margin","Status"].map(h => (
              <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
            ))}
          </div>
          {contributions.map((c, i) => (
            <div key={c.entity.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 80px 80px", padding: "14px 16px", borderBottom: i < contributions.length - 1 || unlinkedFranchises.length > 0 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.entity.shortName}</p>
                  <EntityBadge type={c.entity.type} small />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 15 }}>{c.entity.location}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(c.revenue_total)}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{fmt(c.cashflow_total)}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: c.margin >= 35 ? "#10B981" : "#F59E0B" }}>{c.margin}%</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>Linked</span>
              </div>
            </div>
          ))}
          {unlinkedFranchises.map(f => (
            <div key={f.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 80px 80px", padding: "14px 16px", borderTop: "1px solid #F9FAFB", alignItems: "center", background: "#FFFBEB" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", flexShrink: 0 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{f.shortName}</p>
                  <EntityBadge type={f.type} small />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 15 }}>{f.location}</p>
              </div>
              <p style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic" as const }}>Not included</p>
              <p style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic" as const }}>Not included</p>
              <p style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic" as const }}>—</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
                <span style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>No data</span>
              </div>
            </div>
          ))}
        </div>
        </div>
          {unlinkedFranchises.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#92400E" }}>
                <strong>{unlinkedFranchises.map(f => f.shortName).join(", ")}</strong> {unlinkedFranchises.length === 1 ? "is a" : "are"} separate legal {unlinkedFranchises.length === 1 ? "entity" : "entities"} and {unlinkedFranchises.length === 1 ? "has" : "have"} not yet shared financial data. Consolidated totals reflect only linked entities.
              </p>
            </div>
            <Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" as const }}>
              <Share2 size={11} /> Invite them
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   FRANCHISE NO-DATA STATE
───────────────────────────────────────────────────────── */
function FranchiseNoData({ entity }: { entity: Entity }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertCircle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>{entity.name} — Financial data not yet available</p>
          <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.7 }}>
            Franchises are <strong>independent legal entities</strong> with their own CAC registration, accounts, and books.
            To include their financials here, they must link their own bank accounts on their Creditlinker profile and consent to share data with this business.
          </p>
        </div>
      </div>
      <Card style={{ padding: "48px 32px", textAlign: "center" as const }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FFF7ED", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Share2 size={24} style={{ color: "#C2410C" }} />
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Invite {entity.shortName} to connect
        </p>
        <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.7 }}>
          Send them an invitation to link their bank account via Mono or upload statements directly.
          Once they consent to share, their financial data will appear here and contribute to your consolidated view.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/data-sources" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <Share2 size={13} /> Send data invitation
          </Link>
          <Link href="/business-profile" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "1px solid #E5E7EB", color: "#374151", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Edit franchise profile
          </Link>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancialAnalysisPage() {
  const [period,       setPeriod]       = useState("12M");
  const [activeEntity, setActiveEntity] = useState("consolidated");

  const linkedEntities     = ENTITIES.filter(e => e.data_linked);
  const unlinkedFranchises = ENTITIES.filter(e => !e.data_linked && e.type === "franchise");
  const isConsolidated     = activeEntity === "consolidated";
  const selectedEntity     = isConsolidated ? null : ENTITIES.find(e => e.id === activeEntity) ?? null;
  const franchiseNoData    = selectedEntity?.type === "franchise" && !selectedEntity.data_linked;

  const monthlyData  = isConsolidated ? CONSOLIDATED_MONTHLY : activeEntity === "hq" ? HQ_MONTHLY  : activeEntity === "br_001" ? LEKKI_MONTHLY  : [];
  const cashflowData = isConsolidated ? CONSOLIDATED_CASHFLOW : activeEntity === "hq" ? HQ_CASHFLOW : activeEntity === "br_001" ? LEKKI_CASHFLOW : [];
  const metricsData  = isConsolidated ? CONSOLIDATED_METRICS  : activeEntity === "hq" ? HQ_METRICS  : activeEntity === "br_001" ? LEKKI_METRICS  : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Financial Analysis</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Revenue, cashflow, and financial health across your business</p>
        </div>
        {/* Period selector */}
        <div style={{ display: "flex", gap: 4, background: "#F3F4F6", borderRadius: 9, padding: 3 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, background: period === p ? "white" : "transparent", color: period === p ? "#0A2540" : "#9CA3AF", boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.12s" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── ENTITY TABS ── */}
      <div className="fa-tabs-row" style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {/* Consolidated tab */}
        <button onClick={() => setActiveEntity("consolidated")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: activeEntity === "consolidated" ? "1px solid #0A2540" : "1px solid #E5E7EB", background: activeEntity === "consolidated" ? "#0A2540" : "white", color: activeEntity === "consolidated" ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
          <Building2 size={13} />
          All entities
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: activeEntity === "consolidated" ? "rgba(255,255,255,0.2)" : "#F3F4F6", color: activeEntity === "consolidated" ? "white" : "#6B7280" }}>
            {linkedEntities.length}
          </span>
        </button>

        {/* Per-entity tabs */}
        {ENTITIES.map(e => {
          const active = activeEntity === e.id;
          const locked = e.type === "franchise" && !e.data_linked;
          const tc     = ENTITY_TYPE_COLORS[e.type];
          return (
            <button key={e.id} onClick={() => setActiveEntity(e.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: active ? `1px solid ${tc.color}` : "1px solid #E5E7EB", background: active ? tc.bg : "white", color: active ? tc.color : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", opacity: locked ? 0.7 : 1 }}>
              {locked ? <Lock size={11} style={{ color: "#D97706" }} /> : <MapPin size={11} />}
              {e.shortName}
              <EntityBadge type={e.type} small />
            </button>
          );
        })}
      </div>

      {/* ── ENTITY BANNER ── */}
      {selectedEntity && ENTITY_SOURCES[selectedEntity.id] && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: ENTITY_TYPE_COLORS[selectedEntity.type].bg, border: `1px solid ${ENTITY_TYPE_COLORS[selectedEntity.type].border}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          <MapPin size={12} style={{ color: ENTITY_TYPE_COLORS[selectedEntity.type].color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: ENTITY_TYPE_COLORS[selectedEntity.type].color }}>{selectedEntity.name}</span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>·</span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>Sourced from:</span>
          {ENTITY_SOURCES[selectedEntity.id].map(src => (
            <span key={src.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: SOURCE_COLORS[src.type], background: "white", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: SOURCE_COLORS[src.type], display: "inline-block" }} />
              {src.label}
            </span>
          ))}
          <Link href="/data-sources" style={{ fontSize: 11, fontWeight: 600, color: ENTITY_TYPE_COLORS[selectedEntity.type].color, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 2 }}>
            Manage <ChevronRight size={10} />
          </Link>
        </div>
      )}

      {/* ── FRANCHISE NO-DATA STATE ── */}
      {franchiseNoData ? (
        <FranchiseNoData entity={selectedEntity!} />
      ) : (
        <>
          {/* KEY METRICS */}
          {metricsData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {metricsData.map(m => <MetricTile key={m.label} {...m} />)}
            </div>
          )}

          {/* CHARTS */}
          {monthlyData.length > 0 && (
            <div className="fa-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card>
                <CardHeader
                  title="Revenue vs Expenses"
                  sub={`Monthly breakdown · ${period}${selectedEntity ? ` · ${selectedEntity.shortName}` : " · Consolidated"}`}
                  action={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} style={{ color: "#9CA3AF" }} /><span style={{ fontSize: 11, color: "#9CA3AF" }}>2024</span></div>}
                />
                <BarChart data={monthlyData} />
              </Card>
              <Card>
                <CardHeader
                  title="Net Cashflow"
                  sub={`Operating cashflow · ${period}${selectedEntity ? ` · ${selectedEntity.shortName}` : ""}`}
                  action={<div style={{ display: "flex", alignItems: "center", gap: 5 }}><TrendingUp size={12} style={{ color: "#10B981" }} /><span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>+22% trend</span></div>}
                />
                <CashflowChart data={cashflowData} />
              </Card>
            </div>
          )}

          {/* CASH FLOW FORECAST */}
          {(() => {
            const forecastData = isConsolidated ? CONSOLIDATED_FORECAST
              : activeEntity === "hq"     ? HQ_FORECAST
              : activeEntity === "br_001" ? LEKKI_FORECAST
              : null;

            if (!forecastData || monthlyData.length === 0) return null;

            const totalProjected6M = forecastData.reduce((s, d) => s + d.projected, 0);
            const avgMonthly       = totalProjected6M / 6;
            const totalInflow      = forecastData.reduce((s, d) => s + d.inflow, 0);
            const totalOutflow     = forecastData.reduce((s, d) => s + d.outflow, 0);
            const peakMonth        = forecastData.reduce((best, d) => d.projected > best.projected ? d : best, forecastData[0]);
            const lowMonth         = forecastData.reduce((low,  d) => d.projected < low.projected  ? d : low,  forecastData[0]);

            return (
              <Card>
                <CardHeader
                  title="Cash Flow Forecast"
                  sub={`6-month projection based on ${SCORE.data_months_analyzed} months of verified data${selectedEntity ? ` · ${selectedEntity.shortName}` : " · Consolidated"}`}
                  action={
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818CF8" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>Model v1 · SDK pending</span>
                    </div>
                  }
                />

                <ForecastChart historical={cashflowData} forecast={forecastData} />

                <div style={{ height: 1, background: "#F3F4F6", margin: "0 24px" }} />

                {/* Summary stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "16px 0 0" }}>
                  {[
                    { label: "Projected net (6M)",  value: fmt(totalProjected6M), sub: "Central estimate",       color: "#10B981" },
                    { label: "Avg monthly surplus",  value: fmt(avgMonthly),       sub: "Central estimate",       color: "#10B981" },
                    { label: "Peak month",           value: peakMonth.month,       sub: fmt(peakMonth.projected), color: "#0A2540" },
                    { label: "Lowest month",         value: lowMonth.month,        sub: fmt(lowMonth.projected),  color: "#0A2540" },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: "0 24px 20px", borderRight: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: s.color, letterSpacing: "-0.03em", marginBottom: 2, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Inflow / outflow / net per month breakdown */}
                <div style={{ margin: "0 24px 20px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #E5E7EB" }}>
                    <div style={{ padding: "12px 16px", borderRight: "1px solid #E5E7EB" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Projected inflows (6M)</p>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#10B981", letterSpacing: "-0.02em" }}>{fmt(totalInflow)}</p>
                    </div>
                    <div style={{ padding: "12px 16px", borderRight: "1px solid #E5E7EB" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Projected outflows (6M)</p>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", letterSpacing: "-0.02em" }}>{fmt(totalOutflow)}</p>
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Projected margin</p>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#10B981", letterSpacing: "-0.02em" }}>
                        {((totalProjected6M / totalInflow) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Per-month table */}
                  <div className="cl-table-scroll">
                    <div style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", minWidth: 560 }}>
                      <div style={{ padding: "8px 16px", background: "#F3F4F6", borderBottom: "1px solid #E5E7EB" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Month</span>
                      </div>
                      {forecastData.map(d => (
                        <div key={d.month} style={{ padding: "8px 10px", background: "#F3F4F6", borderBottom: "1px solid #E5E7EB", borderLeft: "1px solid #E5E7EB", textAlign: "center" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7280" }}>{d.month}</span>
                        </div>
                      ))}

                      <div style={{ padding: "9px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>Inflow</span>
                      </div>
                      {forecastData.map(d => (
                        <div key={d.month + "in"} style={{ padding: "9px 10px", borderLeft: "1px solid #F3F4F6", textAlign: "center" as const }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>{fmt(d.inflow)}</span>
                        </div>
                      ))}

                      <div style={{ padding: "9px 16px", borderTop: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Outflow</span>
                      </div>
                      {forecastData.map(d => (
                        <div key={d.month + "out"} style={{ padding: "9px 10px", borderLeft: "1px solid #F3F4F6", borderTop: "1px solid #F3F4F6", textAlign: "center" as const }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{fmt(d.outflow)}</span>
                        </div>
                      ))}

                      <div style={{ padding: "9px 16px", borderTop: "1px solid #F3F4F6", background: "#F9FAFB" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2540" }}>Net</span>
                      </div>
                      {forecastData.map(d => (
                        <div key={d.month + "net"} style={{ padding: "9px 10px", borderLeft: "1px solid #F3F4F6", borderTop: "1px solid #F3F4F6", textAlign: "center" as const, background: "#F9FAFB" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: d.projected >= 0 ? "#10B981" : "#EF4444" }}>{fmt(d.projected)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ margin: "0 24px 20px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8 }}>
                  <AlertCircle size={13} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.65 }}>
                    Projections are derived from historical revenue patterns, recurring transaction signals, and seasonal weights
                    in your financial feature store. Confidence bands widen at 3–6 months due to increasing uncertainty.
                    Actual results may vary. This does not constitute financial advice.
                  </p>
                </div>
              </Card>
            );
          })()}

          {/* ENTITY CONTRIBUTION (consolidated only) */}
          {isConsolidated && (
            <BranchContributions contributions={BRANCH_CONTRIBUTIONS} unlinkedFranchises={unlinkedFranchises} />
          )}

          {/* EXPENSE + COUNTERPARTIES */}
          <div className="fa-expense-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <CardHeader title="Expense Breakdown" sub={`By category · last 12 months${selectedEntity ? ` · ${selectedEntity.shortName}` : ""}`} />
              <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                {EXPENSE_BREAKDOWN.map(item => (
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{fmt(EXPENSE_BREAKDOWN.reduce((s, i) => s + i.amount, 0))}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Top Counterparties"
                sub="By transaction volume · last 12 months"
                action={<Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>View all <ChevronRight size={12} /></Link>}
              />
              <div style={{ padding: "12px 0 8px" }}>
                {COUNTERPARTIES.map((cp, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 24px", borderBottom: i < COUNTERPARTIES.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#D1D5DB", width: 14, flexShrink: 0, textAlign: "center" as const }}>{i + 1}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: cp.type === "Customer" ? "#ECFDF5" : cp.type === "Supplier" ? "#EFF6FF" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: cp.type === "Customer" ? "#10B981" : cp.type === "Supplier" ? "#3B82F6" : "#EF4444" }}>
                      {cp.type === "Customer" ? <ArrowDownLeft size={14} /> : cp.type === "Supplier" ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{cp.name}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{cp.type} · {cp.txn_count} transactions</p>
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

          {/* REVENUE PATTERN ANALYSIS */}
          <Card>
            <CardHeader
              title="Revenue Pattern Analysis"
              sub={`Stability, seasonality, and growth signals${selectedEntity ? ` · ${selectedEntity.shortName}` : " · Consolidated"}`}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, padding: "16px 0 0", borderTop: "1px solid #F3F4F6", marginTop: 4 }}>
              {[
                { label: "Revenue Trend",       value: "Strong upward",  sub: "+52% over 12 months",   positive: true  as const },
                { label: "Seasonality",          value: "Low",           sub: "Consistent year-round",  positive: true  as const },
                { label: "Recurring Revenue",    value: isConsolidated ? "61%" : activeEntity === "br_001" ? "65%" : "58%", sub: "Of total inflows", positive: true as const },
                { label: "Client Concentration", value: "Medium",        sub: "Top client = 22%",       positive: null },
                { label: "Revenue Volatility",   value: isConsolidated ? "8.4%" : activeEntity === "br_001" ? "7.4%" : "9.1%", sub: "Month-on-month std dev", positive: true as const },
                { label: "Growth Rate",          value: "+14% MoM avg",  sub: "Trailing 12 months",     positive: true  as const },
              ].map((item, i) => (
                <div key={item.label} style={{ padding: "16px 24px 20px", borderRight: i % 3 !== 2 ? "1px solid #F3F4F6" : "none", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
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

          {/* IDENTITY NUDGE */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>These metrics feed directly into your financial identity score.</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>Improving revenue stability and cashflow predictability will raise your score dimensions.</p>
            </div>
            <Link href="/financial-identity" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
              View Identity <ChevronRight size={13} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
