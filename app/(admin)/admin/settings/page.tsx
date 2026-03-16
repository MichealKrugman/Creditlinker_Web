"use client";

import { useState } from "react";
import {
  Settings, Shield, Users, Lock, AlertTriangle,
  Save, Eye, EyeOff, Plus, Trash2, CheckCircle2,
  Key, Globe, Database, Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockAdminUser, isSuperAdmin, EXAMPLE_SCOPED_ADMIN, MODULE_LABELS, PermissionModule, AccessLevel, PermissionString } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  GUARD — settings is super_admin only
// ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center", padding: 32 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lock size={28} style={{ color: "#EF4444" }} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", marginBottom: 4 }}>Settings Restricted</h2>
      <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 360, lineHeight: 1.6 }}>
        Platform settings are restricted to Super Admins only. Contact a Super Admin to make configuration changes.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MOCK ADMIN ACCOUNTS
// ─────────────────────────────────────────────────────────────

type AdminRecord = {
  id: string; name: string; email: string;
  role: "super_admin" | "admin";
  permissions: PermissionString[];
  created: string; last_active: string;
};

const ADMIN_ACCOUNTS: AdminRecord[] = [
  { id: "usr_admin_001", name: "Tunde Adeyemi", email: "tunde@creditlinker.ng",  role: "super_admin", permissions: [], created: "2022-08-01", last_active: "Today" },
  { id: "usr_admin_002", name: "Chisom Eze",    email: "chisom@creditlinker.ng", role: "admin", permissions: ["businesses:manage", "verifications:manage", "reports:view", "financers:view"], created: "2023-03-14", last_active: "Today" },
  { id: "usr_admin_003", name: "Fatima Bello",  email: "fatima@creditlinker.ng", role: "admin", permissions: ["businesses:view", "verifications:manage", "financers:manage"], created: "2023-07-22", last_active: "Yesterday" },
];

const ALL_MODULES: PermissionModule[] = [
  "businesses", "financers", "developers", "financial_data",
  "verifications", "reports", "system", "audit_logs", "notifications", "settings",
];

// ─────────────────────────────────────────────────────────────
//  NEW ADMIN MODAL
// ─────────────────────────────────────────────────────────────

function NewAdminModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<AdminRecord>) => void }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<"admin" | "super_admin">("admin");
  const [perms, setPerms] = useState<Record<PermissionModule, AccessLevel | "none">>(() => {
    return Object.fromEntries(ALL_MODULES.map(m => [m, "none"])) as Record<PermissionModule, AccessLevel | "none">;
  });

  function togglePerm(mod: PermissionModule, level: AccessLevel | "none") {
    setPerms(prev => ({ ...prev, [mod]: level }));
  }

  function buildPermissions(): PermissionString[] {
    if (role === "super_admin") return [];
    return ALL_MODULES
      .filter(m => perms[m] !== "none")
      .map(m => `${m}:${perms[m]}` as PermissionString);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>Add Admin Account</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>This will create a Keycloak user with admin realm_role and the selected permissions.</p>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Basic info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Full Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emeka Obi" style={{ height: 38, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Work Email *</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emeka@creditlinker.ng" type="email" style={{ height: 38, fontSize: 13 }} />
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Role</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["admin", "super_admin"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  style={{ flex: 1, padding: "10px 14px", border: "1.5px solid", borderColor: role === r ? "#0A2540" : "#E5E7EB", borderRadius: 10, background: role === r ? "#F9FAFB" : "white", cursor: "pointer", textAlign: "left" as const }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{r === "super_admin" ? "Super Admin" : "Admin"}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{r === "super_admin" ? "Full platform access, no restrictions" : "Scoped access — configure below"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permission matrix — only for admin role */}
          {role === "admin" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Permission Scope</label>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>settings is always super_admin only</span>
              </div>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", padding: "8px 14px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Module", "None", "View", "Manage"].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: h !== "Module" ? "center" as const : "left" as const }}>{h}</p>
                  ))}
                </div>
                {ALL_MODULES.map((mod, i) => {
                  const isSettingsLocked = mod === "settings";
                  return (
                    <div key={mod} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", padding: "10px 14px", borderBottom: i < ALL_MODULES.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", opacity: isSettingsLocked ? 0.4 : 1 }}>
                      <p style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{MODULE_LABELS[mod]}</p>
                      {(["none", "view", "manage"] as const).map((level) => (
                        <div key={level} style={{ display: "flex", justifyContent: "center" }}>
                          <input type="radio" name={mod} value={level} checked={perms[mod] === level} disabled={isSettingsLocked}
                            onChange={() => !isSettingsLocked && togglePerm(mod, level)}
                            style={{ cursor: isSettingsLocked ? "not-allowed" : "pointer", accentColor: "#0A2540" }} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid #F3F4F6" }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!name.trim() || !email.trim()}
              onClick={() => { onSave({ name, email, role, permissions: buildPermissions() }); onClose(); }}>
              <Plus size={13} /> Create Admin
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

  // Hard gate — settings is super_admin only
  if (!isSuperAdmin(user)) return <AccessDenied />;

  const [activeTab, setActiveTab] = useState<"admins" | "platform" | "security">("admins");
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: "admins",   label: "Admin Accounts", icon: <Users size={13} /> },
    { id: "platform", label: "Platform",        icon: <Globe size={13} /> },
    { id: "security", label: "Security",        icon: <Shield size={13} /> },
  ] as const;

  function handleSave() {
    // TODO: PATCH /admin/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Settings</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant="secondary">Super Admin only</Badge>
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>Platform configuration</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: activeTab === tab.id ? "#0A2540" : "transparent", color: activeTab === tab.id ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── ADMINS TAB ── */}
      {activeTab === "admins" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Admin Accounts ({ADMIN_ACCOUNTS.length})</p>
            <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={() => setShowNewAdmin(true)}>
              <Plus size={13} /> Add Admin
            </Button>
          </div>

          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            {ADMIN_ACCOUNTS.map((admin, i) => (
              <div key={admin.id} style={{ padding: "16px 22px", borderBottom: i < ADMIN_ACCOUNTS.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: admin.role === "super_admin" ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))" : "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.3))", border: `1px solid ${admin.role === "super_admin" ? "rgba(0,212,255,0.3)" : "rgba(245,158,11,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: admin.role === "super_admin" ? "#00D4FF" : "#F59E0B", flexShrink: 0 }}>
                    {admin.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{admin.name}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 9999, color: admin.role === "super_admin" ? "#00D4FF" : "#F59E0B", background: admin.role === "super_admin" ? "rgba(0,212,255,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${admin.role === "super_admin" ? "rgba(0,212,255,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: admin.role === "admin" ? 8 : 0 }}>{admin.email} · Last active: {admin.last_active}</p>

                    {/* Permission pills for scoped admins */}
                    {admin.role === "admin" && admin.permissions.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                        {admin.permissions.map((p) => {
                          const [mod, level] = p.split(":");
                          return (
                            <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, color: level === "manage" ? "#0891B2" : "#6B7280", background: level === "manage" ? "#F0FDFF" : "#F3F4F6", border: `1px solid ${level === "manage" ? "rgba(8,145,178,0.2)" : "#E5E7EB"}` }}>
                              {MODULE_LABELS[mod as PermissionModule]} · {level}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions — cannot remove yourself or other super admins */}
                  {admin.id !== user.id && admin.role !== "super_admin" && (
                    <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF", flexShrink: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                      title="Remove admin access">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLATFORM TAB ── */}
      {activeTab === "platform" && (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "22px", display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { label: "Platform Name", key: "name",    value: "Creditlinker",              type: "text",  help: "Displayed across the platform and in emails." },
            { label: "API Base URL",  key: "api_url", value: "https://api.creditlinker.ng", type: "text",  help: "The base URL for all API requests." },
            { label: "Support Email", key: "support", value: "support@creditlinker.ng",     type: "email", help: "Displayed on error pages and emails." },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{field.label}</label>
              <Input defaultValue={field.value} type={field.type} style={{ height: 40, fontSize: 13, maxWidth: 400 }} />
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{field.help}</p>
            </div>
          ))}
          {/* Data permanence notice */}
          <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Database size={14} style={{ color: "#0891B2", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0E7490", marginBottom: 3 }}>Data is never deleted</p>
              <p style={{ fontSize: 12, color: "#0891B2", lineHeight: 1.6 }}>
                Financial identity data, transaction history, pipeline outputs, and audit records are retained permanently.
                A business's financial history belongs to them — it persists indefinitely and forms the foundation of their
                verified financial identity, regardless of how many years have passed.
              </p>
            </div>
          </div>

          <div style={{ paddingTop: 8, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
            <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={handleSave}><Save size={13} /> Save Changes</Button>
            {saved && <span style={{ fontSize: 12, color: "#10B981", display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={13} /> Saved</span>}
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "22px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Session & Access Policy</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Admin Session Timeout (minutes)", value: "30",  help: "Admins are logged out after this period of inactivity." },
                { label: "Max Login Attempts",              value: "5",   help: "Account is locked after this many failed login attempts." },
                { label: "Require MFA for Admins",         value: "true", help: "All admin accounts must use multi-factor authentication." },
              ].map((field) => (
                <div key={field.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{field.label}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{field.help}</p>
                  </div>
                  {field.value === "true" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 40, height: 22, borderRadius: 11, background: "#10B981", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                        <div style={{ position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, borderRadius: "50%", background: "white" }} />
                      </div>
                    </div>
                  ) : (
                    <Input defaultValue={field.value} type="number" style={{ height: 36, fontSize: 13, width: 80, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
              <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={handleSave}><Save size={13} /> Save Policy</Button>
              {saved && <span style={{ fontSize: 12, color: "#10B981", display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={13} /> Saved</span>}
            </div>
          </div>

          <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "16px 18px", display: "flex", gap: 10 }}>
            <AlertTriangle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>Danger Zone</p>
              <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5, marginBottom: 10 }}>These actions are irreversible. Only take them with full awareness of their consequences.</p>
              <Button variant="outline" size="sm" style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.3)", gap: 6 }}>
                <Database size={13} /> Purge Sandbox Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNewAdmin && (
        <NewAdminModal
          onClose={() => setShowNewAdmin(false)}
          onSave={(data) => {
            // TODO: POST /admin/admins { name, email, role, permissions }
            console.log("Create admin:", data);
          }}
        />
      )}
    </div>
  );
}
