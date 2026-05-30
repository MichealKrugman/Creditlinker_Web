"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpRight, Clock, CheckCircle2, XCircle,
  Building2, ShieldCheck, Loader2, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES — exact discovery_matches schema
───────────────────────────────────────────────────────── */
type MatchStatus = "access_requested" | "consented" | "denied" | "pending";

type DiscoveryMatch = {
  match_id: string;
  anonymized_id: string;
  institution_id: string;
  criteria_id: string | null;
  capital_category: string;
  match_score: number;
  status: MatchStatus;
  matched_at: string;
  access_requested_at: string | null;
  access_responded_at: string | null;
};

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────── */
function statusConfig(s: MatchStatus) {
  return {
    pending:          { label: "New Match",       variant: "secondary"   as const, icon: <Building2   size={11} /> },
    access_requested: { label: "Awaiting Response", variant: "warning"   as const, icon: <Clock       size={11} /> },
    consented:        { label: "Access Granted",  variant: "success"     as const, icon: <CheckCircle2 size={11} /> },
    denied:           { label: "Declined",        variant: "destructive" as const, icon: <XCircle     size={11} /> },
  }[s] ?? { label: s, variant: "secondary" as const, icon: null };
}

/* ─────────────────────────────────────────────────────────
   SCORE BAR
───────────────────────────────────────────────────────── */
function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, fontFamily: "var(--font-display)" }}>
        {pct}%
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REQUEST ROW
───────────────────────────────────────────────────────── */
function RequestRow({
  req,
  expanded,
  onToggle,
}: {
  req: DiscoveryMatch;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sc      = statusConfig(req.status);
  const pct     = Math.round(req.match_score * 100);
  const shortId = `BIZ-${req.anonymized_id.slice(0, 6).toUpperCase()}`;

  const requestedDate = req.access_requested_at
    ? new Date(req.access_requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : new Date(req.matched_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const respondedDate = req.access_responded_at
    ? new Date(req.access_responded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
      overflow: "hidden", transition: "border-color 0.15s",
    }}>
      {/* Row summary */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 110px 130px 36px",
          gap: 12, padding: "14px 20px",
          alignItems: "center", cursor: "pointer",
        }}
      >
        {/* Business */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: req.status === "consented" ? "#0A2540" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={15} color={req.status === "consented" ? "#00D4FF" : "#9CA3AF"} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{shortId}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
              {req.capital_category.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Match score */}
        <div style={{ minWidth: 0 }}>
          <ScoreBar pct={pct} />
        </div>

        {/* Date */}
        <p style={{ fontSize: 12, color: "#6B7280" }}>{requestedDate}</p>

        {/* Status */}
        <Badge variant={sc.variant} style={{ fontSize: 10, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {sc.icon} {sc.label}
        </Badge>

        {/* Chevron */}
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: "#F9FAFB",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
          transform: expanded ? "rotate(90deg)" : "none",
        }}>
          <ArrowUpRight size={12} style={{ color: "#9CA3AF" }} />
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "20px", background: "#FAFAFA" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
            {/* Left: details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                background: "white", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "14px 16px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px",
              }}>
                {[
                  { label: "Anonymized ID",  value: req.anonymized_id.slice(0, 16).toUpperCase() },
                  { label: "Capital Type",   value: req.capital_category.replace(/_/g, " ") },
                  { label: "Match Score",    value: `${pct}%` },
                  { label: "Matched",        value: new Date(req.matched_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                  { label: "Requested",      value: req.access_requested_at ? requestedDate : "—" },
                  { label: "Responded",      value: respondedDate ?? "—" },
                ].map(r => (
                  <div key={r.label}>
                    <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
                      {r.label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{r.value}</p>
                  </div>
                ))}
              </div>

              {/* Privacy notice */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
              }}>
                <ShieldCheck size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.5 }}>
                  {req.status === "consented"
                    ? "Full financial profile is now unlocked. You can view scores, metrics, and identity details."
                    : req.status === "access_requested"
                    ? "You've requested access. The business will be notified and can approve or decline."
                    : req.status === "denied"
                    ? "This business declined to share their financial profile."
                    : "Business identity and financials are hidden until they grant consent."}
                </p>
              </div>
            </div>

            {/* Right: action */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
              {req.status === "consented" && (
                <Link
                  href={`/financer/business-profile?id=${req.anonymized_id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 8,
                    background: "#0A2540", color: "white",
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  <ShieldCheck size={13} /> View Profile
                </Link>
              )}
              {req.status === "access_requested" && (
                <span style={{
                  fontSize: 12, color: "#F59E0B", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "9px 14px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A",
                }}>
                  <Clock size={12} /> Awaiting response
                </span>
              )}
              {req.status === "denied" && (
                <span style={{
                  fontSize: 12, color: "#EF4444", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "9px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA",
                }}>
                  <XCircle size={12} /> Access declined
                </span>
              )}
              {req.status === "pending" && (
                <Link
                  href="/financer/businesses"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 8,
                    border: "1px solid #E5E7EB", background: "white",
                    color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  <ArrowUpRight size={13} /> Request Access
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancingRequests() {
  const { user } = useSession();

  const [matches,  setMatches]  = useState<DiscoveryMatch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | MatchStatus>("all");

  /* ── Load ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      const instId = await getMyInstitutionId(user.id);

      if (!instId) {
        setError("No institution found.");
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("discovery_matches")
        .select(
          "match_id, anonymized_id, institution_id, criteria_id, " +
          "capital_category, match_score, status, matched_at, " +
          "access_requested_at, access_responded_at"
        )
        .eq("institution_id", instId)
        .in("status", ["access_requested", "consented", "denied"])
        .order("access_requested_at", { ascending: false, nullsFirst: false });

      if (fetchErr) {
        setError(`Failed to load requests: ${fetchErr.message}`);
        setLoading(false);
        return;
      }

      setMatches((data ?? []) as unknown as DiscoveryMatch[]);
      setLoading(false);
    })();
  }, [user]);

  /* ── Filter ── */
  const filtered = filter === "all" ? matches : matches.filter(r => r.status === filter);

  const counts = {
    all:              matches.length,
    access_requested: matches.filter(r => r.status === "access_requested").length,
    consented:        matches.filter(r => r.status === "consented").length,
    denied:           matches.filter(r => r.status === "denied").length,
  };

  const tabs = [
    { key: "all"              as const, label: "All" },
    { key: "access_requested" as const, label: "Awaiting" },
    { key: "consented"        as const, label: "Access Granted" },
    { key: "denied"           as const, label: "Declined" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
        }}>
          Financing Requests
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          {loading ? "Loading…" : (
            <>
              {counts.all} total
              {counts.access_requested > 0 && (
                <> · <span style={{ color: "#F59E0B", fontWeight: 600 }}>{counts.access_requested} awaiting response</span></>
              )}
              {counts.consented > 0 && (
                <> · <span style={{ color: "#10B981", fontWeight: 600 }}>{counts.consented} granted</span></>
              )}
            </>
          )}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8,
              border: filter === tab.key ? "1px solid #0A2540" : "1px solid #E5E7EB",
              background: filter === tab.key ? "#0A2540" : "white",
              color: filter === tab.key ? "white" : "#6B7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {tab.label}
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 18, height: 18, borderRadius: 9999,
              background: filter === tab.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
              color: filter === tab.key ? "white" : "#6B7280",
              fontSize: 10, fontWeight: 700, padding: "0 4px",
            }}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table header — desktop only */}
      {!loading && filtered.length > 0 && (
        <>
          <div
            className="req-desktop-header"
            style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 130px 36px", gap: 12, padding: "0 20px 4px" }}
          >
            {["Business", "Match Score", "Date", "Status", ""].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
            ))}
          </div>
          <style>{`@media (max-width: 640px) { .req-desktop-header { display: none !important; } }`}</style>
        </>
      )}

      {/* Rows */}
      {loading ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Loading requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Building2 size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No requests</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {filter === "all"
              ? "Request access to businesses on the Businesses page to see them here."
              : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(req => (
            <RequestRow
              key={req.match_id}
              req={req}
              expanded={expanded === req.match_id}
              onToggle={() => setExpanded(expanded === req.match_id ? null : req.match_id)}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
