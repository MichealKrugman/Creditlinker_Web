"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown,
  Building2, ShieldCheck, ArrowUpRight, Info, Loader2, Search, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type Dimension = { label: string; value: number; color: string };
type Metric    = { label: string; value: string; trend: "up" | "down" | "flat"; change: string };
type Expense   = { label: string; pct: number; amount: string; color: string };

type BusinessAnalysis = {
  consent_id:    string;
  business_id:   string;
  business_name: string;
  anonymized_id: string;
  granted_at:    string;
  consent_expiry: string | null;
  // from financial_identity snapshot — nullable until data exists
  data_months:   number;
  coverage:      string;
  dimensions:    Dimension[];
  metrics:       Metric[];
  revenue:       number[];
  cashflow:      number[];
  expenses:      Expense[];
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DIM_LABELS: Record<string, string> = {
  revenue_stability:       "Revenue Stability",
  cashflow_predictability: "Cashflow Predictability",
  expense_discipline:      "Expense Discipline",
  liquidity_strength:      "Liquidity Strength",
  financial_consistency:   "Financial Consistency",
  risk_profile:            "Risk Profile",
};
const DIM_COLORS = ["#10B981","#38BDF8","#818CF8","#F59E0B","#10B981","#EF4444"];

function formatNGN(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

/* Build analysis shape from consent + creditlinker_scores row */
function shapeAnalysis(
  consent: { consent_id: string; business_id: string; business_name: string; granted_at: string; permissions: Record<string,unknown> | null; anonymized_id: string },
  score: {
    composite_score?:      number;
    lender_risk?:          string;
    data_quality_score?:   number;
    data_months_analyzed?: number;
    dimensions?:           Record<string, { raw_score?: number }>;
    computed_at?:          string;
  } | null,
): BusinessAnalysis {
  const dimScores = (score?.dimensions ?? {}) as Record<string, { raw_score?: number }>;
  const dims: Dimension[] = Object.entries(DIM_LABELS).map(([k, label], i) => ({
    label,
    value: Math.round(dimScores[k]?.raw_score ?? 0),
    color: DIM_COLORS[i],
  }));

  const computedAt = score?.computed_at
    ? new Date(score.computed_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  const expiryRaw = (consent.permissions as Record<string,unknown> | null)?.expires_at as string | undefined;
  const expiryStr = expiryRaw ? new Date(expiryRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return {
    consent_id:     consent.consent_id,
    business_id:    consent.business_id,
    business_name:  consent.business_name,
    anonymized_id:  consent.anonymized_id,
    granted_at:     consent.granted_at,
    consent_expiry: expiryStr,
    data_months:    score?.data_months_analyzed ?? 0,
    coverage:       score ? `as of ${computedAt}` : "No data yet",
    dimensions:     dims,
    metrics:        [],
    revenue:        [],
    cashflow:       [],
    expenses:       [],
  };
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function trendIcon(t: "up" | "down" | "flat") {
  if (t === "up")   return <TrendingUp   size={12} style={{ color: "#10B981" }} />;
  if (t === "down") return <TrendingDown size={12} style={{ color: "#EF4444" }} />;
  return                   <Minus        size={12} style={{ color: "#9CA3AF" }} />;
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 72, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:12, color:"#D1D5DB" }}>No data</span></div>;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 280, H = 72;
  const pts = data.map((v, i) => ({ x: (i/(data.length-1))*W, y: H-((v-min)/range)*(H-8)-4 }));
  const path = pts.map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill = path + ` L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      <path d={fill} fill={color} fillOpacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />)}
    </svg>
  );
}

function Card({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, ...style }}>{children}</div>;
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
        .select("business_id, composite_score, lender_risk, data_quality_score, data_months_analyzed, dimensions, computed_at")
        .in("business_id", businessIds)
        .order("computed_at", { ascending: false });

      // Keep only the latest score per business
      const scoreMap: Record<string, any> = {};
      (scores ?? []).forEach((s: any) => {
        if (!scoreMap[s.business_id]) scoreMap[s.business_id] = s;
      });

      const shaped: BusinessAnalysis[] = consents.map((c: any) => {
        const biz = bizMap[c.business_id];
        return shapeAnalysis(
          {
            consent_id:    c.consent_id,
            business_id:   c.business_id,
            business_name: biz?.name ?? "",
            anonymized_id: biz?.financial_identity_id ?? c.business_id,
            granted_at:    c.granted_at,
            permissions:   c.permissions,
          },
          scoreMap[c.business_id] ?? null,
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
          {/* Dimension bars */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:10 }}>
            {biz.dimensions.map(d => (
              <Card key={d.label} style={{ padding:"14px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{d.label}</p>
                  <span style={{ fontSize:16, fontWeight:800, color:d.color, fontFamily:"var(--font-display)", letterSpacing:"-0.04em" }}>{d.value}</span>
                </div>
                <div style={{ height:5, borderRadius:9999, background:"#F3F4F6", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${d.value}%`, background:d.color, borderRadius:9999 }} />
                </div>
              </Card>
            ))}
          </div>

          {/* KPI metrics */}
          {biz.metrics.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14 }}>
              {biz.metrics.map(m => (
                <Card key={m.label} style={{ padding:"18px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                    {trendIcon(m.trend)}
                    {m.change && <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:500 }}>{m.change}</span>}
                  </div>
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.04em", lineHeight:1, marginBottom:4 }}>{m.value}</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>{m.label}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Sparklines */}
          {(biz.revenue.length > 1 || biz.cashflow.length > 1) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Card>
                <div style={{ padding:"18px 22px 0" }}>
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540", marginBottom:2 }}>Monthly Revenue</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>{biz.coverage}</p>
                </div>
                <div style={{ padding:"14px 22px 18px" }}>
                  <SparkLine data={biz.revenue} color="#0A2540" />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    {MONTHS.slice(0, biz.revenue.length).map(m => <span key={m} style={{ fontSize:9, color:"#9CA3AF", flex:1, textAlign:"center" as const }}>{m}</span>)}
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding:"18px 22px 0" }}>
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540", marginBottom:2 }}>Operating Cashflow</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>{biz.coverage}</p>
                </div>
                <div style={{ padding:"14px 22px 18px" }}>
                  <SparkLine data={biz.cashflow} color="#10B981" />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    {MONTHS.slice(0, biz.cashflow.length).map(m => <span key={m} style={{ fontSize:9, color:"#9CA3AF", flex:1, textAlign:"center" as const }}>{m}</span>)}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Expense breakdown */}
          {biz.expenses.length > 0 && (
            <Card>
              <div style={{ padding:"18px 22px 0" }}>
                <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>Expense Breakdown</p>
                <p style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Average monthly operating expenses by category</p>
              </div>
              <div style={{ padding:"16px 22px 22px", display:"flex", flexDirection:"column", gap:12 }}>
                {biz.expenses.map(e => (
                  <div key={e.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:9, height:9, borderRadius:2, background:e.color }} />
                        <span style={{ fontSize:13, color:"#374151", fontWeight:500, textTransform:"capitalize" as const }}>{e.label}</span>
                      </div>
                      <div style={{ display:"flex", gap:12 }}>
                        <span style={{ fontSize:12, color:"#9CA3AF" }}>{e.amount}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#0A2540" }}>{e.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:7, borderRadius:9999, background:"#F3F4F6", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${e.pct}%`, background:e.color, borderRadius:9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
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
