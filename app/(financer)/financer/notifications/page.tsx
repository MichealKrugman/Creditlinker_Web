"use client";

import { useState, useEffect } from "react";
import {
  Bell, CheckCircle2, ArrowUpRight,
  ShieldCheck, AlertCircle, Loader2, XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type NotifType =
  | "consent_granted"
  | "consent_denied"
  | "settlement_confirmed"
  | "dispute_opened";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  action_href: string | null;
  action_label: string | null;
};

function typeConfig(t: NotifType) {
  return {
    consent_granted:      { icon: <ShieldCheck  size={14} />, color: "#10B981", bg: "#ECFDF5" },
    consent_denied:       { icon: <XCircle      size={14} />, color: "#EF4444", bg: "#FEF2F2" },
    settlement_confirmed: { icon: <CheckCircle2 size={14} />, color: "#10B981", bg: "#ECFDF5" },
    dispute_opened:       { icon: <AlertCircle  size={14} />, color: "#EF4444", bg: "#FEF2F2" },
  }[t];
}

function fmtDate(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (hours < 1)  return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* Map a notifications row to our local type */
function mapRow(row: {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  action_href: string | null;
  action_label: string | null;
}): Notification | null {
  const allowed: NotifType[] = ["consent_granted", "consent_denied", "settlement_confirmed", "dispute_opened"];
  if (!allowed.includes(row.type as NotifType)) return null;
  return {
    id:           row.notification_id,
    type:         row.type as NotifType,
    title:        row.title,
    body:         row.body,
    time:         row.created_at,
    read:         row.is_read,
    action_href:  row.action_href,
    action_label: row.action_label,
  };
}

export default function FinancerNotifications() {
  const { user } = useSession();
  const [items,   setItems]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const instId = await getMyInstitutionId(user.id);
      if (!instId) { setError("No institution found."); setLoading(false); return; }

      const { data, error: err } = await supabase
        .from("notifications")
        .select("notification_id, type, title, body, is_read, created_at, action_href, action_label")
        .eq("institution_id", instId)
        .eq("recipient_type", "institution")
        .order("created_at", { ascending: false })
        .limit(100);

      if (err) { setError(err.message); setLoading(false); return; }

      setItems((data ?? []).map(mapRow).filter(Boolean) as Notification[]);
      setLoading(false);
    })();
  }, [user]);

  async function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("notification_id", id);
  }

  async function markAllRead() {
    const unreadIds = items.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("notification_id", unreadIds);
  }

  const unread = items.filter(n => !n.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Notifications
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {loading ? "Loading…" : unread > 0
              ? <><span style={{ color: "#EF4444", fontWeight: 600 }}>{unread} unread</span> · {items.length} total</>
              : `${items.length} notifications`
            }
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={13} /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Loader2 size={24} style={{ color: "#D1D5DB", marginBottom: 10, animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading notifications…</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Bell size={28} style={{ color: "#E5E7EB", marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No notifications yet</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Activity across your discovery feed and deals will appear here.</p>
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          {items.map((n, i) => {
            const tc = typeConfig(n.type);
            return (
              <div
                key={n.id}
                style={{
                  display: "flex", gap: 14, padding: "16px 22px",
                  borderBottom: i < items.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: n.read ? "white" : "rgba(0,212,255,0.02)",
                  cursor: "pointer",
                }}
                onClick={() => { if (!n.read) markRead(n.id); }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", color: tc.color }}>
                  {tc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0A2540" }}>{n.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", display: "block" }} />}
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(n.time)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: 8 }}>{n.body}</p>
                  <a href={n.action_href} style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }} onClick={e => e.stopPropagation()}>
                    {n.action_label} <ArrowUpRight size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
