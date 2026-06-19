"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Settings, User, Bell, Shield, Key,
  Globe, Trash2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Copy, Save, Loader2, Clock, ArrowRight, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useDeveloperAccount } from "@/lib/developer-context";
import { usePlatformSettings } from "@/lib/platform-settings-context";
import { TIER_LIMITS, tierLabel, computeResetDate } from "@/lib/dev-utils";

function Card({ children, style = {}, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={className} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: desc ? 4 : 0 }}>{title}</p>
      {desc && <p style={{ fontSize: 13, color: "#6B7280" }}>{desc}</p>}
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{desc}</p>
      </div>
      <button type="button" onClick={() => setOn(!on)} aria-checked={on} role="switch"
        style={{ width: 44, height: 24, borderRadius: 9999, background: on ? "#0A2540" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </button>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === "DELETE";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={20} style={{ color: "#EF4444" }} />
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", marginBottom: 8 }}>Delete developer account?</p>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>
          This permanently deletes your account, all API keys, webhook configurations, logs, and usage history. This action <strong>cannot be undone</strong>.
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
          Type <code style={{ background: "#F3F4F6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>DELETE</code> to confirm:
        </p>
        <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="DELETE"
          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const, marginBottom: 20, fontFamily: "monospace" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onCancel} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={!confirmed || loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: confirmed && !loading ? "#EF4444" : "#FCA5A5", fontSize: 13, fontWeight: 700, color: "white", cursor: confirmed && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s" }}>
            {loading ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Deleting…</> : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "profile",       label: "Profile",       icon: User     },
  { id: "account",       label: "Account",        icon: Settings },
  { id: "security",      label: "Security",       icon: Shield   },
  { id: "notifications", label: "Notifications",  icon: Bell     },
  { id: "api",           label: "API & Webhooks", icon: Key      },
  { id: "advanced",      label: "Advanced",       icon: Globe    },
];

export default function DeveloperSettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState("profile");

  const { account, refresh } = useDeveloperAccount();
  const { settings } = usePlatformSettings();
  const tierKey   = account?.tier ?? "read";
  const tLabel    = tierLabel(account?.tier);
  const limits    = TIER_LIMITS[tierKey] ?? TIER_LIMITS.read;
  const resetDate = computeResetDate(account?.created_at);

  // ── Profile ──────────────────────────────────────────────────────
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [company,       setCompany]       = useState("");
  const [website,       setWebsite]       = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);
  const [profileError,  setProfileError]  = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    const parts = (account.name ?? "").trim().split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setCompany(account.company || "");
    setWebsite(account.website || "");
    setEnv(account.preferred_environment ?? "test");
  }, [account]);

  async function handleProfileSave() {
    if (!account) return;
    setProfileSaving(true);
    setProfileError(null);
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("developer_accounts")
      .update({ name: fullName, company: company || null, website: website || null })
      .eq("id", account.id);
    setProfileSaving(false);
    if (error) { setProfileError(error.message); return; }
    await refresh();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  // ── Password ─────────────────────────────────────────────────────
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwSaved,     setPwSaved]     = useState(false);
  const [pwError,     setPwError]     = useState<string | null>(null);

  async function handlePasswordUpdate() {
    setPwError(null);
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw !== confirmPw)  { setPwError("New passwords do not match."); return; }
    if (newPw.length < 8)     { setPwError("Password must be at least 8 characters."); return; }
    if (newPw === currentPw)  { setPwError("New password must differ from current password."); return; }
    setPwSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwError("Could not verify session."); setPwSaving(false); return; }
    const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (reAuthError) { setPwError("Current password is incorrect."); setPwSaving(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updateError) { setPwError(updateError.message); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  }

  // ── Sessions ─────────────────────────────────────────────────────
  const [revoking, setRevoking] = useState(false);
  async function handleRevokeOtherSessions() {
    setRevoking(true);
    await supabase.auth.signOut({ scope: "others" });
    setRevoking(false);
  }

  // ── Environment ──────────────────────────────────────────────────
  const [env,       setEnv]       = useState<"test" | "live">("test");
  const [envSaving, setEnvSaving] = useState(false);

  async function handleEnvChange(newEnv: "test" | "live") {
    if (!account || newEnv === env) return;
    setEnvSaving(true);
    setEnv(newEnv);
    await supabase.from("developer_accounts").update({ preferred_environment: newEnv }).eq("id", account.id);
    setEnvSaving(false);
    await refresh();
  }

  // ── Production access request ──────────────────────────────────
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [useCase,          setUseCase]          = useState("");
  const [requestSending,   setRequestSending]   = useState(false);
  const [requestError,     setRequestError]     = useState<string | null>(null);

  async function handleProductionRequest() {
    if (!account || !useCase.trim()) { setRequestError("Please describe your use case."); return; }
    setRequestSending(true);
    setRequestError(null);
    const { error: insertError } = await supabase
      .from("production_access_requests")
      .insert({ developer_id: account.id, use_case: useCase.trim() });
    if (insertError) { setRequestError(insertError.message); setRequestSending(false); return; }
    const { error: updateError } = await supabase
      .from("developer_accounts")
      .update({ production_access: "pending" })
      .eq("id", account.id);
    setRequestSending(false);
    if (updateError) { setRequestError(updateError.message); return; }
    await refresh();
    setShowRequestModal(false);
    setUseCase("");
  }
  const [webhookSecret,  setWebhookSecret]  = useState<string | null>(null);
  const [secretVisible,  setSecretVisible]  = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [rotating,       setRotating]       = useState(false);
  const [rotateError,    setRotateError]    = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    supabase
      .from("developer_accounts")
      .select("webhook_secret")
      .eq("id", account.id)
      .single()
      .then(({ data }) => {
        if (data?.webhook_secret) setWebhookSecret(data.webhook_secret);
      });
  }, [account]);

  function copySecret() {
    if (!webhookSecret) return;
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRotateSecret() {
    setRotating(true);
    setRotateError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session.");
      const res = await fetch("/api/developers/rotate-webhook-secret", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to rotate secret.");
      setWebhookSecret(body.webhook_secret);
      setSecretVisible(true);
    } catch (err: any) {
      setRotateError(err.message ?? "Something went wrong.");
    } finally {
      setRotating(false);
    }
  }

  // ── Delete account ───────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session.");
      const res = await fetch("/api/developers/delete-account", {
        method: "DELETE",
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete account.");
      }
      await supabase.auth.signOut();
      router.replace("/developers/login");
    } catch (err: any) {
      setDeleteError(err.message ?? "Something went wrong.");
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showDeleteModal && (
        <DeleteModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={deleteLoading} />
      )}

      {showRequestModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", marginBottom: 6 }}>Request production access</p>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 20 }}>
              Tell us how you plan to use the Creditlinker API in production. Our team will review your request and respond within 2 business days.
            </p>
            {requestError && (
              <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 14 }}>{requestError}</div>
            )}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Requesting as</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{account?.name} &middot; {account?.email}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Describe your use case</label>
              <textarea value={useCase} onChange={e => setUseCase(e.target.value)} rows={4}
                placeholder="e.g. We are building a credit scoring product for SMEs and need live bank transaction data to assess creditworthiness..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", resize: "vertical", boxSizing: "border-box" as const, fontFamily: "inherit", lineHeight: 1.6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setShowRequestModal(false); setUseCase(""); setRequestError(null); }} disabled={requestSending}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={handleProductionRequest} disabled={requestSending || !useCase.trim()}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: requestSending || !useCase.trim() ? "#9CA3AF" : "#0A2540", fontSize: 13, fontWeight: 700, color: "white", cursor: requestSending || !useCase.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s" }}>
                {requestSending ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting…</> : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Settings</h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Manage your developer account, security, and API preferences.</p>
          </div>
          {active === "profile" && (
            <button type="button" onClick={handleProfileSave} disabled={profileSaving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, background: profileSaved ? "#ECFDF5" : "#0A2540", border: profileSaved ? "1px solid #A7F3D0" : "none", color: profileSaved ? "#059669" : "white", fontSize: 13, fontWeight: 700, cursor: profileSaving ? "default" : "pointer", minWidth: 130, justifyContent: "center", transition: "all 0.15s" }}>
              {profileSaving ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : profileSaved ? <><CheckCircle2 size={13} /> Saved</> : <><Save size={13} /> Save changes</>}
            </button>
          )}
        </div>

        {deleteError && (
          <div style={{ padding: "10px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>{deleteError}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

          {/* Nav */}
          <nav>
            <Card style={{ padding: "8px 0" }}>
              {SECTIONS.map(s => (
                <button key={s.id} type="button" onClick={() => setActive(s.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: active === s.id ? "#F3F4F6" : "transparent", border: "none", cursor: "pointer", borderRadius: 8, margin: "1px 6px", width: "calc(100% - 12px)", textAlign: "left", transition: "background 0.12s", color: active === s.id ? "#0A2540" : "#6B7280" }}>
                  <s.icon size={14} />
                  <span style={{ fontSize: 13, fontWeight: active === s.id ? 700 : 500 }}>{s.label}</span>
                </button>
              ))}
            </Card>
          </nav>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* PROFILE */}
            {active === "profile" && (
              <Card>
                <CardHeader title="Developer profile" desc="Your public-facing developer identity on the platform." />
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {profileError && (
                    <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>{profileError}</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)" }}>{(account?.name || "D").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{account?.name || ""}</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>{account?.email || ""} · Developer account</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>First name</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Last name</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email address</label>
                    <input value={account?.email || ""} readOnly
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#9CA3AF", background: "#F9FAFB", outline: "none", boxSizing: "border-box" as const, cursor: "default" }} />
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 5 }}>Contact support to change your email address.</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Company / organisation</label>
                    <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Website</label>
                    <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                </div>
              </Card>
            )}

            {/* ACCOUNT */}
            {active === "account" && (
              <>
                <Card>
                  <CardHeader title="Plan and environment" desc="Your current API plan and active environment." />
                  <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ padding: 16, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{tLabel} plan</p>
                          <p style={{ fontSize: 12, color: "#6B7280" }}>{limits.requests.toLocaleString()} API requests / month · Sandbox only</p>
                        </div>
                        <Badge variant="warning">Sandbox</Badge>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Requests used", value: `${(account?.api_calls_30d ?? 0).toLocaleString()} / ${limits.requests.toLocaleString()}` },
                        { label: "Resets on",     value: resetDate },
                        { label: "API version",   value: settings.apiVersion },
                        { label: "Region",        value: settings.developerRegion },
                      ].map(m => (
                        <div key={m.label} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "12px 14px" }}>
                          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{m.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                    <a href="/developers/support" style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", padding: "9px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                      Upgrade to production
                    </a>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Account ID" desc="Use this identifier when contacting support." />
                  <div style={{ padding: "16px 24px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <code style={{ fontSize: 13, color: "#6B7280", background: "#F3F4F6", padding: "7px 12px", borderRadius: 7, fontFamily: "monospace", flex: 1 }}>{account?.id || "—"}</code>
                      <button type="button" onClick={() => { if (account?.id) navigator.clipboard.writeText(account.id); }}
                        style={{ padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 7, background: "white", cursor: "pointer", color: "#6B7280" }}>
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* SECURITY */}
            {active === "security" && (
              <>
                <Card>
                  <CardHeader title="Password" desc="Update your account password." />
                  <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {pwError && (
                      <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>{pwError}</div>
                    )}
                    {pwSaved && (
                      <div style={{ padding: "10px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, fontSize: 13, color: "#059669", display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={14} /> Password updated successfully.
                      </div>
                    )}
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Current password</label>
                      <div style={{ position: "relative" }}>
                        <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password"
                          style={{ width: "100%", padding: "9px 40px 9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                        <button type="button" onClick={() => setShowCurrent(v => !v)}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }}>
                          {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>New password</label>
                      <div style={{ position: "relative" }}>
                        <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters"
                          style={{ width: "100%", padding: "9px 40px 9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                        <button type="button" onClick={() => setShowNew(v => !v)}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }}>
                          {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm new password</label>
                      <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                    <button type="button" onClick={handlePasswordUpdate} disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                      style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "#0A2540", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: pwSaving || !currentPw || !newPw || !confirmPw ? "default" : "pointer", opacity: pwSaving || !currentPw || !newPw || !confirmPw ? 0.6 : 1, transition: "opacity 0.15s" }}>
                      {pwSaving ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Updating…</> : "Update password"}
                    </button>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Two-factor authentication" desc="Add an extra layer of security to your account." />
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: 16 }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "#92400E" }}>Two-factor authentication is not enabled.</p>
                    </div>
                    <button type="button" style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "not-allowed", opacity: 0.6 }}>
                      Enable two-factor authentication
                    </button>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>2FA setup coming soon.</p>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Active sessions" desc="Devices currently signed into your developer account." />
                  <div style={{ padding: "12px 0 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid #F3F4F6" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>Current session</p>
                          <Badge variant="success" style={{ fontSize: 10 }}>Active</Badge>
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>This device · Active now</p>
                      </div>
                    </div>
                    <div style={{ padding: "14px 24px" }}>
                      <button type="button" onClick={handleRevokeOtherSessions} disabled={revoking}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "#FEF2F2", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: revoking ? "default" : "pointer", opacity: revoking ? 0.6 : 1, transition: "opacity 0.15s" }}>
                        {revoking ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Revoking…</> : "Revoke all other sessions"}
                      </button>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* NOTIFICATIONS */}
            {active === "notifications" && (
              <Card>
                <CardHeader title="Notification preferences" desc="Choose which platform events trigger email notifications." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Pipeline</p>
                  <ToggleRow label="Pipeline run completed"     desc="Get notified when a new identity snapshot is created."           defaultOn={true}  />
                  <ToggleRow label="Risk flag raised"           desc="Get notified when a risk flag is detected in a business profile." defaultOn={true}  />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 4 }}>Consent</p>
                  <ToggleRow label="Consent granted"            desc="A business granted your institution data access."                 defaultOn={true}  />
                  <ToggleRow label="Consent revoked"            desc="A business revoked your institution access."                      defaultOn={true}  />
                  <ToggleRow label="Consent expiring soon"      desc="A consent grant expires within 7 days."                          defaultOn={false} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 4 }}>Account</p>
                  <ToggleRow label="API key created or rotated" desc="A new API key was generated for your account."                   defaultOn={true}  />
                  <ToggleRow label="Usage threshold reached"    desc="Your API usage reaches 80% or 100% of the monthly limit."        defaultOn={true}  />
                  <ToggleRow label="Platform announcements"     desc="Product updates, new features, and maintenance notices."         defaultOn={false} />
                </div>
              </Card>
            )}

            {/* API & WEBHOOKS */}
            {active === "api" && (
              <>
                <Card>
                  <CardHeader title="Default environment" desc="Set the default environment for new API keys." />
                  <div style={{ padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {(["test", "live"] as const).map(e => {
                        const isLive = e === "live";
                        const access = account?.production_access ?? "none";
                        const locked = isLive && access !== "approved";
                        return (
                          <button key={e} type="button"
                            onClick={() => !locked && handleEnvChange(e)}
                            disabled={envSaving || locked}
                            title={locked ? access === "pending" ? "Production access request pending review" : "Production access required" : undefined}
                            style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: env === e ? "1px solid #0A2540" : "1px solid #D1D5DB", background: env === e ? "#0A2540" : "white", color: env === e ? "white" : locked ? "#D1D5DB" : "#6B7280", opacity: envSaving ? 0.6 : 1, cursor: locked ? "not-allowed" : "pointer", transition: "all 0.12s", textTransform: "capitalize" as const }}>
                            {e === "test" ? "Sandbox" : "Production"}
                          </button>
                        );
                      })}
                      {envSaving && <Loader2 size={14} style={{ color: "#9CA3AF", animation: "spin 0.8s linear infinite" }} />}
                    </div>

                    {/* Production access status banner */}
                    {(account?.production_access ?? "none") === "none" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <AlertCircle size={16} style={{ color: "#6B7280", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>Production access not enabled</p>
                            <p style={{ fontSize: 12, color: "#6B7280" }}>Request access to switch to live production API keys.</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setShowRequestModal(true)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #0A2540", background: "#0A2540", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                          Request access <ArrowRight size={12} />
                        </button>
                      </div>
                    )}

                    {(account?.production_access ?? "none") === "pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10 }}>
                        <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 2 }}>Production access request under review</p>
                          <p style={{ fontSize: 12, color: "#B45309" }}>Our team will review your request and notify you by email.</p>
                        </div>
                      </div>
                    )}

                    {(account?.production_access ?? "none") === "approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10 }}>
                        <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>Production access approved — you can switch to live keys.</p>
                      </div>
                    )}
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Webhook signing secret" desc="Use this secret to verify webhook payloads from Creditlinker." />
                  <div style={{ padding: "16px 24px 20px" }}>
                    {rotateError && (
                      <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 12 }}>{rotateError}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <code style={{ fontSize: 12, color: "#6B7280", background: "#F3F4F6", padding: "7px 12px", borderRadius: 7, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {webhookSecret
                          ? secretVisible
                            ? webhookSecret
                            : "••••••••••••••••••••••••••••••••"
                          : "Loading…"}
                      </code>
                      <button type="button" onClick={() => setSecretVisible(v => !v)}
                        style={{ padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 7, background: "white", cursor: "pointer", color: "#6B7280", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        {secretVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button type="button" onClick={copySecret} disabled={!webhookSecret}
                        style={{ padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "white", cursor: webhookSecret ? "pointer" : "default", color: copied ? "#10B981" : "#6B7280", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>
                      Verify incoming webhooks by checking the <code style={{ fontSize: 11, background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>X-CL-Signature</code> header against this secret.
                    </p>
                    <button type="button" onClick={handleRotateSecret} disabled={rotating}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "#FEF2F2", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: rotating ? "default" : "pointer", opacity: rotating ? 0.6 : 1 }}>
                      {rotating ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Rotating…</> : <><RefreshCw size={12} /> Rotate secret</>}
                    </button>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>Rotating generates a new secret immediately. Update your webhook handler before rotating to avoid failed verifications.</p>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="API preferences" desc="Configure default behavior for your API integration." />
                  <div style={{ padding: "16px 24px 20px" }}>
                    <ToggleRow label="Retry failed webhook deliveries" desc="Automatically retry failed webhook events up to 5 times over 24 hours." defaultOn={true}  />
                    <ToggleRow label="Include raw transaction data"    desc="Include transaction-level detail in webhook payloads where consented."  defaultOn={false} />
                    <ToggleRow label="Verbose error responses"         desc="Return detailed error messages in API responses (recommended for dev)."  defaultOn={true}  />
                  </div>
                </Card>
              </>
            )}

            {/* ADVANCED */}
            {active === "advanced" && (
              <>
                <Card>
                  <CardHeader title="CORS allowed origins" desc="Domains permitted to make browser requests to the Creditlinker API." />
                  <div style={{ padding: "16px 24px 20px" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Allowed origins</label>
                    <input placeholder="https://yourapp.com"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>Comma-separated list. Use * to allow all (not recommended for production).</p>
                  </div>
                </Card>
                <Card style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Trash2 size={18} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 4 }}>Delete developer account</p>
                        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 16 }}>Permanently delete your account, all API keys, webhook configurations, and usage history. This action cannot be undone.</p>
                        <button type="button" onClick={() => setShowDeleteModal(true)}
                          style={{ padding: "9px 18px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Delete account
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
