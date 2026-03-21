"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Inbox, Tag, TrendingUp,
  ChevronRight, ArrowUpRight, Activity,
  Banknote, Target, ShieldCheck, Users,
  Crown, Shield, UserCheck, User,
  LayoutDashboard, Clock, CheckCircle2,
  AlertCircle, BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/lib/mobile-nav-context";

/* ─────────────────────────────────────────────────────────
   ROLE SIMULATION
   In production, derive from Keycloak JWT claims:
     realm_roles: ["financer_owner" | "financer_admin" |
                   "financer_team_lead" | "financer_analyst"]
   team_lead_id comes from the OrgMember record for this user.
───────────────────────────────────────────────────────── */
type OrgRole = "owner" | "admin" | "team_lead" | "analyst";

// ← Change role here to preview each dashboard experience
const CURRENT_USER: {
  id: string; name: string; role: OrgRole; team_lead_id: string | null;
} = {
  id: "u3",
  name: "Chidi Eze",
  role: "team_lead",
  team_lead_id: null,
};

/* ─────────────────────────────────────────────────────────
   SHARED MEMBER ROSTER
───────────────────────────────────────────────────────── */
const TEAM_MEMBERS = [
  { id: "u1", name: "Tunde Adeyemi", role: "owner"     as OrgRole, team_lead_id: null,
    active_requests: 3,  active_portfolio: "₦65M",  pending_actions: 2 },
  { id: "u2", name: "Kemi Obi",      role: "admin"     as OrgRole, team_lead_id: null,
    active_requests: 4,  active_portfolio: "₦88M",  pending_actions: 1 },
  { id: "u3", name: "Chidi Eze",     role: "team_lead" as OrgRole, team_lead_id: null,
    active_requests: 2,  active_portfolio: "₦41M",  pending_actions: 0 },
  { id: "u4", name: "Amaka Nwosu",   role: "analyst"   as OrgRole, team_lead_id: "u3",
    active_requests: 1,  active_portfolio: "₦22M",  pending_actions: 1 },
  { id: "u5", name: "Bola Fashola",  role: "analyst"   as OrgRole, team_lead_id: "u3",
    active_requests: 2,  active_portfolio: "₦32M",  pending_actions: 0 },
];

/* ─────────────────────────────────────────────────────────
   ORG-LEVEL MOCK DATA
───────────────────────────────────────────────────────── */
const ORG_METRICS = [
  { label: "Total Deployed",   value: "₦248M", sub: "Across all members",         icon: <Banknote size={16} />, accent: true  },
  { label: "Active Members",   value: "5",     sub: "1 team lead · 2 analysts",   icon: <Users    size={16} />, accent: false },
  { label: "Pending Requests", value: "7",     sub: "Across all members",         icon: <Inbox    size={16} />, alert: true   },
  { label: "Org Match Score",  value: "87%",   sub: "Avg. across discovery feed", icon: <Target   size={16} />, accent: false },
];

const ORG_ACTIVITY = [
  { actor: "Kemi Obi",      action: "created offer",         target: "SME Working Capital",     time: "1h ago",    type: "offer"   as const },
  { actor: "Amaka Nwosu",   action: "reviewed request from", target: "BIZ-7X9A",                time: "2h ago",    type: "request" as const },
  { actor: "Chidi Eze",     action: "granted access to",     target: "BIZ-3K2M",                time: "Yesterday", type: "access"  as const },
  { actor: "Bola Fashola",  action: "confirmed settlement",  target: "Kemi Superstores (₦15M)", time: "Dec 28",    type: "settle"  as const },
  { actor: "Tunde Adeyemi", action: "invited",               target: "ngozi@stanbicibtc.com",   time: "Dec 27",    type: "invite"  as const },
];

/* ─────────────────────────────────────────────────────────
   TEAM-LEAD-LEVEL MOCK DATA
   In production: filter by team_lead_id === CURRENT_USER.id
───────────────────────────────────────────────────────── */
const TEAM_REQUESTS = [
  { member: "Amaka Nwosu",  business: "BIZ-4F9T", sector: "Retail",     type: "Working Capital", amount: "₦8M",  score: 761, risk: "Low Risk",    time: "1h ago",    status: "pending"  as const },
  { member: "Bola Fashola", business: "BIZ-2R8K", sector: "Logistics",  type: "Asset Financing", amount: "₦20M", score: 694, risk: "Medium Risk", time: "Yesterday", status: "pending"  as const },
  { member: "Bola Fashola", business: "BIZ-9P4L", sector: "Technology", type: "Revenue Advance", amount: "₦3M",  score: 799, risk: "Low Risk",    time: "Dec 28",    status: "reviewed" as const },
];

const TEAM_PORTFOLIO = [
  { member: "Amaka Nwosu",  business: "Aduke Bakeries", type: "Working Capital", amount: "₦12M", due: "Mar 2025", health: "on_track" as const },
  { member: "Amaka Nwosu",  business: "Kemi Superstores", type: "Invoice Fin.", amount: "₦10M", due: "Feb 2025", health: "watch"    as const },
  { member: "Bola Fashola", business: "Nonso Logistics",  type: "Asset Fin.",   amount: "₦32M", due: "Sep 2026", health: "on_track" as const },
];

const TEAM_ACTIVITY = [
  { actor: "Amaka Nwosu",  action: "submitted request for", target: "BIZ-4F9T",               time: "1h ago",    type: "request" as const },
  { actor: "Bola Fashola", action: "reviewed request from", target: "BIZ-9P4L",               time: "Yesterday", type: "request" as const },
  { actor: "Amaka Nwosu",  action: "granted access to",     target: "BIZ-2K7N",               time: "Dec 29",    type: "access"  as const },
  { actor: "Bola Fashola", action: "confirmed settlement",  target: "Tola Farms (₦8M)",       time: "Dec 27",    type: "settle"  as const },
];

/* ─────────────────────────────────────────────────────────
   PERSONAL MOCK DATA
───────────────────────────────────────────────────────── */
const PERSONAL_METRICS = [
  { label: "Active Deployments", value: "3",     sub: "My active records",         icon: <Banknote   size={16} />, accent: true   },
  { label: "Capital Deployed",   value: "₦41M",  sub: "+₦8M this month",           icon: <TrendingUp size={16} />, positive: true },
  { label: "Pending Requests",   value: "2",     sub: "Awaiting my review",        icon: <Inbox      size={16} />, alert: true    },
  { label: "Avg. Match Score",   value: "89%",   sub: "Last 15 discovery matches", icon: <Target     size={16} />, accent: false  },
];

const MY_REQUESTS = [
  { business: "BIZ-7X9A", sector: "Food & Beverage", type: "Working Capital Loan", amount: "₦10M", score: 742, risk: "Low Risk",    requested: "2 hours ago", status: "pending"  as const },
  { business: "BIZ-5N2W", sector: "Agriculture",     type: "Trade Finance",        amount: "₦18M", score: 681, risk: "Medium Risk", requested: "Yesterday",   status: "pending"  as const },
  { business: "BIZ-1R8T", sector: "Retail",          type: "Invoice Financing",    amount: "₦5M",  score: 799, risk: "Low Risk",    requested: "Dec 28",      status: "reviewed" as const },
];

const MY_PORTFOLIO = [
  { business: "Kemi Superstores", type: "Working Capital", amount: "₦15M", disbursed: "Oct 2024", due: "Apr 2025", health: "on_track" as const },
  { business: "Nonso Logistics",  type: "Asset Financing", amount: "₦42M", disbursed: "Sep 2024", due: "Sep 2026", health: "on_track" as const },
  { business: "Bright Pharma",    type: "Invoice Financing", amount: "₦8M", disbursed: "Dec 2024", due: "Feb 2025", health: "watch"    as const },
];

const DISCOVERY_MATCHES = [
  { id: "BIZ-7X9A", sector: "Retail",     revenue_band: "₦5M – ₦20M/mo",  data_months: 18, dims: [85,78,81,74,80,69], cap: "Working Capital", match: 94 },
  { id: "BIZ-3K2M", sector: "Logistics",  revenue_band: "₦10M – ₦50M/mo", data_months: 24, dims: [91,84,77,88,85,76], cap: "Asset Financing", match: 91 },
  { id: "BIZ-9P4L", sector: "Technology", revenue_band: "₦2M – ₦8M/mo",   data_months: 12, dims: [79,82,88,71,77,83], cap: "Revenue Advance",  match: 88 },
];

const DIM_COLORS = ["#10B981","#38BDF8","#818CF8","#F59E0B","#10B981","#EF4444"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<OrgRole, {
  icon: React.ReactNode;
  variant: "default"|"secondary"|"success"|"warning"|"outline";
  label: string;
}> = {
  owner:     { icon: <Crown     size={10} />, variant: "default",   label: "Principal" },
  admin:     { icon: <Shield    size={10} />, variant: "secondary", label: "Admin"     },
  team_lead: { icon: <UserCheck size={10} />, variant: "warning",   label: "Team Lead" },
  analyst:   { icon: <User      size={10} />, variant: "outline",   label: "Analyst"   },
};

function riskVariant(r: string) {
  return r === "Low Risk" ? "success" as const : r === "Medium Risk" ? "warning" as const : "destructive" as const;
}

function healthCfg(h: "on_track"|"watch"|"overdue") {
  return {
    on_track: { label: "On Track", variant: "success"     as const },
    watch:    { label: "Watch",    variant: "warning"     as const },
    overdue:  { label: "Overdue",  variant: "destructive" as const },
  }[h];
}

function activityIcon(t: "offer"|"request"|"access"|"settle"|"invite") {
  return {
    offer:   { icon: <Tag          size={13} />, color: "#818CF8", bg: "#F3F0FF"              },
    request: { icon: <Inbox        size={13} />, color: "#0A2540", bg: "#F3F4F6"              },
    access:  { icon: <ShieldCheck  size={13} />, color: "#10B981", bg: "#ECFDF5"              },
    settle:  { icon: <CheckCircle2 size={13} />, color: "#10B981", bg: "#ECFDF5"              },
    invite:  { icon: <Users        size={13} />, color: "#00A8CC", bg: "rgba(0,212,255,0.08)" },
  }[t];
}

/* ─────────────────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
        {title}
      </p>
      {action}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, accent = false, alert = false, positive = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  accent?: boolean; alert?: boolean; positive?: boolean;
}) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: accent ? "#0A2540" : alert ? "#FEF2F2" : "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent ? "#00D4FF" : alert ? "#EF4444" : "#6B7280",
        }}>
          {icon}
        </div>
        {alert && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "block", marginTop: 4 }} />}
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: positive ? "#10B981" : "#9CA3AF" }}>{sub}</p>
    </Card>
  );
}

function DimBars({ dims }: { dims: number[] }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 24 }}>
      {dims.map((v, i) => (
        <div key={i} style={{ width: 5, height: Math.max(3, (v / 100) * 20), borderRadius: 2, background: DIM_COLORS[i], opacity: 0.85 }} />
      ))}
    </div>
  );
}

function ActivityFeed({ items }: { items: typeof ORG_ACTIVITY }) {
  return (
    <div style={{ padding: "10px 0 8px" }}>
      {items.map((a, i) => {
        const ic = activityIcon(a.type);
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 22px",
            borderBottom: i < items.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", color: ic.color }}>
              {ic.icon}
            </div>
            <p style={{ flex: 1, fontSize: 13, color: "#374151", minWidth: 0 }}>
              <strong style={{ color: "#0A2540", fontWeight: 700 }}>{a.actor}</strong>{" "}
              {a.action}{" "}
              <strong style={{ color: "#0A2540", fontWeight: 600 }}>{a.target}</strong>
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{a.time}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DARK PORTFOLIO GLANCE CARD (reused across all views)
───────────────────────────────────────────────────────── */
function PortfolioGlance({ rows }: { rows: { label: string; value: string; color: string }[] }) {
  return (
    <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 22px" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", marginBottom: 4 }}>
        Portfolio at a glance
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 18 }}>December 2024</p>
      {rows.map(row => (
        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: "var(--font-display)" }}>{row.value}</span>
        </div>
      ))}
      <Link href="/financer/reports" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
        Full report <ChevronRight size={13} />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW 1 — ORGANISATION  (owner / admin)
   Shows: whole org at a glance, every member's workload,
   org-wide activity, pending actions tracker
══════════════════════════════════════════════════════════ */
function OrgDashboard() {
  const totalRequests  = TEAM_MEMBERS.reduce((s, m) => s + m.active_requests, 0);
  const pendingActions = TEAM_MEMBERS.reduce((s, m) => s + m.pending_actions, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Welcome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Stanbic IBTC — Organisation View
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="default" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Crown size={10} /> Principal
            </Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {TEAM_MEMBERS.length} members · {totalRequests} active requests · {pendingActions} pending actions
            </span>
          </div>
        </div>
        <Link href="/financer/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Users size={13} /> Manage Team
        </Link>
      </div>

      {/* Org metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {ORG_METRICS.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Main grid — fnc-db-main-grid collapses to 1fr on mobile via globals.css */}
      <div className="fnc-db-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Team table — desktop grid, collapses to stacked cards on mobile */}
          <Card>
            <CardHeader title="Team Overview" action={
              <Link href="/financer/settings" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Team settings <ChevronRight size={13} />
              </Link>
            } />

            {/* Mobile cards — hidden on desktop via CSS */}
            <div className="fnc-db-mobile-card" style={{ display: "none", padding: "10px 0 8px" }}>
              {TEAM_MEMBERS.map((m, i) => {
                const rc = ROLE_CONFIG[m.role];
                const isMe = m.id === CURRENT_USER.id;
                return (
                  <div key={m.id} style={{ padding: "12px 18px", borderBottom: i < TEAM_MEMBERS.length - 1 ? "1px solid #F3F4F6" : "none", background: isMe ? "rgba(0,212,255,0.02)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isMe ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isMe ? "#00D4FF" : "#0A2540" }}>
                          {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{m.name} {isMe && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>(you)</span>}</p>
                          <Badge variant={rc.variant} style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>{rc.icon} {rc.label}</Badge>
                        </div>
                      </div>
                      {m.pending_actions > 0 ? (
                        <span style={{ minWidth: 22, height: 22, borderRadius: 9999, background: "#FEF2F2", color: "#EF4444", fontSize: 10, fontWeight: 700, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center" }}>{m.pending_actions} pending</span>
                      ) : <CheckCircle2 size={14} style={{ color: "#D1D5DB" }} />}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Requests</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{m.active_requests}</p>
                      </div>
                      <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Portfolio</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{m.active_portfolio}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table — hidden on mobile via CSS */}
            <div className="fnc-db-desktop-only">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 80px 80px 90px", gap: 12, padding: "12px 22px 8px", borderBottom: "1px solid #F3F4F6", marginTop: 12 }}>
                {["Member", "Role", "Requests", "Portfolio", "Pending"].map(h => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                ))}
              </div>
              {TEAM_MEMBERS.map((m, i) => {
                const rc = ROLE_CONFIG[m.role];
                const lead = m.team_lead_id ? TEAM_MEMBERS.find(t => t.id === m.team_lead_id) : null;
                const isMe = m.id === CURRENT_USER.id;
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 80px 80px 90px", gap: 12, padding: "13px 22px", borderBottom: i < TEAM_MEMBERS.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", background: isMe ? "rgba(0,212,255,0.02)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: isMe ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: isMe ? "#00D4FF" : "#0A2540", flexShrink: 0 }}>
                        {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: isMe ? 700 : 600, color: "#0A2540" }}>
                          {m.name} {isMe && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>(you)</span>}
                        </p>
                        {lead && <p style={{ fontSize: 10, color: "#9CA3AF" }}>Reports to {lead.name}</p>}
                      </div>
                    </div>
                    <Badge variant={rc.variant} style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3, width: "fit-content" }}>{rc.icon} {rc.label}</Badge>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{m.active_requests}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{m.active_portfolio}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {m.pending_actions > 0 ? (
                        <span style={{ minWidth: 20, height: 20, borderRadius: 9999, background: "#FEF2F2", color: "#EF4444", fontSize: 10, fontWeight: 700, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center" }}>{m.pending_actions}</span>
                      ) : <CheckCircle2 size={14} style={{ color: "#D1D5DB" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Org activity */}
          <Card>
            <CardHeader title="Organisation Activity" />
            <ActivityFeed items={ORG_ACTIVITY} />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Pending actions by member */}
          <Card>
            <CardHeader title="Pending Actions" />
            <div style={{ padding: "10px 0 8px" }}>
              {TEAM_MEMBERS.filter(m => m.pending_actions > 0).map((m, i, arr) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0A2540", flexShrink: 0 }}>
                    {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.pending_actions} pending {m.pending_actions === 1 ? "action" : "actions"}</p>
                  </div>
                  <span style={{ minWidth: 22, height: 22, borderRadius: 9999, padding: "0 5px", background: "#FEF2F2", color: "#EF4444", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.pending_actions}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <PortfolioGlance rows={[
            { label: "Total disbursed",  value: "₦248M",    color: "#00D4FF" },
            { label: "Total repaid",     value: "₦102M",    color: "#10B981" },
            { label: "Under review",     value: "₦45M",     color: "#F59E0B" },
            { label: "Team deployments", value: "12 deals", color: "#818CF8" },
          ]} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW 2 — TEAM LEAD
   Shows: own team's requests + portfolio, team member
   workloads, team activity, can't see outside their team
══════════════════════════════════════════════════════════ */
function TeamLeadDashboard() {
  // Members this lead is responsible for
  const myTeam = TEAM_MEMBERS.filter(m => m.team_lead_id === CURRENT_USER.id);
  const teamRequests  = TEAM_REQUESTS.length;
  const teamPending   = TEAM_REQUESTS.filter(r => r.status === "pending").length;
  const teamPortfolio = TEAM_PORTFOLIO.reduce((_acc, _r) => _acc, 0); // placeholder

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Welcome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Good morning, {CURRENT_USER.name.split(" ")[0]}.
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <UserCheck size={10} /> Team Lead
            </Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {myTeam.length} direct reports · {teamRequests} team requests · {teamPending} pending review
            </span>
          </div>
        </div>
        <Link href="/financer/businesses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Building2 size={13} /> Browse Businesses
        </Link>
      </div>

      {/* Team metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {[
          { label: "Team Requests",   value: String(teamRequests),  sub: `${teamPending} pending review`,    icon: <Inbox      size={16} />, alert: teamPending > 0  },
          { label: "Team Portfolio",  value: "₦54M",               sub: "Across my team",                   icon: <Banknote   size={16} />, accent: true           },
          { label: "Direct Reports",  value: String(myTeam.length), sub: myTeam.map(m => m.name.split(" ")[0]).join(" · "), icon: <Users size={16} />  },
          { label: "Team Match Score",value: "88%",                 sub: "Avg. across team's feed",          icon: <Target     size={16} />                         },
        ].map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Main grid — fnc-db-main-grid collapses to 1fr on mobile via globals.css */}
      <div className="fnc-db-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* My team's requests */}
          <Card>
            <CardHeader title="Team Financing Requests" action={
              <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                View all <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {TEAM_REQUESTS.map((req, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: i < TEAM_REQUESTS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0A2540" }}>
                      {req.member.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>{req.member}</p>
                        <span style={{ fontSize: 9, color: "#D1D5DB" }}>→</span>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{req.business}</p>
                        <Badge variant={riskVariant(req.risk)} style={{ fontSize: 9, padding: "1px 6px" }}>{req.risk}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{req.sector} · {req.type} · {req.time}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 46 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{req.score}</span>
                      <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 6 }}>{req.amount}</span>
                    </div>
                    {req.status === "pending" ? (
                      <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        Review <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <Badge variant="secondary">Reviewed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My team's portfolio */}
          <Card>
            <CardHeader title="Team Portfolio" action={
              <Link href="/financer/portfolio" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Full portfolio <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {/* Mobile cards */}
              <div className="fnc-db-mobile-card" style={{ display: "none" }}>
                {TEAM_PORTFOLIO.map((item, i) => {
                  const hc = healthCfg(item.health);
                  return (
                    <div key={i} style={{ padding: "12px 18px", borderBottom: i < TEAM_PORTFOLIO.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{item.business}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.member.split(" ")[0]} · {item.type}</p>
                        </div>
                        <Badge variant={hc.variant} style={{ fontSize: 10 }}>{hc.label}</Badge>
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Amount: <strong style={{ color: "#0A2540" }}>{item.amount}</strong></span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Due: <strong style={{ color: "#0A2540" }}>{item.due}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop table */}
              <div className="fnc-db-desktop-only">
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px 80px", gap: 10, padding: "4px 22px 10px", borderBottom: "1px solid #F3F4F6" }}>
                  {["Member", "Business", "Type", "Amount", "Due", "Health"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {TEAM_PORTFOLIO.map((item, i) => {
                  const hc = healthCfg(item.health);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px 80px", gap: 10, padding: "12px 22px", borderBottom: i < TEAM_PORTFOLIO.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                      <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{item.member.split(" ")[0]}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{item.business}</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{item.type}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{item.amount}</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{item.due}</p>
                      <Badge variant={hc.variant} style={{ width: "fit-content", fontSize: 10 }}>{hc.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Direct reports workload */}
          <Card>
            <CardHeader title="My Team" action={
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{myTeam.length} members</span>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {myTeam.map((m, i) => (
                <div key={m.id} style={{ padding: "12px 22px", borderBottom: i < myTeam.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0A2540", flexShrink: 0 }}>
                      {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{m.name}</p>
                      <Badge variant="outline" style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <User size={9} /> Analyst
                      </Badge>
                    </div>
                    {m.pending_actions > 0 && (
                      <span style={{ minWidth: 20, height: 20, borderRadius: 9999, background: "#FEF2F2", color: "#EF4444", fontSize: 10, fontWeight: 700, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {m.pending_actions}
                      </span>
                    )}
                  </div>
                  {/* Mini workload bars */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Requests",  value: m.active_requests,  max: 6 },
                      { label: "Portfolio", value: parseInt(m.active_portfolio.replace(/[₦M]/g, "")) || 0, max: 100 },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{stat.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>
                            {stat.label === "Portfolio" ? m.active_portfolio : stat.value}
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (stat.value / stat.max) * 100)}%`, background: "#0A2540", borderRadius: 9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Team activity */}
          <Card>
            <CardHeader title="Team Activity" />
            <ActivityFeed items={TEAM_ACTIVITY} />
          </Card>

          <PortfolioGlance rows={[
            { label: "Team disbursed",  value: "₦54M",    color: "#00D4FF" },
            { label: "Team repaid",     value: "₦22M",    color: "#10B981" },
            { label: "In review",       value: "₦12M",    color: "#F59E0B" },
            { label: "Team deals",      value: "4 active", color: "#818CF8" },
          ]} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW 3 — PERSONAL  (all roles when on "My Work",
                        analysts always land here)
   Shows: own requests, own portfolio, discovery matches
══════════════════════════════════════════════════════════ */
function PersonalDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Good morning, {CURRENT_USER.name.split(" ")[0]}.
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="success"><Activity size={10} /> Active</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>2 pending requests · 3 active deployments</span>
          </div>
        </div>
        <Link href="/financer/businesses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Building2 size={13} /> Browse Businesses
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {PERSONAL_METRICS.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      <div className="fnc-db-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* My requests */}
          <Card>
            <CardHeader title="My Financing Requests" action={
              <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                View all <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {MY_REQUESTS.map((req, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: i < MY_REQUESTS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540" }}>
                      {req.business.slice(0, 4)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{req.business}</p>
                        <Badge variant={riskVariant(req.risk)} style={{ fontSize: 9, padding: "1px 6px" }}>{req.risk}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{req.sector} · {req.type} · {req.requested}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 46 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{req.score}</span>
                      <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 6 }}>{req.amount}</span>
                    </div>
                    {req.status === "pending" ? (
                      <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        Review <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <Badge variant="secondary">Reviewed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My portfolio */}
          <Card>
            <CardHeader title="My Active Portfolio" action={
              <Link href="/financer/portfolio" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Full portfolio <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {/* Mobile cards */}
              <div className="fnc-db-mobile-card" style={{ display: "none" }}>
                {MY_PORTFOLIO.map((item, i) => {
                  const hc = healthCfg(item.health);
                  return (
                    <div key={i} style={{ padding: "12px 18px", borderBottom: i < MY_PORTFOLIO.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{item.business}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.type}</p>
                        </div>
                        <Badge variant={hc.variant} style={{ fontSize: 10 }}>{hc.label}</Badge>
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Amount: <strong style={{ color: "#0A2540" }}>{item.amount}</strong></span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Due: <strong style={{ color: "#0A2540" }}>{item.due}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop table */}
              <div className="fnc-db-desktop-only">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px 90px 80px", padding: "4px 22px 10px", borderBottom: "1px solid #F3F4F6" }}>
                  {["Business", "Type", "Amount", "Due", "Health"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {MY_PORTFOLIO.map((item, i) => {
                  const hc = healthCfg(item.health);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px 90px 80px", padding: "12px 22px", borderBottom: i < MY_PORTFOLIO.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{item.business}</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{item.type}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{item.amount}</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{item.due}</p>
                      <Badge variant={hc.variant} style={{ width: "fit-content", fontSize: 10 }}>{hc.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Discovery matches */}
          <Card>
            <CardHeader title="New Matches" action={
              <Link href="/financer/businesses" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Browse <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 4px" }}>
              {DISCOVERY_MATCHES.map((m, i) => (
                <div key={i} style={{ padding: "12px 22px", borderBottom: i < DISCOVERY_MATCHES.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{m.id}</p>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Anonymous</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.sector} · {m.cap} · {m.data_months}mo data</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: m.match >= 90 ? "#10B981" : "#F59E0B", fontFamily: "var(--font-display)" }}>{m.match}%</span>
                  </div>
                  <div className="fnc-db-match-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <DimBars dims={m.dims} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.revenue_band}</p>
                    </div>
                    <Link href="/financer/businesses" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      Request access <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={11} style={{ color: "#10B981" }} /> Business identity hidden until consent is granted.
              </p>
            </div>
          </Card>

          <PortfolioGlance rows={[
            { label: "My disbursed",   value: "₦41M",    color: "#00D4FF" },
            { label: "My repaid",      value: "₦18M",    color: "#10B981" },
            { label: "In review",      value: "₦12M",    color: "#F59E0B" },
            { label: "Settled (Dec)",  value: "1 deal",  color: "#818CF8" },
          ]} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT PAGE — role-aware view switcher
══════════════════════════════════════════════════════════ */
export default function FinancerDashboard() {
  const role = CURRENT_USER.role;

  // Determine which views this role can access and what the default is
  type ViewKey = "org" | "team" | "personal";

  const viewOptions: { key: ViewKey; label: string; icon: React.ReactNode }[] = [];

  if (role === "owner" || role === "admin") {
    viewOptions.push(
      { key: "org",      label: "Organisation", icon: <Building2       size={13} /> },
      { key: "personal", label: "My Work",       icon: <LayoutDashboard size={13} /> },
    );
  } else if (role === "team_lead") {
    viewOptions.push(
      { key: "team",     label: "My Team",  icon: <Users           size={13} /> },
      { key: "personal", label: "My Work",  icon: <LayoutDashboard size={13} /> },
    );
  }
  // analysts get no toggle — viewOptions stays empty

  const defaultView: ViewKey = role === "owner" || role === "admin"
    ? "org"
    : role === "team_lead"
    ? "team"
    : "personal";

  const [view, setView] = useState<ViewKey>(defaultView);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* View switcher — only shown when the role has multiple views */}
      {viewOptions.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px", background: "#F3F4F6",
          borderRadius: 10, alignSelf: "flex-start",
        }}>
          {viewOptions.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 7, border: "none",
                background: view === v.key ? "white" : "transparent",
                boxShadow: view === v.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                color: view === v.key ? "#0A2540" : "#6B7280",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Render the correct view */}
      {view === "org"      && <OrgDashboard />}
      {view === "team"     && <TeamLeadDashboard />}
      {view === "personal" && <PersonalDashboard />}
    </div>
  );
}
