"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck, RefreshCw, Banknote, FileText,
  Bell, CheckCheck, Trash2, ChevronRight,
  AlertCircle, TrendingUp, Handshake, Settings, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UndoToast } from "@/components/ui/undo-toast";
import { useActiveBusiness } from "@/lib/business-context";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  type AppNotification,
  type NotifType,
} from "@/lib/api";

/* ─────────────────────────────────────────────────────────
   FILTER TABS
───────────────────────────────────────────────────────── */
const FILTER_TABS = [
  { id: "all",       label: "All"       },
  { id: "unread",    label: "Unread"    },
  { id: "pipeline",  label: "Pipeline"  },
  { id: "consent",   label: "Consent"   },
  { id: "financing", label: "Financing" },
  { id: "security",  label: "Security"  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function notifIcon(type: NotifType) {
  const base: React.CSSProperties = { flexShrink: 0 };
  const icons: Record<NotifType, { icon: React.ReactNode; bg: string; color: string }> = {
    pipeline_complete: { icon: <RefreshCw   size={15} style={base} />, bg: "#EFF6FF", color: "#3B82F6" },
    score_change:      { icon: <TrendingUp  size={15} style={base} />, bg: "#ECFDF5", color: "#10B981" },
    consent_request:   { icon: <Handshake   size={15} style={base} />, bg: "#FFFBEB", color: "#F59E0B" },
    financing_offer:   { icon: <Banknote    size={15} style={base} />, bg: "#F0FDF4", color: "#10B981" },
    document_reviewed: { icon: <FileText    size={15} style={base} />, bg: "#F3F4F6", color: "#6B7280" },
    account_security:  { icon: <ShieldCheck size={15} style={base} />, bg: "#FEF2F2", color: "#EF4444" },
    consent_expiring:  { icon: <AlertCircle size={15} style={base} />, bg: "#FFFBEB", color: "#F59E0B" },
  };
  return icons[type] ?? { icon: <Bell size={15} style={base} />, bg: "#F3F4F6", color: "#6B7280" };
}

function matchesFilter(n: AppNotification, filter: string): boolean {
  if (filter === "all")       return true;
  if (filter === "unread")    return !n.read;
  if (filter === "pipeline")  return n.type === "pipeline_complete" || n.type === "score_change";
  if (filter === "consent")   return n.type === "consent_request"   || n.type === "consent_expiring";
  if (filter === "financing") return n.type === "financing_offer";
  if (filter === "security")  return n.type === "account_security";
  return true;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)    return "Just now";
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffHours < 24)  return `Today, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)  return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { activeBusiness } = useActiveBusiness();

  const [notifs,    setNotifs]    = useState<AppNotification[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState("all");
  const [undoToast, setUndoToast] = useState<{ message: string; restore: () => void } | null>(null);

  // ── FETCH ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications();
      setNotifs(res.notifications);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeBusiness) fetchNotifications();
  }, [activeBusiness, fetchNotifications]);

  // ── ACTIONS ──────────────────────────────────────────────────
  const markRead = (id: string) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationRead(id).catch(() => {
      // Revert on failure
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: false } : n));
    });
  };

  const markAllRead = () => {
    const prev = notifs;
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => setNotifs(prev));
  };

  const dismiss = (id: string) => {
    const notif = notifs.find(n => n.id === id);
    const idx   = notifs.findIndex(n => n.id === id);
    setNotifs(ns => ns.filter(n => n.id !== id));
    // Fire-and-forget — optimistic
    dismissNotification(id).catch(() => {
      // Restore on failure
      setNotifs(prev => {
        const n = [...prev];
        if (notif) n.splice(idx, 0, notif);
        return n;
      });
    });
    if (notif) {
      setUndoToast({
        message: "Notification dismissed",
        restore: () => setNotifs(prev => {
          const n = [...prev];
          n.splice(idx, 0, notif);
          return n;
        }),
      });
    }
  };

  // ── DERIVED ─────────────────────────────────────────────────
  const unreadCount = notifs.filter(n => !n.read).length;
  const visible     = notifs.filter(n => matchesFilter(n, filter));

  // ── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Notifications</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 10, color: "#9CA3AF" }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Loading notifications…</span>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Notifications</h2>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 24, textAlign: "center" as const }}>
          <p style={{ fontSize: 13, color: "#991B1B", marginBottom: 12 }}>{error}</p>
          <button onClick={fetchNotifications} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "white", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

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
                : `${notifs.length} notification${notifs.length !== 1 ? "s" : ""} · all read`
              }
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} style={{ gap: 5 }}>
                <CheckCheck size={13} /> Mark all read
              </Button>
            )}
            <Link
              href="/settings?tab=notifications"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", textDecoration: "none", transition: "all 0.12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
            >
              <Settings size={12} /> Preferences
            </Link>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="cl-overflow-x-auto">
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" as const, minWidth: "fit-content" }}>
            {FILTER_TABS.map(tab => {
              const count = tab.id === "all" ? 0
                : tab.id === "unread" ? notifs.filter(n => !n.read).length
                : notifs.filter(n => matchesFilter(n, tab.id)).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9999, border: "1.5px solid", borderColor: filter === tab.id ? "#0A2540" : "#E5E7EB", background: filter === tab.id ? "#0A2540" : "white", color: filter === tab.id ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: filter === tab.id ? "rgba(255,255,255,0.2)" : "#F3F4F6", color: filter === tab.id ? "white" : "#6B7280", padding: "1px 5px", borderRadius: 9999 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
                  style={{ display: "flex", gap: 16, padding: "18px 24px", borderBottom: i < visible.length - 1 ? "1px solid #F3F4F6" : "none", background: n.read ? "white" : "rgba(10,37,64,0.02)", transition: "background 0.1s", position: "relative" as const, cursor: "pointer" }}
                  onClick={() => !n.read && markRead(n.id)}
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
                      <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, marginTop: 1 }}>
                        {fmtTimestamp(n.timestamp)}
                      </span>
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
