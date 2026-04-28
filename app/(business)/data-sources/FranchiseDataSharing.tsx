"use client";
// ============================================================
// FranchiseDataSharing — updated component
// Drop this in to replace the existing FranchiseDataSharing
// function in data-sources/page.tsx
//
// Changes vs original:
//   - handleSendInvite now calls /functions/v1/invite-franchise
//   - Permissions checkboxes added to the invite form
//   - Resend invite also calls the edge function
// ============================================================

// NOTE: Add this import at the top of page.tsx alongside the others:
// import { Shield } from "lucide-react";

import { useState } from "react";
import { Lock, Mail, Loader2, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EntityType = "hq" | "branch" | "franchise" | "office" | "warehouse";

const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; color: string; border: string }> = {
  hq:        { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  branch:    { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  franchise: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  office:    { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD" },
  warehouse: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
};

function EntityBadge({ type }: { type: EntityType }) {
  const c = ENTITY_TYPE_COLORS[type];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 9999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14 }}>{children}</div>;
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 0", gap: 12 }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

interface Entity {
  id: string;
  name: string;
  shortName: string;
  type: EntityType;
  location: string;
  has_own_books: boolean;
  data_linked: boolean;
  sharing_consent: boolean;
  invite_email?: string;
  invite_status?: "pending" | "accepted" | "none";
}

const DATA_SHARING_OPTIONS = [
  { key: "bank_transactions",  label: "Bank Transactions",  sub: "Account statements & transaction history" },
  { key: "ledger_data",        label: "Accounting Ledger",  sub: "Uploaded P&L, trial balance, general ledger" },
  { key: "financial_metrics",  label: "Financial Metrics",  sub: "Scores, ratios, and computed metrics" },
  { key: "credit_score",       label: "Credit Score",       sub: "Creditlinker score and rating" },
];

function FranchiseDataSharing({
  franchises,
  businessId,
  supabaseUrl,
  authToken,
}: {
  franchises:   Entity[];
  businessId:   string;
  supabaseUrl:  string;
  authToken:    string;
}) {
  const [inviteEmail,   setInviteEmail]   = useState<Record<string, string>>({});
  const [permissions,   setPermissions]   = useState<Record<string, Record<string, boolean>>>({});
  const [sending,       setSending]       = useState<Record<string, boolean>>({});
  const [sentFor,       setSentFor]       = useState<Set<string>>(new Set());
  const [error,         setError]         = useState<Record<string, string>>({});

  const getPerms = (entityId: string): Record<string, boolean> =>
    permissions[entityId] ?? {
      bank_transactions: true,
      ledger_data:       true,
      financial_metrics: true,
      credit_score:      false,
    };

  const togglePerm = (entityId: string, key: string) => {
    setPermissions(prev => ({
      ...prev,
      [entityId]: { ...getPerms(entityId), [key]: !getPerms(entityId)[key] },
    }));
  };

  const handleSendInvite = async (entity: Entity, resend = false) => {
    const email = resend ? entity.invite_email : inviteEmail[entity.id]?.trim();
    if (!email) return;

    setSending(s => ({ ...s, [entity.id]: true }));
    setError(e => ({ ...e, [entity.id]: "" }));

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/invite-franchise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          business_id:           businessId,
          branch_id:             entity.id,
          invited_email:         email,
          requested_permissions: getPerms(entity.id),
        }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 409) {
        setError(e => ({ ...e, [entity.id]: data.error ?? "Failed to send invitation" }));
      } else {
        setSentFor(s => new Set(s).add(entity.id));
      }
    } catch {
      setError(e => ({ ...e, [entity.id]: "Network error — please try again" }));
    } finally {
      setSending(s => ({ ...s, [entity.id]: false }));
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Franchise Data Sharing"
        sub="Franchises operate their own books. They must consent to share financial data with this account."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9CA3AF" }}>
            <Lock size={11} />
            Separate legal entities
          </div>
        }
      />
      <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { step: "1", title: "Send invitation",  sub: "Enter the franchise's email and choose what data to request. They'll receive a message in Creditlinker." },
            { step: "2", title: "They choose",       sub: "The franchise reviews your request and selects exactly what they're comfortable sharing." },
            { step: "3", title: "Data flows in",     sub: "Their approved data appears in consolidated view and can be analysed separately." },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#F9FAFB", borderRadius: 9, border: "1px solid #F3F4F6" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "white" }}>{s.step}</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {franchises.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center" as const, border: "2px dashed #E5E7EB", borderRadius: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ENTITY_TYPE_COLORS.franchise.bg, border: `1px solid ${ENTITY_TYPE_COLORS.franchise.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Lock size={18} style={{ color: ENTITY_TYPE_COLORS.franchise.color }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 6 }}>No franchise entities yet</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
              Franchise entities are added when you set up your business branches. Once a branch is marked as a franchise, it will appear here.
            </p>
          </div>
        ) : (
          <div style={{ borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {franchises.map((entity, i) => {
              const justSent  = sentFor.has(entity.id);
              const isSending = sending[entity.id];
              const perms     = getPerms(entity.id);
              const entityErr = error[entity.id];

              return (
                <div key={entity.id} style={{ padding: "18px 20px", borderBottom: i < franchises.length - 1 ? "1px solid #F3F4F6" : "none", background: entity.sharing_consent ? "#F0FDF4" : "white" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: "1 1 200px" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: ENTITY_TYPE_COLORS.franchise.bg, border: `1px solid ${ENTITY_TYPE_COLORS.franchise.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: ENTITY_TYPE_COLORS.franchise.color }}>
                        {entity.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{entity.name}</p>
                          <EntityBadge type={entity.type} />
                          {entity.sharing_consent && <Badge variant="success" style={{ fontSize: 9 }}>Connected</Badge>}
                          {entity.invite_status === "pending" && !entity.sharing_consent && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#D97706", background: "#FFF7ED", border: "1px solid #FCD34D", padding: "2px 7px", borderRadius: 9999 }}>Invite pending</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>{entity.location}</p>
                        {entity.invite_email && (
                          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Sent to: <span style={{ color: "#374151", fontWeight: 500 }}>{entity.invite_email}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Status / action */}
                    <div style={{ flexShrink: 0 }}>
                      {entity.sharing_consent ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>Data sharing active</span>
                        </div>
                      ) : justSent ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>Invitation sent</span>
                        </div>
                      ) : entity.invite_status === "pending" ? (
                        <button
                          onClick={() => handleSendInvite(entity, true)}
                          disabled={isSending}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          {isSending ? <><Loader2 size={11} className="animate-spin" /> Sending…</> : <><Mail size={11} /> Resend</>}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Invite form — shown when not connected and no pending invite (or just showing form) */}
                  {!entity.sharing_consent && entity.invite_status === "none" && !justSent && (
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Email input */}
                      <input
                        type="email"
                        placeholder={`Franchise owner's email at ${entity.name}…`}
                        value={inviteEmail[entity.id] ?? ""}
                        onChange={e => setInviteEmail(m => ({ ...m, [entity.id]: e.target.value }))}
                        style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }}
                      />

                      {/* Permissions */}
                      <div style={{ padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                          <Shield size={12} style={{ color: "#6B7280" }} />
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Data you're requesting access to</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                          {DATA_SHARING_OPTIONS.map(opt => (
                            <label
                              key={opt.key}
                              style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${perms[opt.key] ? "#0A2540" : "#E5E7EB"}`, background: perms[opt.key] ? "#EEF2FF" : "white", cursor: "pointer", transition: "all 0.1s" }}
                            >
                              <input
                                type="checkbox"
                                checked={!!perms[opt.key]}
                                onChange={() => togglePerm(entity.id, opt.key)}
                                style={{ marginTop: 2, accentColor: "#0A2540", flexShrink: 0 }}
                              />
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{opt.label}</p>
                                <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>{opt.sub}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>
                          The franchise can choose to share fewer categories than you request. They are in full control.
                        </p>
                      </div>

                      {entityErr && <p style={{ fontSize: 12, color: "#EF4444" }}>{entityErr}</p>}

                      <button
                        onClick={() => handleSendInvite(entity)}
                        disabled={isSending || !inviteEmail[entity.id]?.trim()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 700, cursor: isSending || !inviteEmail[entity.id]?.trim() ? "not-allowed" : "pointer", border: "none", opacity: isSending || !inviteEmail[entity.id]?.trim() ? 0.6 : 1 }}
                      >
                        {isSending ? <><Loader2 size={12} className="animate-spin" /> Sending…</> : <><Mail size={12} /> Send invitation</>}
                      </button>
                    </div>
                  )}

                  {/* Privacy note */}
                  {!entity.sharing_consent && (
                    <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                      <Lock size={11} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
                        Until they connect and consent, {entity.shortName}'s data is completely separate.
                        Creditlinker never accesses a franchise's financials without their explicit consent.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
