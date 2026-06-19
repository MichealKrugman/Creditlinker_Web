"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Lock, AlertTriangle,
  Save, Plus, Trash2, CheckCircle2, Globe,
  Database, Activity, RefreshCw, Loader2, Info,
  MonitorSmartphone, LogOut, Clock,
} from "lucide-react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import {
  isSuperAdmin,
  ROLE_LABELS, ROLE_DESCRIPTIONS, AdminRole,
} from "@/lib/admin-rbac";
import { useAdminUser } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";
import { callAdminFn } from "@/lib/admin-api";

const callFn = callAdminFn;

async function fetchAdminUsers(): Promise<any> {
  const { data, error } = await supabase.rpc("rpc_list_admin_users");
  if (error) throw new Error(error.message);
  const users = (data ?? []).map((u: any) => ({
    id:             u.id,
    email:          u.email ?? "",
    name:           (u.user_metadata as any)?.name ?? "",
    admin_role:     (u.app_metadata as any)?.admin_role ?? "viewer",
    permissions:    (u.app_metadata as any)?.permissions ?? [],
    last_sign_in:   u.last_sign_in_at ?? null,
    created_at:     u.created_at,
    is_deactivated: !!(u.app_metadata as any)?.deactivated || !!u.banned_until,
  }));
  return { users, count: users.length };
}

// Returns Record<string, any> so downstream code can access values without type errors
async function fetchSettings(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value");
  if (error) throw new Error(error.message);
  const out: Record<string, any> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
type AdminRecord = {
  id:             string;
  email:          string;
  name:           string;
  admin_role:     AdminRole;
  permissions:    string[];
  is_deactivated: boolean;
  last_sign_in:   string | null;
  created_at:     string;
};

type PlatformSettings = {
  platform_name:            string;
  api_base_url:             string;
  support_email:            string;
  maintenance_mode:         boolean;
  session_timeout_minutes:  number;
  mfa_required:             boolean;
  max_login_attempts:       number;
  platform_logging_enabled: boolean;
  audit_log_retention_days: number;
};

const DEFAULTS: PlatformSettings = {
  platform_name:            "Creditlinker",
  api_base_url:             "https://api.creditlinker.com.ng",
  support_email:            "support@creditlinker.com.ng",
  maintenance_mode:         false,
  session_timeout_minutes:  30,
  mfa_required:             true,
  max_login_attempts:       5,
  platform_logging_enabled: true,
  audit_log_retention_days: 30,
};

const ROLE_COLORS: Record<AdminRole, { bg: string; color: string; border: string }> = {
  super_admin:      { bg: "rgba(0,212,255,0.08)",   color: "#0891B2", border: "rgba(0,212,255,0.25)" },
  operations_admin: { bg: "rgba(245,158,11,0.08)",  color: "#D97706", border: "rgba(245,158,11,0.25)" },
  risk_admin:       { bg: "rgba(139,92,246,0.08)",  color: "#7C3AED", border: "rgba(139,92,246,0.25)" },
  viewer:           { bg: "#F3F4F6",                color: "#6B7280", border: "#E5E7EB" },
};

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
//  TOGGLE
// ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!value)}
      style={{ width:44, height:24, borderRadius:12, flexShrink:0, background: value ? "#10B981" : "#D1D5DB", position:"relative", cursor: disabled ? "not-allowed" : "pointer", transition:"background 0.2s", opacity: disabled ? 0.5 : 1 }}>
      <div style={{ position:"absolute", top:3, left: value ? "calc(100% - 19px)" : 3, width:18, height:18, borderRadius:"50%", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left 0.15s" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  INVITE ADMIN MODAL
// ─────────────────────────────────────────────────────────────
const INVITABLE_ROLES: AdminRole[] = ["operations_admin", "risk_admin", "viewer"];

function InviteAdminModal({ onClose, onSave }: {
  onClose: () => void;
  onSave:  (email: string, name: string, admin_role: AdminRole) => Promise<void>;
}) {
  const [email,     setEmail]     = useState("");
  const [name,      setName]      = useState("");
  const [adminRole, setAdminRole] = useState<AdminRole>("operations_admin");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  async function handleCreate() {
    if (!email.trim()) return;
    setSaving(true); setError("");
    try { await onSave(email.trim(), name.trim(), adminRole); onClose(); }
    catch (e: any) { setError(e.message ?? "Failed to send invitation"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(10,37,64,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.18)", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #F3F4F6" }}>
          <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:17, color:"#0A2540", marginBottom:4 }}>Invite Admin</h3>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>An invitation email will be sent. They must accept to activate their account.</p>
        </div>
        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" style={{ height:38, fontSize:13 }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Work Email *</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@creditlinker.com.ng" type="email" style={{ height:38, fontSize:13 }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Role *</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {INVITABLE_ROLES.map((r) => {
                const c = ROLE_COLORS[r];
                const selected = adminRole === r;
                return (
                  <button key={r} onClick={() => setAdminRole(r)}
                    style={{ padding:"12px 16px", border:`1.5px solid ${selected ? "#0A2540" : "#E5E7EB"}`, borderRadius:10, background: selected ? "#F9FAFB" : "white", cursor:"pointer", textAlign:"left" as const, display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#0A2540" }}>{ROLE_LABELS[r]}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
                          {r === "viewer" ? "Read only" : r === "risk_admin" ? "Finance" : "Operations"}
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{ROLE_DESCRIPTIONS[r]}</p>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${selected ? "#0A2540" : "#D1D5DB"}`, background: selected ? "#0A2540" : "white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                      {selected && <div style={{ width:8, height:8, borderRadius:"50%", background:"white" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ background:"#F9FAFB", borderRadius:10, padding:"12px 14px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Access granted</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {(adminRole === "operations_admin" ? [
                "Businesses (manage)", "Financers (manage)", "Developers (manage)",
                "Verifications (manage)", "Notifications (manage)",
                "Financial Data (view)", "Reports (view)", "Audit Logs (view)",
              ] : adminRole === "risk_admin" ? [
                "Businesses (view)", "Financers (view)",
                "Financial Data (manage)", "Reports (manage)",
                "Verifications (view)", "Audit Logs (view)",
              ] : [
                "Businesses (view)", "Financers (view)", "Developers (view)",
                "Financial Data (view)", "Verifications (view)",
                "Reports (view)", "Audit Logs (view)", "Notifications (view)",
              ]).map((p) => (
                <span key={p} style={{ fontSize:11, padding:"3px 9px", background:"white", border:"1px solid #E5E7EB", borderRadius:9999, color:"#374151" }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ background:"#F0FDFF", border:"1px solid rgba(0,212,255,0.2)", borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
            <Info size={13} style={{ color:"#0891B2", flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:12, color:"#0E7490", lineHeight:1.5 }}>
              Super Admin accounts must be created manually via Supabase Auth. This form is for operational access only.
            </p>
          </div>
          {error && <p style={{ fontSize:12, color:"#EF4444" }}>{error}</p>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4, borderTop:"1px solid #F3F4F6" }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!email.trim() || saving} onClick={handleCreate} style={{ gap:6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {saving ? "Sending…" : "Send Invite"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SAVE BAR
// ─────────────────────────────────────────────────────────────
function SaveBar({
  onSave, saving, saved, error, dirty,
  saveLabel = "Save Changes",
  saveVariant = "primary" as "primary" | "outline",
  saveStyle = {} as React.CSSProperties,
}: {
  onSave: () => void; saving: boolean; saved: boolean; error: string; dirty: boolean;
  saveLabel?: string; saveVariant?: "primary" | "outline"; saveStyle?: React.CSSProperties;
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

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
// Per-tab save state so saves on one tab don't bleed into another
type SaveState = { saving: boolean; saved: boolean; error: string; dirty: boolean };
const SAVE_INIT: SaveState = { saving: false, saved: false, error: "", dirty: false };
type SaveTab = "platform" | "security" | "logging" | "retention";

export default function AdminSettingsPage() {
  const { adminUser, loading: userLoading } = useAdminUser();

  const [activeTab,       setActiveTab]       = useState<"admins"|"platform"|"security"|"logging"|"sessions">("admins");
  const [showInvite,      setShowInvite]      = useState(false);
  const [saveStates,      setSaveStates]      = useState<Record<SaveTab, SaveState>>({
    platform:  { ...SAVE_INIT },
    security:  { ...SAVE_INIT },
    logging:   { ...SAVE_INIT },
    retention: { ...SAVE_INIT },
  });
  const [admins,          setAdmins]          = useState<AdminRecord[]>([]);
  const [adminsLoading,   setAdminsLoading]   = useState(false);
  const [settings,        setSettings]        = useState<PlatformSettings>(DEFAULTS);
  const [settingsLoading, setSettingsLoading] = useState(false);

  function setSave(tab: SaveTab, patch: Partial<SaveState>) {
    setSaveStates(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const data = await fetchAdminUsers();
      setAdmins(data.users ?? []);
    } catch (e) { console.error("[settings] load admins failed", e); }
    finally { setAdminsLoading(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const s = await fetchSettings();
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
    } catch (e) { console.error("[settings] load settings failed", e); }
    finally { setSettingsLoading(false); }
  }, []);

  useEffect(() => { loadAdmins(); loadSettings(); }, [loadAdmins, loadSettings]);

  if (userLoading) return null;
  if (!isSuperAdmin(adminUser)) return <AccessDenied />;

  function set<K extends keyof PlatformSettings>(tab: SaveTab, key: K, value: PlatformSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSave(tab, { dirty: true, saved: false });
  }

  async function handleSave(tab: SaveTab, keys: (keyof PlatformSettings)[]) {
    setSave(tab, { saving: true, error: "", saved: false });
    try {
      const payload: Record<string, unknown> = {};
      keys.forEach(k => { payload[k] = settings[k]; });
      await callFn({ action: "save-settings", settings: payload });
      setSave(tab, { saving: false, saved: true, dirty: false });
      setTimeout(() => setSave(tab, { saved: false }), 3000);
    } catch (e: any) {
      setSave(tab, { saving: false, error: e.message ?? "Failed to save" });
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm("Deactivate this admin? Their session will be invalidated immediately.")) return;
    try {
      await callFn({ action: "deactivate-admin", user_id: userId });
      await loadAdmins();
    } catch (e: any) { alert(e.message ?? "Failed to deactivate"); }
  }

  async function handleInvite(email: string, name: string, admin_role: AdminRole) {
    await callFn({ action: "invite-admin", email, name, admin_role });
    await loadAdmins();
  }

  const TABS = [
    { id: "admins",   label: "Admin Accounts", icon: <Users size={14} /> },
    { id: "platform", label: "Platform",        icon: <Globe size={14} /> },
    { id: "security", label: "Security",        icon: <Shield size={14} /> },
    { id: "logging",  label: "Logging",         icon: <Activity size={14} /> },
    { id: "sessions", label: "Sessions",        icon: <MonitorSmartphone size={14} /> },
  ] as const;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em", marginBottom:4 }}>Settings</h2>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>Platform configuration and admin management</p>
        </div>
        {activeTab === "admins" && (
          <Button variant="primary" size="sm" style={{ gap:6 }} onClick={() => setShowInvite(true)}>
            <Plus size={13} /> Invite Admin
          </Button>
        )}
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:4, background:"#F9FAFB", borderRadius:12, padding:4, width:"fit-content", flexWrap:"wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.15s",
              background: activeTab === tab.id ? "white" : "transparent",
              color:      activeTab === tab.id ? "#0A2540" : "#9CA3AF",
              boxShadow:  activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── ADMINS ─────────────────────────────────────────────── */}
      {activeTab === "admins" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"10px 22px 8px", background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", display:"grid", gridTemplateColumns:"1fr 130px 160px 100px" }}>
              {["Admin","Role","Joined",""].map(h => (
                <p key={h} style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</p>
              ))}
            </div>
            {adminsLoading ? (
              <div style={{ padding:"40px 22px", textAlign:"center" }}>
                <Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" />
                <p style={{ fontSize:13, color:"#9CA3AF" }}>Loading admins…</p>
              </div>
            ) : admins.length === 0 ? (
              <div style={{ padding:"40px 22px", textAlign:"center" }}>
                <p style={{ fontSize:13, color:"#9CA3AF" }}>No admin accounts found.</p>
              </div>
            ) : admins.map((admin, i) => {
              const rc = ROLE_COLORS[admin.admin_role] ?? ROLE_COLORS.viewer;
              return (
                <div key={admin.id} style={{ display:"grid", gridTemplateColumns:"1fr 130px 160px 100px", padding:"12px 22px", borderBottom: i < admins.length-1 ? "1px solid #F9FAFB" : "none", alignItems:"center", opacity: admin.is_deactivated ? 0.45 : 1 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:1 }}>{admin.name || admin.email}</p>
                    <p style={{ fontSize:11, color:"#9CA3AF" }}>{admin.email}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, width:"fit-content" }}>
                    {ROLE_LABELS[admin.admin_role]}
                  </span>
                  <p style={{ fontSize:12, color:"#6B7280" }}>
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                  </p>
                  {admin.is_deactivated ? (
                    <span style={{ fontSize:11, color:"#9CA3AF" }}>Deactivated</span>
                  ) : (
                    <button onClick={() => handleDeactivate(admin.id)}
                      style={{ fontSize:11, color:"#EF4444", background:"none", border:"1px solid rgba(239,68,68,0.25)", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontWeight:600, width:"fit-content" }}>
                      Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PLATFORM ───────────────────────────────────────────── */}
      {activeTab === "platform" && (
        <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:20 }}>
          {settingsLoading ? (
            <div style={{ padding:"32px 0", textAlign:"center" }}><Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" /></div>
          ) : (
            <>
              {[
                { label:"Platform Name", key:"platform_name" as const, type:"text",  help:"Displayed across the platform and in emails." },
                { label:"API Base URL",  key:"api_base_url"  as const, type:"text",  help:"The base URL for all API requests." },
                { label:"Support Email", key:"support_email" as const, type:"email", help:"Displayed on error pages and emails." },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{field.label}</label>
                  <Input value={settings[field.key] as string} onChange={(e) => set("platform", field.key, e.target.value as any)} type={field.type} style={{ height:40, fontSize:13, maxWidth:400 }} />
                  <p style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>{field.help}</p>
                </div>
              ))}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #F3F4F6" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Maintenance Mode</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>Puts the platform in read-only mode for all users.</p>
                </div>
                <Toggle value={settings.maintenance_mode} onChange={(v) => set("platform", "maintenance_mode", v)} />
              </div>
            </>
          )}
          <SaveBar onSave={() => handleSave("platform", ["platform_name","api_base_url","support_email","maintenance_mode"])} saving={saveStates.platform.saving} saved={saveStates.platform.saved} error={saveStates.platform.error} dirty={saveStates.platform.dirty} />
        </div>
      )}

      {/* ── SECURITY ───────────────────────────────────────────── */}
      {activeTab === "security" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22 }}>
            {settingsLoading ? (
              <div style={{ padding:"32px 0", textAlign:"center" }}><Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" /></div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>Session & Access Policy</p>
                {[
                  { label:"Admin Session Timeout (minutes)", key:"session_timeout_minutes" as const, help:"Admins are logged out after this period of inactivity." },
                  { label:"Max Login Attempts",              key:"max_login_attempts"       as const, help:"Account is locked after this many failed attempts." },
                ].map((f) => (
                  <div key={f.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>{f.label}</p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>{f.help}</p>
                    </div>
                    <Input value={String(settings[f.key])} onChange={(e) => set("security", f.key, parseInt(e.target.value) || 0)} type="number" style={{ height:36, fontSize:13, width:80, flexShrink:0 }} />
                  </div>
                ))}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Require MFA for Admins</p>
                    <p style={{ fontSize:12, color:"#9CA3AF" }}>All admin accounts must use multi-factor authentication.</p>
                  </div>
                  <Toggle value={settings.mfa_required} onChange={(v) => set("security", "mfa_required", v)} />
                </div>
              </div>
            )}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
              <SaveBar onSave={() => handleSave("security", ["session_timeout_minutes","max_login_attempts","mfa_required"])} saving={saveStates.security.saving} saved={saveStates.security.saved} error={saveStates.security.error} dirty={saveStates.security.dirty} />
            </div>
          </div>
          <div style={{ background:"#FEF2F2", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, padding:"16px 18px", display:"flex", gap:10 }}>
            <AlertTriangle size={15} style={{ color:"#EF4444", flexShrink:0, marginTop:1 }} />
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#991B1B", marginBottom:6 }}>Danger Zone</p>
              <Button variant="outline" size="sm" style={{ color:"#EF4444", borderColor:"rgba(239,68,68,0.3)", gap:6 }}>
                <Database size={13} /> Purge Sandbox Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGGING ────────────────────────────────────────────── */}
      {activeTab === "logging" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"white", border:`1.5px solid ${settings.platform_logging_enabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`, borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background: settings.platform_logging_enabled ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border:`1px solid ${settings.platform_logging_enabled ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Activity size={18} style={{ color: settings.platform_logging_enabled ? "#10B981" : "#EF4444" }} />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#0A2540", marginBottom:4 }}>Platform Event Logging</p>
                  <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, maxWidth:440 }}>Records every action across cards, scoring, portal, SDK, mobile apps and system jobs.</p>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                <Toggle value={settings.platform_logging_enabled} onChange={(v) => set("logging", "platform_logging_enabled", v)} disabled={settingsLoading} />
                <span style={{ fontSize:11, fontWeight:700, color: settings.platform_logging_enabled ? "#10B981" : "#EF4444" }}>{settings.platform_logging_enabled ? "ON" : "OFF"}</span>
              </div>
            </div>
            {!settings.platform_logging_enabled && (
              <div style={{ background:"#FEF9C3", border:"1px solid rgba(234,179,8,0.3)", borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                <AlertTriangle size={14} style={{ color:"#CA8A04", flexShrink:0 }} />
                <p style={{ fontSize:12, color:"#854D0E" }}><strong>Logging is off.</strong> New platform events are not being recorded.</p>
              </div>
            )}
            <SaveBar onSave={() => handleSave("logging", ["platform_logging_enabled"])} saving={saveStates.logging.saving} saved={saveStates.logging.saved} error={saveStates.logging.error} dirty={saveStates.logging.dirty}
              saveLabel={settings.platform_logging_enabled ? "Disable Logging" : "Enable Logging"}
              saveVariant={settings.platform_logging_enabled ? "outline" : "primary"}
              saveStyle={settings.platform_logging_enabled ? { color:"#EF4444", borderColor:"rgba(239,68,68,0.3)" } : {}} />
          </div>
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, padding:22 }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540", marginBottom:16 }}>Retention Window</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:16 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Delete events older than (days)</p>
                <p style={{ fontSize:12, color:"#9CA3AF" }}>Set to 0 to retain forever.</p>
              </div>
              <Input value={String(settings.audit_log_retention_days)} onChange={(e) => set("retention", "audit_log_retention_days", parseInt(e.target.value) || 30)} type="number" style={{ height:36, fontSize:13, width:80, flexShrink:0 }} />
            </div>
            <SaveBar onSave={() => handleSave("retention", ["audit_log_retention_days"])} saving={saveStates.retention.saving} saved={saveStates.retention.saved} error={saveStates.retention.error} dirty={saveStates.retention.dirty} />
          </div>
        </div>
      )}

      {/* ── SESSIONS ───────────────────────────────────────────── */}
      {activeTab === "sessions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background: settings.mfa_required ? "#ECFDF5" : "#FFFBEB", border:`1px solid ${settings.mfa_required ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
            <Shield size={15} style={{ color: settings.mfa_required ? "#10B981" : "#F59E0B", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#0A2540", marginBottom:2 }}>
                MFA Enforcement: <span style={{ color: settings.mfa_required ? "#10B981" : "#D97706" }}>{settings.mfa_required ? "Enabled" : "Disabled"}</span>
              </p>
              <p style={{ fontSize:12, color:"#6B7280" }}>
                {settings.mfa_required ? "All admin accounts are required to have multi-factor authentication." : "MFA is not required. Enable it in the Security tab."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("security")} style={{ fontSize:12, gap:6, flexShrink:0 }}>
              <Shield size={12} /> Security Settings
            </Button>
          </div>

          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"14px 22px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>Admin Sessions</p>
              <Button variant="outline" size="sm" style={{ gap:6 }} onClick={loadAdmins} disabled={adminsLoading}>
                <RefreshCw size={12} className={adminsLoading ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>
            <div style={{ padding:"10px 22px 8px", background:"#FAFAFA", borderBottom:"1px solid #F3F4F6", display:"grid", gridTemplateColumns:"1fr 130px 150px 110px" }}>
              {["Admin","Role","Last Active","Action"].map(h => (
                <p key={h} style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</p>
              ))}
            </div>
            {adminsLoading ? (
              <div style={{ padding:"40px 22px", textAlign:"center" }}>
                <Loader2 size={18} style={{ color:"#9CA3AF", margin:"0 auto 8px" }} className="animate-spin" />
                <p style={{ fontSize:13, color:"#9CA3AF" }}>Loading sessions…</p>
              </div>
            ) : admins.map((admin, i) => {
              const lastSeen = admin.last_sign_in ? new Date(admin.last_sign_in) : null;
              const isStale  = !lastSeen || (Date.now() - lastSeen.getTime()) > 7 * 24 * 60 * 60 * 1000;
              const rc       = ROLE_COLORS[admin.admin_role] ?? ROLE_COLORS.viewer;
              return (
                <div key={admin.id} style={{ display:"grid", gridTemplateColumns:"1fr 130px 150px 110px", padding:"12px 22px", borderBottom: i < admins.length-1 ? "1px solid #F9FAFB" : "none", alignItems:"center", opacity: admin.is_deactivated ? 0.45 : 1 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:1 }}>{admin.name || admin.email}</p>
                    <p style={{ fontSize:11, color:"#9CA3AF" }}>{admin.email}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, width:"fit-content" }}>
                    {ROLE_LABELS[admin.admin_role]}
                  </span>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Clock size={11} style={{ color: isStale ? "#F59E0B" : "#10B981" }} />
                    <span style={{ fontSize:12, color: isStale ? "#D97706" : "#374151" }}>
                      {lastSeen ? lastSeen.toLocaleDateString() : "Never"}
                    </span>
                  </div>
                  {!admin.is_deactivated ? (
                    <button onClick={() => handleDeactivate(admin.id)}
                      style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#EF4444", background:"none", border:"1px solid rgba(239,68,68,0.25)", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontWeight:600, width:"fit-content" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background="#FEF2F2")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background="none")}>
                      <LogOut size={11} /> Revoke
                    </button>
                  ) : (
                    <span style={{ fontSize:11, color:"#9CA3AF" }}>Deactivated</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ background:"#F0FDFF", border:"1px solid rgba(0,212,255,0.2)", borderRadius:10, padding:"12px 16px", fontSize:12, color:"#0E7490", lineHeight:1.6 }}>
            <strong>Note:</strong> "Revoke" deactivates the admin account, which immediately invalidates their session. Use this for emergency access removal. To re-enable an account, use the Admin Accounts tab.
          </div>
        </div>
      )}

      {showInvite && (
        <InviteAdminModal onClose={() => setShowInvite(false)} onSave={handleInvite} />
      )}
    </div>
  );
}
