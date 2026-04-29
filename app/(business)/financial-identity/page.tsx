"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck, RefreshCw, AlertCircle, CheckCircle2,
  Clock, ChevronRight, ArrowUpRight, TrendingUp,
  Database, Landmark, Info, X, Copy, CheckCheck,
  Building2, Zap, ChevronDown as ChevDown, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveBusiness } from "@/lib/business-context";
import { supabase } from "@/lib/supabase";

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

interface ScoreDimension {
  key: string;
  label: string;
  value: number;
  max: number;
  color: string;
  description: string;
  trend: string;
  positive: true | false | null;
  grade?: string;
  signal?: string;
}

interface ScoreData {
  composite_score: number;
  lender_risk: string;
  data_quality_score: number;
  data_months_analyzed: number;
  dimensions: ScoreDimension[];
}

interface LinkedAccount {
  account_id: string;
  bank_name: string;
  account_number_masked: string;
  is_primary: boolean;
  last_synced: string | null;
}

interface RiskFlag {
  type: string;
  severity: string;
  description: string;
  score_impact: number;
}

interface Snapshot {
  taken_at: string;
  score: number;
  risk: string;
  quality: number;
}

interface Recommendation {
  dimension: string;
  dimension_color: string;
  current_score: number;
  cause: string;
  action: string;
  estimated_gain: number;
  priority: "high" | "medium" | "low";
  action_route: string;
  action_label: string;
}

// ----------------------------------------------------------
// DIMENSION METADATA
// ----------------------------------------------------------

const DIM_META: Record<string, { label: string; color: string; description: string }> = {
  revenue_stability:      { label: "Revenue Stability",       color: "#10B981", description: "Consistency and predictability of revenue inflows over time." },
  cashflow_predictability:{ label: "Cashflow Predictability", color: "#38BDF8", description: "Reliability of positive operating cashflow generation." },
  expense_discipline:     { label: "Expense Discipline",      color: "#818CF8", description: "Operating cost control relative to revenue." },
  liquidity_strength:     { label: "Liquidity Strength",      color: "#F59E0B", description: "Cash reserves and financial buffers available to the business." },
  financial_consistency:  { label: "Financial Consistency",   color: "#10B981", description: "Completeness and regularity of financial activity." },
  risk_profile:           { label: "Risk Profile",            color: "#EF4444", description: "Anomalies and risk signals in financial activity." },
};

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function priorityCfg(p: "high" | "medium" | "low") {
  return {
    high:   { label: "High impact",   color: "#EF4444", bg: "#FEF2F2", border: "rgba(239,68,68,0.15)" },
    medium: { label: "Medium impact", color: "#F59E0B", bg: "#FFFBEB", border: "rgba(245,158,11,0.15)" },
    low:    { label: "Low impact",    color: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
  }[p];
}

function severityCfg(s: string) {
  const map: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    critical: { bg: "#FEF2F2", border: "rgba(239,68,68,0.2)",   icon: "#EF4444", label: "Critical" },
    high:     { bg: "#FFFBEB", border: "rgba(245,158,11,0.2)",   icon: "#F59E0B", label: "High" },
    medium:   { bg: "#FFFBEB", border: "rgba(245,158,11,0.15)",  icon: "#F59E0B", label: "Medium" },
    low:      { bg: "#F9FAFB", border: "#E5E7EB",               icon: "#9CA3AF", label: "Low" },
  };
  return map[s] ?? map.medium;
}

// ── COLLAPSIBLE SECTION WRAPPER ──
function CollapsibleSection({ title, sub, badge, defaultOpen = false, children, action }: {
  title: string; sub?: string; badge?: React.ReactNode; defaultOpen?: boolean;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>{title}</p>
              {badge}
            </div>
            {sub && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{sub}</p>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {action}
          <ChevronDown size={16} style={{ color: "#9CA3AF", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </button>
      {open && <div style={{ borderTop: "1px solid #F3F4F6" }}>{children}</div>}
    </Card>
  );
}

function RecommendationsPanel({ recommendations, loading }: { recommendations: Recommendation[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const totalGain = recommendations.reduce((s, r) => s + r.estimated_gain, 0);
  const badge = !loading && recommendations.length > 0 ? (
    <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 9999 }}>+{totalGain} pts available</span>
  ) : undefined;

  return (
    <CollapsibleSection
      title="How to Improve Your Score"
      sub={!loading && recommendations.length > 0 ? `${recommendations.length} actions identified` : undefined}
      badge={badge}
      defaultOpen={true}
    >
      <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <><SkeletonBox h={52} r={10} /><SkeletonBox h={52} r={10} /></>
        ) : recommendations.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" as const, padding: "12px 0" }}>No improvement actions yet. Run the pipeline to generate recommendations.</p>
        ) : recommendations.map((rec, i) => {
          const pc = priorityCfg(rec.priority);
          const isOpen = expanded === i;
          return (
            <div key={i} style={{ border: `1px solid ${isOpen ? "#0A2540" : "#E5E7EB"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.12s" }}>
              <button onClick={() => setExpanded(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: isOpen ? "#F9FAFB" : "white", border: "none", cursor: "pointer", textAlign: "left" as const, transition: "background 0.1s" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: rec.dimension_color, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{rec.dimension}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#10B981", fontFamily: "var(--font-display)" }}>+{rec.estimated_gain}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, padding: "2px 6px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>{pc.label}</span>
                      <ChevDown size={13} style={{ color: "#9CA3AF", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </div>
                  </div>
                  {!isOpen && <p style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{rec.cause}</p>}
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: "0 16px 16px", background: "#F9FAFB", borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ padding: "12px 0 10px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>What was detected</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{rec.cause}</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#0A5060", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Recommended action</p>
                    <p style={{ fontSize: 13, color: "#0A5060", lineHeight: 1.65 }}>{rec.action}</p>
                  </div>
                  <Link href={rec.action_route} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    {rec.action_label} <ArrowUpRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

function parseDimensions(raw: any): ScoreDimension[] {
  if (!raw) return [];
  return Object.entries(DIM_META).map(([key, meta]) => {
    const val = raw[key];
    // Handle both full SDK object and simple number (seed data)
    const value = typeof val === "object" && val !== null ? (val.raw_score ?? 0) : (val ?? 0);
    const grade = typeof val === "object" ? val.grade : undefined;
    const signal = typeof val === "object" ? val.signal : undefined;
    const trend = typeof val === "object" ? val.trend : undefined;

    return {
      key,
      label: meta.label,
      value: Math.round(value),
      max: 100,
      color: meta.color,
      description: signal || meta.description,
      trend: trend ? `Trend: ${trend}` : "No change",
      positive: trend === "improving" ? true : trend === "declining" ? false : null,
      grade,
      signal,
    };
  });
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCoverage(start: string | null, end: string | null): string {
  if (!start) return "No data yet";
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return `${fmt(start)}${end ? ` to ${fmt(end)}` : " to present"}`;  
}

// ----------------------------------------------------------
// SUBCOMPONENTS
// ----------------------------------------------------------

function statusConfig(kyc: string) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "secondary"; icon: React.ReactNode }> = {
    verified: { label: "Verified",   variant: "success",   icon: <CheckCircle2 size={13} /> },
    pending:  { label: "Pending",    variant: "secondary", icon: <Clock        size={13} /> },
    flagged:  { label: "Flagged",    variant: "warning",   icon: <AlertCircle  size={13} /> },
  };
  return map[kyc] ?? { label: "Unverified", variant: "secondary", icon: <Clock size={13} /> };
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 24px 0" }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function ScoreRingLarge({ score, max = 1000 }: { score: number; max?: number }) {
  const r = 64, circ = 2 * Math.PI * r, dash = circ * (score / max);
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="#00D4FF" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} transform="rotate(-90 80 80)" />
      <text x="80" y="74" textAnchor="middle" fontSize="32" fontWeight="800" fill="#0A2540" fontFamily="var(--font-display)" letterSpacing="-2">{score}</text>
      <text x="80" y="91" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9CA3AF" fontFamily="var(--font-display)">out of {max.toLocaleString()}</text>
    </svg>
  );
}

function SkeletonBox({ w = "100%", h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#F3F4F6", animation: "pulse 1.5s infinite" }} />;
}

function DimensionRow({ d }: { d: ScoreDimension }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F9FAFB" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{d.label}</p>
          <span style={{ fontSize: 14, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{d.value}</span>
        </div>
        <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
        </div>
      </div>
      <TrendingUp size={13} style={{ color: d.positive === true ? "#10B981" : d.positive === false ? "#EF4444" : "#9CA3AF", flexShrink: 0 }} />
    </div>
  );
}

function DimensionCard({ d }: { d: ScoreDimension }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{d.label}</p>
        <span style={{ fontSize: 20, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{d.value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6", marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
      </div>
      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: 10 }}>{d.description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <TrendingUp size={11} style={{ color: d.positive === true ? "#10B981" : d.positive === false ? "#EF4444" : "#9CA3AF" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: d.positive === true ? "#10B981" : d.positive === false ? "#EF4444" : "#9CA3AF" }}>{d.trend}</span>
      </div>
    </div>
  );
}

function ShareIdentityModal({ onClose, businessName, score, dimensions, dataQuality, coverage, financialIdentityId }:
  { onClose: () => void; businessName: string; score: ScoreData; dimensions: ScoreDimension[]; dataQuality: number; coverage: string; financialIdentityId: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://app.creditlinker.com/identity/${financialIdentityId}`;
  const handleCopy = () => { navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Share Financial Identity</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Preview what capital providers will see</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: "20px 24px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#0A2540", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={16} color="#00D4FF" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2 }}>{businessName}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Financial Identity</p>
                </div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1 }}>{score.composite_score}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#10B981", marginTop: 2 }}>{score.lender_risk ? `${score.lender_risk.charAt(0).toUpperCase()}${score.lender_risk.slice(1)} credit risk` : ''}</p>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Score Dimensions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dimensions.map(d => (
                  <div key={d.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{d.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F3F4F6", flexWrap: "wrap" as const, gap: 8 }}>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Data quality: <strong style={{ color: "#0A2540" }}>{dataQuality}%</strong></span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Coverage: <strong style={{ color: "#0A2540" }}>{coverage}</strong></span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>Sharing this link gives anyone a <strong>read-only preview</strong>. Full data access requires explicit consent.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", overflow: "hidden" }}>
              <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{shareUrl}</p>
            </div>
            <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 40, borderRadius: 8, flexShrink: 0, border: "none", background: copied ? "#10B981" : "#0A2540", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>
              {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy link</>}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Close</button>
            <Link href="/financers" style={{ flex: 1, height: 40, borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Database size={13} /> Manage consent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------

export default function FinancialIdentityPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [txCoverageStart, setTxCoverageStart] = useState<string | null>(null);
  const [txCoverageEnd, setTxCoverageEnd] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showFinancingGate, setShowFinancingGate] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    const id = activeBusiness.business_id;

    async function load() {
      setLoading(true);
      const [businessRes, minDateRes, maxDateRes, scoreRes, accountsRes, snapshotsRes, metricsRes] = await Promise.all([
        supabase.from("businesses").select("last_pipeline_run_at").eq("business_id", id).single(),
        supabase.from("normalized_transactions").select("date").eq("business_id", id).order("date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("normalized_transactions").select("date").eq("business_id", id).order("date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("creditlinker_scores").select("*").eq("business_id", id).order("computed_at", { ascending: false }).limit(1).single(),
        supabase.from("linked_accounts").select("*").eq("business_id", id).order("is_primary", { ascending: false }),
        supabase.from("creditlinker_scores").select("computed_at, composite_score, lender_risk, data_quality_score").eq("business_id", id).order("computed_at", { ascending: false }).limit(10),
        // Latest aggregated_metrics - contains active_risk_flags from the aggregation engine
        supabase.from("aggregated_metrics").select("metrics").eq("business_id", id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setLastSyncedAt(businessRes.data?.last_pipeline_run_at ?? null);
      setTxCoverageStart(minDateRes.data?.date ?? null);
      setTxCoverageEnd(maxDateRes.data?.date ?? null);

      // Recommendations are fetched for the specific pipeline run that produced the latest score,
      // so we always show recommendations that correspond to the current score state.
      const latestRunId = scoreRes.data?.pipeline_run_id;
      let recsData: any[] = [];
      if (latestRunId) {
        const { data: recsResult } = await supabase
          .from("recommendations")
          .select("*")
          .eq("business_id", id)
          .eq("pipeline_run_id", latestRunId)
          .order("estimated_score_gain", { ascending: false });
        recsData = recsResult ?? [];
      }

      if (scoreRes.data) {
        setScore({
          composite_score:      scoreRes.data.composite_score,
          lender_risk:          scoreRes.data.lender_risk ?? '',
          data_quality_score:   scoreRes.data.data_quality_score,
          data_months_analyzed: scoreRes.data.data_months_analyzed,
          dimensions:           parseDimensions(scoreRes.data.dimensions),
        });
      }

      setAccounts((accountsRes.data ?? []) as LinkedAccount[]);

      setSnapshots((snapshotsRes.data ?? []).map((s: any) => ({
        taken_at: new Date(s.computed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        score:    s.composite_score ?? 0,
        risk:     s.lender_risk ?? "Unknown",
        quality:  s.data_quality_score ?? 0,
      })));

      // Risk flags: transaction-level signals from the aggregation engine.
      // These are real behavioural patterns detected across the full transaction dataset
      // (debt stress, volatility spikes, concentration, cashflow gaps, etc).
      const activeFlags: any[] = metricsRes.data?.metrics?.active_risk_flags ?? [];
      setRiskFlags(activeFlags.map((f: any) => ({
        type:         f.type?.replace(/_/g, " ") ?? "Unknown",
        severity:     f.severity ?? "medium",
        description:  f.description ?? "",
        score_impact: f.score_impact ?? 0,
      })));

      // Recommendations: cross-dimension ranked improvements from Stage 7 of the pipeline.
      // Each recommendation is transaction-evidence-backed and ranked by estimated score gain.
      setRecommendations(recsData.map((r: any) => {
        const dimMeta = DIM_META[r.dimension];
        return {
          dimension:       dimMeta?.label ?? r.dimension_label ?? r.dimension ?? "General",
          dimension_color: dimMeta?.color ?? "#9CA3AF",
          current_score:   r.current_score ?? 0,
          cause:           r.root_cause ?? "",
          action:          r.action_route ?? "",
          estimated_gain:  r.estimated_score_gain ?? 0,
          priority:        r.priority === "critical" ? "high" : (r.priority ?? "medium"),
          action_route:    r.is_quick_win ? "/data-sources" : "/financial-analysis",
          action_label:    r.is_quick_win ? "Quick fix" : "View analysis",
        };
      }));

      setLoading(false);
    }

    load();
  }, [activeBusiness?.business_id]);

  if (bizLoading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading...</div>;
  }

  if (!activeBusiness) {
    return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No business found.</div>;
  }

  const kyc = activeBusiness.kyc_status ?? "unverified";
  const status = statusConfig(kyc);
  const coverage = formatCoverage(txCoverageStart, txCoverageEnd);
  const openToFinancing = activeBusiness.open_to_financing ?? false;
  const dimensions = score?.dimensions ?? [];

  return (
    <>
      {showShare && score && (
        <ShareIdentityModal
          onClose={() => setShowShare(false)}
          businessName={activeBusiness.name}
          score={score}
          dimensions={dimensions}
          dataQuality={score.data_quality_score}
          coverage={coverage}
          financialIdentityId={activeBusiness.financial_identity_id}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HERO: SCORE + IDENTITY STATUS ── */}
        <Card style={{ overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ background: "#0A2540", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldCheck size={17} color="#00D4FF" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "white", letterSpacing: "-0.03em" }}>Financial Identity</h2>
                  <Badge variant={status.variant} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>{status.icon} {status.label}</Badge>
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Coverage: {coverage}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => window.location.reload()} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <RefreshCw size={14} color="rgba(255,255,255,0.6)" />
              </button>
              {score && (
                <button onClick={() => setShowShare(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px", height: 32, borderRadius: 8, background: "#00D4FF", color: "#0A2540", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  <ArrowUpRight size={12} /> Share
                </button>
              )}
            </div>
          </div>

          {/* Score ring + stats */}
          <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 20 }}>
            {loading ? (
              <><SkeletonBox w={100} h={100} r={50} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><SkeletonBox h={20} /><SkeletonBox h={14} w="70%" /></div></>
            ) : score ? (
              <>
                <div style={{ flexShrink: 0 }}><ScoreRingLarge score={score.composite_score} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Data Quality</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1 }}>{score.data_quality_score}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Months</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1 }}>{score.data_months_analyzed}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>Synced {relativeTime(lastSyncedAt)}</p>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "12px 0" }}>No score yet. Connect a bank account and run the pipeline.</p>
            )}
          </div>
        </Card>

        {/* ── SCORE DIMENSIONS (collapsible) ── */}
        <CollapsibleSection
          title="Score Dimensions"
          sub="6 financial health indicators"
          defaultOpen={true}
          action={
            <Link href="/financial-analysis" onClick={e => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
              Deep analysis <ChevronRight size={12} />
            </Link>
          }
        >
          <div style={{ padding: "4px 20px 16px" }}>
            {loading ? (
              <><SkeletonBox h={40} r={8} /><SkeletonBox h={40} r={8} style={{ marginTop: 8 }} /></>
            ) : dimensions.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "16px 0", textAlign: "center" as const }}>Run the pipeline to generate your score dimensions.</p>
            ) : (
              dimensions.map(d => <DimensionRow key={d.key} d={d} />)
            )}
          </div>
        </CollapsibleSection>

        {/* ── LINKED ACCOUNTS (collapsible) ── */}
        <CollapsibleSection
          title="Linked Accounts"
          sub={loading ? undefined : `${accounts.length} account${accounts.length !== 1 ? "s" : ""} connected`}
          defaultOpen={false}
          action={
            <Link href="/data-sources" onClick={e => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
              Manage <ChevronRight size={12} />
            </Link>
          }
        >
          <div>
            {loading ? (
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                <SkeletonBox h={40} /><SkeletonBox h={40} />
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: "16px 20px", textAlign: "center" as const }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>No accounts linked yet.</p>
                <Link href="/data-sources" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Connect an account →</Link>
              </div>
            ) : accounts.map((acc, i) => (
              <div key={acc.account_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < accounts.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A2540" }}>
                  {acc.bank_name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{acc.bank_name}</p>
                    {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 9, padding: "1px 5px" }}>Primary</Badge>}
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{acc.account_number_masked} · {relativeTime(acc.last_synced)}</p>
                </div>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── RECOMMENDATIONS ── */}
        <RecommendationsPanel recommendations={recommendations} loading={loading} />

        {/* ── RISK FLAGS (collapsible, closed by default) ── */}
        <CollapsibleSection
          title="Risk Flags"
          sub={riskFlags.length > 0 ? `${riskFlags.length} active flag${riskFlags.length > 1 ? "s" : ""} detected` : "No active flags"}
          badge={
            riskFlags.length > 0
              ? <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.08)", padding: "2px 7px", borderRadius: 9999 }}>{riskFlags.length}</span>
              : <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.08)", padding: "2px 7px", borderRadius: 9999 }}>✓</span>
          }
          defaultOpen={false}
        >
          <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {riskFlags.length === 0 ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#F0FDF4", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }}>
                <CheckCircle2 size={15} style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>No risk flags detected. Your profile is clean.</p>
              </div>
            ) : riskFlags.map((flag, i) => {
              const sc = severityCfg(flag.severity);
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10 }}>
                  <AlertCircle size={15} style={{ color: sc.icon, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", textTransform: "capitalize" as const }}>{flag.type}</p>
                      {flag.score_impact > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", flexShrink: 0 }}>−{flag.score_impact} pts</span>}
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{flag.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── IDENTITY HISTORY (collapsed by default) ── */}
        <CollapsibleSection
          title="Identity History"
          sub={snapshots.length > 0 ? `${snapshots.length} snapshots` : "No runs yet"}
          defaultOpen={false}
        >
          <div>
            {loading ? (
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                <SkeletonBox h={36} /><SkeletonBox h={36} /><SkeletonBox h={36} />
              </div>
            ) : snapshots.length === 0 ? (
              <div style={{ padding: "16px 20px", textAlign: "center" as const }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>No history yet. Pipeline has not run.</p>
              </div>
            ) : snapshots.map((snap, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, padding: "12px 20px", borderBottom: i < snapshots.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: "#374151" }}>{snap.taken_at}</p>
                  {i === 0 && <span style={{ fontSize: 10, color: "#9CA3AF" }}>latest</span>}
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: snap.score >= 760 ? "#10B981" : snap.score >= 640 ? "#F59E0B" : "#EF4444", fontFamily: "var(--font-display)" }}>{snap.score}</p>
                <Badge variant={snap.risk?.toLowerCase().includes("low") ? "success" : snap.risk?.toLowerCase().includes("medium") ? "warning" : "destructive"} style={{ fontSize: 10 }}>{snap.risk}</Badge>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{snap.quality}%</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── FINANCING BANNER ── */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: openToFinancing ? "rgba(0,212,255,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${openToFinancing ? "rgba(0,212,255,0.2)" : "rgba(245,158,11,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={16} color={openToFinancing ? "#00D4FF" : "#F59E0B"} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 2 }}>
                {openToFinancing ? "Connect with capital providers" : "Not visible to capital providers"}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                {openToFinancing ? "Share your identity with financers you trust." : "Enable Open to Financing in Settings."}
              </p>
            </div>
          </div>
          {openToFinancing ? (
            <Link href="/financers" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, background: "#00D4FF", color: "#0A2540", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <Database size={13} /> Manage Access
            </Link>
          ) : (
            <button onClick={() => setShowFinancingGate(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px", borderRadius: 9, background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Database size={13} /> Enable Access
            </button>
          )}
        </div>
      </div>

      {/* Financing gate modal */}
      {showFinancingGate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", padding: "28px 28px 24px", textAlign: "center" as const }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Info size={22} style={{ color: "#F59E0B" }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 8 }}>Open to Financing is off</p>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 24 }}>Enable <strong>Open to Financing</strong> in Settings first, then manage which financers can access your data.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowFinancingGate(false)} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <Link href="/settings?tab=account" onClick={() => setShowFinancingGate(false)} style={{ flex: 1, height: 42, borderRadius: 9, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
