"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  GitFork, Gauge, Network, Activity, Loader2,
  AlertCircle, AlertTriangle, Info, Lock, Landmark, Users,
  Briefcase, Building2, RefreshCw, ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

/* ─────────────────────────────────────────────────────────
   TYPES — same shapes as the financer "Relationship Graph"
   tab (business-profile/page.tsx), reused here for the
   business's own view of its own graph node.
───────────────────────────────────────────────────────── */
type GraphNode = {
  id: string;
  cl_id: string | null;
  node_type: string | null;
  display_name: string | null;
  legal_name: string | null;
  status: string | null;
  masked: boolean;
};

type GraphEdge = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  relationship_type: string;
  status: string;
  weight: number | null;
  currency: string | null;
  depth: number;
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
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: GraphSummary;
};

type FullTrustScores = {
  node_id: string;
  repayment_score: number;
  transaction_consistency: number;
  obligation_load_ngn: number;
  guarantor_exposure_ngn: number;
  supplier_payment_score: number;
  business_longevity_days: number;
  active_relationship_count: number;
  default_count: number;
  network_risk_score: number;
  on_chain_net_worth_usd: number;
  on_chain_activity_score: number;
  computed_at: string;
};

type ExposureData = {
  own_obligations_ngn: number;
  guaranteed_obligations_ngn: number;
  owed_to_this_entity_ngn: number;
  network_total_ngn: number;
  by_relationship_type: Record<string, number>;
  network_risk_flags: number;
};

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

type TrustJob = {
  job_id: string;
  node_id: string;
  status: "pending" | "running" | "done" | "failed";
  error: string | null;
};

/* ─────────────────────────────────────────────────────────
   LOOKUP TABLES — mirrors the financer graph tab exactly
───────────────────────────────────────────────────────── */
const REL_LABELS: Record<string, string> = {
  BORROWER_OF: "Borrower", LENDER_TO: "Lender", GUARANTOR_FOR: "Guarantor for",
  SUPPLIER_TO: "Supplier to", CUSTOMER_OF: "Customer of", EMPLOYER_OF: "Employer of",
  EMPLOYED_BY: "Employed by", DIRECTOR_OF: "Director of", SHAREHOLDER_OF: "Shareholder of",
  INVOICE_DEBTOR: "Invoice debtor", BNPL_ACCOUNT: "BNPL account",
  ACCOUNT_HOLDER_AT: "Account holder at", SUBSIDIARY_OF: "Subsidiary of", RELATED_PARTY: "Related party",
};

const NODE_TYPE_COLORS: Record<string, string> = {
  BUSINESS: "#0A2540", FINANCIAL_INST: "#7C3AED", INDIVIDUAL: "#0369A1",
  COOPERATIVE: "#065F46", NGO: "#92400E", GOVERNMENT: "#991B1B", TRUST: "#374151",
};

const EDGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10B981", CLOSED: "#9CA3AF", DISPUTED: "#F59E0B", DEFAULTED: "#EF4444",
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
  return eventType.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: active ? "#0A2540" : "#E5E7EB", background: active ? "#0A2540" : "white", color: active ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
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
   OWNERSHIP TREE ROW
───────────────────────────────────────────────────────── */
function OwnershipNodeRow({ entry }: { entry: OwnershipEntry }) {
  const nodeColor = NODE_TYPE_COLORS[entry.node?.node_type ?? ""] ?? "#374151";
  const name = entry.node?.masked ? "Undisclosed entity" : (entry.node?.display_name ?? entry.node?.legal_name ?? "Unknown");
  return (
    <div style={{ marginLeft: (entry.depth - 1) * 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: entry.node?.masked ? "#F9FAFB" : `${nodeColor}15`, color: entry.node?.masked ? "#D1D5DB" : nodeColor, border: `1px solid ${entry.node?.masked ? "#E5E7EB" : `${nodeColor}30`}` }}>
          {entry.node?.masked ? <Lock size={11} /> : nodeTypeIcon(entry.node?.node_type ?? null)}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: entry.node?.masked ? "#9CA3AF" : "#0A2540", fontStyle: entry.node?.masked ? "italic" : "normal" }}>{name}</p>
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
          {entry.owners.map((child, i) => <OwnershipNodeRow key={`${child.node?.id ?? "masked"}-${i}`} entry={child} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE — "My Graph"
   Four tabs against the business's own node (its own cl_id
   is already known via useActiveBusiness — no lookup needed,
   unlike the financer view which has to resolve a counterparty's
   node from a business_id first). Overview here DOES include a
   trust-recompute button + job poll, since this is the one
   place that action belongs (business-owner only, per J2).
   Wallet linking lives at /data-sources — link out, don't duplicate.
───────────────────────────────────────────────────────── */
type GraphTab = "overview" | "relationships" | "ownership" | "activity";

export default function MyGraphPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();
  const clId = activeBusiness?.creditlinker_id ?? null;
  const displayName = activeBusiness?.name ?? "your business";

  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<GraphTab>("overview");

  // Overview
  const [trust, setTrust] = useState<FullTrustScores | null>(null);
  const [exposure, setExposure] = useState<ExposureData | null>(null);
  const [ovLoading, setOvLoading] = useState(false);
  const [ovError, setOvError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);

  // Relationships
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [relLoading, setRelLoading] = useState(false);
  const [relError, setRelError] = useState<string | null>(null);
  const [depthFilter, setDepthFilter] = useState<number | null>(null);
  const [relFilter, setRelFilter] = useState<string>("");
  const [direction, setDirection] = useState<"both" | "outbound" | "inbound">("both");

  // Ownership
  const [ownership, setOwnership] = useState<OwnershipData | null>(null);
  const [ownLoading, setOwnLoading] = useState(false);
  const [ownError, setOwnError] = useState<string | null>(null);

  // Activity
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const authedFetch = useCallback((path: string) => fetch(
    `${API_BASE}${path}`,
    { headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
  ), [token]);

  const fetchOverview = useCallback(async () => {
    if (!clId || !token) return;
    setOvLoading(true);
    setOvError(null);
    try {
      const [trustRes, expRes] = await Promise.all([
        authedFetch(`/graph-node-trust/${encodeURIComponent(clId)}/trust`),
        authedFetch(`/graph-discover-exposure/${encodeURIComponent(clId)}/exposure?depth=3&decay=0.3`),
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
  }, [clId, token, authedFetch]);

  const fetchRelationships = useCallback(async (dir: "both" | "outbound" | "inbound") => {
    if (!clId || !token) return;
    setRelLoading(true);
    setRelError(null);
    try {
      const res = await authedFetch(`/graph-discover/${encodeURIComponent(clId)}?depth=3&direction=${dir}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? `Graph fetch failed (${res.status})`);
      const json = await res.json();
      setGraphData(json.data);
    } catch (e: any) {
      setRelError(e.message ?? "Failed to load relationship graph.");
    } finally {
      setRelLoading(false);
    }
  }, [clId, token, authedFetch]);

  const fetchOwnership = useCallback(async () => {
    if (!clId || !token) return;
    setOwnLoading(true);
    setOwnError(null);
    try {
      const res = await authedFetch(`/graph-discover-ownership/${encodeURIComponent(clId)}/ownership?max_depth=3`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? "Failed to load ownership chain.");
      const json = await res.json();
      setOwnership(json.data);
    } catch (e: any) {
      setOwnError(e.message ?? "Failed to load ownership chain.");
    } finally {
      setOwnLoading(false);
    }
  }, [clId, token, authedFetch]);

  const fetchActivity = useCallback(async () => {
    if (!clId || !token) return;
    setActLoading(true);
    setActError(null);
    try {
      const res = await authedFetch(`/graph-node-events-list/${encodeURIComponent(clId)}/events?group_by_target=true&limit=50`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? "Failed to load activity timeline.");
      const json = await res.json();
      setActivity(json.data);
    } catch (e: any) {
      setActError(e.message ?? "Failed to load activity timeline.");
    } finally {
      setActLoading(false);
    }
  }, [clId, token, authedFetch]);

  // Initial load once we have a token + cl_id
  useEffect(() => {
    if (clId && token) fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clId, token]);

  function handleTabChange(next: GraphTab) {
    setTab(next);
    if (next === "relationships" && !graphData && !relLoading) fetchRelationships(direction);
    if (next === "ownership"     && !ownership && !ownLoading) fetchOwnership();
    if (next === "activity"      && !activity && !actLoading)  fetchActivity();
  }

  function handleDirectionChange(dir: "both" | "outbound" | "inbound") {
    setDirection(dir);
    setGraphData(null);
    fetchRelationships(dir);
  }

  // authedFetch is GET-only by construction; recompute needs POST + polling,
  // so it's implemented directly here rather than overloading authedFetch.
  const runRecompute = useCallback(async () => {
    if (!clId || !token || recomputing) return;
    setRecomputing(true);
    setRecomputeError(null);
    try {
      const postRes = await fetch(`${API_BASE}/graph-node-trust/${encodeURIComponent(clId)}/trust/recompute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      });
      if (!postRes.ok) throw new Error((await postRes.json().catch(() => ({}))).error?.message ?? "Failed to queue recomputation.");
      const postJson = await postRes.json();
      const jobId: string = postJson.data.job_id;

      let attempts = 0;
      const poll = async (): Promise<void> => {
        attempts++;
        const jobRes = await fetch(`${API_BASE}/graph-node-trust/${encodeURIComponent(clId)}/trust/recompute/${jobId}`, {
          headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        });
        if (!jobRes.ok) throw new Error("Lost track of the recompute job — please refresh.");
        const jobJson = await jobRes.json();
        const job: TrustJob = jobJson.data.job;
        if (job.status === "done") {
          await fetchOverview();
          return;
        }
        if (job.status === "failed") {
          throw new Error(job.error ?? "Recomputation failed.");
        }
        if (attempts >= 20) {
          throw new Error("Recomputation is taking longer than expected — it will still complete in the background; refresh shortly.");
        }
        await new Promise(r => setTimeout(r, 1500));
        return poll();
      };
      await poll();
    } catch (e: any) {
      setRecomputeError(e.message ?? "Failed to recompute trust score.");
    } finally {
      setRecomputing(false);
    }
  }, [clId, token, recomputing, fetchOverview]);

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
    { key: "overview",      label: "Overview",      icon: <Gauge size={13} /> },
    { key: "relationships", label: "Relationships", icon: <GitFork size={13} /> },
    { key: "ownership",     label: "Ownership",     icon: <Network size={13} /> },
    { key: "activity",      label: "Activity",      icon: <Activity size={13} /> },
  ];

  if (bizLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GitFork size={20} color="#00D4FF" />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>My Graph</h2>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Your trust signals, relationships, ownership, and activity in the Financial Relationship Graph.</p>
          </div>
        </div>
        <Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          Manage wallets & data sources <ArrowUpRight size={13} />
        </Link>
      </div>

      {!clId ? (
        <Card>
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <GitFork size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Your graph node hasn't been created yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 420, margin: "0 auto" }}>This appears automatically the first time a financing record, relationship, or verified wallet is linked to {displayName}.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 15px", borderRadius: 9, border: "1.5px solid",
                  borderColor: tab === t.key ? "#0A2540" : "#E5E7EB",
                  background: tab === t.key ? "#0A2540" : "white",
                  color: tab === t.key ? "white" : "#6B7280",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <Card>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Trust & exposure overview</p>
                  {trust && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Last computed {fmtDate(trust.computed_at)}</p>}
                </div>
                <button
                  onClick={runRecompute}
                  disabled={recomputing}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: recomputing ? "#9CA3AF" : "#0A2540", cursor: recomputing ? "not-allowed" : "pointer" }}
                >
                  {recomputing ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={12} />}
                  {recomputing ? "Recomputing…" : "Recompute now"}
                </button>
              </div>

              {recomputeError && (
                <div style={{ margin: "14px 22px 0", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
                  <AlertCircle size={13} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#DC2626", lineHeight: 1.5 }}>{recomputeError}</p>
                </div>
              )}

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
                <div style={{ padding: "18px 22px 22px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Trust signals</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
                    <StatBox label="Repayment" value={`${Math.round(trust.repayment_score)}/100`} color={trust.repayment_score >= 70 ? "#10B981" : trust.repayment_score >= 40 ? "#F59E0B" : "#EF4444"} />
                    <StatBox label="Consistency" value={`${Math.round(trust.transaction_consistency)}/100`} />
                    <StatBox label="Supplier Payment" value={`${Math.round(trust.supplier_payment_score)}/100`} />
                    <StatBox label="Network Risk" value={`${Math.round(trust.network_risk_score)}/100`} color={trust.network_risk_score <= 20 ? "#10B981" : trust.network_risk_score <= 50 ? "#F59E0B" : "#EF4444"} />
                    <StatBox label="Active Relations" value={String(trust.active_relationship_count)} />
                    <StatBox label="Longevity" value={`${trust.business_longevity_days}d`} />
                  </div>

                  {trust.default_count > 0 && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 18, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9 }}>
                      <AlertTriangle size={12} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>{trust.default_count} recorded default{trust.default_count !== 1 ? "s" : ""} on your own relationships. This directly weighs down your repayment score.</p>
                    </div>
                  )}

                  {exposure && (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Network exposure</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
                        <StatBox label="Own Obligations" value={exposure.own_obligations_ngn > 0 ? fmt(exposure.own_obligations_ngn) : "—"} />
                        <StatBox label="Guaranteed" value={exposure.guaranteed_obligations_ngn > 0 ? fmt(exposure.guaranteed_obligations_ngn) : "—"} color={exposure.guaranteed_obligations_ngn > 0 ? "#F59E0B" : undefined} />
                        <StatBox label="Owed To You" value={exposure.owed_to_this_entity_ngn > 0 ? fmt(exposure.owed_to_this_entity_ngn) : "—"} color="#10B981" />
                        <StatBox label="Network Total" value={exposure.network_total_ngn > 0 ? fmt(exposure.network_total_ngn) : "—"} />
                      </div>
                      {Object.keys(exposure.by_relationship_type).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 14 }}>
                          {Object.entries(exposure.by_relationship_type).map(([type, amt]) => (
                            <span key={type} style={{ fontSize: 11, fontWeight: 600, color: "#374151", background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 6, padding: "3px 8px" }}>
                              {REL_LABELS[type] ?? type}: {fmt(amt)}
                            </span>
                          ))}
                        </div>
                      )}
                      {exposure.network_risk_flags > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 4, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9 }}>
                          <AlertTriangle size={12} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>{exposure.network_risk_flags} defaulted relationship{exposure.network_risk_flags !== 1 ? "s" : ""} within your wider network (identities not disclosed to you either — this is a risk signal only).</p>
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 14 }}>
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Financers with active consent see a subset of this — never your counterparties' identities, only relationship type, amount, and status.</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ── RELATIONSHIPS ── */}
          {tab === "relationships" && (
            <Card>
              <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Direction</span>
                <FilterPill label="Both directions" active={direction === "both"} onClick={() => handleDirectionChange("both")} />
                <FilterPill label="What you owe" active={direction === "outbound"} onClick={() => handleDirectionChange("outbound")} />
                <FilterPill label="Owed to you" active={direction === "inbound"} onClick={() => handleDirectionChange("inbound")} />
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
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>You have no recorded financial relationships in the graph yet.</p>
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

                  {(relTypes.length > 1 || depths.length > 1) && (
                    <div style={{ padding: "0 22px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {depths.length > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 44 }}>Depth</span>
                          <FilterPill label="All" active={depthFilter === null} onClick={() => setDepthFilter(null)} />
                          {depths.map(d => <FilterPill key={d} label={`Hop ${d}`} active={depthFilter === d} onClick={() => setDepthFilter(d)} />)}
                        </div>
                      )}
                      {relTypes.length > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 44 }}>Type</span>
                          <FilterPill label="All" active={relFilter === ""} onClick={() => setRelFilter("")} />
                          {relTypes.map(r => <FilterPill key={r} label={REL_LABELS[r] ?? r} active={relFilter === r} onClick={() => setRelFilter(r)} />)}
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
                        const isOrigin = edge.from_node_id === graphData.origin_node.id;
                        const counterpartId = isOrigin ? edge.to_node_id : edge.from_node_id;
                        const counterpart = nodeMap[counterpartId];
                        const counterpartName = counterpart?.masked ? "Undisclosed entity" : (counterpart?.display_name ?? counterpart?.legal_name ?? "Unknown");
                        const nodeColor = NODE_TYPE_COLORS[counterpart?.node_type ?? ""] ?? "#374151";
                        const edgeColor = EDGE_STATUS_COLORS[edge.status] ?? "#9CA3AF";
                        const depthLabel = edge.depth === 1 ? "Direct" : `${edge.depth} hops away`;
                        return (
                          <div key={edge.edge_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: i < visibleEdges.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: counterpart?.masked ? "#F9FAFB" : `${nodeColor}15`, color: counterpart?.masked ? "#D1D5DB" : nodeColor, border: `1px solid ${counterpart?.masked ? "#E5E7EB" : `${nodeColor}30`}` }}>
                              {counterpart?.masked ? <Lock size={12} /> : nodeTypeIcon(counterpart?.node_type ?? null)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: counterpart?.masked ? "#9CA3AF" : "#0A2540", fontStyle: counterpart?.masked ? "italic" : "normal" }}>{counterpartName}</p>
                                {counterpart?.node_type && !counterpart.masked && (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: nodeColor, background: `${nodeColor}12`, padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em" }}>{counterpart.node_type.replace("_", " ")}</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                                <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{isOrigin ? "→" : "←"} {REL_LABELS[edge.relationship_type] ?? edge.relationship_type}</span>
                                <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
                                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{depthLabel}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                              {edge.weight != null && edge.weight > 0 && <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", letterSpacing: "-0.03em" }}>{fmt(edge.weight)}</p>}
                              <span style={{ fontSize: 10, fontWeight: 700, color: edgeColor, background: `${edgeColor}15`, padding: "1px 6px", borderRadius: 4 }}>{edge.status}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {graphData.edges.some(e => e.status === "DEFAULTED") && (
                    <div style={{ margin: "12px 22px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9 }}>
                      <AlertTriangle size={12} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>One or more relationships in your network carry a DEFAULTED status.</p>
                    </div>
                  )}

                  <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Showing relationships up to 3 hops out. Counterparty identities are masked unless you already have independent access.</p>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ── OWNERSHIP ── */}
          {tab === "ownership" && (
            <Card>
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
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>No shareholders, directors, or parent entities are recorded for {displayName} in the graph yet.</p>
                </div>
              )}
              {!ownLoading && !ownError && ownership && ownership.ownership_chain.length > 0 && (
                <>
                  <div style={{ padding: "16px 22px 4px" }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{ownership.summary.total_owners_found} owner{ownership.summary.total_owners_found !== 1 ? "s" : ""} found, up to {ownership.summary.max_depth_reached} level{ownership.summary.max_depth_reached !== 1 ? "s" : ""} up.</p>
                  </div>
                  <div style={{ padding: "6px 22px 20px" }}>
                    {ownership.ownership_chain.map((entry, i) => <OwnershipNodeRow key={`${entry.node?.id ?? "masked"}-${i}`} entry={entry} />)}
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ── ACTIVITY ── */}
          {tab === "activity" && (
            <Card>
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
                <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
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
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>This is the Financial Relationship Graph's own event history — separate from Creditlinker's tamper-evidence ledger (see Integrity, coming soon).</p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
