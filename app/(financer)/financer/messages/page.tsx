"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Search, X, ArrowLeft,
  Building2, ShieldCheck, Clock, CheckCheck, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES — real messages table schema
───────────────────────────────────────────────────────── */
interface RawMessage {
  message_id:            string;
  sender_type:           "business" | "institution";
  sender_institution_id: string | null;
  body:                  string;
  created_at:            string;
  read_at:               string | null;
  is_read:               boolean;
}

interface Message {
  message_id:  string;
  sender_type: "business" | "institution";
  content:     string;
  sent_at:     string;
  read_at:     string | null;
}

interface Thread {
  consent_id:       string;
  business_id:      string;
  business_name:    string;          // real name — shown once consent is active
  anonymized_id:    string;
  granted_at:       string;
  messages:         Message[];
  last_message:     string;
  last_message_at:  string;
  unread_count:     number;
  financing_active: boolean;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtFullTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────────────────
   THREAD LIST ITEM
───────────────────────────────────────────────────────── */
function ThreadItem({ thread, active, onClick }: {
  thread: Thread; active: boolean; onClick: () => void;
}) {
  const hasUnread  = thread.unread_count > 0;
  const displayName = thread.business_name || `BIZ-${thread.anonymized_id.slice(0, 6).toUpperCase()}`;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", width: "100%", boxSizing: "border-box" as const,
        border: "none", borderBottom: "1px solid #F3F4F6",
        borderLeft: `2px solid ${active ? "#0A2540" : "transparent"}`,
        background: active ? "#F5F7FA" : "transparent",
        cursor: "pointer", textAlign: "left" as const,
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Building2 size={16} color="#9CA3AF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
            {displayName}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtTime(thread.last_message_at)}</span>
            {hasUnread && (
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>{thread.unread_count}</span>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: 12, color: hasUnread ? "#374151" : "#9CA3AF", fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.5 }}>
          {thread.last_message || "No messages yet"}
        </p>
        {thread.financing_active && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "2px 7px", borderRadius: 9999 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} /> Financing active
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
    <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, marginBottom: 12 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
          <Building2 size={12} color="#9CA3AF" />
        </div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isMe ? "#0A2540" : "white",
          border: isMe ? "none" : "1px solid #E5E7EB",
          fontSize: 13, color: isMe ? "white" : "#0A2540",
          lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "pre-wrap",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
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
  const { user } = useSession();

  const [threads,      setThreads]      = useState<Thread[]>([]);
  const [instId,       setInstId]       = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [compose,      setCompose]      = useState("");
  const [sending,      setSending]      = useState(false);
  const [mobileView,   setMobileView]   = useState<"list" | "chat">("list");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeThread = threads.find(t => t.consent_id === activeId) ?? null;

  /* ── Load threads (consented businesses) ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      const resolvedInstId = await getMyInstitutionId(user.id);
      if (!resolvedInstId) { setError("No institution found."); setLoading(false); return; }
      setInstId(resolvedInstId);

      // 1. Load consented businesses
      const { data: consents, error: cErr } = await supabase
        .from("consent_records")
        .select("consent_id, business_id, granted_at, is_active")
        .eq("institution_id", resolvedInstId)
        .eq("is_active", true)
        .order("granted_at", { ascending: false });

      if (cErr) { setError(cErr.message); setLoading(false); return; }
      if (!consents?.length) { setThreads([]); setLoading(false); return; }

      // 2. Fetch business names separately (avoid RLS join issue)
      const businessIds = consents.map((c: any) => c.business_id).filter(Boolean);
      let bizMap: Record<string, { name: string; financial_identity_id: string }> = {};
      if (businessIds.length > 0) {
        const { data: bizRows } = await supabase
          .from("businesses")
          .select("business_id, name, financial_identity_id")
          .in("business_id", businessIds);
        (bizRows ?? []).forEach((b: any) => { bizMap[b.business_id] = b; });
      }

      // 3. Batch-fetch all messages for all consents in one query
      const consentIds = consents.map((c: any) => c.consent_id);
      const { data: allMsgs } = await supabase
        .from("messages")
        .select("message_id, consent_id, sender_type, body, created_at, read_at, is_read")
        .in("consent_id", consentIds)
        .eq("type", "financer_message")
        .order("created_at", { ascending: true });

      // Group messages by consent_id
      const msgsByConsent: Record<string, RawMessage[]> = {};
      (allMsgs ?? []).forEach((m: any) => {
        if (!msgsByConsent[m.consent_id]) msgsByConsent[m.consent_id] = [];
        msgsByConsent[m.consent_id].push(m);
      });

      // 4. Build threads
      const allThreads: Thread[] = consents.map((c: any) => {
        const raw: RawMessage[] = msgsByConsent[c.consent_id] ?? [];
        const unread = raw.filter(m => m.sender_type === "business" && !m.is_read).length;
        const last = raw[raw.length - 1];
        const biz = bizMap[c.business_id];
        return {
          consent_id:       c.consent_id,
          business_id:      c.business_id,
          business_name:    biz?.name ?? "",
          anonymized_id:    biz?.financial_identity_id ?? c.business_id,
          granted_at:       c.granted_at,
          messages:         raw.map(m => ({ message_id: m.message_id, sender_type: m.sender_type, content: m.body, sent_at: m.created_at, read_at: m.read_at })),
          last_message:     last?.body ?? "",
          last_message_at:  last?.created_at ?? c.granted_at,
          unread_count:     unread,
          financing_active: false,
        };
      });

      setThreads(allThreads);
      if (allThreads.length > 0) setActiveId(allThreads[0].consent_id);
      setLoading(false);
    })();
  }, [user]);

  /* ── Mark thread read when opening ── */
  useEffect(() => {
    if (!activeId) return;
    setThreads(prev => prev.map(t =>
      t.consent_id === activeId ? { ...t, unread_count: 0 } : t
    ));
    // Mark DB records read
    supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("consent_id", activeId)
      .eq("sender_type", "business")
      .eq("is_read", false)
      .then(() => {});
  }, [activeId]);

  /* ── Scroll to bottom on thread change ── */
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [activeId, threads]);

  /* ── Send message ── */
  const sendMessage = useCallback(async () => {
    if (!compose.trim() || !activeId || !instId) return;
    setSending(true);

    const content = compose.trim();
    const now = new Date().toISOString();
    const tempId = `temp_${Date.now()}`;

    // Optimistic update
    const optimistic: Message = { message_id: tempId, sender_type: "institution", content, sent_at: now, read_at: null };
    setThreads(prev => prev.map(t =>
      t.consent_id === activeId
        ? { ...t, messages: [...t.messages, optimistic], last_message: content, last_message_at: now }
        : t
    ));
    setCompose("");

    // Insert into DB
    const thread = threads.find(t => t.consent_id === activeId);
    const { error: sendErr } = await supabase.from("messages").insert({
      type:                  "financer_message",
      sender_type:           "institution",
      sender_institution_id: instId,
      sender_business_id:    null,
      recipient_business_id: thread?.business_id ?? null,
      consent_id:            activeId,
      subject:               "",
      body:                  content,
      metadata:              {},
      is_read:               false,
      created_at:            now,
    });

    if (sendErr) {
      // Revert optimistic update
      setThreads(prev => prev.map(t =>
        t.consent_id === activeId
          ? { ...t, messages: t.messages.filter(m => m.message_id !== tempId) }
          : t
      ));
      setCompose(content);
    }

    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [compose, activeId, instId]);

  const filteredThreads = threads.filter(t => {
    const name = (t.business_name || `BIZ-${t.anonymized_id.slice(0, 6).toUpperCase()}`).toLowerCase();
    return name.includes(search.toLowerCase()) || t.last_message.toLowerCase().includes(search.toLowerCase());
  });

  const totalUnread = threads.reduce((s, t) => s + t.unread_count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>Messages</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {loading ? "Loading…" : `${threads.length} conversation${threads.length !== 1 ? "s" : ""}`}
            {totalUnread > 0 && <span style={{ color: "#0A2540", fontWeight: 600 }}> · {totalUnread} unread</span>}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
            <ShieldCheck size={13} style={{ color: "#00A8CC", flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: "#0A5060", whiteSpace: "nowrap" }}>Requires active consent</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Two-pane layout */}
      <div className="msg-split-grid" style={{
        display: "grid", gridTemplateColumns: "300px 1fr",
        background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
        overflow: "hidden", height: "calc(100vh - 220px)", minHeight: 520,
      }}>

        {/* LEFT — Thread list */}
        <div
          className={mobileView === "chat" ? "msg-thread-hidden-mobile" : ""}
          style={{ borderRight: "1px solid #F3F4F6", display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: search ? 28 : 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" as const }}>
            {loading ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const }}>
                <Loader2 size={20} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const }}>
                <MessageSquare size={24} style={{ color: "#E5E7EB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                  {threads.length === 0
                    ? "No consented businesses yet."
                    : "No conversations match your search."}
                </p>
              </div>
            ) : (() => {
              const withMsgs    = filteredThreads.filter(t => t.messages.length > 0);
              const withoutMsgs = filteredThreads.filter(t => t.messages.length === 0);
              return (
                <>
                  {withMsgs.map(t => (
                    <ThreadItem
                      key={t.consent_id}
                      thread={t}
                      active={activeId === t.consent_id}
                      onClick={() => { setActiveId(t.consent_id); setMobileView("chat"); }}
                    />
                  ))}
                  {withoutMsgs.length > 0 && (
                    <>
                      <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                        Start a conversation
                      </div>
                      {withoutMsgs.map(t => (
                        <ThreadItem
                          key={t.consent_id}
                          thread={t}
                          active={activeId === t.consent_id}
                          onClick={() => { setActiveId(t.consent_id); setMobileView("chat"); }}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* RIGHT — Active thread */}
        {activeThread ? (
          <div
            className={mobileView === "list" ? "msg-thread-hidden-mobile" : ""}
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}
          >
            {/* Thread header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                <button
                  onClick={() => setMobileView("list")}
                  className="cl-hamburger"
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}
                >
                  <ArrowLeft size={14} />
                </button>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={15} color="#9CA3AF" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>
                      {activeThread.business_name || `BIZ-${activeThread.anonymized_id.slice(0, 6).toUpperCase()}`}
                    </p>
                    <Badge variant="success" style={{ fontSize: 10, flexShrink: 0 }}>Access granted</Badge>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    Consent since {new Date(activeThread.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Link
                  href={`/financer/business-profile?id=${activeThread.business_id}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px 16px 8px", minHeight: 0 }}>
              {activeThread.messages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
                  <MessageSquare size={28} style={{ color: "#E5E7EB" }} />
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                activeThread.messages.map(msg => <MessageBubble key={msg.message_id} msg={msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "white", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                  <textarea
                    value={compose}
                    onChange={e => setCompose(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    style={{ flex: 1, border: "none", background: "transparent", resize: "none", padding: "10px 12px", fontSize: 13, color: "#0A2540", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" as const, boxSizing: "border-box" as const, width: "100%" }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!compose.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, background: compose.trim() && !sending ? "#0A2540" : "#E5E7EB", color: compose.trim() && !sending ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: compose.trim() && !sending ? "pointer" : "not-allowed", transition: "all 0.15s" }}
                >
                  {sending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <MessageSquare size={32} style={{ color: "#E5E7EB" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Select a conversation</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>Choose a thread on the left to start messaging.</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
