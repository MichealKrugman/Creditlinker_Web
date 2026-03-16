"use client";

import { useState } from "react";
import {
  Bell, CheckCircle2, ArrowUpRight, Tag,
  ShieldCheck, AlertCircle, Building2, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type NotifType = "consent_granted" | "request_received" | "settlement_confirmed" | "offer_accepted" | "dispute_opened";

const NOTIFICATIONS = [
  {
    id: "N-001",
    type: "request_received" as NotifType,
    title: "New financing request",
    body: "BIZ-7X9A has requested financing under your Working Capital Facility.",
    time: "2 hours ago",
    read: false,
    action_href: "/financer/requests",
    action_label: "Review request",
  },
  {
    id: "N-002",
    type: "consent_granted" as NotifType,
    title: "Access granted",
    body: "BIZ-9P4L has granted you access to their full financial identity.",
    time: "Yesterday",
    read: false,
    action_href: "/financer/businesses",
    action_label: "View profile",
  },
  {
    id: "N-003",
    type: "request_received" as NotifType,
    title: "New financing request",
    body: "BIZ-5N2W has submitted a trade finance request for ₦18M.",
    time: "Yesterday",
    read: false,
    action_href: "/financer/requests",
    action_label: "Review request",
  },
  {
    id: "N-004",
    type: "settlement_confirmed" as NotifType,
    title: "Settlement confirmed",
    body: "Aduke Bakeries has confirmed full settlement of ₦12M working capital facility.",
    time: "Dec 12, 2024",
    read: true,
    action_href: "/financer/portfolio",
    action_label: "View record",
  },
  {
    id: "N-005",
    type: "offer_accepted" as NotifType,
    title: "Offer accepted",
    body: "Kemi Superstores has accepted your SME Working Capital Facility terms.",
    time: "Nov 28, 2024",
    read: true,
    action_href: "/financer/offers",
    action_label: "View offer",
  },
  {
    id: "N-006",
    type: "dispute_opened" as NotifType,
    title: "Dispute opened",
    body: "Delta Textiles has opened a dispute on financing record FIN-005. Platform review is underway.",
    time: "Nov 15, 2024",
    read: true,
    action_href: "/financer/portfolio",
    action_label: "View dispute",
  },
];

function typeConfig(t: NotifType) {
  return {
    request_received:     { icon: <Building2     size={14} />, color: "#0A2540", bg: "#F3F4F6" },
    consent_granted:      { icon: <ShieldCheck   size={14} />, color: "#10B981", bg: "#ECFDF5" },
    settlement_confirmed: { icon: <CheckCircle2  size={14} />, color: "#10B981", bg: "#ECFDF5" },
    offer_accepted:       { icon: <Tag           size={14} />, color: "#818CF8", bg: "#F3F0FF" },
    dispute_opened:       { icon: <AlertCircle   size={14} />, color: "#EF4444", bg: "#FEF2F2" },
  }[t];
}

export default function FinancerNotifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter(n => !n.read).length;

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Notifications
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {unread > 0
              ? <><span style={{ color: "#EF4444", fontWeight: 600 }}>{unread} unread</span> · {items.length} total</>
              : `${items.length} notifications`
            }
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            style={{
              fontSize: 13, fontWeight: 600, color: "#0A2540",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <CheckCircle2 size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
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
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: tc.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: tc.color,
              }}>
                {tc.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                  <p style={{
                    fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0A2540",
                  }}>
                    {n.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!n.read && (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", display: "block" }} />
                    )}
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{n.time}</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: n.action_href ? 8 : 0 }}>
                  {n.body}
                </p>
                {n.action_href && (
                  <a
                    href={n.action_href}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "#0A2540",
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {n.action_label} <ArrowUpRight size={11} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
