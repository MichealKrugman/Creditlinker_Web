"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Webhook, Plus, Trash2, RefreshCw, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Send, AlertCircle,
  Clock, Globe, Loader2, RotateCcw, SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useDeveloperAccount } from "@/lib/developer-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type WebhookEndpoint = {
  id:           string;
  url:          string;
  events:       string[];
  is_active:    boolean;
  last_used_at: string | null;
  created_at:   string;
};

type DeliveryRecord = {
  id:            string;
  event_type:    string;
  status:        "delivered" | "failed" | "pending" | "dead_lettered";
  http_status:   number | null;
  attempt_count: number;
  last_error:    string | null;
  created_at:    string;
};

const EVENT_TYPES = [
  { value: "score.updated",        desc: "Financial score recalculated after pipeline run" },
  { value: "pipeline.completed",   desc: "Data pipeline finishes processing" },
  { value: "consent.granted",      desc: "Business grants a financer access" },
  { value: "consent.revoked",      desc: "Business revokes financer access" },
  { value: "financing.granted",    desc: "A financing record is created" },
  { value: "financing.settled",    desc: "Financing settlement confirmed" },
  { value: "dispute.opened",       desc: "A dispute is raised on a financing record" },
  { value: "identity.verified",    desc: "Business identity verification completed" },
];

function formatTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusColor(status: DeliveryRecord["status"]): { bg: string; text: string } {
  switch (status) {
    case "delivered":    return { bg: "#ECFDF5", text: "#10B981" };
    case "failed":       return { bg: "#FEF2F2", text: "#EF4444" };
    case "dead_lettered": return { bg: "#FFF7ED", text: "#F97316" };
    default:             return { bg: "#F3F4F6", text: "#6B7280" };
  }
}

/* ─────────────────────────────────────────────────────────
   SHARED CARD
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WEBHOOK ROW
───────────────────────────────────────────────────────── */
function WebhookRow({
  hook, developerId, onDelete, onToggle, onTest,
}: {
  hook:        WebhookEndpoint;
  developerId: string;
  onDelete:    (id: string) => void;
  onToggle:    (id: string, current: boolean) => void;
  onTest:      (id: string) => Promise<void>;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [deliveries,  setDeliveries]  = useState<DeliveryRecord[]>([]);
  const [loadingDels, setLoadingDels] = useState(false);
  const [retrying,    setRetrying]    = useState<string | null>(null);

  async function loadDeliveries() {
    setLoadingDels(true);
    const { data } = await supabase
      .from("developer_webhook_events")
      .select("id, event_type, status, http_status, attempt_count, last_error, created_at")
      .eq("developer_id", developerId)
      .eq("endpoint_url", hook.url)
      .order("created_at", { ascending: false })
      .limit(10);
    setDeliveries(data ?? []);
    setLoadingDels(false);
  }

  function handleExpand() {
    setExpanded(v => {
      if (!v) loadDeliveries();
      return !v;
    });
  }

  async function handleTest() {
    setTesting(true);
    await onTest(hook.id);
    setTesting(false);
    setDeliveries([]);
    loadDeliveries();
  }

  async function handleRetry(deliveryId: string) {
    setRetrying(deliveryId);
    // Reset the delivery to pending so the retry runner picks it up immediately.
    await supabase
      .from("developer_webhook_events")
      .update({ status: "pending", next_retry_at: new Date().toISOString() })
      .eq("id", deliveryId);
    await loadDeliveries();
    setRetrying(null);
  }

  const lastUsed = hook.last_used_at ? formatTime(hook.last_used_at) : "Never";

  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      <div className="dev-wh-row-header" style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: hook.is_active ? "#F0FDFF" : "#F3F4F6",
          border: `1px solid ${hook.is_active ? "rgba(0,212,255,0.2)" : "#E5E7EB"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hook.is_active ? "#0A5060" : "#9CA3AF",
        }}>
          <Globe size={15} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <code style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", wordBreak: "break-all" }}>
              {hook.url}
            </code>
            <Badge variant={hook.is_active ? "success" : "outline"} style={{ fontSize: 9 }}>
              {hook.is_active ? "active" : "disabled"}
            </Badge>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {hook.events.map(e => (
              <span key={e} style={{
                fontSize: 10, fontWeight: 600, color: "#0A5060",
                background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)",
                padding: "2px 7px", borderRadius: 9999, fontFamily: "var(--font-mono, monospace)",
              }}>
                {e}
              </span>
            ))}
          </div>

          <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} /> Last delivery: {lastUsed}
          </span>
        </div>

        <div className="dev-wh-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={!hook.is_active || testing} style={{ gap: 5, height: 30, fontSize: 12 }}>
            {testing ? <RefreshCw size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={11} />}
            {testing ? "Sending…" : "Test"}
          </Button>
          <button
            onClick={() => onToggle(hook.id, hook.is_active)}
            style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: hook.is_active ? "#F59E0B" : "#10B981", transition: "all 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            {hook.is_active ? "Disable" : "Enable"}
          </button>
          <button onClick={() => onDelete(hook.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FCA5A5", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444", transition: "all 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}>
            <Trash2 size={12} />
          </button>
          <button onClick={handleExpand} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F9FAFB", background: "#FAFAFA" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px 6px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Recent Deliveries
            </p>
            <button onClick={loadDeliveries} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
          {loadingDels ? (
            <div style={{ padding: "16px 24px" }}>
              <Loader2 size={14} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : deliveries.length === 0 ? (
            <p style={{ padding: "12px 24px", fontSize: 12, color: "#9CA3AF" }}>No deliveries yet.</p>
          ) : deliveries.map(d => {
            const colors      = statusColor(d.status);
            const canRetry    = d.status === "failed" || d.status === "dead_lettered";
            const isRetrying  = retrying === d.id;
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 24px", borderBottom: "1px solid #F3F4F6", flexWrap: "wrap" }}>
                {d.status === "delivered"
                  ? <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                  : d.status === "pending"
                    ? <Clock size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                    : <XCircle size={13} style={{ color: d.status === "dead_lettered" ? "#F97316" : "#EF4444", flexShrink: 0 }} />
                }
                <code style={{ fontSize: 12, color: "#374151", flex: 1, fontFamily: "var(--font-mono, monospace)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {d.event_type}
                </code>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 9999, background: colors.bg, color: colors.text, flexShrink: 0 }}>
                  {d.status}
                </span>
                {d.http_status != null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.status === "delivered" ? "#10B981" : "#EF4444", flexShrink: 0 }}>
                    {d.http_status}
                  </span>
                )}
                {d.attempt_count > 0 && (
                  <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0 }}>
                    {d.attempt_count} attempt{d.attempt_count !== 1 ? "s" : ""}
                  </span>
                )}
                {d.last_error && (
                  <span style={{ fontSize: 10, color: "#EF4444", flexShrink: 0, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={d.last_error}>
                    {d.last_error}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{formatTime(d.created_at)}</span>
                {canRetry && (
                  <button
                    onClick={() => handleRetry(d.id)}
                    disabled={isRetrying}
                    title={d.status === "dead_lettered" ? "Re-queue this dead-lettered delivery" : "Retry this delivery now"}
                    style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#6B7280", background: "white", border: "1px solid #E5E7EB", borderRadius: 5, padding: "2px 7px", cursor: "pointer", flexShrink: 0 }}
                  >
                    {isRetrying
                      ? <Loader2 size={9} style={{ animation: "spin 0.8s linear infinite" }} />
                      : d.status === "dead_lettered"
                        ? <SkipForward size={9} />
                        : <RotateCcw size={9} />
                    }
                    {d.status === "dead_lettered" ? "Re-queue" : "Retry"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ADD WEBHOOK MODAL
───────────────────────────────────────────────────────── */
function AddWebhookModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd:   (url: string, events: string[]) => Promise<void>;
}) {
  const [url,    setUrl]    = useState("");
  const [events, setEvents] = useState<string[]>(["score.updated"]);
  const [saving, setSaving] = useState(false);

  const toggle = (e: string) =>
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const valid = url.startsWith("https://") && events.length > 0;

  async function handleAdd() {
    setSaving(true);
    await onAdd(url, events);
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, overflow: "hidden", margin: "0 16px" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>Add Webhook Endpoint</h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Creditlinker will send POST requests to this URL when selected events occur.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Endpoint URL <span style={{ color: "#EF4444" }}>*</span></label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-app.io/webhooks/creditlinker"
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${url && !url.startsWith("https://") ? "#EF4444" : "#D1D5DB"}`, borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
            {url && !url.startsWith("https://") && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>URL must use HTTPS</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Events to listen for</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {EVENT_TYPES.map(et => (
                <label key={et.value} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", border: `1px solid ${events.includes(et.value) ? "rgba(0,212,255,0.25)" : "#E5E7EB"}`, background: events.includes(et.value) ? "rgba(0,212,255,0.04)" : "white", transition: "all 0.12s" }}>
                  <input type="checkbox" checked={events.includes(et.value)} onChange={() => toggle(et.value)} style={{ marginTop: 2, accentColor: "#0A2540" }} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>{et.value}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{et.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleAdd} disabled={!valid || saving}>
            {saving ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><Webhook size={13} /> Add Endpoint</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function WebhooksPage() {
  const { account } = useDeveloperAccount();
  const [hooks,   setHooks]   = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const loadHooks = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("developer_webhooks")
      .select("id, url, events, is_active, last_used_at, created_at")
      .eq("developer_id", account.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setHooks(data ?? []);
    setLoading(false);
  }, [account]);

  useEffect(() => { loadHooks(); }, [loadHooks]);

  async function handleAdd(url: string, events: string[]) {
    if (!account) return;
    setError(null);
    const { error } = await supabase.from("developer_webhooks").insert({
      developer_id: account.id, url, events, is_active: true,
    });
    if (error) { setError(error.message); return; }
    await loadHooks();
  }

  async function handleDelete(id: string) {
    setError(null);
    const { error } = await supabase.from("developer_webhooks").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setHooks(prev => prev.filter(h => h.id !== id));
  }

  async function handleToggle(id: string, current: boolean) {
    setError(null);
    const { error } = await supabase.from("developer_webhooks").update({ is_active: !current }).eq("id", id);
    if (error) { setError(error.message); return; }
    setHooks(prev => prev.map(h => h.id === id ? { ...h, is_active: !current } : h));
  }

  async function handleTest(id: string): Promise<void> {
    const hook = hooks.find(h => h.id === id);
    if (!hook || !account) return;
    try {
      await fetch("/api/webhooks/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": "dev_internal_test",
        },
        body: JSON.stringify({
          event_type:   "ping",
          developer_id: account.id,
          payload:      { message: "Test event from Creditlinker developer portal", webhook_id: id },
        }),
      });
    } catch { /* ignore */ }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .dev-wh-row-header { padding: 12px 14px !important; flex-wrap: wrap !important; }
          .dev-wh-actions    { flex-wrap: wrap !important; flex-shrink: 1 !important; width: 100% !important; margin-top: 4px; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Webhooks</h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Receive real-time notifications when platform events occur.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} style={{ gap: 6, flexShrink: 0 }}>
          <Plus size={13} /> Add Endpoint
        </Button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 18px", borderRadius: 12, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)" }}>
        <AlertCircle size={15} style={{ color: "#0891B2", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "#0A5060", lineHeight: 1.6 }}>
          Creditlinker signs all webhook payloads with an <code style={{ fontSize: 12, background: "rgba(0,212,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>X-CL-Signature</code> header.
          Failed deliveries are retried automatically with exponential backoff (1 min → 5 min → 30 min → 2 hr → dead-letter).
          You can also retry or re-queue individual deliveries from the delivery log below.
        </p>
      </div>

      {/* ── ENDPOINTS ── */}
      <Card>
        <div style={{ padding: "18px 24px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Endpoints ({hooks.length})
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : hooks.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <Webhook size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No webhook endpoints</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Add an endpoint to start receiving events.</p>
              <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} style={{ gap: 5 }}>
                <Plus size={13} /> Add Endpoint
              </Button>
            </div>
          ) : hooks.map(h => (
            <WebhookRow
              key={h.id}
              hook={h}
              developerId={account?.id ?? ""}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onTest={handleTest}
            />
          ))}
        </div>
      </Card>

      {/* ── EVENT CATALOG ── */}
      <Card>
        <div style={{ padding: "18px 24px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Available Events</p>
        </div>
        <div style={{ padding: "12px 0 8px" }}>
          {EVENT_TYPES.map((et, i) => (
            <div key={et.value} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 24px", borderBottom: i < EVENT_TYPES.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <code style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>{et.value}</code>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{et.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {showAdd && <AddWebhookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
