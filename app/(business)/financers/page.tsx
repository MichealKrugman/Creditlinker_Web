"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck, Clock, XCircle, ChevronRight,
  AlertCircle, Landmark, Eye, EyeOff,
  CheckCircle2, X, RefreshCw, Info, Search,
  History, MessageSquare, Send, ArrowLeft,
  Building2, CheckCheck, Paperclip, Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   TYPES & MOCK DATA
   Replace with:
     GET /business/consent            → ConsentRecord[]
     GET /business/discovery/requests → ConsentRequest[]
     GET /business/messages           → Thread[]
     POST /business/messages/:thread_id/send → Message
───────────────────────────────────────────────────────── */
type Permission = { can_view_score: boolean; can_view_transaction_detail: boolean; can_view_identity: boolean };

interface Message {
  message_id: string;
  sender_type: "business" | "institution";
  content: string;
  sent_at: string;
  read_at?: string;
}

interface Thread {
  thread_id: string;
  institution_id: string;
  institution_name: string;
  consent_id: string;
  financing_id?: string;
  last_message: string;
  last_message_at: string;
  business_unread: number;
  messages: Message[];
}

const ACTIVE_CONSENTS = [
  {
    consent_id: "con_001", institution_id: "inst_002",
    institution_name: "Lapo Microfinance", institution_type: "Microfinance Bank",
    granted_at: "Nov 15, 2024", valid_until: "Feb 15, 2025",
    days_remaining: 48, is_active: true,
    permissions: { can_view_score: true, can_view_transaction_detail: false, can_view_identity: true },
    access_log: [
      { accessed_at: "Today, 09:22",  action: "Viewed financial identity" },
      { accessed_at: "Dec 27, 14:10", action: "Viewed score dimensions" },
      { accessed_at: "Dec 20, 11:45", action: "Viewed financial identity" },
    ],
    financing_record_id: "fin_001",
    thread_id: "thr_001",
  },
  {
    consent_id: "con_002", institution_id: "inst_001",
    institution_name: "Stanbic IBTC", institution_type: "Commercial Bank",
    granted_at: "Dec 10, 2024", valid_until: "Mar 10, 2025",
    days_remaining: 71, is_active: true,
    permissions: { can_view_score: true, can_view_transaction_detail: true, can_view_identity: true },
    access_log: [
      { accessed_at: "Dec 28, 08:55", action: "Viewed transaction detail" },
      { accessed_at: "Dec 15, 16:20", action: "Viewed financial identity" },
    ],
    financing_record_id: null,
    thread_id: "thr_002",
  },
];

const PENDING_REQUESTS = [
  { request_id: "req_001", institution_id: "inst_003", institution_name: "Coronation Merchant Bank", institution_type: "Merchant Bank", requested_at: "Today, 11:30", capital_category: "Invoice Financing", match_score: 81 },
];

const REVOKED_CONSENTS = [
  { consent_id: "con_003", institution_name: "Wema Bank", institution_type: "Commercial Bank", granted_at: "Sep 5, 2024", revoked_at: "Nov 2, 2024", reason: "Financing offer rejected" },
];

const INITIAL_THREADS: Thread[] = [
  {
    thread_id: "thr_001", institution_id: "inst_002", institution_name: "Lapo Microfinance",
    consent_id: "con_001", financing_id: "fin_001",
    last_message: "Great — I'll schedule a call for Thursday 3pm. In the meantime, could you confirm the primary bank account?",
    last_message_at: "2024-12-31T09:05:00Z",
    business_unread: 1,
    messages: [
      { message_id: "m_001", sender_type: "institution", content: "Thank you for connecting. We've reviewed your financial profile and are interested in discussing a working capital facility. Are you available for a brief call this week?", sent_at: "2024-12-30T10:00:00Z", read_at: "2024-12-30T11:00:00Z" },
      { message_id: "m_002", sender_type: "business",   content: "Hello, thank you for reaching out. Yes, I would be open to a conversation. Thursday afternoon works well for me.", sent_at: "2024-12-30T14:22:00Z", read_at: "2024-12-30T15:00:00Z" },
      { message_id: "m_003", sender_type: "institution", content: "Great — I'll schedule a call for Thursday 3pm. In the meantime, could you confirm the primary bank account linked to your Creditlinker profile?", sent_at: "2024-12-31T09:05:00Z" },
    ],
  },
  {
    thread_id: "thr_002", institution_id: "inst_001", institution_name: "Stanbic IBTC",
    consent_id: "con_002",
    last_message: "We'd be happy to discuss a term loan based on your revenue history.",
    last_message_at: "2024-12-29T14:00:00Z",
    business_unread: 0,
    messages: [
      { message_id: "m_004", sender_type: "institution", content: "We'd be happy to discuss a term loan based on your revenue history. Do you have any existing debt obligations we should be aware of?", sent_at: "2024-12-29T14:00:00Z", read_at: "2024-12-29T16:00:00Z" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function daysColor(days: number) {
  if (days > 60) return "#10B981";
  if (days > 21) return "#F59E0B";
  return "#EF4444";
}
function permissionLabel(key: keyof Permission) {
  return ({ can_view_score: "Financial score", can_view_transaction_detail: "Transaction detail", can_view_identity: "Full financial identity" })[key];
}
function fmtFullTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────────────────────────────────────────
   CARD SHELL
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}
function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F3F4F6", gap: 12, flexWrap: "wrap" as const }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.sender_type === "business";
  return (
    <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, marginBottom: 12 }}>
      {!isMe && (
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
          <Building2 size={11} color="#9CA3AF" />
        </div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
        <div style={{ padding: "10px 13px", borderRadius: isMe ? "13px 13px 4px 13px" : "13px 13px 13px 4px", background: isMe ? "#0A2540" : "white", border: isMe ? "none" : "1px solid #E5E7EB", fontSize: 13, color: isMe ? "white" : "#0A2540", lineHeight: 1.6, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {msg.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{fmtFullTime(msg.sent_at)}</span>
          {isMe && msg.read_at  && <CheckCheck size={11} style={{ color: "#10B981" }} />}
          {isMe && !msg.read_at && <Clock size={10} style={{ color: "#9CA3AF" }} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   GRANT CONSENT MODAL
───────────────────────────────────────────────────────── */
function GrantConsentModal({ request, onClose }: { request: typeof PENDING_REQUESTS[0]; onClose: () => void }) {
  const [permissions, setPermissions] = useState<Permission>({ can_view_score: true, can_view_transaction_detail: false, can_view_identity: true });
  const [duration,       setDuration]       = useState(30);
  const [customDuration, setCustomDuration] = useState("");
  const [useCustom,      setUseCustom]      = useState(false);
  const [loading,        setLoading]        = useState(false);

  const effectiveDuration = useCustom ? (parseInt(customDuration) || 0) : duration;

  const handleGrant = async () => {
    setLoading(true); await new Promise(r => setTimeout(r, 1200)); setLoading(false);
    // TODO: POST /business/discovery/requests/:request_id/grant
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Grant access</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{request.institution_name} · {request.capital_category}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>You control exactly what this institution can see. You can revoke access at any time.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Permissions</p>
            {(Object.keys(permissions) as (keyof Permission)[]).map(key => (
              <button key={key} onClick={() => setPermissions(p => ({ ...p, [key]: !p[key] }))}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 9, border: "1.5px solid", borderColor: permissions[key] ? "#0A2540" : "#E5E7EB", background: permissions[key] ? "#F8FAFF" : "white", cursor: "pointer", transition: "all 0.12s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid", borderColor: permissions[key] ? "#0A2540" : "#D1D5DB", background: permissions[key] ? "#0A2540" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {permissions[key] && <CheckCircle2 size={11} color="white" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0A2540" }}>{permissionLabel(key)}</span>
                </div>
                {permissions[key] ? <Eye size={13} style={{ color: "#0A2540" }} /> : <EyeOff size={13} style={{ color: "#D1D5DB" }} />}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Access duration</p>
            <div className="fnc-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, minWidth: 0 }}>
              {[14, 30, 60, 90].map(d => (
                <button key={d} onClick={() => { setDuration(d); setUseCustom(false); }}
                  style={{ padding: "10px 0", borderRadius: 8, border: "1.5px solid", borderColor: !useCustom && duration === d ? "#0A2540" : "#E5E7EB", background: !useCustom && duration === d ? "#0A2540" : "white", color: !useCustom && duration === d ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={() => setUseCustom(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${useCustom ? "#0A2540" : "#E5E7EB"}`, background: useCustom ? "#F8FAFF" : "white", color: useCustom ? "#0A2540" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", textAlign: "left" as const }}>
              <span style={{ flex: 1 }}>Custom duration</span>
              {useCustom ? <X size={12} /> : <Plus size={12} />}
            </button>
            {useCustom && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number" min="1" max="730" placeholder="e.g. 180"
                  value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: 8, border: "1.5px solid #0A2540", fontSize: 14, fontWeight: 600, color: "#0A2540", outline: "none" }}
                  autoFocus
                />
                <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" as const }}>days</span>
                {parseInt(customDuration) > 0 && (
                  <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" as const }}
                  >≈ {Math.round(parseInt(customDuration) / 30)} month{Math.round(parseInt(customDuration) / 30) !== 1 ? "s" : ""}</span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Decline</button>
            <Button variant="primary" className="flex-1" onClick={handleGrant} disabled={loading} style={{ height: 44, fontSize: 13, fontWeight: 700, borderRadius: 9, flex: 1 }}>
              {loading ? <><RefreshCw size={13} className="animate-spin" /> Granting…</> : <><ShieldCheck size={13} /> Grant access</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REVOKE MODAL
───────────────────────────────────────────────────────── */
function RevokeModal({ consent, onClose }: { consent: typeof ACTIVE_CONSENTS[0]; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleRevoke = async () => {
    setLoading(true); await new Promise(r => setTimeout(r, 1000)); setLoading(false);
    // TODO: POST /business/consent/revoke { consent_id }
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "28px 28px 24px", textAlign: "center" as const }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <XCircle size={22} style={{ color: "#EF4444" }} />
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 8 }}>Revoke access?</p>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}><strong>{consent.institution_name}</strong> will immediately lose access to your financial identity.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleRevoke} disabled={loading} style={{ flex: 1, height: 42, borderRadius: 9, border: "none", background: "#EF4444", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {loading ? <><RefreshCw size={13} className="animate-spin" /> Revoking…</> : "Revoke access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ACCESS LOG MODAL
───────────────────────────────────────────────────────── */
function AccessLogModal({ consent, onClose }: { consent: typeof ACTIVE_CONSENTS[0]; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Access log</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{consent.institution_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: "8px 0 16px" }}>
          {consent.access_log.map((entry, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 24px", borderBottom: i < consent.access_log.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "flex-start" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", marginBottom: 2 }}>{entry.action}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{entry.accessed_at}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSAGES SLIDE-IN PANEL
───────────────────────────────────────────────────────── */
function MessagesPanel({ thread, institutionName, onClose }: { thread: Thread; institutionName: string; onClose: () => void }) {
  const [threads,  setThreads]  = useState<Thread[]>(INITIAL_THREADS);
  const [compose,  setCompose]  = useState("");
  const [sending,  setSending]  = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.thread_id === thread.thread_id) ?? thread;

  useEffect(() => {
    setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, business_unread: 0 } : t));
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [thread.thread_id]);

  const sendMessage = async () => {
    if (!compose.trim()) return;
    setSending(true);
    const newMsg: Message = { message_id: `m_${Date.now()}`, sender_type: "business", content: compose.trim(), sent_at: new Date().toISOString() };
    setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, messages: [...t.messages, newMsg], last_message: compose.trim() } : t));
    setCompose("");
    await new Promise(r => setTimeout(r, 300));
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    // TODO: POST /business/messages/:thread_id/send { content: compose }
  };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 300, width: "min(420px, 100vw)", background: "white", borderLeft: "1px solid #E5E7EB", boxShadow: "-8px 0 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", flexShrink: 0 }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540" }}>
          {institutionName.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{institutionName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>Access granted</p>
            {activeThread.financing_id && <Badge variant="secondary" style={{ fontSize: 10 }}>Financing active</Badge>}
          </div>
        </div>
      </div>
      {/* Consent notice */}
      <div style={{ padding: "10px 16px", background: "rgba(0,212,255,0.03)", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", gap: 8, alignItems: "center" }}>
        <ShieldCheck size={12} style={{ color: "#00A8CC", flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: "#0A5060" }}>Messages are only available while consent is active.</p>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "16px 16px 8px" }}>
        {activeThread.messages.map(msg => <MessageBubble key={msg.message_id} msg={msg} />)}
        <div ref={messagesEndRef} />
      </div>
      {/* Compose */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
            <textarea value={compose} onChange={e => setCompose(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Reply to this financer…" rows={1}
              style={{ flex: 1, border: "none", background: "transparent", resize: "none", padding: "10px 12px", fontSize: 13, color: "#0A2540", outline: "none", lineHeight: 1.5, maxHeight: 80, overflowY: "auto" as const }} />
            <button style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex" }}>
              <Paperclip size={14} />
            </button>
          </div>
          <button onClick={sendMessage} disabled={!compose.trim() || sending}
            style={{ width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0, background: compose.trim() ? "#0A2540" : "#E5E7EB", color: compose.trim() ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: compose.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancersPage() {
  const [grantRequest,      setGrantRequest]      = useState<typeof PENDING_REQUESTS[0] | null>(null);
  const [viewLog,           setViewLog]           = useState<typeof ACTIVE_CONSENTS[0] | null>(null);
  const [revokeConsent,     setRevokeConsent]     = useState<typeof ACTIVE_CONSENTS[0] | null>(null);
  const [activeThread,      setActiveThread]      = useState<Thread | null>(null);
  const [activeInstitution, setActiveInstitution] = useState<string>("");
  const [threads,           setThreads]           = useState<Thread[]>(INITIAL_THREADS);
  const [search,            setSearch]            = useState("");

  const filteredConsents = ACTIVE_CONSENTS.filter(c => c.institution_name.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = threads.reduce((s, t) => s + t.business_unread, 0);

  const openMessages = (consent: typeof ACTIVE_CONSENTS[0]) => {
    const thread = threads.find(t => t.thread_id === consent.thread_id);
    if (thread) {
      setActiveThread(thread);
      setActiveInstitution(consent.institution_name);
      setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, business_unread: 0 } : t));
    }
  };

  return (
    <>
      {grantRequest  && <GrantConsentModal request={grantRequest}   onClose={() => setGrantRequest(null)}  />}
      {viewLog       && <AccessLogModal   consent={viewLog}         onClose={() => setViewLog(null)}       />}
      {revokeConsent && <RevokeModal      consent={revokeConsent}   onClose={() => setRevokeConsent(null)} />}

      {/* Messages panel + overlay */}
      {activeThread && (
        <>
          <div onClick={() => setActiveThread(null)} style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(10,37,64,0.2)", backdropFilter: "blur(2px)" }} />
          <MessagesPanel thread={activeThread} institutionName={activeInstitution} onClose={() => setActiveThread(null)} />
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Financers</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              {ACTIVE_CONSENTS.length} active connections · {PENDING_REQUESTS.length} pending request{PENDING_REQUESTS.length !== 1 ? "s" : ""}
              {totalUnread > 0 && (
                <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 5, color: "#0A2540", fontWeight: 600 }}>
                  · <MessageSquare size={12} /> {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* PENDING REQUESTS */}
        {PENDING_REQUESTS.length > 0 && (
          <div>
            {PENDING_REQUESTS.map(req => (
              <div key={req.request_id} style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: "1 1 200px" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertCircle size={18} style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{req.institution_name}</p>
                      <Badge variant="warning" style={{ fontSize: 10, whiteSpace: "nowrap" as const }}>Pending review</Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "#92400E" }}>Requesting access for <strong>{req.capital_category}</strong> · {req.match_score}% match · {req.requested_at}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
                    Decline
                  </button>
                  <Button variant="primary" size="sm" onClick={() => setGrantRequest(req)} style={{ gap: 6 }}>
                    <ShieldCheck size={13} /> Review & Grant
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE CONSENTS */}
        <Card>
          <CardHeader
            title="Active Connections"
            sub="Capital providers with current access to your financial identity."
            action={
              <div style={{ position: "relative" as const }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, paddingLeft: 30, paddingRight: 10, borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", width: 160 }} />
              </div>
            }
          />
          <div style={{ padding: "12px 0 8px" }}>
            {filteredConsents.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center" as const }}>
                <Landmark size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No active connections</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Browse the financing marketplace to discover capital providers and share your financial identity.</p>
              </div>
            ) : filteredConsents.map((consent, i) => {
              const unread = threads.find(t => t.thread_id === consent.thread_id)?.business_unread ?? 0;
              return (
                <div key={consent.consent_id} style={{ padding: "18px 24px", borderBottom: i < filteredConsents.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 14, gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flex: "1 1 160px" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                        {consent.institution_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{consent.institution_name}</p>
                          <Badge variant="success" style={{ fontSize: 10, whiteSpace: "nowrap" as const }}>Active</Badge>
                          {consent.financing_record_id && <Badge variant="secondary" style={{ fontSize: 10, whiteSpace: "nowrap" as const }}>Financing active</Badge>}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{consent.institution_type} · Granted {consent.granted_at}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 }}>Expires in</p>
                      <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: daysColor(consent.days_remaining) }}>{consent.days_remaining}d</p>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{consent.valid_until}</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7, marginBottom: 14 }}>
                    {(Object.entries(consent.permissions) as [keyof Permission, boolean][]).map(([key, val]) => (
                      <div key={key} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 9999, background: val ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${val ? "rgba(16,185,129,0.2)" : "#E5E7EB"}`, fontSize: 11, fontWeight: 500, color: val ? "#10B981" : "#9CA3AF", whiteSpace: "nowrap" as const }}>
                        {val ? <Eye size={10} /> : <EyeOff size={10} />}
                        {permissionLabel(key)}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                    {/* Messages */}
                    <button
                      onClick={() => openMessages(consent)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", transition: "all 0.12s", position: "relative" as const }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                    >
                      <MessageSquare size={12} /> Messages
                      {unread > 0 && (
                        <span style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#EF4444", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {unread}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setViewLog(consent)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", transition: "all 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                    >
                      <History size={12} /> Access log
                    </button>

                    <button
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", transition: "all 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                      // TODO: POST /business/consent/renew
                    >
                      <RefreshCw size={12} /> Renew
                    </button>

                    {!consent.financing_record_id && (
                      <button onClick={() => setRevokeConsent(consent)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "#FEF2F2", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: "pointer", transition: "all 0.12s" }}>
                        <XCircle size={12} /> Revoke
                      </button>
                    )}

                    {consent.financing_record_id && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9CA3AF", padding: "6px 4px", whiteSpace: "nowrap" as const }}>
                        <Info size={11} /> Access is locked while financing is active
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* REVOKED */}
        {REVOKED_CONSENTS.length > 0 && (
          <Card>
            <CardHeader title="Revoked Access" sub="Former connections that no longer have access to your data." />
            <div style={{ padding: "10px 0 8px" }}>
              {REVOKED_CONSENTS.map((c, i) => (
                <div key={c.consent_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < REVOKED_CONSENTS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: "#F9FAFB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>
                    {c.institution_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{c.institution_name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{c.institution_type} · Granted {c.granted_at} · Revoked {c.revoked_at}</p>
                  </div>
                  <Badge variant="outline" style={{ fontSize: 10 }}>Revoked</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CALLOUT */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>Your data, your rules.</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Every access is explicit, time-bound, and revocable. No financer sees your data without your permission.</p>
            </div>
          </div>
          <Link href="/security" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            <ChevronRight size={13} /> Learn about consent
          </Link>
        </div>

      </div>
    </>
  );
}
