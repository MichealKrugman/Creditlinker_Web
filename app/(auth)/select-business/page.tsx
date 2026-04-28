"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Plus, Clock, Crown,
  Shield, Eye, Building2, ChevronRight, LogOut, Settings,
} from "lucide-react";
import {
  useActiveBusiness,
  type BusinessMembership, type BusinessRole,
} from "@/lib/business-context";

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill={dark ? "rgba(255,255,255,0.08)" : "#0A2540"} />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

const ROLE_CONFIG: Record<BusinessRole, {
  label: string; color: string; bg: string; border: string;
  Icon: React.ComponentType<{ size?: number }>;
}> = {
  owner:  { label: "Owner",  color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA", Icon: Crown  },
  admin:  { label: "Admin",  color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", Icon: Shield },
  viewer: { label: "Viewer", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", Icon: Eye    },
};

function RoleBadge({ role }: { role: BusinessRole }) {
  const cfg = ROLE_CONFIG[role];
  const { Icon } = cfg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const }}>
      <Icon size={9} /> {cfg.label}
    </span>
  );
}

function ScorePill({ score }: { score?: number }) {
  if (!score) return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>No score yet</span>
  );
  const color = score >= 700 ? "#059669" : score >= 600 ? "#D97706" : "#EF4444";
  const bg    = score >= 700 ? "#ECFDF5" : score >= 600 ? "#FFFBEB" : "#FEF2F2";
  const bd    = score >= 700 ? "#A7F3D0" : score >= 600 ? "#FCD34D" : "#FECACA";
  return (
    <span style={{ fontSize: 10, fontWeight: 800, color, background: bg, border: `1px solid ${bd}`, padding: "2px 8px", borderRadius: 9999, letterSpacing: "-0.01em" }}>
      CL {score}
    </span>
  );
}

function SetupBadge({ stage }: { stage: BusinessMembership["setup_stage"] }) {
  if (stage === "complete") return null;
  if (stage === "data_pending") return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "1px solid #FCD34D", padding: "2px 8px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Clock size={9} /> Connect data
    </span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 9999 }}>Just created</span>
  );
}

function BusinessCard({ biz, onSelect, isSelecting }: {
  biz: BusinessMembership;
  onSelect: () => void;
  isSelecting: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isSelecting}
      style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", borderRadius: 12, border: `1.5px solid ${hovered ? "#0A2540" : "#E5E7EB"}`, background: hovered ? "#FAFAFA" : "white", cursor: isSelecting ? "not-allowed" : "pointer", textAlign: "left" as const, transition: "all 0.15s", boxShadow: hovered ? "0 4px 16px rgba(10,37,64,0.06)" : "none", opacity: isSelecting ? 0.6 : 1 }}
    >
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0, background: biz.avatarGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", fontFamily: "var(--font-display)" }}>
        {biz.initials}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as const }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{biz.name}</p>
          <RoleBadge role={biz.role} />
          {biz.setup_stage !== "complete" && <SetupBadge stage={biz.setup_stage} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{biz.sector}</span>
          {biz.branch_count > 0 && (
            <><span style={{ width: 3, height: 3, borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{biz.branch_count} location{biz.branch_count !== 1 ? "s" : ""}</span></>
          )}
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Active {biz.last_active}</span>
        </div>
      </div>

      {/* Score + arrow */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <ScorePill score={biz.cl_score} />
        {isSelecting
          ? <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 1s linear infinite" }}><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><circle cx="7" cy="7" r="5.5" stroke="#0A2540" strokeWidth="2" strokeDasharray="10 25" fill="none" /></svg>
          : <ArrowRight size={14} style={{ color: hovered ? "#0A2540" : "#D1D5DB", transition: "color 0.15s" }} />
        }
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SelectBusinessPage() {
  const router = useRouter();
  const { memberships, currentUser, switchBusiness, isLoading, error } = useActiveBusiness();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (businessId: string) => {
    setSelecting(businessId);
    await switchBusiness(businessId);
    router.push("/dashboard");
  };

  return (
    <>
      <style>{`
        .sb-root { min-height: 100vh; display: grid; grid-template-columns: 420px 1fr; background: #fff; }
        @media (max-width: 860px) { .sb-root { grid-template-columns: 1fr; } .sb-dark { display: none !important; } .sb-right { padding: 40px 24px !important; } }
        @keyframes sb-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .sb-animate { animation: sb-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="sb-root">
        {/* ── LEFT PANEL ── */}
        <div className="sb-dark" style={{ background: "#0A2540", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 56px", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <div aria-hidden style={{ position: "absolute", bottom: "-80px", left: "-80px", width: 380, height: 380, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} dark />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "white", letterSpacing: "-0.03em" }}>Creditlinker</span>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #00D4FF, transparent)", marginBottom: 24, borderRadius: 2 }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "white", letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 16 }}>
              One account.<br />Every business<br />you run.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 270 }}>
              Your login belongs to you. Financial identities, scores, and data belong to each business independently.
            </p>
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { dot: "#00D4FF", text: "One login across all your businesses" },
                { dot: "#10B981", text: "Each business has its own financial identity" },
                { dot: "#818CF8", text: "Credit data never mixes between businesses" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{item.text}</p>
                </div>
              ))}
            </div>
            {/* Logged-in user */}
            <div style={{ marginTop: 32, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#00D4FF", flexShrink: 0 }}>
            {currentUser.initials || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{currentUser.full_name || 'Loading...'}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{currentUser.email}</p>
            </div>
              <Link href="/login" style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <LogOut size={10} /> Sign out
              </Link>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>All data is encrypted in transit and at rest.<br />Access is governed by explicit consent.</p>
          </div>
        </div>

        {/* ── RIGHT: BUSINESS LIST ── */}
        <div className="sb-right sb-animate" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "56px 48px", background: "white" }}>
          <div style={{ maxWidth: 520, width: "100%" }}>

            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 8 }}>Select a business</h1>
              <p style={{ fontSize: 14, color: "#6B7280" }}>You have access to {memberships.length} business{memberships.length !== 1 ? 'es' : ''}. Choose one to continue.</p>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {isLoading
                ? [1, 2, 3].map(i => (
                    <div key={i} style={{ height: 82, borderRadius: 12, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />
                  ))
                : memberships.map(biz => (
                    <BusinessCard
                      key={biz.business_id}
                      biz={biz}
                      isSelecting={selecting === biz.business_id}
                      onSelect={() => handleSelect(biz.business_id)}
                    />
                  ))
              }
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            </div>

            <Link href="/new-business"
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "18px 20px", borderRadius: 12, border: "2px dashed #E5E7EB", background: "none", cursor: "pointer", textDecoration: "none", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Plus size={20} style={{ color: "#6B7280" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>Add a new business</p>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>Create a separate financial identity for a new business entity.</p>
              </div>
              <ChevronRight size={16} style={{ color: "#D1D5DB", flexShrink: 0 }} />
            </Link>

            <div style={{ marginTop: 28, padding: "14px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Building2 size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
                  <strong style={{ color: "#0A2540" }}>Why separate businesses?</strong> Each business has its own transactions, financial identity, branches, and credit score. Adding a second business doesn't affect the first one's data.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9CA3AF", textDecoration: "none" }}>
                <Settings size={11} /> Account settings
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
