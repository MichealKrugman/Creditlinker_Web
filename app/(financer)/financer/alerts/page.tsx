"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, Building2, Loader2, Info,
  TrendingDown, TrendingUp, RefreshCw, ShieldAlert, Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { useIsMobile } from "@/lib/mobile-nav-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type AlertSeverity = "positive" | "warning" | "critical" | "info";
type AlertKind =
  | "score_up"
  | "score_down"
  | "data_refreshed"
  | "data_stale"
  | "consent_expiring";

type AlertItem = {
  id:           string;
  kind:         AlertKind;
  business_id:  string;
  anonymized_id: string;
  title:        string;
  detail:       string;
  at:           string;
  severity:     AlertSeverity;
  href?:        string;
};

type MonitoredBusiness = {
  consent_id:    string;
  business_id:   string;
  anonymized_id: string;
  business_name: string | null;   // real name — only set once consent granted
  granted_at:    string;
  expiry:        string | null;
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function kindMeta(kind: AlertKind) {
  return {
    score_up:         { icon: <TrendingUp   size={14} />, color: "#10B981", bg: "#ECFDF5" },
    score_down:       { icon: <TrendingDown size={14} />, color: "#EF4444", bg: "#FEF2F2" },
    data_refreshed:   { icon: <RefreshCw    size={14} />, color: "#3B82F6", bg: "#EFF6FF" },
    data_stale:       { icon: <Clock        size={14} />, color: "#F59E0B", bg: "#FFFBEB" },
    consent_expiring: { icon: <ShieldAlert  size={14} />, color: "#F59E0B", bg: "#FFFBEB" },
  }[kind];
}

const STALE_DAYS    = 14;  // no pipeline run in N days → stale alert
const EXPIRY_DAYS   = 7;   // consent expiring within N days → alert
const SCORE_DELTA   = 5;   // minimum point change to surface a score alert

/* ─────────────────────────────────────────────────────────
   DATA BUILDER
   Sources: creditlinker_scores, pipeline_runs, consent_records
───────────────────────────────────────────────────────── */
function buildAlerts(
  consentedBusinessIds: string[],
  anonymizedMap: Record<string, string>,        // business_id → display label (real name if consented)
  anonIdMap: Record<string, string>,            // business_id → financial_identity_id (always anonymized)
  scores: {
    business_id:      string;
    composite_score:  number;
    computed_at:      string;
    pipeline_run_id:  string;
  }[],
  pipelines: {
    business_id:  string;
    completed_at: string | null;
  }[],
  consents: {
    consent_id:  string;
    business_id: string;
    expiry:      string | null;
  }[],
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();

  // ── Score change alerts ───────────────────────────────
  // Group scores by business_id, take latest two, diff
  const byBiz: Record<string, typeof scores> = {};
  for (const s of scores) {
    if (!consentedBusinessIds.includes(s.business_id)) continue;
    (byBiz[s.business_id] ??= []).push(s);
  }

  for (const [bizId, rows] of Object.entries(byBiz)) {
    const sorted = rows.sort((a, b) =>
      new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime()
    );
    if (sorted.length < 2) continue;

    const [latest, prev] = sorted;
    const delta = latest.composite_score - prev.composite_score;
    if (Math.abs(delta) < SCORE_DELTA) continue;

    const shortId = `BIZ-${(anonIdMap[bizId] ?? bizId).slice(0, 6).toUpperCase()}`;
    const up = delta > 0;
    alerts.push({
      id:            `score_${bizId}_${latest.pipeline_run_id}`,
      kind:          up ? "score_up" : "score_down",
      business_id:   bizId,
      anonymized_id: anonymizedMap[bizId] ?? bizId,
      title:         `Score ${up ? "improved" : "dropped"} — ${shortId}`,
      detail:        `Composite score ${up ? "rose" : "fell"} by ${Math.abs(delta)} points (${prev.composite_score} → ${latest.composite_score}).`,
      at:            latest.computed_at,
      severity:      up ? "positive" : "warning",
      href:          `/financer/businesses`,
    });
  }

  // ── Data freshness alerts ─────────────────────────────
  // Latest pipeline_run per business among consented set
  const latestRun: Record<string, string> = {};
  for (const p of pipelines) {
    if (!consentedBusinessIds.includes(p.business_id)) continue;
    if (!p.completed_at) continue;
    if (!latestRun[p.business_id] || p.completed_at > latestRun[p.business_id]) {
      latestRun[p.business_id] = p.completed_at;
    }
  }

  for (const bizId of consentedBusinessIds) {
    const lastRun = latestRun[bizId];
    const shortId = `BIZ-${(anonIdMap[bizId] ?? bizId).slice(0, 6).toUpperCase()}`;

    if (!lastRun) {
      alerts.push({
        id:            `stale_${bizId}_never`,
        kind:          "data_stale",
        business_id:   bizId,
        anonymized_id: anonymizedMap[bizId] ?? bizId,
        title:         `No data yet — ${shortId}`,
        detail:        `No pipeline run has completed for this business. Data may not be available.`,
        at:            new Date().toISOString(),
        severity:      "warning",
      });
      continue;
    }

    const staleness = now - new Date(lastRun).getTime();
    const staleDays = Math.floor(staleness / 86_400_000);

    if (staleDays >= STALE_DAYS) {
      alerts.push({
        id:            `stale_${bizId}_${lastRun}`,
        kind:          "data_stale",
        business_id:   bizId,
        anonymized_id: anonymizedMap[bizId] ?? bizId,
        title:         `Data stale — ${shortId}`,
        detail:        `Last pipeline run was ${staleDays} days ago. Profile data may be outdated.`,
        at:            lastRun,
        severity:      "warning",
      });
    } else {
      // Recent refresh is a positive info signal
      const refreshedDays = staleDays;
      if (refreshedDays <= 2) {
        alerts.push({
          id:            `refreshed_${bizId}_${lastRun}`,
          kind:          "data_refreshed",
          business_id:   bizId,
          anonymized_id: anonymizedMap[bizId] ?? bizId,
          title:         `Data refreshed — ${shortId}`,
          detail:        `Pipeline completed ${fmtRelative(lastRun)}. Profile is up to date.`,
          at:            lastRun,
          severity:      "info",
        });
      }
    }
  }

  // ── Consent expiry alerts ─────────────────────────────
  for (const c of consents) {
    if (!c.expiry) continue;
    if (!consentedBusinessIds.includes(c.business_id)) continue;
    const daysLeft = Math.floor((new Date(c.expiry).getTime() - now) / 86_400_000);
    if (daysLeft < 0 || daysLeft > EXPIRY_DAYS) continue;

    const shortId = `BIZ-${(anonIdMap[c.business_id] ?? c.business_id).slice(0, 6).toUpperCase()}`;
    alerts.push({
      id:            `expiry_${c.consent_id}`,
      kind:          "consent_expiring",
      business_id:   c.business_id,
      anonymized_id: anonymizedMap[c.business_id] ?? c.business_id,
      title:         `Consent expiring — ${shortId}`,
      detail:        daysLeft === 0
        ? `Access to ${shortId} expires today.`
        : `Access to ${shortId} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
      at:            c.expiry,
      severity:      daysLeft <= 2 ? "critical" : "warning",
    });
  }

  return alerts.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerAlerts() {
  const { user }  = useSession();
  const isMobile  = useIsMobile();

  const [alerts,    setAlerts]    = useState<AlertItem[]>([]);
  const [monitored, setMonitored] = useState<MonitoredBusiness[]>([]);
  const [muted,     setMuted]     = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const instId = await getMyInstitutionId(user.id);
    if (!instId) { setError("No institution found."); setLoading(false); return; }

    // 1. Consented businesses
    const { data: consentData, error: consentErr } = await supabase
      .from("consent_records")
      .select("consent_id, business_id, granted_at, permissions, businesses ( name, financial_identity_id )")
      .eq("institution_id", instId)
      .eq("is_active", true)
      .order("granted_at", { ascending: false });

    if (consentErr) { setError(consentErr.message); setLoading(false); return; }

    const consents = (consentData ?? []).map((c: any) => ({
      consent_id:    c.consent_id,
      business_id:   c.business_id,
      anonymized_id: c.businesses?.financial_identity_id ?? c.business_id,
      business_name: c.businesses?.name ?? null,
      granted_at:    c.granted_at,
      expiry:        c.permissions?.valid_until ?? null,
    }));

    const consentedIds  = consents.map(c => c.business_id);
    // Display names for the right-panel (real name once consented, anon ID otherwise)
    const anonymizedMap: Record<string, string> = {};
    // Always-anon IDs used in alert feed titles (financial_identity_id)
    const anonIdMap: Record<string, string> = {};
    for (const c of consents) {
      anonymizedMap[c.business_id] = c.business_name ?? c.anonymized_id;
      anonIdMap[c.business_id] = c.anonymized_id;
    }

    if (consentedIds.length === 0) {
      setMonitored([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    // 2. Scores: fetch latest + previous per business using two targeted queries
    //    (replaces the old limit(n*5) bulk fetch + client-side dedup)
    const [latestScoreRes, prevScoreRes, pipelineRes, prefRes] = await Promise.all([
      // Latest score per business — one row each
      supabase
        .from("creditlinker_scores")
        .select("business_id, composite_score, computed_at, pipeline_run_id")
        .in("business_id", consentedIds)
        .order("computed_at", { ascending: false })
        .limit(consentedIds.length),

      // Previous score per business — second-most-recent row
      // We fetch 2 per business and will use [1] after grouping
      supabase
        .from("creditlinker_scores")
        .select("business_id, composite_score, computed_at, pipeline_run_id")
        .in("business_id", consentedIds)
        .order("computed_at", { ascending: false })
        .limit(consentedIds.length * 2),

      supabase
        .from("pipeline_runs")
        .select("business_id, completed_at")
        .in("business_id", consentedIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(consentedIds.length * 3),

      supabase
        .from("alert_preferences")
        .select("business_id, is_muted")
        .eq("institution_id", instId),
    ]);

    if (latestScoreRes.error) { setError(latestScoreRes.error.message); setLoading(false); return; }
    if (pipelineRes.error)    { setError(pipelineRes.error.message);    setLoading(false); return; }

    // Merge latest + prev into a combined scores array (max 2 per business)
    const seenCount: Record<string, number> = {};
    const mergedScores: typeof latestScoreRes.data = [];
    for (const row of (prevScoreRes.data ?? [])) {
      const count = seenCount[row.business_id] ?? 0;
      if (count < 2) {
        mergedScores.push(row);
        seenCount[row.business_id] = count + 1;
      }
    }

    // Restore persisted mute state
    const mutedIds = new Set(
      (prefRes.data ?? []).filter((p: any) => p.is_muted).map((p: any) => p.business_id as string)
    );
    setMuted(mutedIds);

    setMonitored(consents as MonitoredBusiness[]);
    setAlerts(buildAlerts(
      consentedIds,
      anonymizedMap,
      anonIdMap,
      mergedScores ?? [],
      pipelineRes.data ?? [],
      consents.map(c => ({ consent_id: c.consent_id, business_id: c.business_id, expiry: c.expiry })),
    ));

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function toggleMute(bizId: string, consentId: string) {
    const instId = await getMyInstitutionId(user!.id);
    if (!instId) return;
    const nowMuted = muted.has(bizId);
    setMuted(prev => {
      const next = new Set(prev);
      nowMuted ? next.delete(bizId) : next.add(bizId);
      return next;
    });
    await supabase
      .from("alert_preferences")
      .upsert({
        institution_id: instId,
        business_id:    bizId,
        consent_id:     consentId,
        is_muted:       !nowMuted,
        updated_at:     new Date().toISOString(),
      }, { onConflict: "institution_id,business_id" });
  }

  // Filter out alerts for muted businesses
  const visibleAlerts = alerts.filter(a => !muted.has(a.business_id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Alerts
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {loading
              ? "Loading…"
              : `Monitoring ${monitored.length} business${monitored.length !== 1 ? "es" : ""} · ${visibleAlerts.length} alert${visibleAlerts.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", cursor: loading ? "not-allowed" : "pointer" }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
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
            Monitoring Feed
          </p>

          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Loader2 size={24} style={{ color: "#D1D5DB", marginBottom: 10, animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Checking monitored businesses…</p>
            </div>
          ) : monitored.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Bell size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No businesses monitored yet</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.6 }}>
                Alerts appear here once businesses grant you access to their profile. Score changes, data freshness, and consent expiry will be surfaced automatically.
              </p>
              <Link href="/financer/businesses" style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                Browse businesses <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <Bell size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>All clear</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
                No significant changes detected across your monitored businesses.
                {muted.size > 0 && ` (${muted.size} business${muted.size !== 1 ? "es" : ""} muted)`}
              </p>
            </div>
          ) : (
            visibleAlerts.map(alert => {
              const meta = kindMeta(alert.kind);
              return (
                <div
                  key={alert.id}
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.color}26`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    gap: 14,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "white", border: `1px solid ${meta.color}26`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{alert.title}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{fmtRelative(alert.at)}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: alert.href ? 8 : 0 }}>
                      {alert.detail}
                    </p>
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
                const isMuted   = muted.has(biz.business_id);
                const displayName = biz.business_name ?? `BIZ-${biz.anonymized_id.slice(0, 6).toUpperCase()}`;
                const alertCnt  = alerts.filter(a => a.business_id === biz.business_id).length;
                return (
                  <div key={biz.consent_id} style={{
                    padding: "12px 16px",
                    borderBottom: i < monitored.length - 1 ? "1px solid #F3F4F6" : "none",
                    opacity: isMuted ? 0.6 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Building2 size={12} color="#9CA3AF" />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{displayName}</p>
                          {alertCnt > 0 && !isMuted && (
                            <p style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>{alertCnt} alert{alertCnt !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMute(biz.business_id, biz.consent_id)}
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
                      {biz.expiry && (
                        <> · expires {new Date(biz.expiry).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 7, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8 }}>
            <Info size={12} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "#0A5060", lineHeight: 1.6 }}>
              Alerts are generated from score changes, pipeline freshness, and consent expiry across businesses that have granted you access. Muting a business hides its alerts without revoking access.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
