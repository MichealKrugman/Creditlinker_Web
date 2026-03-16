"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User, Lock, Bell, Shield, Smartphone,
  Eye, EyeOff, CheckCircle2, AlertCircle,
  ChevronRight, LogOut, Trash2, Save,
  Loader2, X, RefreshCw, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with Keycloak user profile + business prefs
───────────────────────────────────────────────────────── */
const ACCOUNT = {
  full_name:    "Ada Okonkwo",
  email:        "ada@adukebakeries.ng",
  phone:        "+234 801 234 5678",
  mfa_enabled:  false,
  last_login:   "Today at 09:02 · Lagos, Nigeria",
  member_since: "January 2023",
};

const NOTIFICATION_PREFS = {
  pipeline_complete:     true,
  score_change:          true,
  consent_request:       true,
  financing_offer:       true,
  document_reviewed:     true,
  account_security:      true,
  product_updates:       false,
};

const ACTIVE_SESSIONS = [
  { id: "ses_001", device: "Chrome · macOS",     location: "Lagos, Nigeria",     last_active: "Now",               current: true  },
  { id: "ses_002", device: "Safari · iPhone 15", location: "Lagos, Nigeria",     last_active: "2 hours ago",       current: false },
  { id: "ses_003", device: "Chrome · Windows",   location: "Abuja, Nigeria",     last_active: "Dec 28, 2024",      current: false },
];

/* ─────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────── */
const TABS = [
  { id: "account",       label: "Account",        icon: <User       size={14} /> },
  { id: "security",      label: "Security",       icon: <Lock       size={14} /> },
  { id: "notifications", label: "Notifications",  icon: <Bell       size={14} /> },
];

/* ─────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #F9FAFB", gap: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: sub ? 3 : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* Toggle switch */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? "#0A2540" : "#E5E7EB",
        border: "none", cursor: "pointer",
        position: "relative" as const,
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute" as const,
        top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   CHANGE PASSWORD MODAL
───────────────────────────────────────────────────────── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const mismatch = next && confirm && next !== confirm;
  const weak     = next && next.length < 8;

  const handleSave = async () => {
    if (!current || !next || !confirm) { setError("Please fill in all fields."); return; }
    if (mismatch) { setError("Passwords do not match."); return; }
    if (weak)     { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    // TODO: Keycloak password change via /auth/realms/creditlinker/account/credentials
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Change password</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
              <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
            </div>
          )}
          {[
            { label: "Current password", val: current, set: setCurrent, show: showCurr, toggle: () => setShowCurr(v => !v) },
            { label: "New password",     val: next,    set: setNext,    show: showNext, toggle: () => setShowNext(v => !v) },
            { label: "Confirm new password", val: confirm, set: setConfirm, show: showNext, toggle: () => {} },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{f.label}</label>
              <div style={{ position: "relative" as const }}>
                <Input
                  type={f.show ? "text" : "password"}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  style={{ height: 42, fontSize: 13, paddingRight: 40, borderColor: i === 2 && mismatch ? "#EF4444" : undefined }}
                />
                {i < 2 && (
                  <button onClick={f.toggle} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 }}>
                    {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {weak && <p style={{ fontSize: 11, color: "#F59E0B" }}>Password must be at least 8 characters.</p>}
          {mismatch && <p style={{ fontSize: 11, color: "#EF4444" }}>Passwords do not match.</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
            <Button variant="primary" onClick={handleSave} disabled={loading} style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
              {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Update password</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DELETE ACCOUNT MODAL
───────────────────────────────────────────────────────── */
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const PHRASE = "delete my account";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trash2 size={20} style={{ color: "#EF4444" }} />
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", letterSpacing: "-0.03em", textAlign: "center" as const, marginBottom: 8 }}>
            Delete account
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, textAlign: "center" as const, marginBottom: 20 }}>
            This will permanently delete your business account, financial identity, all data, and active consents. This cannot be undone.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Type <strong>{PHRASE}</strong> to confirm
            </label>
            <Input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={PHRASE}
              style={{ height: 42, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
            <button
              disabled={confirm !== PHRASE || loading}
              style={{ flex: 1, height: 42, borderRadius: 9, border: "none", background: confirm === PHRASE ? "#EF4444" : "#F3F4F6", color: confirm === PHRASE ? "white" : "#9CA3AF", fontSize: 13, fontWeight: 700, cursor: confirm === PHRASE ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
              onClick={async () => {
                setLoading(true);
                await new Promise(r => setTimeout(r, 1200));
                // TODO: DELETE /business/account
              }}
            >
              {loading ? <><Loader2 size={13} className="animate-spin" /> Deleting…</> : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(NOTIFICATION_PREFS);

  const [name,  setName]  = useState(ACCOUNT.full_name);
  const [phone, setPhone] = useState(ACCOUNT.phone);
  const [saving, setSaving] = useState(false);

  const toggleNotif = (key: keyof typeof NOTIFICATION_PREFS) =>
    setNotifPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSaveAccount = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    // TODO: Keycloak profile update + PATCH /business/profile
  };

  return (
    <>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showDeleteModal   && <DeleteAccountModal  onClose={() => setShowDeleteModal(false)}   />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Settings
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Manage your account, security, and notification preferences.
          </p>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", fontSize: 13, fontWeight: 600,
                border: "none",
                borderRight: i < TABS.length - 1 ? "1px solid #E5E7EB" : "none",
                background: activeTab === tab.id ? "#0A2540" : "white",
                color: activeTab === tab.id ? "white" : "#6B7280",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            ACCOUNT TAB
        ══════════════════════════════════════ */}
        {activeTab === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Personal details */}
            <Card>
              <CardHeader title="Personal Details" sub="Your name and contact information." />
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Full name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} style={{ height: 42, fontSize: 13 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Phone number</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} style={{ height: 42, fontSize: 13 }} />
                  </div>
                </div>

                {/* Email — read-only with note */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Email address</label>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Read-only</span>
                  </div>
                  <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13, color: "#6B7280" }}>{ACCOUNT.email}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10B981" }}>
                      <CheckCircle2 size={11} /> Verified
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    Email is used for authentication. Contact support to change it.
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                  <Button variant="primary" size="sm" onClick={handleSaveAccount} disabled={saving} style={{ gap: 6 }}>
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save changes</>}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Account info */}
            <Card>
              <CardHeader title="Account Information" />
              <SettingRow label="Member since" sub={ACCOUNT.member_since}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{ACCOUNT.member_since}</span>
              </SettingRow>
              <SettingRow label="Last login" sub={ACCOUNT.last_login}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{ACCOUNT.last_login}</span>
              </SettingRow>
              <SettingRow
                label="Open to financing"
                sub="When enabled, your anonymised profile is discoverable by capital providers."
              >
                <Toggle on={true} onChange={() => {
                  // TODO: PATCH /business/discovery { open_to_financing }
                }} />
              </SettingRow>
            </Card>

            {/* Account deletion */}
            <Card style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #FEE2E2", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Account deletion
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>
                    Deleting your account permanently removes your financial identity, all transaction data, active consents, and financing records. Capital providers with active access will lose it immediately. Accounts with unresolved financing obligations cannot be deleted.
                  </p>
                </div>
              </div>
              <SettingRow
                label="Delete my account"
                sub="This action is permanent and cannot be reversed."
              >
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "#FEF2F2", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Delete account
                </button>
              </SettingRow>
            </Card>

          </div>
        )}

        {/* ══════════════════════════════════════
            SECURITY TAB
        ══════════════════════════════════════ */}
        {activeTab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Password */}
            <Card>
              <CardHeader title="Password" sub="Managed via Keycloak authentication." />
              <SettingRow label="Current password" sub="Last changed: unknown">
                <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} style={{ gap: 5 }}>
                  <Lock size={12} /> Change password
                </Button>
              </SettingRow>
            </Card>

            {/* MFA */}
            <Card>
              <CardHeader title="Two-Factor Authentication" sub="Add a second layer of protection to your account." />
              <SettingRow
                label="Authenticator app"
                sub={ACCOUNT.mfa_enabled ? "2FA is active. Your account is protected." : "Not enabled. We strongly recommend enabling this."}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {ACCOUNT.mfa_enabled
                    ? <Badge variant="success" style={{ fontSize: 10 }}>Enabled</Badge>
                    : <Badge variant="warning" style={{ fontSize: 10 }}>Not enabled</Badge>
                  }
                  <Button variant={ACCOUNT.mfa_enabled ? "outline" : "primary"} size="sm" style={{ gap: 5 }}>
                    <Smartphone size={12} />
                    {ACCOUNT.mfa_enabled ? "Manage" : "Enable 2FA"}
                  </Button>
                </div>
              </SettingRow>
            </Card>

            {/* Active sessions */}
            <Card>
              <CardHeader
                title="Active Sessions"
                sub="Devices currently logged into your account."
              />
              <div style={{ padding: "10px 0 8px" }}>
                {ACTIVE_SESSIONS.map((session, i) => (
                  <div key={session.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < ACTIVE_SESSIONS.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: session.current ? "#0A2540" : "#F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: session.current ? "#00D4FF" : "#9CA3AF" }}>
                      <Smartphone size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{session.device}</p>
                        {session.current && <Badge variant="secondary" style={{ fontSize: 9 }}>This device</Badge>}
                      </div>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{session.location} · {session.last_active}</p>
                    </div>
                    {!session.current && (
                      <button
                        style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                        // TODO: POST /auth/sessions/:id/revoke
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 24px 16px", borderTop: "1px solid #F3F4F6" }}>
                <button style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                  <LogOut size={13} /> Sign out all other sessions
                </button>
              </div>
            </Card>

            {/* Security log */}
            <Card>
              <CardHeader title="Recent Security Activity" />
              <div style={{ padding: "10px 0 8px" }}>
                {[
                  { event: "Successful login",              detail: "Chrome · Lagos, Nigeria",  time: "Today, 09:02",     ok: true  },
                  { event: "Password change attempted",     detail: "Blocked — wrong password", time: "Dec 27, 22:14",    ok: false },
                  { event: "Successful login",              detail: "Safari · Lagos, Nigeria",  time: "Dec 27, 18:30",    ok: true  },
                  { event: "Consent granted to Stanbic",    detail: "Via /financers",           time: "Dec 10, 11:45",    ok: true  },
                ].map((entry, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 24px", borderBottom: i < 3 ? "1px solid #F9FAFB" : "none" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: entry.ok ? "#10B981" : "#EF4444" }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{entry.event}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{entry.detail}</p>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{entry.time}</p>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

        {/* ══════════════════════════════════════
            NOTIFICATIONS TAB
        ══════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", gap: 6, padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                Notifications are sent to <strong>{ACCOUNT.email}</strong>. Account security notifications cannot be disabled.
              </p>
            </div>

            <Card>
              <CardHeader title="Pipeline & Data" sub="Notifications about your financial data and scoring." />
              <SettingRow label="Pipeline complete" sub="When a new pipeline run finishes and your score updates.">
                <Toggle on={notifPrefs.pipeline_complete} onChange={() => toggleNotif("pipeline_complete")} />
              </SettingRow>
              <SettingRow label="Score change" sub="When any of your six financial dimensions change significantly.">
                <Toggle on={notifPrefs.score_change} onChange={() => toggleNotif("score_change")} />
              </SettingRow>
              <SettingRow label="Document reviewed" sub="When an uploaded document is verified or rejected.">
                <Toggle on={notifPrefs.document_reviewed} onChange={() => toggleNotif("document_reviewed")} />
              </SettingRow>
            </Card>

            <Card>
              <CardHeader title="Financing & Consent" sub="Notifications about capital providers and access requests." />
              <SettingRow label="Consent request" sub="When a capital provider requests access to your financial identity.">
                <Toggle on={notifPrefs.consent_request} onChange={() => toggleNotif("consent_request")} />
              </SettingRow>
              <SettingRow label="Financing offer" sub="When a capital provider creates a financing offer for you.">
                <Toggle on={notifPrefs.financing_offer} onChange={() => toggleNotif("financing_offer")} />
              </SettingRow>
            </Card>

            <Card>
              <CardHeader title="Account & Security" sub="Critical security notifications. Cannot be disabled." />
              <SettingRow label="Account security" sub="Login from new device, password changes, session revocations.">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge variant="outline" style={{ fontSize: 10 }}>Always on</Badge>
                  <Toggle on={true} onChange={() => {}} />
                </div>
              </SettingRow>
            </Card>

            <Card>
              <CardHeader title="Product" />
              <SettingRow label="Product updates" sub="Feature announcements and platform news.">
                <Toggle on={notifPrefs.product_updates} onChange={() => toggleNotif("product_updates")} />
              </SettingRow>
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={async () => {
                // TODO: PATCH /business/notification-preferences
              }}>
                <Save size={13} /> Save preferences
              </Button>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
