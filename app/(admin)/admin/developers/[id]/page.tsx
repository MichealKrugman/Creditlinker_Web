"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, Building2,
  Key, Activity, Webhook, Ban, RefreshCw,
  CheckCircle2, Clock, BarChart3, Code2,
} from "lucide-react";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canManage } from "@/lib/admin-rbac";
import { useAdminUser } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
async function callFn(name: string, body?: object, method: "GET" | "POST" = "POST") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  DATA LOADER
// ─────────────────────────────────────────────────────────────
async function loadDeveloperDetail(ownerId: string) {
  // Developer = a user with a developer profile; owner_id links to auth.users
  // We pull from: businesses (owner_id), sdk_api_keys, sdk_events (aggregated), webhooks
  const [businessR, keysR, eventsR, webhooksR] = await Promise.allSettled([
    supabase.from("businesses")
      .select("business_id, name, sector, profile_status, kyc_status, tier, created_at")
      .eq("owner_id", ownerId)
      .maybeSingle(),
    supabase.from("sdk_api_keys")
      .select("key_id, key_prefix, tier, status, last_used_at, created_at, expires_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase.from("sdk_events")
      .select("event_id, event_type, endpoint, status_code, duration_ms, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("webhooks")
      .select("webhook_id, url, events, status, last_triggered_at, created_at")
      .eq("owner_id", ownerId),
  ]);

  const business = businessR.status === "fulfilled" ? businessR.value.data : null;
  const keys     = keysR.status     === "fulfilled" ? (keysR.value.data     ?? []) : [];
  const events   = eventsR.status   === "fulfilled" ? (eventsR.value.data   ?? []) : [];
  const webhooks = webhooksR.status === "fulfilled" ? (webhooksR.value.data ?? []) : [];

  // Aggregate usage stats
  const now30dAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const calls30d  = events.filter((e: any) => e.created_at >= now30dAgo).length;
  const errorsRate = events.length > 0
    ? Math.round(events.filter((e: any) => (e.status_code ?? 0) >= 400).length / events.length * 100)
    : 0;
  const avgDuration = events.length > 0
    ? Math.round(events.reduce((s: number, e: any) => s + (e.duration_ms ?? 0), 0) / events.length)
    : 0;

  // Top endpoints
  const endpointCounts: Record<string, number> = {};
  events.forEach((e: any) => {
    if (e.endpoint) endpointCounts[e.endpoint] = (endpointCounts[e.endpoint] ?? 0) + 1;
  });
  const topEndpoints = Object.entries(endpointCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));

  return { business, keys, events, webhooks, stats: { calls30d, errorsRate, avgDuration, totalCalls: events.length, topEndpoints } };
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
function fmtCalls(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function statusColor(s: string) {
  if (s === "active"  ) return { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)" };
  if (s === "suspended") return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" };
  return { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
}

function tierColor(t: string) {
  if (t === "build")  return { color: "#6366F1", bg: "#EEF2FF" };
  if (t === "signal") return { color: "#0891B2", bg: "#F0FDFF" };
  return { color: "#6B7280", bg: "#F3F4F6" };
}

function statusCodeColor(code: number) {
  if (code >= 500) return "#EF4444";
  if (code >= 400) return "#F59E0B";
  return "#10B981";
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel, danger, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; danger?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(10,37,64,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 440, padding: 28 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 20 }}>{description}</p>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          Reason <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Reason — recorded in audit log."
          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
          onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")} />
        {error && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" disabled={!reason.trim() || loading}
            style={{ gap: 6, background: danger ? "#EF4444" : undefined }}
            onClick={async () => {
              setLoading(true); setError("");
              try { await onConfirm(reason.trim()); onClose(); }
              catch (e: any) { setError(e.message ?? "Action failed"); setLoading(false); }
            }}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CARD + KV
// ─────────────────────────────────────────────────────────────
function Card({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#6B7280" }}>{icon}</span>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
        </div>
        {action}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}
function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, color: "#0A2540" }}>{value ?? "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function DeveloperDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const { adminUser } = useAdminUser();
  const canAct  = canManage(adminUser, "developers");

  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState<"overview" | "api_usage" | "webhooks">("overview");
  const [confirm,   setConfirm]   = useState<{ type: string; title: string; description: string; label: string; danger?: boolean } | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await loadDeveloperDetail(id)); }
    catch (e: any) { setError(e.message ?? "Failed to load developer"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function runAction(type: string, reason: string) {
    setActionMsg(""); setActionErr("");
    try {
      if (type === "suspend") {
        await callFn("admin-suspend-developer", { developer_id: id, reason });
      } else if (type === "activate") {
        await callFn("admin-activate-developer", { developer_id: id, reason });
      }
      setActionMsg("Action completed.");
      await load();
    } catch (e: any) {
      setActionErr(e.message ?? "Action failed");
    }
  }

  // ── LOADING / ERROR ─────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 12 }}>
      <Loader2 size={24} style={{ color: "#9CA3AF" }} className="animate-spin" />
      <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading developer profile…</p>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16 }}>
      <AlertTriangle size={28} style={{ color: "#EF4444" }} />
      <p style={{ fontSize: 15, color: "#374151" }}>{error}</p>
      <Link href="/admin/developers"><Button variant="outline" size="sm" style={{ gap: 6 }}><ArrowLeft size={13} /> Back</Button></Link>
    </div>
  );

  const business  = data?.business;
  const keys      = (data?.keys ?? []) as any[];
  const events    = (data?.events ?? []) as any[];
  const webhooks  = (data?.webhooks ?? []) as any[];
  const stats     = data?.stats ?? { calls30d: 0, errorsRate: 0, avgDuration: 0, totalCalls: 0, topEndpoints: [] };

  const displayName  = business?.name ?? id;
  const activeKeys   = keys.filter((k: any) => k.status === "active");
  const primaryTier  = activeKeys[0]?.tier ?? keys[0]?.tier ?? "read";
  const tc           = tierColor(primaryTier);

  const tabs = [
    { id: "overview",   label: "Overview"   },
    { id: "api_usage",  label: "API Usage",  badge: stats.calls30d },
    { id: "webhooks",   label: "Webhooks",   badge: webhooks.length },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* BACK + HEADER */}
      <div>
        <Link href="/admin/developers"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", textDecoration: "none", marginBottom: 14 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0A2540")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6B7280")}>
          <ArrowLeft size={14} /> All Developers
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: tc.color, flexShrink: 0 }}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 6 }}>
                {displayName}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 9999, background: tc.bg, color: tc.color }}>
                  {primaryTier} tier
                </span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{activeKeys.length} active key{activeKeys.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 20px", display: "flex", gap: 24 }}>
            {[
              { label: "30d Calls",    value: fmtCalls(stats.calls30d) },
              { label: "Error Rate",   value: `${stats.errorsRate}%` },
              { label: "Avg Latency",  value: `${stats.avgDuration}ms` },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: "center", ...(i > 0 ? { paddingLeft: 24, borderLeft: "1px solid #F3F4F6" } : {}) }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em" }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 2, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: tab === t.id ? "#0A2540" : "transparent", color: tab === t.id ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}
            {"badge" in t && (t.badge as number) > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: tab === t.id ? "rgba(255,255,255,0.25)" : "#F3F4F6", color: tab === t.id ? "white" : "#6B7280", borderRadius: 9999, padding: "1px 6px" }}>
                {fmtCalls(t.badge as number)}
              </span>
            )}
          </button>
        ))}
      </div>

      {actionMsg && <div style={{ background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#065F46" }}>{actionMsg}</div>}
      {actionErr && <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#991B1B" }}>{actionErr}</div>}

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Business profile */}
          {business && (
            <Card title="Linked Business Profile" icon={<Building2 size={15} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <KV label="Business Name"   value={business.name} />
                <KV label="Sector"          value={business.sector} />
                <KV label="Profile Status"  value={<span style={{ textTransform: "capitalize" }}>{business.profile_status}</span>} />
                <KV label="KYC Status"      value={<span style={{ textTransform: "capitalize" }}>{business.kyc_status}</span>} />
                <KV label="Tier"            value={<span style={{ textTransform: "capitalize" }}>{business.tier ?? "—"}</span>} />
                <KV label="Registered"      value={fmt(business.created_at)} />
              </div>
              <Link href={`/admin/businesses/${business.business_id}`}
                style={{ fontSize: 12, color: "#6366F1", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 14 }}>
                View business profile →
              </Link>
            </Card>
          )}

          {/* API Keys */}
          <Card title="API Keys" icon={<Key size={15} />}>
            {keys.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No API keys found.</p>
            ) : keys.map((k: any) => {
              const sc = statusColor(k.status ?? "active");
              const tc2 = tierColor(k.tier ?? "read");
              return (
                <div key={k.key_id} style={{ padding: "12px 0", borderBottom: "1px solid #F9FAFB", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#0A2540", fontWeight: 600 }}>{k.key_prefix}…</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: tc2.bg, color: tc2.color }}>{k.tier ?? "read"}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>{k.status ?? "active"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                      Created {fmt(k.created_at)} · Last used {fmt(k.last_used_at)}
                      {k.expires_at && ` · Expires ${fmt(k.expires_at)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Actions */}
          {canAct && (
            <Card title="Actions" icon={<Activity size={15} />}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="outline" size="sm" style={{ gap: 6, color: "#EF4444", borderColor: "rgba(239,68,68,0.3)" }}
                  onClick={() => setConfirm({ type: "suspend", title: `Suspend ${displayName}?`, description: "This revokes all API keys and blocks all integration access. The developer's consents are preserved.", label: "Suspend", danger: true })}>
                  <Ban size={13} /> Suspend Developer
                </Button>
                <Button variant="outline" size="sm" style={{ gap: 6, color: "#10B981", borderColor: "rgba(16,185,129,0.3)" }}
                  onClick={() => setConfirm({ type: "activate", title: `Reactivate ${displayName}?`, description: "This restores API access. Existing API keys will be reactivated.", label: "Reactivate" })}>
                  <RefreshCw size={13} /> Reactivate
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── API USAGE TAB ─────────────────────────────────────── */}
      {tab === "api_usage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { label: "Total Calls (50 recent)", value: fmtCalls(stats.totalCalls), color: "#0A2540" },
              { label: "30-day Calls",             value: fmtCalls(stats.calls30d),   color: "#6366F1" },
              { label: "Error Rate",               value: `${stats.errorsRate}%`,      color: stats.errorsRate > 10 ? "#EF4444" : "#10B981" },
              { label: "Avg Latency",              value: `${stats.avgDuration}ms`,    color: "#0A2540" },
            ].map((s) => (
              <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top endpoints */}
          {stats.topEndpoints.length > 0 && (
            <Card title="Top Endpoints" icon={<BarChart3 size={15} />}>
              {stats.topEndpoints.map(({ endpoint, count }: { endpoint: string; count: number }, i: number) => {
                const maxCount = stats.topEndpoints[0]?.count ?? 1;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={endpoint} style={{ padding: "10px 0", borderBottom: i < stats.topEndpoints.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#374151" }}>{endpoint}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{fmtCalls(count)}</span>
                    </div>
                    <div style={{ height: 4, background: "#F3F4F6", borderRadius: 9999 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#6366F1", borderRadius: 9999, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Recent events */}
          <Card title="Recent API Calls" icon={<Code2 size={15} />}>
            {events.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No API events recorded.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {["Time", "Endpoint", "Status", "Duration"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(0, 20).map((ev: any) => (
                      <tr key={ev.event_id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "9px 12px", fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{fmtTime(ev.created_at)}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12, fontFamily: "monospace", color: "#374151" }}>{ev.endpoint ?? ev.event_type ?? "—"}</td>
                        <td style={{ padding: "9px 12px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: statusCodeColor(ev.status_code ?? 200) }}>{ev.status_code ?? "—"}</span>
                        </td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "#6B7280" }}>{ev.duration_ms != null ? `${ev.duration_ms}ms` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── WEBHOOKS TAB ─────────────────────────────────────── */}
      {tab === "webhooks" && (
        <Card title="Configured Webhooks" icon={<Webhook size={15} />}>
          {webhooks.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <Webhook size={18} style={{ color: "#D1D5DB", margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No webhooks configured.</p>
            </div>
          ) : webhooks.map((wh: any, i: number) => {
            const sc = statusColor(wh.status ?? "active");
            return (
              <div key={wh.webhook_id} style={{ padding: "14px 0", borderBottom: i < webhooks.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", wordBreak: "break-all", marginBottom: 4 }}>{wh.url}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(wh.events ?? []).map((ev: string) => (
                        <span key={ev} style={{ fontSize: 10, fontFamily: "monospace", background: "#F3F4F6", color: "#374151", padding: "2px 6px", borderRadius: 4 }}>{ev}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                    {wh.status ?? "active"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Created {fmt(wh.created_at)}</p>
                  {wh.last_triggered_at && <p style={{ fontSize: 11, color: "#9CA3AF" }}>Last triggered {fmt(wh.last_triggered_at)}</p>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.label}
          danger={confirm.danger}
          onConfirm={async (reason) => { await runAction(confirm.type, reason); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
