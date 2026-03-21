"use client";

import Link from "next/link";
import {
  ShieldCheck, ArrowLeftRight, Banknote, TrendingUp,
  ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle,
  ChevronRight, Plus, Zap, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveBusiness } from "@/lib/business-context";

const SCORE = {
  overall: 742,
  risk_level: "Low Risk",
  dimensions: [
    { label: "Revenue Stability",       value: 85, color: "#10B981" },
    { label: "Cashflow Predictability", value: 78, color: "#38BDF8" },
    { label: "Expense Discipline",      value: 81, color: "#818CF8" },
    { label: "Liquidity Strength",      value: 74, color: "#F59E0B" },
    { label: "Financial Consistency",   value: 80, color: "#10B981" },
    { label: "Risk Profile",            value: 69, color: "#EF4444" },
  ],
  data_quality_score: 91,
  data_months_analyzed: 24,
};

const LINKED_ACCOUNTS = [
  { bank_name: "Zenith Bank", account_number_masked: "****4821", is_primary: true,  last_synced: "2 hours ago" },
  { bank_name: "GTBank",      account_number_masked: "****0034", is_primary: false, last_synced: "2 hours ago" },
];

const RECENT_TRANSACTIONS = [
  { description: "Flour Mills Nigeria",    amount: 480000,  direction: "debit",  date: "Today, 09:14", category: "Supplier" },
  { description: "Retail Sales — Lekki",  amount: 920000,  direction: "credit", date: "Today, 07:30", category: "Revenue" },
  { description: "Lagos State Tax",        amount: 125000,  direction: "debit",  date: "Yesterday",    category: "Tax" },
  { description: "Jumia Food — Payout",   amount: 340000,  direction: "credit", date: "Yesterday",    category: "Revenue" },
  { description: "Staff Salaries — Dec",  amount: 1200000, direction: "debit",  date: "Dec 28",       category: "Payroll" },
];

const FINANCING_OPPORTUNITIES = [
  { name: "Stanbic IBTC",      type: "Working Capital Loan",  amount: "₦5M – ₦50M",  match: 94 },
  { name: "Lapo Microfinance", type: "Revenue Advance",       amount: "₦500K – ₦5M", match: 87 },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / max);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle cx="55" cy="55" r={r} fill="none" stroke="#00D4FF" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        transform="rotate(-90 55 55)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="55" y="51" textAnchor="middle" fontSize="22" fontWeight="800"
        fill="#0A2540" fontFamily="var(--font-display)" letterSpacing="-1">{score}</text>
      <text x="55" y="65" textAnchor="middle" fontSize="9" fontWeight="600"
        fill="#10B981" fontFamily="var(--font-display)" letterSpacing="0.5">
        {SCORE.risk_level.toUpperCase()}
      </text>
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>{title}</p>
      {action}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, accent = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: accent ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: accent ? "#00D4FF" : "#6B7280" }}>
          {icon}
        </div>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUser, activeBusiness } = useActiveBusiness();
  const firstName = currentUser.full_name.split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── WELCOME BANNER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {greeting()}, {firstName} 👋
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{activeBusiness.name}</span>
            <span style={{ color: "#E5E7EB" }}>·</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{SCORE.data_months_analyzed} months of data</span>
          </div>
        </div>
        <Button variant="primary" size="sm" style={{ gap: 6, height: 36 }}
          onClick={() => window.location.reload()}>
          <RefreshCw size={13} /> Refresh Data
        </Button>
      </div>

      {/* ── METRICS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <MetricCard label="Financial Score" value={String(SCORE.overall)} sub="Out of 1,000" icon={<ShieldCheck size={16} />} accent />
        <MetricCard label="Data Quality"    value={`${SCORE.data_quality_score}%`} sub="High confidence" icon={<Zap size={16} />} />
        <MetricCard label="Linked Accounts" value={String(LINKED_ACCOUNTS.length)} sub="All synced" icon={<ArrowLeftRight size={16} />} />
        <MetricCard label="Data Coverage"   value="24 mo" sub="2023-01 – 2024-12" icon={<Clock size={16} />} />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="db-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>

        {/* LEFT COL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Financial Identity Card */}
          <Card>
            <CardHeader title="Financial Identity"
              action={<Link href="/financial-identity" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>View full identity <ChevronRight size={13} /></Link>}
            />
            <div className="db-score-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, padding: "18px 22px 22px", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <ScoreRing score={SCORE.overall} />
                <Badge variant="success" style={{ fontSize: 10 }}>Low Risk</Badge>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SCORE.dimensions.map(d => (
                  <div key={d.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{d.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader title="Recent Transactions"
              action={<Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>View all <ChevronRight size={13} /></Link>}
            />
            <div style={{ padding: "10px 0 8px" }}>
              {RECENT_TRANSACTIONS.map((tx, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                    {tx.direction === "credit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{tx.date} · {tx.category}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>
                    {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Linked Accounts */}
          <Card>
            <CardHeader title="Linked Accounts"
              action={<Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}><Plus size={12} /> Add</Link>}
            />
            <div style={{ padding: "10px 0 8px" }}>
              {LINKED_ACCOUNTS.map((acc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < LINKED_ACCOUNTS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540" }}>
                    {acc.bank_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{acc.bank_name}</p>
                      {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 9, padding: "1px 6px" }}>Primary</Badge>}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{acc.account_number_masked} · {acc.last_synced}</p>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </Card>

          {/* Financing Opportunities */}
          <Card>
            <CardHeader title="Financing Matches"
              action={<Link href="/financing" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Explore <ChevronRight size={13} /></Link>}
            />
            <div style={{ padding: "10px 0 8px" }}>
              {FINANCING_OPPORTUNITIES.map((opp, i) => (
                <div key={i} style={{ padding: "12px 22px", borderBottom: i < FINANCING_OPPORTUNITIES.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{opp.name}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: opp.match >= 90 ? "#10B981" : "#F59E0B" }}>{opp.match}% match</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{opp.type}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{opp.amount}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
              <Link href="/financing" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none", transition: "all 0.12s" }}>
                <Banknote size={14} /> Browse all financers
              </Link>
            </div>
          </Card>

          {/* Nudge */}
          <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>Strengthen your identity</p>
              <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5, marginBottom: 10 }}>
                Upload your CAC documents to unlock verification and improve your score.
              </p>
              <Link href="/documents" style={{ fontSize: 12, fontWeight: 700, color: "#92400E", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Upload documents →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
