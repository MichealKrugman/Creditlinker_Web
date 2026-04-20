"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck, RefreshCw, AlertCircle, CheckCircle2,
  Clock, ChevronRight, ArrowUpRight, TrendingUp,
  Database, Landmark, Info, X, Copy, CheckCheck,
  Building2, Zap, ChevronDown as ChevDown,
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

function RecommendationsPanel({ recommendations, loading }: { recommendations: Recommendation[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const totalGain = recommendations.reduce((s, r) => s + r.estimated_gain, 0);

  return (
    <Card>
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.25))", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} style={{ color: "#00A8CC" }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>How to Improve Your Score</p>
          </div>
          {!loading && recommendations.length > 0 && (
            <p style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 36 }}>
              {recommendations.length} actions identified · up to <span style={{ color: "#10B981", fontWeight: 700 }}>+{totalGain} pts</span> potential gain
            </p>
          )}
        </div>
      </div>
      <div style={{ padding: "14px 24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <><SkeletonBox h={52} r={10} /><SkeletonBox h={52} r={10} /><SkeletonBox h={52} r={10} /></>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2, flexWrap: "wrap" as const }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{rec.dimension}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", flexShrink: 0 }}>score {rec.current_score}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#10B981", fontFamily: "var(--font-display)" }}>+{rec.estimated_gain} pts</span>
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
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>What the pipeline detected</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{rec.cause}</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#0A5060", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Recommended action</p>
                    <p style={{ fontSize: 13, color: "#0A5060", lineHeight: 1.65 }}>{rec.action}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Estimated improvement after next pipeline run</p>
                    <Link href={rec.action_route} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      {rec.action_label} <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
          <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>Recommendations are generated after each pipeline run. Point gains are estimates.</p>
        </div>
      </div>
    </Card>
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
  return `${fmt(start)}${end ? ` – ${fmt(end)}` : " – present"}`;
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
      const [scoreRes, accountsRes, snapshotsRes, readinessRes] = await Promise.all([
        supabase.from("creditlinker_scores").select("*").eq("business_id", id).order("computed_at", { ascending: false }).limit(1).single(),
        supabase.from("linked_accounts").select("*").eq("business_id", id).order("is_primary", { ascending: false }),
        supabase.from("creditlinker_scores").select("computed_at, composite_score, risk_level, data_quality_score").eq("business_id", id).order("computed_at", { ascending: false }).limit(10),
        supabase.from("readiness_assessments").select("blockers, warnings, improvement_actions").eq("business_id", id).order("assessed_at", { ascending: false }).limit(1).single(),
      ]);

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

      // creditlinker_scores: one row per pipeline run, ordered newest first
      setSnapshots((snapshotsRes.data ?? []).map((s: any) => ({
        taken_at: new Date(s.computed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        score:    s.composite_score ?? 0,
        risk:     s.lender_risk ?? s.risk_level ?? "Unknown",
        quality:  s.data_quality_score ?? 0,
      })));

      if (readinessRes.data) {
        // Risk flags: combine blockers + warnings from the latest assessment
        const blockers: any[] = readinessRes.data.blockers ?? [];
        const warnings: any[] = readinessRes.data.warnings ?? [];
        setRiskFlags([
          ...blockers.map((b: any) => ({ type: b.type ?? b.code ?? "Blocker", severity: "high",   description: b.message ?? b.description ?? "", score_impact: b.score_impact ?? 0 })),
          ...warnings.map((w: any) => ({ type: w.type ?? w.code ?? "Warning", severity: "medium", description: w.message ?? w.description ?? "", score_impact: w.score_impact ?? 0 })),
        ]);

        // Recommendations: improvement_actions from the latest assessment
        const actions: any[] = readinessRes.data.improvement_actions ?? [];
        setRecommendations(actions.map((a: any) => ({
          dimension:       a.dimension ?? "General",
          dimension_color: DIM_META[a.dimension_key ?? ""]?.color ?? "#9CA3AF",
          current_score:   a.current_score ?? 0,
          cause:           a.cause ?? a.reason ?? "",
          action:          a.action ?? a.recommendation ?? "",
          estimated_gain:  a.estimated_gain ?? a.points_gain ?? 0,
          priority:        a.priority ?? "medium",
          action_route:    a.action_route ?? "/data-sources",
          action_label:    a.action_label ?? "Take action",
        })));
      }

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
  const coverage = formatCoverage(activeBusiness.data_coverage_start ?? null, activeBusiness.data_coverage_end ?? null);
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

        {/* ── IDENTITY STATUS BANNER ── */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" as const }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} color="#00D4FF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", letterSpacing: "-0.03em" }}>Financial Identity</h2>
                <Badge variant={status.variant} style={{ display: "flex", alignItems: "center", gap: 4 }}>{status.icon} {status.label}</Badge>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>ID: <span style={{ fontFamily: "monospace", color: "#6B7280" }}>{activeBusiness.financial_identity_id}</span></span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>Coverage: <span style={{ color: "#6B7280", fontWeight: 500 }}>{coverage}</span></span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>Last synced: <span style={{ color: "#6B7280", fontWeight: 500 }}>{relativeTime(activeBusiness.last_synced_at ?? null)}</span></span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={() => window.location.reload()}>
              <RefreshCw size={13} /> Refresh
            </Button>
            {score && (
              <button onClick={() => setShowShare(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                <ArrowUpRight size={13} /> Share Identity
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="fi-sidebar-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

            {/* Score ring */}
            <Card style={{ padding: "24px 20px", textAlign: "center" as const }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <SkeletonBox w={160} h={160} r={80} />
                  <SkeletonBox w="60%" h={20} />
                </div>
              ) : score ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <ScoreRingLarge score={score.composite_score} />
                  </div>
                  <div style={{ height: 1, background: "#F3F4F6", margin: "16px 0" }} />
                  <div className="fi-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" as const }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Data Quality</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{score.data_quality_score}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Months Analysed</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{score.data_months_analyzed}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center" as const }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No score yet. Connect a bank account and run the pipeline.</p>
                </div>
              )}
            </Card>

            {/* Linked accounts */}
            <Card>
              <SectionHeader title="Linked Accounts" action={
                <Link href="/data-sources" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                  Manage <ChevronRight size={12} />
                </Link>
              } />
              <div style={{ padding: "10px 0 8px" }}>
                {loading ? (
                  <div style={{ padding: "12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <SkeletonBox h={40} /><SkeletonBox h={40} />
                  </div>
                ) : accounts.length === 0 ? (
                  <div style={{ padding: "16px 24px", textAlign: "center" as const }}>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>No accounts linked yet.</p>
                    <Link href="/data-sources" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Connect an account →</Link>
                  </div>
                ) : accounts.map((acc, i) => (
                  <div key={acc.account_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", borderBottom: i < accounts.length - 1 ? "1px solid #F3F4F6" : "none" }}>
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
            </Card>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

            {/* Score dimensions */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap" as const, gap: 8 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 2 }}>Score Dimensions</h3>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Six independent financial health indicators, each scored 0–100.</p>
                </div>
                <Link href="/financial-analysis" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", flexShrink: 0 }}>
                  Deep analysis <ChevronRight size={13} />
                </Link>
              </div>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {[1,2,3,4,5,6].map(i => <SkeletonBox key={i} h={140} r={12} />)}
                </div>
              ) : dimensions.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center" as const, border: "1px solid #E5E7EB", borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>Run the pipeline to generate your score dimensions.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {dimensions.map(d => <DimensionCard key={d.key} d={d} />)}
                </div>
              )}
            </div>

            <RecommendationsPanel recommendations={recommendations} loading={loading} />

            {/* Risk flags */}
            <Card>
              <SectionHeader title="Risk Flags" sub={riskFlags.length > 0 ? `${riskFlags.length} active flag${riskFlags.length > 1 ? "s" : ""} detected` : "No active flags"} />
              <div style={{ padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {riskFlags.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" as const, padding: "8px 0" }}>No risk flags detected in the last pipeline run.</p>
                ) : riskFlags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
                    <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", textTransform: "capitalize" as const }}>{flag.type}</p>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{flag.score_impact} pts</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>{flag.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Identity history */}
            <Card>
              <SectionHeader title="Identity History" sub="Snapshots recorded after each pipeline run." />
              <div style={{ padding: "10px 0 8px" }}>
                {loading ? (
                  <div style={{ padding: "12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <SkeletonBox h={40} /><SkeletonBox h={40} /><SkeletonBox h={40} />
                  </div>
                ) : snapshots.length === 0 ? (
                  <div style={{ padding: "16px 24px", textAlign: "center" as const }}>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>No history yet. Pipeline has not run.</p>
                  </div>
                ) : (
                  <div className="cl-table-scroll">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6", minWidth: 400 }}>
                      {["Date", "Score", "Risk Level", "Quality"].map(h => (
                        <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
                      ))}
                    </div>
                    {snapshots.map((snap, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", padding: "12px 24px", borderBottom: i < snapshots.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", minWidth: 400 }}>
                        <p style={{ fontSize: 13, color: "#374151", fontWeight: i === 0 ? 600 : 400 }}>
                          {snap.taken_at} {i === 0 && <span style={{ fontSize: 11, color: "#9CA3AF" }}>(latest)</span>}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: snap.score >= 760 ? "#10B981" : snap.score >= 640 ? "#F59E0B" : "#EF4444", fontFamily: "var(--font-display)" }}>{snap.score}</p>
                        <Badge variant={snap.risk?.toLowerCase().includes("low") ? "success" : snap.risk?.toLowerCase().includes("medium") ? "warning" : "destructive"} style={{ width: "fit-content" }}>{snap.risk}</Badge>
                        <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{snap.quality}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Financing banner */}
            <div style={{ background: "#0A2540", borderRadius: 14, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: openToFinancing ? "rgba(0,212,255,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${openToFinancing ? "rgba(0,212,255,0.2)" : "rgba(245,158,11,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Landmark size={18} color={openToFinancing ? "#00D4FF" : "#F59E0B"} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
                    {openToFinancing ? "Ready to connect with capital providers?" : "Not visible to capital providers"}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    {openToFinancing ? "Share your financial identity with financers you trust — on your terms." : "Open to Financing is off. Enable it in Settings to become discoverable."}
                  </p>
                </div>
              </div>
              {openToFinancing ? (
                <Link href="/financers" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, background: "#00D4FF", color: "#0A2540", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                  <Database size={13} /> Manage Access
                </Link>
              ) : (
                <button onClick={() => setShowFinancingGate(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, fontWeight: 700, flexShrink: 0, cursor: "pointer" }}>
                  <Database size={13} /> Enable Access
                </button>
              )}
            </div>
          </div>
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
