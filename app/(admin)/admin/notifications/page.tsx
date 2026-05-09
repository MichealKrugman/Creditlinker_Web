"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Send, X, AlertTriangle, Info, CheckCircle2,
  Megaphone, Building2, Landmark, Code2, Users, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

async function callFn(name: string, body?: object, method: "POST" | "GET" = "POST") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: "all",        label: "All users",   icon: <Users size={14} />,     desc: "Businesses, financers, and developers" },
  { value: "businesses", label: "Businesses",  icon: <Building2 size={14} />, desc: "All business account holders" },
  { value: "financers",  label: "Financers",   icon: <Landmark size={14} />,  desc: "All financer institutions" },
  { value: "developers", label: "Developers",  icon: <Code2 size={14} />,     desc: "All developer accounts" },
];

const NOTIFICATION_TYPES = [
  { value: "info",        label: "Info",        color: "#0891B2", bg: "#F0FDFF" },
  { value: "maintenance", label: "Maintenance", color: "#6366F1", bg: "#EEF2FF" },
  { value: "feature",     label: "Feature",     color: "#10B981", bg: "#ECFDF5" },
  { value: "system",      label: "System",      color: "#F59E0B", bg: "#FFFBEB" },
  { value: "warning",     label: "Warning",     color: "#EF4444", bg: "#FEF2F2" },
];

function typeChip(type: string) {
  const t = NOTIFICATION_TYPES.find(n => n.value === type) ?? NOTIFICATION_TYPES[0];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: t.color, background: t.bg, padding: "2px 8px", borderRadius: 9999, textTransform: "capitalize" }}>
      {t.label}
    </span>
  );
}

function audienceChip(aud: string) {
  const a = AUDIENCE_OPTIONS.find(o => o.value === aud) ?? AUDIENCE_OPTIONS[0];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 9999 }}>
      {a.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const user = getMockAdminUser();
  const canSend = canManage(user, "notifications");

  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [audience, setAudience] = useState("all");
  const [type,     setType]     = useState("info");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [sendError, setSendError] = useState("");

  const [history,        setHistory]        = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await callFn("admin-get-notifications", undefined, "GET");
      setHistory(data.notifications ?? data.data ?? []);
    } catch (e) {
      console.error("[notifications] load history failed", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const estimatedReach = audience === "all" ? "All users" : audience === "businesses" ? "Businesses only" : audience === "financers" ? "Financers only" : "Developers only";

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true); setSendError("");
    try {
      await callFn("admin-broadcast-notification", { title, body, audience, type });
      setSent(true);
      setTitle(""); setBody(""); setAudience("all"); setType("info");
      await loadHistory();
      setTimeout(() => setSent(false), 4000);
    } catch (e: any) {
      setSendError(e.message ?? "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Notifications</h2>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Broadcast platform-wide notifications to users</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* COMPOSE FORM */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
            <Megaphone size={16} style={{ color: "#0A2540" }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Compose Notification</p>
          </div>

          {!canSend ? (
            <div style={{ padding: "32px 22px", textAlign: "center" }}>
              <AlertTriangle size={24} style={{ color: "#F59E0B", marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Permission required</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>You need Notifications manage access to send notifications.</p>
            </div>
          ) : sent ? (
            <div style={{ padding: "40px 22px", textAlign: "center" }}>
              <CheckCircle2 size={32} style={{ color: "#10B981", margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>Notification sent!</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Delivered to {estimatedReach}.</p>
            </div>
          ) : (
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Title <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title…"
                  style={{ width: "100%", height: 40, padding: "0 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
              </div>

              {/* Body */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Message <span style={{ color: "#EF4444" }}>*</span></label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification body text…" rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
              </div>

              {/* Audience */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Audience</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setAudience(opt.value)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1.5px solid", borderColor: audience === opt.value ? "#0A2540" : "#E5E7EB", borderRadius: 10, background: audience === opt.value ? "#F9FAFB" : "white", cursor: "pointer", textAlign: "left" as const, transition: "all 0.12s" }}>
                      <span style={{ color: audience === opt.value ? "#0A2540" : "#9CA3AF" }}>{opt.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{opt.label}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Type</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {NOTIFICATION_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      style={{ padding: "5px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: type === t.value ? t.color : "#E5E7EB", background: type === t.value ? t.bg : "white", color: type === t.value ? t.color : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {sendError && <p style={{ fontSize: 12, color: "#EF4444" }}>{sendError}</p>}

              {/* Reach estimate + send */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>Audience: <strong style={{ color: "#0A2540" }}>{estimatedReach}</strong></p>
                <Button variant="primary" size="sm" disabled={!title.trim() || !body.trim() || sending} onClick={handleSend} style={{ gap: 6 }}>
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {sending ? "Sending…" : "Send Notification"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SENT HISTORY */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Sent History</p>
          </div>
          <div>
            {historyLoading ? (
              <div style={{ padding: "32px 22px", textAlign: "center" }}>
                <Loader2 size={16} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</p>
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center" }}>
                <Bell size={20} style={{ color: "#D1D5DB", margin: "0 auto 8px", display: "block" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No notifications sent yet.</p>
              </div>
            ) : history.map((n: any, i: number) => (
              <div key={n.id} style={{ padding: "14px 22px", borderBottom: i < history.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", lineHeight: 1.4, flex: 1 }}>{n.title}</p>
                  {typeChip(n.type ?? n.notification_type ?? "info")}
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: 6 }}>
                  {(n.body ?? n.message ?? "").slice(0, 80)}{(n.body ?? n.message ?? "").length > 80 ? "…" : ""}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {audienceChip(n.audience ?? "all")}
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {n.reach ? `~${n.reach.toLocaleString()} users · ` : ""}
                    {n.sent_at ?? (n.created_at ? new Date(n.created_at).toLocaleDateString() : "")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
