"use client";

import { useState } from "react";
import {
  Key, Copy, Eye, EyeOff, Plus, Trash2,
  CheckCircle2, AlertCircle, Clock, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  secret: string;
  environment: "sandbox" | "production";
  permissions: string[];
  created_at: string;
  last_used: string | null;
  status: "active" | "revoked";
};

const INITIAL_KEYS: ApiKey[] = [
  {
    id: "key_01",
    name: "Local Development",
    prefix: "sk_test_",
    secret: "sk_test_Kd92mX0pLqNvT7bRsWcY4eAhJfUiOzP1",
    environment: "sandbox",
    permissions: ["read:score", "read:transactions", "read:identity"],
    created_at: "Jan 12, 2025",
    last_used: "2 hours ago",
    status: "active",
  },
  {
    id: "key_02",
    name: "Staging Integration",
    prefix: "sk_test_",
    secret: "sk_test_Xm7nV3aKpQwEjYtFcBsD6oGhLrUiZ2Nk",
    environment: "sandbox",
    permissions: ["read:score", "write:webhooks"],
    created_at: "Dec 28, 2024",
    last_used: "3 days ago",
    status: "active",
  },
  {
    id: "key_03",
    name: "Old CI Key",
    prefix: "sk_test_",
    secret: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    environment: "sandbox",
    permissions: ["read:score"],
    created_at: "Nov 5, 2024",
    last_used: "45 days ago",
    status: "revoked",
  },
];

const PERMISSION_OPTIONS = [
  { value: "read:score",        label: "Read Score",        desc: "GET /business/score and dimensions" },
  { value: "read:transactions", label: "Read Transactions", desc: "GET /business/transactions" },
  { value: "read:identity",     label: "Read Identity",     desc: "GET /business/profile, snapshots" },
  { value: "read:consent",      label: "Read Consent",      desc: "GET /business/consent" },
  { value: "write:webhooks",    label: "Manage Webhooks",   desc: "Create and configure webhook endpoints" },
  { value: "write:data",        label: "Submit Data",       desc: "POST data to the pipeline (Partner)" },
];

/* ─────────────────────────────────────────────────────────
   SHARED CARD
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title="Copy key"
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

/* ─────────────────────────────────────────────────────────
   KEY ROW
───────────────────────────────────────────────────────── */
function KeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  const isRevoked = apiKey.status === "revoked";
  const masked = apiKey.prefix + "•".repeat(20) + apiKey.secret.slice(-6);

  return (
    <div style={{
      padding: "18px 24px",
      borderBottom: "1px solid #F3F4F6",
      opacity: isRevoked ? 0.55 : 1,
      transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>

        {/* Key icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: isRevoked ? "#F3F4F6" : "#F0FDFF",
          border: `1px solid ${isRevoked ? "#E5E7EB" : "rgba(0,212,255,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isRevoked ? "#9CA3AF" : "#0A5060",
        }}>
          <Key size={15} strokeWidth={1.8} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{apiKey.name}</span>
            <Badge variant={apiKey.environment === "sandbox" ? "warning" : "success"} style={{ fontSize: 9, padding: "1px 6px" }}>
              {apiKey.environment}
            </Badge>
            {isRevoked && <Badge variant="destructive" style={{ fontSize: 9, padding: "1px 6px" }}>Revoked</Badge>}
          </div>

          {/* Secret */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <code style={{
              fontSize: 12, fontFamily: "var(--font-mono, 'Courier New', monospace)",
              color: "#374151", background: "#F3F4F6",
              padding: "3px 8px", borderRadius: 5,
              letterSpacing: "0.04em",
            }}>
              {revealed ? apiKey.secret : masked}
            </code>
            {!isRevoked && (
              <>
                <button
                  onClick={() => setRevealed(v => !v)}
                  title={revealed ? "Hide key" : "Reveal key"}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid #E5E7EB", background: "white",
                    cursor: "pointer", color: "#9CA3AF", transition: "all 0.12s",
                  }}
                >
                  {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <CopyBtn text={apiKey.secret} />
              </>
            )}
          </div>

          {/* Permissions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {apiKey.permissions.map(p => (
              <span key={p} style={{
                fontSize: 10, fontWeight: 600, color: "#0A5060",
                background: "rgba(0,212,255,0.06)",
                border: "1px solid rgba(0,212,255,0.15)",
                padding: "2px 7px", borderRadius: 9999,
                fontFamily: "var(--font-mono, monospace)",
              }}>
                {p}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} /> Created {apiKey.created_at}
            </span>
            {apiKey.last_used && (
              <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} /> Last used {apiKey.last_used}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isRevoked && (
          <button
            onClick={() => onRevoke(apiKey.id)}
            title="Revoke key"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 7,
              border: "1px solid #FCA5A5",
              background: "white", color: "#EF4444",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s", flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
          >
            <Trash2 size={12} /> Revoke
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CREATE KEY MODAL
───────────────────────────────────────────────────────── */
function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, perms: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>(["read:score"]);

  const toggle = (p: string) =>
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white", borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          width: "100%", maxWidth: 480, overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Create API Key
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            Keys are scoped to Sandbox until you request production access.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Key name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Local Development"
              style={{
                width: "100%", padding: "9px 12px",
                border: "1px solid #D1D5DB", borderRadius: 8,
                fontSize: 14, color: "#0A2540", outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
              onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
            />
          </div>

          {/* Permissions */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              Permissions
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERMISSION_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${perms.includes(opt.value) ? "rgba(0,212,255,0.25)" : "#E5E7EB"}`,
                  background: perms.includes(opt.value) ? "rgba(0,212,255,0.04)" : "white",
                  transition: "all 0.12s",
                }}>
                  <input
                    type="checkbox"
                    checked={perms.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    style={{ marginTop: 1, accentColor: "#0A2540" }}
                  />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px 20px",
          borderTop: "1px solid #F3F4F6",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" size="sm"
            onClick={() => { if (name.trim()) { onCreate(name.trim(), perms); onClose(); } }}
            disabled={!name.trim() || perms.length === 0}
          >
            <Key size={13} /> Create Key
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [showCreate, setShowCreate] = useState(false);

  const handleRevoke = (id: string) =>
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" } : k));

  const handleCreate = (name: string, perms: string[]) => {
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name,
      prefix: "sk_test_",
      secret: `sk_test_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      environment: "sandbox",
      permissions: perms,
      created_at: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      last_used: null,
      status: "active",
    };
    setKeys(prev => [newKey, ...prev]);
  };

  const activeKeys = keys.filter(k => k.status === "active");
  const revokedKeys = keys.filter(k => k.status === "revoked");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            API Keys
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {activeKeys.length} active key{activeKeys.length !== 1 ? "s" : ""} · Sandbox environment
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} style={{ gap: 6, flexShrink: 0 }}>
          <Plus size={13} /> Create Key
        </Button>
      </div>

      {/* ── SECURITY NOTICE ── */}
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        padding: "14px 18px",
        background: "#FFFBEB",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: 12,
      }}>
        <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>Keep your keys secure</p>
          <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.6 }}>
            Never expose API keys in client-side code or public repositories. Revoke any key that may have been compromised immediately.
          </p>
        </div>
      </div>

      {/* ── ACTIVE KEYS ── */}
      <Card>
        <div style={{ padding: "18px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={15} style={{ color: "#0A2540" }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
              Active Keys
            </p>
          </div>
          <Badge variant="secondary">{activeKeys.length} keys</Badge>
        </div>
        <div style={{ marginTop: 12 }}>
          {activeKeys.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" as const }}>
              <Key size={28} style={{ color: "#D1D5DB", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No active keys</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Create your first API key to start making requests.</p>
            </div>
          ) : (
            activeKeys.map(k => <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} />)
          )}
        </div>
      </Card>

      {/* ── REVOKED KEYS ── */}
      {revokedKeys.length > 0 && (
        <Card>
          <div style={{ padding: "18px 24px 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
              Revoked Keys
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            {revokedKeys.map(k => <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} />)}
          </div>
        </Card>
      )}

      {/* ── PRODUCTION ACCESS ── */}
      <div style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, #0A2540, #0d3465)",
        borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 4 }}>
            Ready for production?
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            Request access to production keys after completing your integration testing in sandbox.
          </p>
        </div>
        <Button variant="accent" size="sm" href="/developers/support" style={{ flexShrink: 0 }}>
          Request Production Access
        </Button>
      </div>

      {/* Modal */}
      {showCreate && (
        <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
