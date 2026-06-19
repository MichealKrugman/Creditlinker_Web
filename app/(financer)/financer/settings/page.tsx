"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Building2, Shield, Target, Save, Users,
  Plus, MoreHorizontal, Mail, ChevronDown,
  Crown, UserCheck, User, UserX, X, Check,
  AlertCircle, RefreshCw, GitBranch, Settings2,
  Plug, Key, Copy, Trash2, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/lib/mobile-nav-context";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type OrgRole = "owner" | "admin" | "team_lead" | "analyst";
type Tab = "institution" | "criteria" | "workflow" | "security" | "team" | "integrations";

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
   MOCK DATA — fallback only, real data loads from Supabase
───────────────────────────────────────────────────────── */

const CURRENT_USER_ID = "";

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

  const triggerBtn = (ref?: React.RefObject<HTMLButtonElement | null>) => (
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

function formatSettingsNGN(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `₦${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000)         return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toLocaleString()}`;
}

/* ─────────────────────────────────────────────────────────
   TEAM TAB
───────────────────────────────────────────────────────── */
function TeamTab({ currentUserId, currentRole, institutionId }: { currentUserId: string; currentRole: OrgRole; institutionId: string | null }) {
  const [members, setMembers] = useState<typeof MEMBERS_INIT>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    setLoadingMembers(true);
    async function loadMembers() {
      const [membersRes, recordsRes] = await Promise.all([
        supabase
          .from("institution_members")
          .select("id, user_id, full_name, email, role, team_lead_id, is_active, workflow_override, created_at")
          .eq("institution_id", institutionId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("financing_records")
          .select("financing_id, created_by_member_id, terms, status")
          .eq("institution_id", institutionId!),
      ]);

      if (membersRes.error) { console.error("TeamTab load error:", membersRes.error.message); }

      const rawRecords = recordsRes.data ?? [];

      const getPortfolio = (memberId: string) =>
        rawRecords
          .filter(r => r.created_by_member_id === memberId && (r.status === "active" || r.status === "settled"))
          .reduce((s: number, r: any) => s + (r.terms?.financing_amount ?? r.terms?.amount ?? 0), 0);

      const getRequests = (memberId: string) =>
        rawRecords.filter(r => r.created_by_member_id === memberId && r.status === "active").length;

      if (membersRes.data && membersRes.data.length > 0) {
        setMembers(membersRes.data.map(m => ({
          id: m.id,
          name: m.full_name && m.full_name !== m.email ? m.full_name : (m.email?.split("@")[0] ?? "Member"),
          email: m.email ?? "",
          role: m.role as OrgRole,
          team_lead_id: m.team_lead_id ?? null,
          joined: new Date(m.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
          active_requests: getRequests(m.id),
          active_portfolio: getPortfolio(m.id) > 0 ? formatSettingsNGN(getPortfolio(m.id)) : "₦0",
          is_active: m.is_active ?? true,
          workflow_override: m.workflow_override ?? null,
        })));
      } else {
        setMembers([]);
      }
      setLoadingMembers(false);
    }
    loadMembers();
  }, [institutionId]);
  const [showInvite, setShowInvite] = useState(false);
  const [filter, setFilter] = useState<"all" | OrgRole>("all");

  const filtered = filter === "all" ? members : members.filter(m => m.role === filter);

  const updateMember = async (id: string, patch: Partial<typeof MEMBERS_INIT[0]>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    const dbPatch: Record<string, unknown> = {};
    if (patch.role !== undefined)              dbPatch.role = patch.role;
    if (patch.team_lead_id !== undefined)      dbPatch.team_lead_id = patch.team_lead_id;
    if (patch.is_active !== undefined)         dbPatch.is_active = patch.is_active;
    if (patch.workflow_override !== undefined) dbPatch.workflow_override = patch.workflow_override;
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from("institution_members").update(dbPatch).eq("id", id);
    }
  };

  const inviteMember = async (email: string, role: OrgRole) => {
    if (!institutionId) return;
    const tempId = `pending_${Date.now()}`;
    setMembers(prev => [...prev, {
      id: tempId, name: email.split("@")[0], email, role,
      team_lead_id: null, joined: "Pending",
      active_requests: 0, active_portfolio: "₦0",
      is_active: false, workflow_override: null,
    }]);
    await supabase.from("institution_invitations").insert({
      institution_id: institutionId,
      email,
      role,
      invited_by: (await supabase.auth.getUser()).data.user?.id,
    });
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
          {loadingMembers ? (
            <div style={{ padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Loader2 size={18} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading team members…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" as const }}>
              <Users size={24} style={{ color: "#E5E7EB", marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No members found</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>Invite your first team member to get started.</p>
            </div>
          ) : (
            filtered.map((m, i) => (
              <div key={m.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <MemberRow member={m} members={members} currentUserId={currentUserId} currentRole={currentRole} onUpdate={updateMember} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   INTEGRATIONS TAB
───────────────────────────────────────────────────────── */
type DevAccount = {
  id: string;
  status: string;
  api_key_count: number;
  api_calls_30d: number;
  created_at: string;
};

type ApiKey = {
  id: string;
  label: string;
  key_prefix: string;
  environment: "live" | "test";
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title="Copy"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 6,
        border: "1px solid #E5E7EB", background: "white",
        cursor: "pointer", color: copied ? "#10B981" : "#9CA3AF",
        transition: "all 0.12s",
      }}
    >
      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
    </button>
  );
}

function KeyRow({ apiKey, onRevoke, onDelete }: {
  apiKey: ApiKey;
  onRevoke: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const isRevoked = !apiKey.is_active;
  const masked = apiKey.key_prefix + "•".repeat(24);

  return (
    <div style={{
      padding: "14px 20px", borderBottom: "1px solid #F3F4F6",
      opacity: isRevoked ? 0.55 : 1, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: isRevoked ? "#F3F4F6" : "rgba(0,212,255,0.06)",
          border: `1px solid ${isRevoked ? "#E5E7EB" : "rgba(0,212,255,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isRevoked ? "#9CA3AF" : "#0A5060",
        }}>
          <Key size={14} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{apiKey.label}</span>
            <Badge variant={apiKey.environment === "test" ? "warning" : "success"} style={{ fontSize: 9, padding: "1px 6px" }}>
              {apiKey.environment}
            </Badge>
            {isRevoked && <Badge variant="destructive" style={{ fontSize: 9, padding: "1px 6px" }}>Revoked</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <code style={{
              fontSize: 12, fontFamily: "var(--font-mono, 'Courier New', monospace)",
              color: "#374151", background: "#F3F4F6",
              padding: "3px 8px", borderRadius: 5, letterSpacing: "0.04em", wordBreak: "break-all",
            }}>
              {masked}
            </code>
            {!isRevoked && <CopyBtn text={apiKey.key_prefix} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} /> Created {new Date(apiKey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {apiKey.last_used_at
              ? <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={10} /> Last used {new Date(apiKey.last_used_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              : !isRevoked && <span style={{ fontSize: 11, color: "#D1D5DB" }}>Never used</span>
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {!isRevoked && (
            <button
              disabled={busy}
              onClick={async () => { setBusy(true); await onRevoke(apiKey.id); setBusy(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 7,
                border: "1px solid #FCA5A5", background: "white", color: "#EF4444",
                fontSize: 12, fontWeight: 600, cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1, transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              {busy ? <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={11} />}
              {busy ? "Revoking…" : "Revoke"}
            </button>
          )}
          {isRevoked && (
            <button
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Permanently delete "${apiKey.label}"?`)) return;
                setBusy(true); await onDelete(apiKey.id); setBusy(false);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 7,
                border: "1px solid #E5E7EB", background: "white", color: "#6B7280",
                fontSize: 12, fontWeight: 600, cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1, transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!busy) { const el = e.currentTarget as HTMLElement; el.style.background = "#FEF2F2"; el.style.color = "#EF4444"; el.style.borderColor = "#FCA5A5"; } }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "white"; el.style.color = "#6B7280"; el.style.borderColor = "#E5E7EB"; }}
            >
              {busy ? <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={11} />}
              {busy ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewKeyModal({ fullKey, onDismiss }: { fullKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "white", borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        width: "100%", maxWidth: 500, margin: "0 16px", overflow: "hidden",
      }}>
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={17} style={{ color: "#10B981" }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", letterSpacing: "-0.02em" }}>API Key Created</p>
              <p style={{ fontSize: 12, color: "#6B7280" }}>Copy it now — it will not be shown again</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ padding: "14px 16px", background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" as const }}>Your API Key</p>
            <code style={{ display: "block", fontSize: 13, fontFamily: "var(--font-mono, 'Courier New', monospace)", color: "#0A2540", wordBreak: "break-all", lineHeight: 1.6 }}>
              {fullKey}
            </code>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(fullKey); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 16px", borderRadius: 9,
              border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "#D1D5DB"}`,
              background: copied ? "#ECFDF5" : "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: copied ? "#10B981" : "#374151", transition: "all 0.15s",
            }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Key"}
          </button>
          <div style={{ marginTop: 14, padding: "12px 14px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 9, display: "flex", gap: 10 }}>
            <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>This key will <strong>not</strong> be shown again. If you lose it, revoke it and generate a new one.</p>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: "#0A2540", width: 15, height: 15 }} />
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>I have copied and saved my API key in a secure location</span>
          </label>
        </div>
        <div style={{ padding: "0 24px 22px" }}>
          <button
            onClick={onDismiss} disabled={!confirmed}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: 9, border: "none",
              background: confirmed ? "#0A2540" : "#E5E7EB",
              color: confirmed ? "white" : "#9CA3AF",
              fontSize: 14, fontWeight: 700, cursor: confirmed ? "pointer" : "default", transition: "all 0.15s",
            }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}

function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", width: "100%", maxWidth: 440, overflow: "hidden", margin: "0 16px" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>Create API Key</h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Scoped to institutional endpoints only. Environment is determined by the host.</p>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Key label</label>
          <input
            value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Core Banking Integration"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }}
            onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
          />
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
          <button
            disabled={!label.trim() || saving}
            onClick={async () => { if (!label.trim()) return; setSaving(true); await onCreate(label.trim()); setSaving(false); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: label.trim() && !saving ? "#0A2540" : "#E5E7EB",
              color: label.trim() && !saving ? "white" : "#9CA3AF",
              fontSize: 13, fontWeight: 600, cursor: label.trim() && !saving ? "pointer" : "default",
            }}
          >
            {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Key size={13} />}
            {saving ? "Creating…" : "Create Key"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const { user } = useSession();
  const [institutionId,   setInstitutionId]   = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string>("");
  const [devAccount,   setDevAccount]   = useState<DevAccount | null>(null);
  const [keys,         setKeys]         = useState<ApiKey[]>([]);
  const [loadingAcct,  setLoadingAcct]  = useState(true);
  const [loadingKeys,  setLoadingKeys]  = useState(false);
  const [enabling,     setEnabling]     = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [newKeyFull,   setNewKeyFull]   = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  /* ── load institution + developer account in one sequential shot ──
     Both steps run in the same effect so loadingAcct is always cleared,
     even if the institution query returns no data or an error.
  ── */
  useEffect(() => {
    if (!user) return;

    async function load() {
      // Step 1: resolve institution
      const instId = await getMyInstitutionId(user!.id);
      if (!instId) {
        setError("No institution is linked to your account. Contact your administrator.");
        setLoadingAcct(false);
        return;
      }

      const { data: inst, error: instErr } = await supabase
        .from("institutions")
        .select("institution_id, name")
        .eq("institution_id", instId)
        .maybeSingle();

      if (instErr) {
        setError(instErr.message);
        setLoadingAcct(false);
        return;
      }

      if (!inst) {
        setError("No institution is linked to your account. Contact your administrator.");
        setLoadingAcct(false);
        return;
      }

      setInstitutionId(inst.institution_id);
      setInstitutionName(inst.name);

      // Step 2: check for existing developer account
      const { data: devAcct, error: devErr } = await supabase
        .from("developer_accounts")
        .select("id, status, api_key_count, api_calls_30d, created_at")
        .eq("institution_id", inst.institution_id)
        .eq("account_type", "institutional")
        .maybeSingle();

      if (devErr) setError(devErr.message);
      else setDevAccount(devAcct ?? null);
      setLoadingAcct(false);
    }

    load();
  }, [user]);

  /* ── load keys once developer account is known ── */
  const loadKeys = useCallback(async (devId: string) => {
    setLoadingKeys(true);
    const { data, error } = await supabase
      .from("developer_api_keys")
      .select("id, label, key_prefix, environment, is_active, last_used_at, created_at")
      .eq("developer_id", devId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setKeys(data ?? []);
    setLoadingKeys(false);
  }, []);

  useEffect(() => {
    if (devAccount) loadKeys(devAccount.id);
  }, [devAccount, loadKeys]);

  /* ── enable API access — creates developer_accounts row ── */
  async function handleEnable() {
    setEnabling(true);
    setError(null);
    const { data, error } = await supabase
      .from("developer_accounts")
      .insert({
        name: institutionName,
        email: user?.email ?? "",
        status: "active",
        tier: "read",
        account_type: "institutional",
        institution_id: institutionId,
      })
      .select("id, status, api_key_count, api_calls_30d, created_at")
      .single();
    if (error) { setError(error.message); setEnabling(false); return; }
    setDevAccount(data);
    setEnabling(false);
  }

  /* ── create key ── */
  async function handleCreate(label: string) {
    if (!devAccount) return;
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Session expired. Please sign in again.'); return; }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-financer-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: 'generate-api-key', label }),
      }
    );

    const result = await res.json();
    if (!res.ok || !result.success) {
      setError(result.error ?? 'Failed to create API key');
      return;
    }

    setNewKeyFull(result.key);
    await loadKeys(devAccount.id);
  }

  /* ── revoke ── */
  async function handleRevoke(id: string) {
    const { error } = await supabase.from("developer_api_keys").update({ is_active: false }).eq("id", id);
    if (error) { setError(error.message); return; }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  }

  /* ── delete ── */
  async function handleDelete(id: string) {
    const { error } = await supabase.from("developer_api_keys").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  const activeKeys  = keys.filter(k =>  k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  /* ── loading state ── */
  if (loadingAcct) {
    return (
      <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  /* ── locked / opt-in state ── */
  if (!devAccount) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
          padding: "40px 32px", textAlign: "center" as const,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plug size={24} style={{ color: "#0A5060" }} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Connect your systems to Creditlinker
            </p>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 440 }}>
              Enable API access to integrate Creditlinker directly into your credit workflow.
              Query consented business scores, verify identities, and confirm settlements — all programmatically.
            </p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "Institution Query", desc: "Read consented business data" },
              { label: "Discovery Match",   desc: "Programmatic business discovery" },
              { label: "Confirm Settlement",desc: "Record financing outcomes via API" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" as const }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {error && (
            <div style={{ padding: "10px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#DC2626", width: "100%", boxSizing: "border-box" as const }}>
              {error}
            </div>
          )}
          <button
            onClick={handleEnable} disabled={enabling}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 28px", borderRadius: 10, border: "none",
              background: enabling ? "#E5E7EB" : "#0A2540",
              color: enabling ? "#9CA3AF" : "white",
              fontSize: 14, fontWeight: 700, cursor: enabling ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {enabling
              ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Enabling…</>
              : <><Plug size={14} /> Enable API Access</>
            }
          </button>
        </div>
      </div>
    );
  }

  /* ── enabled state ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {newKeyFull && <NewKeyModal fullKey={newKeyFull} onDismiss={() => setNewKeyFull(null)} />}
      {showCreate && <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {/* Status strip */}
      <div style={{
        background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 22px",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "1px solid #F3F4F6",
        }}>
          {[
            { label: "Status",        value: devAccount.status === "active" ? "Active" : devAccount.status, color: devAccount.status === "active" ? "#10B981" : "#F59E0B" },
            { label: "Active Keys",   value: String(activeKeys.length), color: "#0A2540" },
            { label: "API Calls (30d)",value: devAccount.api_calls_30d.toLocaleString(), color: "#0A2540" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: "4px 0", borderRight: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", paddingRight: i < arr.length - 1 ? 20 : 0, paddingLeft: i > 0 ? 20 : 0 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: s.color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* Active keys */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} style={{ color: "#0A2540" }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Active Keys</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge variant="secondary">{activeKeys.length} key{activeKeys.length !== 1 ? "s" : ""}</Badge>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7, border: "none",
                background: "#0A2540", color: "white",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={12} /> New Key
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          {loadingKeys ? (
            <div style={{ padding: "32px", textAlign: "center" as const }}>
              <Loader2 size={20} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : activeKeys.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" as const }}>
              <Key size={24} style={{ color: "#D1D5DB", marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No active keys</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>Create your first API key to start integrating.</p>
            </div>
          ) : (
            activeKeys.map(k => <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} onDelete={handleDelete} />)
          )}
        </div>
      </div>

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Revoked Keys</p>
          </div>
          <div style={{ marginTop: 12 }}>
            {revokedKeys.map(k => <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      {/* Endpoint reference */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 14 }}>Available Endpoints</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { method: "GET",  path: "/institution/query",       desc: "Query consented business score, identity, and risk flags" },
            { method: "GET",  path: "/institution/discovery",   desc: "Retrieve discovery matches for your institution" },
            { method: "POST", path: "/institution/settlement",  desc: "Confirm and record a financing settlement" },
          ].map(ep => (
            <div key={ep.path} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                color: ep.method === "GET" ? "#0891B2" : "#7C3AED",
                background: ep.method === "GET" ? "rgba(8,145,178,0.08)" : "rgba(124,58,237,0.08)",
                padding: "2px 7px", borderRadius: 5, flexShrink: 0, marginTop: 1,
              }}>
                {ep.method}
              </span>
              <div style={{ minWidth: 0 }}>
                <code style={{ fontSize: 12, fontFamily: "var(--font-mono, 'Courier New', monospace)", color: "#0A2540", display: "block", marginBottom: 2 }}>{ep.path}</code>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECURITY TAB
───────────────────────────────────────────────────────── */
function SecurityTab({ user }: { user: { email?: string } | null }) {
  // ─ Change Password ─
  const [showPwForm,  setShowPwForm]  = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [pwSaving,     setPwSaving]     = useState(false);
  const [pwMsg,        setPwMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  async function handleChangePassword() {
    if (!currentPw)          { setPwMsg({ ok: false, text: "Please enter your current password." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Passwords do not match." }); return; }
    if (newPw.length < 8)    { setPwMsg({ ok: false, text: "New password must be at least 8 characters." }); return; }
    if (newPw === currentPw) { setPwMsg({ ok: false, text: "New password must be different from your current password." }); return; }
    setPwSaving(true); setPwMsg(null);
    // Verify current password by re-authenticating first
    const email = user?.email ?? "";
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (signInErr) {
      setPwMsg({ ok: false, text: "Current password is incorrect." });
      setPwSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwMsg({ ok: false, text: error.message }); }
    else       { setPwMsg({ ok: true, text: "Password updated successfully." }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPwForm(false); }
    setPwSaving(false);
  }

  // ─ 2FA ─
  const [show2FA,      setShow2FA]      = useState(false);
  const [mfaFactors,   setMfaFactors]   = useState<{ id: string; type: string; status: string; friendly_name?: string }[]>([]);
  const [mfaLoading,   setMfaLoading]   = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaQR,        setMfaQR]        = useState<{ qr: string; secret: string; factorId: string } | null>(null);
  const [mfaCode,      setMfaCode]      = useState("");
  const [mfaMsg,       setMfaMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  async function loadFactors() {
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) setMfaFactors([...data.totp, ...data.phone]);
    setMfaLoading(false);
  }

  async function startEnroll() {
    setMfaEnrolling(true); setMfaMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app" });
    if (error || !data) { setMfaMsg({ ok: false, text: error?.message ?? "Could not start 2FA setup." }); setMfaEnrolling(false); return; }
    setMfaQR({ qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id });
    setMfaEnrolling(false);
  }

  async function verifyEnroll() {
    if (!mfaQR) return;
    setMfaEnrolling(true); setMfaMsg(null);
    const challengeRes = await supabase.auth.mfa.challenge({ factorId: mfaQR.factorId });
    if (challengeRes.error) { setMfaMsg({ ok: false, text: challengeRes.error.message }); setMfaEnrolling(false); return; }
    const verifyRes = await supabase.auth.mfa.verify({ factorId: mfaQR.factorId, challengeId: challengeRes.data.id, code: mfaCode });
    if (verifyRes.error) { setMfaMsg({ ok: false, text: verifyRes.error.message }); setMfaEnrolling(false); return; }
    setMfaMsg({ ok: true, text: "Two-factor authentication enabled." });
    setMfaQR(null); setMfaCode("");
    await loadFactors();
    setMfaEnrolling(false);
  }

  async function unenrollFactor(id: string) {
    setMfaMsg(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { setMfaMsg({ ok: false, text: error.message }); return; }
    setMfaMsg({ ok: true, text: "2FA removed." });
    await loadFactors();
  }

  // ─ Sessions ─
  const [showSessions,   setShowSessions]   = useState(false);
  const [sessionMsg,     setSessionMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [signingOut,     setSigningOut]     = useState(false);

  async function revokeOtherSessions() {
    setSigningOut(true); setSessionMsg(null);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) setSessionMsg({ ok: false, text: error.message });
    else       setSessionMsg({ ok: true, text: "All other sessions have been signed out." });
    setSigningOut(false);
  }

  const btnStyle = (danger = false): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 8,
    border: danger ? "1px solid #FCA5A5" : "1px solid #E5E7EB",
    background: "white",
    fontSize: 12, fontWeight: 600,
    color: danger ? "#EF4444" : "#0A2540",
    cursor: "pointer",
  });

  const msgBanner = (msg: { ok: boolean; text: string }) => (
    <p style={{ fontSize: 12, color: msg.ok ? "#059669" : "#DC2626", marginTop: 8,
      background: msg.ok ? "#ECFDF5" : "#FEF2F2", padding: "8px 12px", borderRadius: 7,
      border: `1px solid ${msg.ok ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}` }}>
      {msg.text}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Change Password */}
      <SectionCard title="Change Password" sub="Update your Creditlinker account password.">
        {!showPwForm ? (
          <button style={btnStyle()} onClick={() => setShowPwForm(true)}>Change password</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}>
            <Field label="Current password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="Enter your current password" />
            <Field label="New password"     value={newPw}     onChange={setNewPw}     type="password" placeholder="Min. 8 characters" />
            <Field label="Confirm new password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repeat new password" />
            {pwMsg && msgBanner(pwMsg)}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button style={btnStyle()} onClick={() => { setShowPwForm(false); setPwMsg(null); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>Cancel</button>
              <button
                disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                onClick={handleChangePassword}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: pwSaving || !currentPw || !newPw || !confirmPw ? "#E5E7EB" : "#0A2540", color: pwSaving || !currentPw || !newPw || !confirmPw ? "#9CA3AF" : "white", fontSize: 12, fontWeight: 600, cursor: pwSaving || !currentPw || !newPw || !confirmPw ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {pwSaving ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : "Update password"}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 2FA */}
      <SectionCard title="Two-Factor Authentication" sub="Add a second layer of security using an authenticator app.">
        {!show2FA ? (
          <button style={btnStyle()} onClick={() => { setShow2FA(true); loadFactors(); }}>Manage 2FA</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mfaLoading && <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</p>}

            {/* Enrolled factors */}
            {!mfaLoading && mfaFactors.filter(f => f.status === "verified").map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F9FAFB", borderRadius: 9, border: "1px solid #E5E7EB" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{f.friendly_name ?? "Authenticator app"}</p>
                  <p style={{ fontSize: 11, color: "#10B981" }}>Active</p>
                </div>
                <button style={btnStyle(true)} onClick={() => unenrollFactor(f.id)}>Remove</button>
              </div>
            ))}

            {/* Enroll QR step */}
            {mfaQR && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>Scan this QR code with your authenticator app, then enter the 6-digit code below to confirm.</p>
                <img src={mfaQR.qr} alt="2FA QR code" style={{ width: 160, height: 160, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Or enter manually: <code style={{ fontSize: 11, color: "#0A2540" }}>{mfaQR.secret}</code></p>
                <Field label="Verification code" value={mfaCode} onChange={setMfaCode} placeholder="6-digit code" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnStyle()} onClick={() => { setMfaQR(null); setMfaCode(""); }}>Cancel</button>
                  <button
                    disabled={mfaEnrolling || mfaCode.length !== 6}
                    onClick={verifyEnroll}
                    style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: mfaEnrolling || mfaCode.length !== 6 ? "#E5E7EB" : "#0A2540", color: mfaEnrolling || mfaCode.length !== 6 ? "#9CA3AF" : "white", fontSize: 12, fontWeight: 600, cursor: mfaEnrolling || mfaCode.length !== 6 ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {mfaEnrolling ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Verifying…</> : "Verify & enable"}
                  </button>
                </div>
              </div>
            )}

            {/* Start enroll button */}
            {!mfaQR && !mfaLoading && mfaFactors.filter(f => f.status === "verified").length === 0 && (
              <button
                disabled={mfaEnrolling}
                onClick={startEnroll}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: mfaEnrolling ? "#E5E7EB" : "#0A2540", color: mfaEnrolling ? "#9CA3AF" : "white", fontSize: 12, fontWeight: 600, cursor: mfaEnrolling ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
                {mfaEnrolling ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Setting up…</> : "Set up authenticator app"}
              </button>
            )}

            {mfaMsg && msgBanner(mfaMsg)}
            <button style={{ ...btnStyle(), alignSelf: "flex-start" as const }} onClick={() => { setShow2FA(false); setMfaMsg(null); setMfaQR(null); }}>Done</button>
          </div>
        )}
      </SectionCard>

      {/* Active sessions */}
      <SectionCard title="Active Sessions" sub="Your current session and the option to sign out everywhere else.">
        {!showSessions ? (
          <button style={btnStyle()} onClick={() => setShowSessions(true)}>Manage sessions</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 9, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>Current session</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>{user?.email ?? "Unknown"} · This device</p>
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Signing out other sessions will immediately invalidate any other active logins on other devices or browsers.</p>
            {sessionMsg && msgBanner(sessionMsg)}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnStyle()} onClick={() => { setShowSessions(false); setSessionMsg(null); }}>Close</button>
              <button
                disabled={signingOut}
                onClick={revokeOtherSessions}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: "white", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: signingOut ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: signingOut ? 0.6 : 1 }}>
                {signingOut ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Signing out…</> : "Sign out all other sessions"}
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerSettings() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("institution");
  const [savedTab, setSavedTab] = useState<Tab | null>(null);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string>(CURRENT_USER_ID);
  const [currentUserRole, setCurrentUserRole] = useState<OrgRole>("analyst");
  const [loadingInst, setLoadingInst] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    description: "",
  });

  const [criteria, setCriteria] = useState({
    min_score: "650",
    min_data_months: "6",
    selected_capital: [] as string[],
    selected_sectors: [] as string[],
    max_exposure: "",
  });

  const [workflow, setWorkflow] = useState<WorkflowConfig>({
    approval_chain: "analyst_to_lead",
    report_routing: "per_member",
    require_dual_approval: false,
    dual_approval_threshold: 0,
    analyst_can_self_approve_below: 0,
  });

  // Load institution + current member on mount
  useEffect(() => {
    if (!user) return;
    async function load() {
      // 1. institution row
      const instId = await getMyInstitutionId(user!.id);
      if (!instId) { setLoadingInst(false); return; }
      setInstitutionId(instId);

      const { data: inst } = await supabase
        .from("institutions")
        .select("institution_id, name, website, contact_name, contact_email, description, min_score, min_data_months, max_exposure, target_sectors, capital_categories, workflow_config")
        .eq("institution_id", instId)
        .maybeSingle();

      if (inst) {
        setProfile({
          name: inst.name ?? "",
          contact_name: inst.contact_name ?? "",
          contact_email: inst.contact_email ?? (user!.email ?? ""),
          contact_phone: "",
          website: inst.website ?? "",
          description: inst.description ?? "",
        });
        setCriteria({
          min_score: String(inst.min_score ?? 650),
          min_data_months: String(inst.min_data_months ?? 6),
          selected_capital: inst.capital_categories ?? [],
          selected_sectors: inst.target_sectors ?? [],
          max_exposure: inst.max_exposure ? String(inst.max_exposure) : "",
        });
        if (inst.workflow_config && Object.keys(inst.workflow_config).length > 0) {
          setWorkflow(wf => ({ ...wf, ...inst.workflow_config }));
        }
      }

      // 2. current member row
      const { data: member } = await supabase
        .from("institution_members")
        .select("id, role")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (member) {
        setCurrentMemberId(member.id);
        setCurrentUserRole(member.role as OrgRole);
      } else {
        // owner hasn't been added as a member yet — treat as owner
        setCurrentUserRole("owner");
      }

      setLoadingInst(false);
    }
    load();
  }, [user]);

  async function handleSave(t: Tab) {
    if (!institutionId) return;
    setSaving(true);
    if (t === "institution") {
      await supabase.from("institutions").update({
        name: profile.name,
        website: profile.website,
        contact_name: profile.contact_name,
        contact_email: profile.contact_email,
        description: profile.description,
      }).eq("institution_id", institutionId);
    }
    if (t === "criteria") {
      await supabase.from("institutions").update({
        min_score: parseInt(criteria.min_score) || null,
        min_data_months: parseInt(criteria.min_data_months) || null,
        max_exposure: criteria.max_exposure ? parseInt(criteria.max_exposure.replace(/[^0-9]/g, "")) : null,
        capital_categories: criteria.selected_capital,
        target_sectors: criteria.selected_sectors,
      }).eq("institution_id", institutionId);
    }
    if (t === "workflow") {
      await supabase.from("institutions").update({
        workflow_config: workflow,
      }).eq("institution_id", institutionId);
    }
    setSaving(false);
    setSavedTab(t);
    setTimeout(() => setSavedTab(null), 2200);
  }

  const toggleItem = (key: "selected_capital" | "selected_sectors", val: string) => {
    setCriteria(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "institution", label: "Institution",       icon: <Building2 size={14} /> },
    { key: "criteria",    label: "Matching Criteria", icon: <Target    size={14} /> },
    { key: "workflow",    label: "Workflow",           icon: <RefreshCw size={14} /> },
    { key: "team",        label: "Team",              icon: <Users     size={14} /> },
    { key: "integrations", label: "Integrations",      icon: <Plug      size={14} /> },
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
        <TeamTab currentUserId={currentMemberId} currentRole={currentUserRole} institutionId={institutionId} />
      )}

      {/* ── WORKFLOW ── */}
      {tab === "workflow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Permission gate — only owner/admin can edit workflow config */}
          {(currentUserRole === "team_lead" || currentUserRole === "analyst") && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10 }}>
              <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#92400E" }}>Only Principals and Admins can change workflow settings. Contact your institution administrator.</p>
            </div>
          )}

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
          <div style={{ opacity: (currentUserRole === "team_lead" || currentUserRole === "analyst") ? 0.5 : 1, pointerEvents: (currentUserRole === "team_lead" || currentUserRole === "analyst") ? "none" : "auto" }}>
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
          </div>{/* end permission wrapper */}

          <button
            disabled={savedTab === "workflow" || currentUserRole === "team_lead" || currentUserRole === "analyst"}
            onClick={() => handleSave("workflow")}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: (savedTab === "workflow") ? "#059669" : (currentUserRole === "team_lead" || currentUserRole === "analyst") ? "#E5E7EB" : "#0A2540",
              color: (currentUserRole === "team_lead" || currentUserRole === "analyst") ? "#9CA3AF" : "white",
              fontSize: 13, fontWeight: 600,
              cursor: (currentUserRole === "team_lead" || currentUserRole === "analyst") ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
              transition: "background 0.2s",
              }}>
              {savedTab === "workflow" ? <Check size={13} /> : <Save size={13} />}
            {savedTab === "workflow" ? "Saved" : "Save Workflow"}
          </button>
        </div>
      )}

      {/* ── INTEGRATIONS ── */}
      {tab === "integrations" && (
        <IntegrationsTab />
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <SecurityTab user={user} />
      )}
    </div>
  );
}
