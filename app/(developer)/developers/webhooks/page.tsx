"use client";

import { useState } from "react";
import {
  Webhook, Plus, Trash2, RefreshCw, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Send, AlertCircle,
  Clock, Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
const EVENT_TYPES = [
  { value: "score.updated",        label: "score.updated",        desc: "Financial score recalculated after pipeline run" },
  { value: "pipeline.completed",   label: "pipeline.completed",   desc: "Data pipeline finishes processing" },
  { value: "consent.granted",      label: "consent.granted",      desc: "Business grants a financer access" },
  { value: "consent.revoked",      label: "consent.revoked",      desc: "Business revokes financer access" },
  { value: "financing.granted",    label: "financing.granted",    desc: "A financing record is created" },
  { value: "financing.settled",    label: "financing.settled",    desc: "Financing settlement confirmed" },
  { value: "dispute.opened",       label: "dispute.opened",       desc: "A dispute is raised on a financing record" },
  { value: "identity.verified",    label: "identity.verified",    desc: "Business identity verification completed" },
];

type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  last_delivery: string | null;
  success_rate: number;
  created_at: string;
  deliveries: { id: string; event: string; status: "success" | "failed"; time: string; status_code: number }[];
};

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "wh_01",
    url: "https://app.mycompany.io/webhooks/creditlinker",
    events: ["score.updated", "consent.granted", "consent.revoked"],
    status: "active",
    last_delivery: "2 min ago",
    success_rate: 98.7,
    created_at: "Jan 10, 2025",
    deliveries: [
      { id: "del_01", event: "score.updated",   status: "success", time: "2 min ago",   status_code: 200 },
      { id: "del_02", event: "consent.granted", status: "success", time: "1 hr ago",    status_code: 200 },
      { id: "del_03", event: "score.updated",   status: "failed",  time: "3 hrs ago",   status_code: 503 },
      { id: "del_04", event: "consent.revoked", status: "success", time: "1 day ago",   status_code: 200 },
    ],
  },
  {
    id: "wh_02",
    url: "https://staging.mycompany.io/hooks/cl-events",
    events: ["pipeline.completed", "financing.granted"],
    status: "disabled",
    last_delivery: "5 days ago",
    success_rate: 100,
    created_at: "Dec 14, 2024",
    deliveries: [
      { id: "del_05", event: "pipeline.completed", status: "success", time: "5 days ago", status_code: 200 },
    ],
  },
];

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
  hook, onDelete, onToggle, onTest,
}: {
  hook: WebhookEndpoint;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    onTest(hook.id);
    setTimeout(() => setTesting(false), 1500);
  };

  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      {/* Header row */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: hook.status === "active" ? "#F0FDFF" : "#F3F4F6",
          border: `1px solid ${hook.status === "active" ? "rgba(0,212,255,0.2)" : "#E5E7EB"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hook.status === "active" ? "#0A5060" : "#9CA3AF",
        }}>
          <Globe size={15} strokeWidth={1.8} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <code style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>
              {hook.url}
            </code>
            <Badge variant={hook.status === "active" ? "success" : "outline"} style={{ fontSize: 9 }}>
              {hook.status}
            </Badge>
          </div>

          {/* Events */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {hook.events.map(e => (
              <span key={e} style={{
                fontSize: 10, fontWeight: 600, color: "#0A5060",
                background: "rgba(0,212,255,0.06)",
                border: "1px solid rgba(0,212,255,0.15)",
                padding: "2px 7px", borderRadius: 9999,
                fontFamily: "var(--font-mono, monospace)",
              }}>
                {e}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} /> Last delivery: {hook.last_delivery ?? "Never"}
            </span>
            <span style={{ fontSize: 11, color: hook.success_rate >= 95 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
              {hook.success_rate}% success
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Button
            variant="outline" size="sm"
            onClick={handleTest}
            disabled={hook.status === "disabled"}
            style={{ gap: 5, height: 30, fontSize: 12 }}
          >
            {testing ? <RefreshCw size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={11} />}
            {testing ? "Sending…" : "Test"}
          </Button>

          <button
            onClick={() => onToggle(hook.id)}
            style={{
              height: 30, padding: "0 10px", borderRadius: 7,
              border: "1px solid #E5E7EB", background: "white",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              color: hook.status === "active" ? "#F59E0B" : "#10B981",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            {hook.status === "active" ? "Disable" : "Enable"}
          </button>

          <button
            onClick={() => onDelete(hook.id)}
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid #FCA5A5", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#EF4444", transition: "all 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            <Trash2 size={12} />
          </button>

          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid #E5E7EB", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#9CA3AF",
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Delivery history */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F9FAFB", background: "#FAFAFA" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 24px 6px" }}>
            Recent Deliveries
          </p>
          {hook.deliveries.map(d => (
            <div key={d.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 24px", borderBottom: "1px solid #F3F4F6",
            }}>
              {d.status === "success"
                ? <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                : <XCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
              }
              <code style={{ fontSize: 12, color: "#374151", flex: 1, fontFamily: "var(--font-mono, monospace)" }}>
                {d.event}
              </code>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 9999,
                background: d.status === "success" ? "#ECFDF5" : "#FEF2F2",
                color: d.status === "success" ? "#10B981" : "#EF4444",
              }}>
                {d.status_code}
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{d.time}</span>
            </div>
          ))}
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
  onAdd: (url: string, events: string[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["score.updated"]);

  const toggle = (e: string) =>
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const valid = url.startsWith("https://") && events.length > 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 520, overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Add Webhook Endpoint
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            Creditlinker will send POST requests to this URL when selected events occur.
          </p>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* URL */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Endpoint URL <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-app.io/webhooks/creditlinker"
              style={{
                width: "100%", padding: "9px 12px",
                border: `1px solid ${url && !url.startsWith("https://") ? "#EF4444" : "#D1D5DB"}`,
                borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {url && !url.startsWith("https://") && (
              <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>URL must use HTTPS</p>
            )}
          </div>

          {/* Events */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              Events to listen for
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {EVENT_TYPES.map(et => (
                <label key={et.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${events.includes(et.value) ? "rgba(0,212,255,0.25)" : "#E5E7EB"}`,
                  background: events.includes(et.value) ? "rgba(0,212,255,0.04)" : "white",
                  transition: "all 0.12s",
                }}>
                  <input
                    type="checkbox" checked={events.includes(et.value)}
                    onChange={() => toggle(et.value)}
                    style={{ marginTop: 2, accentColor: "#0A2540" }}
                  />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>{et.label}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{et.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => { if (valid) { onAdd(url, events); onClose(); } }} disabled={!valid}>
            <Webhook size={13} /> Add Endpoint
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
  const [hooks, setHooks] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOKS);
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = (id: string) => setHooks(prev => prev.filter(h => h.id !== id));
  const handleToggle = (id: string) => setHooks(prev => prev.map(h => h.id === id ? { ...h, status: h.status === "active" ? "disabled" : "active" } : h));
  const handleTest = (_id: string) => { /* In real impl: POST test delivery */ };

  const handleAdd = (url: string, events: string[]) => {
    setHooks(prev => [{
      id: `wh_${Date.now()}`,
      url,
      events,
      status: "active",
      last_delivery: null,
      success_rate: 100,
      created_at: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      deliveries: [],
    }, ...prev]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Webhooks
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Receive real-time notifications when platform events occur.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} style={{ gap: 6, flexShrink: 0 }}>
          <Plus size={13} /> Add Endpoint
        </Button>
      </div>

      {/* ── INFO BANNER ── */}
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        padding: "14px 18px", borderRadius: 12,
        background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)",
      }}>
        <AlertCircle size={15} style={{ color: "#0891B2", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "#0A5060", lineHeight: 1.6 }}>
          Creditlinker signs all webhook payloads with an <code style={{ fontSize: 12, background: "rgba(0,212,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>X-CL-Signature</code> header.
          Verify this in your handler using your webhook secret.
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
          {hooks.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <Webhook size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No webhook endpoints</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Add an endpoint to start receiving events.</p>
              <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} style={{ gap: 5 }}>
                <Plus size={13} /> Add Endpoint
              </Button>
            </div>
          ) : (
            hooks.map(h => (
              <WebhookRow key={h.id} hook={h} onDelete={handleDelete} onToggle={handleToggle} onTest={handleTest} />
            ))
          )}
        </div>
      </Card>

      {/* ── EVENT CATALOG ── */}
      <Card>
        <div style={{ padding: "18px 24px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Available Events
          </p>
        </div>
        <div style={{ padding: "12px 0 8px" }}>
          {EVENT_TYPES.map((et, i) => (
            <div key={et.value} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "10px 24px",
              borderBottom: i < EVENT_TYPES.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <code style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", minWidth: 180, flexShrink: 0 }}>
                {et.value}
              </code>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{et.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {showAdd && <AddWebhookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
