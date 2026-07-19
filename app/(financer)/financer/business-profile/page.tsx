"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowUpRight, Building2, TrendingUp,
  ArrowDownLeft, ChevronRight, AlertCircle, Info, Loader2,
  CheckCircle2, MessageSquare, Send, X, Search, SlidersHorizontal,
  ChevronLeft, ArrowLeftRight, Repeat2, GitFork, Lock,
  Landmark, Users, Briefcase, AlertTriangle, Gauge, Network, Activity,
  LineChart, TrendingDown, Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { sendFinancerMessage } from "@/lib/api";
import { getMyInstitutionId } from "@/lib/institution";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";
const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type DimensionScore = {
  key:   string;
  label: string;
  value: number;
  color: string;
};

type Transaction = {
  id:                   string;
  date:                 string;
  counterparty_cluster: string | null;
  amount:               number;
  direction:            "credit" | "debit";
  category:             string;
  is_recurring:         boolean;
  is_internal_transfer: boolean;
  flags:                string[];
  balance_after:        number | null;
};

type TransactionsResponse = {
  transactions: Transaction[];
  total:        number;
  page:         number;
  per_page:     number;
  total_pages:  number;
  stats: { total_in: number; total_out: number; net: number };
  meta: {
    categories:  string[];
    date_range:  { from: string; to: string } | null;
  };
};

type ProfileData = {
  business_id:         string;
  consent_id:          string;
  business_name:       string | null;
  anonymized_id:       string;
  sector:              string | null;
  kyc_status:          string | null;
  registration_number: string | null;
  data_months:         number;
  coverage:            string;
  consent_expiry:      string | null;
  overall_score:       number | null;
  risk_level:          string | null;
  data_quality_score:  number | null;
  dimensions:          DimensionScore[];
};

// ── Graph types ──────────────────────────────────────────
type GraphNode = {
  id:           string;
  cl_id:        string | null;
  node_type:    string | null;
  display_name: string | null;
  legal_name:   string | null;
  status:       string | null;
  masked:       boolean;
};

type GraphEdge = {
  edge_id:           string;
  from_node_id:      string;
  to_node_id:        string;
  relationship_type: string;
  status:            string;
  weight:            number | null;
  currency:          string | null;
  depth:             number;
};

type GraphSummary = {
  total_nodes_found: number;
  total_edges_found: number;
  max_depth_reached: number;
  total_exposure_ngn: number;
  masked_node_count: number;
};

type GraphData = {
  origin_node: GraphNode;
  nodes:       GraphNode[];
  edges:       GraphEdge[];
  summary:     GraphSummary;
};

// ── Overview tab types (trust + exposure) ───────────────
type FullTrustScores = {
  node_id:                   string;
  repayment_score:           number;
  transaction_consistency:   number;
  obligation_load_ngn:       number;
  guarantor_exposure_ngn:    number;
  supplier_payment_score:    number;
  business_longevity_days:   number;
  active_relationship_count: number;
  default_count:             number;
  network_risk_score:        number;
  on_chain_net_worth_usd:    number;
  on_chain_activity_score:   number;
  computed_at:               string;
};

type ExposureData = {
  own_obligations_ngn:        number;
  guaranteed_obligations_ngn: number;
  owed_to_this_entity_ngn:    number;
  network_total_ngn:          number;
  by_relationship_type:       Record<string, number>;
  network_risk_flags:         number;
};

// ── Ownership tab types ──────────────────────────────────
type OwnershipEntry = {
  node: GraphNode;
  relationship_type: string;
  weight: number | null;
  depth: number;
  owners: OwnershipEntry[];
};

type OwnershipData = {
  origin_node: GraphNode;
  ownership_chain: OwnershipEntry[];
  summary: { total_owners_found: number; max_depth_reached: number };
};

// ── Activity tab types ───────────────────────────────────
type NodeEventRow = {
  event_id?: string;
  event_type: string;
  occurred_at: string;
  payload?: Record<string, unknown> | null;
};

type EdgeGroup = {
  edge_id: string;
  relationship_type: string | null;
  status: string | null;
  events: NodeEventRow[];
};

type ActivityData = {
  node_events: NodeEventRow[];
  edge_groups: EdgeGroup[];
  total: number;
};

// ── On-chain types (Phase 3) ────────────────────────────
type ChainHolding = {
  chain_account_id:        string;
  asset:                   string;
  balance:                 number;
  balance_usd_equivalent:  number | null;
  last_fetched_at:         string;
};

type ChainAccount = {
  id:           string;
  chain:        string;
  address:      string;
  address_type: string | null;
  verified:     boolean;
  verified_at:  string | null;
  verified_by:  string | null;
  holdings:     ChainHolding[];
};

type TrustScores = {
  on_chain_net_worth_usd:  number | null;
  on_chain_activity_score: number | null;
  network_risk_score:      number | null;
  repayment_score:         number | null;
};

// ── Cashflow intelligence types (fetched directly from
// cashflow_forecasts, same JSON shape as CashflowForecast in
// SDK/engine/cashflow-forecast.engine.ts) ──────────────────
type CfMonthlyPoint = {
  month:        string;
  inflow:       number;
  outflow:      number;
  net_cashflow: number;
  trend:        number;
  seasonality:  number;
  residual:     number;
};

type CfForecastPoint = {
  month:       string;
  inflow:      number;
  outflow:     number;
  forecast:    number;
  upper_bound: number;
  lower_bound: number;
};

type CashflowForecastBlob = {
  forecast_id:          string;
  business_id:          string;
  computed_at:          string;
  historical:           CfMonthlyPoint[];
  forecast:             CfForecastPoint[];
  trend_direction:      "improving" | "declining" | "stable";
  trend_slope:          number;
  seasonality_detected: boolean;
  peak_month:           string | null;
  trough_month:         string | null;
  data_months_used:     number;
};

const DIM_META: Record<string, { label: string; color: string }> = {
  revenue_stability:       { label: "Revenue Stability",       color: "#10B981" },
  cashflow_predictability: { label: "Cashflow Predictability", color: "#38BDF8" },
  expense_discipline:      { label: "Expense Discipline",      color: "#818CF8" },
  liquidity_strength:      { label: "Liquidity Strength",      color: "#F59E0B" },
  financial_consistency:   { label: "Financial Consistency",   color: "#10B981" },
  risk_profile:            { label: "Risk Profile",            color: "#EF4444" },
};

// Relationship type display labels
const REL_LABELS: Record<string, string> = {
  BORROWER_OF:      "Borrower",
  LENDER_TO:        "Lender",
  GUARANTOR_FOR:    "Guarantor for",
  SUPPLIER_TO:      "Supplier to",
  CUSTOMER_OF:      "Customer of",
  EMPLOYER_OF:      "Employer of",
  EMPLOYED_BY:      "Employed by",
  DIRECTOR_OF:      "Director of",
  SHAREHOLDER_OF:   "Shareholder of",
  INVOICE_DEBTOR:   "Invoice debtor",
  BNPL_ACCOUNT:     "BNPL account",
  ACCOUNT_HOLDER_AT:"Account holder at",
  SUBSIDIARY_OF:    "Subsidiary of",
  RELATED_PARTY:    "Related party",
};

const NODE_TYPE_COLORS: Record<string, string> = {
  BUSINESS:      "#0A2540",
  FINANCIAL_INST:"#7C3AED",
  INDIVIDUAL:    "#0369A1",
  COOPERATIVE:   "#065F46",
  NGO:           "#92400E",
  GOVERNMENT:    "#991B1B",
  TRUST:         "#374151",
};

const EDGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "#10B981",
  CLOSED:   "#9CA3AF",
  DISPUTED: "#F59E0B",
  DEFAULTED:"#EF4444",
};

const CHAIN_LABELS: Record<string, string> = {
  ethereum: "Ethereum",
  bitcoin:  "Bitcoin",
  solana:   "Solana",
  tron:     "Tron",
};

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  bitcoin:  "#F7931A",
  solana:   "#14F195",
  tron:     "#EF0027",
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtAddress(addr: string) {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function riskVariant(r: string | null) {
  if (!r) return "secondary" as const;
  if (r.toLowerCase().includes("low"))    return "success"     as const;
  if (r.toLowerCase().includes("medium")) return "warning"     as const;
  return "destructive" as const;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    Revenue: "#10B981", Payroll: "#F59E0B", Tax: "#EF4444",
    Operations: "#6B7280", Transfer: "#38BDF8", Rent: "#F59E0B",
  };
  return map[cat] ?? "#9CA3AF";
}

function nodeTypeIcon(type: string | null) {
  switch (type) {
    case "FINANCIAL_INST": return <Landmark size={12} />;
    case "INDIVIDUAL":     return <Users size={12} />;
    case "BUSINESS":       return <Briefcase size={12} />;
    default:               return <Building2 size={12} />;
  }
}

function humanizeEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: active ? "#0A2540" : "#E5E7EB", background: active ? "#0A2540" : "white", color: active ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
      {label}
    </button>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: color ?? "#0A2540", letterSpacing: "-0.03em" }}>{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   OWNERSHIP TREE ROW — recursive renderer for OwnershipEntry
───────────────────────────────────────────────────────── */
function OwnershipNodeRow({ entry }: { entry: OwnershipEntry }) {
  const nodeColor = NODE_TYPE_COLORS[entry.node?.node_type ?? ""] ?? "#374151";
  const name = entry.node?.masked
    ? "Undisclosed entity"
    : (entry.node?.display_name ?? entry.node?.legal_name ?? "Unknown");

  return (
    <div style={{ marginLeft: (entry.depth - 1) * 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: entry.node?.masked ? "#F9FAFB" : `${nodeColor}15`,
          color: entry.node?.masked ? "#D1D5DB" : nodeColor,
          border: `1px solid ${entry.node?.masked ? "#E5E7EB" : `${nodeColor}30`}`,
        }}>
          {entry.node?.masked ? <Lock size={11} /> : nodeTypeIcon(entry.node?.node_type ?? null)}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: entry.node?.masked ? "#9CA3AF" : "#0A2540", fontStyle: entry.node?.masked ? "italic" : "normal" }}>
            {name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{REL_LABELS[entry.relationship_type] ?? entry.relationship_type}</span>
            {entry.weight != null && entry.weight > 0 && (
              <>
                <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{entry.weight}%</span>
              </>
            )}
          </div>
        </div>
      </div>
      {entry.owners.length > 0 && (
        <div style={{ borderLeft: "1.5px solid #F3F4F6", paddingLeft: 4 }}>
          {entry.owners.map((child, i) => (
            <OwnershipNodeRow key={`${child.node?.id ?? "masked"}-${i}`} entry={child} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   GRAPH PANEL COMPONENT — tabbed (J2)
   Collapsed by default. On expand: resolves the business's
   graph node (direct RLS-scoped query, same as before), then
   lazily loads whichever of the four sub-views is selected:
   Overview (trust + exposure), Relationships (multi-hop via
   graph-discover), Ownership (graph-discover-ownership),
   Activity (graph-node-events-list, grouped by target).
   Consent-gating is never re-implemented here — a business
   this financer has no active consent for simply fails node
   resolution (RLS-scoped, resolves to "not found" either way)
   and shows the same graceful message as "no graph node yet".
   No trust-score recompute button — that's a business-owner-
   only action per J2's spec.
───────────────────────────────────────────────────────── */
type GraphTab = "overview" | "relationships" | "ownership" | "activity";

function RelationshipGraphPanel({
  businessId,
  token,
  displayName,
}: {
  businessId: string;
  token: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState<GraphTab>("overview");

  // Node resolution — shared across all four tabs
  const [clId,          setClId]          = useState<string | null>(null);
  const [resolving,     setResolving]     = useState(false);
  const [resolveError,  setResolveError]  = useState<string | null>(null);
  const [noNode,        setNoNode]        = useState(false);

  // Overview tab state
  const [trust,         setTrust]         = useState<FullTrustScores | null>(null);
  const [exposure,      setExposure]      = useState<ExposureData | null>(null);
  const [ovLoading,     setOvLoading]     = useState(false);
  const [ovError,       setOvError]       = useState<string | null>(null);

  // Relationships tab state (unchanged behavior from the original panel)
  const [graphData,   setGraphData]   = useState<GraphData | null>(null);
  const [relLoading,  setRelLoading]  = useState(false);
  const [relError,    setRelError]    = useState<string | null>(null);
  const [depthFilter, setDepthFilter] = useState<number | null>(null);
  const [relFilter,   setRelFilter]   = useState<string>("");
  const [direction,   setDirection]   = useState<"both" | "outbound" | "inbound">("both");

  // Ownership tab state
  const [ownership,    setOwnership]    = useState<OwnershipData | null>(null);
  const [ownLoading,   setOwnLoading]   = useState(false);
  const [ownError,     setOwnError]     = useState<string | null>(null);

  // Activity tab state
  const [activity,      setActivity]      = useState<ActivityData | null>(null);
  const [actLoading,    setActLoading]    = useState(false);
  const [actError,      setActError]      = useState<string | null>(null);

  const authedFetch = useCallback((path: string) => fetch(
    `${API_BASE}${path}`,
    { headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
  ), [token]);

  /** Resolves cl_id once and caches it — every tab depends on this. */
  const resolveClId = useCallback(async (): Promise<string | null> => {
    if (clId) return clId;
    setResolving(true);
    setResolveError(null);
    try {
      const { data: matchedNode, error: nodeErr } = await supabase
        .schema("graph")
        .from("nodes")
        .select("cl_id")
        .eq("linked_entity_type", "business")
        .eq("linked_entity_id", businessId)
        .maybeSingle();

      if (nodeErr) throw new Error("Could not look up graph node for this business.");
      if (!matchedNode) {
        setNoNode(true);
        return null;
      }
      setClId(matchedNode.cl_id);
      return matchedNode.cl_id;
    } catch (e: any) {
      setResolveError(e.message ?? "Failed to resolve this business's graph node.");
      return null;
    } finally {
      setResolving(false);
    }
  }, [clId, businessId]);

  /* ── Overview ── */
  const fetchOverview = useCallback(async () => {
    const id = await resolveClId();
    if (!id) return;
    setOvLoading(true);
    setOvError(null);
    try {
      const [trustRes, expRes] = await Promise.all([
        authedFetch(`/graph-node-trust/${encodeURIComponent(id)}/trust`),
        authedFetch(`/graph-discover-exposure/${encodeURIComponent(id)}/exposure?depth=3&decay=0.3`),
      ]);
      if (!trustRes.ok) throw new Error((await trustRes.json().catch(() => ({}))).error?.message ?? "Failed to load trust score.");
      if (!expRes.ok)   throw new Error((await expRes.json().catch(() => ({}))).error?.message ?? "Failed to load exposure data.");
      const trustJson = await trustRes.json();
      const expJson   = await expRes.json();
      setTrust(trustJson.data.trust_scores);
      setExposure(expJson.data);
    } catch (e: any) {
      setOvError(e.message ?? "Failed to load overview.");
    } finally {
      setOvLoading(false);
    }
  }, [resolveClId, authedFetch]);

  /* ── Relationships (multi-hop, same as original implementation) ── */
  const fetchRelationships = useCallback(async (dir: "both" | "outbound" | "inbound") => {
    const id = await resolveClId();
    if (!id) return;
    setRelLoading(true);
    setRelError(null);
    try {
      const res = await authedFetch(`/graph-discover/${encodeURIComponent(id)}?depth=3&direction=${dir}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? `Graph fetch failed (${res.status})`);
      const json = await res.json();
      setGraphData(json.data);
    } catch (e: any) {
      setRelError(e.message ?? "Failed to load relationship graph.");
    } finally {
      setRelLoading(false);
    }
  }, [resolveClId, authedFetch]);

  /* ── Ownership ── */
  const fetchOwnership = useCallback(async () => {
    const id = await resolveClId();
    if (!id) return;
    setOwnLoading(true);
    setOwnError(null);
    try {
      const res = await authedFetch(`/graph-discover-ownership/${encodeURIComponent(id)}/ownership?max_depth=3`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? "Failed to load ownership chain.");
      const json = await res.json();
      setOwnership(json.data);
    } catch (e: any) {
      setOwnError(e.message ?? "Failed to load ownership chain.");
    } finally {
      setOwnLoading(false);
    }
  }, [resolveClId, authedFetch]);

  /* ── Activity ── */
  const fetchActivity = useCallback(async () => {
    const id = await resolveClId();
    if (!id) return;
    setActLoading(true);
    setActError(null);
    try {
      const res = await authedFetch(`/graph-node-events-list/${encodeURIComponent(id)}/events?group_by_target=true&limit=50`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? "Failed to load activity timeline.");
      const json = await res.json();
      setActivity(json.data);
    } catch (e: any) {
      setActError(e.message ?? "Failed to load activity timeline.");
    } finally {
      setActLoading(false);
    }
  }, [resolveClId, authedFetch]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !clId && !noNode && !resolving) fetchOverview();
  }

  function handleTabChange(next: GraphTab) {
    setTab(next);
    if (next === "overview"      && !trust && !ovLoading)       fetchOverview();
    if (next === "relationships" && !graphData && !relLoading)  fetchRelationships(direction);
    if (next === "ownership"     && !ownership && !ownLoading)  fetchOwnership();
    if (next === "activity"      && !activity && !actLoading)   fetchActivity();
  }

  function handleDirectionChange(dir: "both" | "outbound" | "inbound") {
    setDirection(dir);
    setGraphData(null);
    fetchRelationships(dir);
  }

  // Build a node lookup map for rendering edge endpoints (relationships tab)
  const nodeMap: Record<string, GraphNode> = {};
  if (graphData) {
    for (const n of graphData.nodes) nodeMap[n.id] = n;
    nodeMap[graphData.origin_node.id] = graphData.origin_node;
  }

  const visibleEdges = (graphData?.edges ?? []).filter(e => {
    if (depthFilter !== null && e.depth !== depthFilter) return false;
    if (relFilter && e.relationship_type !== relFilter) return false;
    return true;
  });
  const relTypes = Array.from(new Set((graphData?.edges ?? []).map(e => e.relationship_type)));
  const depths   = Array.from(new Set((graphData?.edges ?? []).map(e => e.depth))).sort();

  const TABS: { key: GraphTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",      label: "Overview",      icon: <Gauge size={12} /> },
    { key: "relationships", label: "Relationships", icon: <GitFork size={12} /> },
    { key: "ownership",     label: "Ownership",      icon: <Network size={12} /> },
    { key: "activity",      label: "Activity",       icon: <Activity size={12} /> },
  ];

  return (
    <Card>
      {/* Header — always visible */}
      <button
        onClick={handleToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: open ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
            <GitFork size={13} color={open ? "#00D4FF" : "#9CA3AF"} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Relationship Graph</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {clId ? "Overview, relationships, ownership and activity for this business" : "Expand to view financial relationships and network exposure"}
            </p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "#9CA3AF", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>

      {/* Body — only when open */}
      {open && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>

          {/* Resolving node */}
          {resolving && !clId && (
            <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Locating this business in the graph…</p>
            </div>
          )}

          {/* No graph node — consent-gated or genuinely absent, same graceful message either way */}
          {!resolving && noNode && (
            <div style={{ padding: "40px 22px", textAlign: "center" as const }}>
              <GitFork size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Graph data unavailable</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", maxWidth: 340, margin: "0 auto" }}>
                {displayName} does not yet have a graph node visible to you — this appears automatically once a financing record exists and active consent is in place.
              </p>
            </div>
          )}

          {/* Node resolution failed outright */}
          {!resolving && !noNode && resolveError && (
            <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#6B7280" }}>{resolveError}</p>
            </div>
          )}

          {/* Tabs + content — only once a node is resolved */}
          {clId && (
            <>
              <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => handleTabChange(t.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 13px", borderRadius: 8, border: "1.5px solid",
                      borderColor: tab === t.key ? "#0A2540" : "#E5E7EB",
                      background: tab === t.key ? "#0A2540" : "white",
                      color: tab === t.key ? "white" : "#6B7280",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div style={{ paddingBottom: 4 }}>
                  {ovLoading && (
                    <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading trust signals and exposure…</p>
                    </div>
                  )}
                  {!ovLoading && ovError && (
                    <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{ovError}</p>
                    </div>
                  )}
                  {!ovLoading && !ovError && trust && (
                    <div style={{ padding: "14px 22px 0" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Trust signals</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                        <StatBox label="Repayment" value={`${Math.round(trust.repayment_score)}/100`} color={trust.repayment_score >= 70 ? "#10B981" : trust.repayment_score >= 40 ? "#F59E0B" : "#EF4444"} />
                        <StatBox label="Consistency" value={`${Math.round(trust.transaction_consistency)}/100`} />
                        <StatBox label="Network Risk" value={`${Math.round(trust.network_risk_score)}/100`} color={trust.network_risk_score <= 20 ? "#10B981" : trust.network_risk_score <= 50 ? "#F59E0B" : "#EF4444"} />
                        <StatBox label="Active Relations" value={String(trust.active_relationship_count)} />
                      </div>
                      {trust.default_count > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9 }}>
                          <AlertTriangle size={12} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>{trust.default_count} recorded default{trust.default_count !== 1 ? "s" : ""} on this business's own relationships.</p>
                        </div>
                      )}

                      {exposure && (
                        <>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Network exposure</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                            <StatBox label="Own Obligations" value={exposure.own_obligations_ngn > 0 ? fmt(exposure.own_obligations_ngn) : "—"} />
                            <StatBox label="Guaranteed" value={exposure.guaranteed_obligations_ngn > 0 ? fmt(exposure.guaranteed_obligations_ngn) : "—"} color={exposure.guaranteed_obligations_ngn > 0 ? "#F59E0B" : undefined} />
                            <StatBox label="Owed To Them" value={exposure.owed_to_this_entity_ngn > 0 ? fmt(exposure.owed_to_this_entity_ngn) : "—"} color="#10B981" />
                            <StatBox label="Network Total" value={exposure.network_total_ngn > 0 ? fmt(exposure.network_total_ngn) : "—"} />
                          </div>
                          {Object.keys(exposure.by_relationship_type).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 12 }}>
                              {Object.entries(exposure.by_relationship_type).map(([type, amt]) => (
                                <span key={type} style={{ fontSize: 11, fontWeight: 600, color: "#374151", background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 6, padding: "3px 8px" }}>
                                  {REL_LABELS[type] ?? type}: {fmt(amt)}
                                </span>
                              ))}
                            </div>
                          )}
                          {exposure.network_risk_flags > 0 && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9 }}>
                              <AlertTriangle size={12} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                              <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>{exposure.network_risk_flags} defaulted relationship{exposure.network_risk_flags !== 1 ? "s" : ""} within this business's wider network (identities not disclosed).</p>
                            </div>
                          )}
                        </>
                      )}

                      <div style={{ padding: "10px 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
                        <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>Trust signals are computed from this business's own relationships and events; network figures never name a counterparty.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── RELATIONSHIPS ── */}
              {tab === "relationships" && (
                <div>
                  <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Direction</span>
                    <FilterPill label="Both directions" active={direction === "both"} onClick={() => handleDirectionChange("both")} />
                    <FilterPill label="What they owe" active={direction === "outbound"} onClick={() => handleDirectionChange("outbound")} />
                    <FilterPill label="Owed to them" active={direction === "inbound"} onClick={() => handleDirectionChange("inbound")} />
                  </div>

                  {relLoading && (
                    <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Traversing relationship graph…</p>
                    </div>
                  )}

                  {!relLoading && relError && (
                    <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{relError}</p>
                    </div>
                  )}

                  {!relLoading && !relError && graphData && graphData.edges.length === 0 && (
                    <div style={{ padding: "40px 22px", textAlign: "center" as const }}>
                      <GitFork size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No relationships found</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{displayName} has no recorded financial relationships in the graph yet.</p>
                    </div>
                  )}

                  {!relLoading && !relError && graphData && graphData.edges.length > 0 && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "14px 22px" }}>
                        <StatBox label="Relationships" value={String(graphData.summary.total_edges_found)} />
                        <StatBox label="Total Exposure" value={graphData.summary.total_exposure_ngn > 0 ? fmt(graphData.summary.total_exposure_ngn) : "—"} color="#0A2540" />
                        <StatBox label="Network Depth" value={`${graphData.summary.max_depth_reached} hop${graphData.summary.max_depth_reached !== 1 ? "s" : ""}`} />
                        <StatBox label="Hidden Entities" value={String(graphData.summary.masked_node_count)} color={graphData.summary.masked_node_count > 0 ? "#F59E0B" : "#9CA3AF"} />
                      </div>

                      {graphData.summary.masked_node_count > 0 && (
                        <div style={{ margin: "0 22px 12px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9 }}>
                          <Lock size={12} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
                            {graphData.summary.masked_node_count} counterpart{graphData.summary.masked_node_count !== 1 ? "ies are" : "y is"} not disclosed — their identity is only visible to parties with direct consent. Relationship metadata (type, amount, status) is still shown.
                          </p>
                        </div>
                      )}

                      {(relTypes.length > 1 || depths.length > 1) && (
                        <div style={{ padding: "0 22px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                          {depths.length > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 44 }}>Depth</span>
                              <FilterPill label="All" active={depthFilter === null} onClick={() => setDepthFilter(null)} />
                              {depths.map(d => (
                                <FilterPill key={d} label={`Hop ${d}`} active={depthFilter === d} onClick={() => setDepthFilter(d)} />
                              ))}
                            </div>
                          )}
                          {relTypes.length > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 44 }}>Type</span>
                              <FilterPill label="All" active={relFilter === ""} onClick={() => setRelFilter("")} />
                              {relTypes.map(r => (
                                <FilterPill key={r} label={REL_LABELS[r] ?? r} active={relFilter === r} onClick={() => setRelFilter(r)} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ borderTop: "1px solid #F3F4F6" }}>
                        {visibleEdges.length === 0 ? (
                          <div style={{ padding: "24px 22px", textAlign: "center" as const }}>
                            <p style={{ fontSize: 13, color: "#9CA3AF" }}>No relationships match the selected filters.</p>
                          </div>
                        ) : (
                          visibleEdges.map((edge, i) => {
                            const isOrigin    = edge.from_node_id === graphData.origin_node.id;
                            const counterpartId = isOrigin ? edge.to_node_id : edge.from_node_id;
                            const counterpart   = nodeMap[counterpartId];
                            const counterpartName = counterpart?.masked
                              ? "Undisclosed entity"
                              : (counterpart?.display_name ?? counterpart?.legal_name ?? "Unknown");
                            const nodeColor = NODE_TYPE_COLORS[counterpart?.node_type ?? ""] ?? "#374151";
                            const edgeColor = EDGE_STATUS_COLORS[edge.status] ?? "#9CA3AF";
                            const depthLabel = edge.depth === 1 ? "Direct" : `${edge.depth} hops away`;

                            return (
                              <div
                                key={edge.edge_id}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: i < visibleEdges.length - 1 ? "1px solid #F9FAFB" : "none" }}
                              >
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: counterpart?.masked ? "#F9FAFB" : `${nodeColor}15`,
                                  color: counterpart?.masked ? "#D1D5DB" : nodeColor,
                                  border: `1px solid ${counterpart?.masked ? "#E5E7EB" : `${nodeColor}30`}`,
                                }}>
                                  {counterpart?.masked ? <Lock size={12} /> : nodeTypeIcon(counterpart?.node_type ?? null)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: counterpart?.masked ? "#9CA3AF" : "#0A2540", fontStyle: counterpart?.masked ? "italic" : "normal" }}>
                                      {counterpartName}
                                    </p>
                                    {counterpart?.node_type && !counterpart.masked && (
                                      <span style={{ fontSize: 9, fontWeight: 700, color: nodeColor, background: `${nodeColor}12`, padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em" }}>
                                        {counterpart.node_type.replace("_", " ")}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                                    <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>
                                      {isOrigin ? "→" : "←"} {REL_LABELS[edge.relationship_type] ?? edge.relationship_type}
                                    </span>
                                    <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
                                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{depthLabel}</span>
                                  </div>
                                </div>

                                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                  {edge.weight != null && edge.weight > 0 && (
                                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", letterSpacing: "-0.03em" }}>
                                      {fmt(edge.weight)}
                                    </p>
                                  )}
                                  <span style={{ fontSize: 10, fontWeight: 700, color: edgeColor, background: `${edgeColor}15`, padding: "1px 6px", borderRadius: 4 }}>
                                    {edge.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {graphData.edges.some(e => e.status === "DEFAULTED") && (
                        <div style={{ margin: "12px 22px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9 }}>
                          <AlertTriangle size={12} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>
                            One or more relationships in this network carry a DEFAULTED status. Review carefully before proceeding.
                          </p>
                        </div>
                      )}

                      <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                        <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                          Showing relationships up to 3 hops from {displayName}. Edge metadata is visible under consent; counterparty identities are only shown where you have independent access.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── OWNERSHIP ── */}
              {tab === "ownership" && (
                <div>
                  {ownLoading && (
                    <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Tracing ownership chain…</p>
                    </div>
                  )}
                  {!ownLoading && ownError && (
                    <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{ownError}</p>
                    </div>
                  )}
                  {!ownLoading && !ownError && ownership && ownership.ownership_chain.length === 0 && (
                    <div style={{ padding: "40px 22px", textAlign: "center" as const }}>
                      <Network size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No ownership records found</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>No shareholders, directors, or parent entities are recorded for {displayName} in the graph.</p>
                    </div>
                  )}
                  {!ownLoading && !ownError && ownership && ownership.ownership_chain.length > 0 && (
                    <>
                      <div style={{ padding: "14px 22px 4px" }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{ownership.summary.total_owners_found} owner{ownership.summary.total_owners_found !== 1 ? "s" : ""} found, up to {ownership.summary.max_depth_reached} level{ownership.summary.max_depth_reached !== 1 ? "s" : ""} up.</p>
                      </div>
                      <div style={{ padding: "6px 22px 18px" }}>
                        {ownership.ownership_chain.map((entry, i) => (
                          <OwnershipNodeRow key={`${entry.node?.id ?? "masked"}-${i}`} entry={entry} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── ACTIVITY ── */}
              {tab === "activity" && (
                <div>
                  {actLoading && (
                    <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
                      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading activity timeline…</p>
                    </div>
                  )}
                  {!actLoading && actError && (
                    <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{actError}</p>
                    </div>
                  )}
                  {!actLoading && !actError && activity && activity.node_events.length === 0 && activity.edge_groups.length === 0 && (
                    <div style={{ padding: "40px 22px", textAlign: "center" as const }}>
                      <Activity size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No activity yet</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>Nothing has been recorded for {displayName} or its relationships yet.</p>
                    </div>
                  )}
                  {!actLoading && !actError && activity && (activity.node_events.length > 0 || activity.edge_groups.length > 0) && (
                    <div style={{ padding: "14px 22px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
                      {activity.node_events.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>{displayName}</p>
                          <div style={{ border: "1px solid #F3F4F6", borderRadius: 9, overflow: "hidden" }}>
                            {activity.node_events.map((ev, i) => (
                              <div key={ev.event_id ?? i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderBottom: i < activity.node_events.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{humanizeEventType(ev.event_type)}</span>
                                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(ev.occurred_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activity.edge_groups.map(group => (
                        <div key={group.edge_id}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>
                            {REL_LABELS[group.relationship_type ?? ""] ?? group.relationship_type ?? "Relationship"}
                            {group.status && <span style={{ marginLeft: 6, color: EDGE_STATUS_COLORS[group.status] ?? "#9CA3AF" }}>· {group.status}</span>}
                          </p>
                          <div style={{ border: "1px solid #F3F4F6", borderRadius: 9, overflow: "hidden" }}>
                            {group.events.map((ev, i) => (
                              <div key={ev.event_id ?? i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderBottom: i < group.events.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{humanizeEventType(ev.event_type)}</span>
                                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(ev.occurred_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>This is the Financial Relationship Graph's own event history — separate from Creditlinker's tamper-evidence ledger.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   ON-CHAIN HOLDINGS PANEL (Phase 3)
   Collapsed by default. On expand: resolves the business's
   graph node the same way RelationshipGraphPanel does, then
   calls graph-node-get with include_chain=true&include_trust=true
   to get verified chain_accounts (+ their chain_holdings) and
   the on_chain_net_worth_usd / on_chain_activity_score trust
   fields. Read-only — this panel never initiates verification
   or linking, that flow belongs to the business's own portal.
───────────────────────────────────────────────────────── */
function OnChainHoldingsPanel({
  businessId,
  token,
  displayName,
}: {
  businessId: string;
  token: string;
  displayName: string;
}) {
  const [open,         setOpen]         = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [accounts,     setAccounts]     = useState<ChainAccount[] | null>(null);
  const [trustScores,  setTrustScores]  = useState<TrustScores | null>(null);

  const fetchOnChain = useCallback(async () => {
    if (!token || !businessId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: matchedNode, error: nodeErr } = await supabase
        .schema("graph")
        .from("nodes")
        .select("cl_id")
        .eq("linked_entity_type", "business")
        .eq("linked_entity_id", businessId)
        .maybeSingle();

      if (nodeErr) throw new Error("Could not look up graph node for this business.");
      if (!matchedNode) {
        setError("This business does not yet have a graph node. It will appear after its first financing record is created.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_BASE}/graph-node-get/${encodeURIComponent(matchedNode.cl_id)}?include_chain=true&include_trust=true`,
        { headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message ?? `On-chain data fetch failed (${res.status})`);
      }
      const json = await res.json();
      const allAccounts: ChainAccount[] = json.data?.chain_accounts ?? [];
      setAccounts(allAccounts.filter(a => a.verified)); // unverified claims are not net-worth signal
      setTrustScores(json.data?.trust_scores ?? null);
    } catch (e: any) {
      setError(e.message ?? "Failed to load on-chain holdings.");
    } finally {
      setLoading(false);
    }
  }, [token, businessId]);

  function handleToggle() {
    if (!open && accounts === null && !loading) fetchOnChain();
    setOpen(o => !o);
  }

  const totalHoldingsCount = (accounts ?? []).reduce((sum, a) => sum + a.holdings.length, 0);
  const netWorthUsd = trustScores?.on_chain_net_worth_usd ?? 0;

  return (
    <Card>
      <button
        onClick={handleToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: open ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
            <Landmark size={13} color={open ? "#00D4FF" : "#9CA3AF"} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>On-Chain Holdings</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {accounts !== null
                ? `${accounts.length} verified wallet${accounts.length !== 1 ? "s" : ""} \u00b7 ${netWorthUsd > 0 ? fmtUsd(netWorthUsd) + " tracked net worth" : "no priced balances yet"}`
                : "Expand to view verified blockchain wallets and balances"}
            </p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "#9CA3AF", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          {loading && (
            <div style={{ padding: "40px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading on-chain holdings…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#6B7280" }}>{error}</p>
            </div>
          )}

          {!loading && !error && accounts !== null && accounts.length === 0 && (
            <div style={{ padding: "40px 22px", textAlign: "center" as const }}>
              <Landmark size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No verified wallets</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                {displayName} has not linked or verified a blockchain wallet yet.
              </p>
            </div>
          )}

          {!loading && !error && accounts !== null && accounts.length > 0 && (
            <>
              {/* Trust signal summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "14px 22px" }}>
                <StatBox label="Net Worth (tracked)" value={netWorthUsd > 0 ? fmtUsd(netWorthUsd) : "\u2014"} color="#0A2540" />
                <StatBox
                  label="On-Chain Activity"
                  value={trustScores?.on_chain_activity_score != null ? `${Math.round(trustScores.on_chain_activity_score)}/100` : "\u2014"}
                  color={trustScores?.on_chain_activity_score != null && trustScores.on_chain_activity_score > 0 ? "#10B981" : "#9CA3AF"}
                />
                <StatBox label="Verified Wallets" value={String(accounts.length)} />
              </div>

              <div style={{ margin: "0 22px 12px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9 }}>
                <Info size={12} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: "#0A5060", lineHeight: 1.5 }}>
                  Balances are refreshed nightly and priced at fetch time where a price source is available. Only cryptographically verified wallets (signature or transaction proof) are shown \u2014 unverified claims are never counted toward net worth.
                </p>
              </div>

              {/* Per-wallet rows */}
              <div style={{ borderTop: "1px solid #F3F4F6" }}>
                {accounts.map((acct, i) => {
                  const chainColor = CHAIN_COLORS[acct.chain] ?? "#6B7280";
                  const chainLabel = CHAIN_LABELS[acct.chain] ?? acct.chain;
                  const acctNetWorth = acct.holdings.reduce(
                    (sum, h) => sum + (h.balance_usd_equivalent ?? 0), 0,
                  );

                  return (
                    <div key={acct.id} style={{ padding: "14px 22px", borderBottom: i < accounts.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: acct.holdings.length > 0 ? 10 : 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${chainColor}15`, border: `1px solid ${chainColor}30` }}>
                          <Landmark size={12} color={chainColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{chainLabel}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "1px 5px", borderRadius: 4 }}>VERIFIED</span>
                            {acct.verified_by && (
                              <span style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF" }}>via {acct.verified_by}</span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{fmtAddress(acct.address)}</p>
                        </div>
                        {acctNetWorth > 0 && (
                          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", letterSpacing: "-0.03em", flexShrink: 0 }}>
                            {fmtUsd(acctNetWorth)}
                          </p>
                        )}
                      </div>

                      {acct.holdings.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, paddingLeft: 38 }}>
                          {acct.holdings.map(h => (
                            <span key={h.asset} style={{ fontSize: 11, fontWeight: 600, color: "#374151", background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 6, padding: "3px 8px" }}>
                              {h.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.asset}
                              {h.balance_usd_equivalent != null && (
                                <span style={{ color: "#9CA3AF", marginLeft: 4 }}>({fmtUsd(h.balance_usd_equivalent)})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                  On-chain net worth and activity are a supplementary signal alongside the Creditlinker score \u2014 they do not replace bank-derived financial dimensions.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   CASHFLOW INTELLIGENCE MODAL
   Opened via a button, not an inline panel — keeps the main
   profile page uncluttered. Fetches the business's latest
   cashflow_forecasts row directly (RLS-gated to consented
   financers, same pattern as creditlinker_scores). Renders
   trend, seasonality, monthly history, and the 6-month forward
   projection already computed by cashflow-forecast.engine.ts —
   no new computation happens here, this is a read-only view.
───────────────────────────────────────────────────────── */
function CashflowIntelligenceModal({
  businessId,
  displayName,
  onClose,
}: {
  businessId: string;
  displayName: string;
  onClose: () => void;
}) {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data,     setData]     = useState<CashflowForecastBlob | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data: row, error: err } = await supabase
        .from("cashflow_forecasts")
        .select("forecast, computed_at")
        .eq("business_id", businessId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      if (!row) { setNotFound(true); setLoading(false); return; }
      setData(row.forecast as CashflowForecastBlob);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  // Client-side descriptive stat only — coefficient of variation of
  // historical net cashflow. Not a stored field; derived from the
  // historical series already in the fetched row.
  const variability = (() => {
    if (!data || data.historical.length < 2) return null;
    const values = data.historical.map(h => h.net_cashflow);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return null;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const cv = (Math.sqrt(variance) / Math.abs(mean)) * 100;
    return Math.round(cv);
  })();

  const trendMeta = !data ? null : data.trend_direction === "improving"
    ? { icon: <TrendingUp size={14} />,   label: "Improving", color: "#10B981" }
    : data.trend_direction === "declining"
    ? { icon: <TrendingDown size={14} />, label: "Declining", color: "#EF4444" }
    : { icon: <Minus size={14} />,        label: "Stable",    color: "#6B7280" };

  const maxAbsHist = data ? Math.max(1, ...data.historical.map(h => Math.abs(h.net_cashflow))) : 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", position: "sticky" as const, top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LineChart size={15} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 2 }}>Cashflow Intelligence</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>{displayName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {loading && (
            <div style={{ padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading cashflow forecast…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#6B7280" }}>{error}</p>
            </div>
          )}

          {!loading && !error && notFound && (
            <div style={{ padding: "32px 0", textAlign: "center" as const }}>
              <LineChart size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No forecast yet</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", maxWidth: 340, margin: "0 auto" }}>
                {displayName} needs at least 6 months of transaction data before a cashflow forecast can be generated.
              </p>
            </div>
          )}

          {!loading && !error && !notFound && data && trendMeta && (
            <>
              {/* Trend + coverage */}
              <div style={{ display: "grid", gridTemplateColumns: variability !== null ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Trend</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: trendMeta.color }}>
                    {trendMeta.icon}
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.03em" }}>{trendMeta.label}</span>
                  </div>
                </div>
                <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Data Coverage</p>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "#0A2540", letterSpacing: "-0.03em" }}>{data.data_months_used} months</p>
                </div>
                {variability !== null && (
                  <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Variability</p>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "#0A2540", letterSpacing: "-0.03em" }}>{variability}%</p>
                  </div>
                )}
              </div>

              {/* Seasonality */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Seasonality</p>
                {data.seasonality_detected ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 9, padding: "10px 12px" }}>
                      <p style={{ fontSize: 10, color: "#065F46", fontWeight: 700, marginBottom: 2 }}>PEAK MONTH</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>{data.peak_month}</p>
                    </div>
                    <div style={{ flex: 1, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 9, padding: "10px 12px" }}>
                      <p style={{ fontSize: 10, color: "#991B1B", fontWeight: 700, marginBottom: 2 }}>LOW MONTH</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>{data.trough_month}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>No reliable seasonal pattern detected yet — this needs 24+ months of history.</p>
                )}
              </div>

              {/* Historical monthly bars */}
              {data.historical.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Monthly Net Cashflow</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90, padding: "0 2px" }}>
                    {data.historical.map(h => {
                      const heightPct = Math.max(4, (Math.abs(h.net_cashflow) / maxAbsHist) * 100);
                      const positive = h.net_cashflow >= 0;
                      return (
                        <div key={h.month} title={`${fmtMonth(h.month)}: ${fmt(h.net_cashflow)}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                          <div style={{ width: "100%", height: `${heightPct}%`, background: positive ? "#10B981" : "#EF4444", borderRadius: 3, minHeight: 3 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{fmtMonth(data.historical[0].month)}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{fmtMonth(data.historical[data.historical.length - 1].month)}</span>
                  </div>
                </div>
              )}

              {/* 6-month forward projection */}
              {data.forecast.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>6-Month Projection</p>
                  <div style={{ border: "1px solid #F3F4F6", borderRadius: 9, overflow: "hidden" }}>
                    {data.forecast.map((f, i) => (
                      <div key={f.month} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: i < data.forecast.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmtMonth(f.month)}</span>
                        <div style={{ textAlign: "right" as const }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: f.forecast >= 0 ? "#10B981" : "#EF4444" }}>{fmt(f.forecast)}</span>
                          <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 8 }}>{fmt(f.lower_bound)} – {fmt(f.upper_bound)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
                  Trend and seasonality are derived from historical bank transactions; the projection carries a 95% confidence range and is directional, not a guarantee. This does not include or imply any loan or credit limit amount.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerBusinessProfile() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anonymizedId = searchParams.get("id");

  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [token,   setToken]   = useState<string | null>(null);

  // Compose modal
  const [msgOpen,    setMsgOpen]    = useState(false);
  const [msgBody,    setMsgBody]    = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError,   setMsgError]   = useState<string | null>(null);
  const [instId,     setInstId]     = useState<string | null>(null);

  // Cashflow intelligence modal
  const [cfModalOpen, setCfModalOpen] = useState(false);

  // Transactions panel
  const [txOpen,       setTxOpen]       = useState(false);
  const [txRows,       setTxRows]       = useState<Transaction[]>([]);
  const [txTotal,      setTxTotal]      = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txStats,      setTxStats]      = useState<{ total_in: number; total_out: number; net: number } | null>(null);
  const [txMeta,       setTxMeta]       = useState<{ categories: string[]; date_range: { from: string; to: string } | null } | null>(null);
  const [txLoading,    setTxLoading]    = useState(false);
  const [txError,      setTxError]      = useState<string | null>(null);

  // Transaction filters
  const [txPage,      setTxPage]      = useState(1);
  const [txSearch,    setTxSearch]    = useState("");
  const [txDebSearch, setTxDebSearch] = useState("");
  const [txDir,       setTxDir]       = useState("");
  const [txCat,       setTxCat]       = useState("");
  const [txFrom,      setTxFrom]      = useState("");
  const [txTo,        setTxTo]        = useState("");
  const [showTxFilters, setShowTxFilters] = useState(false);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => { setTxDebSearch(txSearch); setTxPage(1); }, 350);
    return () => clearTimeout(t);
  }, [txSearch]);

  /* ── Load profile ── */
  useEffect(() => {
    if (!user || !anonymizedId) return;

    (async () => {
      setLoading(true);
      setError(null);

      const resolvedInstId = await getMyInstitutionId(user.id);
      if (!resolvedInstId) { setError("No institution found."); setLoading(false); return; }
      setInstId(resolvedInstId);

      const { data: bizRow, error: bizErr } = await supabase
        .from("businesses")
        .select("business_id")
        .eq("financial_identity_id", anonymizedId)
        .maybeSingle();

      if (bizErr || !bizRow) { setError("Business not found."); setLoading(false); return; }

      const { data: consent, error: cErr } = await supabase
        .from("consent_records")
        .select(`
          consent_id, business_id, granted_at, is_active, permissions,
          businesses!consent_records_business_id_fkey ( name, financial_identity_id, sector, kyc_status, registration_number )
        `)
        .eq("institution_id", resolvedInstId)
        .eq("business_id", bizRow.business_id)
        .eq("is_active", true)
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cErr)     { setError(cErr.message); setLoading(false); return; }
      if (!consent) { setError("No active consent found for this business. Access may have been revoked."); setLoading(false); return; }

      const { data: score } = await supabase
        .from("creditlinker_scores")
        .select("composite_score, lender_risk, data_quality_score, data_months_analyzed, dimensions, computed_at")
        .eq("business_id", bizRow.business_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const biz          = (consent as any).businesses;
      const dataMonths   = score?.data_months_analyzed ?? 0;
      const computedAt   = score?.computed_at ? new Date(score.computed_at) : null;

      let coverageStr = "No data";
      if (computedAt && dataMonths > 0) {
        const endDate   = computedAt;
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - (dataMonths - 1));
        const f = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
        coverageStr = `${f(startDate)} - ${f(endDate)}`;
      }

      const expiryRaw = (consent.permissions as Record<string, unknown> | null)?.expires_at as string | undefined;
      const expiryStr = expiryRaw
        ? new Date(expiryRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;

      const rawDims = (score?.dimensions ?? {}) as Record<string, number | { raw_score?: number } | null>;
      const dimensions: DimensionScore[] = Object.entries(DIM_META).map(([key, meta]) => {
        const val = rawDims[key];
        const numeric =
          typeof val === "number" ? val
          : (typeof val === "object" && val !== null) ? ((val as any).raw_score ?? 0)
          : 0;
        return { key, label: meta.label, color: meta.color, value: Math.round(numeric) };
      });

      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);

      setData({
        business_id:         bizRow.business_id,
        consent_id:          consent.consent_id,
        business_name:       biz?.name ?? null,
        anonymized_id:       anonymizedId,
        sector:              biz?.sector ?? null,
        kyc_status:          biz?.kyc_status ?? null,
        registration_number: biz?.registration_number ?? null,
        data_months:         dataMonths,
        coverage:            coverageStr,
        consent_expiry:      expiryStr,
        overall_score:       score?.composite_score ?? null,
        risk_level:          score?.lender_risk ?? null,
        data_quality_score:  score?.data_quality_score ?? null,
        dimensions,
      });

      setLoading(false);
    })();
  }, [user, anonymizedId]);

  /* ── Fetch transactions ── */
  const fetchTransactions = useCallback(async () => {
    if (!data || !token) return;
    setTxLoading(true);
    setTxError(null);

    try {
      const params = new URLSearchParams({
        view:        "transactions",
        business_id: data.business_id,
        page:        String(txPage),
        per_page:    String(PAGE_SIZE),
      });
      if (txDebSearch) params.set("search",    txDebSearch);
      if (txDir)       params.set("direction", txDir);
      if (txCat)       params.set("category",  txCat);
      if (txFrom)      params.set("from",      txFrom);
      if (txTo)        params.set("to",        txTo);

      const res = await fetch(
        `${API_BASE}/get-business-profile?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );

      if (!res.ok) {
        let errMsg = `Request failed (${res.status})`;
        try {
          const errBody = await res.json();
          errMsg = errBody.error ?? errBody.message ?? errMsg;
        } catch { /* non-JSON body */ }
        throw new Error(errMsg);
      }

      const json: TransactionsResponse = await res.json();
      setTxRows(json.transactions);
      setTxTotal(json.total);
      setTxTotalPages(json.total_pages);
      setTxStats(json.stats);
      if (json.meta) setTxMeta(json.meta);
    } catch (e: any) {
      setTxError(e.message ?? "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [data, token, txPage, txDebSearch, txDir, txCat, txFrom, txTo]);

  useEffect(() => {
    if (txOpen && data && token) fetchTransactions();
  }, [txOpen, fetchTransactions]);

  /* ── Send message ── */
  async function sendMessage() {
    if (!msgBody.trim() || !data || !instId) return;
    setMsgSending(true);
    setMsgError(null);
    try {
      await sendFinancerMessage(data.consent_id, msgBody.trim());
      setMsgOpen(false);
      setMsgBody("");
      router.push(`/financer/messages?consent=${data.consent_id}`);
    } catch (e: any) {
      setMsgError(e.message ?? "Failed to send message");
    } finally {
      setMsgSending(false);
    }
  }

  const clearTxFilters = () => {
    setTxSearch(""); setTxDebSearch(""); setTxDir(""); setTxCat(""); setTxFrom(""); setTxTo(""); setTxPage(1);
  };
  const hasTxFilters = !!(txDebSearch || txDir || txCat || txFrom || txTo);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={28} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading business profile…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!anonymizedId) return (
    <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
      No business ID provided. <Link href="/financer/businesses" style={{ color: "#B91C1C", fontWeight: 600 }}>Go back</Link>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/financer/businesses" style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to businesses
      </Link>
      <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
        <ShieldCheck size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 6 }}>Access unavailable</p>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>{error}</p>
        <Link href="/financer/businesses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          Browse businesses <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );

  if (!data) return null;

  const displayName = data.business_name ?? `BIZ-${data.anonymized_id.slice(0, 6).toUpperCase()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Message modal ── */}
      {msgOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={15} color="#00D4FF" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 2 }}>Message {displayName}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>This will open a message thread under active consent.</p>
                </div>
              </div>
              <button onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {msgError && <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>{msgError}</div>}
              <textarea autoFocus value={msgBody} onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Hi ${displayName}, I'd like to discuss a financing opportunity…`}
                rows={5} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" as const, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }}
                  style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
                <button onClick={sendMessage} disabled={!msgBody.trim() || msgSending}
                  style={{ flex: 2, height: 42, borderRadius: 9, border: "none", background: msgBody.trim() && !msgSending ? "#0A2540" : "#E5E7EB", fontSize: 13, fontWeight: 700, color: msgBody.trim() && !msgSending ? "white" : "#9CA3AF", cursor: msgBody.trim() && !msgSending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {msgSending ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : <><Send size={13} /> Send Message</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cashflow intelligence modal ── */}
      {cfModalOpen && (
        <CashflowIntelligenceModal
          businessId={data.business_id}
          displayName={displayName}
          onClose={() => setCfModalOpen(false)}
        />
      )}

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/financer/businesses" style={{ color: "#9CA3AF", textDecoration: "none", fontWeight: 500 }}>Businesses</Link>
        <ChevronRight size={12} style={{ color: "#D1D5DB" }} />
        <span style={{ color: "#0A2540", fontWeight: 600 }}>{displayName}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#00D4FF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>{displayName}</h2>
              <Badge variant="success" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <ShieldCheck size={9} /> Consent active
              </Badge>
              {data.kyc_status === "verified" && <Badge variant="secondary" style={{ fontSize: 10 }}>KYC Verified</Badge>}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {data.sector ?? "Sector not disclosed"}
              {data.data_months > 0 ? ` · ${data.data_months}mo data · ${data.coverage}` : " · No pipeline data yet"}
              {data.consent_expiry && <> · Access expires <strong>{data.consent_expiry}</strong></>}
            </p>
          </div>
        </div>
        <Link href="/financer/financial-analysis" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <TrendingUp size={13} /> Full Analysis
        </Link>
      </div>

      {/* Consent notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <ShieldCheck size={13} style={{ color: "#00A8CC" }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.5 }}>
          You are viewing this profile under an active consent agreement. Data is sourced exclusively from verified bank transaction records.
        </p>
      </div>

      {data.data_months === 0 ? (
        <Card>
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <Info size={28} style={{ color: "#D1D5DB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No financial data yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>This business has granted consent but their financial identity snapshot hasn't been generated yet.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Score */}
            {data.overall_score !== null && (
              <Card>
                <div style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
                  <div style={{ textAlign: "center" as const }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, color: "#0A2540", letterSpacing: "-0.05em", lineHeight: 1 }}>{data.overall_score}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginTop: 4 }}>Creditlinker Score</p>
                  </div>
                  <div style={{ width: 1, height: 60, background: "#F3F4F6" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.risk_level && (
                      <Badge variant={riskVariant(data.risk_level)} style={{ fontSize: 11, padding: "4px 10px", width: "fit-content" }}>{data.risk_level}</Badge>
                    )}
                    {data.data_quality_score !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: "#10B981" }} />
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Data quality: <strong style={{ color: "#0A2540" }}>{data.data_quality_score}%</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Dimensions */}
            <Card>
              <div style={{ padding: "18px 22px 0" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Financial Dimensions</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Six-axis financial health assessment</p>
              </div>
              <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {data.dimensions.map(d => (
                  <div key={d.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{d.label}</p>
                      <span style={{ fontSize: 16, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{d.value}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transactions panel */}
            <Card>
              <button
                onClick={() => setTxOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Transaction Records</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    {txOpen && txTotal > 0
                      ? `${txTotal.toLocaleString()} transactions · ${txMeta?.date_range ? `${fmtDate(txMeta.date_range.from)} – ${fmtDate(txMeta.date_range.to)}` : ""}`
                      : "Verified bank transactions underlying this score"}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "#9CA3AF", transform: txOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </button>

              {txOpen && (
                <div style={{ borderTop: "1px solid #F3F4F6" }}>
                  {txStats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "14px 22px" }}>
                      <StatBox label="Total In"  value={fmt(txStats.total_in)}  color="#10B981" />
                      <StatBox label="Total Out" value={fmt(txStats.total_out)} color="#EF4444" />
                      <StatBox label="Net Flow"  value={fmt(Math.abs(txStats.net))} color={txStats.net >= 0 ? "#10B981" : "#EF4444"} />
                    </div>
                  )}

                  <div style={{ padding: "0 22px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ position: "relative" as const, flex: 1 }}>
                        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                        <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search counterparty…"
                          style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                        {txSearch && <button onClick={() => setTxSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={12} /></button>}
                      </div>
                      <button onClick={() => setShowTxFilters(f => !f)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, border: "1.5px solid", borderRadius: 8, borderColor: showTxFilters ? "#0A2540" : "#E5E7EB", background: showTxFilters ? "#0A2540" : "white", color: showTxFilters ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <SlidersHorizontal size={12} /> Filters
                        {hasTxFilters && <span style={{ width: 5, height: 5, borderRadius: "50%", background: showTxFilters ? "#00D4FF" : "#0A2540" }} />}
                      </button>
                      {hasTxFilters && <button onClick={clearTxFilters} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}><X size={11} /> Clear</button>}
                    </div>

                    {showTxFilters && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 14px", background: "#F9FAFB", borderRadius: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Direction</span>
                          {["", "credit", "debit"].map(d => (
                            <FilterPill key={d} label={d === "" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)} active={txDir === d} onClick={() => { setTxDir(d); setTxPage(1); }} />
                          ))}
                        </div>
                        {txMeta && txMeta.categories.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Category</span>
                            <FilterPill label="All" active={txCat === ""} onClick={() => { setTxCat(""); setTxPage(1); }} />
                            {txMeta.categories.map(c => <FilterPill key={c} label={c} active={txCat === c} onClick={() => { setTxCat(c); setTxPage(1); }} />)}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Date</span>
                          <input type="date" value={txFrom} max={txTo || undefined} onChange={e => { setTxFrom(e.target.value); setTxPage(1); }}
                            style={{ height: 30, padding: "0 8px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 12, color: txFrom ? "#0A2540" : "#9CA3AF", outline: "none" }} />
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>to</span>
                          <input type="date" value={txTo} min={txFrom || undefined} onChange={e => { setTxTo(e.target.value); setTxPage(1); }}
                            style={{ height: 30, padding: "0 8px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 12, color: txTo ? "#0A2540" : "#9CA3AF", outline: "none" }} />
                          {(txFrom || txTo) && <button onClick={() => { setTxFrom(""); setTxTo(""); setTxPage(1); }} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><X size={11} /> Clear</button>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid #F3F4F6", opacity: txLoading ? 0.5 : 1, transition: "opacity 0.15s" }}>
                    {txError ? (
                      <div style={{ padding: "24px 22px", display: "flex", alignItems: "center", gap: 10 }}>
                        <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} /><p style={{ fontSize: 13, color: "#EF4444" }}>{txError}</p>
                      </div>
                    ) : txLoading && txRows.length === 0 ? (
                      <div style={{ padding: "32px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Loader2 size={16} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} /><p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading transactions…</p>
                      </div>
                    ) : txRows.length === 0 ? (
                      <div style={{ padding: "32px 22px", textAlign: "center" as const }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No transactions match the current filters.</p></div>
                    ) : (
                      txRows.map((tx, i) => (
                        <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 22px", borderBottom: i < txRows.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.is_internal_transfer ? "rgba(56,189,248,0.1)" : tx.direction === "credit" ? "#ECFDF5" : "#F3F4F6", color: tx.is_internal_transfer ? "#38BDF8" : tx.direction === "credit" ? "#10B981" : "#6B7280" }}>
                            {tx.is_internal_transfer ? <ArrowLeftRight size={12} /> : tx.direction === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" as const }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{tx.counterparty_cluster ?? tx.category}</p>
                              {tx.is_recurring && <Repeat2 size={10} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                              {(tx.flags ?? []).length > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4 }}>Flag</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(tx.date)}</p>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: categoryColor(tx.category) }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: categoryColor(tx.category) }} />{tx.category}
                              </span>
                              {tx.balance_after !== null && <span style={{ fontSize: 10, color: "#9CA3AF" }}>bal. {fmt(tx.balance_after)}</span>}
                            </div>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: tx.direction === "credit" ? "#10B981" : "#0A2540", flexShrink: 0 }}>
                            {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {txTotalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{(txPage - 1) * PAGE_SIZE + 1}–{Math.min(txPage * PAGE_SIZE, txTotal)} of {txTotal.toLocaleString()}</p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: txPage === 1 ? "not-allowed" : "pointer", color: txPage === 1 ? "#D1D5DB" : "#374151" }}>
                          <ChevronLeft size={13} />
                        </button>
                        {Array.from({ length: Math.min(txTotalPages, 5) }, (_, i) => {
                          let p = i + 1;
                          if (txTotalPages > 5) {
                            if (txPage <= 3) p = i + 1;
                            else if (txPage >= txTotalPages - 2) p = txTotalPages - 4 + i;
                            else p = txPage - 2 + i;
                          }
                          return (
                            <button key={p} onClick={() => setTxPage(p)}
                              style={{ width: 30, height: 30, borderRadius: 7, border: "1.5px solid", borderColor: txPage === p ? "#0A2540" : "#E5E7EB", background: txPage === p ? "#0A2540" : "white", color: txPage === p ? "white" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              {p}
                            </button>
                          );
                        })}
                        <button onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: txPage === txTotalPages ? "not-allowed" : "pointer", color: txPage === txTotalPages ? "#D1D5DB" : "#374151" }}>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Transactions are normalized bank records from Creditlinker's ingestion pipeline. Raw bank descriptions are clustered into counterparty names.</p>
                  </div>
                </div>
              )}
            </Card>

            {/* ── RELATIONSHIP GRAPH PANEL ── */}
            {token && (
              <RelationshipGraphPanel
                businessId={data.business_id}
                token={token}
                displayName={displayName}
              />
            )}

            {/* ── ON-CHAIN HOLDINGS PANEL (Phase 3) ── */}
            {token && (
              <OnChainHoldingsPanel
                businessId={data.business_id}
                token={token}
                displayName={displayName}
              />
            )}

          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Profile summary */}
            <Card>
              <div style={{ padding: "16px 18px 0" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540" }}>Profile Summary</p>
              </div>
              <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Business Name",  value: data.business_name ?? "Anonymized" },
                  { label: "Sector",          value: data.sector ?? "Not disclosed" },
                  { label: "KYC Status",      value: data.kyc_status ?? "Unknown" },
                  { label: "Reg. Number",     value: data.registration_number ?? "Not disclosed" },
                  { label: "Data Coverage",   value: data.coverage },
                  { label: "Months of Data",  value: data.data_months > 0 ? `${data.data_months} months` : "None yet" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{r.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textAlign: "right" as const }}>{r.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card style={{ padding: "16px 18px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 12 }}>Actions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { setMsgOpen(true); setMsgError(null); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}>
                  <MessageSquare size={13} /> Send Message
                </button>
                <button onClick={() => setCfModalOpen(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                  <LineChart size={13} /> Cashflow Intelligence
                </button>
                <Link href="/financer/financial-analysis" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <TrendingUp size={13} /> View Full Analysis
                </Link>
                <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <ArrowUpRight size={13} /> View Request
                </Link>
                <Link href={`/financer/messages?consent=${data.consent_id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <MessageSquare size={13} /> View All Messages
                </Link>
              </div>
            </Card>

            {/* Data notice */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>
                All data is sourced from verified bank transactions via Creditlinker's financial identity pipeline. Business identity remains anonymized to protect commercial confidentiality.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
