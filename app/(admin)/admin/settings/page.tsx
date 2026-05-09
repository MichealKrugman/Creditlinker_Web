"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Shield, Users, Lock, AlertTriangle,
  Save, Plus, Trash2, CheckCircle2, Globe,
  Database, Activity, RefreshCw, Loader2,
} from "lucide-react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import {
  getMockAdminUser, isSuperAdmin,
  MODULE_LABELS, PermissionModule, AccessLevel, PermissionString,
} from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

async function callFn(name: string, body?: object, method: "POST" | "GET" = "POST") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const url   = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res   = await fetch(method === "GET" ? `${url}` : url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
type AdminRecord = {
  id: string; email: string; role: string;
  is_deactivated: boolean; last_sign_in: string | null; created_at: string;
};

type PlatformSettings = {
  platform_name:              string;
  api_base_url:               string;
  support_email:              string;
  maintenance_mode:           boolean;
  session_timeout_minutes:    number;
  mfa_required:               boolean;
  max_login_attempts:         number;
  platform_logging_enabled:   boolean;
  audit_log_retention_days:   number;
};

const DEFAULTS: PlatformSettings = {
  platform_name:            "Creditlinker",
  api_base_url:             "https://api.creditlinker.ng",
  support_email:            "support@creditlinker.ng",
  maintenance_mode:         false,
  session_timeout_minutes:  30,
  mfa_required:             true,
  max_login_attempts:       5,
  platform_logging_enabled: true,
  audit_log_retention_days: 30,
};

const ALL_MODULES: PermissionModule[] = [
  "businesses","financers","developers","financial_data",
  "verifications","reports","system","audit_logs","notifications","settings",
];

// ─────────────────────────────────────────────────────────────
//  ACCESS DENIED
// ─────────────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16, textAlign:"center", padding:32 }}>
      <div style={{ width:64, height:64, borderRadius:16, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Lock size={28} style={{ color:"#EF4444" }} />
      </div>
      <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:20, color:"#0A2540", marginBottom:4 }}>Settings Restricted</h2>
      <p style={{ fontSize:14, color:"#6B7280", maxWidth:360, lineHeight:1.6 }}>
        Platform settings are restricted to Super Admins only.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TOGGLE COMPONENT
// ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width:44, height:24, borderRadius:12, flexShrink:0,
        background: value ? "#10B981" : "#D1D5DB",
        position:"relative", cursor: disabled ? "not-allowed" : "pointer",
        transition:"background 0.2s", opacity: disabled ? 0.5 : 1,
      }}>
      <div style={{
        position:"absolute", top:3,
        left: value ? "calc(100% - 19px)" : 3,
        width:18, height:18, borderRadius:"50%", background:"white",
        boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
        transition:"left 0.15s",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  NEW ADMIN MODAL
// ─────────────────────────────────────────────────────────────
function NewAdminModal({ onClose, onSave }: { onClose: () => void; onSave: (email: string, role: string) => Promise<void> }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState<"admin" | "super_admin">("admin");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [perms,   setPerms]   = useState<Record<PermissionModule, AccessLevel | "none">>(() =>
    Object.fromEntries(ALL_MODULES.map(m => [m, "none"])) as Record<PermissionModule, AccessLevel | "none">
  );

  async function handleCreate() {
    if (!email.trim()) return;
    setSaving(true); setError("");
    try {
      await onSave(email.trim(), role);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(10,37,64,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.18)", width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #F3F4F6" }}>
          <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:17, color:"#0A2540", marginBottom:4 }}>Add Admin Account</h3>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>An invite link will be sent to the email address.</p>
        </div>
        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Work Email *</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@creditlinker.ng" type="email" style={{ height:38, fontSize:13, maxWidth:380 }} />
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Role</label>
            <div style={{ display:"flex", gap:10 }}>
              {(["admin","super_admin"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  style={{ flex:1, padding:"10px 14px", border:"1.5px solid", borderColor: role===r ? "#0A2540" : "#E5E7EB", borderRadius:10, background: role===r ? "#F9FAFB" : "white", cursor:"pointer", textAlign:"left" as const }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0A2540", marginBottom:2 }}>{r === "super_admin" ? "Super Admin" : "Admin"}</p>
                  <p style={{ fontSize:11, color:"#9CA3AF" }}>{r === "super_admin" ? "Full platform access" : "Scoped access — configure below"}</p>
                </button>
              ))}
            </div>
          </div>

          {role === "admin" && (
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Permission Scope</label>
              <div style={{ border:"1px solid #E5E7EB", borderRadius:10, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 80px", padding:"8px 14px", background:"#FAFAFA", borderBottom:"1px solid #F3F4F6" }}>
                  {["Module","None","View","Manage"].map(h => (
                    <p key={h} style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", textAlign: h !== "Module" ? "center" as const : "left" as const }}>{h}</p>
                  ))}
                </div>
                {ALL_MODULES.map((mod, i) => {
                  const locked = mod === "settings";
                  return (
                    <div key={mod} style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 80px", padding:"10px 14px", borderBottom: i < ALL_MODULES.length - 1 ? "1px solid #F9FAFB" : "none", alignItems:"center", opacity: locked ? 0.4 : 1 }}>
                      <p style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{MODULE_LABELS[mod]}</p>
                      {(["none","view","manage"] as const).map((level) => (
                        <div key={level} style={{ display:"flex", justifyContent:"center" }}>
                          <input type="radio" name={mod} value={level} checked={perms[mod] === level} disabled={locked}
                            onChange={() => !locked && setPerms(p => ({ ...p, [mod]: level }))}
                            style={{ cursor: locked ? "not-allowed" : "pointer", accentColor:"#0A2540" }} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize:12, color:"#EF4444" }}>{error}</p>}

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4, borderTop:"1px solid #F3F4F6" }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!email.trim() || saving} onClick={handleCreate} style={{ gap:6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const user = getMockAdminUser();
  if (!isSuperAdmin(user)) return <AccessDenied />;

  const [activeTab,    setActiveTab]    = useState<"admins"|"platform"|"security"|"logging">("admins");
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState("");

  // ── Admins tab state ─────────────────────────────────────────
  const [admins,        setAdmins]        = useState<AdminRecord[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // ── Settings state (shared across platform/security/logging) ─
  const [settings,        setSettings]        = useState<PlatformSettings>(DEFAULTS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  // Track unsaved dirty state per tab
  const [dirty, setDirty] = useState(false);

  // ── Load admins ──────────────────────────────────────────────
  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const data = await callFn("get-admin-users", undefined, "GET");
      setAdmins(data.users ?? []);
    } catch (e) {
      console.error("[settings] load admins failed", e);
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  // ── Load settings ────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await callFn("admin-save-settings", undefined, "GET");
      const s = data.settings ?? {};
      setSettings({
        platform_name:            s.platform_name            ?? DEFAULTS.platform_name,
        api_base_url:             s.api_base_url             ?? DEFAULTS.api_base_url,
        support_email:            s.support_email            ?? DEFAULTS.support_email,
        maintenance_mode:         s.maintenance_mode         === true || s.maintenance_mode === "true",
        session_timeout_minutes:  Number(s.session_timeout_minutes)  || DEFAULTS.session_timeout_minutes,
        mfa_required:             s.mfa_required             !== false && s.mfa_required !== "false",
        max_login_attempts:       Number(s.max_login_attempts)       || DEFAULTS.max_login_attempts,
        platform_logging_enabled: s.platform_logging_enabled !== false && s.platform_logging_enabled !== "false",
        audit_log_retention_days: Number(s.audit_log_retention_days) || DEFAULTS.audit_log_retention_days,
      });
    } catch (e) {
      console.error("[settings] load settings failed", e);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmins(); loadSettings(); }, [loadAdmins, loadSettings]);

  // ── Save settings ────────────────────────────────────────────
  async function handleSave(keys: (keyof PlatformSettings)[]) {
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      const payload = Object.fromEntries(keys.map(k => [k, settings[k]]));
      // Map to the key names the function expects
      const mapped: Record<string, unknown> = {};
      if ("platform_name"            in payload) mapped["platform_name"]            = payload["platform_name"];
      if ("api_base_url"             in payload) mapped["api_base_url"]             = payload["api_base_url"];
      if ("support_email"            in payload) mapped["support_email"]            = payload["support_email"];
      if ("maintenance_mode"         in payload) mapped["maintenance_mode"]         = payload["maintenance_mode"];
      if ("session_timeout_minutes"  in payload) mapped["session_timeout_minutes"]  = payload["session_timeout_minutes"];
      if ("mfa_required"             in payload) mapped["mfa_required"]             = payload["mfa_required"];
      if ("max_login_attempts"       in payload) mapped["max_login_attempts"]       = payload["max_login_attempts"];
      if ("platform_logging_enabled" in payload) mapped["platform_logging_enabled"] = payload["platform_logging_enabled"];
      if ("audit_log_retention_days" in payload) mapped["audit_log_retention_days"] = payload["audit_log_retention_days"];

      await callFn("admin-save-settings", { settings: mapped });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Deactivate admin ─────────────────────────────────────────
  async function handleDeactivate(userId: string) {
    try {
      await callFn("deactivate-admin-user", { user_id: userId });
      await loadAdmins();
    } catch (e: any) {
      alert(e.message ?? "Failed to deactivate admin");
    }
  }

  // ── Invite admin ─────────────────────────────────────────────
  async function handleInviteAdmin(email: string, role: string) {
    await callFn("invite-admin-user", { email, role });
    await loadAdmins();
  }

  function set<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
  }

  const tabs = [
    { id:"admins",   label:"Admin Accounts", icon:<Users    size={13} /> },
    { id:"platform", label:"Platform",        icon:<Globe    size={13} /> },
    { id:"security", label:"Security",        icon:<Shield   size={13} /> },
    { id:"logging",  label:"Logging",         icon:<Activity size={13} /> },
  ] as const;

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em", marginBottom:4 }}>Settings</h2>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Badge variant="secondary">Super Admin only</Badge>
          <span style={{ fontSize:13, color:"#9CA3AF" }}>Platform configuration</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:4, background:"white", border:"1px solid #E5E7EB", borderRadius:12, padding:4, width:"fit-content" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setDirty(false); setSaveError(""); setSaved(false); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"none", background: activeTab===tab.id ? "#0A2540" : "transparent", color: activeTab===tab.id ? "white" : "#6B7280", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.12s" }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── ADMINS TAB ─────────────────────────────────────────── */}
      {activeTab === "admins" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#374151" }}>
              Admin Accounts {!adminsLoading && `(${admins.length})`}
            </p>
            <div style={{ display:"flex", gap:8 }}>
              <Button variant="outline" size="sm" style={{ gap:6 }} onClick={loadAdmins} disabled={adminsLoading}>
                <RefreshCw size={13} className={adminsLoading ? "animate-spin" : ""} />
              </Button>
              <Button variant="primary" size="sm" style={{ gap:6 }} onClick={() => setShowNewAdmin(true)}>
                <Plus size={13} /> Add Admin
              </Button>
            </div>
          </div>

          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
            {adminsLoading ? (
              <div style={{ padding:"48px 22px", textAlign:"center" }}>
                <Loader2 size={20} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" />
                <p style={{ fontSize:14, color:"#9CA3AF" }}>Loading admin accounts…</p>
              </div>
            ) : admins.length === 0 ? (
              <div style={{ padding:"48px 22px", textAlign:"center" }}>
                <p style={{ fontSize:14, color:"#6B7280" }}>No admin accounts found.</p>
              </div>
            ) : admins.map((admin, i) => (
              <div key={admin.id} style={{ padding:"16px 22px", borderBottom: i < admins.length - 1 ? "1px solid #F9FAFB" : "none", opacity: admin.is_deactivated ? 0.5 : 1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background: admin.role==="owner" ? "linear-gradient(135deg,rgba(0,212,255,0.15),rgba(0,212,255,0.3))" : "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.3))", border:`1px solid ${admin.role==="owner" ? "rgba(0,212,255,0.3)" : "rgba(245,158,11,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color: admin.role==="owner" ? "#00D4FF" : "#F59E0B", flexShrink:0 }}>
                    {(admin.email ?? "??").slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#0A2540" }}>{admin.email}</p>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", padding:"2px 7px", borderRadius:9999, color: admin.role==="owner" ? "#00D4FF" : "#F59E0B", background: admin.role==="owner" ? "rgba(0,212,255,0.08)" : "rgba(245,158,11,0.08)", border:`1px solid ${admin.role==="owner" ? "rgba(0,212,255,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                        {admin.role}
                      </span>
                      {admin.is_deactivated && (
                        <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:9999, color:"#EF4444", background:"#FEF2F2", border:"1px solid rgba(239,68,68,0.2)" }}>Suspended</span>
                      )}
                    </div>
                    <p style={{ fontSize:12, color:"#9CA3AF" }}>
                      Last active: {admin.last_sign_in ? new Date(admin.last_sign_in).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  {!admin.is_deactivated && (
                    <button onClick={() => handleDeactivate(admin.id)}
                      style={{ width:28, height:28, borderRadius:6, border:"1px solid #E5E7EB", background:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#9CA3AF", flexShrink:0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#EF4444"; (e.currentTarget as HTMLElement).style.color="#EF4444"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#E5E7EB"; (e.currentTarget as HTMLElement).style.color="#9CA3AF"; }}
                      title="Deactivate admin">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLATFORM TAB ───────────────────────────────────────── */}
      {activeTab === "platform" && (
        <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:20 }}>
          {settingsLoading ? (
            <div style={{ padding:"32px 0", textAlign:"center" }}>
              <Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" />
            </div>
          ) : (
            <>
              {[
                { label:"Platform Name", key:"platform_name" as const,  type:"text",  help:"Displayed across the platform and in emails." },
                { label:"API Base URL",  key:"api_base_url"  as const,  type:"text",  help:"The base URL for all API requests." },
                { label:"Support Email", key:"support_email" as const,  type:"email", help:"Displayed on error pages and emails." },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{field.label}</label>
                  <Input value={settings[field.key] as string}
                    onChange={(e) => set(field.key, e.target.value as any)}
                    type={field.type} style={{ height:40, fontSize:13, maxWidth:400 }} />
                  <p style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>{field.help}</p>
                </div>
              ))}

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #F3F4F6" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Maintenance Mode</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>Puts the platform in read-only mode for all users.</p>
                </div>
                <Toggle value={settings.maintenance_mode} onChange={(v) => set("maintenance_mode", v)} />
              </div>

              <div style={{ background:"#F0FDFF", border:"1px solid rgba(0,212,255,0.2)", borderRadius:10, padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <Database size={14} style={{ color:"#0891B2", flexShrink:0, marginTop:1 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0E7490", marginBottom:3 }}>Data is never deleted</p>
                  <p style={{ fontSize:12, color:"#0891B2", lineHeight:1.6 }}>
                    Financial identity data, transaction history, pipeline outputs, and audit records are retained permanently.
                  </p>
                </div>
              </div>
            </>
          )}

          <SaveBar onSave={() => handleSave(["platform_name","api_base_url","support_email","maintenance_mode"])} saving={saving} saved={saved} error={saveError} dirty={dirty} />
        </div>
      )}

      {/* ── SECURITY TAB ───────────────────────────────────────── */}
      {activeTab === "security" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22 }}>
            {settingsLoading ? (
              <div style={{ padding:"32px 0", textAlign:"center" }}>
                <Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" />
              </div>
            ) : (
              <>
                <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540", marginBottom:16 }}>Session & Access Policy</p>
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Admin Session Timeout (minutes)</p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>Admins are logged out after this period of inactivity.</p>
                    </div>
                    <Input value={String(settings.session_timeout_minutes)}
                      onChange={(e) => set("session_timeout_minutes", parseInt(e.target.value) || 30)}
                      type="number" style={{ height:36, fontSize:13, width:80, flexShrink:0 }} />
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Max Login Attempts</p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>Account is locked after this many failed attempts.</p>
                    </div>
                    <Input value={String(settings.max_login_attempts)}
                      onChange={(e) => set("max_login_attempts", parseInt(e.target.value) || 5)}
                      type="number" style={{ height:36, fontSize:13, width:80, flexShrink:0 }} />
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Require MFA for Admins</p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>All admin accounts must use multi-factor authentication.</p>
                    </div>
                    <Toggle value={settings.mfa_required} onChange={(v) => set("mfa_required", v)} />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
              <SaveBar onSave={() => handleSave(["session_timeout_minutes","max_login_attempts","mfa_required"])} saving={saving} saved={saved} error={saveError} dirty={dirty} />
            </div>
          </div>

          <div style={{ background:"#FEF2F2", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, padding:"16px 18px", display:"flex", gap:10 }}>
            <AlertTriangle size={15} style={{ color:"#EF4444", flexShrink:0, marginTop:1 }} />
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#991B1B", marginBottom:2 }}>Danger Zone</p>
              <p style={{ fontSize:12, color:"#B91C1C", lineHeight:1.5, marginBottom:10 }}>These actions are irreversible.</p>
              <Button variant="outline" size="sm" style={{ color:"#EF4444", borderColor:"rgba(239,68,68,0.3)", gap:6 }}>
                <Database size={13} /> Purge Sandbox Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGGING TAB ────────────────────────────────────────── */}
      {activeTab === "logging" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Master toggle card */}
          <div style={{ background:"white", border:`1.5px solid ${settings.platform_logging_enabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`, borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background: settings.platform_logging_enabled ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border:`1px solid ${settings.platform_logging_enabled ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Activity size={18} style={{ color: settings.platform_logging_enabled ? "#10B981" : "#EF4444" }} />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#0A2540", marginBottom:4 }}>Platform Event Logging</p>
                  <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, maxWidth:480 }}>
                    When enabled, every action across the platform is recorded to the <code style={{ background:"#F3F4F6", padding:"1px 5px", borderRadius:4, fontSize:12 }}>platform_events</code> table
                    — covering cards, scoring, portal, SDK, mobile apps, and system jobs.
                    Turn this off to conserve Supabase storage on the free plan.
                  </p>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                <Toggle
                  value={settings.platform_logging_enabled}
                  onChange={(v) => {
                    set("platform_logging_enabled", v);
                  }}
                  disabled={settingsLoading}
                />
                <span style={{ fontSize:11, fontWeight:700, color: settings.platform_logging_enabled ? "#10B981" : "#EF4444" }}>
                  {settings.platform_logging_enabled ? "LOGGING ON" : "LOGGING OFF"}
                </span>
              </div>
            </div>

            {/* Status banner */}
            {!settings.platform_logging_enabled && (
              <div style={{ background:"#FEF9C3", border:"1px solid rgba(234,179,8,0.3)", borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                <AlertTriangle size={14} style={{ color:"#CA8A04", flexShrink:0 }} />
                <p style={{ fontSize:12, color:"#854D0E" }}>
                  <strong>Logging is off.</strong> New platform events are not being recorded.
                  The audit log page will stop receiving new data until logging is turned back on.
                </p>
              </div>
            )}

            <SaveBar
              onSave={() => handleSave(["platform_logging_enabled"])}
              saving={saving} saved={saved} error={saveError} dirty={dirty}
              saveLabel={settings.platform_logging_enabled ? "Enable Logging" : "Disable Logging"}
              saveVariant={settings.platform_logging_enabled ? "primary" : "outline"}
              saveStyle={!settings.platform_logging_enabled ? { color:"#EF4444", borderColor:"rgba(239,68,68,0.3)" } : {}}
            />
          </div>

          {/* Retention window */}
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>Retention Window</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Delete events older than (days)</p>
                <p style={{ fontSize:12, color:"#9CA3AF" }}>
                  A nightly cron job purges <code style={{ background:"#F3F4F6", padding:"1px 4px", borderRadius:4, fontSize:11 }}>platform_events</code> rows older than this.
                  Set to 0 to retain forever (not recommended on the free plan).
                </p>
              </div>
              <Input
                value={String(settings.audit_log_retention_days)}
                onChange={(e) => set("audit_log_retention_days", parseInt(e.target.value) || 30)}
                type="number" style={{ height:36, fontSize:13, width:80, flexShrink:0 }}
              />
            </div>
            <div style={{ paddingTop:8, borderTop:"1px solid #F3F4F6" }}>
              <SaveBar onSave={() => handleSave(["audit_log_retention_days"])} saving={saving} saved={saved} error={saveError} dirty={dirty} />
            </div>
          </div>

          {/* Info card */}
          <div style={{ background:"#F0F9FF", border:"1px solid rgba(56,189,248,0.25)", borderRadius:12, padding:"14px 16px", display:"flex", gap:10 }}>
            <Activity size={14} style={{ color:"#0284C7", flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#0369A1", marginBottom:4 }}>What gets logged</p>
              <p style={{ fontSize:12, color:"#0284C7", lineHeight:1.7 }}>
                Cards (transactions, rules, freeze/unfreeze) · Scoring (pipeline runs, score updates, KYC) ·
                Portal (logins, settings changes, admin actions) · SDK (API calls, key events) ·
                Mobile (app logins, key screens) · System (cron jobs, scheduled tasks)
              </p>
            </div>
          </div>
        </div>
      )}

      {showNewAdmin && (
        <NewAdminModal
          onClose={() => setShowNewAdmin(false)}
          onSave={handleInviteAdmin}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SAVE BAR — shared across tabs
// ─────────────────────────────────────────────────────────────
function SaveBar({
  onSave, saving, saved, error, dirty,
  saveLabel = "Save Changes",
  saveVariant = "primary",
  saveStyle = {},
}: {
  onSave: () => void;
  saving: boolean;
  saved:  boolean;
  error:  string;
  dirty:  boolean;
  saveLabel?:   string;
  saveVariant?: "primary" | "outline";
  saveStyle?:   React.CSSProperties;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <Button variant={saveVariant} size="sm" style={{ gap:6, ...saveStyle }} onClick={onSave} disabled={saving}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? "Saving…" : saveLabel}
      </Button>
      {saved  && <span style={{ fontSize:12, color:"#10B981", display:"flex", alignItems:"center", gap:5 }}><CheckCircle2 size={13} /> Saved</span>}
      {error  && <span style={{ fontSize:12, color:"#EF4444" }}>{error}</span>}
      {dirty && !saved && !saving && <span style={{ fontSize:12, color:"#9CA3AF" }}>Unsaved changes</span>}
    </div>
  );
}
