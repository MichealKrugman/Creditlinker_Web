"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight,
  Building2, ShieldCheck, ArrowUpRight, Info, Loader2, Search, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type DimKey = "revenue_stability" | "cashflow_predictability" | "expense_discipline" | "liquidity_strength" | "financial_consistency" | "risk_profile";

type ScoreDimension = {
  key:       DimKey;
  label:     string;
  raw_score: number;
  grade:     string;
  signal:    string;
  signals:   string[];
  breakdown: {
    observed: string[];
    lending:  string;
    watch:    string;
  } | null;
  trend:     "improving" | "stable" | "declining";
  color:     string;
  weight:    number;
  points:    number;
};

type LendingSignal = {
  label:  string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type ScoreAnalysis = {
  underwriting_summary: string;
  confidence:           "high" | "medium" | "low";
  confidence_reasons:   string[];
  lending_signals:      LendingSignal[];
};

type BusinessAnalysis = {
  consent_id:         string;
  business_id:        string;
  business_name:      string;
  anonymized_id:      string;
  granted_at:         string;
  consent_expiry:     string | null;
  data_months:        number;
  coverage:           string;
  composite_score:    number | null;
  lender_risk:        string | null;
  data_quality_score: number | null;
  engine_version:     string | null;
  dimensions:         ScoreDimension[];
  metrics:            AggregatedMetricsSnapshot | null;
  analysis:           ScoreAnalysis | null;
};

// The subset of AggregatedMetrics we fetch and display
type AggregatedMetricsSnapshot = {
  // Revenue
  monthly_revenue:              Record<string, number>;
  revenue_growth_rate_3m:       number | null;
  revenue_sources_count:        number;
  client_concentration_ratio:   number;
  revenue_diversification_index:number;
  // Cashflow
  monthly_net_cashflow:         Record<string, number>;
  positive_cashflow_ratio:      number;
  cashflow_volatility_coefficient: number;
  has_negative_cashflow_streak: boolean;
  recurring_revenue_ratio:      number;
  // Expenses
  opex_to_revenue_ratio:        number;
  expense_growth_vs_revenue_growth_delta: number;
  // Liquidity
  avg_closing_balance:          number;
  liquidity_floor:              number;
  inflow_to_expense_coverage_ratio: number;
  cash_runway_days:             number;
  // Consistency / risk
  active_months_ratio:          number;
  months_of_data:               number;
  payroll_consistent:           boolean;
  has_consistent_supplier_payments: boolean;
  active_risk_flags:            Array<{ type: string; severity: string; description: string; score_impact: number }>;
  // Lending capacity
  debt_service_capacity:        number;
  realistic_loan_capacity_range: {
    min_loan_amount: number;
    max_loan_amount: number;
    min_monthly_installment: number;
    max_monthly_installment: number;
  };
  withdrawal_pressure_ratio:    number;
  minimum_monthly_coverage:     number;
};

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const DIM_META: Record<DimKey, { label: string; color: string; weight: number; maxPoints: number; formula: string; components: string[] }> = {
  revenue_stability: {
    label: "Revenue Stability", color: "#10B981", weight: 30, maxPoints: 180,
    formula: "Score = max(0, 100 - CV×100) + diversity bonus - concentration penalty + trend bonus",
    components: [
      "Coefficient of Variation of monthly revenue (lower = more stable)",
      "Revenue source diversity: 2-3 sources +5pts, 4+ sources +10pts",
      "Client concentration penalty: >60% single client -15pts, >80% -30pts",
      "3-month revenue trend: growing >0% +5pts, >10% +10pts",
    ],
  },
  cashflow_predictability: {
    label: "Cashflow Predictability", color: "#38BDF8", weight: 25, maxPoints: 150,
    formula: "Score = (positive months / total months × 60) + (recurring ratio × 30) ± adjustments",
    components: [
      "% of months with positive net cashflow → up to 60 base points",
      "Recurring income ratio × 30 bonus points",
      "Consistent payroll cycle detected → +10pts",
      "3+ consecutive negative cashflow months → -25pts penalty",
    ],
  },
  expense_discipline: {
    label: "Expense Discipline", color: "#818CF8", weight: 15, maxPoints: 90,
    formula: "Score = max(0, min(75, (1 - OPEX ratio) × 100)) ± growth delta adjustment",
    components: [
      "OPEX-to-revenue ratio: continuous linear function (no step cliffs)",
      "Expenses growing slower than revenue → +15pts",
      "Expenses growing faster than revenue by >10% → -15pts",
    ],
  },
  liquidity_strength: {
    label: "Liquidity Strength", color: "#F59E0B", weight: 15, maxPoints: 90,
    formula: "Score based on average balance as multiple of monthly expense average",
    components: [
      "Average balance ÷ monthly expenses: 3x+ = 80pts base, 2x = 60pts, 1x = 40pts, <1x = 20pts",
      "No overdraft episodes detected → +10pts",
      "Overdraft episodes detected → -20pts",
      "High cashflow volatility coefficient (>0.7) → -10pts",
      "Insufficient balance data → neutral 50pts (not penalised)",
    ],
  },
  financial_consistency: {
    label: "Financial Consistency", color: "#10B981", weight: 10, maxPoints: 60,
    formula: "Score = data longevity base + active months ratio + behavioral bonuses",
    components: [
      "Data history: 12+ months = 30pts base, 6-11mo = 20pts, 3-5mo = 10pts, <3mo = 5pts",
      "Active months ratio: >90% +30pts, >70% +15pts",
      "Consistent payroll cycle → +20pts",
      "Consistent supplier payment pattern → +20pts",
    ],
  },
  risk_profile: {
    label: "Risk Profile", color: "#EF4444", weight: 5, maxPoints: 30,
    formula: "Score = 100 - sum of active risk flag penalties (floor: 0)",
    components: [
      "Starts at 100 (clean baseline — higher is healthier)",
      "Critical flag → -25pts per flag",
      "High severity flag → -15pts",
      "Medium severity flag → -8pts",
      "Low severity flag → -3pts",
    ],
  },
};

const GRADE_META: Record<string, { label: string; color: string; bg: string }> = {
  A: { label: "Excellent", color: "#059669", bg: "#ECFDF5" },
  B: { label: "Good",      color: "#0284C7", bg: "#E0F2FE" },
  C: { label: "Moderate",  color: "#D97706", bg: "#FEF3C7" },
  D: { label: "Weak",      color: "#DC2626", bg: "#FEF2F2" },
  F: { label: "Very Weak", color: "#7F1D1D", bg: "#FEF2F2" },
};


const SIGNAL_TRANSLATIONS: Record<string, string> = {
  // Revenue Stability
  "High revenue volatility detected":                                       "Revenue varies significantly month to month — income is unpredictable",
  "Over-reliance on single client":                                         "Most revenue comes from one client — losing them would be a serious risk",
  "Client concentration data insufficient — more account transactions needed": "Not enough data to assess how spread out the client base is",
  "Good revenue diversification":                                           "Revenue comes from multiple clients — well spread",
  // Cashflow Predictability
  "Frequent negative cashflow months":                                      "The business has regularly spent more than it earned in a given month",
  "Strong recurring revenue base":                                          "A large portion of income is recurring and predictable",
  "3+ consecutive months of negative cashflow":                             "The business had at least 3 months in a row where outflows exceeded inflows",
  "No significant signals":                                                 "No notable cashflow concerns detected",
  // Expense Discipline
  "Expenses consuming most of revenue":                                     "Operating costs are eating up most of what the business earns",
  "Revenue growing faster than expenses":                                   "The business is growing efficiently — revenue is outpacing cost growth",
  // Liquidity Strength
  "Insufficient cash buffer relative to expenses":                          "Cash on hand is too low relative to monthly costs",
  "Overdraft episodes detected":                                            "The account went into overdraft at least once during the review period",
  "Strong cash reserves maintained":                                        "The business holds strong cash reserves relative to its monthly costs",
  "Balance data insufficient to score liquidity — upload statements with running balances for a full assessment": "Bank statements don't include running balances — liquidity could not be fully assessed",
  // Financial Consistency
  "Limited financial history — more data improves score":                   "Less than 6 months of data — a longer history would give a more reliable picture",
  "Dormant periods detected":                                               "Some months had no transaction activity — gaps in trading history",
  "Consistent payroll cycle strengthens credibility":                       "Payroll is paid on a regular schedule — a sign of operational discipline",
  // Risk Profile
  "No anomalous patterns detected":                                         "No unusual activity or risk flags detected in this account",
  "Account balance dropped more than 50% within a single month.":           "The account balance fell by more than half in a single month",
};

function translateSignal(raw: string): string {
  return SIGNAL_TRANSLATIONS[raw] ?? raw;
}

function toGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function riskColor(r: string | null) {
  if (!r) return "#9CA3AF";
  if (r.includes("very_low") || r.includes("low")) return "#059669";
  if (r.includes("medium"))                        return "#D97706";
  return "#DC2626";
}

function riskLabel(r: string | null) {
  if (!r) return "Unknown";
  return r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* ─────────────────────────────────────────────────────────
   DRIVER TABLE + RAW METRIC ROWS per dimension
───────────────────────────────────────────────────────── */
type DriverImpact = "positive" | "negative" | "neutral";
type DriverRow = { signal: string; impact: DriverImpact };

function getDimDrivers(key: DimKey, m: AggregatedMetricsSnapshot): DriverRow[] {
  switch (key) {
    case "revenue_stability": {
      const months = Object.values(m.monthly_revenue);
      const avg = months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;
      const cv  = avg > 0 ? Math.sqrt(months.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / months.length) / avg : 0;
      const rows: DriverRow[] = [];
      rows.push({ signal: `Revenue CV ${fmt(cv, 2)} — monthly earnings ${cv >= 0.5 ? "highly" : cv >= 0.3 ? "moderately" : "slightly"} volatile`, impact: cv >= 0.5 ? "negative" : cv >= 0.3 ? "neutral" : "positive" });
      const conc = m.client_concentration_ratio;
      rows.push({ signal: `${fmtPct(conc)} of inflows from single client — ${conc >= 0.6 ? "high concentration risk" : conc >= 0.4 ? "moderate concentration" : "well diversified"}`, impact: conc >= 0.6 ? "negative" : conc >= 0.4 ? "neutral" : "positive" });
      rows.push({ signal: `${m.revenue_sources_count} distinct revenue source${m.revenue_sources_count !== 1 ? "s" : ""} detected`, impact: m.revenue_sources_count >= 4 ? "positive" : m.revenue_sources_count >= 2 ? "neutral" : "negative" });
      if (m.revenue_growth_rate_3m != null) {
        const g = m.revenue_growth_rate_3m;
        rows.push({ signal: `3-month revenue trend ${g >= 0 ? "+" : ""}${(g * 100).toFixed(1)}% — ${g >= 0.1 ? "strong growth" : g >= 0 ? "slight growth" : "declining"}`, impact: g >= 0.1 ? "positive" : g >= 0 ? "neutral" : "negative" });
      }
      return rows;
    }
    case "cashflow_predictability": {
      const rows: DriverRow[] = [];
      rows.push({ signal: `${fmtPct(m.positive_cashflow_ratio)} of months cashflow-positive — inflows exceeded outflows`, impact: m.positive_cashflow_ratio >= 0.8 ? "positive" : m.positive_cashflow_ratio >= 0.6 ? "neutral" : "negative" });
      rows.push({ signal: `${fmtPct(m.recurring_revenue_ratio)} recurring income ratio — ${m.recurring_revenue_ratio >= 0.5 ? "predictable revenue base" : "limited recurring income"}`, impact: m.recurring_revenue_ratio >= 0.5 ? "positive" : "neutral" });
      rows.push({ signal: `Cashflow volatility ${fmt(m.cashflow_volatility_coefficient, 2)} — ${m.cashflow_volatility_coefficient <= 0.4 ? "stable" : m.cashflow_volatility_coefficient <= 0.7 ? "moderate" : "high"}`, impact: m.cashflow_volatility_coefficient <= 0.4 ? "positive" : m.cashflow_volatility_coefficient <= 0.7 ? "neutral" : "negative" });
      if (m.has_negative_cashflow_streak) rows.push({ signal: "3+ consecutive months of negative net cashflow detected", impact: "negative" });
      if (m.payroll_consistent)            rows.push({ signal: "Consistent payroll cycle detected — operational discipline signal", impact: "positive" });
      return rows;
    }
    case "expense_discipline": {
      const delta = m.expense_growth_vs_revenue_growth_delta;
      return [
        { signal: `OPEX-to-revenue ratio ${fmtPct(m.opex_to_revenue_ratio)} — ${m.opex_to_revenue_ratio <= 0.6 ? "healthy margins" : m.opex_to_revenue_ratio <= 0.8 ? "moderate cost load" : "expenses consuming most revenue"}`, impact: m.opex_to_revenue_ratio <= 0.6 ? "positive" : m.opex_to_revenue_ratio <= 0.8 ? "neutral" : "negative" },
        { signal: delta <= 0 ? `Revenue growing ${fmt(Math.abs(delta) * 100, 1)}% faster than expenses — efficient scaling` : `Expenses growing ${fmt(delta * 100, 1)}% faster than revenue`, impact: delta <= -0.05 ? "positive" : delta <= 0.05 ? "neutral" : "negative" },
      ];
    }
    case "liquidity_strength": {
      const coverage = m.inflow_to_expense_coverage_ratio;
      return [
        { signal: `Avg closing balance ${fmtNgn(m.avg_closing_balance)} — ${m.cash_runway_days >= 90 ? "strong" : m.cash_runway_days >= 30 ? "adequate" : "thin"} cash position`, impact: m.cash_runway_days >= 90 ? "positive" : m.cash_runway_days >= 30 ? "neutral" : "negative" },
        { signal: `Cash runway ${Math.round(m.cash_runway_days)} days if revenue stopped`, impact: m.cash_runway_days >= 90 ? "positive" : m.cash_runway_days >= 30 ? "neutral" : "negative" },
        { signal: `Inflow/expense coverage ${fmt(coverage, 2)}× — ${coverage >= 2 ? "comfortable buffer" : coverage >= 1 ? "adequate" : "inflows barely covering expenses"}`, impact: coverage >= 2 ? "positive" : coverage >= 1 ? "neutral" : "negative" },
        { signal: `Liquidity floor ${fmtNgn(m.liquidity_floor)} — lowest balance recorded`, impact: m.liquidity_floor > 0 ? "positive" : "negative" },
      ];
    }
    case "financial_consistency": {
      const rows: DriverRow[] = [];
      rows.push({ signal: `${fmtPct(m.active_months_ratio)} of months active — ${m.active_months_ratio >= 0.9 ? "continuous trading" : m.active_months_ratio >= 0.7 ? "mostly active" : "notable dormant periods"}`, impact: m.active_months_ratio >= 0.9 ? "positive" : m.active_months_ratio >= 0.7 ? "neutral" : "negative" });
      rows.push({ signal: `${m.months_of_data} months of transaction history`, impact: m.months_of_data >= 12 ? "positive" : m.months_of_data >= 6 ? "neutral" : "negative" });
      if (m.payroll_consistent)               rows.push({ signal: "Consistent payroll cycle — regular operational behaviour", impact: "positive" });
      if (m.has_consistent_supplier_payments) rows.push({ signal: "Consistent supplier payment pattern — reliable obligations management", impact: "positive" });
      return rows;
    }
    case "risk_profile": {
      if (m.active_risk_flags.length === 0) return [
        { signal: "No active risk flags — clean baseline", impact: "positive" },
      ];
      return m.active_risk_flags.slice(0, 5).map(f => ({
        signal: `${f.severity.charAt(0).toUpperCase() + f.severity.slice(1)} flag: ${f.type.replace(/_/g, " ")} (−${Math.abs(f.score_impact)} pts)`,
        impact: f.severity === "critical" || f.severity === "high" ? "negative" : "neutral" as DriverImpact,
      }));
    }
    default: return [];
  }
}

/* ─────────────────────────────────────────────────────────
   RAW METRIC ROWS per dimension (for the data tile grid)
───────────────────────────────────────────────────────── */
type MetricRow = { label: string; value: string; note?: string };

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}
function fmtNgn(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toFixed(0)}`;
}
function fmtPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function getDimMetrics(key: DimKey, m: AggregatedMetricsSnapshot): MetricRow[] {
  switch (key) {
    case "revenue_stability": {
      const months = Object.values(m.monthly_revenue);
      const avg = months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;
      const cv = avg > 0 ? Math.sqrt(months.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / months.length) / avg : 0;
      return [
        { label: "Revenue CV (volatility)", value: fmt(cv, 2), note: "Lower = more stable. >0.5 is high volatility." },
        { label: "Avg monthly revenue",     value: fmtNgn(avg) },
        { label: "Revenue sources",         value: `${m.revenue_sources_count}`, note: "Distinct client/counterparty clusters" },
        { label: "Client concentration",    value: fmtPct(m.client_concentration_ratio), note: "Top client share of total revenue" },
        { label: "3-month growth rate",      value: m.revenue_growth_rate_3m != null ? `${(m.revenue_growth_rate_3m * 100).toFixed(1)}%` : "Insufficient data" },
      ];
    }
    case "cashflow_predictability": {
      return [
        { label: "Positive cashflow months",   value: fmtPct(m.positive_cashflow_ratio), note: "Months where inflows exceeded outflows" },
        { label: "Recurring revenue ratio",     value: fmtPct(m.recurring_revenue_ratio), note: "Predictable, repeating income share" },
        { label: "Cashflow volatility",         value: fmt(m.cashflow_volatility_coefficient, 2), note: "SD ÷ average net cashflow. <0.4 = stable." },
        { label: "Negative cashflow streak",    value: m.has_negative_cashflow_streak ? "Yes — 3+ consecutive months" : "No", note: "3+ consecutive negative net months" },
      ];
    }
    case "expense_discipline": {
      const delta = m.expense_growth_vs_revenue_growth_delta;
      return [
        { label: "OPEX-to-revenue ratio",    value: fmtPct(m.opex_to_revenue_ratio), note: "Operating costs as share of revenue" },
        { label: "Expense vs revenue growth", value: delta >= 0 ? `Expenses growing ${fmt(delta * 100, 1)}% faster` : `Revenue growing ${fmt(Math.abs(delta) * 100, 1)}% faster`, note: "Positive = costs outpacing revenue" },
      ];
    }
    case "liquidity_strength": {
      const coverageMultiple = m.opex_to_revenue_ratio > 0
        ? m.avg_closing_balance / (m.avg_closing_balance * m.opex_to_revenue_ratio || 1)
        : null;
      return [
        { label: "Avg closing balance",        value: fmtNgn(m.avg_closing_balance) },
        { label: "Liquidity floor",             value: fmtNgn(m.liquidity_floor), note: "Lowest balance recorded in the period" },
        { label: "Inflow/expense coverage",    value: fmt(m.inflow_to_expense_coverage_ratio, 2) + "×", note: "Total inflows ÷ fixed operating expenses" },
        { label: "Cash runway",                 value: `${Math.round(m.cash_runway_days)} days`, note: "Days surviving if revenue stopped today" },
      ];
    }
    case "financial_consistency": {
      return [
        { label: "Active months ratio",          value: fmtPct(m.active_months_ratio), note: "Months with at least one transaction" },
        { label: "Total months of data",          value: `${m.months_of_data} months` },
        { label: "Consistent payroll",            value: m.payroll_consistent ? "Detected" : "Not detected" },
        { label: "Consistent supplier payments",  value: m.has_consistent_supplier_payments ? "Detected" : "Not detected" },
      ];
    }
    case "risk_profile": {
      const flags = m.active_risk_flags;
      if (flags.length === 0) return [
        { label: "Active risk flags", value: "None", note: "No anomalous patterns detected" },
      ];
      return flags.slice(0, 5).map(f => ({
        label: f.severity.charAt(0).toUpperCase() + f.severity.slice(1) + " flag",
        value: f.type.replace(/_/g, " "),
        note: `Score impact: −${Math.abs(f.score_impact)} pts`,
      }));
    }
    default: return [];
  }
}

function shapeAnalysis(consent: any, biz: { name?: string; financial_identity_id?: string } | null, score: any, metricsRow: any): BusinessAnalysis {
  const rawDims   = (score?.dimensions ?? {}) as Record<string, any>;
  const computedAt = score?.computed_at ? new Date(score.computed_at) : null;
  const dataMonths = score?.data_months_analyzed ?? 0;

  let coverageStr = "No data";
  if (computedAt && dataMonths > 0) {
    const endDate   = computedAt;
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - (dataMonths - 1));
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
    coverageStr = `${fmt(startDate)} - ${fmt(endDate)}`;
  }

  const expiryRaw = (consent.permissions as Record<string,unknown> | null)?.expires_at as string | undefined;
  const expiryStr = expiryRaw ? new Date(expiryRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  const dimensions: ScoreDimension[] = (Object.keys(DIM_META) as DimKey[]).map(key => {
    const meta   = DIM_META[key];
    const dim    = rawDims[key] ?? {};
    const raw    = typeof dim === "number" ? dim : (dim.raw_score ?? 0);
    const points = Math.round(raw * (meta.maxPoints / 100));
    return {
      key,
      label:     meta.label,
      raw_score: Math.round(raw),
      grade:     dim.grade ?? toGrade(raw),
      signal:    translateSignal(dim.signal ?? "—"),
      signals:   Array.isArray(dim.signals)
        ? dim.signals.map(translateSignal)
        : (dim.signal ? [translateSignal(dim.signal)] : []),
      breakdown: dim.breakdown ?? null,
      trend:     dim.trend ?? "stable",
      color:     meta.color,
      weight:    meta.weight,
      points,
    };
  });

  // Shape aggregated metrics snapshot
  let metrics: AggregatedMetricsSnapshot | null = null;
  if (metricsRow?.metrics) {
    const m = metricsRow.metrics as any;
    metrics = {
      monthly_revenue:               m.monthly_revenue ?? {},
      revenue_growth_rate_3m:        m.revenue_growth_rate_3m ?? null,
      revenue_sources_count:         m.revenue_sources_count ?? 0,
      client_concentration_ratio:    m.client_concentration_ratio ?? 0,
      revenue_diversification_index: m.revenue_diversification_index ?? 0,
      monthly_net_cashflow:          m.monthly_net_cashflow ?? {},
      positive_cashflow_ratio:       m.positive_cashflow_ratio ?? 0,
      cashflow_volatility_coefficient: m.cashflow_volatility_coefficient ?? 0,
      has_negative_cashflow_streak:  m.has_negative_cashflow_streak ?? false,
      recurring_revenue_ratio:       m.recurring_revenue_ratio ?? 0,
      opex_to_revenue_ratio:         m.opex_to_revenue_ratio ?? 0,
      expense_growth_vs_revenue_growth_delta: m.expense_growth_vs_revenue_growth_delta ?? 0,
      avg_closing_balance:           m.avg_closing_balance ?? 0,
      liquidity_floor:               m.liquidity_floor ?? 0,
      inflow_to_expense_coverage_ratio: m.inflow_to_expense_coverage_ratio ?? 0,
      cash_runway_days:              m.cash_runway_days ?? 0,
      active_months_ratio:           m.active_months_ratio ?? 0,
      months_of_data:                m.months_of_data ?? 0,
      payroll_consistent:            m.payroll_consistent ?? false,
      has_consistent_supplier_payments: m.has_consistent_supplier_payments ?? false,
      active_risk_flags:             m.active_risk_flags ?? [],
      debt_service_capacity:         m.debt_service_capacity ?? 0,
      realistic_loan_capacity_range: m.realistic_loan_capacity_range ?? { min_loan_amount: 0, max_loan_amount: 0, min_monthly_installment: 0, max_monthly_installment: 0 },
      withdrawal_pressure_ratio:     m.withdrawal_pressure_ratio ?? 0,
      minimum_monthly_coverage:      m.minimum_monthly_coverage ?? 0,
    };
  }

  return {
    consent_id:         consent.consent_id,
    business_id:        consent.business_id,
    business_name:      biz?.name ?? "",
    anonymized_id:      biz?.financial_identity_id ?? consent.business_id.slice(0, 8).toUpperCase(),
    granted_at:         consent.granted_at,
    consent_expiry:     expiryStr,
    data_months:        dataMonths,
    coverage:           coverageStr,
    composite_score:    score?.composite_score ?? null,
    lender_risk:        score?.lender_risk ?? null,
    data_quality_score: score?.data_quality_score ?? null,
    engine_version:     score?.engine_version ?? null,
    dimensions,
    metrics,
    analysis: (score?.analysis as ScoreAnalysis) ?? null,
  };
}

function TrendBadge({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700, color:"#059669", background:"#ECFDF5", padding:"2px 7px", borderRadius:9999 }}>
      <TrendingUp size={9} /> Improving
    </span>
  );
  if (trend === "declining") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700, color:"#DC2626", background:"#FEF2F2", padding:"2px 7px", borderRadius:9999 }}>
      <TrendingDown size={9} /> Declining
    </span>
  );
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, color:"#9CA3AF", background:"#F3F4F6", padding:"2px 7px", borderRadius:9999 }}>
      <Minus size={9} /> Stable
    </span>
  );
}

function Card({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, ...style }}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   ANALYSIS SUMMARY — underwriting summary + lending signals
───────────────────────────────────────────────────────── */
function AnalysisSummary({ analysis }: { analysis: ScoreAnalysis }) {
  const SIGNAL_COLORS = {
    pass: { bg: "#ECFDF5", color: "#059669", dot: "#10B981", label: "Pass" },
    warn: { bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B", label: "Review" },
    fail: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444", label: "Concern" },
  };

  const CONFIDENCE_COLORS = {
    high:   { color: "#059669", bg: "#ECFDF5", label: "High confidence" },
    medium: { color: "#D97706", bg: "#FFFBEB", label: "Medium confidence" },
    low:    { color: "#DC2626", bg: "#FEF2F2", label: "Low confidence" },
  };

  const conf = CONFIDENCE_COLORS[analysis.confidence];

  return (
    <Card style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>Underwriting Summary</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: conf.color, background: conf.bg, padding: "3px 9px", borderRadius: 9999 }}>
            {conf.label}
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#1F2937", lineHeight: 1.75 }}>{analysis.underwriting_summary}</p>
        {analysis.confidence_reasons.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column" as const, gap: 4 }}>
            {analysis.confidence_reasons.map((r, i) => (
              <p key={i} style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{r}</p>
            ))}
          </div>
        )}
      </div>

      {/* Lending signals checklist */}
      <div style={{ padding: "14px 22px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 12 }}>Lending Signals</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
          {analysis.lending_signals.map((sig, i) => {
            const c = SIGNAL_COLORS[sig.status];
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: c.bg, border: `1px solid ${c.dot}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 2 }}>{sig.label}</p>
                  <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{sig.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   DIMENSION CARD
───────────────────────────────────────────────────────── */
function DimensionCard({ dim, metrics }: { dim: ScoreDimension; metrics: AggregatedMetricsSnapshot | null }) {
  const [expanded, setExpanded] = useState(false);
  const meta      = DIM_META[dim.key];
  const grade     = GRADE_META[dim.grade] ?? GRADE_META["F"];
  const breakdown = dim.breakdown;
  const rawMetrics: MetricRow[] = metrics ? getDimMetrics(dim.key, metrics) : [];
  const drivers:    DriverRow[]  = metrics ? getDimDrivers(dim.key, metrics) : [];

  return (
    <Card style={{ overflow:"hidden" }}>
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width:"100%", padding:"16px 20px", display:"flex", alignItems:"center", gap:14, background:"none", border:"none", cursor:"pointer", textAlign:"left" as const }}
      >
        <div style={{ width:56, height:56, borderRadius:12, flexShrink:0, background:grade.bg, border:`2px solid ${dim.color}20`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:20, color:dim.color, lineHeight:1, letterSpacing:"-0.04em" }}>{dim.raw_score}</span>
          <span style={{ fontSize:9, fontWeight:700, color:dim.color, letterSpacing:"0.04em" }}>/100</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" as const }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540", letterSpacing:"-0.01em" }}>{dim.label}</p>
            <span style={{ fontSize:10, fontWeight:700, color:grade.color, background:grade.bg, padding:"2px 7px", borderRadius:5 }}>
              Grade {dim.grade} — {grade.label}
            </span>
            <TrendBadge trend={dim.trend} />
          </div>
          <div style={{ height:5, borderRadius:9999, background:"#F3F4F6", overflow:"hidden", marginBottom:5 }}>
            <div style={{ height:"100%", width:`${dim.raw_score}%`, background:dim.color, borderRadius:9999, transition:"width 0.4s ease" }} />
          </div>
          <p style={{ fontSize:12, color:"#6B7280" }}>{dim.signal}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#0A2540" }}>{dim.weight}% weight</span>
          <span style={{ fontSize:11, color:"#9CA3AF" }}>{dim.points} / {meta.maxPoints} pts</span>
          <ChevronRight size={14} style={{ color:"#9CA3AF", transform: expanded ? "rotate(90deg)" : "none", transition:"transform 0.15s" }} />
        </div>
      </button>

      {/* Expanded analyst panel */}
      {expanded && (
        <div style={{ borderTop:"1px solid #F3F4F6" }}>

          {/* ── Score drivers table ── */}
          {drivers.length > 0 && (
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #F3F4F6" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:10 }}>Score drivers</p>
              <table style={{ width:"100%", borderCollapse:"collapse" as const }}>
                <tbody>
                  {drivers.map((d, i) => (
                    <tr key={i} style={{ borderBottom: i < drivers.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                      <td style={{ padding:"7px 0", fontSize:13, color:"#374151", lineHeight:1.5, paddingRight:12 }}>{d.signal}</td>
                      <td style={{ padding:"7px 0", whiteSpace:"nowrap" as const, textAlign:"right" as const }}>
                        <span style={{
                          fontSize:10, fontWeight:700, letterSpacing:"0.04em", padding:"2px 8px", borderRadius:5,
                          background: d.impact === "positive" ? "#ECFDF5" : d.impact === "negative" ? "#FEF2F2" : "#F3F4F6",
                          color:      d.impact === "positive" ? "#059669" : d.impact === "negative" ? "#DC2626" : "#6B7280",
                        }}>
                          {d.impact === "positive" ? "Positive" : d.impact === "negative" ? "Negative" : "Neutral"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Lending narrative (why this score) ── */}
          {(breakdown?.lending || dim.signals.length > 0) && (
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6", background: dim.raw_score >= 65 ? "#F0FDF4" : dim.raw_score >= 50 ? "#FFFBEB" : "#FFF7F7" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:6 }}>Why this score</p>
              <p style={{ fontSize:13, color:"#1F2937", lineHeight:1.75 }}>
                {breakdown?.lending ?? dim.signals.join(" ")}
              </p>
            </div>
          )}

          {/* ── What we observed (observed[] list, only when breakdown exists) ── */}
          {breakdown?.observed && breakdown.observed.length > 0 && (
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:10 }}>What the data shows</p>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:7 }}>
                {breakdown.observed.map((obs, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background: i === 0 ? dim.color : "#D1D5DB", flexShrink:0, marginTop:6 }} />
                    <p style={{ fontSize:13, color: i === 0 ? "#111827" : "#374151", fontWeight: i === 0 ? 500 : 400, lineHeight:1.6 }}>{obs}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── What to watch ── */}
          {breakdown?.watch && (
            <div style={{ padding:"14px 20px", borderBottom: rawMetrics.length > 0 ? "1px solid #F3F4F6" : "none" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:6 }}>What to watch</p>
              <p style={{ fontSize:13, color:"#374151", lineHeight:1.7 }}>{breakdown.watch}</p>
            </div>
          )}

          {/* ── Raw metrics tiles ── */}
          {rawMetrics.length > 0 && (
            <div style={{ padding:"14px 20px", background:"#FAFAFA" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:10 }}>Derived metrics</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))", gap:8 }}>
                {rawMetrics.map((row, i) => (
                  <div key={i} style={{ padding:"8px 10px", background:"white", borderRadius:8, border:"1px solid #E5E7EB" }}>
                    <p style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>{row.label}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:"#0A2540", letterSpacing:"-0.01em" }}>{row.value}</p>
                    {row.note && <p style={{ fontSize:10, color:"#9CA3AF", marginTop:2, lineHeight:1.4 }}>{row.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Fallback when no metrics or breakdown yet ── */}
          {drivers.length === 0 && rawMetrics.length === 0 && !breakdown && (
            <div style={{ padding:"14px 20px" }}>
              <p style={{ fontSize:11, color:"#9CA3AF" }}>Full breakdown available after next pipeline run.</p>
            </div>
          )}

        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   BUSINESS PICKER — search-driven, scales to 1000s
───────────────────────────────────────────────────────── */
function BusinessPicker({ list, selected, onSelect }: {
  list: BusinessAnalysis[];
  selected: BusinessAnalysis;
  onSelect: (b: BusinessAnalysis) => void;
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = selected.business_name || `BIZ-${selected.anonymized_id.slice(0, 6).toUpperCase()}`;

  const filtered = query.trim()
    ? list.filter(b =>
        (b.business_name || "").toLowerCase().includes(query.toLowerCase())
      )
    : list;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position:"relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border: open ? "1px solid #0A2540" : "1px solid #E5E7EB", background:"white", cursor:"pointer", minWidth: 220 }}
      >
        <div style={{ width:30, height:30, borderRadius:7, background:"#0A2540", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Building2 size={13} color="#00D4FF" />
        </div>
        <div style={{ textAlign:"left" as const, flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:700, color:"#0A2540", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{displayName}</p>
          <p style={{ fontSize:11, color:"#9CA3AF" }}>{selected.data_months}mo data · consent {selected.granted_at ? new Date(selected.granted_at).toLocaleDateString("en-GB", { month:"short", year:"numeric"}) : "—"}</p>
        </div>
        <ChevronDown size={14} style={{ color:"#9CA3AF", flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform 0.15s" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:100, background:"white", border:"1px solid #E5E7EB", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", width:320, overflow:"hidden" }}>

          {/* Search input */}
          <div style={{ padding:"10px 12px", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#F9FAFB" }}>
              <Search size={12} style={{ color:"#9CA3AF", flexShrink:0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by business name…"
                style={{ flex:1, border:"none", background:"transparent", fontSize:13, color:"#0A2540", outline:"none" }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", display:"flex", padding:0 }}>
                  <X size={11} />
                </button>
              )}
            </div>
            <p style={{ fontSize:10, color:"#9CA3AF", marginTop:6 }}>
              {filtered.length} of {list.length} consented {list.length === 1 ? "business" : "businesses"}
            </p>
          </div>

          {/* Results */}
          <div style={{ maxHeight:320, overflowY:"auto" as const }}>
            {filtered.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center" as const }}>
                <p style={{ fontSize:13, color:"#9CA3AF" }}>No businesses match "{query}"</p>
              </div>
            ) : (
              filtered.map(b => {
                const name = b.business_name || `BIZ-${b.anonymized_id.slice(0,6).toUpperCase()}`;
                const isSelected = b.consent_id === selected.consent_id;
                return (
                  <button
                    key={b.consent_id}
                    onClick={() => { onSelect(b); setOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px", background: isSelected ? "#F5F7FA" : "white", border:"none", cursor:"pointer", textAlign:"left" as const, borderBottom:"1px solid #F3F4F6" }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "white"; }}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background: isSelected ? "#0A2540" : "#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Building2 size={14} color={isSelected ? "#00D4FF" : "#9CA3AF"} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight: isSelected ? 700 : 500, color:"#0A2540", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{name}</p>
                      <p style={{ fontSize:11, color:"#9CA3AF" }}>{b.data_months}mo data {b.consent_expiry ? `· expires ${b.consent_expiry}` : ""}</p>
                    </div>
                    {isSelected && <ShieldCheck size={13} style={{ color:"#10B981", flexShrink:0 }} />}
                  </button>
                );
              })
            )}
          </div>

          <div style={{ padding:"10px 14px", borderTop:"1px solid #F3F4F6" }}>
            <Link href="/financer/businesses" style={{ fontSize:12, fontWeight:600, color:"#0A2540", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
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
  const { user } = useSession();

  const [businesses, setBusinesses] = useState<BusinessAnalysis[]>([]);
  const [selected,   setSelected]   = useState<BusinessAnalysis | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      const instId = await getMyInstitutionId(user.id);

      if (!instId) { setError("No institution found."); setLoading(false); return; }

      // Load consented businesses
      const { data: consents, error: cErr } = await supabase
        .from("consent_records")
        .select("consent_id, business_id, granted_at, is_active, permissions")
        .eq("institution_id", instId)
        .eq("is_active", true)
        .order("granted_at", { ascending: false });

      if (cErr) { setError(cErr.message); setLoading(false); return; }
      if (!consents?.length) { setBusinesses([]); setLoading(false); return; }

      // Fetch business names + anonymized IDs separately
      const businessIds = consents.map((c: any) => c.business_id).filter(Boolean);
      let bizMap: Record<string, { name: string; financial_identity_id: string }> = {};
      if (businessIds.length > 0) {
        const { data: bizRows } = await supabase
          .from("businesses")
          .select("business_id, name, financial_identity_id")
          .in("business_id", businessIds);
        (bizRows ?? []).forEach((b: any) => { bizMap[b.business_id] = b; });
      }

      // Batch-fetch latest scores from creditlinker_scores
      const { data: scores } = await supabase
        .from("creditlinker_scores")
        .select("business_id, composite_score, lender_risk, data_quality_score, data_months_analyzed, dimensions, analysis, computed_at")
        .in("business_id", businessIds)
        .order("computed_at", { ascending: false });

      // Keep only the latest score per business
      const scoreMap: Record<string, any> = {};
      (scores ?? []).forEach((s: any) => {
        if (!scoreMap[s.business_id]) scoreMap[s.business_id] = s;
      });

      // Batch-fetch latest aggregated_metrics per business
      const { data: metricsRows } = await supabase
        .from("aggregated_metrics")
        .select("business_id, metrics, computed_at")
        .in("business_id", businessIds)
        .order("computed_at", { ascending: false });

      const metricsMap: Record<string, any> = {};
      (metricsRows ?? []).forEach((m: any) => {
        if (!metricsMap[m.business_id]) metricsMap[m.business_id] = m;
      });

      const shaped: BusinessAnalysis[] = consents.map((c: any) => {
        const biz = bizMap[c.business_id];
        return shapeAnalysis(
          {
            consent_id:    c.consent_id,
            business_id:   c.business_id,
            granted_at:    c.granted_at,
            permissions:   c.permissions,
          },
          biz ?? null,
          scoreMap[c.business_id] ?? null,
          metricsMap[c.business_id] ?? null,
        );
      });

      setBusinesses(shaped);
      if (shaped.length > 0) setSelected(shaped[0]);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div style={{ padding:"80px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <Loader2 size={28} style={{ color:"#D1D5DB", animation:"spin 1s linear infinite" }} />
      <p style={{ fontSize:13, color:"#9CA3AF" }}>Loading financial analysis…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding:"14px 18px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", fontSize:13, color:"#B91C1C" }}>{error}</div>
  );

  if (businesses.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em" }}>Financial Analysis</h2>
      <div style={{ padding:"60px 24px", textAlign:"center" as const, background:"white", borderRadius:14, border:"1px solid #E5E7EB" }}>
        <Building2 size={32} style={{ color:"#E5E7EB", marginBottom:12 }} />
        <p style={{ fontSize:14, fontWeight:600, color:"#0A2540", marginBottom:4 }}>No consented businesses</p>
        <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:16 }}>
          Financial analysis is available only for businesses that have granted your institution consent.
        </p>
        <Link href="/financer/businesses" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:8, background:"#0A2540", color:"white", fontSize:13, fontWeight:600, textDecoration:"none" }}>
          Browse businesses <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );

  const biz = selected!;
  const displayName = biz.business_name || `BIZ-${biz.anonymized_id.slice(0,6).toUpperCase()}`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" as const }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em", marginBottom:4 }}>
            Financial Analysis
          </h2>
          <p style={{ fontSize:13, color:"#6B7280" }}>
            {biz.data_months > 0 ? `${biz.data_months} months of verified data` : "No financial data yet"} · {biz.coverage}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BusinessPicker list={businesses} selected={biz} onSelect={setSelected} />
          <Link href={`/financer/business-profile?id=${biz.anonymized_id}`} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderRadius:9, background:"#0A2540", color:"white", fontSize:13, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" as const }}>
            Full Identity <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* Consent notice */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(0,212,255,0.04)", border:"1px solid rgba(0,212,255,0.15)", borderRadius:10 }}>
        <ShieldCheck size={13} style={{ color:"#00A8CC" }} />
        <p style={{ fontSize:12, color:"#0A5060" }}>
          Viewing financial analysis for <strong>{displayName}</strong> under active consent.
          {biz.consent_expiry && <> Access expires <strong>{biz.consent_expiry}</strong>.</>}
        </p>
      </div>

      {biz.data_months === 0 ? (
        <div style={{ padding:"48px 24px", textAlign:"center" as const, background:"white", borderRadius:14, border:"1px solid #E5E7EB" }}>
          <Info size={28} style={{ color:"#D1D5DB", marginBottom:12 }} />
          <p style={{ fontSize:14, fontWeight:600, color:"#0A2540", marginBottom:4 }}>No financial data yet</p>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>
            This business has granted consent but their financial identity snapshot hasn't been generated yet.
          </p>
        </div>
      ) : (
        <>
          {/* Composite score summary row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14 }}>
            <Card style={{ padding:"20px 22px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.04em", textTransform:"uppercase" as const, marginBottom:6 }}>Composite Score</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:32, color:"#0A2540", letterSpacing:"-0.04em", lineHeight:1, marginBottom:4 }}>
                {biz.composite_score ?? "—"}
              </p>
              <p style={{ fontSize:12, color:"#6B7280" }}>out of 1000</p>
            </Card>
            <Card style={{ padding:"20px 22px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.04em", textTransform:"uppercase" as const, marginBottom:6 }}>Lender Risk</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:20, color: riskColor(biz.lender_risk), letterSpacing:"-0.02em", lineHeight:1, marginBottom:4 }}>
                {riskLabel(biz.lender_risk)}
              </p>
              <p style={{ fontSize:12, color:"#6B7280" }}>classification</p>
            </Card>
            <Card style={{ padding:"20px 22px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.04em", textTransform:"uppercase" as const, marginBottom:6 }}>Data Quality</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:32, color:"#0A2540", letterSpacing:"-0.04em", lineHeight:1, marginBottom:4 }}>
                {biz.data_quality_score ?? "—"}
              </p>
              <p style={{ fontSize:12, color:"#6B7280" }}>/ 100</p>
            </Card>
            <Card style={{ padding:"20px 22px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.04em", textTransform:"uppercase" as const, marginBottom:6 }}>Data Coverage</p>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:18, color:"#0A2540", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:4 }}>
                {biz.coverage}
              </p>
              <p style={{ fontSize:12, color:"#6B7280" }}>{biz.data_months} months</p>
            </Card>
          </div>

          {/* Dimension breakdown cards */}
          <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
            {biz.dimensions.map(d => (
              <DimensionCard key={d.key} dim={d} metrics={biz.metrics} />
            ))}
          </div>
        </>
      )}

      {/* Data provenance note */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"12px 16px", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:10 }}>
        <Info size={13} style={{ color:"#9CA3AF", flexShrink:0, marginTop:1 }} />
        <p style={{ fontSize:12, color:"#6B7280", lineHeight:1.6 }}>
          All metrics are derived from verified bank transaction data ingested via Creditlinker's financial identity pipeline.
          Full provenance is available on the{" "}
          <Link href={`/financer/business-profile?id=${biz.anonymized_id}`} style={{ color:"#0A2540", fontWeight:600 }}>financial identity page</Link>.
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
