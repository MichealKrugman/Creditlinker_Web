"use client";

import { useState } from "react";
import {
  Target, Bell, BellOff, ArrowUpRight,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* Business subscriptions — these are businesses the financer
   has access to and is monitoring for score/profile changes.
   Replace with: POST /institution/alert/subscribe
                 POST /institution/alert/unsubscribe              */

const SUBSCRIPTIONS = [
  {
    fid: "fid_1r8t",
    business_id: "BIZ-1R8T",
    display_name: "Kemi Superstores",
    sector: "Retail",
    last_score: 811,
    prev_score: 798,
    subscribed: true,
    last_alert: "Score improved by 13 pts",
    alerted_at: "3 days ago",
    trend: "up" as const,
  },
  {
    fid: "fid_3k2m",
    business_id: "BIZ-3K2M",
    display_name: "Nonso Logistics",
    sector: "Logistics",
    last_score: 762,
    prev_score: 769,
    subscribed: true,
    last_alert: "Cashflow Predictability dropped 4 pts",
    alerted_at: "1 week ago",
    trend: "down" as const,
  },
  {
    fid: "fid_9p4l",
    business_id: "BIZ-9P4L",
    display_name: "Bright Pharma",
    sector: "Healthcare",
    last_score: 744,
    prev_score: 744,
    subscribed: true,
    last_alert: "No change in last pipeline run",
    alerted_at: "2 weeks ago",
    trend: "flat" as const,
  },
];

const ALERT_FEED = [
  {
    id: "A-001",
    business: "Kemi Superstores",
    event: "Score improved",
    detail: "Overall score moved from 798 → 811 (+13 pts). Revenue Stability is a standout.",
    at: "3 days ago",
    severity: "positive" as const,
  },
  {
    id: "A-002",
    business: "Nonso Logistics",
    event: "Dimension change",
    detail: "Cashflow Predictability dropped from 84 → 80. Possible working capital pressure.",
    at: "1 week ago",
    severity: "warning" as const,
  },
  {
    id: "A-003",
    business: "Kemi Superstores",
    event: "New pipeline run",
    detail: "Financial identity refreshed with 2 new months of bank data.",
    at: "2 weeks ago",
    severity: "info" as const,
  },
];

function trendIcon(t: "up" | "down" | "flat") {
  if (t === "up")   return <TrendingUp   size={13} style={{ color: "#10B981" }} />;
  if (t === "down") return <TrendingDown size={13} style={{ color: "#EF4444" }} />;
  return                   <Minus        size={13} style={{ color: "#9CA3AF" }} />;
}

function severityConfig(s: "positive" | "warning" | "info") {
  return {
    positive: { bg: "#ECFDF5", border: "rgba(16,185,129,0.15)", dot: "#10B981" },
    warning:  { bg: "#FFFBEB", border: "rgba(245,158,11,0.15)", dot: "#F59E0B" },
    info:     { bg: "#F9FAFB", border: "#E5E7EB",               dot: "#9CA3AF" },
  }[s];
}

export default function FinancerAlerts() {
  const [subs, setSubs] = useState(SUBSCRIPTIONS);

  const toggle = (fid: string) => {
    setSubs(prev => prev.map(s => s.fid === fid ? { ...s, subscribed: !s.subscribed } : s));
    // TODO: POST /institution/alert/subscribe or unsubscribe
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Alerts
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Get notified when a business you're monitoring changes their financial profile.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* Left: Alert feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
            Recent Alerts
          </p>
          {ALERT_FEED.map(alert => {
            const sc = severityConfig(alert.severity);
            return (
              <div key={alert.id} style={{
                background: sc.bg, border: `1px solid ${sc.border}`,
                borderRadius: 12, padding: "16px 18px",
                display: "flex", gap: 14,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: sc.dot, flexShrink: 0, marginTop: 5,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>
                      {alert.business} — {alert.event}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{alert.at}</p>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{alert.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Subscriptions */}
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 14 }}>
            Monitored Businesses
          </p>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            {subs.map((s, i) => (
              <div key={s.fid} style={{
                padding: "14px 18px",
                borderBottom: i < subs.length - 1 ? "1px solid #F3F4F6" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{s.display_name}</p>
                    {trendIcon(s.trend)}
                  </div>
                  <button
                    onClick={() => toggle(s.fid)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      border: `1px solid ${s.subscribed ? "#E5E7EB" : "#0A2540"}`,
                      background: s.subscribed ? "white" : "#0A2540",
                      color: s.subscribed ? "#6B7280" : "white",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {s.subscribed ? <><BellOff size={10} /> Mute</> : <><Bell size={10} /> Subscribe</>}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>
                  {s.sector} · Score: <span style={{
                    fontWeight: 700,
                    color: s.trend === "up" ? "#10B981" : s.trend === "down" ? "#EF4444" : "#6B7280",
                  }}>
                    {s.last_score}
                  </span>
                  {s.trend !== "flat" && (
                    <span style={{ color: s.trend === "up" ? "#10B981" : "#EF4444" }}>
                      {" "}({s.trend === "up" ? "+" : ""}{s.last_score - s.prev_score})
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{s.alerted_at} · {s.last_alert}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
