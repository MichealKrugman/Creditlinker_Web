"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User, Lock, Bell, Shield, Smartphone,
  Eye, EyeOff, CheckCircle2, AlertCircle,
  ChevronRight, LogOut, Save,
  Loader2, X, Info, Headset,
  Send, HelpCircle, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { apiCall } from "@/lib/api";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface AccountSettings {
  user_id:       string;
  email:         string | null;
  full_name:     string | null;
  phone:         string | null;
  mfa_enabled:   boolean;
  last_login:    string | null;
  business_id:   string;
  member_since:  string;
  open_to_financing: boolean;
  kyc_status:    string;
  notification_preferences: NotifPrefs;
  kyc: KycData;
  security_log:  SecurityEntry[];
}

interface NotifPrefs {
  pipeline_complete:  boolean;
  score_change:       boolean;
  consent_request:    boolean;
  financing_offer:    boolean;
  document_reviewed:  boolean;
  account_security:   boolean;
  product_updates:    boolean;
}

interface KycData {
  gender:      string;
  dob:         string;
  address:     string;
  bvn_masked:  string;
  nin_masked:  string;
  bvn_verified: boolean;
  nin_verified: boolean;
  id_type:     string;
  id_number:   string;
  id_expiry:   string;
  id_verified: boolean;
  submitted_at: string | null;
}

interface SecurityEntry {
  id:          string;
  action_type: string;
  detail:      Record<string, unknown>;
  occurred_at: string;
}

/* ─────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────── */
const TABS = [
  { id: "account",       label: "Account",        icon: <User    size={14} /> },
  { id: "security",      label: "Security",       icon: <Lock    size={14} /> },
  { id: "notifications", label: "Notifications",  icon: <Bell    size={14} /> },
  { id: "identity",      label: "Identity (KYC)", icon: <Shield  size={14} /> },
  { id: "support",       label: "Support",        icon: <Headset size={14} /> },
];

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

/* ─────────────────────────────────────────────────────────
   FORMAT HELPERS
───────────────────────────────────────────────────────── */
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtLastLogin(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} minutes ago`;
  if (diffMs < 86_400_000) return `Today at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return fmtDate(iso);
}

function labelForActionType(action_type: string): string {
  const MAP: Record<string, string> = {
    account_profile_updated:        "Profile updated",
    password_changed:               "Password changed",
    open_to_financing_updated:      "Discovery setting changed",
    notification_prefs_updated:     "Notification preferences updated",
    kyc_data_updated:               "KYC information updated",
    support_ticket_created:         "Support ticket submitted",
    business_profile_field_updated: "Business profile updated",
  };
  return MAP[action_type] ?? action_type.replace(/_/g, " ");
}

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

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? "#0A2540" : "#E5E7EB",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative" as const, transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute" as const, top: 3,
        left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%",
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

function InlineError({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
      <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: "#991B1B" }}>{msg}</p>
    </div>
  );
}

function InlineSuccess({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8 }}>
      <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: "#065F46" }}>{msg}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CHANGE PASSWORD MODAL
───────────────────────────────────────────────────────── */
function ChangePasswordModal({ bizId, onClose }: { bizId: string; onClose: () => void }) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const mismatch = next && confirm && next !== confirm;
  const weak     = next && next.length < 8;

  const handleSave = async () => {
    if (!current || !next || !confirm) { setError("Please fill in all fields."); return; }
    if (mismatch) { setError("Passwords do not match."); return; }
    if (weak)     { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Could not verify current session.");
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (signInErr) throw new Error("Current password is incorrect.");
      await apiCall("update-account-settings", { body: { action: "change_password", new_password: next } });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Change password</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {error   && <InlineError   msg={error} />}
          {success && <InlineSuccess msg="Password updated successfully." />}
          {[
            { label: "Current password",     val: current, set: setCurrent, show: showCurr, toggle: () => setShowCurr(v => !v) },
            { label: "New password",         val: next,    set: setNext,    show: showNext, toggle: () => setShowNext(v => !v) },
            { label: "Confirm new password", val: confirm, set: setConfirm, show: showNext, toggle: () => {} },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{f.label}</label>
              <div style={{ position: "relative" as const }}>
                <Input type={f.show ? "text" : "password"} value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ height: 42, fontSize: 13, paddingRight: 40, borderColor: i === 2 && mismatch ? "#EF4444" : undefined }} />
                {i < 2 && (
                  <button onClick={f.toggle} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 }}>
                    {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {weak     && <p style={{ fontSize: 11, color: "#F59E0B" }}>Password must be at least 8 characters.</p>}
          {mismatch && <p style={{ fontSize: 11, color: "#EF4444" }}>Passwords do not match.</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
            <Button variant="primary" onClick={handleSave} disabled={loading || success} style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 9, gap: 6 }}>
              {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Update password</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE SKELETON
───────────────────────────────────────────────────────── */
function Skeleton({ h = 16 }: { h?: number }) {
  return <div style={{ width: "100%", height: h, borderRadius: 6, background: "#F3F4F6", animation: "pulse 1.5s infinite" }} />;
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings]   = useState<AccountSettings | null>(null);
  const [loading,  setLoading]    = useState(true);
  const [loadErr,  setLoadErr]    = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const data = await apiCall<AccountSettings>("get-account-settings", {});
      setSettings(data);
    } catch (e: any) {
      setLoadErr(e?.message ?? "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (loadErr) return (
    <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
      <AlertCircle size={28} style={{ color: "#EF4444", margin: "0 auto 12px" }} />
      <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>{loadErr}</p>
      <button onClick={loadSettings} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  return (
    <>
      {showPasswordModal && settings && (
        <ChangePasswordModal bizId={settings.business_id} onClose={() => setShowPasswordModal(false)} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Manage your account, security, and notification preferences.</p>
        </div>

        <div className="cl-overflow-x-auto">
          <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", width: "fit-content", minWidth: "fit-content" }}>
            {TABS.map((tab, i) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", fontSize: 13, fontWeight: 600, border: "none", borderRight: i < TABS.length - 1 ? "1px solid #E5E7EB" : "none", background: activeTab === tab.id ? "#0A2540" : "white", color: activeTab === tab.id ? "white" : "#6B7280", cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[120, 80, 60].map((h, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
                <Skeleton h={h} />
              </div>
            ))}
          </div>
        ) : settings ? (
          <>
            {activeTab === "account"       && <AccountTab       settings={settings} onRefresh={loadSettings} />}
            {activeTab === "security"      && <SecurityTab      settings={settings} onShowPasswordModal={() => setShowPasswordModal(true)} />}
            {activeTab === "notifications" && <NotificationsTab settings={settings} onRefresh={loadSettings} />}
            {activeTab === "identity"      && <KycTab           settings={settings} onRefresh={loadSettings} />}
            {activeTab === "support"       && <SupportTab       settings={settings} />}
          </>
        ) : null}

      </div>
    </>
  );
}

export default function SettingsPage() {
  return <Suspense><SettingsContent /></Suspense>;
}

/* ─────────────────────────────────────────────────────────
   ACCOUNT TAB
───────────────────────────────────────────────────────── */
function AccountTab({ settings, onRefresh }: { settings: AccountSettings; onRefresh: () => void }) {
  const [name,     setName]     = useState(settings.full_name ?? "");
  const [phone,    setPhone]    = useState(settings.phone     ?? "");
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState("");
  const [saveOk,   setSaveOk]   = useState(false);
  const [toggling, setToggling] = useState(false);
  const [openToFin, setOpenToFin] = useState(settings.open_to_financing);

  // Sync toggle whenever parent re-fetches settings (e.g. after a save)
  useEffect(() => {
    setOpenToFin(settings.open_to_financing);
  }, [settings.open_to_financing]);

  const handleSaveProfile = async () => {
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      await apiCall("update-account-settings", {
        body: { action: "update_profile", full_name: name.trim(), phone: phone.trim() },
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
      onRefresh();
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDiscovery = async (v: boolean) => {
    setOpenToFin(v);      // optimistic
    setToggling(true);
    try {
      await apiCall("update-account-settings", {
        body: { action: "update_open_to_financing", open_to_financing: v },
      });
      // No onRefresh needed — the toggle is self-contained and already
      // wrote to the DB. discovery-match will pick up the new value.
    } catch {
      setOpenToFin(!v);   // revert on error
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <Card>
        <CardHeader title="Personal Details" sub="Your name and contact information." />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {saveErr && <InlineError msg={saveErr} />}
          {saveOk  && <InlineSuccess msg="Profile saved successfully." />}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Email address</label>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>Read-only</span>
            </div>
            <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, color: "#6B7280" }}>{settings.email}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10B981" }}>
                <CheckCircle2 size={11} /> Verified
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>Email is used for authentication. Contact support to change it.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={saving} style={{ gap: 6 }}>
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save changes</>}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Account Information" />
        <SettingRow label="Member since" sub={fmtDate(settings.member_since)}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{fmtDate(settings.member_since)}</span>
        </SettingRow>
        <SettingRow label="Last login" sub={fmtLastLogin(settings.last_login)}>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{fmtLastLogin(settings.last_login)}</span>
        </SettingRow>
        <SettingRow
          label="Open to financing"
          sub="When enabled, your anonymised profile is discoverable by capital providers."
        >
          <Toggle on={openToFin} onChange={handleToggleDiscovery} disabled={toggling} />
        </SettingRow>
      </Card>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECURITY TAB
───────────────────────────────────────────────────────── */
function SecurityTab({ settings, onShowPasswordModal }: { settings: AccountSettings; onShowPasswordModal: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title="Password" sub="Use a strong, unique password to protect your account." />
        <SettingRow label="Account password" sub="Last changed: unknown">
          <Button variant="outline" size="sm" onClick={onShowPasswordModal} style={{ gap: 5 }}>
            <Lock size={12} /> Change password
          </Button>
        </SettingRow>
      </Card>

      <Card>
        <CardHeader title="Two-Factor Authentication" sub="Add a second layer of protection to your account." />
        <SettingRow
          label="Authenticator app"
          sub={settings.mfa_enabled ? "2FA is active. Your account is protected." : "Not enabled. We strongly recommend enabling this."}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {settings.mfa_enabled
              ? <Badge variant="success" style={{ fontSize: 10 }}>Enabled</Badge>
              : <Badge variant="warning" style={{ fontSize: 10 }}>Not enabled</Badge>
            }
            <Button
              variant={settings.mfa_enabled ? "outline" : "primary"} size="sm" style={{ gap: 5 }}
              onClick={async () => {
                if (settings.mfa_enabled) {
                  const { data } = await supabase.auth.mfa.listFactors();
                  const totp = data?.totp?.[0];
                  if (totp) await supabase.auth.mfa.unenroll({ factorId: totp.id });
                } else {
                  window.location.href = "/settings/mfa";
                }
              }}
            >
              <Smartphone size={12} />
              {settings.mfa_enabled ? "Manage" : "Enable 2FA"}
            </Button>
          </div>
        </SettingRow>
      </Card>

      <Card>
        <CardHeader title="Recent Security Activity" sub="Last 10 account events." />
        {settings.security_log.length === 0 ? (
          <p style={{ padding: "20px 24px", fontSize: 13, color: "#9CA3AF" }}>No security events recorded yet.</p>
        ) : (
          <div style={{ padding: "10px 0 8px" }}>
            {settings.security_log.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 24px", borderBottom: i < settings.security_log.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: "#10B981" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{labelForActionType(entry.action_type)}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {Object.entries(entry.detail).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{fmtDate(entry.occurred_at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS TAB
───────────────────────────────────────────────────────── */
function NotificationsTab({ settings, onRefresh }: { settings: AccountSettings; onRefresh: () => void }) {
  const [prefs,   setPrefs]   = useState<NotifPrefs>(settings.notification_preferences);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk,  setSaveOk]  = useState(false);

  const toggle = (key: keyof NotifPrefs) => {
    if (key === "account_security") return;
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      await apiCall("update-account-settings", {
        body: { action: "update_notification_prefs", preferences: prefs },
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, padding: "12px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
        <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
          Notifications are sent to <strong>{settings.email}</strong>. Account security notifications cannot be disabled.
        </p>
      </div>
      {saveErr && <InlineError msg={saveErr} />}
      {saveOk  && <InlineSuccess msg="Notification preferences saved." />}
      <Card>
        <CardHeader title="Pipeline & Data" sub="Notifications about your financial data and scoring." />
        <SettingRow label="Pipeline complete" sub="When a new pipeline run finishes and your score updates.">
          <Toggle on={prefs.pipeline_complete} onChange={() => toggle("pipeline_complete")} />
        </SettingRow>
        <SettingRow label="Score change" sub="When any of your six financial dimensions change significantly.">
          <Toggle on={prefs.score_change} onChange={() => toggle("score_change")} />
        </SettingRow>
        <SettingRow label="Document reviewed" sub="When an uploaded document is verified or rejected.">
          <Toggle on={prefs.document_reviewed} onChange={() => toggle("document_reviewed")} />
        </SettingRow>
      </Card>
      <Card>
        <CardHeader title="Financing & Consent" sub="Notifications about capital providers and access requests." />
        <SettingRow label="Consent request" sub="When a capital provider requests access to your financial identity.">
          <Toggle on={prefs.consent_request} onChange={() => toggle("consent_request")} />
        </SettingRow>
        <SettingRow label="Financing offer" sub="When a capital provider creates a financing offer for you.">
          <Toggle on={prefs.financing_offer} onChange={() => toggle("financing_offer")} />
        </SettingRow>
      </Card>
      <Card>
        <CardHeader title="Account & Security" sub="Critical security notifications. Cannot be disabled." />
        <SettingRow label="Account security" sub="Login from new device, password changes, session revocations.">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="outline" style={{ fontSize: 10 }}>Always on</Badge>
            <Toggle on={true} onChange={() => {}} disabled />
          </div>
        </SettingRow>
      </Card>
      <Card>
        <CardHeader title="Product" />
        <SettingRow label="Product updates" sub="Feature announcements and platform news.">
          <Toggle on={prefs.product_updates} onChange={() => toggle("product_updates")} />
        </SettingRow>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} style={{ gap: 6 }}>
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save preferences</>}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   KYC TAB
───────────────────────────────────────────────────────── */
function KycTab({ settings, onRefresh }: { settings: AccountSettings; onRefresh: () => void }) {
  const kyc = settings.kyc;
  const [gender,   setGender]   = useState(kyc.gender);
  const [dob,      setDob]      = useState(kyc.dob);
  const [address,  setAddress]  = useState(kyc.address);
  const [bvn,      setBvn]      = useState("");
  const [nin,      setNin]      = useState("");
  const [idType,   setIdType]   = useState(kyc.id_type);
  const [idNumber, setIdNumber] = useState(kyc.id_number);
  const [idExpiry, setIdExpiry] = useState(kyc.id_expiry);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState("");
  const [saveOk,   setSaveOk]   = useState(false);

  const handleSave = async () => {
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const payload: Record<string, any> = { action: "update_kyc" };
      if (gender)   payload.gender    = gender;
      if (dob)      payload.dob       = dob;
      if (address)  payload.address   = address;
      if (bvn)      payload.bvn       = bvn;
      if (nin)      payload.nin       = nin;
      if (idType)   payload.id_type   = idType;
      if (idNumber) payload.id_number = idNumber;
      if (idExpiry) payload.id_expiry = idExpiry;
      await apiCall("update-account-settings", { body: payload });
      setSaveOk(true);
      setBvn(""); setNin("");
      setTimeout(() => setSaveOk(false), 2500);
      onRefresh();
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save KYC information.");
    } finally {
      setSaving(false);
    }
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
      {saveErr && <InlineError msg={saveErr} />}
      {saveOk  && <InlineSuccess msg="KYC information saved." />}

      <Card>
        <CardHeader title="Personal Identity" sub="Your personal details as the account owner." />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Full legal name</label>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>From your account</span>
            </div>
            <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{settings.full_name || "—"}</p>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>Update your name in the Account tab.</p>
          </div>
          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Date of birth *</label>
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)}
                style={{ height: 42, fontSize: 13, borderColor: dob ? undefined : "rgba(245,158,11,0.4)" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Residential address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos" style={{ height: 42, fontSize: 13 }} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Government Identity Numbers" sub="BVN and NIN are verified against NIBSS records. Never shared with financers." />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>BVN</label>
                <VerifiedBadge verified={kyc.bvn_verified} />
              </div>
              {kyc.bvn_masked
                ? <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", fontFamily: "monospace", fontSize: 13, color: "#374151", letterSpacing: "0.08em" }}>{kyc.bvn_masked}</div>
                : <Input value={bvn} onChange={e => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11-digit BVN" style={{ height: 42, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }} />
              }
              {kyc.bvn_masked && <p style={{ fontSize: 11, color: "#9CA3AF" }}>On record: {kyc.bvn_masked}. Enter below to update.</p>}
              {kyc.bvn_masked && <Input value={bvn} onChange={e => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="New BVN" style={{ height: 38, fontSize: 12, fontFamily: "monospace", letterSpacing: "0.08em" }} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>NIN</label>
                <VerifiedBadge verified={kyc.nin_verified} />
              </div>
              {kyc.nin_masked
                ? <div style={{ height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", fontFamily: "monospace", fontSize: 13, color: "#374151", letterSpacing: "0.08em" }}>{kyc.nin_masked}</div>
                : <Input value={nin} onChange={e => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11-digit NIN" style={{ height: 42, fontSize: 13, fontFamily: "monospace", letterSpacing: "0.08em" }} />
              }
              {kyc.nin_masked && <Input value={nin} onChange={e => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="New NIN" style={{ height: 38, fontSize: 12, fontFamily: "monospace", letterSpacing: "0.08em" }} />}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Identity Document" sub="Provide a valid government-issued photo ID." />
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
              <Input value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())} placeholder="e.g. A00000000" style={{ height: 42, fontSize: 13, fontFamily: "monospace" }} />
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
                <VerifiedBadge verified={kyc.id_verified} />
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
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} style={{ gap: 6, minWidth: 140 }}>
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save KYC info</>}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUPPORT TAB
───────────────────────────────────────────────────────── */
function SupportTab({ settings }: { settings: AccountSettings }) {
  const [issueType,   setIssueType]   = useState("");
  const [subject,     setSubject]     = useState("");
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitErr,   setSubmitErr]   = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [ticketId,    setTicketId]    = useState("");

  const ISSUE_TYPES = [
    { value: "score_dispute",    label: "Dispute my score or dimension",   description: "A score, risk flag, or dimension result looks incorrect." },
    { value: "data_error",       label: "Transaction / data error",         description: "A transaction is miscategorised or missing." },
    { value: "pipeline_error",   label: "Pipeline run issue",              description: "The pipeline failed, stalled, or produced unexpected results." },
    { value: "account_issue",    label: "Account or access issue",         description: "Login, verification, or consent access problems." },
    { value: "financer_dispute", label: "Dispute with a capital provider", description: "An issue with a financer's behaviour or a financing record." },
    { value: "other",            label: "Other",                           description: "Anything not covered above." },
  ];

  const handleSubmit = async () => {
    if (!issueType || !subject.trim() || !description.trim()) return;
    setSubmitting(true); setSubmitErr("");
    try {
      const res = await apiCall<{ success: boolean; ticket_id: string }>(
        "update-account-settings",
        { body: { action: "create_support_ticket", issue_type: issueType, subject: subject.trim(), description: description.trim() } }
      );
      setTicketId(res.ticket_id);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitErr(e?.message ?? "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "48px 24px", textAlign: "center" as const }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle2 size={26} style={{ color: "#10B981" }} />
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 8 }}>Support ticket submitted</p>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, maxWidth: 380, margin: "0 auto 8px" }}>
        Our support team will review your issue and respond to <strong>{settings.email}</strong> within 1–2 business days.
      </p>
      {ticketId && <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 24 }}>Reference: {ticketId}</p>}
      <button onClick={() => { setSubmitted(false); setSubject(""); setDescription(""); setIssueType(""); setTicketId(""); }}
        style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
        Submit another request
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
          If you believe your financial score contains an error, raise a support ticket and our team will review it within 1–2 business days.
        </p>
      </div>

      <Card>
        <CardHeader title="Submit a support request" sub="Responses are sent to your registered email address." />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {submitErr && <InlineError msg={submitErr} />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Issue type *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {ISSUE_TYPES.map(issue => (
                <button key={issue.value} onClick={() => setIssueType(issue.value)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 9, border: "1.5px solid", borderColor: issueType === issue.value ? "#0A2540" : "#E5E7EB", background: issueType === issue.value ? "#F8FAFF" : "white", cursor: "pointer", textAlign: "left" as const, transition: "all 0.12s" }}>
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
          {(issueType === "score_dispute" || issueType === "data_error") && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9 }}>
              <AlertCircle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                {issueType === "score_dispute"
                  ? "Tag any miscategorised transactions on the Transactions page before submitting — it helps our team investigate faster."
                  : "Correct transaction tags directly on the Transactions page first. Add any remaining context below."}
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Subject *</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder={issueType === "score_dispute" ? "e.g. Risk flag: Concentration risk seems incorrect" : "Short summary of your issue"}
              style={{ height: 42, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Provide as much detail as possible so our team can investigate quickly."
              rows={5}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>We respond within 1–2 business days.</p>
            <Button variant="primary" size="sm" onClick={handleSubmit}
              disabled={!issueType || !subject.trim() || !description.trim() || submitting}
              style={{ gap: 6, minWidth: 140 }}>
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><Send size={13} /> Submit ticket</>}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Common questions" />
        {[
          { q: "Why did my score go down?",                 a: "Scores are recalculated on every pipeline run based on your latest transaction data. A decline usually reflects a change in cashflow patterns or a new risk flag. Run a fresh pipeline and check your dimension breakdown." },
          { q: "How do I dispute a risk flag?",              a: "Submit a ticket above with issue type 'Dispute my score'. Tag any related transactions on the Transactions page before submitting." },
          { q: "Why is a transaction miscategorised?",       a: "The normalization engine classifies transactions from bank descriptions. Tag it manually on the Transactions page — your tag applies on the next pipeline run at the highest confidence level." },
          { q: "How long until my score reflects new data?", a: "After syncing a bank account or uploading a statement, trigger a pipeline run from the Financial Identity page. Your score updates within a few minutes." },
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
      </Card>
    </div>
  );
}
