"use client";

import { useState, useEffect } from "react";
import {
  Bell, BellOff, Building2, Loader2, Info,
  CheckCircle2, Clock, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { useIsMobile } from "@/lib/mobile-nav-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type MatchStatus = "pending" | "access_requested" | "consented" | "denied";

type MonitoredBusiness = {
  consent_id:    string;
  business_id:   string;
  anonymized_id: string;
  granted_at:    string;
};

type AlertItem = {
  id:       string;
  title:    string;
  detail:   string;
  at:       string;
  severity: "positive" | "warning" | "info";
  href?:    string;
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function severityStyle(s: "positive" | "warning" | "info") {
  return {
    positive: { bg: "#ECFDF5", border: "rgba(16,185,129,0.15)", dot: "#10B981" },
    warning:  { bg: "#FFFBEB", border: "rgba(245,158,11,0.15)",  dot: "#F59E0B" },
    info:     { bg: "#F9FAFB", border: "#E5E7EB",                dot: "#9CA3AF" },
  }[s];
}

/* Build synthetic alert feed from discovery_matches status history */
function buildAlerts(matches: {
  match_id:             string;
  anonymized_id:        string;
  status:               MatchStatus;
  matched_at:           string;
  access_requested_at:  string | null;
  access_responded_at:  string | null;
  capital_category:     string;
}[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const m of matches) {
    const shortId = `BIZ-${m.anonymized_id.slice(0, 6).toUpperCase()}`;
    const cat     = m.capital_category.replace(/_/g, " ");

    // New match
    alerts.push({
      id:       `${m.match_id}_matched`,
      title:    `New match — ${shortId}`,
      detail:   `A ${cat} business was matched to your criteria.`,
      at:       m.matched_at,
      severity: "info",
      href:     "/financer/businesses",
    });

    // Request sent
    if (m.access_requested_at) {
      alerts.push({
        id:       `${m.match_id}_requested`,
        title:    `Access requested — ${shortId}`,
        detail:   `You requested access to this ${cat} business's financial profile.`,
        at:       m.access_requested_at,
        severity: "info",
        href:     "/financer/requests",
      });
    }

    // Response received
    if (m.access_responded_at) {
      const granted = m.status === "consented";
      alerts.push({
        id:       `${m.match_id}_responded`,
        title:    granted ? `Access granted — ${shortId}` : `Access declined — ${shortId}`,
        detail:   granted
          ? `${shortId} approved your request. Their full financial profile is now available.`
          : `${shortId} declined your access request for this ${cat} opportunity.`,
        at:       m.access_responded_at,
        severity: granted ? "positive" : "warning",
        href:     granted ? "/financer/businesses" : "/financer/requests",
      });
    }
  }

  // Sort newest first
  return alerts.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerAlerts() {
  const { user } = useSession();
  const isMobile = useIsMobile();

  const [alerts,    setAlerts]    = useState<AlertItem[]>([]);
  const [monitored, setMonitored] = useState<MonitoredBusiness[]>([]);
  const [muted,     setMuted]     = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      // Resolve institution
      let instId: string | null = null;
      const { data: inst } = await supabase.from("institutions").select("institution_id").eq("owner_id", user.id).maybeSingle();
      if (inst) {
        instId = inst.institution_id;
      } else {
        const { data: member } = await supabase.from("institution_members").select("institution_id").eq("user_id", user.id).maybeSingle();
        instId = member?.institution_id ?? null;
      }

      if (!instId) { setError("No institution found."); setLoading(false); return; }

      const [matchRes, consentRes] = await Promise.all([
        // All matches — used to build the alert feed
        supabase
          .from("discovery_matches")
          .select("match_id, anonymized_id, capital_category, status, matched_at, access_requested_at, access_responded_at")
          .eq("institution_id", instId)
          .order("matched_at", { ascending: false })
          .limit(100),

        // Consented businesses — used for the Monitored panel
        supabase
          .from("consent_records")
          .select("consent_id, business_id, granted_at, businesses ( financial_identity_id )")
          .eq("institution_id", instId)
          .eq("is_active", true)
          .order("granted_at", { ascending: false }),
      ]);

      if (matchRes.error) { setError(matchRes.error.message); setLoading(false); return; }

      setAlerts(buildAlerts(matchRes.data ?? []));

      setMonitored((consentRes.data ?? []).map((c: any) => ({
        consent_id:    c.consent_id,
        business_id:   c.business_id,
        anonymized_id: c.businesses?.financial_identity_id ?? c.business_id,
        granted_at:    c.granted_at,
      })));

      setLoading(false);
    })();
  }, [user]);

  function toggleMute(consentId: string) {
    setMuted(prev => {
      const next = new Set(prev);
      next.has(consentId) ? next.delete(consentId) : next.add(consentId);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Alerts
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          {loading ? "Loading…" : `${alerts.length} event${alerts.length !== 1 ? "s" : ""} across your discovery activity`}
        </p>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Left: alert feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Activity Feed
          </p>

          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Loader2 size={24} style={{ color: "#D1D5DB", marginBottom: 10, animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading activity…</p>
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Bell size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No activity yet</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
                Events like new matches, access requests, and responses will appear here.
              </p>
              <Link href="/financer/businesses" style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                Browse businesses <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : (
            alerts.slice(0, 30).map(alert => {
              const sc = severityStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  style={{
                    background: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", gap: 14,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{alert.title}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{fmtRelative(alert.at)}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: alert.href ? 8 : 0 }}>{alert.detail}</p>
                    {alert.href && (
                      <Link href={alert.href} style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        View <ArrowUpRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: monitored businesses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Monitored Businesses
          </p>

          {loading ? (
            <div style={{ padding: "32px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Loader2 size={20} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
            </div>
          ) : monitored.length === 0 ? (
            <div style={{ padding: "24px 20px", background: "white", borderRadius: 12, border: "1px solid #E5E7EB", textAlign: "center" as const }}>
              <Building2 size={22} style={{ color: "#E5E7EB", marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No consented businesses</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
                Businesses that grant you access will appear here.
              </p>
            </div>
          ) : (
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
              {monitored.map((biz, i) => {
                const isMuted = muted.has(biz.consent_id);
                const shortId = `BIZ-${biz.anonymized_id.slice(0, 6).toUpperCase()}`;
                return (
                  <div key={biz.consent_id} style={{
                    padding: "12px 16px",
                    borderBottom: i < monitored.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Building2 size={12} color="#9CA3AF" />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{shortId}</p>
                      </div>
                      <button
                        onClick={() => toggleMute(biz.consent_id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 9px", borderRadius: 6,
                          border: `1px solid ${isMuted ? "#0A2540" : "#E5E7EB"}`,
                          background: isMuted ? "#0A2540" : "white",
                          color: isMuted ? "white" : "#6B7280",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {isMuted ? <><Bell size={10} /> Unmute</> : <><BellOff size={10} /> Mute</>}
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", paddingLeft: 36 }}>
                      Access since {new Date(biz.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {isMuted && (
                      <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4, paddingLeft: 36, display: "flex", alignItems: "center", gap: 4 }}>
                        <BellOff size={10} /> Alerts muted
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info */}
          <div style={{ display: "flex", gap: 7, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8 }}>
            <Info size={12} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "#0A5060", lineHeight: 1.6 }}>
              Activity is generated from your discovery matches — new matches, access requests you send, and responses from businesses.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
