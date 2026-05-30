"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, ArrowUpRight, ShieldCheck,
  SlidersHorizontal, ChevronDown, X, Building2,
  Clock, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES  — mirrors the real discovery_matches schema exactly
───────────────────────────────────────────────────────── */
type MatchStatus = "pending" | "access_requested" | "consented" | "denied";

type DiscoveryMatch = {
  match_id: string;
  anonymized_id: string;
  institution_id: string;
  criteria_id: string | null;
  capital_category: string;
  match_score: number;          // 0–1 stored; ×100 for display
  status: MatchStatus;
  matched_at: string;
  access_requested_at: string | null;
  access_responded_at: string | null;
};

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const CAPITAL_CATS = [
  "All Types", "Working Capital", "Asset Financing", "Revenue Advance",
  "Trade Finance", "Equipment Financing", "Invoice Financing",
  "Business Expansion", "Microfinance",
];
const SORT_OPTIONS = ["Best Match", "Recently Matched", "Recently Requested"];

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────── */
function statusConfig(s: MatchStatus) {
  return {
    pending:          { label: "New Match",      variant: "secondary"   as const, icon: null },
    access_requested: { label: "Request Sent",   variant: "warning"     as const, icon: <Clock size={9} /> },
    consented:        { label: "Access Granted", variant: "success"     as const, icon: <CheckCircle2 size={9} /> },
    denied:           { label: "Access Denied",  variant: "destructive" as const, icon: <XCircle size={9} /> },
  }[s] ?? { label: s, variant: "secondary" as const, icon: null };
}

/* ─────────────────────────────────────────────────────────
   SCORE BAR
───────────────────────────────────────────────────────── */
function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999 }} />
      </div>
      <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BUSINESS CARD
───────────────────────────────────────────────────────── */
function BusinessCard({
  biz,
  onRequestAccess,
}: {
  biz: DiscoveryMatch;
  onRequestAccess: (matchId: string) => Promise<void>;
}) {
  const [requesting, setRequesting] = useState(false);
  const sc  = statusConfig(biz.status);
  const pct = Math.round(biz.match_score * 100);
  const shortId = `BIZ-${biz.anonymized_id.slice(0, 6).toUpperCase()}`;

  const matchedDate = new Date(biz.matched_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const requestedDate = biz.access_requested_at
    ? new Date(biz.access_requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;

  async function handleRequest() {
    setRequesting(true);
    await onRequestAccess(biz.match_id);
    setRequesting(false);
  }

  return (
    <div
      style={{
        background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
        overflow: "hidden", transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)";
        (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
          {/* Anonymous avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: biz.status === "consented" ? "#0A2540" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={17} color={biz.status === "consented" ? "#00D4FF" : "#9CA3AF"} />
          </div>

          <div style={{ minWidth: 0 }}>
            {/* ID + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" as const }}>
              <p style={{
                fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700,
                color: "#0A2540", letterSpacing: "-0.01em",
              }}>
                {shortId}
              </p>
              <Badge variant={sc.variant} style={{ fontSize: 9, padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                {sc.icon} {sc.label}
              </Badge>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                background: "#F3F4F6", padding: "1px 6px", borderRadius: 4,
                fontFamily: "monospace", letterSpacing: "0.02em",
              }}>
                {biz.anonymized_id.slice(0, 12).toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                {biz.capital_category.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Match score */}
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <p style={{
            fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, lineHeight: 1,
            color: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444",
            letterSpacing: "-0.04em",
          }}>
            {pct}%
          </p>
          <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>match score</p>
        </div>
      </div>

      {/* Score bar + dates */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <ScoreBar pct={pct} />
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            Matched: <span style={{ color: "#374151", fontWeight: 500 }}>{matchedDate}</span>
          </span>
          {requestedDate && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              Requested: <span style={{ color: "#374151", fontWeight: 500 }}>{requestedDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* Privacy notice + action */}
      <div style={{
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <p style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
          <ShieldCheck size={10} style={{ color: "#10B981", flexShrink: 0 }} />
          {biz.status === "consented"
            ? "Full profile unlocked"
            : "Identity hidden until consent"}
        </p>

        {biz.status === "consented" ? (
          <Link
            href={`/financer/business-profile?id=${biz.anonymized_id}`}
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
          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={12} /> Awaiting response
          </span>
        ) : biz.status === "denied" ? (
          <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <XCircle size={12} /> Access denied
          </span>
        ) : (
          <button
            disabled={requesting}
            onClick={handleRequest}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "1px solid #E5E7EB",
              background: requesting ? "#F9FAFB" : "white",
              color: requesting ? "#9CA3AF" : "#0A2540",
              fontSize: 12, fontWeight: 600,
              cursor: requesting ? "not-allowed" : "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              if (!requesting) {
                (e.currentTarget as HTMLElement).style.background = "#0A2540";
                (e.currentTarget as HTMLElement).style.color = "white";
                (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
              }
            }}
            onMouseLeave={e => {
              if (!requesting) {
                (e.currentTarget as HTMLElement).style.background = "white";
                (e.currentTarget as HTMLElement).style.color = "#0A2540";
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
              }
            }}
          >
            {requesting
              ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Requesting…</>
              : <><ArrowUpRight size={11} /> Request Access</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTER SELECT
───────────────────────────────────────────────────────── */
function FilterSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", padding: "7px 30px 7px 12px",
          borderRadius: 8, border: "1px solid #E5E7EB",
          background: "white", fontSize: 13, fontWeight: 500,
          color: "#0A2540", cursor: "pointer", outline: "none",
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
  const { user } = useSession();

  const [matches,       setMatches]       = useState<DiscoveryMatch[]>([]);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const [query,  setQuery]  = useState("");
  const [capCat, setCapCat] = useState("All Types");
  const [sortBy, setSortBy] = useState("Best Match");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ── Load ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      const instId = await getMyInstitutionId(user.id);

      if (!instId) {
        setError("No institution found. Please complete your institution setup.");
        setLoading(false);
        return;
      }

      setInstitutionId(instId);

      // Fetch only the columns that actually exist
      const { data, error: fetchErr } = await supabase
        .from("discovery_matches")
        .select(
          "match_id, anonymized_id, institution_id, criteria_id, " +
          "capital_category, match_score, status, matched_at, " +
          "access_requested_at, access_responded_at"
        )
        .eq("institution_id", instId)
        .order("match_score", { ascending: false });

      if (fetchErr) {
        console.error("discovery_matches error:", fetchErr);
        setError(`Failed to load discovery matches: ${fetchErr.message}`);
        setLoading(false);
        return;
      }

      setMatches((data ?? []) as DiscoveryMatch[]);
      setLoading(false);
    })();
  }, [user]);

  /* ── Request access ── */
  const handleRequestAccess = useCallback(async (matchId: string) => {
    if (!institutionId) return;

    const now = new Date().toISOString();

    // Optimistic update
    setMatches(prev =>
      prev.map(m =>
        m.match_id === matchId
          ? { ...m, status: "access_requested" as MatchStatus, access_requested_at: now }
          : m
      )
    );

    const { error } = await supabase
      .from("discovery_matches")
      .update({ status: "access_requested", access_requested_at: now })
      .eq("match_id", matchId)
      .eq("institution_id", institutionId);

    if (error) {
      // Revert
      setMatches(prev =>
        prev.map(m =>
          m.match_id === matchId
            ? { ...m, status: "pending" as MatchStatus, access_requested_at: null }
            : m
        )
      );
      console.error("Request access failed:", error.message);
    }
  }, [institutionId]);

  /* ── Filter + sort ── */
  const filtered = matches
    .filter(b => {
      const matchQ = query === "" ||
        b.anonymized_id.toLowerCase().includes(query.toLowerCase()) ||
        b.capital_category.toLowerCase().includes(query.toLowerCase());
      const matchC = capCat === "All Types" ||
        b.capital_category.replace(/_/g, " ") === capCat;
      const matchSt = statusFilter === "All" || b.status === statusFilter;
      return matchQ && matchC && matchSt;
    })
    .sort((a, b) => {
      if (sortBy === "Best Match")         return b.match_score - a.match_score;
      if (sortBy === "Recently Matched")   return new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime();
      if (sortBy === "Recently Requested") {
        const at = (x: DiscoveryMatch) => x.access_requested_at ? new Date(x.access_requested_at).getTime() : 0;
        return at(b) - at(a);
      }
      return 0;
    });

  const consentedCount  = matches.filter(b => b.status === "consented").length;
  const requestedCount  = matches.filter(b => b.status === "access_requested").length;
  const pendingCount    = matches.filter(b => b.status === "pending").length;

  const STATUS_FILTERS = ["All", "pending", "access_requested", "consented", "denied"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            Businesses
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {loading ? "Loading…" : (
              <>
                {matches.length} {matches.length === 1 ? "match" : "matches"} total
                {pendingCount > 0 && <> · <span style={{ color: "#6B7280" }}>{pendingCount} new</span></>}
                {requestedCount > 0 && <> · <span style={{ color: "#F59E0B", fontWeight: 600 }}>{requestedCount} pending response</span></>}
                {consentedCount > 0 && <> · <span style={{ color: "#10B981", fontWeight: 600 }}>{consentedCount} with access</span></>}
              </>
            )}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 8,
          background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
        }}>
          <ShieldCheck size={13} style={{ color: "#00A8CC" }} />
          <p style={{ fontSize: 12, color: "#0A5060" }}>
            Business identities are anonymous until consent is granted.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px", borderRadius: 10,
          background: "#FEF2F2", border: "1px solid #FECACA",
          fontSize: 13, color: "#B91C1C",
        }}>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          flex: "1 1 200px", maxWidth: 300, height: 36, padding: "0 12px",
          borderRadius: 8, border: "1px solid #E5E7EB", background: "white",
        }}>
          <Search size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ID or capital type…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0A2540", background: "transparent" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        <FilterSelect value={capCat} options={CAPITAL_CATS} onChange={setCapCat} />

        {/* Status pill filter */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {STATUS_FILTERS.map(s => {
            const label = s === "All" ? "All" : statusConfig(s as MatchStatus).label;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: "5px 10px", borderRadius: 7, border: "1px solid",
                borderColor: active ? "#0A2540" : "#E5E7EB",
                background: active ? "#0A2540" : "white",
                color: active ? "white" : "#6B7280",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 22, background: "#E5E7EB" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={13} style={{ color: "#9CA3AF" }} />
          <FilterSelect value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#9CA3AF" }}>
          {loading ? "…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{
          padding: "60px 24px", textAlign: "center" as const,
          background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
        }}>
          <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Loading businesses…</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Fetching your discovery matches.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "60px 24px", textAlign: "center" as const,
          background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
        }}>
          <Building2 size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>
            {matches.length === 0 ? "No matches yet" : "No results"}
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {matches.length === 0
              ? "Run the discovery-match process to start receiving matches."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map(b => (
            <BusinessCard key={b.match_id} biz={b} onRequestAccess={handleRequestAccess} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
