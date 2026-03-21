"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Send, Search, X, ArrowLeft,
  Building2, ShieldCheck, Clock, CheckCheck,
  MoreHorizontal, Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface Message {
  message_id: string;
  sender_type: "business" | "institution";
  content: string;
  sent_at: string;
  read_at?: string;
}

interface Thread {
  thread_id: string;
  business_id: string;
  business_display: string;
  business_sector: string;
  consent_id: string;
  financing_id?: string;
  last_message: string;
  last_message_at: string;
  business_unread: number;
  financer_unread: number;
  status: "active" | "archived";
  messages: Message[];
}

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with:
     GET /institution/messages              → Thread[]
     GET /institution/messages/:thread_id   → Thread (with messages)
     POST /institution/messages/:thread_id/send → Message
   Thread creation: POST /institution/messages/:consent_id/start
   Requires an active ConsentRecord — no cold messaging.
───────────────────────────────────────────────────────── */
const MOCK_THREADS: Thread[] = [
  {
    thread_id: "thr_001",
    business_id: "biz_1r8t",
    business_display: "BIZ-1R8T",
    business_sector: "Retail",
    consent_id: "con_001",
    financing_id: "fin_001",
    last_message: "We can provide the additional bank statement for Q3 if needed.",
    last_message_at: "2025-01-02T09:14:00Z",
    business_unread: 0,
    financer_unread: 1,
    status: "active",
    messages: [
      { message_id: "m_001", sender_type: "institution", content: "Thank you for connecting. We've reviewed your financial profile and are interested in discussing a working capital facility. Are you available for a brief call this week?", sent_at: "2024-12-30T10:00:00Z", read_at: "2024-12-30T11:00:00Z" },
      { message_id: "m_002", sender_type: "business",   content: "Hello, thank you for reaching out. Yes, I would be open to a conversation. Thursday afternoon works well for me.", sent_at: "2024-12-30T14:22:00Z", read_at: "2024-12-30T15:00:00Z" },
      { message_id: "m_003", sender_type: "institution", content: "Great — I'll schedule a call for Thursday 3pm. In the meantime, could you confirm the primary bank account linked to your Creditlinker profile?", sent_at: "2024-12-31T09:05:00Z", read_at: "2024-12-31T10:00:00Z" },
      { message_id: "m_004", sender_type: "business",   content: "The primary account is the Zenith Bank account ending in 4821. We can provide the additional bank statement for Q3 if needed.", sent_at: "2025-01-02T09:14:00Z" },
    ],
  },
  {
    thread_id: "thr_002",
    business_id: "biz_9p4l",
    business_display: "BIZ-9P4L",
    business_sector: "Technology",
    consent_id: "con_002",
    last_message: "Please review our updated offer terms attached.",
    last_message_at: "2025-01-01T16:44:00Z",
    business_unread: 0,
    financer_unread: 0,
    status: "active",
    messages: [
      { message_id: "m_005", sender_type: "institution", content: "We have completed our review of your financial profile. Based on your revenue consistency and cashflow data, we'd like to extend an invoice financing offer. Please review our updated offer terms attached.", sent_at: "2025-01-01T16:44:00Z", read_at: "2025-01-01T17:00:00Z" },
    ],
  },
  {
    thread_id: "thr_003",
    business_id: "biz_3k2m",
    business_display: "BIZ-3K2M",
    business_sector: "Logistics",
    consent_id: "con_003",
    last_message: "Understood, we'll revert with revised repayment terms by Friday.",
    last_message_at: "2024-12-28T11:10:00Z",
    business_unread: 0,
    financer_unread: 0,
    status: "active",
    messages: [
      { message_id: "m_006", sender_type: "institution", content: "Hello, we noticed the equipment financing application submitted last week. We've reviewed your asset profile and score dimensions. A few questions: What is the approximate age of the primary vehicle fleet you're looking to finance?", sent_at: "2024-12-27T09:00:00Z", read_at: "2024-12-27T10:00:00Z" },
      { message_id: "m_007", sender_type: "business",   content: "The fleet consists of 4 trucks purchased between 2019 and 2021. Two are fully paid off. We would need financing for the two newer ones. However the repayment terms proposed are a bit aggressive for our cashflow cycle.", sent_at: "2024-12-28T08:55:00Z", read_at: "2024-12-28T09:30:00Z" },
      { message_id: "m_008", sender_type: "institution", content: "Understood, we'll revert with revised repayment terms by Friday.", sent_at: "2024-12-28T11:10:00Z", read_at: "2024-12-28T12:00:00Z" },
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

/* ─────────────────────────────────────────────────────────
   THREAD LIST ITEM
───────────────────────────────────────────────────────── */
function ThreadItem({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  const hasUnread = thread.financer_unread > 0;
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", width: "100%", maxWidth: "100%", boxSizing: "border-box" as const, border: "none", background: active ? "#F5F7FA" : "transparent", cursor: "pointer", textAlign: "left" as const, borderBottom: "1px solid #F3F4F6", transition: "background 0.1s", borderLeft: active ? "2px solid #0A2540" : "2px solid transparent", overflow: "hidden" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Building2 size={16} color="#9CA3AF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{thread.business_display}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtTime(thread.last_message_at)}</span>
            {hasUnread && (
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>{thread.financer_unread}</span>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{thread.business_sector}</p>
        <p style={{ fontSize: 12, color: hasUnread ? "#374151" : "#9CA3AF", fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.5 }}>{thread.last_message}</p>
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
function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.sender_type === "institution";
  return (
    <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, marginBottom: 12, minWidth: 0 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
          <Building2 size={12} color="#9CA3AF" />
        </div>
      )}
      <div style={{ maxWidth: "72%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
        <div style={{ padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? "#0A2540" : "white", border: isMe ? "none" : "1px solid #E5E7EB", fontSize: 13, color: isMe ? "white" : "#0A2540", lineHeight: 1.6, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
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
export default function FinancerMessagesPage() {
  const [threads,       setThreads]       = useState<Thread[]>(MOCK_THREADS);
  const [activeId,      setActiveId]      = useState<string | null>(MOCK_THREADS[0]?.thread_id ?? null);
  const [search,        setSearch]        = useState("");
  const [compose,       setCompose]       = useState("");
  const [sending,       setSending]       = useState(false);
  const [mobileView,   setMobileView]    = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.thread_id === activeId) ?? null;
  const filteredThreads = threads.filter(t =>
    t.business_display.toLowerCase().includes(search.toLowerCase()) ||
    t.business_sector.toLowerCase().includes(search.toLowerCase()) ||
    t.last_message.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = threads.reduce((s, t) => s + t.financer_unread, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  // Mark as read when opening thread
  useEffect(() => {
    if (!activeId) return;
    setThreads(prev => prev.map(t => t.thread_id === activeId ? { ...t, financer_unread: 0 } : t));
  }, [activeId]);

  const sendMessage = async () => {
    if (!compose.trim() || !activeId) return;
    setSending(true);
    const newMsg: Message = { message_id: `m_${Date.now()}`, sender_type: "institution", content: compose.trim(), sent_at: new Date().toISOString() };
    setThreads(prev => prev.map(t => t.thread_id === activeId ? { ...t, messages: [...t.messages, newMsg], last_message: compose.trim(), last_message_at: newMsg.sent_at } : t));
    setCompose("");
    await new Promise(r => setTimeout(r, 300));
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    // TODO: POST /institution/messages/:activeId/send { content: compose }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>Messages</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {threads.length} active conversation{threads.length !== 1 ? "s" : ""}
            {totalUnread > 0 && <span style={{ color: "#0A2540", fontWeight: 600 }}> · {totalUnread} unread</span>}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", flexShrink: 0 }}>
            <ShieldCheck size={13} style={{ color: "#00A8CC", flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: "#0A5060", whiteSpace: "nowrap" }}>Requires active consent</p>
          </div>
        </div>
      </div>

      {/* TWO-PANE — msg-split-grid collapses to 1fr on mobile via globals.css */}
      <div className="msg-split-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", height: "calc(100vh - 220px)", minHeight: 520, width: "100%", maxWidth: "100%" }}>

        {/* LEFT — Thread list. Hidden on mobile when in chat view */}
        <div className={mobileView === "chat" ? "msg-thread-hidden-mobile" : ""} style={{ borderRight: "1px solid #F3F4F6", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: search ? 28 : 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={12} /></button>}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" as const, overflowX: "hidden" }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const }}>
                <MessageSquare size={24} style={{ color: "#E5E7EB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No conversations found.</p>
              </div>
            ) : filteredThreads.map(t => (
              <ThreadItem key={t.thread_id} thread={t} active={activeId === t.thread_id}
                onClick={() => { setActiveId(t.thread_id); setMobileView("chat"); }} />
            ))}
          </div>
        </div>

        {/* RIGHT — Thread. Hidden on mobile when in list view */}
        {activeThread ? (
          <div className={mobileView === "list" ? "msg-thread-hidden-mobile" : ""} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", maxWidth: "100%" }}>
            {/* Thread header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "white", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                {/* Back button — mobile only, shown via CSS */}
                <button
                  onClick={() => setMobileView("list")}
                  className="cl-hamburger"
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={14} />
                </button>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={15} color="#9CA3AF" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeThread.business_display}</p>
                    <Badge variant="success" style={{ fontSize: 10, flexShrink: 0 }}>Access granted</Badge>
                    {activeThread.financing_id && <Badge variant="secondary" style={{ fontSize: 10, flexShrink: 0 }}>Financing active</Badge>}
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeThread.business_sector} · Consent {activeThread.consent_id}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Link href={`/financer/business-profile?id=${activeThread.business_id}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", whiteSpace: "nowrap" }}>
                  View Profile
                </Link>
                <button style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF", flexShrink: 0 }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto" as const, overflowX: "hidden", padding: "20px 16px 8px", minHeight: 0, width: "100%", boxSizing: "border-box" as const }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const }}>December 2024</span>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
              </div>
              {activeThread.messages.map(msg => <MessageBubble key={msg.message_id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "white", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                  <textarea value={compose} onChange={e => setCompose(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message…"
                    rows={1}
                    style={{ flex: 1, minWidth: 0, width: "100%", border: "none", background: "transparent", resize: "none", padding: "10px 12px", fontSize: 13, color: "#0A2540", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" as const, boxSizing: "border-box" as const }} />
                  <button style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex" }}>
                    <Paperclip size={15} />
                  </button>
                </div>
                <button onClick={sendMessage} disabled={!compose.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, background: compose.trim() ? "#0A2540" : "#E5E7EB", color: compose.trim() ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: compose.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <MessageSquare size={32} style={{ color: "#E5E7EB" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Select a conversation</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>Choose a thread from the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
