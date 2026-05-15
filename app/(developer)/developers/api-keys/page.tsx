"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key, Copy, Eye, EyeOff, Plus, Trash2,
  CheckCircle2, AlertCircle, Clock, Shield, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useDeveloperAccount } from "@/lib/developer-context";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type ApiKey = {
  id: string;
  label: string;
  key_prefix: string;
  environment: "live" | "test";
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

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
      title="Copy"
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
   KEY ROW  (no full secret stored — only prefix)
───────────────────────────────────────────────────────── */
function KeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const [revoking, setRevoking] = useState(false);
  const isRevoked = !apiKey.is_active;
  const masked = apiKey.key_prefix + "•".repeat(24);

  async function handleRevoke() {
    setRevoking(true);
    await onRevoke(apiKey.id);
    setRevoking(false);
  }

  return (
    <>
    <style>{`@media (max-width: 600px) { .dev-key-actions { display: none !important; } }`}</style>
    <div style={{
      padding: "16px 16px",
      borderBottom: "1px solid #F3F4F6",
      opacity: isRevoked ? 0.55 : 1,
      transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: isRevoked ? "#F3F4F6" : "#F0FDFF",
          border: `1px solid ${isRevoked ? "#E5E7EB" : "rgba(0,212,255,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isRevoked ? "#9CA3AF" : "#0A5060",
        }}>
          <Key size={15} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{apiKey.label}</span>
            <Badge variant={apiKey.environment === "test" ? "warning" : "success"} style={{ fontSize: 9, padding: "1px 6px" }}>
              {apiKey.environment}
            </Badge>
            {isRevoked && <Badge variant="destructive" style={{ fontSize: 9, padding: "1px 6px" }}>Revoked</Badge>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <code style={{
              fontSize: 12, fontFamily: "var(--font-mono, 'Courier New', monospace)",
              color: "#374151", background: "#F3F4F6",
              padding: "3px 8px", borderRadius: 5,
              letterSpacing: "0.04em", wordBreak: "break-all", maxWidth: "100%",
            }}>
              {masked}
            </code>
            {!isRevoked && <CopyBtn text={apiKey.key_prefix} />}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} /> Created {new Date(apiKey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {apiKey.last_used_at && (
              <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} /> Last used {new Date(apiKey.last_used_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {!isRevoked && (
          <button
            className="dev-key-actions"
            onClick={handleRevoke}
            disabled={revoking}
            title="Revoke key"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 7,
              border: "1px solid #FCA5A5",
              background: "white", color: "#EF4444",
              fontSize: 12, fontWeight: 600, cursor: revoking ? "default" : "pointer",
              transition: "all 0.12s", flexShrink: 0,
              opacity: revoking ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!revoking) (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
          >
            {revoking ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} />}
            {revoking ? "Revoking…" : "Revoke"}
          </button>
        )}
      </div>
    </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   NEW KEY REVEAL BANNER  (shown once after creation)
───────────────────────────────────────────────────────── */
function NewKeyBanner({ fullKey, onDismiss }: { fullKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      padding: "16px 20px",
      background: "#F0FDFF",
      border: "1px solid rgba(0,212,255,0.3)",
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>API key created — copy it now</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>This is the only time the full key will be shown.</p>
        </div>
        <button onClick={onDismiss} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <code style={{
          flex: 1, fontSize: 12, fontFamily: "var(--font-mono, monospace)",
          background: "white", border: "1px solid #D1D5DB",
          padding: "9px 12px", borderRadius: 7,
          color: "#0A2540", wordBreak: "break-all",
        }}>
          {fullKey}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(fullKey); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 14px", borderRadius: 7,
            border: "1px solid #D1D5DB", background: "white",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            color: copied ? "#10B981" : "#374151", flexShrink: 0,
          }}
        >
          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CREATE KEY MODAL
───────────────────────────────────────────────────────── */
function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (label: string, perms: string[]) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [perms, setPerms] = useState<string[]>(["read:score"]);
  const [saving, setSaving] = useState(false);

  const toggle = (p: string) =>
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  async function handleCreate() {
    if (!label.trim() || perms.length === 0) return;
    setSaving(true);
    await onCreate(label.trim(), perms);
    setSaving(false);
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 16,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 480, overflow: "hidden", margin: "0 16px",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Create API Key
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            Keys are scoped to sandbox until you request production access.
          </p>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Key label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
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

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Permissions</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERMISSION_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${perms.includes(opt.value) ? "rgba(0,212,255,0.25)" : "#E5E7EB"}`,
                  background: perms.includes(opt.value) ? "rgba(0,212,255,0.04)" : "white",
                  transition: "all 0.12s",
                }}>
                  <input type="checkbox" checked={perms.includes(opt.value)} onChange={() => toggle(opt.value)} style={{ marginTop: 1, accentColor: "#0A2540" }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" size="sm"
            onClick={handleCreate}
            disabled={!label.trim() || perms.length === 0 || saving}
          >
            {saving
              ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Creating…</>
              : <><Key size={13} /> Create Key</>
            }
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
  const { account, refresh: refreshAccount } = useDeveloperAccount();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    if (!account) return;
    setLoadingKeys(true);
    const { data, error } = await supabase
      .from("developer_api_keys")
      .select("id, label, key_prefix, environment, is_active, last_used_at, created_at")
      .eq("developer_id", account.id)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setKeys(data ?? []);
    setLoadingKeys(false);
  }, [account]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleCreate(label: string, _perms: string[]) {
    if (!account) return;
    setError(null);

    // Generate a key client-side — in production this should be an edge function
    // so the raw key never touches the DB. For now we store a truncated prefix
    // and surface the full key once.
    const raw = `sk_test_${crypto.randomUUID().replace(/-/g, "")}`;
    const prefix = raw.slice(0, 16); // "sk_test_xxxxxxxx"

    // Simple sha256-style hash substitute — real prod should use bcrypt via edge fn
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("developer_api_keys").insert({
      developer_id: account.id,
      key_prefix: prefix,
      key_hash: keyHash,
      environment: "test",
      label,
      is_active: true,
    });

    if (error) { setError(error.message); return; }

    setNewKeyFull(raw);
    await loadKeys();
    await refreshAccount();
  }

  async function handleRevoke(id: string) {
    setError(null);
    const { error } = await supabase
      .from("developer_api_keys")
      .update({ is_active: false })
      .eq("id", id);

    if (error) { setError(error.message); return; }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
    await refreshAccount();
  }

  const activeKeys  = keys.filter(k =>  k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            API Keys
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {loadingKeys ? "Loading…" : `${activeKeys.length} active key${activeKeys.length !== 1 ? "s" : ""} · Sandbox environment`}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} style={{ gap: 6, flexShrink: 0 }}>
          <Plus size={13} /> Create Key
        </Button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* ── NEW KEY BANNER ── */}
      {newKeyFull && (
        <NewKeyBanner fullKey={newKeyFull} onDismiss={() => setNewKeyFull(null)} />
      )}

      {/* ── SECURITY NOTICE ── */}
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        padding: "14px 18px", background: "#FFFBEB",
        border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12,
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
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Active Keys</p>
          </div>
          <Badge variant="secondary">{activeKeys.length} keys</Badge>
        </div>
        <div style={{ marginTop: 12 }}>
          {loadingKeys ? (
            <div style={{ padding: "32px 24px", textAlign: "center" as const }}>
              <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : activeKeys.length === 0 ? (
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
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Revoked Keys</p>
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

      {showCreate && (
        <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
