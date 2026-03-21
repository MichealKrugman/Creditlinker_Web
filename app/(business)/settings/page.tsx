"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User, Lock, Bell, Shield, Smartphone,
  Eye, EyeOff, CheckCircle2, AlertCircle,
  ChevronRight, LogOut, Trash2, Save,
  Loader2, X, RefreshCw, Info, Headset,
  FileText, Send, HelpCircle,
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
  { id: "identity",      label: "Identity (KYC)", icon: <Shield     size={14} /> },
  { id: "support",       label: "Support",        icon: <Headset    size={14} /> },
];

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const KYC_DATA = {
  full_name:    "Ada Okonkwo",
  gender:       "",
  dob:          "",
  nationality:  "Nigerian",
  bvn:          "",
  nin:          "",
  id_type:      "",
  id_number:    "",
  id_expiry:    "",
  address:      "",
  bvn_verified: false,
  nin_verified: false,
  id_verified:  false,
};

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
function SettingsContent() {
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
        <div className="cl-overflow-x-auto">
        <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", width: "fit-content", minWidth: "fit-content" }}>
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
                whiteSpace: "nowrap" as const,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
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
                <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

        {/* ══════════════════════════════════════
            IDENTITY / KYC TAB
        ══════════════════════════════════════ */}
        {activeTab === "identity" && (
          <KycTab />
        )}

        {/* ══════════════════════════════════════
            SUPPORT TAB
        ══════════════════════════════════════ */}
        {activeTab === "support" && (
          <SupportTab />
        )}

      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
   KYC TAB
───────────────────────────────────────────────────────── */
function KycTab() {
  const [gender,    setGender]    = useState(KYC_DATA.gender);
  const [dob,       setDob]       = useState(KYC_DATA.dob);
  const [bvn,       setBvn]       = useState(KYC_DATA.bvn);
  const [nin,       setNin]       = useState(KYC_DATA.nin);
  const [idType,    setIdType]    = useState(KYC_DATA.id_type);
  const [idNumber,  setIdNumber]  = useState(KYC_DATA.id_number);
  const [idExpiry,  setIdExpiry]  = useState(KYC_DATA.id_expiry);
  const [address,   setAddress]   = useState(KYC_DATA.address);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // TODO: PATCH /business/profile/kyc { gender, dob, bvn, nin, id_type, id_number, id_expiry, address }
  };

  const VerifiedBadge = ({ verified }: { verified: boolean }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: verified ? "#ECFDF5" : "#FFF7ED", color: verified ? "#10B981" : "#F59E0B", border: `1px solid ${verified ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
      {verified ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      {verified ? "Verified" : "Pending verification"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
          KYC information is required to verify your identity and that of key principals. Verified identities build trust with capital providers and unlock higher financing limits.
        </p>
      </div>

      {/* Personal Identity */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>Personal Identity</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Your personal details as the account owner.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name (read-only from Keycloak) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Full legal name</label>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>From your account</span>
            </div>
            <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{KYC_DATA.full_name}</p>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>Update your name in the Account tab above.</p>
          </div>

          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Gender */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Gender *</label>
              <div style={{ position: "relative" as const }}>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  style={{ width: "100%", height: 42, padding: "0 32px 0 12px", borderRadius: 8, border: `1.5px solid ${gender ? "#E5E7EB" : "rgba(245,158,11,0.4)"}`, fontSize: 13, color: gender ? "#0A2540" : "#9CA3AF", background: "white", appearance: "none", outline: "none", cursor: "pointer" }}>
                  <option value="" disabled>Select gender</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronRight size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: "#9CA3AF", pointerEvents: "none" }} />
              </div>
              {!gender && <p style={{ fontSize: 11, color: "#F59E0B" }}>Required for KYC verification.</p>}
            </div>

            {/* Date of birth */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Date of birth *</label>
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)}
                style={{ height: 42, fontSize: 13, borderColor: dob ? undefined : "rgba(245,158,11,0.4)" }} />
            </div>
          </div>

          {/* Address */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Residential address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos" style={{ height: 42, fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* Government IDs */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>Government Identity Numbers</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>BVN and NIN are used for identity verification with NIBSS. These are never shared with financers directly.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* BVN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>BVN</label>
                <VerifiedBadge verified={KYC_DATA.bvn_verified} />
              </div>
              <Input value={bvn} onChange={e => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11-digit BVN" style={{ height: 42, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }} />
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>Verified against NIBSS records. Never exposed to financers.</p>
            </div>
            {/* NIN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>NIN</label>
                <VerifiedBadge verified={KYC_DATA.nin_verified} />
              </div>
              <Input value={nin} onChange={e => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11-digit NIN" style={{ height: 42, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }} />
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>National Identification Number. Used for identity resolution.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Government ID Document */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>Identity Document</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Provide a valid government-issued photo ID for identity verification.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>ID Type</label>
              <div style={{ position: "relative" as const }}>
                <select value={idType} onChange={e => setIdType(e.target.value)}
                  style={{ width: "100%", height: 42, padding: "0 32px 0 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 13, color: idType ? "#0A2540" : "#9CA3AF", background: "white", appearance: "none", outline: "none", cursor: "pointer" }}>
                  <option value="" disabled>Select ID type</option>
                  {["National ID (NIN slip)", "International Passport", "Driver's Licence", "Voter's Card"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronRight size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: "#9CA3AF", pointerEvents: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>ID Number</label>
              <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="e.g. A00000000" style={{ height: 42, fontSize: 13, fontFamily: "monospace" }} />
            </div>
          </div>
          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Expiry date</label>
              <Input type="date" value={idExpiry} onChange={e => setIdExpiry(e.target.value)} style={{ height: 42, fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Verification status</label>
              <div style={{ height: 42, display: "flex", alignItems: "center", paddingLeft: 4 }}>
                <VerifiedBadge verified={KYC_DATA.id_verified} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, alignItems: "flex-start" }}>
            <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
              Upload a clear photo or scan of your ID at <Link href="/documents" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>Documents</Link>. The document team will verify and update your status within 1–2 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} style={{ gap: 6, minWidth: 140 }}>
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : saved ? <><CheckCircle2 size={13} /> Saved!</> : <><Save size={13} /> Save KYC info</>}
        </Button>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUPPORT TAB
───────────────────────────────────────────────────────── */
function SupportTab() {
  const [issueType,    setIssueType]    = useState("");
  const [subject,      setSubject]      = useState("");
  const [description,  setDescription]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  const ISSUE_TYPES = [
    { value: "score_dispute",    label: "Dispute my score or dimension",       description: "A score, risk flag, or dimension result looks incorrect." },
    { value: "data_error",       label: "Transaction / data error",             description: "A transaction is miscategorised or missing." },
    { value: "pipeline_error",   label: "Pipeline run issue",                  description: "The pipeline failed, stalled, or produced unexpected results." },
    { value: "account_issue",    label: "Account or access issue",             description: "Login, verification, or consent access problems." },
    { value: "financer_dispute", label: "Dispute with a capital provider",     description: "An issue with a financer's behaviour or a financing record." },
    { value: "other",            label: "Other",                               description: "Anything not covered above." },
  ];

  const handleSubmit = async () => {
    if (!issueType || !subject || !description) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    // TODO: POST /business/support/ticket { issue_type, subject, description }
  };

  const selectedIssue = ISSUE_TYPES.find(i => i.value === issueType);

  if (submitted) return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "48px 24px", textAlign: "center" as const }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle2 size={26} style={{ color: "#10B981" }} />
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 8 }}>Support ticket submitted</p>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, maxWidth: 380, margin: "0 auto 24px" }}>
        Our support team will review your issue and respond to <strong>ada@adukebakeries.ng</strong> within 1–2 business days.
      </p>
      <button onClick={() => { setSubmitted(false); setSubject(""); setDescription(""); setIssueType(""); }}
        style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
        Submit another request
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Info banner */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
          If you believe your financial score contains an error — such as a misidentified transaction, an incorrect risk flag, or data that was not properly attributed — raise a support ticket here and our team will review it within 1–2 business days.
        </p>
      </div>

      {/* Ticket form */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 3 }}>Submit a support request</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Responses are sent to your registered email address.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Issue type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Issue type *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {ISSUE_TYPES.map(issue => (
                <button key={issue.value} onClick={() => setIssueType(issue.value)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 9, border: "1.5px solid", borderColor: issueType === issue.value ? "#0A2540" : "#E5E7EB", background: issueType === issue.value ? "#F8FAFF" : "white", cursor: "pointer", textAlign: "left" as const, transition: "all 0.12s" }}
                  onMouseEnter={e => { if (issueType !== issue.value) (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
                  onMouseLeave={e => { if (issueType !== issue.value) (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid", borderColor: issueType === issue.value ? "#0A2540" : "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {issueType === issue.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2540" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{issue.label}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{issue.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Score dispute context */}
          {(issueType === "score_dispute" || issueType === "data_error") && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9 }}>
              <AlertCircle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                {issueType === "score_dispute"
                  ? "Please tag any miscategorised transactions on the Transactions page before submitting — it helps our team investigate faster."
                  : "If a transaction is tagged incorrectly, you can correct it directly from the Transactions page. Add any remaining context in the description below."}
              </p>
            </div>
          )}

          {/* Subject */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Subject *</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder={issueType === "score_dispute" ? "e.g. Risk flag: Concentration risk seems incorrect" : "Short summary of your issue"}
              style={{ height: 42, fontSize: 13 }} />
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder={issueType === "score_dispute"
                ? "Describe which score, dimension, or risk flag looks wrong and why. Include dates, amounts, or transaction IDs if applicable."
                : "Provide as much detail as possible so our team can investigate quickly."}
              rows={5}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>We respond within 1–2 business days.</p>
            <Button variant="primary" size="sm" onClick={handleSubmit}
              disabled={!issueType || !subject || !description || submitting}
              style={{ gap: 6, minWidth: 140 }}>
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><Send size={13} /> Submit ticket</>}
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ shortcuts */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>Common questions</p>
        </div>
        {[
          { q: "Why did my score go down?",                      a: "Scores are recalculated on every pipeline run based on your latest transaction data. A decline usually reflects a change in cashflow patterns or a new risk flag. Run a fresh pipeline and check your dimension breakdown." },
          { q: "How do I dispute a risk flag?",                   a: "Submit a support ticket above with issue type 'Dispute my score'. Tag any related transactions on the Transactions page before submitting." },
          { q: "Why is a transaction miscategorised?",            a: "The normalization engine classifies transactions from bank descriptions. If a category is wrong, tag it manually on the Transactions page — your tag will be applied on the next pipeline run at the highest confidence level." },
          { q: "How long until my score reflects new data?",      a: "After syncing a bank account or uploading a statement, trigger a pipeline run from the Financial Identity page. Your score updates within a few minutes." },
        ].map((item, i) => (
          <div key={i} style={{ padding: "14px 24px", borderBottom: i < 3 ? "1px solid #F9FAFB" : "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <HelpCircle size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{item.q}</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
