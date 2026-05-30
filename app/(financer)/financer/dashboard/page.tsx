"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2, Inbox, TrendingUp,
  ChevronRight, ArrowUpRight, Activity,
  Banknote, Target, ShieldCheck, Users,
  Crown, Shield, UserCheck, User,
  LayoutDashboard, CheckCircle2,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionContext } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type OrgRole = "owner" | "admin" | "team_lead" | "analyst";

type MemberRow = {
  id: string;
  user_id: string;
  role: OrgRole;
  team_lead_id: string | null;
  full_name: string;
  email: string;
  active_requests: number;
  active_portfolio: number;
  pending_actions: number;
};

type FinancingRecord = {
  financing_id: string;
  business_id: string;
  capital_category: string;
  terms: { amount?: number; financing_amount?: number; currency?: string } | null;
  status: string;
  granted_at: string | null;
  settled_at: string | null;
  created_by_member_id: string | null;
};

type DiscoveryMatch = {
  match_id: string;
  anonymized_id: string;
  capital_category: string;
  match_score: number;
  matched_at: string;
  status: string;
  access_requested_at: string | null;
  created_by_member_id: string | null;
};

type ActivityLog = {
  id: string;
  member_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function formatNGN(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `₦${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000)         return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toLocaleString()}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getAmount(terms: FinancingRecord["terms"]): number {
  return terms?.financing_amount ?? terms?.amount ?? 0;
}

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



/* ─────────────────────────────────────────────────────────
   DARK PORTFOLIO GLANCE CARD (reused across all views)
───────────────────────────────────────────────────────── */
function PortfolioGlance({ rows }: { rows: { label: string; value: string; color: string }[] }) {
  return (
    <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 22px" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", marginBottom: 4 }}>
        Portfolio at a glance
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 18 }}>{new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
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

/* ─────────────────────────────────────────────────────────
   ACTIVITY FEED (shared across org + team views)
───────────────────────────────────────────────────────── */
function ActivityFeed({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center" as const }}>
        <Activity size={22} style={{ color: "#E5E7EB", marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No activity yet</p>
        <p style={{ fontSize: 12, color: "#9CA3AF" }}>Actions by team members will appear here.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: "10px 0 8px" }}>
      {items.map((item, i) => (
        <div key={item.id} style={{ display: "flex", gap: 12, padding: "10px 22px", borderBottom: i < items.length - 1 ? "1px solid #F3F4F6" : "none" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E5E7EB", flexShrink: 0, marginTop: 5 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 2 }}>
              <span style={{ fontWeight: 600, color: "#0A2540" }}>
                {item.action.replace(/_/g, " ")}
              </span>
              {item.target_type && (
                <span style={{ color: "#9CA3AF" }}> · {item.target_type.replace(/_/g, " ")}</span>
              )}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(item.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW 1 — ORGANISATION  (owner / admin)
   Shows: whole org at a glance, every member's workload,
   org-wide activity, pending actions tracker
══════════════════════════════════════════════════════════ */
function OrgDashboard({
  institutionName = "",
  members = [],
  allRecords = [],
  allMatches = [],
  activityLogs = [],
  loadingData = false,
}: {
  institutionName?: string;
  members?: MemberRow[];
  allRecords?: FinancingRecord[];
  allMatches?: DiscoveryMatch[];
  activityLogs?: ActivityLog[];
  loadingData?: boolean;
}) {
  const totalDeployed  = allRecords.filter(r => r.status === "active").reduce((s, r) => s + getAmount(r.terms), 0);
  const pendingRequests = allMatches.filter(m => m.status === "access_requested").length;
  const avgMatchScore  = allMatches.length
    ? Math.round(allMatches.reduce((s, m) => s + m.match_score, 0) / allMatches.length * 100)
    : 0;
  const pendingActions = members.reduce((s, m) => s + m.pending_actions, 0);

  const orgMetrics = [
    { label: "Total Deployed",   value: loadingData ? "…" : (totalDeployed ? formatNGN(totalDeployed) : "₦0"),           sub: "Across all active deals",      icon: <Banknote size={16} />, accent: true                },
    { label: "Active Members",   value: loadingData ? "…" : String(members.length),                                       sub: `${members.filter(m => m.role === "team_lead").length} lead · ${members.filter(m => m.role === "analyst").length} analysts`, icon: <Users size={16} /> },
    { label: "Pending Requests", value: loadingData ? "…" : String(pendingRequests),                                      sub: "Across institution",           icon: <Inbox  size={16} />, alert: pendingRequests > 0  },
    { label: "Avg Match Score",  value: loadingData ? "…" : (avgMatchScore ? `${avgMatchScore}%` : "—"),                 sub: "Across discovery feed",        icon: <Target size={16} />                               },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {institutionName || "Organisation View"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="default" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Crown size={10} /> Principal
            </Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {loadingData ? "Loading\u2026" : `${members.length} members \u00b7 ${pendingRequests} pending requests \u00b7 ${pendingActions} pending actions`}
            </span>
          </div>
        </div>
        <Link href="/financer/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Users size={13} /> Manage Team
        </Link>
      </div>

      {/* Org metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {orgMetrics.map(m => <MetricCard key={m.label} {...m} />)}
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
              {members.map((m, i) => {
                const rc = ROLE_CONFIG[m.role];
                return (
                  <div key={m.id} style={{ padding: "12px 18px", borderBottom: i < members.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0A2540" }}>
                          {m.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{m.full_name}</p>
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
              {members.map((m, i) => {
                const rc = ROLE_CONFIG[m.role];
                const lead = m.team_lead_id ? members.find(t => t.id === m.team_lead_id) : null;
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 80px 80px 90px", gap: 12, padding: "13px 22px", borderBottom: i < members.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0A2540", flexShrink: 0 }}>
                        {m.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>
                          {m.full_name}
                        </p>
                        {lead && <p style={{ fontSize: 10, color: "#9CA3AF" }}>Reports to {lead.full_name}</p>}
                      </div>
                    </div>
                    <Badge variant={rc.variant} style={{ fontSize: 9, display: "inline-flex", alignItems: "center", gap: 3, width: "fit-content" }}>{rc.icon} {rc.label}</Badge>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{m.active_requests}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{formatNGN(m.active_portfolio)}</p>
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
            <ActivityFeed items={activityLogs} />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Pending actions by member */}
          <Card>
            <CardHeader title="Pending Actions" />
            <div style={{ padding: "10px 0 8px" }}>
              {members.filter(m => m.pending_actions > 0).map((m, i, arr) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0A2540", flexShrink: 0 }}>
                    {m.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{m.full_name}</p>
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
            { label: "Total disbursed",  value: formatNGN(totalDeployed),                                                                    color: "#00D4FF" },
            { label: "Active records",   value: String(allRecords.filter(r => r.status === "active").length) + " deals",                    color: "#818CF8" },
            { label: "Pending requests", value: String(pendingRequests),                                                                     color: "#F59E0B" },
            { label: "Avg match score",  value: avgMatchScore ? `${avgMatchScore}%` : "—",                                                  color: "#10B981" },
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
function TeamLeadDashboard({
  currentMember,
  myTeam = [],
  teamRecords = [],
  teamRequests = [],
  teamActivity = [],
  allMembers = [],
  loadingData = false,
}: {
  currentMember: MemberRow;
  myTeam?: MemberRow[];
  teamRecords?: FinancingRecord[];
  teamRequests?: DiscoveryMatch[];
  teamActivity?: ActivityLog[];
  allMembers?: MemberRow[];
  loadingData?: boolean;
}) {
  const teamPending      = teamRequests.filter(r => r.status === "access_requested").length;
  const teamDeployed     = teamRecords.filter(r => r.status === "active").reduce((s, r) => s + getAmount(r.terms), 0);
  const avgTeamScore     = teamRequests.length
    ? Math.round(teamRequests.reduce((s, r) => s + r.match_score, 0) / teamRequests.length * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Welcome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Good morning, {currentMember.full_name.split(" ")[0]}.
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <UserCheck size={10} /> Team Lead
            </Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {myTeam.length} direct reports · {teamRequests.length} team requests · {teamPending} pending review
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
          { label: "Team Requests",    value: loadingData ? "…" : String(teamRequests.length), sub: `${teamPending} pending review`,                          icon: <Inbox    size={16} />, alert: teamPending > 0 },
          { label: "Team Portfolio",   value: loadingData ? "…" : formatNGN(teamDeployed),     sub: "Across my team",                                          icon: <Banknote size={16} />, accent: true           },
          { label: "Direct Reports",   value: String(myTeam.length),                            sub: myTeam.map(m => m.full_name.split(" ")[0]).join(" · ") || "No reports", icon: <Users size={16} />  },
          { label: "Team Match Score", value: avgTeamScore ? `${avgTeamScore}%` : "—",         sub: "Avg. across team’s feed",                                  icon: <Target   size={16} />                         },
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
              {teamRequests.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" as const }}>
                  <Inbox size={26} style={{ color: "#D1D5DB", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No team requests</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Access requests raised by your team will appear here.</p>
                </div>
              ) : teamRequests.map((req, i) => {
                const pct = Math.round(req.match_score * 100);
                const memberName = allMembers.find(m => m.id === req.created_by_member_id)?.full_name ?? "Unknown";
                const shortId = `BIZ-${req.anonymized_id.slice(0, 6).toUpperCase()}`;
                const requestedDate = req.access_requested_at
                  ? new Date(req.access_requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "—";
                return (
                  <div key={req.match_id} style={{ padding: "12px 16px", borderBottom: i < teamRequests.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0A2540" }}>
                        {memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>{memberName}</p>
                          <span style={{ fontSize: 9, color: "#D1D5DB" }}>→</span>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{shortId}</p>
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{req.capital_category.replace(/_/g, " ")} · Requested {requestedDate}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", fontFamily: "var(--font-display)", flexShrink: 0 }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 46 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 80, height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", borderRadius: 9999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>match score</span>
                      </div>
                      <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        View <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
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
                {teamRecords.filter(r => r.status === "active").map((item, i, arr) => (
                  <div key={item.financing_id} style={{ padding: "12px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>BUS-{item.business_id.slice(0, 6).toUpperCase()}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{allMembers.find(m => m.id === item.created_by_member_id)?.full_name?.split(" ")[0] ?? "—"} · {item.capital_category.replace(/_/g, " ")}</p>
                      </div>
                      <Badge variant="success" style={{ fontSize: 10 }}>Active</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Amount: <strong style={{ color: "#0A2540" }}>{item.terms?.amount ? formatNGN(item.terms.amount) : "—"}</strong></span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Since: <strong style={{ color: "#0A2540" }}>{item.granted_at ? new Date(item.granted_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="fnc-db-desktop-only">
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px 80px", gap: 10, padding: "4px 22px 10px", borderBottom: "1px solid #F3F4F6" }}>
                  {["Member", "Business", "Type", "Amount", "Since", "Status"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {teamRecords.filter(r => r.status === "active").map((item, i, arr) => (
                  <div key={item.financing_id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px 80px", gap: 10, padding: "12px 22px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                    <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{allMembers.find(m => m.id === item.created_by_member_id)?.full_name?.split(" ")[0] ?? "—"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", fontFamily: "monospace" }}>BUS-{item.business_id.slice(0, 8).toUpperCase()}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>{item.capital_category.replace(/_/g, " ")}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{item.terms?.amount ? formatNGN(item.terms.amount) : "—"}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{item.granted_at ? new Date(item.granted_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</p>
                    <Badge variant="success" style={{ width: "fit-content", fontSize: 10 }}>Active</Badge>
                  </div>
                ))}
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
                      {m.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{m.full_name}</p>
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
                      { label: "Portfolio", value: m.active_portfolio,  max: 50_000_000 },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{stat.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>
                            {stat.label === "Portfolio" ? formatNGN(m.active_portfolio) : stat.value}
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
            <ActivityFeed items={teamActivity} />
          </Card>

          <PortfolioGlance rows={[
            { label: "Team deployed",    value: formatNGN(teamDeployed),                                                                   color: "#00D4FF" },
            { label: "Active deals",     value: String(teamRecords.filter(r => r.status === "active").length) + " deals",                color: "#818CF8" },
            { label: "Pending requests", value: String(teamPending),                                                                       color: "#F59E0B" },
            { label: "Avg match score",  value: avgTeamScore ? `${avgTeamScore}%` : "—",                                                color: "#10B981" },
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
function PersonalDashboard({
  institutionName = "",
  portfolio = [],
  matches = [],
  myRequests = [],
  consentCount = 0,
  loadingData = false,
}: {
  institutionName?: string;
  portfolio?: FinancingRecord[];
  matches?: DiscoveryMatch[];
  myRequests?: DiscoveryMatch[];
  consentCount?: number;
  loadingData?: boolean;
}) {
  // Derived real metrics
  const activePortfolio  = portfolio.filter(r => r.status === "active");
  const settledPortfolio = portfolio.filter(r => r.status === "settled");
  const totalDeployed    = activePortfolio.reduce((s, r) => s + getAmount(r.terms), 0);
  const totalSettled     = settledPortfolio.reduce((s, r) => s + getAmount(r.terms), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {institutionName || "My Dashboard"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="success"><Activity size={10} /> Active</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {loadingData ? "Loading…" : `${activePortfolio.length} active deployment${activePortfolio.length !== 1 ? "s" : ""} · ${matches.length} new match${matches.length !== 1 ? "es" : ""}`}
            </span>
          </div>
        </div>
        <Link href="/financer/businesses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Building2 size={13} /> Browse Businesses
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {[
          { label: "Active Deployments",    value: loadingData ? "…" : String(activePortfolio.length),        sub: "Currently deployed",          icon: <Banknote   size={16} />, accent: true                          },
          { label: "Capital Deployed",       value: loadingData ? "…" : (totalDeployed ? formatNGN(totalDeployed) : "₦0"), sub: totalSettled ? `${formatNGN(totalSettled)} settled` : "No settled deals yet", icon: <TrendingUp size={16} />, positive: totalDeployed > 0  },
          { label: "Consented Businesses",   value: loadingData ? "…" : String(consentCount),                 sub: "Active data access grants",   icon: <ShieldCheck size={16} />                                       },
          { label: "Discovery Matches",      value: loadingData ? "…" : String(matches.length),               sub: "Pending your review",         icon: <Target     size={16} />, accent: matches.length > 0            },
        ].map(m => <MetricCard key={m.label} {...m} />)}
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
              {myRequests.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" as const }}>
                  <Inbox size={26} style={{ color: "#D1D5DB", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No active requests</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Financing requests you raise will appear here.</p>
                </div>
              ) : myRequests.map((req, i) => {
                const pct = Math.round(req.match_score * 100);
                const shortId = `BIZ-${req.anonymized_id.slice(0, 6).toUpperCase()}`;
                const requestedDate = req.access_requested_at
                  ? new Date(req.access_requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "—";
                return (
                  <div key={req.match_id} style={{ padding: "12px 16px", borderBottom: i < myRequests.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540" }}>
                        {shortId.slice(4, 8)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{shortId}</p>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Anonymous</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {req.capital_category.replace(/_/g, " ")} · Requested {requestedDate}
                        </p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", fontFamily: "var(--font-display)", flexShrink: 0 }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 46 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 80, height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", borderRadius: 9999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>match score</span>
                      </div>
                      <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "#0A2540", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        View <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* My portfolio — real data from financing_records */}
          <Card>
            <CardHeader title="My Active Portfolio" action={
              <Link href="/financer/portfolio" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Full portfolio <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 8px" }}>
              {loadingData ? (
                <div style={{ padding: "32px", textAlign: "center" as const, color: "#9CA3AF", fontSize: 13 }}>Loading portfolio…</div>
              ) : activePortfolio.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" as const }}>
                  <Banknote size={26} style={{ color: "#D1D5DB", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No active deployments</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Financing records will appear here once deals are active.</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="fnc-db-mobile-card" style={{ display: "none" }}>
                    {activePortfolio.map((item, i) => (
                      <div key={item.financing_id} style={{ padding: "12px 18px", borderBottom: i < activePortfolio.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>BUS-{item.business_id.slice(0, 6).toUpperCase()}</p>
                            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.capital_category.replace(/_/g, " ")}</p>
                          </div>
                          <Badge variant="success" style={{ fontSize: 10 }}>Active</Badge>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>Amount: <strong style={{ color: "#0A2540" }}>{item.terms?.amount ? formatNGN(item.terms.amount) : "—"}</strong></span>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>Since: <strong style={{ color: "#0A2540" }}>{item.granted_at ? new Date(item.granted_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="fnc-db-desktop-only">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 100px 80px", padding: "4px 22px 10px", borderBottom: "1px solid #F3F4F6" }}>
                      {["Business", "Capital Type", "Amount", "Since", "Status"].map(h => (
                        <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                      ))}
                    </div>
                    {activePortfolio.map((item, i) => (
                      <div key={item.financing_id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 100px 80px", padding: "12px 22px", borderBottom: i < activePortfolio.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>BUS-{item.business_id.slice(0, 8).toUpperCase()}</p>
                        <p style={{ fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>{item.capital_category.replace(/_/g, " ")}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{item.terms?.amount ? formatNGN(item.terms.amount) : "—"}</p>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>{item.granted_at ? new Date(item.granted_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</p>
                        <Badge variant="success" style={{ width: "fit-content", fontSize: 10 }}>Active</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Discovery matches — real data from discovery_matches */}
          <Card>
            <CardHeader title="New Matches" action={
              <Link href="/financer/businesses" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                Browse <ChevronRight size={13} />
              </Link>
            } />
            <div style={{ padding: "10px 0 4px" }}>
              {loadingData ? (
                <div style={{ padding: "32px", textAlign: "center" as const, color: "#9CA3AF", fontSize: 13 }}>Loading matches…</div>
              ) : matches.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" as const }}>
                  <Target size={26} style={{ color: "#D1D5DB", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No matches yet</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Set your matching criteria in Settings to start receiving discoveries.</p>
                </div>
              ) : (
                matches.map((m, i) => {
                  const pct = Math.round(m.match_score * 100);
                  const shortId = `BIZ-${m.anonymized_id.slice(0, 6).toUpperCase()}`;
                  const matchedDate = new Date(m.matched_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                  return (
                    <div key={m.match_id} style={{ padding: "12px 22px", borderBottom: i < matches.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{shortId}</p>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Anonymous</span>
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.capital_category.replace(/_/g, " ")} · Matched {matchedDate}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", fontFamily: "var(--font-display)" }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {/* Score bar */}
                          <div style={{ width: 80, height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", borderRadius: 9999 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>match score</span>
                        </div>
                        <Link href="/financer/businesses" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          Request access <ArrowUpRight size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={11} style={{ color: "#10B981" }} /> Business identity hidden until consent is granted.
              </p>
            </div>
          </Card>

          <PortfolioGlance rows={[
            { label: "Total deployed",   value: totalDeployed  ? formatNGN(totalDeployed)  : "₦0",                              color: "#00D4FF" },
            { label: "Total settled",    value: totalSettled   ? formatNGN(totalSettled)   : "₦0",                              color: "#10B981" },
            { label: "Active deals",     value: activePortfolio.length  ? `${activePortfolio.length} deal${activePortfolio.length !== 1 ? "s" : ""}` : "None yet", color: "#818CF8" },
            { label: "Consented biz",    value: String(consentCount),                                                           color: "#F59E0B" },
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
  const { user } = useSession();

  const [institutionName, setInstitutionName] = useState("");
  const [currentMember,   setCurrentMember]   = useState<MemberRow | null>(null);
  const [allMembers,      setAllMembers]       = useState<MemberRow[]>([]);
  const [allRecords,      setAllRecords]       = useState<FinancingRecord[]>([]);
  const [allMatches,      setAllMatches]       = useState<DiscoveryMatch[]>([]);
  const [activityLogs,    setActivityLogs]     = useState<ActivityLog[]>([]);
  const [consentCount,    setConsentCount]     = useState(0);
  const [loadingData,     setLoadingData]      = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { institutionId, institution: inst, member: me } = await getMyInstitutionContext(user!.id);
      if (!institutionId || !inst) { setLoadingData(false); return; }
      setInstitutionName(inst.name);

      const [membersRes, recordsRes, matchesRes, activityRes] = await Promise.all([
        supabase.from("institution_members").select("id, user_id, role, team_lead_id, full_name, email").eq("institution_id", institutionId).order("created_at"),
        supabase.from("financing_records").select("financing_id, business_id, capital_category, terms, status, granted_at, settled_at, created_by_member_id").eq("institution_id", institutionId).order("granted_at", { ascending: false }),
        supabase.from("discovery_matches").select("match_id, anonymized_id, capital_category, match_score, matched_at, status, access_requested_at, created_by_member_id").eq("institution_id", institutionId).order("match_score", { ascending: false }),
        supabase.from("financer_activity_logs").select("id, member_id, action, target_type, target_id, metadata, created_at").eq("institution_id", institutionId).order("created_at", { ascending: false }).limit(20),
      ]);

      const rawMembers  = membersRes.data  ?? [];
      const rawRecords  = recordsRes.data  ?? [];
      const rawMatches  = matchesRes.data  ?? [];
      const rawActivity = activityRes.data ?? [];

      const membersWithStats: MemberRow[] = rawMembers.map(m => ({
        ...m,
        active_requests: rawMatches.filter(x => x.created_by_member_id === m.id && x.status === "access_requested").length,
        active_portfolio: rawRecords.filter(x => x.created_by_member_id === m.id && x.status === "active").reduce((s, r) => s + getAmount(r.terms), 0),
        pending_actions: rawMatches.filter(x => x.created_by_member_id === m.id && x.status === "access_requested").length,
      }));

      setAllMembers(membersWithStats);
      setAllRecords(rawRecords);
      setAllMatches(rawMatches);
      setActivityLogs(rawActivity);

      if (me) {
        const meWithStats = membersWithStats.find(m => m.id === me.id) ?? { ...me, active_requests: 0, active_portfolio: 0, pending_actions: 0 };
        setCurrentMember(meWithStats);
      }

      const { count } = await supabase
        .from("consent_records")
        .select("consent_id", { count: "exact", head: true })
        .eq("institution_id", institutionId)
        .eq("is_active", true);
      setConsentCount(count ?? 0);
      setLoadingData(false);
    }
    load();
  }, [user]);

  const role: OrgRole = currentMember?.role ?? "analyst";
  type ViewKey = "org" | "team" | "personal";
  const viewOptions: { key: ViewKey; label: string; icon: React.ReactNode }[] = [];
  if (role === "owner" || role === "admin") {
    viewOptions.push(
      { key: "org",      label: "Organisation", icon: <Building2       size={13} /> },
      { key: "personal", label: "My Work",       icon: <LayoutDashboard size={13} /> },
    );
  } else if (role === "team_lead") {
    viewOptions.push(
      { key: "team",     label: "My Team", icon: <Users           size={13} /> },
      { key: "personal", label: "My Work", icon: <LayoutDashboard size={13} /> },
    );
  }
  const defaultView: ViewKey = (role === "owner" || role === "admin") ? "org" : role === "team_lead" ? "team" : "personal";
  const [view, setView] = useState<ViewKey>(defaultView);

  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const myTeam      = currentMember ? allMembers.filter(m => m.team_lead_id === currentMember.id) : [];
  const myTeamIds   = new Set(myTeam.map(m => m.id));
  // Owners/admins see all institution records in personal view;
  // analysts/leads see only records attributed to their member ID.
  const myRecords   = isOwnerOrAdmin
    ? allRecords
    : currentMember ? allRecords.filter(r => r.created_by_member_id === currentMember.id) : allRecords;
  const myMatches   = isOwnerOrAdmin
    ? allMatches
    : currentMember ? allMatches.filter(m => m.created_by_member_id === currentMember.id) : allMatches;
  const myRequests  = myMatches.filter(m => m.status === "access_requested");
  const myDiscovery = myMatches.filter(m => m.status === "pending");
  const teamRecords  = allRecords.filter(r => r.created_by_member_id !== null && myTeamIds.has(r.created_by_member_id!));
  const teamRequests = allMatches.filter(m => m.created_by_member_id !== null && myTeamIds.has(m.created_by_member_id!) && m.status === "access_requested");
  const teamActivity = activityLogs.filter(a => myTeamIds.has(a.member_id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {viewOptions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px", background: "#F3F4F6", borderRadius: 10, alignSelf: "flex-start" }}>
          {viewOptions.map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, border: "none", background: view === v.key ? "white" : "transparent", boxShadow: view === v.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none", color: view === v.key ? "#0A2540" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      )}
      {view === "org" && (
        <OrgDashboard institutionName={institutionName} members={allMembers} allRecords={allRecords} allMatches={allMatches} activityLogs={activityLogs} loadingData={loadingData} />
      )}
      {view === "team" && currentMember && (
        <TeamLeadDashboard currentMember={currentMember} myTeam={myTeam} teamRecords={teamRecords} teamRequests={teamRequests} teamActivity={teamActivity} allMembers={allMembers} loadingData={loadingData} />
      )}
      {view === "personal" && (
        <PersonalDashboard institutionName={institutionName} portfolio={myRecords} matches={myDiscovery} myRequests={myRequests} consentCount={consentCount} loadingData={loadingData} />
      )}
    </div>
  );
}
