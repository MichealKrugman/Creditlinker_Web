"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Zap, AlertCircle, TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useDeveloperAccount } from "@/lib/developer-context";
import { TIER_LIMITS, tierLabel, computeResetDate } from "@/lib/dev-utils";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface DailyCount    { day: string; count: number }
interface TopEndpoint   { endpoint: string; method: string; count: number; avg_ms: number; success_rate: number }
interface ApiStats      { requests_today: number; requests_yesterday: number; avg_latency_ms: number | null; success_rate: number | null }
interface TierRow       { tier: string; label: string; requests_limit: number; webhooks_limit: number; price_label: string }

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
      {action}
    </div>
  );
}

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct   = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          <b style={{ color: "#0A2540" }}>{used.toLocaleString()}</b> / {limit.toLocaleString()}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9999, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{pct.toFixed(0)}% of monthly quota used</p>
    </div>
  );
}

function SparkBars({ data }: { data: DailyCount[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 4px", height: 80 }}>
      {data.map(d => (
        <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div title={`${d.count} requests on ${d.day}`}
            style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(d.count / max) * 68}px`, background: "linear-gradient(180deg, #00D4FF44, #00D4FF99)", border: "1px solid rgba(0,212,255,0.35)", minHeight: d.count > 0 ? 4 : 1, transition: "height 0.4s ease", cursor: "default" }} />
          <span style={{ fontSize: 9, color: "#9CA3AF", whiteSpace: "nowrap" as const }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: "32px 0", textAlign: "center" as const }}>
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function UsagePage() {
  const { account } = useDeveloperAccount();
  const tierKey    = account?.tier ?? "read";
  const limits     = TIER_LIMITS[tierKey] ?? TIER_LIMITS.read;
  const label      = tierLabel(account?.tier);
  const resetDate  = computeResetDate(account?.created_at);
  const liveRequests = account?.api_calls_30d ?? 0;

  const [daily,     setDaily]     = useState<DailyCount[]>([]);
  const [endpoints, setEndpoints] = useState<TopEndpoint[]>([]);
  const [stats,     setStats]     = useState<ApiStats | null>(null);
  const [tiers,     setTiers]     = useState<TierRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (dev_id: string) => {
    const [dailyRes, endpointsRes, statsRes, tiersRes] = await Promise.all([
      supabase.rpc("get_api_daily_counts",  { dev_id, days_back: 7 }),
      supabase.rpc("get_api_top_endpoints", { dev_id, days_back: 30 }),
      supabase.rpc("get_api_stats",         { dev_id }),
      supabase.from("developer_tiers").select("tier, label, requests_limit, webhooks_limit, price_label").order("requests_limit"),
    ]);

    if (dailyRes.data) {
      setDaily((dailyRes.data as any[]).map(r => ({
        day:   new Date(r.day).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        count: Number(r.count),
      })));
    }

    if (endpointsRes.data) {
      setEndpoints((endpointsRes.data as any[]).map(r => ({
        endpoint:     r.endpoint,
        method:       r.method,
        count:        Number(r.count),
        avg_ms:       Number(r.avg_ms ?? 0),
        success_rate: Number(r.success_rate ?? 0),
      })));
    }

    if (statsRes.data?.[0]) {
      const s = statsRes.data[0] as any;
      setStats({
        requests_today:     Number(s.requests_today     ?? 0),
        requests_yesterday: Number(s.requests_yesterday ?? 0),
        avg_latency_ms:     s.avg_latency_ms != null ? Number(s.avg_latency_ms) : null,
        success_rate:       s.success_rate   != null ? Number(s.success_rate)   : null,
      });
    }

    if (tiersRes.data) setTiers(tiersRes.data as TierRow[]);
  }, []);

  useEffect(() => {
    if (!account?.id) return;
    setLoading(true);
    fetchAll(account.id).finally(() => setLoading(false));
  }, [account?.id, fetchAll]);

  async function handleRefresh() {
    if (!account?.id || refreshing) return;
    setRefreshing(true);
    await fetchAll(account.id);
    setRefreshing(false);
  }

  const todayCount     = stats?.requests_today     ?? 0;
  const yesterdayCount = stats?.requests_yesterday ?? 0;
  const trend          = todayCount - yesterdayCount;
  const weekTotal      = daily.reduce((a, d) => a + d.count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Usage</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="outline">{label} Plan</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Resets {resetDate}</span>
          </div>
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing || loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: refreshing || loading ? "default" : "pointer", opacity: refreshing || loading ? 0.6 : 1 }}>
          <RefreshCw size={12} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 768px) { .dev-usage-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {[
          {
            label: "Requests Today",
            value: loading ? "—" : todayCount.toLocaleString(),
            icon: Activity,
            trend: loading ? null : trend,
            trendLabel: loading ? "" : `${Math.abs(trend).toLocaleString()} vs yesterday`,
          },
          {
            label: "Avg Latency",
            value: loading || stats?.avg_latency_ms == null ? "—" : `${stats.avg_latency_ms}ms`,
            icon: Zap,
            trend: null,
            trendLabel: "last 30 days",
          },
          {
            label: "Monthly Used",
            value: `${limits.requests > 0 ? ((liveRequests / limits.requests) * 100).toFixed(0) : 0}%`,
            icon: TrendingUp,
            trend: null,
            trendLabel: `${liveRequests.toLocaleString()} of ${limits.requests.toLocaleString()}`,
          },
          {
            label: "Success Rate",
            value: loading || stats?.success_rate == null ? "—" : `${stats.success_rate}%`,
            icon: AlertCircle,
            trend: null,
            trendLabel: "last 30 days",
          },
        ].map(card => (
          <Card key={card.label} style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                <card.icon size={16} />
              </div>
              {card.trend !== null && (
                <span style={{ fontSize: 11, fontWeight: 700, color: card.trend >= 0 ? "#10B981" : "#F59E0B", display: "flex", alignItems: "center", gap: 3 }}>
                  {card.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(card.trend).toLocaleString()}
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{card.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{card.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{card.trendLabel}</p>
          </Card>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="dev-usage-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Daily chart */}
          <Card>
            <CardHeader title="Daily Requests — Last 7 Days"
              action={<span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> UTC</span>} />
            <div style={{ padding: "18px 22px 22px" }}>
              {loading
                ? <EmptyState label="Loading…" />
                : daily.length === 0
                  ? <EmptyState label="No requests in the last 7 days." />
                  : <>
                      <SparkBars data={daily} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                        <div>
                          <span style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
                            {weekTotal.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 13, color: "#6B7280", marginLeft: 6 }}>total this week</span>
                        </div>
                      </div>
                    </>
              }
            </div>
          </Card>

          {/* Top endpoints */}
          <Card>
            <CardHeader title="Top Endpoints" />
            <div style={{ padding: "12px 0 8px" }}>
              {loading
                ? <EmptyState label="Loading…" />
                : endpoints.length === 0
                  ? <EmptyState label="No endpoint activity yet." />
                  : endpoints.map((ep, i) => (
                      <div key={`${ep.method}-${ep.endpoint}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderBottom: i < endpoints.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: ep.method === "GET" ? "#ECFDF5" : "#EFF6FF", color: ep.method === "GET" ? "#059669" : "#2563EB", fontFamily: "monospace", flexShrink: 0 }}>
                          {ep.method}
                        </span>
                        <code style={{ flex: 1, fontSize: 11, color: "#374151", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, whiteSpace: "nowrap" as const }}>
                          {ep.endpoint}
                        </code>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{ep.count.toLocaleString()}</p>
                          <p style={{ fontSize: 10, color: "#9CA3AF" }}>{ep.avg_ms}ms avg</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ep.success_rate >= 99.5 ? "#10B981" : "#F59E0B", minWidth: 40, textAlign: "right" as const, flexShrink: 0 }}>
                          {ep.success_rate}%
                        </span>
                      </div>
                    ))
              }
            </div>
          </Card>

        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Monthly quota */}
          <Card style={{ padding: "18px 22px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 18 }}>Monthly Quota</p>
            <QuotaBar label="API Requests"  used={liveRequests} limit={limits.requests}  />
            <QuotaBar label="Webhooks"       used={0}            limit={limits.webhooks}  />
            <QuotaBar label="Pipeline Runs"  used={0}            limit={limits.pipelines} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 0", borderTop: "1px solid #F3F4F6" }}>
              <Clock size={11} style={{ color: "#9CA3AF" }} />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Quota resets {resetDate}</span>
            </div>
          </Card>

          {/* Plan comparison */}
          <Card>
            <div style={{ padding: "18px 22px 0" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Upgrade Plan</p>
            </div>
            <div style={{ padding: "12px 0 8px" }}>
              {tiers.length === 0
                ? <EmptyState label="Loading plans…" />
                : tiers.map((t, i) => (
                    <div key={t.tier} style={{ padding: "12px 22px", borderBottom: i < tiers.length - 1 ? "1px solid #F3F4F6" : "none", background: t.tier === tierKey ? "rgba(0,212,255,0.03)" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{t.label}</span>
                          {t.tier === tierKey && <Badge variant="secondary" style={{ fontSize: 9 }}>Current</Badge>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0A2540" }}>{t.price_label}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{t.requests_limit.toLocaleString()} req/mo · {t.webhooks_limit.toLocaleString()} webhooks</p>
                    </div>
                  ))
              }
            </div>
            <div style={{ padding: "12px 22px 16px" }}>
              <a href="/developers/support"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "9px 0", borderRadius: 8, background: "#0A2540", fontSize: 13, fontWeight: 600, color: "white", textDecoration: "none" }}>
                Upgrade Plan
              </a>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
