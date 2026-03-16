"use client";

import Link from "next/link";
import {
  ArrowUpRight, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Banknote, PieChart, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /institution/financing → FinancingRecord[]
───────────────────────────────────────────────────────── */
type FinancingStatus = "active" | "settled" | "disputed" | "withdrawn";

const RECORDS = [
  {
    id: "FIN-001",
    business_id: "BIZ-1R8T",
    business_name: "Kemi Superstores",
    capital_category: "Working Capital",
    amount: "₦15M",
    amount_raw: 15_000_000,
    disbursed: "Oct 15, 2024",
    due: "Apr 15, 2025",
    status: "active" as FinancingStatus,
    health: "on_track" as const,
    repaid_pct: 42,
    sector: "Retail",
  },
  {
    id: "FIN-002",
    business_id: "BIZ-3K2M",
    business_name: "Nonso Logistics",
    capital_category: "Asset Financing",
    amount: "₦42M",
    amount_raw: 42_000_000,
    disbursed: "Sep 1, 2024",
    due: "Sep 1, 2026",
    status: "active" as FinancingStatus,
    health: "on_track" as const,
    repaid_pct: 18,
    sector: "Logistics",
  },
  {
    id: "FIN-003",
    business_id: "BIZ-9P4L",
    business_name: "Bright Pharma",
    capital_category: "Invoice Financing",
    amount: "₦8M",
    amount_raw: 8_000_000,
    disbursed: "Dec 1, 2024",
    due: "Feb 28, 2025",
    status: "active" as FinancingStatus,
    health: "watch" as const,
    repaid_pct: 0,
    sector: "Healthcare",
  },
  {
    id: "FIN-004",
    business_id: "BIZ-7X9A",
    business_name: "Aduke Bakeries",
    capital_category: "Working Capital",
    amount: "₦12M",
    amount_raw: 12_000_000,
    disbursed: "Jun 10, 2024",
    due: "Dec 10, 2024",
    status: "settled" as FinancingStatus,
    health: "on_track" as const,
    repaid_pct: 100,
    sector: "Food & Beverage",
  },
  {
    id: "FIN-005",
    business_id: "BIZ-2B7R",
    business_name: "Delta Textiles",
    capital_category: "Term Loan",
    amount: "₦22M",
    amount_raw: 22_000_000,
    disbursed: "Aug 5, 2024",
    due: "Aug 5, 2025",
    status: "disputed" as FinancingStatus,
    health: "watch" as const,
    repaid_pct: 30,
    sector: "Manufacturing",
  },
];

const PORTFOLIO_SUMMARY = {
  total_deployed: "₦248M",
  active_count: 3,
  settled_count: 8,
  at_risk_count: 2,
  repayment_rate: "94%",
};

function statusConfig(s: FinancingStatus) {
  return {
    active:    { label: "Active",    variant: "success"     as const, icon: <CheckCircle2 size={11} /> },
    settled:   { label: "Settled",   variant: "secondary"   as const, icon: <CheckCircle2 size={11} /> },
    disputed:  { label: "Disputed",  variant: "destructive" as const, icon: <AlertCircle  size={11} /> },
    withdrawn: { label: "Withdrawn", variant: "outline"     as const, icon: <Clock        size={11} /> },
  }[s];
}

function healthConfig(h: "on_track" | "watch" | "overdue") {
  return {
    on_track: { color: "#10B981", label: "On Track" },
    watch:    { color: "#F59E0B", label: "Watch"    },
    overdue:  { color: "#EF4444", label: "Overdue"  },
  }[h];
}

/* ─────────────────────────────────────────────────────────
   SUMMARY CARD
───────────────────────────────────────────────────────── */
function SummaryCard({ label, value, sub, icon, accent = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 14, padding: "20px 22px",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, marginBottom: 14,
        background: accent ? "#0A2540" : "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accent ? "#00D4FF" : "#6B7280",
      }}>
        {icon}
      </div>
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 26, color: "#0A2540", letterSpacing: "-0.04em",
        lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerPortfolio() {
  const active   = RECORDS.filter(r => r.status === "active");
  const settled  = RECORDS.filter(r => r.status === "settled");
  const disputed = RECORDS.filter(r => r.status === "disputed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
        }}>
          Portfolio
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          {RECORDS.length} financing records · {active.length} active · {settled.length} settled
        </p>
      </div>

      {/* ── SUMMARY METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <SummaryCard label="Total Deployed"  value={PORTFOLIO_SUMMARY.total_deployed} sub="Across all records"          icon={<Banknote size={16} />}  accent />
        <SummaryCard label="Active"          value={String(PORTFOLIO_SUMMARY.active_count)} sub="Currently funded"       icon={<TrendingUp size={16} />} />
        <SummaryCard label="Settled"         value={String(PORTFOLIO_SUMMARY.settled_count)} sub="Fully repaid"          icon={<CheckCircle2 size={16} />} />
        <SummaryCard label="Repayment Rate"  value={PORTFOLIO_SUMMARY.repayment_rate} sub="On-time settlement rate"      icon={<PieChart size={16} />} />
      </div>

      {/* ── ACTIVE RECORDS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Active Financing
          </p>
          <Link href="/financer/reports" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
            View report <ChevronRight size={12} />
          </Link>
        </div>

        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 100px 140px 100px 80px 100px",
            padding: "10px 22px",
            borderBottom: "1px solid #F3F4F6",
          }}>
            {["Business", "Type", "Amount", "Due Date", "Repaid", "Health", "Status"].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          {active.map((rec, i) => {
            const sc = statusConfig(rec.status);
            const hc = healthConfig(rec.health);
            return (
              <div key={rec.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 100px 140px 100px 80px 100px",
                padding: "14px 22px",
                borderBottom: i < active.length - 1 ? "1px solid #F3F4F6" : "none",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{rec.business_name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{rec.sector}</p>
                </div>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{rec.capital_category}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{rec.amount}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{rec.due}</p>
                {/* Repaid bar */}
                <div>
                  <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6", marginBottom: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${rec.repaid_pct}%`,
                      background: hc.color, borderRadius: 9999,
                    }} />
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF" }}>{rec.repaid_pct}%</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: hc.color }}>{hc.label}</p>
                <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, width: "fit-content" }}>
                  {sc.icon} {sc.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DISPUTED ── */}
      {disputed.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 14 }}>
            Disputes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {disputed.map(rec => (
              <div key={rec.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 12, padding: "14px 20px",
              }}>
                <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>{rec.business_name}</p>
                  <p style={{ fontSize: 11, color: "#B91C1C" }}>
                    {rec.capital_category} · {rec.amount} · Disbursed {rec.disbursed}
                  </p>
                </div>
                <button style={{
                  padding: "6px 14px", borderRadius: 7,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "white", color: "#EF4444",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  Manage Dispute
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SETTLED ── */}
      {settled.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 14 }}>
            Recently Settled
          </p>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            {settled.map((rec, i) => (
              <div key={rec.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 22px",
                borderBottom: i < settled.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: "#ECFDF5",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <CheckCircle2 size={14} color="#10B981" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{rec.business_name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{rec.capital_category} · Disbursed {rec.disbursed}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)" }}>{rec.amount}</p>
                <Badge variant="success" style={{ fontSize: 10 }}>Settled</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
