"use client";

import { useState } from "react";
import {
  Building2, Shield, Target, Save, Users,
  Plus, MoreHorizontal, Mail, ChevronDown,
  Crown, UserCheck, User, UserX, X, Check,
  AlertCircle, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type OrgRole = "owner" | "admin" | "team_lead" | "analyst";
type Tab = "institution" | "criteria" | "security" | "team";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with Keycloak Groups/Roles API calls:
     GET  /institution/members
     POST /institution/members/invite        { email, role }
     PUT  /institution/members/:id/role      { role }
     PUT  /institution/members/:id/team-lead { team_lead_id }
     DEL  /institution/members/:id
───────────────────────────────────────────────────────── */

// Simulates the logged-in user — in production, pull from Keycloak JWT claims
const CURRENT_USER_ID = "u1";

const MEMBERS_INIT = [
  {
    id: "u1",
    name: "Tunde Adeyemi",
    email: "tunde@stanbicibtc.com",
    role: "owner"      as OrgRole,
    team_lead_id: null as string | null,
    joined: "Oct 2023",
    active_requests: 3,
    active_portfolio: "₦65M",
    is_active: true,
  },
  {
    id: "u2",
    name: "Kemi Obi",
    email: "kemi@stanbicibtc.com",
    role: "admin"      as OrgRole,
    team_lead_id: null as string | null,
    joined: "Nov 2023",
    active_requests: 4,
    active_portfolio: "₦88M",
    is_active: true,
  },
  {
    id: "u3",
    name: "Chidi Eze",
    email: "chidi@stanbicibtc.com",
    role: "team_lead"  as OrgRole,
    team_lead_id: null as string | null,
    joined: "Jan 2024",
    active_requests: 2,
    active_portfolio: "₦41M",
    is_active: true,
  },
  {
    id: "u4",
    name: "Amaka Nwosu",
    email: "amaka@stanbicibtc.com",
    role: "analyst"    as OrgRole,
    team_lead_id: "u3",
    joined: "Feb 2024",
    active_requests: 1,
    active_portfolio: "₦22M",
    is_active: true,
  },
  {
    id: "u5",
    name: "Bola Fashola",
    email: "bola@stanbicibtc.com",
    role: "analyst"    as OrgRole,
    team_lead_id: "u3",
    joined: "Mar 2024",
    active_requests: 2,
    active_portfolio: "₦32M",
    is_active: true,
  },
  {
    id: "u6",
    name: "Ngozi Ike",
    email: "ngozi@stanbicibtc.com",
    role: "analyst"    as OrgRole,
    team_lead_id: null as string | null,
    joined: "Apr 2024",
    active_requests: 0,
    active_portfolio: "₦0",
    is_active: false,
  },
];

const CAPITAL_CATEGORIES = [
  "Working Capital Loan", "Term Loan", "Equipment Financing",
  "Invoice Financing", "Revenue Advance", "Trade Finance",
  "Overdraft Facility", "Asset Leasing",
];

const SECTORS = [
  "Food & Beverage", "Retail", "Manufacturing", "Agriculture",
  "Logistics", "Technology", "Healthcare", "Professional Services",
];

/* ─────────────────────────────────────────────────────────
   ROLE CONFIG
───────────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<OrgRole, {
  label: string;
  variant: "default" | "secondary" | "success" | "warning" | "outline";
  icon: React.ReactNode;
  description: string;
}> = {
  owner:     { label: "Owner",     variant: "default",   icon: <Crown     size={11} />, description: "Full access. Manages billing, roles, and all members." },
  admin:     { label: "Admin",     variant: "secondary", icon: <Shield    size={11} />, description: "Full access except owner management and billing." },
  team_lead: { label: "Team Lead", variant: "warning",   icon: <UserCheck size={11} />, description: "Controls their assigned team members' visibility and work." },
  analyst:   { label: "Analyst",   variant: "outline",   icon: <User      size={11} />, description: "Access to their own assigned requests and portfolio only." },
};

/* ─────────────────────────────────────────────────────────
   PERMISSION GATE
   owner/admin can change anyone
   team_lead can change their direct reports only
───────────────────────────────────────────────────────── */
function canActor(actorRole: OrgRole, actorId: string, targetMember: typeof MEMBERS_INIT[0]): boolean {
  if (actorRole === "owner" || actorRole === "admin") return targetMember.role !== "owner";
  if (actorRole === "team_lead") return targetMember.team_lead_id === actorId;
  return false;
}

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
function SectionCard({ title, sub, children }: {
  title: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{sub}</p>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", disabled = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={{
          width: "100%", height: 38, padding: "0 12px",
          borderRadius: 8, border: "1px solid #E5E7EB",
          fontSize: 13, color: disabled ? "#9CA3AF" : "#0A2540",
          outline: "none", boxSizing: "border-box",
          background: disabled ? "#F9FAFB" : "white",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = "#0A2540"; }}
        onBlur={e => { e.target.style.borderColor = "#E5E7EB"; }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   INVITE MODAL
───────────────────────────────────────────────────────── */
function InviteModal({ onClose, onInvite }: {
  onClose: () => void;
  onInvite: (email: string, role: OrgRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<OrgRole>("analyst");
  const rc = ROLE_CONFIG[role];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 480,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>
              Invite Team Member
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              They'll receive an email invite to join via Keycloak.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 38, borderRadius: 8, border: "1px solid #E5E7EB" }}>
              <Mail size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@stanbicibtc.com"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0A2540", background: "transparent" }}
              />
            </div>
          </div>

          {/* Role picker */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Role
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(["admin", "team_lead", "analyst"] as OrgRole[]).map(r => {
                const cfg = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      border: `1px solid ${role === r ? "#0A2540" : "#E5E7EB"}`,
                      background: role === r ? "#F8FAFC" : "white",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      border: `2px solid ${role === r ? "#0A2540" : "#D1D5DB"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {role === r && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2540" }} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{cfg.label}</p>
                        <Badge variant={cfg.variant} style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 3 }}>
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{cfg.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB",
            background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            disabled={!email.trim()}
            onClick={() => { if (email.trim()) { onInvite(email.trim(), role); onClose(); } }}
            style={{
              flex: 1, height: 40, borderRadius: 8, border: "none",
              background: email.trim() ? "#0A2540" : "#E5E7EB",
              color: email.trim() ? "white" : "#9CA3AF",
              fontSize: 13, fontWeight: 600,
              cursor: email.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Mail size={13} /> Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MEMBER ACTION MENU
───────────────────────────────────────────────────────── */
function MemberMenu({
  member, members, currentRole, onRoleChange, onAssignLead, onDeactivate, onClose,
}: {
  member: typeof MEMBERS_INIT[0];
  members: typeof MEMBERS_INIT;
  currentRole: OrgRole;
  onRoleChange: (role: OrgRole) => void;
  onAssignLead: (leadId: string | null) => void;
  onDeactivate: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<"main" | "role" | "lead">("main");
  const eligibleLeads = members.filter(m => m.id !== member.id && (m.role === "team_lead" || m.role === "admin" || m.role === "owner") && m.is_active);

  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, zIndex: 100,
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      minWidth: 220, overflow: "hidden",
    }}>
      {view === "main" && (
        <>
          <div style={{ padding: "6px 0" }}>
            <button onClick={() => setView("role")} style={menuItemStyle}>
              <Shield size={13} style={{ color: "#9CA3AF" }} /> Change role
            </button>
            {member.role === "analyst" && (
              <button onClick={() => setView("lead")} style={menuItemStyle}>
                <UserCheck size={13} style={{ color: "#9CA3AF" }} /> Assign team lead
              </button>
            )}
          </div>
          <div style={{ borderTop: "1px solid #F3F4F6", padding: "6px 0" }}>
            <button
              onClick={() => { onDeactivate(); onClose(); }}
              style={{ ...menuItemStyle, color: "#EF4444" }}
            >
              <UserX size={13} /> {member.is_active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </>
      )}

      {view === "role" && (
        <>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0 }}>
              ← 
            </button>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Change role</p>
          </div>
          <div style={{ padding: "6px 0" }}>
            {(["admin", "team_lead", "analyst"] as OrgRole[])
              .filter(r => !(r === "owner")) // can't promote to owner via UI
              .map(r => (
                <button
                  key={r}
                  onClick={() => { onRoleChange(r); onClose(); }}
                  style={{
                    ...menuItemStyle,
                    fontWeight: member.role === r ? 700 : 400,
                    color: member.role === r ? "#0A2540" : "#374151",
                    background: member.role === r ? "#F9FAFB" : "transparent",
                  }}
                >
                  <span style={{ flex: 1 }}>{ROLE_CONFIG[r].label}</span>
                  {member.role === r && <Check size={12} style={{ color: "#0A2540" }} />}
                </button>
              ))
            }
          </div>
        </>
      )}

      {view === "lead" && (
        <>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0 }}>
              ←
            </button>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Assign team lead</p>
          </div>
          <div style={{ padding: "6px 0" }}>
            <button
              onClick={() => { onAssignLead(null); onClose(); }}
              style={{ ...menuItemStyle, color: member.team_lead_id === null ? "#0A2540" : "#374151", fontWeight: member.team_lead_id === null ? 700 : 400 }}
            >
              <span style={{ flex: 1 }}>No team lead</span>
              {member.team_lead_id === null && <Check size={12} style={{ color: "#0A2540" }} />}
            </button>
            {eligibleLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => { onAssignLead(lead.id); onClose(); }}
                style={{
                  ...menuItemStyle,
                  fontWeight: member.team_lead_id === lead.id ? 700 : 400,
                  color: member.team_lead_id === lead.id ? "#0A2540" : "#374151",
                }}
              >
                <span style={{ flex: 1 }}>{lead.name}</span>
                {member.team_lead_id === lead.id && <Check size={12} style={{ color: "#0A2540" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "9px 14px",
  background: "none", border: "none", cursor: "pointer",
  fontSize: 13, fontWeight: 500, color: "#374151",
  textAlign: "left",
};

/* ─────────────────────────────────────────────────────────
   MEMBER ROW
───────────────────────────────────────────────────────── */
function MemberRow({
  member, members, currentUserId, currentRole, onUpdate,
}: {
  member: typeof MEMBERS_INIT[0];
  members: typeof MEMBERS_INIT;
  currentUserId: string;
  currentRole: OrgRole;
  onUpdate: (id: string, patch: Partial<typeof MEMBERS_INIT[0]>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rc = ROLE_CONFIG[member.role];
  const lead = member.team_lead_id ? members.find(m => m.id === member.team_lead_id) : null;
  const isMe = member.id === currentUserId;
  const canEdit = !isMe && canActor(currentRole, currentUserId, member);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "36px 1fr 140px 140px 80px 80px 40px",
      alignItems: "center", gap: 12,
      padding: "12px 22px",
      opacity: member.is_active ? 1 : 0.5,
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: isMe ? "#0A2540" : "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        color: isMe ? "#00D4FF" : "#0A2540",
      }}>
        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
      </div>

      {/* Name + email */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: "#0A2540",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {member.name}
          </p>
          {isMe && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              You
            </span>
          )}
          {!member.is_active && (
            <Badge variant="outline" style={{ fontSize: 9 }}>Inactive</Badge>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {member.email}
        </p>
      </div>

      {/* Role */}
      <Badge
        variant={rc.variant}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, width: "fit-content" }}
      >
        {rc.icon} {rc.label}
      </Badge>

      {/* Team lead */}
      <p style={{ fontSize: 12, color: "#6B7280" }}>
        {lead ? lead.name : <span style={{ color: "#D1D5DB" }}>—</span>}
      </p>

      {/* Stats */}
      <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textAlign: "center" as const }}>
        {member.active_requests}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>
        {member.active_portfolio}
      </p>

      {/* Action menu */}
      <div style={{ position: "relative" }}>
        {canEdit ? (
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid #E5E7EB", background: menuOpen ? "#F3F4F6" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6B7280",
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        ) : (
          <div style={{ width: 30 }} />
        )}

        {menuOpen && canEdit && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
            <MemberMenu
              member={member}
              members={members}
              currentRole={currentRole}
              onRoleChange={role => onUpdate(member.id, { role })}
              onAssignLead={team_lead_id => onUpdate(member.id, { team_lead_id })}
              onDeactivate={() => onUpdate(member.id, { is_active: !member.is_active })}
              onClose={() => setMenuOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TEAM TAB
───────────────────────────────────────────────────────── */
function TeamTab({ currentUserId, currentRole }: { currentUserId: string; currentRole: OrgRole }) {
  const [members, setMembers] = useState(MEMBERS_INIT);
  const [showInvite, setShowInvite] = useState(false);
  const [filter, setFilter] = useState<"all" | OrgRole>("all");

  const filtered = filter === "all" ? members : members.filter(m => m.role === filter);

  const updateMember = (id: string, patch: Partial<typeof MEMBERS_INIT[0]>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    // TODO: PATCH /institution/members/:id via Keycloak admin API
  };

  const inviteMember = (email: string, role: OrgRole) => {
    const newMember = {
      id: `u${Date.now()}`,
      name: email.split("@")[0],
      email,
      role,
      team_lead_id: null,
      joined: "Pending",
      active_requests: 0,
      active_portfolio: "₦0",
      is_active: false,
    };
    setMembers(prev => [...prev, newMember]);
    // TODO: POST /institution/members/invite { email, role } → Keycloak invitation
  };

  const active   = members.filter(m => m.is_active).length;
  const leads    = members.filter(m => m.role === "team_lead").length;
  const analysts = members.filter(m => m.role === "analyst").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvite={inviteMember} />
      )}

      {/* Org summary strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        background: "white", border: "1px solid #E5E7EB",
        borderRadius: 14, overflow: "hidden",
      }}>
        {[
          { label: "Total Members", value: members.length, sub: `${active} active` },
          { label: "Admins",        value: members.filter(m => m.role === "admin").length,  sub: "Org-level access" },
          { label: "Team Leads",    value: leads,    sub: "With direct reports" },
          { label: "Analysts",      value: analysts, sub: "Individual access" },
        ].map((s, i, arr) => (
          <div key={s.label} style={{
            padding: "18px 22px",
            borderRight: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
          }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 1 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Role reference */}
      <div style={{
        background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
        borderRadius: 12, padding: "14px 18px",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0A5060", marginBottom: 10 }}>Role permissions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {(Object.entries(ROLE_CONFIG) as [OrgRole, typeof ROLE_CONFIG[OrgRole]][]).map(([role, cfg]) => (
            <div key={role} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Badge variant={cfg.variant} style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 3, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon} {cfg.label}
              </Badge>
              <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{cfg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Members table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>

        {/* Table toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 22px", borderBottom: "1px solid #F3F4F6", gap: 12, flexWrap: "wrap",
        }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {([
              { key: "all",      label: "All",       count: members.length },
              { key: "admin",    label: "Admins",    count: members.filter(m => m.role === "admin").length },
              { key: "team_lead",label: "Team Leads",count: leads },
              { key: "analyst",  label: "Analysts",  count: analysts },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 7,
                  border: filter === tab.key ? "1px solid #0A2540" : "1px solid #E5E7EB",
                  background: filter === tab.key ? "#0A2540" : "white",
                  color: filter === tab.key ? "white" : "#6B7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {tab.label}
                <span style={{
                  minWidth: 16, height: 16, borderRadius: 9999, padding: "0 3px",
                  background: filter === tab.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
                  color: filter === tab.key ? "white" : "#9CA3AF",
                  fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Invite button — only owner/admin */}
          {(currentRole === "owner" || currentRole === "admin") && (
            <button
              onClick={() => setShowInvite(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: "#0A2540", color: "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={13} /> Invite member
            </button>
          )}
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 140px 140px 80px 80px 40px",
          gap: 12, padding: "8px 22px 10px",
          borderBottom: "1px solid #F3F4F6",
        }}>
          {["", "Member", "Role", "Reports to", "Requests", "Portfolio", ""].map((h, i) => (
            <p key={i} style={{
              fontSize: 11, fontWeight: 700, color: "#9CA3AF",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        <div>
          {filtered.map((m, i) => (
            <div key={m.id} style={{
              borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <MemberRow
                member={m}
                members={members}
                currentUserId={currentUserId}
                currentRole={currentRole}
                onUpdate={updateMember}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerSettings() {
  const [tab, setTab] = useState<Tab>("institution");

  // In production, derive from Keycloak JWT
  const currentUserRole: OrgRole = "owner";

  const [profile, setProfile] = useState({
    name: "Stanbic IBTC",
    contact_name: "Tunde Adeyemi",
    contact_email: "tunde@stanbicibtc.com",
    contact_phone: "+234 801 234 5678",
    website: "https://stanbicibtc.com",
    description: "One of Nigeria's leading financial institutions offering a full range of financial services.",
  });

  const [criteria, setCriteria] = useState({
    min_score: "650",
    min_data_months: "12",
    selected_capital: ["Working Capital Loan", "Equipment Financing"] as string[],
    selected_sectors: ["Retail", "Food & Beverage", "Manufacturing"] as string[],
    max_exposure: "₦200M",
  });

  const toggleItem = (key: "selected_capital" | "selected_sectors", val: string) => {
    setCriteria(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { key: "institution", label: "Institution",       icon: <Building2 size={14} /> },
    { key: "criteria",    label: "Matching Criteria",  icon: <Target    size={14} /> },
    { key: "team",        label: "Team",               icon: <Users     size={14} /> },
    { key: "security",    label: "Security",            icon: <Shield    size={14} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Settings
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Manage your institution profile, discovery preferences, and team.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              border: tab === t.key ? "1px solid #0A2540" : "1px solid #E5E7EB",
              background: tab === t.key ? "#0A2540" : "white",
              color: tab === t.key ? "white" : "#6B7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s",
              position: "relative",
            }}
          >
            {t.icon} {t.label}
            {/* Team tab has a badge if there are pending invites */}
            {t.key === "team" && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: tab === "team" ? "rgba(255,255,255,0.6)" : "#EF4444",
                display: "block",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── INSTITUTION ── */}
      {tab === "institution" && (
        <SectionCard title="Institution Profile" sub="Information visible to businesses you request access from.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
            <Field label="Institution Name"  value={profile.name}          onChange={v => setProfile(p => ({ ...p, name: v }))} />
            <Field label="Website"           value={profile.website}       onChange={v => setProfile(p => ({ ...p, website: v }))} />
            <Field label="Contact Name"      value={profile.contact_name}  onChange={v => setProfile(p => ({ ...p, contact_name: v }))} />
            <Field label="Contact Email"     value={profile.contact_email} onChange={v => setProfile(p => ({ ...p, contact_email: v }))} type="email" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description</label>
            <textarea
              value={profile.description}
              onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540",
                resize: "vertical", outline: "none", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#0A2540", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Save size={13} /> Save Profile
          </button>
        </SectionCard>
      )}

      {/* ── CRITERIA ── */}
      {tab === "criteria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionCard title="Financial Thresholds" sub="Minimum requirements for businesses to appear in your discovery feed.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="Minimum Score"      value={criteria.min_score}       onChange={v => setCriteria(c => ({ ...c, min_score: v }))}       type="number" />
              <Field label="Minimum Data (mo)"  value={criteria.min_data_months} onChange={v => setCriteria(c => ({ ...c, min_data_months: v }))} type="number" />
              <Field label="Maximum Exposure"   value={criteria.max_exposure}    onChange={v => setCriteria(c => ({ ...c, max_exposure: v }))}    placeholder="₦200M" />
            </div>
          </SectionCard>
          <SectionCard title="Capital Categories" sub="Which types of financing are you offering?">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CAPITAL_CATEGORIES.map(c => {
                const selected = criteria.selected_capital.includes(c);
                return (
                  <button key={c} onClick={() => toggleItem("selected_capital", c)} style={{
                    padding: "6px 14px", borderRadius: 9999,
                    border: `1px solid ${selected ? "#0A2540" : "#E5E7EB"}`,
                    background: selected ? "#0A2540" : "white",
                    color: selected ? "white" : "#6B7280",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                  }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard title="Target Sectors" sub="Which business sectors do you want to see?">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SECTORS.map(s => {
                const selected = criteria.selected_sectors.includes(s);
                return (
                  <button key={s} onClick={() => toggleItem("selected_sectors", s)} style={{
                    padding: "6px 14px", borderRadius: 9999,
                    border: `1px solid ${selected ? "#0A2540" : "#E5E7EB"}`,
                    background: selected ? "#0A2540" : "white",
                    color: selected ? "white" : "#6B7280",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                  }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </SectionCard>
          <button style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#0A2540", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
          }}>
            <Save size={13} /> Save Criteria
          </button>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === "team" && (
        <TeamTab currentUserId={CURRENT_USER_ID} currentRole={currentUserRole} />
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <SectionCard title="Security" sub="Manage your login credentials and session security.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Change Password",          sub: "Update your Keycloak account password." },
              { label: "Two-Factor Authentication", sub: "Add an extra layer of security to your account." },
              { label: "Active Sessions",           sub: "View and revoke active login sessions." },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", borderBottom: "1px solid #F3F4F6",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.sub}</p>
                </div>
                <button style={{
                  padding: "6px 14px", borderRadius: 8,
                  border: "1px solid #E5E7EB", background: "white",
                  fontSize: 12, fontWeight: 600, color: "#0A2540", cursor: "pointer",
                }}>
                  Manage
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
