"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Banknote, CheckCircle2, Clock, XCircle, ChevronRight,
  ArrowUpRight, AlertCircle, Building2, Filter,
  TrendingUp, ShieldCheck, Landmark, X, Lightbulb,
  CircleCheck, CircleMinus, CircleX, Info, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with:
     GET /business/financing          → FinancingRecord[]
     GET /business/readiness          → ReadinessAssessment[]
     GET /business/discovery/requests → ConsentRequest[]
───────────────────────────────────────────────────────── */
type CriterionResult = "pass" | "partial" | "fail";

interface AssessmentCriterion {
  label: string;            // e.g. "Revenue consistency"
  result: CriterionResult;
  weight: "high" | "medium" | "low"; // how much this criterion affects the score
  your_value: string;       // e.g. "₦820K avg/month"
  required_value: string;   // e.g. "₦500K minimum"
  note: string;             // plain-language explanation
}

interface ReadinessItem {
  capital_category: string;
  label: string;
  readiness_score: number;
  status: "eligible" | "conditional" | "not_ready";
  amount_range: string;
  definition: string;       // plain-english explanation of what this product is
  summary: string;          // one-line verdict
  criteria: AssessmentCriterion[];
  how_to_improve?: string;  // shown for conditional / not_ready
}

const READINESS: ReadinessItem[] = [
  {
    capital_category: "working_capital_loan",
    label: "Working Capital Loan",
    readiness_score: 88,
    status: "eligible",
    amount_range: "₦5M – ₦50M",
    definition: "Short-term loan for stock, salaries and supplier payments.",
    summary: "Your revenue consistency, cash flow, and repayment track record all meet lender thresholds for working capital facilities.",
    criteria: [
      { label: "Revenue consistency",       result: "pass",    weight: "high",   your_value: "₦820K avg/month",  required_value: "₦500K minimum",   note: "12-month average monthly revenue is well above typical lender minimums." },
      { label: "Positive cash flow",        result: "pass",    weight: "high",   your_value: "Positive 9/12 months", required_value: "Positive 6/12",  note: "Cash flow is positive in 9 of the last 12 months, meeting lender requirements." },
      { label: "Revenue stability",         result: "pass",    weight: "high",   your_value: "Score: 85/100",    required_value: "Score: 60 minimum", note: "Revenue stability dimension is strong, showing predictable inflow patterns." },
      { label: "Expense discipline",        result: "pass",    weight: "medium", your_value: "Score: 81/100",    required_value: "Score: 55 minimum", note: "Operating costs are well-controlled relative to revenue." },
      { label: "Data coverage",             result: "pass",    weight: "medium", your_value: "24 months",        required_value: "6 months minimum",  note: "24 months of transaction history gives lenders strong confidence in the assessment." },
      { label: "No active disputes",        result: "pass",    weight: "medium", your_value: "0 active disputes", required_value: "0 required",       note: "No open financing disputes on record." },
      { label: "Concentration risk",        result: "partial", weight: "low",    your_value: "62% single client", required_value: "Below 50% preferred", note: "Over 60% of revenue comes from one counterparty cluster. This is flagged but does not disqualify." },
    ],
  },
  {
    capital_category: "invoice_financing",
    label: "Invoice Financing",
    readiness_score: 82,
    status: "eligible",
    amount_range: "₦500K – ₦20M",
    definition: "Get paid upfront on invoices; the financier collects from your client.",
    summary: "You have active client contracts and consistent receivables patterns. Your invoicing profile is strong enough for invoice financing.",
    criteria: [
      { label: "Active client contracts",   result: "pass",    weight: "high",   your_value: "2 active contracts",  required_value: "1 minimum",          note: "Jumia Food and Lagos State Canteen contracts verified in your profile." },
      { label: "Regular inbound payments",  result: "pass",    weight: "high",   your_value: "Weekly cadence",      required_value: "Monthly minimum",    note: "Transaction data shows regular inbound payments from known counterparties." },
      { label: "Invoice-backed revenue",    result: "pass",    weight: "high",   your_value: "₦1.47M/month avg",   required_value: "₦300K minimum",      note: "Monthly contract revenue well above typical invoice financing floor." },
      { label: "Counterparty reliability",  result: "pass",    weight: "medium", your_value: "2 verified clients", required_value: "1 verified minimum", note: "Counterparty clusters confirmed from transaction history." },
      { label: "Concentration risk",        result: "partial", weight: "medium", your_value: "62% single client", required_value: "Below 50% preferred", note: "High client concentration affects the facility cap but not eligibility." },
      { label: "Outstanding receivables",   result: "partial", weight: "low",    your_value: "₦620K overdue",     required_value: "No overdue preferred", note: "One overdue receivable from Lagos State Canteen. Does not disqualify but reduces offer size." },
    ],
  },
  {
    capital_category: "revenue_advance",
    label: "Revenue Advance",
    readiness_score: 79,
    status: "eligible",
    amount_range: "₦1M – ₦10M",
    definition: "Cash now, repaid as a cut of your future monthly revenue.",
    summary: "Revenue advance providers look for predictable monthly revenue. Your patterns qualify, though liquidity buffers are thinner than ideal.",
    criteria: [
      { label: "Monthly revenue predictability", result: "pass",    weight: "high",   your_value: "Score: 78/100",   required_value: "Score: 60 minimum", note: "Cashflow predictability score is above the threshold for most revenue advance products." },
      { label: "Minimum monthly revenue",        result: "pass",    weight: "high",   your_value: "₦820K avg",       required_value: "₦400K minimum",     note: "Average monthly revenue comfortably meets the minimum for advance sizing." },
      { label: "Revenue trend",                  result: "pass",    weight: "medium", your_value: "Stable to growing", required_value: "Not declining",    note: "Revenue shows a stable pattern with no sustained downward trend." },
      { label: "Liquidity buffer",               result: "partial", weight: "medium", your_value: "Score: 74/100",   required_value: "Score: 75 preferred", note: "Liquidity strength is just below the preferred threshold. Advance provider may apply a small discount." },
      { label: "Operating history",              result: "pass",    weight: "low",    your_value: "24 months",       required_value: "6 months minimum",  note: "Sufficient operating history for advance providers to assess repayment capacity." },
    ],
  },
  {
    capital_category: "equipment_financing",
    label: "Equipment Financing",
    readiness_score: 61,
    status: "conditional",
    amount_range: "₦2M – ₦30M",
    definition: "Loan to buy machinery or vehicles, using the equipment as collateral.",
    summary: "You meet the revenue requirements but equipment assets are self-reported without valuations. Verified asset documentation would unlock full eligibility.",
    how_to_improve: "Upload purchase invoices or recent valuations for your equipment at /documents. Once verified, your readiness score should increase to the eligible range.",
    criteria: [
      { label: "Equipment asset records",   result: "partial", weight: "high",   your_value: "Self-reported only", required_value: "Verified preferred", note: "Equipment is declared in your profile but not backed by purchase invoices or valuations." },
      { label: "Revenue to service debt",   result: "pass",    weight: "high",   your_value: "₦820K avg/month",  required_value: "₦300K minimum",      note: "Monthly revenue is sufficient to service typical equipment financing repayments." },
      { label: "Business operating age",    result: "pass",    weight: "medium", your_value: "2 years",          required_value: "1 year minimum",     note: "Operating history meets most equipment lender requirements." },
      { label: "Asset type eligibility",    result: "pass",    weight: "medium", your_value: "Industrial equipment", required_value: "Productive asset", note: "Bread oven, mixer, and delivery van are all productive business assets eligible for financing." },
      { label: "Expense discipline",        result: "pass",    weight: "medium", your_value: "Score: 81/100",    required_value: "Score: 55 minimum", note: "Good expense control supports the ability to manage structured repayments." },
      { label: "Liquidity strength",        result: "partial", weight: "low",    your_value: "Score: 74/100",   required_value: "Score: 80 preferred", note: "Liquidity is slightly below what equipment lenders prefer for larger facilities." },
    ],
  },
  {
    capital_category: "overdraft_facility",
    label: "Overdraft Facility",
    readiness_score: 55,
    status: "conditional",
    amount_range: "₦500K – ₦5M",
    definition: "Spend beyond your balance when needed; repay as cash comes in.",
    summary: "Overdraft facilities require a strong banking relationship and liquidity history. Your score is within range but cash reserve patterns need strengthening.",
    how_to_improve: "Maintain a positive average daily balance for at least 3 consecutive months and reduce the frequency of low-balance periods. This directly improves your Liquidity Strength dimension.",
    criteria: [
      { label: "Account balance consistency", result: "partial", weight: "high",   your_value: "Moderate volatility", required_value: "Low volatility preferred", note: "Balance history shows moderate swings. Overdraft providers prefer accounts with stable positive balances." },
      { label: "Liquidity strength",          result: "partial", weight: "high",   your_value: "Score: 74/100",   required_value: "Score: 80 preferred",     note: "Your liquidity score is below what most overdraft providers require for unsecured facilities." },
      { label: "Revenue consistency",         result: "pass",    weight: "medium", your_value: "Score: 85/100",   required_value: "Score: 60 minimum",      note: "Strong revenue consistency improves the case for an overdraft, even with moderate liquidity." },
      { label: "Transaction regularity",      result: "pass",    weight: "medium", your_value: "Daily activity",  required_value: "Weekly minimum",          note: "Account shows active daily transaction patterns which is favourable." },
      { label: "Low-balance occurrences",     result: "partial", weight: "medium", your_value: "4 in last 6 months", required_value: "2 or fewer preferred",  note: "Four low-balance days in the past 6 months is above the preferred threshold." },
    ],
  },
  {
    capital_category: "term_loan",
    label: "Term Loan",
    readiness_score: 38,
    status: "not_ready",
    amount_range: "₦10M – ₦100M",
    definition: "Lump sum repaid in fixed monthly instalments over 1–5 years.",
    summary: "Term loans from commercial banks require stronger liquidity, lower concentration risk, and verified documentation. Several key criteria are not yet met.",
    how_to_improve: "Focus on three things: (1) Upload CAC documents and verified financials to improve your data quality score. (2) Reduce revenue concentration below 50% by growing a second major client. (3) Maintain higher average balances for 6+ months to improve your liquidity score above 80.",
    criteria: [
      { label: "Liquidity strength",        result: "fail",    weight: "high",   your_value: "Score: 74/100",      required_value: "Score: 85 minimum",    note: "Term loan providers require significantly stronger liquidity buffers. Your current score is 11 points below threshold." },
      { label: "Concentration risk",        result: "fail",    weight: "high",   your_value: "62% single client",  required_value: "Below 40% required",   note: "Revenue concentration above 60% is a hard disqualifier for most commercial bank term loans." },
      { label: "Verified financials",       result: "partial", weight: "high",   your_value: "Bank data only",     required_value: "Audited accounts preferred", note: "Commercial banks typically require at least 2 years of audited financial statements or management accounts." },
      { label: "Revenue size",              result: "partial", weight: "medium", your_value: "₦820K avg/month",   required_value: "₦2M+ preferred",       note: "Average monthly revenue is below the range most commercial banks consider for term loans above ₦10M." },
      { label: "CAC registration",          result: "pass",    weight: "medium", your_value: "RC-1234567",         required_value: "Required",             note: "Business is CAC registered. This is a basic requirement that is met." },
      { label: "Operating history",         result: "pass",    weight: "medium", your_value: "2 years",           required_value: "2 years minimum",      note: "Operating history meets the minimum requirement." },
      { label: "Financial consistency",     result: "pass",    weight: "low",    your_value: "Score: 80/100",     required_value: "Score: 60 minimum",    note: "Good financial consistency score. This is a positive signal even if other criteria are not met." },
    ],
  },
];

const MARKETPLACE = [
  {
    institution_id: "inst_001",
    name: "Stanbic IBTC",
    type: "Commercial Bank",
    capital_category: "working_capital_loan",
    label: "Working Capital Loan",
    amount_range: "₦5M – ₦50M",
    rate: "18% – 24% p.a.",
    tenure: "6 – 24 months",
    match_score: 94,
    turnaround: "3 – 5 business days",
    consent_requested: false,
  },
  {
    institution_id: "inst_002",
    name: "Lapo Microfinance",
    type: "Microfinance Bank",
    capital_category: "revenue_advance",
    label: "Revenue Advance",
    amount_range: "₦500K – ₦5M",
    rate: "4% – 8% flat",
    tenure: "3 – 12 months",
    match_score: 87,
    turnaround: "24 – 48 hours",
    consent_requested: true,
  },
  {
    institution_id: "inst_003",
    name: "Coronation Merchant Bank",
    type: "Merchant Bank",
    capital_category: "invoice_financing",
    label: "Invoice Financing",
    amount_range: "₦1M – ₦20M",
    rate: "2% – 4% per invoice",
    tenure: "30 – 90 days",
    match_score: 81,
    turnaround: "1 – 2 business days",
    consent_requested: false,
  },
  {
    institution_id: "inst_004",
    name: "Wema Bank",
    type: "Commercial Bank",
    capital_category: "working_capital_loan",
    label: "Working Capital Loan",
    amount_range: "₦2M – ₦20M",
    rate: "20% – 26% p.a.",
    tenure: "6 – 18 months",
    match_score: 76,
    turnaround: "5 – 7 business days",
    consent_requested: false,
  },
];

const ACTIVE_FINANCING = [
  {
    financing_id: "fin_001",
    institution: "Lapo Microfinance",
    capital_category: "Revenue Advance",
    amount: 3500000,
    status: "active" as const,
    granted_at: "Nov 15, 2024",
    terms: { rate: "5% flat", tenure: "6 months", due: "May 15, 2025" },
  },
];

const CAPITAL_FILTERS = ["All", "Working Capital", "Invoice", "Revenue", "Equipment"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${(n / 1_000).toFixed(0)}K`;
}

function readinessColor(score: number) {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function statusConfig(status: "active" | "settled" | "disputed" | "withdrawn") {
  return {
    active:    { variant: "success"     as const, label: "Active"    },
    settled:   { variant: "outline"     as const, label: "Settled"   },
    disputed:  { variant: "destructive" as const, label: "Disputed"  },
    withdrawn: { variant: "secondary"   as const, label: "Withdrawn" },
  }[status];
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

function SectionHeader({ title, sub, action }: {
  title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between", padding: "20px 24px 0", gap: 12,
    }}>
      <div>
        <p style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em",
          marginBottom: sub ? 3 : 0,
        }}>
          {title}
        </p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ASSESSMENT DRAWER
───────────────────────────────────────────────────────── */
function criterionIcon(result: CriterionResult) {
  if (result === "pass")    return <CircleCheck size={15} style={{ color: "#10B981", flexShrink: 0 }} />;
  if (result === "partial") return <CircleMinus size={15} style={{ color: "#F59E0B", flexShrink: 0 }} />;
  return                           <CircleX     size={15} style={{ color: "#EF4444", flexShrink: 0 }} />;
}

function weightLabel(w: string) {
  if (w === "high")   return { label: "High weight",   color: "#EF4444", bg: "#FEF2F2" };
  if (w === "medium") return { label: "Medium weight", color: "#F59E0B", bg: "#FFFBEB" };
  return                     { label: "Low weight",    color: "#9CA3AF", bg: "#F3F4F6" };
}

function AssessmentDrawer({ item, onClose }: { item: ReadinessItem; onClose: () => void }) {
  const color = readinessColor(item.readiness_score);
  const r = 32; const circ = 2 * Math.PI * r;
  const dash = circ * (item.readiness_score / 100);
  const passCount    = item.criteria.filter(c => c.result === "pass").length;
  const partialCount = item.criteria.filter(c => c.result === "partial").length;
  const failCount    = item.criteria.filter(c => c.result === "fail").length;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(520px, 100vw)", background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflowY: "auto" as const }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", letterSpacing: "-0.02em" }}>{item.label}</p>
                <Badge variant={item.status === "eligible" ? "success" : item.status === "conditional" ? "warning" : "destructive"} style={{ fontSize: 10 }}>
                  {item.status === "eligible" ? "Eligible" : item.status === "conditional" ? "Conditional" : "Not Ready"}
                </Badge>
              </div>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Readiness assessment · {item.amount_range}</p>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, maxWidth: 360 }}>{item.definition}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4, flexShrink: 0 }}><X size={16} /></button>
          </div>
        </div>

        {/* Score + summary */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 20, alignItems: "center" }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
            <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} transform="rotate(-90 40 40)" />
            <text x="40" y="36" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0A2540" fontFamily="var(--font-display)">{item.readiness_score}</text>
            <text x="40" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9CA3AF" fontFamily="var(--font-display)">/ 100</text>
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginBottom: 12 }}>{item.summary}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {passCount > 0    && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "3px 9px", borderRadius: 9999 }}><CircleCheck size={10} /> {passCount} passed</span>}
              {partialCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#F59E0B", background: "#FFFBEB", padding: "3px 9px", borderRadius: 9999 }}><CircleMinus size={10} /> {partialCount} partial</span>}
              {failCount > 0    && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#EF4444", background: "#FEF2F2", padding: "3px 9px", borderRadius: 9999 }}><CircleX size={10} /> {failCount} failed</span>}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 14 }}>Criteria breakdown</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {item.criteria.map((c, i) => {
              const wl = weightLabel(c.weight);
              const borderColor = c.result === "pass" ? "#D1FAE5" : c.result === "partial" ? "#FEF3C7" : "#FEE2E2";
              const bg          = c.result === "pass" ? "#F0FDF4" : c.result === "partial" ? "#FFFBEB" : "#FEF2F2";
              return (
                <div key={i} style={{ border: `1px solid ${borderColor}`, borderRadius: 10, overflow: "hidden", background: bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${borderColor}` }}>
                    {criterionIcon(c.result)}
                    <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.label}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: wl.color, background: wl.bg, padding: "2px 7px", borderRadius: 9999, flexShrink: 0 }}>{wl.label}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${borderColor}` }}>
                    <div style={{ padding: "10px 14px", borderRight: `1px solid ${borderColor}` }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>Your value</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.your_value}</p>
                    </div>
                    <div style={{ padding: "10px 14px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>Required</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>{c.required_value}</p>
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{c.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to improve */}
        {item.how_to_improve && (
          <div style={{ padding: "0 24px 24px", flexShrink: 0 }}>
            <div style={{ background: "#0A2540", borderRadius: 12, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lightbulb size={14} color="#00D4FF" />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#00D4FF", marginBottom: 4 }}>How to improve your readiness</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{item.how_to_improve}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   READINESS CARD
───────────────────────────────────────────────────────── */
function ReadinessCard({ item, onClick }: { item: ReadinessItem; onClick: () => void }) {
  const color = readinessColor(item.readiness_score);
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = circ * (item.readiness_score / 100);
  const passCount    = item.criteria.filter(c => c.result === "pass").length;
  const partialCount = item.criteria.filter(c => c.result === "partial").length;
  const failCount    = item.criteria.filter(c => c.result === "fail").length;

  return (
    <div
      onClick={onClick}
      style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(10,37,64,0.07)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="#F3F4F6" strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} transform="rotate(-90 26 26)" />
        <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill={color} fontFamily="var(--font-display)">{item.readiness_score}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", marginBottom: 3 }}>{item.label}</p>
        <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, marginBottom: 8 }}>{item.definition}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
          <Badge variant={item.status === "eligible" ? "success" : item.status === "conditional" ? "warning" : "destructive"} style={{ fontSize: 10 }}>
            {item.status === "eligible" ? "Eligible" : item.status === "conditional" ? "Conditional" : "Not Ready"}
          </Badge>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>
            {passCount}✓{partialCount > 0 ? ` ${partialCount}~` : ""}{failCount > 0 ? ` ${failCount}✗` : ""}
          </span>
        </div>
      </div>
      <ChevronRight size={15} style={{ color: "#9CA3AF", flexShrink: 0 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SETTLE BUTTON
   Full or partial settlement. Partial mode accumulates
   installments and shows repayment progress.
───────────────────────────────────────────────────────── */
interface Installment {
  id: string;
  amount: number;
  reference: string;
  date: string;
  status: "pending" | "verified";
}

function SettleButton({ financingId, totalAmount }: { financingId: string; totalAmount: number }) {
  const [open,         setOpen]         = useState(false);
  const [mode,         setMode]         = useState<"full" | "partial">("full");
  const [reference,    setReference]    = useState("");
  const [partialAmt,   setPartialAmt]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [fullySettled, setFullySettled] = useState(false);

  const totalPaid    = installments.reduce((s, i) => s + i.amount, 0);
  const remaining    = totalAmount - totalPaid;
  const paidPct      = Math.min(100, (totalPaid / totalAmount) * 100);
  const hasHistory   = installments.length > 0;

  const fmtLocal = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2)}M` : `₦${(n / 1_000).toFixed(0)}K`;

  const handleSubmit = async () => {
    const amount = mode === "full" ? remaining : Number(partialAmt);
    if (!reference.trim() || amount <= 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    // TODO: POST /business/financing/:financing_id/settlement
    // { proof: { reference, amount, is_partial: mode === "partial" } }
    const newInstallment: Installment = {
      id:        Math.random().toString(36).slice(2, 8),
      amount,
      reference: reference.trim(),
      date:      new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status:    "pending",
    };
    setInstallments(prev => [...prev, newInstallment]);
    if (mode === "full" || totalPaid + amount >= totalAmount) setFullySettled(true);
    setReference("");
    setPartialAmt("");
    setLoading(false);
    if (mode === "full" || totalPaid + amount >= totalAmount) setOpen(false);
  };

  /* Trigger button — shows progress if partial payments exist */
  const triggerButton = fullySettled ? (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, fontWeight: 600, color: "#10B981" }}>
      <CheckCircle2 size={12} /> Fully settled
    </div>
  ) : hasHistory ? (
    <button
      onClick={() => setOpen(true)}
      style={{ display: "flex", flexDirection: "column", gap: 3, padding: "5px 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", minWidth: 110 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2540" }}>{fmtLocal(totalPaid)} paid</span>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{Math.round(paidPct)}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${paidPct}%`, background: "#10B981", borderRadius: 9999, transition: "width 0.4s" }} />
      </div>
    </button>
  ) : (
    <Button variant="outline" size="sm" style={{ fontSize: 12, gap: 5 }} onClick={() => setOpen(true)}>
      <CheckCircle2 size={12} /> Settle
    </Button>
  );

  return (
    <>
      {triggerButton}

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" as const }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Record settlement</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Full payment or instalment — Creditlinker verifies against your bank data.</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Repayment progress */}
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>Repayment progress</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{fmtLocal(totalPaid)} of {fmtLocal(totalAmount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: "#E5E7EB", overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${paidPct}%`, background: paidPct >= 100 ? "#10B981" : "#3B82F6", borderRadius: 9999, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{installments.length} instalment{installments.length !== 1 ? "s" : ""} submitted</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: remaining > 0 ? "#F59E0B" : "#10B981" }}>
                    {remaining > 0 ? `${fmtLocal(remaining)} remaining` : "Fully paid"}
                  </span>
                </div>
              </div>

              {/* Mode toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1.5px solid #E5E7EB", borderRadius: 9, overflow: "hidden" }}>
                {(["full", "partial"] as const).map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      height: 38, fontSize: 13, fontWeight: 600, border: "none",
                      borderRight: i === 0 ? "1.5px solid #E5E7EB" : "none",
                      background: mode === m ? "#0A2540" : "white",
                      color: mode === m ? "white" : "#6B7280",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {m === "full" ? `Full payment (${fmtLocal(remaining)})` : "Part payment"}
                  </button>
                ))}
              </div>

              {/* Partial amount field */}
              {mode === "partial" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Amount paid (₦)</label>
                  <input
                    type="number"
                    value={partialAmt}
                    onChange={e => setPartialAmt(e.target.value)}
                    placeholder={`Max ${fmtLocal(remaining)}`}
                    min={1} max={remaining}
                    style={{ height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }}
                    onFocus={e => (e.target.style.borderColor = "#0A2540")}
                    onBlur={e  => (e.target.style.borderColor = "#E5E7EB")}
                  />
                  {Number(partialAmt) > remaining && (
                    <p style={{ fontSize: 11, color: "#EF4444" }}>Amount exceeds the remaining balance of {fmtLocal(remaining)}.</p>
                  )}
                </div>
              )}

              {/* Reference */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Payment reference or narration</label>
                <input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. TRF/2025/01/LAPO-8821"
                  style={{ height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "#0A2540")}
                  onBlur={e  => (e.target.style.borderColor = "#E5E7EB")}
                />
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Creditlinker will match this against your linked bank transactions to verify the payment.</p>
              </div>

              {/* Past instalments */}
              {hasHistory && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Previous instalments</p>
                  {installments.map(inst => (
                    <div key={inst.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: inst.status === "verified" ? "#ECFDF5" : "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {inst.status === "verified"
                          ? <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                          : <Clock        size={13} style={{ color: "#F59E0B" }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{fmtLocal(inst.amount)}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{inst.reference} · {inst.date}</p>
                      </div>
                      <Badge variant={inst.status === "verified" ? "success" : "warning"} style={{ fontSize: 9, flexShrink: 0 }}>
                        {inst.status === "verified" ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setOpen(false)} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Close</button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!reference.trim() || loading || (mode === "partial" && (!partialAmt || Number(partialAmt) <= 0 || Number(partialAmt) > remaining))}
                  style={{ flex: 2, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9, gap: 6 }}
                >
                  {loading
                    ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                    : mode === "full"
                    ? <><CheckCircle2 size={13} /> Submit full payment</>  
                    : <><CheckCircle2 size={13} /> Submit instalment</>
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   MARKETPLACE CARD
───────────────────────────────────────────────────────── */
function MarketplaceCard({ item }: { item: typeof MARKETPLACE[0] }) {
  const [requested, setRequested] = useState(item.consent_requested);

  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 12, padding: "20px 22px",
      transition: "box-shadow 0.15s, border-color 0.15s",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(10,37,64,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#F3F4F6", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#0A2540",
          }}>
            {item.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{
              fontSize: 14, fontWeight: 700, color: "#0A2540",
              fontFamily: "var(--font-display)", letterSpacing: "-0.02em",
              marginBottom: 2,
            }}>
              {item.name}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.type}</p>
          </div>
        </div>

        {/* Match score */}
        <div style={{ textAlign: "right" as const }}>
          <p style={{
            fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)",
            letterSpacing: "-0.03em",
            color: item.match_score >= 85 ? "#10B981" : "#F59E0B",
            lineHeight: 1,
          }}>
            {item.match_score}%
          </p>
          <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>match</p>
        </div>
      </div>

      {/* Capital type */}
      <div style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: 9999,
        background: "#F3F4F6",
        fontSize: 11, fontWeight: 600, color: "#374151",
        marginBottom: 14,
      }}>
        <Banknote size={11} style={{ marginRight: 5 }} />
        {item.label}
      </div>

      {/* Terms grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: "Amount",      value: item.amount_range },
          { label: "Rate",        value: item.rate },
          { label: "Tenure",      value: item.tenure },
          { label: "Turnaround",  value: item.turnaround },
        ].map((t) => (
          <div key={t.label}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
              {t.label}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      {requested ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 14px", borderRadius: 8,
          background: "#F0FDF4", border: "1px solid rgba(16,185,129,0.2)",
          fontSize: 12, fontWeight: 600, color: "#10B981",
        }}>
          <CheckCircle2 size={13} /> Access requested — awaiting review
        </div>
      ) : (
        <button
          onClick={() => setRequested(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, width: "100%", padding: "10px 0",
            borderRadius: 8, border: "1.5px solid #0A2540",
            background: "white", color: "#0A2540",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#0A2540";
            (e.currentTarget as HTMLElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "white";
            (e.currentTarget as HTMLElement).style.color = "#0A2540";
          }}
        >
          <ArrowUpRight size={13} /> Request Access
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancingPage() {
  const [capFilter,       setCapFilter]       = useState("All");
  const [activeAssessment, setActiveAssessment] = useState<ReadinessItem | null>(null);

  const filteredMarket = MARKETPLACE.filter((m) => {
    if (capFilter === "All") return true;
    return m.label.toLowerCase().includes(capFilter.toLowerCase());
  });

  const eligibleCount    = READINESS.filter(r => r.status === "eligible").length;
  const conditionalCount = READINESS.filter(r => r.status === "conditional").length;

  return (
    <>
    {activeAssessment && (
      <AssessmentDrawer item={activeAssessment} onClose={() => setActiveAssessment(null)} />
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            Financing
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {eligibleCount} capital types eligible · {conditionalCount} conditional · {ACTIVE_FINANCING.length} active financing
          </p>
        </div>
      </div>

      {/* ── READINESS SUMMARY ── */}
      <Card>
        <SectionHeader
          title="Financing Readiness"
          sub="Based on your current financial identity and score."
          action={
            <Link href="/financial-analysis" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 600, color: "#0A2540",
              textDecoration: "none",
            }}>
              <TrendingUp size={13} /> Full analysis
            </Link>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12, padding: "16px 24px 24px",
        }}>
          {READINESS.map((item) => (
            <ReadinessCard key={item.capital_category} item={item} onClick={() => setActiveAssessment(item)} />
          ))}
        </div>
      </Card>

      {/* ── ACTIVE FINANCING ── */}
      {ACTIVE_FINANCING.length > 0 && (
        <Card>
          <SectionHeader
            title="Active Financing"
            sub="Financing currently in progress."
          />
          <div style={{ padding: "12px 0 8px" }}>
            {ACTIVE_FINANCING.map((rec, i) => {
              const sc = statusConfig(rec.status);
              return (
                <div key={rec.financing_id} style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto auto",
                  alignItems: "center", gap: 16,
                  padding: "14px 24px",
                  borderBottom: i < ACTIVE_FINANCING.length - 1 ? "1px solid #F3F4F6" : "none",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#F3F4F6", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#0A2540",
                  }}>
                    {rec.institution.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>
                        {rec.institution}
                      </p>
                      <Badge variant={sc.variant} style={{ fontSize: 10 }}>{sc.label}</Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {rec.capital_category} · Granted {rec.granted_at} · Due {rec.terms.due}
                    </p>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: "right" as const }}>
                    <p style={{
                      fontFamily: "var(--font-display)", fontWeight: 800,
                      fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em",
                    }}>
                      {fmt(rec.amount)}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{rec.terms.rate}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <SettleButton financingId={rec.financing_id} totalAmount={rec.amount} />
                    <Link href="/disputes" style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 6,
                      fontSize: 12, fontWeight: 600, color: "#EF4444",
                      textDecoration: "none",
                    }}>
                      <AlertCircle size={12} /> Dispute
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── MARKETPLACE ── */}
      <div>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 2,
            }}>
              Financing Marketplace
            </h3>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {filteredMarket.length} capital providers matched to your financial identity.
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            <Filter size={13} style={{ color: "#9CA3AF" }} />
            {CAPITAL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setCapFilter(f)}
                style={{
                  padding: "5px 14px", borderRadius: 9999,
                  border: "1.5px solid",
                  borderColor: capFilter === f ? "#0A2540" : "#E5E7EB",
                  background: capFilter === f ? "#0A2540" : "white",
                  color: capFilter === f ? "white" : "#6B7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}>
          {filteredMarket.map((item) => (
            <MarketplaceCard key={item.institution_id} item={item} />
          ))}
        </div>
      </div>

      {/* ── CONSENT REQUESTS ── */}
      <Card>
        <SectionHeader
          title="Incoming Access Requests"
          sub="Capital providers requesting access to your financial identity."
          action={
            <Link href="/financers" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 600, color: "#0A2540",
              textDecoration: "none",
            }}>
              Manage all <ChevronRight size={13} />
            </Link>
          }
        />
        <div style={{ padding: "14px 24px 20px" }}>
          {/* Empty state */}
          <div style={{
            padding: "32px 20px", textAlign: "center",
            border: "1px dashed #E5E7EB", borderRadius: 10,
          }}>
            <Landmark size={24} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>
              No pending requests
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
              When a capital provider requests access to your profile, it will appear here for your review.
            </p>
          </div>
        </div>
      </Card>

      {/* ── IDENTITY PROMPT ── */}
      <div style={{
        background: "#0A2540", borderRadius: 14, padding: "22px 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const,
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={18} color="#00D4FF" />
          </div>
          <div>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3,
            }}>
              Strengthen your profile to unlock better offers.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              Upload documents and connect all accounts to improve your readiness scores.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href="/documents" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            transition: "all 0.12s",
          }}>
            Upload Docs
          </Link>
          <Link href="/financial-identity" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 8,
            background: "#00D4FF", color: "#0A2540",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <Building2 size={13} /> View Identity
          </Link>
        </div>
      </div>

    </div>
    </>
  );
}
