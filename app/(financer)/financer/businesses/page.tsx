"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Filter, ArrowUpRight, ShieldCheck,
  SlidersHorizontal, ChevronDown, X, Building2,
  TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /institution/discovery → DiscoveryMatch[]
───────────────────────────────────────────────────────── */
/**
 * business_name is ONLY populated once access_granted.
 * Before that the business is anonymous — only the CL ID is known.
 * branch_cl_id is set when this is a branch/franchise entity under a parent.
 * parent_cl_id links the branch back to the root business.
 */
const BUSINESSES = [
  {
    id: "BIZ-7X9A",
    business_name: null,           // anonymous until consent
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Food & Beverage",
    revenue_band: "₦5M – ₦20M/mo",
    data_months: 24,
    capital_category: "Working Capital",
    match_score: 94,
    status: "pending" as const,
    dimensions: { revenue: 85, cashflow: 78, expense: 81, liquidity: 74, consistency: 80, risk: 69 },
  },
  {
    id: "BIZ-3K2M",
    business_name: null,
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Logistics",
    revenue_band: "₦10M – ₦50M/mo",
    data_months: 24,
    capital_category: "Asset Financing",
    match_score: 91,
    status: "pending" as const,
    dimensions: { revenue: 91, cashflow: 84, expense: 77, liquidity: 88, consistency: 85, risk: 76 },
  },
  {
    id: "BIZ-9P4L",
    business_name: null,
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Technology",
    revenue_band: "₦2M – ₦8M/mo",
    data_months: 12,
    capital_category: "Revenue Advance",
    match_score: 88,
    status: "access_requested" as const,
    dimensions: { revenue: 79, cashflow: 82, expense: 88, liquidity: 71, consistency: 77, risk: 83 },
  },
  {
    id: "BIZ-1R8T",
    business_name: "Kemi Superstores Ltd",  // revealed after consent
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Retail",
    revenue_band: "₦8M – ₦30M/mo",
    data_months: 18,
    capital_category: "Working Capital",
    match_score: 85,
    status: "access_granted" as const,
    dimensions: { revenue: 88, cashflow: 79, expense: 84, liquidity: 76, consistency: 82, risk: 74 },
  },
  {
    id: "BIZ-1R8T",            // same parent as above
    business_name: "Kemi Superstores — Ikeja Branch",
    branch_cl_id: "BIZ-1R8T-041",  // branch entity ID
    parent_cl_id: "BIZ-1R8T",
    sector: "Retail",
    revenue_band: "₦2M – ₦6M/mo",
    data_months: 10,
    capital_category: "Working Capital",
    match_score: 79,
    status: "access_granted" as const,
    dimensions: { revenue: 74, cashflow: 71, expense: 80, liquidity: 68, consistency: 75, risk: 70 },
  },
  {
    id: "BIZ-5N2W",
    business_name: null,
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Agriculture",
    revenue_band: "₦15M – ₦60M/mo",
    data_months: 20,
    capital_category: "Trade Finance",
    match_score: 83,
    status: "pending" as const,
    dimensions: { revenue: 83, cashflow: 76, expense: 79, liquidity: 81, consistency: 75, risk: 72 },
  },
  {
    id: "BIZ-6G3H",
    business_name: null,
    branch_cl_id: null,
    parent_cl_id: null,
    sector: "Healthcare",
    revenue_band: "₦3M – ₦12M/mo",
    data_months: 15,
    capital_category: "Equipment Financing",
    match_score: 80,
    status: "pending" as const,
    dimensions: { revenue: 77, cashflow: 81, expense: 85, liquidity: 69, consistency: 78, risk: 80 },
  },
];

const SECTORS = ["All Sectors", "Food & Beverage", "Logistics", "Technology", "Retail", "Agriculture", "Healthcare", "Manufacturing"];
const CAPITAL_CATS = ["All Types", "Working Capital", "Asset Financing", "Revenue Advance", "Trade Finance", "Equipment Financing", "Invoice Financing"];
const SORT_OPTIONS = ["Best Match", "Highest Score", "Most Data", "Recently Added"];

const DIMENSION_KEYS  = ["revenue", "cashflow", "expense", "liquidity", "consistency", "risk"] as const;
const DIMENSION_SHORT = ["Rev", "CF", "Exp", "Liq", "Con", "Risk"];
const DIMENSION_FULL  = ["Revenue Stability", "Cashflow Predictability", "Expense Discipline", "Liquidity Strength", "Financial Consistency", "Risk Profile"];
const DIMENSION_COLORS = ["#10B981", "#38BDF8", "#818CF8", "#F59E0B", "#10B981", "#EF4444"];

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────── */
type MatchStatus = "pending" | "access_requested" | "access_granted" | "access_denied";

function statusConfig(s: MatchStatus) {
  return {
    pending:          { label: "New Match",        variant: "secondary"    as const },
    access_requested: { label: "Request Sent",     variant: "warning"      as const },
    access_granted:   { label: "Access Granted",   variant: "success"      as const },
    access_denied:    { label: "Access Denied",    variant: "destructive"  as const },
  }[s];
}

/* ─────────────────────────────────────────────────────────
   MINI RADAR
───────────────────────────────────────────────────────── */
function DimensionRadar({ dims }: { dims: Record<typeof DIMENSION_KEYS[number], number> }) {
  const values = DIMENSION_KEYS.map(k => dims[k]);
  const cx = 52, cy = 52, maxR = 40;
  const N = 6;

  function polarToXY(i: number, r: number) {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map(frac =>
    Array.from({ length: N }, (_, i) => polarToXY(i, maxR * frac))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") + "Z"
  );

  // Data polygon
  const dataPath = values
    .map((v, i) => {
      const p = polarToXY(i, (v / 100) * maxR);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ") + "Z";

  // Axis lines
  const axes = Array.from({ length: N }, (_, i) => {
    const end = polarToXY(i, maxR);
    return `M${cx},${cy} L${end.x.toFixed(1)},${end.y.toFixed(1)}`;
  });

  return (
    <svg width="104" height="104" viewBox="0 0 104 104">
      {/* Grid */}
      {rings.map((d, i) => <path key={i} d={d} fill="none" stroke="#E5E7EB" strokeWidth="0.8" />)}
      {/* Axes */}
      {axes.map((d, i) => <path key={i} d={d} stroke="#E5E7EB" strokeWidth="0.8" />)}
      {/* Data fill */}
      <path d={dataPath} fill="rgba(0,212,255,0.12)" stroke="#00D4FF" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data points */}
      {values.map((v, i) => {
        const p = polarToXY(i, (v / 100) * maxR);
        return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#00D4FF" />;
      })}
      {/* Labels */}
      {DIMENSION_SHORT.map((label, i) => {
        const p = polarToXY(i, maxR + 10);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fontWeight="600" fill="#9CA3AF">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   BUSINESS CARD
───────────────────────────────────────────────────────── */
function BusinessCard({ biz }: { biz: typeof BUSINESSES[0] }) {
  const sc = statusConfig(biz.status);
  const dims = DIMENSION_KEYS.map(k => biz.dimensions[k]);
  const avgScore = Math.round(dims.reduce((a, b) => a + b, 0) / dims.length);

  return (
    <div style={{
      background: "white",
      border: "1px solid #E5E7EB",
      borderRadius: 14,
      overflow: "hidden",
      transition: "box-shadow 0.15s, border-color 0.15s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
      }}
    >
      {/* Card header */}
      <div style={{
        padding: "16px 18px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Avatar — shows initials if name is known, icon if anonymous */}
          <div style={{
            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
            background: biz.business_name ? "#0A2540" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800,
            color: biz.business_name ? "#00D4FF" : "#9CA3AF",
          }}>
            {biz.business_name
              ? biz.business_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
              : <Building2 size={16} color="#9CA3AF" />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" as const }}>
              {/* Business name (revealed) or CL ID (anonymous) */}
              <p style={{
                fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
                color: "#0A2540", letterSpacing: "-0.02em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 180,
              }}>
                {biz.business_name ?? biz.id}
              </p>
              <Badge variant={sc.variant} style={{ fontSize: 9, padding: "1px 6px", flexShrink: 0 }}>
                {sc.label}
              </Badge>
            </div>
            {/* CL ID tag — always visible, secondary when name is shown */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", fontFamily: "monospace",
                background: "#F3F4F6", padding: "1px 5px", borderRadius: 4, letterSpacing: "0.02em" }}>
                {biz.branch_cl_id ?? biz.id}
              </span>
              {biz.branch_cl_id && (
                <span style={{ fontSize: 9, color: "#9CA3AF" }}>
                  Branch of <span style={{ fontWeight: 700 }}>{biz.parent_cl_id}</span>
                </span>
              )}
              <span style={{ fontSize: 10, color: "#9CA3AF" }}>·</span>
              <span style={{ fontSize: 10, color: "#9CA3AF" }}>{biz.sector} · {biz.capital_category} · {biz.data_months}mo data</span>
            </div>
          </div>
        </div>
        {/* Match score */}
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <p style={{
            fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800,
            color: biz.match_score >= 90 ? "#10B981" : "#F59E0B",
            letterSpacing: "-0.04em", lineHeight: 1,
          }}>
            {biz.match_score}%
          </p>
          <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>match</p>
        </div>
      </div>

      {/* Radar + dimensions */}
      <div style={{
        padding: "14px 18px",
        display: "grid",
        gridTemplateColumns: "104px 1fr",
        gap: 14,
        alignItems: "center",
      }}>
        <DimensionRadar dims={biz.dimensions} />

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {DIMENSION_KEYS.map((k, i) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{DIMENSION_SHORT[i]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: DIMENSION_COLORS[i] }}>
                  {biz.dimensions[k]}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${biz.dimensions[k]}%`,
                  background: DIMENSION_COLORS[i], borderRadius: 9999,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 18px",
        borderTop: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p style={{ fontSize: 12, color: "#9CA3AF" }}>
          Revenue: <span style={{ fontWeight: 600, color: "#374151" }}>{biz.revenue_band}</span>
        </p>

        {biz.status === "access_granted" ? (
          <Link
            href={`/financer/business-profile?id=${biz.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              background: "#0A2540", color: "white",
              fontSize: 12, fontWeight: 600, textDecoration: "none",
            }}
          >
            View Profile <ArrowUpRight size={11} />
          </Link>
        ) : biz.status === "access_requested" ? (
          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> Awaiting response
          </span>
        ) : (
          <button
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "white",
              color: "#0A2540", fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "#0A2540";
              (e.currentTarget as HTMLElement).style.color = "white";
              (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "white";
              (e.currentTarget as HTMLElement).style.color = "#0A2540";
              (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
            }}
            // TODO: POST /institution/discovery/:match_id/request-access
          >
            Request Access <ArrowUpRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────────────────── */
function FilterSelect({
  value, options, onChange,
}: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none",
          padding: "7px 30px 7px 12px",
          borderRadius: 8,
          border: "1px solid #E5E7EB",
          background: "white",
          fontSize: 13, fontWeight: 500, color: "#0A2540",
          cursor: "pointer", outline: "none",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} style={{
        position: "absolute", right: 9, top: "50%",
        transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerBusinesses() {
  const [query,      setQuery]      = useState("");
  const [sector,     setSector]     = useState("All Sectors");
  const [capCat,     setCapCat]     = useState("All Types");
  const [sortBy,     setSortBy]     = useState("Best Match");

  const filtered = BUSINESSES.filter(b => {
    const matchQ   = query === "" || b.id.toLowerCase().includes(query.toLowerCase()) || b.sector.toLowerCase().includes(query.toLowerCase());
    const matchS   = sector === "All Sectors" || b.sector === sector;
    const matchC   = capCat === "All Types"   || b.capital_category === capCat;
    return matchQ && matchS && matchC;
  }).sort((a, b) => {
    if (sortBy === "Best Match")     return b.match_score - a.match_score;
    if (sortBy === "Highest Score")  return (b.dimensions.revenue + b.dimensions.cashflow) - (a.dimensions.revenue + a.dimensions.cashflow);
    if (sortBy === "Most Data")      return b.data_months - a.data_months;
    return 0;
  });

  const grantedCount   = BUSINESSES.filter(b => b.status === "access_granted").length;
  const requestedCount = BUSINESSES.filter(b => b.status === "access_requested").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            Businesses
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {BUSINESSES.length} businesses matched to your criteria ·{" "}
            <span style={{ color: "#10B981", fontWeight: 600 }}>{grantedCount} with access</span>
            {requestedCount > 0 && (
              <> · <span style={{ color: "#F59E0B", fontWeight: 600 }}>{requestedCount} pending response</span></>
            )}
          </p>
        </div>

        {/* Consent notice */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 8,
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}>
          <ShieldCheck size={13} style={{ color: "#00A8CC" }} />
          <p style={{ fontSize: 12, color: "#0A5060" }}>
            Business identities are anonymous until consent is granted.
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          flex: "1 1 220px", maxWidth: 320,
          height: 36, padding: "0 12px",
          borderRadius: 8, border: "1px solid #E5E7EB",
          background: "white",
        }}>
          <Search size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ID or sector…"
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 13, color: "#0A2540", background: "transparent",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        <FilterSelect value={sector}  options={SECTORS}      onChange={setSector} />
        <FilterSelect value={capCat}  options={CAPITAL_CATS} onChange={setCapCat} />

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "#E5E7EB" }} />

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={13} style={{ color: "#9CA3AF" }} />
          <FilterSelect value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        </div>

        <div style={{ marginLeft: "auto", fontSize: 13, color: "#9CA3AF" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Dimension legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {DIMENSION_SHORT.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: DIMENSION_COLORS[i] }} />
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{DIMENSION_FULL[i]}</span>
          </div>
        ))}
      </div>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "60px 24px", textAlign: "center" as const,
          background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
        }}>
          <Building2 size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No matches found</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Try adjusting your filters or update your matching criteria in Settings.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 14,
        }}>
          {filtered.map(b => <BusinessCard key={b.id} biz={b} />)}
        </div>
      )}
    </div>
  );
}
