"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Send, Search, X, Building2,
  ShieldCheck, Clock, CheckCheck, Paperclip,
  Info, Bell, ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type SenderType = "business" | "institution" | "creditlinker";
type ThreadType = "financer" | "creditlinker";

interface Message {
  message_id: string;
  sender_type: SenderType;
  content: string;
  sent_at: string;
  read_at?: string;
}

interface Thread {
  thread_id: string;
  type: ThreadType;
  // financer threads
  institution_id?: string;
  institution_name?: string;
  consent_id?: string;
  financing_id?: string;
  // creditlinker threads
  subject?: string;
  // shared
  last_message: string;
  last_message_at: string;
  business_unread: number;
  messages: Message[];
}

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /business/messages → Thread[]
   Threads include both financer conversations (consent-gated)
   and Creditlinker platform messages (system notifications,
   verification updates, pipeline alerts, etc.)
───────────────────────────────────────────────────────── */
const MOCK_THREADS: Thread[] = [
  // — CREDITLINKER SYSTEM MESSAGES —
  {
    thread_id: "thr_cl_001",
    type: "creditlinker",
    subject: "Pipeline run completed",
    last_message: "Your financial identity has been updated. Your Revenue Stability score improved by 4 points.",
    last_message_at: "2025-01-03T08:00:00Z",
    business_unread: 1,
    messages: [
      {
        message_id: "cl_m_001",
        sender_type: "creditlinker",
        content: "Your pipeline run completed successfully on 3 Jan 2025 at 08:00 AM.\n\nHere's what changed:\n• Revenue Stability: 84 → 88 (+4)\n• Cashflow Predictability: 80 → 82 (+2)\n• Data Quality Score: 91 → 93 (+2)\n\nThe improvement was driven by 4 newly tagged transactions that were correctly classified as Revenue, improving your operating margin calculation.",
        sent_at: "2025-01-03T08:00:00Z",
        read_at: undefined,
      },
    ],
  },
  {
    thread_id: "thr_cl_002",
    type: "creditlinker",
    subject: "Identity verification update",
    last_message: "Your BVN verification was completed successfully. Your profile is now fully verified.",
    last_message_at: "2024-12-20T10:30:00Z",
    business_unread: 0,
    messages: [
      {
        message_id: "cl_m_002",
        sender_type: "creditlinker",
        content: "Your BVN verification was completed successfully on 20 Dec 2024.\n\nYour business identity status has been updated to Verified. This unlocks full discoverability in the financer marketplace and increases your data quality weighting.\n\nNo action is required from you.",
        sent_at: "2024-12-20T10:30:00Z",
        read_at: "2024-12-20T11:00:00Z",
      },
    ],
  },
  {
    thread_id: "thr_cl_003",
    type: "creditlinker",
    subject: "New financer connection request",
    last_message: "Coronation Merchant Bank has requested access to your financial profile for Invoice Financing.",
    last_message_at: "2025-01-02T11:30:00Z",
    business_unread: 0,
    messages: [
      {
        message_id: "cl_m_003",
        sender_type: "creditlinker",
        content: "Coronation Merchant Bank has sent a connection request to view your financial identity.\n\nThey are interested in offering Invoice Financing based on your profile.\n\nMatch score: 81%\n\nYou can review and respond to this request from your Financers page.",
        sent_at: "2025-01-02T11:30:00Z",
        read_at: "2025-01-02T12:00:00Z",
      },
    ],
  },
  // — FINANCER CONVERSATIONS —
  {
    thread_id: "thr_001",
    type: "financer",
    institution_id: "inst_002",
    institution_name: "Lapo Microfinance",
    consent_id: "con_001",
    financing_id: "fin_001",
    last_message: "Great — I'll schedule a call for Thursday 3pm. Could you confirm the primary bank account linked to your profile?",
    last_message_at: "2024-12-31T09:05:00Z",
    business_unread: 1,
    messages: [
      { message_id: "m_001", sender_type: "institution", content: "Thank you for connecting. We've reviewed your financial profile and are interested in discussing a working capital facility. Are you available for a brief call this week?", sent_at: "2024-12-30T10:00:00Z", read_at: "2024-12-30T11:00:00Z" },
      { message_id: "m_002", sender_type: "business",   content: "Hello, thank you for reaching out. Yes, I would be open to a conversation. Thursday afternoon works well for me.", sent_at: "2024-12-30T14:22:00Z", read_at: "2024-12-30T15:00:00Z" },
      { message_id: "m_003", sender_type: "institution", content: "Great — I'll schedule a call for Thursday 3pm. Could you confirm the primary bank account linked to your profile?", sent_at: "2024-12-31T09:05:00Z" },
    ],
  },
  {
    thread_id: "thr_002",
    type: "financer",
    institution_id: "inst_001",
    institution_name: "Stanbic IBTC",
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
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtFullTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function threadDisplayName(t: Thread): string {
  if (t.type === "creditlinker") return t.subject ?? "Creditlinker";
  return t.institution_name ?? "Unknown";
}

/* ─────────────────────────────────────────────────────────
   CREDITLINKER LOGO MARK (small)
───────────────────────────────────────────────────────── */
function CLAvatar() {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
        <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   THREAD LIST ITEM
───────────────────────────────────────────────────────── */
function ThreadItem({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  const hasUnread = thread.business_unread > 0;
  const isCL = thread.type === "creditlinker";

  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", width: "100%", border: "none", background: active ? "#F5F7FA" : "transparent", cursor: "pointer", textAlign: "left" as const, borderBottom: "1px solid #F3F4F6", transition: "background 0.1s", borderLeft: active ? "2px solid #0A2540" : "2px solid transparent" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Avatar */}
      {isCL ? (
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,212,255,0.2))", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="#0A2540" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
          </svg>
        </div>
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0A2540" }}>
          {(thread.institution_name ?? "?").slice(0, 2).toUpperCase()}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {threadDisplayName(thread)}
            </p>
            {isCL && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "#00A8CC", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "1px 5px", borderRadius: 4, flexShrink: 0, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                Platform
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtTime(thread.last_message_at)}</span>
            {hasUnread && (
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: isCL ? "#00A8CC" : "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>{thread.business_unread}</span>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: 12, color: hasUnread ? "#374151" : "#9CA3AF", fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.5 }}>
          {thread.last_message}
        </p>
        {thread.financing_id && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "2px 7px", borderRadius: 9999 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />Financing active
          </div>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────────── */
function MessageBubble({ msg, threadType }: { msg: Message; threadType: ThreadType }) {
  const isMe = msg.sender_type === "business";
  const isCL = msg.sender_type === "creditlinker";

  // Creditlinker messages: full-width system card style
  if (isCL) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))", border: "1px solid rgba(0,212,255,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 28 28" fill="none">
              <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Creditlinker</p>
            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{fmtFullTime(msg.sent_at)}</p>
          </div>
        </div>
        <div style={{ marginLeft: 36, padding: "12px 16px", background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 12, fontSize: 13, color: "#0A2540", lineHeight: 1.7, whiteSpace: "pre-line" as const }}>
          {msg.content}
        </div>
      </div>
    );
  }

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
   PAGE
───────────────────────────────────────────────────────── */
export default function BusinessMessagesPage() {
  const [threads,   setThreads]   = useState<Thread[]>(MOCK_THREADS);
  const [activeId,  setActiveId]  = useState<string | null>(MOCK_THREADS[0]?.thread_id ?? null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all" | "financer" | "creditlinker">("all");
  const [compose,   setCompose]   = useState("");
  const [sending,   setSending]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.thread_id === activeId) ?? null;
  const [mobileView, setMobileView] = React.useState<"list" | "thread">("list");

  // On mobile, switch to thread view when a thread is selected
  const handleSelectThread = (id: string) => {
    setActiveId(id);
    setMobileView("thread");
  };

  const filteredThreads = threads.filter(t => {
    const matchFilter = filter === "all" || t.type === filter;
    const matchSearch = search === "" ||
      threadDisplayName(t).toLowerCase().includes(search.toLowerCase()) ||
      t.last_message.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  const totalUnread    = threads.reduce((s, t) => s + t.business_unread, 0);
  const financerUnread = threads.filter(t => t.type === "financer").reduce((s, t) => s + t.business_unread, 0);
  const clUnread       = threads.filter(t => t.type === "creditlinker").reduce((s, t) => s + t.business_unread, 0);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [activeId]);

  // Mark as read on open
  useEffect(() => {
    if (!activeId) return;
    setThreads(prev => prev.map(t => t.thread_id === activeId ? { ...t, business_unread: 0 } : t));
  }, [activeId]);

  const sendMessage = async () => {
    if (!compose.trim() || !activeId || activeThread?.type === "creditlinker") return;
    setSending(true);
    const newMsg: Message = { message_id: `m_${Date.now()}`, sender_type: "business", content: compose.trim(), sent_at: new Date().toISOString() };
    setThreads(prev => prev.map(t => t.thread_id === activeId ? { ...t, messages: [...t.messages, newMsg], last_message: compose.trim(), last_message_at: newMsg.sent_at } : t));
    setCompose("");
    await new Promise(r => setTimeout(r, 300));
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    // TODO: POST /business/messages/:activeId/send { content: compose }
  };

  const isCLThread = activeThread?.type === "creditlinker";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Messages</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {threads.length} conversation{threads.length !== 1 ? "s" : ""}
            {totalUnread > 0 && <span style={{ color: "#0A2540", fontWeight: 600 }}> · {totalUnread} unread</span>}
          </p>
        </div>
      </div>

      {/* TWO-PANE */}
      <div className="msg-split-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", height: "calc(100vh - 210px)", minHeight: 560 }}>

        {/* LEFT — Thread list */}
        <div className={mobileView === "thread" ? "msg-thread-hidden-mobile" : ""} style={{ borderRight: "1px solid #F3F4F6", display: "flex", flexDirection: "column" }}>

          {/* Search */}
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
                style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: search ? 28 : 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={12} /></button>}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "creditlinker", "financer"] as const).map(f => {
                const count = f === "all" ? totalUnread : f === "creditlinker" ? clUnread : financerUnread;
                const labels = { all: "All", creditlinker: "Platform", financer: "Financers" };
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ flex: 1, height: 28, borderRadius: 7, border: "1.5px solid", borderColor: filter === f ? "#0A2540" : "#E5E7EB", background: filter === f ? "#0A2540" : "white", color: filter === f ? "white" : "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {labels[f]}
                    {count > 0 && (
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: filter === f ? "rgba(255,255,255,0.3)" : "#EF4444", color: "white", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" as const }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const }}>
                <MessageSquare size={24} style={{ color: "#E5E7EB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No messages found.</p>
              </div>
            ) : filteredThreads.map(t => (
              <ThreadItem key={t.thread_id} thread={t} active={activeId === t.thread_id} onClick={() => handleSelectThread(t.thread_id)} />
            ))}
          </div>
        </div>

        {/* RIGHT — Thread pane */}
        {activeThread ? (
          <div className={mobileView === "list" ? "msg-thread-hidden-mobile" : ""} style={{ display: "flex", flexDirection: "column" }}>
            {/* Thread header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  className="cl-hamburger"
                  onClick={() => setMobileView("list")}
                  style={{ marginRight: 2 }}
                  aria-label="Back to list"
                >
                  <ArrowLeft size={16} />
                </button>
                {isCLThread ? (
                  <CLAvatar />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                    {(activeThread.institution_name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>
                      {isCLThread ? "Creditlinker" : activeThread.institution_name}
                    </p>
                    {isCLThread
                      ? <Badge variant="secondary" style={{ fontSize: 10, color: "#00A8CC", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>Platform</Badge>
                      : <Badge variant="success" style={{ fontSize: 10 }}>Access granted</Badge>
                    }
                    {activeThread.financing_id && <Badge variant="secondary" style={{ fontSize: 10 }}>Financing active</Badge>}
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {isCLThread
                      ? activeThread.subject
                      : `${activeThread.institution_name} · Consent ${activeThread.consent_id}`
                    }
                  </p>
                </div>
              </div>
              {!isCLThread && (
                <Link href={`/financers`}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                  Manage consent
                </Link>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px 20px 8px" }}>
              {/* Date separator */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const }}>
                  {new Date(activeThread.messages[0]?.sent_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
              </div>

              {activeThread.messages.map(msg => (
                <MessageBubble key={msg.message_id} msg={msg} threadType={activeThread.type} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose — only for financer threads */}
            {!isCLThread ? (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "white" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <textarea value={compose} onChange={e => setCompose(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Reply to this financer… (Enter to send)"
                      rows={1}
                      style={{ flex: 1, border: "none", background: "transparent", resize: "none", padding: "10px 12px", fontSize: 13, color: "#0A2540", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" as const }} />
                    <button style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex" }}>
                      <Paperclip size={15} />
                    </button>
                  </div>
                  <button onClick={sendMessage} disabled={!compose.trim() || sending}
                    style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, background: compose.trim() ? "#0A2540" : "#E5E7EB", color: compose.trim() ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: compose.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                    <Send size={16} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
                  This conversation is consent-gated. <Link href="/financers" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "none" }}>Manage access →</Link>
                </p>
              </div>
            ) : (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Platform messages are automated. You cannot reply to this thread.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <MessageSquare size={32} style={{ color: "#E5E7EB" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Select a conversation</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>Choose a thread from the left to read messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
