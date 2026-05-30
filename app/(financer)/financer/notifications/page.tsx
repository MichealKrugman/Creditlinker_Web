"use client";

import { useState, useEffect } from "react";
import {
  Bell, CheckCircle2, ArrowUpRight, Tag,
  ShieldCheck, AlertCircle, Building2, Clock, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type NotifType = "consent_granted" | "request_received" | "settlement_confirmed" | "dispute_opened" | "new_match";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  action_href: string;
  action_label: string;
};

function typeConfig(t: NotifType) {
  return {
    request_received:     { icon: <Building2    size={14} />, color: "#0A2540", bg: "#F3F4F6" },
    consent_granted:      { icon: <ShieldCheck  size={14} />, color: "#10B981", bg: "#ECFDF5" },
    settlement_confirmed: { icon: <CheckCircle2 size={14} />, color: "#10B981", bg: "#ECFDF5" },
    dispute_opened:       { icon: <AlertCircle  size={14} />, color: "#EF4444", bg: "#FEF2F2" },
    new_match:            { icon: <Tag          size={14} />, color: "#818CF8", bg: "#F3F0FF" },
  }[t];
}

function fmtDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (hours < 1)  return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* Build notifications from real Supabase data */
function buildNotifications(
  matches: { match_id: string; anonymized_id: string; status: string; capital_category: string; matched_at: string; access_requested_at: string | null; access_responded_at: string | null }[],
  records: { financing_id: string; status: string; settled_at: string | null; capital_category: string }[],
): Notification[] {
  const notifs: Notification[] = [];

  for (const m of matches) {
    const shortId = `BIZ-${m.anonymized_id.slice(0, 6).toUpperCase()}`;
    const cat = m.capital_category.replace(/_/g, " ");

    notifs.push({
      id: `${m.match_id}_match`,
      type: "new_match",
      title: "New match",
      body: `${shortId} was matched to your criteria for ${cat}.`,
      time: m.matched_at,
      read: false,
      action_href: "/financer/businesses",
      action_label: "Browse businesses",
    });

    if (m.access_requested_at) {
      notifs.push({
        id: `${m.match_id}_requested`,
        type: "request_received",
        title: "Access request sent",
        body: `You requested access to ${shortId}'s financial profile for ${cat}.`,
        time: m.access_requested_at,
        read: true,
        action_href: "/financer/requests",
        action_label: "View request",
      });
    }

    if (m.access_responded_at && m.status === "consented") {
      notifs.push({
        id: `${m.match_id}_consented`,
        type: "consent_granted",
        title: "Access granted",
        body: `${shortId} approved your access request. Their financial profile is now available.`,
        time: m.access_responded_at,
        read: false,
        action_href: "/financer/businesses",
        action_label: "View profile",
      });
    }
  }

  for (const r of records) {
    const shortId = `FIN-${r.financing_id.slice(0, 6).toUpperCase()}`;
    const cat = r.capital_category.replace(/_/g, " ");

    if (r.status === "settled" && r.settled_at) {
      notifs.push({
        id: `${r.financing_id}_settled`,
        type: "settlement_confirmed",
        title: "Settlement confirmed",
        body: `${shortId} (${cat}) has been fully settled.`,
        time: r.settled_at,
        read: true,
        action_href: "/financer/portfolio",
        action_label: "View record",
      });
    }

    if (r.status === "disputed") {
      notifs.push({
        id: `${r.financing_id}_disputed`,
        type: "dispute_opened",
        title: "Dispute opened",
        body: `A dispute has been raised on financing record ${shortId}. Platform review is underway.`,
        time: r.settled_at ?? new Date().toISOString(),
        read: false,
        action_href: "/financer/portfolio",
        action_label: "View dispute",
      });
    }
  }

  return notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
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

      const [matchRes, recordRes] = await Promise.all([
        supabase
          .from("discovery_matches")
          .select("match_id, anonymized_id, status, capital_category, matched_at, access_requested_at, access_responded_at")
          .eq("institution_id", instId)
          .order("matched_at", { ascending: false })
          .limit(100),
        supabase
          .from("financing_records")
          .select("financing_id, status, capital_category, settled_at")
          .eq("institution_id", instId)
          .order("granted_at", { ascending: false })
          .limit(50),
      ]);

      if (matchRes.error) { setError(matchRes.error.message); setLoading(false); return; }
      setItems(buildNotifications(matchRes.data ?? [], recordRes.data ?? []));
      setLoading(false);
    })();
  }, [user]);

  const unread = items.filter(n => !n.read).length;
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));

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
                onClick={() => setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
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
