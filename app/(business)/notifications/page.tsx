"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, RefreshCw, Banknote, FileText,
  Bell, CheckCheck, Trash2, ChevronRight,
  AlertCircle, TrendingUp, Handshake, Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UndoToast } from "@/components/ui/undo-toast";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /business/notifications (paginated)
───────────────────────────────────────────────────────── */
type NotifType =
  | "pipeline_complete"
  | "score_change"
  | "consent_request"
  | "financing_offer"
  | "document_reviewed"
  | "account_security"
  | "consent_expiring";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  action?: { label: string; href: string };
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "n_001",
    type: "consent_request",
    title: "New access request",
    body: "Coronation Merchant Bank has requested access to your financial identity for Invoice Financing.",
    timestamp: "Today, 11:30",
    read: false,
    action: { label: "Review request", href: "/financers" },
  },
  {
    id: "n_002",
    type: "pipeline_complete",
    title: "Pipeline run complete",
    body: "Your financial identity has been updated. Overall score: 742 (+18 from last run). 8 stages completed successfully.",
    timestamp: "Today, 09:14",
    read: false,
    action: { label: "View identity", href: "/financial-identity" },
  },
  {
    id: "n_003",
    type: "score_change",
    title: "Score improved",
    body: "Your Risk Profile dimension increased by 6 points to 69. This was driven by a reduction in irregular transaction patterns.",
    timestamp: "Today, 09:14",
    read: false,
    action: { label: "View analysis", href: "/financial-analysis" },
  },
  {
    id: "n_004",
    type: "document_reviewed",
    title: "Document rejected",
    body: "Your Director ID for Emeka Okonkwo was rejected. The document appears to be expired. Please upload a valid government-issued ID.",
    timestamp: "Dec 27, 2024",
    read: true,
    action: { label: "Re-upload", href: "/documents" },
  },
  {
    id: "n_005",
    type: "consent_expiring",
    title: "Consent expiring soon",
    body: "Your consent grant to Stanbic IBTC expires in 7 days. Renew it to maintain their access to your financial identity.",
    timestamp: "Dec 26, 2024",
    read: true,
    action: { label: "Renew consent", href: "/financers" },
  },
  {
    id: "n_006",
    type: "financing_offer",
    title: "Financing offer received",
    body: "Lapo Microfinance has created a Revenue Advance offer for ₦3.5M at 5% flat. Review the terms and accept or decline.",
    timestamp: "Nov 15, 2024",
    read: true,
    action: { label: "View offer", href: "/financing" },
  },
  {
    id: "n_007",
    type: "document_reviewed",
    title: "Document verified",
    body: "Your CAC Certificate has been verified successfully. Your RC number RC-1234567 has been confirmed.",
    timestamp: "Dec 20, 2024",
    read: true,
    action: { label: "View documents", href: "/documents" },
  },
  {
    id: "n_008",
    type: "account_security",
    title: "New login detected",
    body: "A new login was detected from Chrome on Windows in Abuja, Nigeria. If this wasn't you, revoke this session immediately.",
    timestamp: "Dec 28, 2024",
    read: true,
    action: { label: "Review sessions", href: "/settings?tab=security" },
  },
];

const FILTER_TABS = [
  { id: "all",      label: "All"       },
  { id: "unread",   label: "Unread"    },
  { id: "pipeline", label: "Pipeline"  },
  { id: "consent",  label: "Consent"   },
  { id: "financing",label: "Financing" },
  { id: "security", label: "Security"  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function notifIcon(type: NotifType) {
  const base: React.CSSProperties = { flexShrink: 0 };
  const icons: Record<NotifType, { icon: React.ReactNode; bg: string; color: string }> = {
    pipeline_complete:  { icon: <RefreshCw  size={15} style={base} />, bg: "#EFF6FF", color: "#3B82F6" },
    score_change:       { icon: <TrendingUp size={15} style={base} />, bg: "#ECFDF5", color: "#10B981" },
    consent_request:    { icon: <Handshake  size={15} style={base} />, bg: "#FFFBEB", color: "#F59E0B" },
    financing_offer:    { icon: <Banknote   size={15} style={base} />, bg: "#F0FDF4", color: "#10B981" },
    document_reviewed:  { icon: <FileText   size={15} style={base} />, bg: "#F3F4F6", color: "#6B7280" },
    account_security:   { icon: <ShieldCheck size={15} style={base} />, bg: "#FEF2F2", color: "#EF4444" },
    consent_expiring:   { icon: <AlertCircle size={15} style={base} />, bg: "#FFFBEB", color: "#F59E0B" },
  };
  return icons[type];
}

function matchesFilter(n: Notification, filter: string): boolean {
  if (filter === "all")      return true;
  if (filter === "unread")   return !n.read;
  if (filter === "pipeline") return n.type === "pipeline_complete" || n.type === "score_change";
  if (filter === "consent")  return n.type === "consent_request" || n.type === "consent_expiring";
  if (filter === "financing")return n.type === "financing_offer";
  if (filter === "security") return n.type === "account_security";
  return true;
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const [filter,    setFilter]    = useState("all");
  const [notifs,    setNotifs]    = useState(NOTIFICATIONS);

  const unreadCount = notifs.filter(n => !n.read).length;
  const [undoToast, setUndoToast] = useState<{ message: string; restore: () => void } | null>(null);

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const markRead    = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss     = (id: string) => {
    const notif = notifs.find(n => n.id === id);
    const idx   = notifs.findIndex(n => n.id === id);
    setNotifs(ns => ns.filter(n => n.id !== id));
    if (notif) {
      setUndoToast({
        message: `Notification dismissed`,
        restore: () => setNotifs(prev => { const n = [...prev]; n.splice(idx, 0, notif); return n; }),
      });
    }
  };

  const visible = notifs.filter(n => matchesFilter(n, filter));

  return (
    <>
    {undoToast && (
      <UndoToast
        message={undoToast.message}
        onUndo={() => { undoToast.restore(); setUndoToast(null); }}
        onDismiss={() => setUndoToast(null)}
      />
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Notifications
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {unreadCount > 0
              ? <><span style={{ color: "#0A2540", fontWeight: 600 }}>{unreadCount} unread</span> · {notifs.length} total</>
              : `${notifs.length} notifications · all read`
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} style={{ gap: 5 }}>
              <CheckCheck size={13} /> Mark all read
            </Button>
          )}
          <Link href="/settings?tab=notifications" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", textDecoration: "none", transition: "all 0.12s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
          >
            <Settings size={12} /> Preferences
          </Link>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="cl-overflow-x-auto"><div style={{ display: "flex", gap: 6, flexWrap: "nowrap" as const, minWidth: "fit-content" }}>
        {FILTER_TABS.map(tab => {
          const count = tab.id === "unread"
            ? notifs.filter(n => !n.read).length
            : tab.id === "all"
            ? 0
            : notifs.filter(n => matchesFilter(n, tab.id)).length;

          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 9999,
                border: "1.5px solid",
                borderColor: filter === tab.id ? "#0A2540" : "#E5E7EB",
                background: filter === tab.id ? "#0A2540" : "white",
                color: filter === tab.id ? "white" : "#6B7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: filter === tab.id ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                  color: filter === tab.id ? "white" : "#6B7280",
                  padding: "1px 5px", borderRadius: 9999,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div></div>

      {/* ── NOTIFICATION LIST ── */}
      {visible.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "48px 24px", textAlign: "center" as const }}>
          <Bell size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No notifications</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {filter === "unread" ? "You're all caught up." : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          {visible.map((n, i) => {
            const ic = notifIcon(n.type);
            return (
              <div
                key={n.id}
                style={{
                  display: "flex", gap: 16,
                  padding: "18px 24px",
                  borderBottom: i < visible.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: n.read ? "white" : "rgba(10,37,64,0.02)",
                  transition: "background 0.1s",
                  position: "relative" as const,
                }}
                onClick={() => markRead(n.id)}
              >
                {/* Unread dot */}
                {!n.read && (
                  <div style={{ position: "absolute", top: 22, left: 10, width: 6, height: 6, borderRadius: "50%", background: "#00D4FF" }} />
                )}

                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", color: ic.color }}>
                  {ic.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0A2540", lineHeight: 1.4 }}>
                      {n.title}
                    </p>
                    <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, marginTop: 1 }}>{n.timestamp}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: n.action ? 10 : 0 }}>
                    {n.body}
                  </p>
                  {n.action && (
                    <Link
                      href={n.action.href}
                      onClick={e => e.stopPropagation()}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#0A2540", textDecoration: "none" }}
                    >
                      {n.action.label} <ChevronRight size={11} />
                    </Link>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                  style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, alignSelf: "flex-start" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
    </>
  );
}
