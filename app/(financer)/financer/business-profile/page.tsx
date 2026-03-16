"use client";

import Link from "next/link";
import {
  ShieldCheck, ArrowUpRight, Building2, TrendingUp,
  ArrowDownLeft, ChevronRight, Tag, AlertCircle, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with:
     GET /institution/score/:financial_identity_id
     GET /institution/profile/:financial_identity_id
   Both require active ConsentRecord.
───────────────────────────────────────────────────────── */
const BUSINESS = {
  display_name: "Kemi Superstores",
  financial_identity_id: "fid_1r8t",
  sector: "Retail",
  cac_registered: true,
  data_coverage: "Jan 2023 – Dec 2024",
  data_months: 24,
  consent_expiry: "Mar 31, 2025",
  revenue_band: "₦8M – ₦30M/mo",
};

const SCORE = {
  overall: 811,
  risk_level: "Low Risk",
  data_quality_score: 93,
  dimensions: [
    { key: "revenue_stability",       label: "Revenue Stability",       value: 88, color: "#10B981" },
    { key: "cashflow_predictability", label: "Cashflow Predictability", value: 82, color: "#38BDF8" },
    { key: "expense_discipline",      label: "Expense Discipline",      value: 84, color: "#818CF8" },
    { key: "liquidity_strength",      label: "Liquidity Strength",      value: 76, color: "#F59E0B" },
    { key: "financial_consistency",   label: "Financial Consistency",   value: 85, color: "#10B981" },
    { key: "risk_profile",            label: "Risk Profile",            value: 74, color: "#EF4444" },
  ],
};

const RECENT_TRANSACTIONS = [
  { description: "Danone West Africa",   amount: 1_200_000, direction: "debit",  date: "Today",     category: "Supplier" },
  { description: "Shoprite Payout",      amount: 4_800_000, direction: "credit", date: "Today",     category: "Revenue" },
  { description: "PAYE Tax",             amount: 380_000,   direction: "debit",  date: "Yesterday", category: "Tax" },
  { description: "B2B Client — Lagomart",amount: 2_200_000, direction: "credit", date: "Dec 27",    category: "Revenue" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function ScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const dash = (score / max) * circ;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#F3F4F6" strokeWidth="9" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#00D4FF" strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0A2540" fontFamily="var(--font-display)" letterSpacing="-1">{score}</text>
      <text x="65" y="74" textAnchor="middle" fontSize="9"  fontWeight="600" fill="#9CA3AF" fontFamily="var(--font-display)">out of {max.toLocaleString()}</text>
      <text x="65" y="88" textAnchor="middle" fontSize="9"  fontWeight="700" fill="#10B981" fontFamily="var(--font-display)" letterSpacing="0.3">LOW RISK</text>
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

export default function FinancerBusinessProfile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── IDENTITY BANNER ── */}
      <div style={{
        background: "#0A2540", borderRadius: 14, padding: "22px 26px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: "rgba(0,212,255,0.12)",
            border: "1px solid rgba(0,212,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Building2 size={20} color="#00D4FF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.03em" }}>
                {BUSINESS.display_name}
              </h2>
              <Badge variant="success" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <ShieldCheck size={10} /> Verified
              </Badge>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                BUSINESS.sector,
                BUSINESS.cac_registered ? "CAC Registered" : "",
                `Coverage: ${BUSINESS.data_coverage}`,
                `Consent expires ${BUSINESS.consent_expiry}`,
              ].filter(Boolean).map((item, i, arr) => (
                <span key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                  {item}{i < arr.length - 1 ? " ·" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/financer/financial-analysis" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
            color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            <TrendingUp size={13} /> Deep Analysis
          </Link>
          <Link href="/financer/offers" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "#00D4FF", color: "#0A2540",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <Tag size={13} /> Create Offer
          </Link>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Score */}
          <Card style={{ padding: "22px 18px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <ScoreRing score={SCORE.overall} />
            </div>
            <div style={{ height: 1, background: "#F3F4F6", margin: "12px 0" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Data Quality</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{SCORE.data_quality_score}%</p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Months</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{BUSINESS.data_months}</p>
              </div>
            </div>
          </Card>

          {/* Consent notice */}
          <div style={{
            padding: "13px 16px", borderRadius: 12,
            background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
            display: "flex", gap: 8,
          }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
              Access granted by the business until <strong>{BUSINESS.consent_expiry}</strong>. You can view their full identity including transaction signals.
            </p>
          </div>

          {/* Revenue band */}
          <Card style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Revenue Band</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{BUSINESS.revenue_band}</p>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Dimensions */}
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 14 }}>
              Score Dimensions
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {SCORE.dimensions.map(d => (
                <div key={d.key} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{d.label}</p>
                    <span style={{ fontSize: 18, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{d.value}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Transaction Signals</p>
              <Link href="/financer/financial-analysis" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                Full analysis <ChevronRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "10px 0 8px" }}>
              {RECENT_TRANSACTIONS.map((tx, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 22px",
                  borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? "1px solid #F3F4F6" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: tx.direction === "credit" ? "#ECFDF5" : "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: tx.direction === "credit" ? "#10B981" : "#6B7280",
                  }}>
                    {tx.direction === "credit" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{tx.date} · {tx.category}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>
                    {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
