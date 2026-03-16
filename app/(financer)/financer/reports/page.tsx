"use client";

import {
  TrendingUp, BarChart2, Download, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MONTHLY = [
  { month: "Jul", deployed: 18, repaid: 6 },
  { month: "Aug", deployed: 25, repaid: 9 },
  { month: "Sep", deployed: 42, repaid: 14 },
  { month: "Oct", deployed: 30, repaid: 20 },
  { month: "Nov", deployed: 55, repaid: 22 },
  { month: "Dec", deployed: 38, repaid: 31 },
];

const MAX_VAL = Math.max(...MONTHLY.flatMap(m => [m.deployed, m.repaid]));

const SECTOR_BREAKDOWN = [
  { sector: "Retail",           pct: 28, amount: "₦69M",  color: "#00D4FF" },
  { sector: "Logistics",        pct: 22, amount: "₦54M",  color: "#818CF8" },
  { sector: "Food & Beverage",  pct: 18, amount: "₦45M",  color: "#10B981" },
  { sector: "Agriculture",      pct: 17, amount: "₦42M",  color: "#F59E0B" },
  { sector: "Manufacturing",    pct: 10, amount: "₦25M",  color: "#38BDF8" },
  { sector: "Other",            pct: 5,  amount: "₦13M",  color: "#E5E7EB" },
];

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

export default function FinancerReports() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Reports
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Portfolio analytics · H2 2024</p>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", height: 36, borderRadius: 8,
          border: "1px solid #E5E7EB", background: "white",
          fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer",
        }}>
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Deployed",     value: "₦248M", color: "#0A2540" },
          { label: "Total Repaid",       value: "₦102M", color: "#10B981" },
          { label: "Active Exposure",    value: "₦146M", color: "#F59E0B" },
          { label: "Deals Closed",       value: "14",    color: "#0A2540" },
          { label: "Avg. Deal Size",     value: "₦17.7M",color: "#0A2540" },
          { label: "Repayment Rate",     value: "94%",   color: "#10B981" },
        ].map(m => (
          <Card key={m.label} style={{ padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: m.color, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
              {m.value}
            </p>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Monthly chart */}
      <Card>
        <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Monthly Activity
          </p>
          <div style={{ display: "flex", gap: 14 }}>
            {[{ color: "#0A2540", label: "Deployed" }, { color: "#10B981", label: "Repaid" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 22px 18px", display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
          {MONTHLY.map(m => (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 112 }}>
                <div style={{
                  width: 18,
                  height: `${(m.deployed / MAX_VAL) * 112}px`,
                  background: "#0A2540", borderRadius: "3px 3px 0 0",
                  minHeight: 4,
                }} />
                <div style={{
                  width: 18,
                  height: `${(m.repaid / MAX_VAL) * 112}px`,
                  background: "#10B981", borderRadius: "3px 3px 0 0",
                  minHeight: 4,
                }} />
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.month}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sector breakdown */}
      <Card>
        <div style={{ padding: "18px 22px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Deployment by Sector
          </p>
        </div>
        <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {SECTOR_BREAKDOWN.map(s => (
            <div key={s.sector}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{s.sector}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{s.amount}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{s.pct}%</span>
                </div>
              </div>
              <div style={{ height: 7, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 9999 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
