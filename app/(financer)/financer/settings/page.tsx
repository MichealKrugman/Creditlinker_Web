"use client";

import { useState, useRef, useEffect } from "react";
import {
  Building2, Shield, Target, Save, Users,
  Plus, MoreHorizontal, Mail, ChevronDown,
  Crown, UserCheck, User, UserX, X, Check,
  AlertCircle, RefreshCw, GitBranch, Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/lib/mobile-nav-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type OrgRole = "owner" | "admin" | "team_lead" | "analyst";
type Tab = "institution" | "criteria" | "workflow" | "security" | "team";

/* ─────────────────────────────────────────────────────────
   WORKFLOW CONFIG TYPES
───────────────────────────────────────────────────────── */
type ApprovalChain = "analyst_to_lead" | "analyst_to_lead_to_principal" | "direct_to_lead" | "any_member";
type ReportRouting = "always_analyst" | "always_lead" | "per_member";

type WorkflowConfig = {
  approval_chain: ApprovalChain;
  report_routing: ReportRouting;
  require_dual_approval: boolean;
  dual_approval_threshold: number;
  analyst_can_self_approve_below: number;
};

/**
 * Per-member workflow override.
 * null means "follow the org-wide setting".
 * When set, this member's reports and approvals ignore the org default.
 */
type MemberWorkflowOverride = {
  approval_chain: ApprovalChain | null;  // null = inherit org default
  report_routing: ReportRouting | null;  // null = inherit org default
  note: string;                          // reason this override was set
};

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
    workflow_override: null as MemberWorkflowOverride | null,
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
    workflow_override: null as MemberWorkflowOverride | null,
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
    workflow_override: null as MemberWorkflowOverride | null,
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
    // Example: Amaka submits directly to principal, bypassing team lead
    workflow_override: {
      approval_chain: "analyst_to_lead_to_principal",
      report_routing: "always_lead",
      note: "Senior analyst with direct principal relationship. Approved by Tunde Adeyemi.",
    } as MemberWorkflowOverride,
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
    workflow_override: null as MemberWorkflowOverride | null,
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
    workflow_override: null as MemberWorkflowOverride | null,
  },
];

const CAPITAL_CATEGORIES = [
  "Working Capital Loan", "Term Loan", "Equipment Financing",
  "Invoice Financing", "Revenue Advance", "Trade Finance",
  "Overdraft Facility", "Asset Leasing",
];

const SECTORS = [
  // Primary economy
  "Agriculture & Farming",
  "Agro-processing & Milling",
  "Fisheries & Aquaculture",
  // Trade & commerce
  "Wholesale & Distribution",
  "Retail & Consumer Goods",
  "E-commerce & Online Retail",
  "Import & Export",
  // Manufacturing & production
  "Food & Beverage Manufacturing",
  "Textile & Garment",
  "Plastics & Packaging",
  "Chemical & Industrial",
  "Furniture & Wood Products",
  "Printing & Publishing",
  // Construction & real estate
  "Construction & Civil Works",
  "Real Estate & Property",
  "Building Materials",
  // Transport & logistics
  "Logistics & Freight",
  "Haulage & Trucking",
  "Last-mile Delivery",
  // Technology
  "Software & SaaS",
  "Fintech",
  "Edtech",
  "Healthtech",
  "Telecommunications",
  "Hardware & Electronics",
  // Professional & services
  "Professional Services",
  "Legal & Compliance",
  "Accounting & Audit",
  "Marketing & Advertising",
  "Media & Entertainment",
  // Healthcare & education
  "Healthcare & Clinics",
  "Pharmaceuticals & Medical Supplies",
  "Education & Training",
  // Energy & environment
  "Energy & Power",
  "Solar & Renewables",
  "Waste Management",
  "Oil & Gas Services",
  // Hospitality & lifestyle
  "Hotels & Hospitality",
  "Restaurant & Catering",
  "Fashion & Beauty",
  "Events & Entertainment",
  // Financial services
  "Financial Services",
  "Insurance",
  "Microfinance",
  // Other
  "Non-profit & NGO",
  "Government & Public Sector",
  "Other",
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
  owner:     { label: "Principal",  variant: "default",   icon: <Crown     size={11} />, description: "Full platform control. Manages billing, workflow policy, roles, and all members." },
  admin:     { label: "Admin",      variant: "secondary", icon: <Shield    size={11} />, description: "Full access except Principal management and billing configuration." },
  team_lead: { label: "Team Lead",  variant: "warning",   icon: <UserCheck size={11} />, description: "Reviews and approves submissions from their direct reports. Owns team portfolio." },
  analyst:   { label: "Analyst",    variant: "outline",   icon: <User      size={11} />, description: "Works assigned businesses, submits reports and recommendations up the approval chain." },
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
   Rendered via fixed positioning so it never clips regardless
   of where the row sits in the list.
───────────────────────────────────────────────────────── */

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "9px 14px",
  background: "none", border: "none", cursor: "pointer",
  fontSize: 13, fontWeight: 500, color: "#374151",
  textAlign: "left",
};

function MemberMenu({
  member, members, anchorRect, currentRole, menuRef,
  onRoleChange, onAssignLead, onWorkflowOverride, onDeactivate, onClose,
}: {
  member: typeof MEMBERS_INIT[0];
  members: typeof MEMBERS_INIT;
  anchorRect: DOMRect;
  currentRole: OrgRole;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onRoleChange: (role: OrgRole) => void;
  onAssignLead: (leadId: string | null) => void;
  onWorkflowOverride: (override: MemberWorkflowOverride | null) => void;
  onDeactivate: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<"main" | "role" | "lead" | "workflow">("main");

  // Workflow override form state
  const [wfChain,   setWfChain]   = useState<ApprovalChain | "inherit">(member.workflow_override?.approval_chain ?? "inherit");
  const [wfRouting, setWfRouting] = useState<ReportRouting | "inherit">(member.workflow_override?.report_routing ?? "inherit");
  const [wfNote,    setWfNote]    = useState(member.workflow_override?.note ?? "");

  const eligibleLeads = members.filter(
    m => m.id !== member.id &&
    (m.role === "team_lead" || m.role === "admin" || m.role === "owner") &&
    m.is_active
  );

  // Position the menu with fixed coordinates so it never clips.
  // Open above the button if too close to the bottom of the viewport.
  const MENU_HEIGHT_ESTIMATE = 220;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < MENU_HEIGHT_ESTIMATE;

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    right: window.innerWidth - anchorRect.right,
    ...(openUpward
      ? { bottom: window.innerHeight - anchorRect.top }
      : { top: anchorRect.bottom + 4 }),
    zIndex: 9999,
    background: "white",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    minWidth: 240,
    overflow: "hidden",
  };

  const hasOverride = member.workflow_override !== null;

  return (
    <div ref={menuRef} style={menuStyle}>

      {/* ── MAIN VIEW ── */}
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
            <button onClick={() => setView("workflow")} style={menuItemStyle}>
              <GitBranch size={13} style={{ color: hasOverride ? "#6366F1" : "#9CA3AF" }} />
              <span style={{ flex: 1 }}>Workflow override</span>
              {hasOverride && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#6366F1",
                  background: "#EEF2FF", border: "1px solid rgba(99,102,241,0.2)",
                  padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase",
                }}>
                  Custom
                </span>
              )}
            </button>
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

      {/* ── CHANGE ROLE ── */}
      {view === "role" && (
        <>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, fontSize: 14 }}>←</button>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Change role</p>
          </div>
          <div style={{ padding: "6px 0" }}>
            {(["admin", "team_lead", "analyst"] as OrgRole[]).map(r => (
              <button key={r} onClick={() => { onRoleChange(r); onClose(); }}
                style={{ ...menuItemStyle, fontWeight: member.role === r ? 700 : 400, color: member.role === r ? "#0A2540" : "#374151", background: member.role === r ? "#F9FAFB" : "transparent" }}>
                <span style={{ flex: 1 }}>{ROLE_CONFIG[r].label}</span>
                {member.role === r && <Check size={12} style={{ color: "#0A2540" }} />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── ASSIGN TEAM LEAD ── */}
      {view === "lead" && (
        <>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, fontSize: 14 }}>←</button>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Assign team lead</p>
          </div>
          <div style={{ padding: "6px 0" }}>
            <button onClick={() => { onAssignLead(null); onClose(); }}
              style={{ ...menuItemStyle, color: member.team_lead_id === null ? "#0A2540" : "#374151", fontWeight: member.team_lead_id === null ? 700 : 400 }}>
              <span style={{ flex: 1 }}>No team lead</span>
              {member.team_lead_id === null && <Check size={12} style={{ color: "#0A2540" }} />}
            </button>
            {eligibleLeads.map(lead => (
              <button key={lead.id} onClick={() => { onAssignLead(lead.id); onClose(); }}
                style={{ ...menuItemStyle, fontWeight: member.team_lead_id === lead.id ? 700 : 400, color: member.team_lead_id === lead.id ? "#0A2540" : "#374151" }}>
                <span style={{ flex: 1 }}>{lead.name}</span>
                {member.team_lead_id === lead.id && <Check size={12} style={{ color: "#0A2540" }} />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── WORKFLOW OVERRIDE ── */}
      {view === "workflow" && (
        <div style={{ width: 320 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, fontSize: 14 }}>←</button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Workflow override — {member.name.split(" ")[0]}</p>
              <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Overrides the org-wide workflow for this member only.</p>
            </div>
          </div>

          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Approval chain */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Approval chain</p>
              {(["inherit", "analyst_to_lead", "analyst_to_lead_to_principal", "direct_to_lead", "any_member"] as const).map(opt => (
                <button key={opt} onClick={() => setWfChain(opt)}
                  style={{ ...menuItemStyle, padding: "6px 8px", fontWeight: wfChain === opt ? 700 : 400, color: wfChain === opt ? "#0A2540" : "#374151", background: wfChain === opt ? "#F9FAFB" : "transparent", borderRadius: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>
                    {opt === "inherit" ? "Follow org default" :
                     opt === "analyst_to_lead" ? "Analyst → Team Lead" :
                     opt === "analyst_to_lead_to_principal" ? "Analyst → Lead → Principal" :
                     opt === "direct_to_lead" ? "Direct to Team Lead" : "Any member (autonomous)"}
                  </span>
                  {wfChain === opt && <Check size={11} style={{ color: "#0A2540", flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            {/* Report routing */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Report routing</p>
              {(["inherit", "always_analyst", "always_lead"] as const).map(opt => (
                <button key={opt} onClick={() => setWfRouting(opt)}
                  style={{ ...menuItemStyle, padding: "6px 8px", fontWeight: wfRouting === opt ? 700 : 400, color: wfRouting === opt ? "#0A2540" : "#374151", background: wfRouting === opt ? "#F9FAFB" : "transparent", borderRadius: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>
                    {opt === "inherit" ? "Follow org default" :
                     opt === "always_analyst" ? "Always via Senior Analyst" : "Always to Team Lead"}
                  </span>
                  {wfRouting === opt && <Check size={11} style={{ color: "#0A2540", flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            {/* Note */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Reason for override</p>
              <textarea value={wfNote} onChange={e => setWfNote(e.target.value)}
                placeholder="Why is this member getting a custom workflow? (recorded in audit log)"
                rows={2}
                style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 12, color: "#0A2540", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
                onFocus={e => (e.target.style.borderColor = "#0A2540")}
                onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6 }}>
              {hasOverride && (
                <button onClick={() => { onWorkflowOverride(null); onClose(); }}
                  style={{ flex: 1, height: 34, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>
                  Remove override
                </button>
              )}
              <button
                disabled={wfChain === "inherit" && wfRouting === "inherit"}
                onClick={() => {
                  const override: MemberWorkflowOverride = {
                    approval_chain: wfChain === "inherit" ? null : wfChain,
                    report_routing: wfRouting === "inherit" ? null : wfRouting,
                    note: wfNote.trim(),
                  };
                  // TODO: PATCH /institution/members/:id/workflow-override { override }
                  onWorkflowOverride(override);
                  onClose();
                }}
                style={{ flex: 2, height: 34, borderRadius: 7, border: "none", background: (wfChain !== "inherit" || wfRouting !== "inherit") ? "#0A2540" : "#E5E7EB", color: (wfChain !== "inherit" || wfRouting !== "inherit") ? "white" : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: (wfChain !== "inherit" || wfRouting !== "inherit") ? "pointer" : "not-allowed" }}>
                Save override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const rc = ROLE_CONFIG[member.role];
  const lead = member.team_lead_id ? members.find(m => m.id === member.team_lead_id) : null;
  const isMe = member.id === currentUserId;
  const canEdit = !isMe && canActor(currentRole, currentUserId, member);
  const hasOverride = member.workflow_override !== null;

  // Close menu only when the click lands outside BOTH the trigger button
  // and the menu panel itself. Using mousedown ensures we catch the event
  // before any click handler on the menu items fires — but by checking the
  // menu ref we allow those items to receive their own click events.
  useEffect(() => {
    if (!menuOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      const insideBtn  = target.closest('[data-menu-trigger]') !== null;
      const insideMenu = menuRef.current?.contains(target as Node);
      if (!insideBtn && !insideMenu) {
        setMenuOpen(false);
        setAnchorRect(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  function openMenu(e: React.MouseEvent<HTMLButtonElement>) {
  setAnchorRect(e.currentTarget.getBoundingClientRect());
  setMenuOpen(true);
  }

  const isMobile = useIsMobile();

  const triggerBtn = (ref?: React.RefObject<HTMLButtonElement>) => (
  canEdit ? (
  <button
  data-menu-trigger
  ref={ref}
  onClick={openMenu}
  style={{
  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
  border: `1px solid ${menuOpen ? "#0A2540" : hasOverride ? "rgba(99,102,241,0.4)" : "#E5E7EB"}`,
  background: menuOpen ? "#F3F4F6" : hasOverride ? "#EEF2FF" : "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", position: "relative" as const,
  color: menuOpen ? "#0A2540" : hasOverride ? "#6366F1" : "#6B7280",
  }}
  >
  <MoreHorizontal size={14} />
  {hasOverride && (
  <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: "#6366F1", border: "1.5px solid white" }} />
  )}
  </button>
  ) : <div style={{ width: 30 }} />
  );

  return (
  <div style={{ opacity: member.is_active ? 1 : 0.5 }}>

  {isMobile ? (
  /* ─── MOBILE CARD ─── */
  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: isMe ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isMe ? "#00D4FF" : "#0A2540" }}>
          {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
              <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{member.name}</p>
            {isMe && <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>You</span>}
            {!member.is_active && <Badge variant="outline" style={{ fontSize: 9, flexShrink: 0 }}>Inactive</Badge>}
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.email}</p>
          </div>
      </div>
      {triggerBtn()}
  </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 46 }}>
            <Badge variant={rc.variant} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10 }}>{rc.icon} {rc.label}</Badge>
      {lead && <span style={{ fontSize: 11, color: "#6B7280" }}>→ {lead.name}</span>}
      {hasOverride && <span style={{ fontSize: 9, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "1px solid rgba(99,102,241,0.2)", padding: "1px 5px", borderRadius: 9999, textTransform: "uppercase" as const }}>Custom flow</span>}
    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{member.active_requests} req · {member.active_portfolio}</span>
  </div>
  </div>
  ) : (
  /* ─── DESKTOP GRID ─── */
  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 140px 140px 80px 80px 40px", alignItems: "center", gap: 12, padding: "12px 22px" }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: isMe ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isMe ? "#00D4FF" : "#0A2540" }}>
            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
    <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</p>
        {isMe && <span style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>You</span>}
      {!member.is_active && <Badge variant="outline" style={{ fontSize: 9 }}>Inactive</Badge>}
  </div>
    <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.email}</p>
  </div>
    <Badge variant={rc.variant} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, width: "fit-content" }}>{rc.icon} {rc.label}</Badge>
          <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: hasOverride ? 2 : 0 }}>
        {lead ? lead.name : <span style={{ color: "#D1D5DB" }}>—</span>}
      </p>
            {hasOverride && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "1px solid rgba(99,102,241,0.2)", padding: "1px 5px", borderRadius: 9999, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Custom flow</span>}
    </div>
    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textAlign: "center" as const }}>{member.active_requests}</p>
    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{member.active_portfolio}</p>
  <div>{triggerBtn(btnRef)}</div>
  </div>
  )}

  {menuOpen && canEdit && anchorRect && (
  <MemberMenu
  member={member}
  members={members}
  anchorRect={anchorRect}
  currentRole={currentRole}
  menuRef={menuRef}
  onRoleChange={role => onUpdate(member.id, { role })}
  onAssignLead={team_lead_id => onUpdate(member.id, { team_lead_id })}
  onWorkflowOverride={override => onUpdate(member.id, { workflow_override: override })}
  onDeactivate={() => onUpdate(member.id, { is_active: !member.is_active })}
  onClose={() => { setMenuOpen(false); setAnchorRect(null); }}
  />
  )}
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
      <div className="fnc-set-stats-grid" style={{
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
        <div className="fnc-set-two-col fnc-set-role-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {(Object.entries(ROLE_CONFIG) as [OrgRole, typeof ROLE_CONFIG[OrgRole]][]).map(([role, cfg]) => (
            <div key={role} style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
              <Badge variant={cfg.variant} style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 3, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon} {cfg.label}
              </Badge>
              <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, wordBreak: "break-word", minWidth: 0 }}>{cfg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Members table */}
      <div className="fnc-set-table-wrap" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>

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

        {/* Column headers — hidden on mobile */}
        <div className="fnc-set-col-headers" style={{
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
  const [savedTab, setSavedTab] = useState<Tab | null>(null);

  function handleSave(t: Tab) {
    setSavedTab(t);
    setTimeout(() => setSavedTab(null), 2200);
    // TODO: POST/PATCH to API
  }

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

  const [workflow, setWorkflow] = useState<WorkflowConfig>({
    approval_chain: "analyst_to_lead",
    report_routing: "per_member",
    require_dual_approval: false,
    dual_approval_threshold: 0,
    analyst_can_self_approve_below: 0,
  });

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "institution", label: "Institution",       icon: <Building2 size={14} /> },
    { key: "criteria",    label: "Matching Criteria", icon: <Target    size={14} /> },
    { key: "workflow",    label: "Workflow",           icon: <RefreshCw size={14} /> },
    { key: "team",        label: "Team",              icon: <Users     size={14} /> },
    { key: "security",    label: "Security",          icon: <Shield    size={14} /> },
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
          <div className="fnc-set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
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
          <button
            onClick={() => handleSave("institution")}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: savedTab === "institution" ? "#059669" : "#0A2540", color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.2s",
            }}>
            {savedTab === "institution" ? <Check size={13} /> : <Save size={13} />}
            {savedTab === "institution" ? "Saved" : "Save Profile"}
          </button>
        </SectionCard>
      )}

      {/* ── CRITERIA ── */}
      {tab === "criteria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionCard title="Financial Thresholds" sub="Minimum requirements for businesses to appear in your discovery feed.">
            <div className="fnc-set-three-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
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
          <SectionCard title="Target Sectors" sub="Which business sectors do you want to see? Select all that apply.">
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, paddingRight: 4 }}>
              {SECTORS.map(s => {
                const selected = criteria.selected_sectors.includes(s);
                return (
                  <button key={s} onClick={() => toggleItem("selected_sectors", s)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8,
                    border: `1px solid ${selected ? "rgba(10,37,64,0.15)" : "transparent"}`,
                    background: selected ? "#F8FAFC" : "transparent",
                    cursor: "pointer", textAlign: "left" as const,
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${selected ? "#0A2540" : "#D1D5DB"}`,
                      background: selected ? "#0A2540" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: selected ? "#0A2540" : "#374151", fontWeight: selected ? 600 : 400 }}>{s}</span>
                  </button>
                );
              })}
            </div>
            {criteria.selected_sectors.length > 0 && (
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
                {criteria.selected_sectors.length} sector{criteria.selected_sectors.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </SectionCard>
          <button
            onClick={() => handleSave("criteria")}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: savedTab === "criteria" ? "#059669" : "#0A2540", color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
              transition: "background 0.2s",
            }}>
            {savedTab === "criteria" ? <Check size={13} /> : <Save size={13} />}
            {savedTab === "criteria" ? "Saved" : "Save Criteria"}
          </button>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === "team" && (
        <TeamTab currentUserId={CURRENT_USER_ID} currentRole={currentUserRole} />
      )}

      {/* ── WORKFLOW ── */}
      {tab === "workflow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Explainer */}
          <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0E7490", marginBottom: 4 }}>Approval Workflow</p>
            <p style={{ fontSize: 12, color: "#0891B2", lineHeight: 1.6 }}>
              Configure how financing decisions move through your organisation. Different institutions operate differently —
              some require all deals to go through a team lead, others allow analysts to work directly with principals.
              These settings apply org-wide. Per-member overrides can be set in the Team tab.
            </p>
          </div>

          {/* Approval chain */}
          <SectionCard title="Approval Chain" sub="How does a financing recommendation move from origination to final approval?">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                { value: "analyst_to_lead",            label: "Analyst → Team Lead",                        desc: "Analyst submits recommendation to their team lead. Team lead approves or rejects. Standard for most teams." },
                { value: "analyst_to_lead_to_principal",label: "Analyst → Team Lead → Principal",            desc: "Two-tier review. Team lead reviews first, then escalates large or complex deals to the Principal for final sign-off." },
                { value: "direct_to_lead",              label: "Direct to Team Lead (no analyst review)",    desc: "Team lead handles all reviews directly. Suitable for small teams or when analysts are not involved in credit decisions." },
                { value: "any_member",                  label: "Any member can approve independently",       desc: "No enforced chain. Each member has autonomous approval authority. Suitable for flat org structures." },
              ] as { value: ApprovalChain; label: string; desc: string }[]).map((opt) => (
                <button key={opt.value} onClick={() => setWorkflow(w => ({ ...w, approval_chain: opt.value }))}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", border: `1.5px solid ${workflow.approval_chain === opt.value ? "#0A2540" : "#E5E7EB"}`, borderRadius: 10, background: workflow.approval_chain === opt.value ? "#F8FAFC" : "white", cursor: "pointer", textAlign: "left" as const }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${workflow.approval_chain === opt.value ? "#0A2540" : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {workflow.approval_chain === opt.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2540" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Report routing */}
          <SectionCard title="Report Routing" sub="When an analyst generates a business report, where does it go by default?">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                { value: "always_analyst",  label: "Always route to Senior Analyst first", desc: "All reports go through a senior analyst for quality check before reaching the team lead." },
                { value: "always_lead",     label: "Always route directly to Team Lead",   desc: "Reports skip analyst review and go straight to the team lead. Faster but less oversight." },
                { value: "per_member",      label: "Configurable per team member",         desc: "Each member's report routing is set individually in the Team tab. Enables mixed workflows." },
              ] as { value: ReportRouting; label: string; desc: string }[]).map((opt) => (
                <button key={opt.value} onClick={() => setWorkflow(w => ({ ...w, report_routing: opt.value }))}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 16px", border: `1.5px solid ${workflow.report_routing === opt.value ? "#0A2540" : "#E5E7EB"}`, borderRadius: 10, background: workflow.report_routing === opt.value ? "#F8FAFC" : "white", cursor: "pointer", textAlign: "left" as const }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${workflow.report_routing === opt.value ? "#0A2540" : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {workflow.report_routing === opt.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2540" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Additional controls */}
          <SectionCard title="Additional Controls" sub="Fine-tune approval behaviour across the organisation.">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Dual approval toggle */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>Require dual approval for large deals</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
                    Deals above the threshold set below require sign-off from both the team lead and the Principal.
                  </p>
                </div>
                <button onClick={() => setWorkflow(w => ({ ...w, require_dual_approval: !w.require_dual_approval }))}
                  style={{ width: 44, height: 24, borderRadius: 12, background: workflow.require_dual_approval ? "#0A2540" : "#E5E7EB", position: "relative", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, left: workflow.require_dual_approval ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                </button>
              </div>

              {/* Dual approval threshold — only shown when toggle is on */}
              {workflow.require_dual_approval && (
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>Dual approval threshold (NGN)</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.5 }}>
                    Deals at or above this amount require both the team lead and the Principal to approve.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      value={workflow.dual_approval_threshold || ""}
                      onChange={e => setWorkflow(w => ({ ...w, dual_approval_threshold: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 50000000"
                      style={{ height: 38, padding: "0 12px", border: "1.5px solid #0A2540", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", width: 220 }}
                      onFocus={e => (e.target.style.borderColor = "#00D4FF")}
                      onBlur={e => (e.target.style.borderColor = "#0A2540")}
                    />
                    {workflow.dual_approval_threshold > 0 && (
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>
                        ₦{workflow.dual_approval_threshold.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Self-approve threshold */}
              <div style={{ opacity: workflow.approval_chain === "any_member" ? 1 : 0.5 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>Analyst self-approval threshold (NGN)</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.5 }}>
                  Analysts can approve deals below this amount without escalation. Set to 0 to disable. Only applies when “Any member” chain is selected.
                </p>
                <input type="number" value={workflow.analyst_can_self_approve_below || ""}
                  onChange={e => setWorkflow(w => ({ ...w, analyst_can_self_approve_below: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 5000000"
                  style={{ height: 38, padding: "0 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", width: 200, background: "white", cursor: "text" }}
                  onFocus={e => (e.target.style.borderColor = "#00D4FF")}
                  onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>₦{workflow.analyst_can_self_approve_below.toLocaleString()}</p>
                {workflow.approval_chain !== "any_member" && (
                  <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={11} /> Switch approval chain to “Any member” to enable this field.
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <button
            onClick={() => handleSave("workflow")}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: savedTab === "workflow" ? "#059669" : "#0A2540", color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
              transition: "background 0.2s",
            }}>
            {savedTab === "workflow" ? <Check size={13} /> : <Save size={13} />}
            {savedTab === "workflow" ? "Saved" : "Save Workflow"}
          </button>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <SectionCard title="Security" sub="Manage your login credentials and session security.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Change Password",          sub: "Update your Creditlinker account password." },
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
