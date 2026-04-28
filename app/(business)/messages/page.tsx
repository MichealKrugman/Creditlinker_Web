"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Search, X, Building2,
  ShieldCheck, Clock, CheckCheck, Paperclip,
  Info, ArrowLeft, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useActiveBusiness } from "@/lib/business-context";
import {
  getAllMessages,
  getMessages,
  sendMessage as apiSendMessage,
  markMessagesRead,
  type MessageThread,
  type ThreadMessage,
} from "@/lib/api";

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

function threadDisplayName(t: MessageThread): string {
  if (t.type === "creditlinker") return t.subject ?? "Creditlinker";
  return t.institution_name ?? "Unknown";
}

/* ─────────────────────────────────────────────────────────
   CREDITLINKER AVATAR
───────────────────────────────────────────────────────── */
function CLAvatar({ size = 40 }: { size?: number }) {
  const s = Math.round(size * 0.45);
  return (
    <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
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
function ThreadItem({ thread, active, onClick }: { thread: MessageThread; active: boolean; onClick: () => void }) {
  const hasUnread = thread.business_unread > 0;
  const isCL = thread.type === "creditlinker";

  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", width: "100%", border: "none", background: active ? "#F5F7FA" : "transparent", cursor: "pointer", textAlign: "left" as const, borderBottom: "1px solid #F3F4F6", transition: "background 0.1s", borderLeft: active ? "2px solid #0A2540" : "2px solid transparent" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {isCL ? (
        <CLAvatar size={40} />
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
        {thread.financing_record_id && (
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
function MessageBubble({ msg }: { msg: ThreadMessage }) {
  const isMe = msg.sender_type === "business";
  const isCL = msg.sender_type === "creditlinker";

  if (isCL) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <CLAvatar size={26} />
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
  const { activeBusiness } = useActiveBusiness();

  const [threads,         setThreads]         = useState<MessageThread[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [activeId,        setActiveId]        = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search,          setSearch]          = useState("");
  const [filter,          setFilter]          = useState<"all" | "financer" | "creditlinker">("all");
  const [compose,         setCompose]         = useState("");
  const [sending,         setSending]         = useState(false);
  const [mobileView,      setMobileView]      = useState<"list" | "thread">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  // ── INITIAL LOAD ────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllMessages();
      setThreads(res.threads);
      // Auto-select first thread on initial load
      if (res.threads.length > 0 && !activeId) {
        setActiveId(res.threads[0].thread_id);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeBusiness) fetchThreads();
  }, [activeBusiness, fetchThreads]);

  // ── OPEN A THREAD ───────────────────────────────────────────
  const openThread = useCallback(async (thread: MessageThread) => {
    setActiveId(thread.thread_id);
    setMobileView("thread");

    if (thread.type === "financer" && thread.consent_id) {
      // Lazy-load full message history + mark as read via existing get-messages
      if (thread.messages.length === 0) {
        setLoadingMessages(true);
      }
      try {
        const res = await getMessages(thread.consent_id);
        setThreads(prev => prev.map(t =>
          t.thread_id === thread.thread_id
            ? { ...t, messages: res.messages, business_unread: 0 }
            : t
        ));
        scrollToBottom();
      } catch {
        // silently fail — thread is open, just no messages loaded
      } finally {
        setLoadingMessages(false);
      }
    } else if (thread.type === "creditlinker" && thread.business_unread > 0) {
      // Mark platform message as read
      setThreads(prev => prev.map(t =>
        t.thread_id === thread.thread_id ? { ...t, business_unread: 0 } : t
      ));
      try {
        await markMessagesRead([thread.thread_id]);
      } catch {
        // fire-and-forget — UI already updated
      }
      scrollToBottom();
    } else {
      scrollToBottom();
    }
  }, []);

  // ── SEND MESSAGE ────────────────────────────────────────────
  const handleSend = async () => {
    if (!compose.trim() || !activeId) return;
    const thread = threads.find(t => t.thread_id === activeId);
    if (!thread?.consent_id) return;

    setSending(true);
    const optimistic: ThreadMessage = {
      message_id:  `opt_${Date.now()}`,
      sender_type: "business",
      content:     compose.trim(),
      sent_at:     new Date().toISOString(),
      read_at:     null,
    };
    const text = compose.trim();
    setCompose("");
    setThreads(prev => prev.map(t =>
      t.thread_id === activeId
        ? { ...t, messages: [...t.messages, optimistic], last_message: text, last_message_at: optimistic.sent_at }
        : t
    ));
    scrollToBottom();

    try {
      const res = await apiSendMessage(thread.consent_id, text);
      setThreads(prev => prev.map(t =>
        t.thread_id === activeId
          ? { ...t, messages: t.messages.map(m => m.message_id === optimistic.message_id ? res.message : m) }
          : t
      ));
    } catch {
      // Roll back optimistic message
      setThreads(prev => prev.map(t =>
        t.thread_id === activeId
          ? { ...t, messages: t.messages.filter(m => m.message_id !== optimistic.message_id) }
          : t
      ));
      setCompose(text);
    } finally {
      setSending(false);
    }
  };

  // ── DERIVED ─────────────────────────────────────────────────
  const activeThread   = threads.find(t => t.thread_id === activeId) ?? null;
  const isCLThread     = activeThread?.type === "creditlinker";
  const totalUnread    = threads.reduce((s, t) => s + t.business_unread, 0);
  const financerUnread = threads.filter(t => t.type === "financer").reduce((s, t) => s + t.business_unread, 0);
  const clUnread       = threads.filter(t => t.type === "creditlinker").reduce((s, t) => s + t.business_unread, 0);

  const filteredThreads = threads.filter(t => {
    const matchFilter = filter === "all" || t.type === filter;
    const name = threadDisplayName(t).toLowerCase();
    const matchSearch = search === "" || name.includes(search.toLowerCase()) || t.last_message.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  // ── LOADING / ERROR ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Messages</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 10, color: "#9CA3AF" }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading messages…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Messages</h2>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 24, textAlign: "center" as const }}>
          <p style={{ fontSize: 13, color: "#991B1B", marginBottom: 12 }}>{error}</p>
          <button onClick={fetchThreads} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "white", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

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

          {/* Search + filter */}
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
                style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: search ? 28 : 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><X size={12} /></button>}
            </div>
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

          {/* Thread list */}
          <div style={{ flex: 1, overflowY: "auto" as const }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const }}>
                <MessageSquare size={24} style={{ color: "#E5E7EB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                  {threads.length === 0 ? "No messages yet." : "No messages found."}
                </p>
              </div>
            ) : filteredThreads.map(t => (
              <ThreadItem key={t.thread_id} thread={t} active={activeId === t.thread_id} onClick={() => openThread(t)} />
            ))}
          </div>
        </div>

        {/* RIGHT — Thread pane */}
        {activeThread ? (
          <div className={mobileView === "list" ? "msg-thread-hidden-mobile" : ""} style={{ display: "flex", flexDirection: "column" }}>

            {/* Thread header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="cl-hamburger" onClick={() => setMobileView("list")} style={{ marginRight: 2 }} aria-label="Back to list">
                  <ArrowLeft size={16} />
                </button>
                {isCLThread ? (
                  <CLAvatar size={36} />
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
                    {activeThread.financing_record_id && <Badge variant="secondary" style={{ fontSize: 10 }}>Financing active</Badge>}
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {isCLThread ? activeThread.subject : `${activeThread.institution_name} · Consent ${activeThread.consent_id?.slice(0, 8)}…`}
                  </p>
                </div>
              </div>
              {!isCLThread && (
                <Link href="/financers" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                  Manage consent
                </Link>
              )}
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px 20px 8px" }}>
              {loadingMessages ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: "#9CA3AF" }} />
                </div>
              ) : activeThread.messages.length === 0 ? (
                <div style={{ textAlign: "center" as const, padding: "40px 24px" }}>
                  <MessageSquare size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No messages yet. Start the conversation.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                    <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const }}>
                      {new Date(activeThread.messages[0]?.sent_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                  </div>
                  {activeThread.messages.map(msg => (
                    <MessageBubble key={msg.message_id} msg={msg} />
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose — financer threads only */}
            {!isCLThread ? (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "white" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <textarea value={compose} onChange={e => setCompose(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Reply to this financer… (Enter to send)"
                      rows={1}
                      style={{ flex: 1, border: "none", background: "transparent", resize: "none", padding: "10px 12px", fontSize: 13, color: "#0A2540", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" as const }} />
                    <button style={{ padding: "8px 10px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex" }}>
                      <Paperclip size={15} />
                    </button>
                  </div>
                  <button onClick={handleSend} disabled={!compose.trim() || sending}
                    style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, background: compose.trim() ? "#0A2540" : "#E5E7EB", color: compose.trim() ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: compose.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={16} />}
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
