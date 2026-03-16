"use client";

import { useState } from "react";
import {
  Bell, Send, X, AlertTriangle, Info, CheckCircle2,
  Megaphone, Building2, Landmark, Code2, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/notifications
// ─────────────────────────────────────────────────────────────

const SENT_NOTIFICATIONS = [
  {
    id: "notif_012", title: "Scheduled Maintenance — Jan 15",
    body: "Creditlinker platform will be unavailable for scheduled maintenance on Jan 15 from 02:00–04:00 WAT.",
    audience: "all", type: "maintenance",
    sent_at: "Jan 10, 2025 · 10:30",
    sent_by: "Tunde Adeyemi",
    reach: 1842,
  },
  {
    id: "notif_011", title: "New Feature: Financial Analysis Dashboard",
    body: "We've launched a new Financial Analysis page that gives you deeper insights into your revenue patterns and cash flow.",
    audience: "businesses", type: "feature",
    sent_at: "Dec 22, 2024 · 09:00",
    sent_by: "Tunde Adeyemi",
    reach: 1842,
  },
  {
    id: "notif_010", title: "Scoring Engine Update",
    body: "We've updated the dimensional scoring algorithm. Scores have been recalculated. Please review your updated financial identity.",
    audience: "businesses", type: "system",
    sent_at: "Dec 15, 2024 · 08:00",
    sent_by: "System",
    reach: 1842,
  },
  {
    id: "notif_009", title: "New Capital Categories Available",
    body: "Revenue-based financing and trade finance options are now live on the platform.",
    audience: "financers", type: "feature",
    sent_at: "Dec 10, 2024 · 11:00",
    sent_by: "Tunde Adeyemi",
    reach: 28,
  },
];

const AUDIENCE_OPTIONS = [
  { value: "all",        label: "All users",      icon: <Users size={14} />,    desc: "Businesses, financers, and developers" },
  { value: "businesses", label: "Businesses",     icon: <Building2 size={14} />, desc: "All business account holders" },
  { value: "financers",  label: "Financers",      icon: <Landmark size={14} />, desc: "All financer institutions" },
  { value: "developers", label: "Developers",     icon: <Code2 size={14} />,    desc: "All developer accounts" },
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
  const [sent,     setSent]     = useState(false);
  const [preview,  setPreview]  = useState(false);

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    // TODO: POST /admin/notifications/broadcast { title, body, audience, type }
    console.log("Sending notification:", { title, body, audience, type });
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle(""); setBody(""); setAudience("all"); setType("info");
    }, 3000);
  }

  const estimatedReach = audience === "all" ? 1842 + 28 + 8 : audience === "businesses" ? 1842 : audience === "financers" ? 28 : 8;

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
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Delivered to ~{estimatedReach.toLocaleString()} users.</p>
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

              {/* Reach estimate + send */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>Estimated reach: <strong style={{ color: "#0A2540" }}>{estimatedReach.toLocaleString()} users</strong></p>
                <Button variant="primary" size="sm" disabled={!title.trim() || !body.trim()} onClick={handleSend} style={{ gap: 6 }}>
                  <Send size={13} /> Send Notification
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
            {SENT_NOTIFICATIONS.map((n, i) => (
              <div key={n.id} style={{ padding: "14px 22px", borderBottom: i < SENT_NOTIFICATIONS.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", lineHeight: 1.4, flex: 1 }}>{n.title}</p>
                  {typeChip(n.type)}
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: 6 }}>{n.body.slice(0, 80)}…</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {audienceChip(n.audience)}
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>~{n.reach.toLocaleString()} users · {n.sent_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
