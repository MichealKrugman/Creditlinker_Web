"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key, Copy, Trash2, Plus, Shield, Clock,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";

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

/* ─────────────────────────────────────────────────────────
   SHARED CARD
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #E5E7EB",
      borderRadius: 14,
      overflow: "hidden",
      ...style,
    }}>
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
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copy prefix"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 6,
        border: "1px solid #E5E7EB", background: "white",
        cursor: "pointer",
        color: copied ? "#10B981" : "#9CA3AF",
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
function KeyRow({ apiKey, onRevoke, onDelete }: {
  apiKey: ApiKey;
  onRevoke: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const isRevoked = !apiKey.is_active;
  const masked = apiKey.key_prefix + "•".repeat(24);

  async function handleRevoke() {
    setBusy(true);
    await onRevoke(apiKey.id);
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${apiKey.label}"? This cannot be undone.`)) return;
    setBusy(true);
    await onDelete(apiKey.id);
    setBusy(false);
  }

  return (
    <div style={{
      padding: "16px 22px",
      borderBottom: "1px solid #F3F4F6",
      opacity: isRevoked ? 0.55 : 1,
      transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: isRevoked ? "#F3F4F6" : "rgba(0,212,255,0.06)",
          border: `1px solid ${isRevoked ? "#E5E7EB" : "rgba(0,212,255,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isRevoked ? "#9CA3AF" : "#0A5060",
        }}>
          <Key size={15} strokeWidth={1.8} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{apiKey.label}</span>
            <Badge
              variant={apiKey.environment === "test" ? "warning" : "success"}
              style={{ fontSize: 9, padding: "1px 6px" }}
            >
              {apiKey.environment}
            </Badge>
            {isRevoked && (
              <Badge variant="destructive" style={{ fontSize: 9, padding: "1px 6px" }}>Revoked</Badge>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <code style={{
              fontSize: 12,
              fontFamily: "var(--font-mono, 'Courier New', monospace)",
              color: "#374151", background: "#F3F4F6",
              padding: "3px 8px", borderRadius: 5,
              letterSpacing: "0.04em", wordBreak: "break-all",
            }}>
              {masked}
            </code>
            {!isRevoked && <CopyBtn text={apiKey.key_prefix} />}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} />
              Created {new Date(apiKey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {apiKey.last_used_at && (
              <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} />
                Last used {new Date(apiKey.last_used_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {!apiKey.last_used_at && !isRevoked && (
              <span style={{ fontSize: 11, color: "#D1D5DB" }}>Never used</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {!isRevoked && (
            <button
              onClick={handleRevoke}
              disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                border: "1px solid #FCA5A5",
                background: "white", color: "#EF4444",
                fontSize: 12, fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              {busy
                ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                : <Trash2 size={12} />
              }
              {busy ? "Revoking…" : "Revoke"}
            </button>
          )}

          {isRevoked && (
            <button
              onClick={handleDelete}
              disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                border: "1px solid #E5E7EB",
                background: "white", color: "#6B7280",
                fontSize: 12, fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => {
                if (!busy) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#FEF2F2";
                  el.style.color = "#EF4444";
                  el.style.borderColor = "#FCA5A5";
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "white";
                el.style.color = "#6B7280";
                el.style.borderColor = "#E5E7EB";
              }}
            >
              {busy
                ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                : <Trash2 size={12} />
              }
              {busy ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NEW KEY REVEAL MODAL  (shown once immediately after creation)
───────────────────────────────────────────────────────── */
function NewKeyModal({ fullKey, onDismiss }: {
  fullKey: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "white", borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        width: "100%", maxWidth: 500, margin: "0 16px",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 size={17} style={{ color: "#10B981" }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", letterSpacing: "-0.02em" }}>
                API Key Created
              </p>
              <p style={{ fontSize: 12, color: "#6B7280" }}>
                Copy and store it somewhere safe — this is the only time it will be shown
              </p>
            </div>
          </div>
        </div>

        {/* Key */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            padding: "14px 16px",
            background: "#F8FAFC", border: "1px solid #E5E7EB",
            borderRadius: 10, marginBottom: 12,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Your API Key
            </p>
            <code style={{
              display: "block", fontSize: 13,
              fontFamily: "var(--font-mono, 'Courier New', monospace)",
              color: "#0A2540", wordBreak: "break-all", lineHeight: 1.6,
            }}>
              {fullKey}
            </code>
          </div>

          <button
            onClick={handleCopy}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 16px", borderRadius: 9,
              border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "#D1D5DB"}`,
              background: copied ? "#ECFDF5" : "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: copied ? "#10B981" : "#374151",
              transition: "all 0.15s",
            }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copied to clipboard!" : "Copy Key"}
          </button>

          <div style={{
            marginTop: 14, padding: "12px 14px",
            background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 9, display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
              This key will <strong>not</strong> be shown again. If you lose it, revoke it and generate a new one.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#0A2540", width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              I have copied and saved my API key in a secure location
            </span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 22px" }}>
          <button
            onClick={onDismiss}
            disabled={!confirmed}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: 9, border: "none",
              background: confirmed ? "#0A2540" : "#E5E7EB",
              color: confirmed ? "white" : "#9CA3AF",
              fontSize: 14, fontWeight: 700,
              cursor: confirmed ? "pointer" : "default",
              transition: "all 0.15s",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CREATE KEY MODAL
───────────────────────────────────────────────────────── */
function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!label.trim()) return;
    setSaving(true);
    await onCreate(label.trim());
    setSaving(false);
    onClose();
  }

  return (
    <div
      style={{
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
          width: "100%", maxWidth: 480, overflow: "hidden", margin: "0 16px",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17,
            color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 4,
          }}>
            Create API Key
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            This key will be scoped to the{" "}
            {typeof window !== "undefined" &&
             (window.location.hostname.startsWith("sandbox.") || window.location.hostname === "localhost")
              ? "sandbox environment (sk_test_)"
              : "production environment (sk_live_)"
            }.
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Label */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Key label
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Production Integration"
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


        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" size="sm"
            onClick={handleCreate}
            disabled={!label.trim() || saving}
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
export default function InstitutionApiKeysPage() {
  const { user } = useSession();

  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [keys,          setKeys]          = useState<ApiKey[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [newKeyFull,    setNewKeyFull]    = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  /* ── resolve institution_id from logged-in user ── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from("institutions")
      .select("institution_id")
      .eq("owner_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Could not load institution. Please refresh.");
          setLoading(false);
          return;
        }
        setInstitutionId(data.institution_id);
      });
  }, [user]);

  /* ── load keys once we have institution_id ── */
  const loadKeys = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("institution_api_keys")
      .select("id, label, key_prefix, environment, is_active, last_used_at, created_at")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setKeys(data ?? []);
    setLoading(false);
  }, [institutionId]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  /* ── create ── */
  async function handleCreate(label: string) {
    if (!institutionId) return;
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Session expired. Please sign in again.'); return; }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-financer-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: 'generate-api-key', label }),
      }
    );

    const result = await res.json();
    if (!res.ok || !result.success) {
      setError(result.error ?? 'Failed to create API key');
      return;
    }

    setNewKeyFull(result.key);
    await loadKeys();
  }

  /* ── revoke ── */
  async function handleRevoke(id: string) {
    setError(null);
    const { error } = await supabase
      .from("institution_api_keys")
      .update({ is_active: false })
      .eq("id", id);

    if (error) { setError(error.message); return; }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  }

  /* ── delete ── */
  async function handleDelete(id: string) {
    setError(null);
    const { error } = await supabase
      .from("institution_api_keys")
      .delete()
      .eq("id", id);

    if (error) { setError(error.message); return; }
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  const activeKeys  = keys.filter(k =>  k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── MODALS ── */}
      {newKeyFull && (
        <NewKeyModal fullKey={newKeyFull} onDismiss={() => setNewKeyFull(null)} />
      )}
      {showCreate && (
        <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
            color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            API Keys
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {loading
              ? "Loading…"
              : `${activeKeys.length} active key${activeKeys.length !== 1 ? "s" : ""} · Institution API access`
            }
          </p>
        </div>
        <Button
          variant="primary" size="sm"
          onClick={() => setShowCreate(true)}
          style={{ gap: 6, flexShrink: 0 }}
        >
          <Plus size={13} /> Create Key
        </Button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          padding: "12px 16px",
          background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, fontSize: 13, color: "#DC2626",
        }}>
          {error}
        </div>
      )}

      {/* ── SECURITY NOTICE ── */}
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        padding: "14px 18px",
        background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: 12,
      }}>
        <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
            Keep your keys secure
          </p>
          <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.6 }}>
            Never expose API keys in client-side code or public repositories.
            These keys grant access to consented business data — revoke any key that may have been compromised immediately.
          </p>
        </div>
      </div>

      {/* ── ACTIVE KEYS ── */}
      <Card>
        <div style={{
          padding: "18px 22px 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={15} style={{ color: "#0A2540" }} />
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, color: "#0A2540",
            }}>
              Active Keys
            </p>
          </div>
          <Badge variant="secondary">{activeKeys.length} key{activeKeys.length !== 1 ? "s" : ""}</Badge>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : activeKeys.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <Key size={28} style={{ color: "#D1D5DB", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                No active keys
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                Create an API key to start integrating with the Creditlinker partner API.
              </p>
            </div>
          ) : (
            activeKeys.map(k => (
              <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} onDelete={handleDelete} />
            ))
          )}
        </div>
      </Card>

      {/* ── REVOKED KEYS ── */}
      {revokedKeys.length > 0 && (
        <Card>
          <div style={{ padding: "18px 22px 0" }}>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 14, color: "#0A2540",
            }}>
              Revoked Keys
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            {revokedKeys.map(k => (
              <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} onDelete={handleDelete} />
            ))}
          </div>
        </Card>
      )}

      {/* ── USAGE EXPLAINER ── */}
      <Card style={{ padding: "20px 24px" }}>
        <p style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 14, color: "#0A2540", marginBottom: 14,
        }}>
          How to use your key
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              step: "1",
              title: "Set the Authorization header",
              code: `Authorization: Bearer sk_test_xxxxxxxx`,
            },
            {
              step: "2",
              title: "Target the correct environment",
              code: `# Sandbox\nhttps://sandbox.api.creditlinker.com.ng\n\n# Production\nhttps://api.creditlinker.com.ng`,
            },
            {
              step: "3",
              title: "Query a consented business",
              code: `GET /institution/query\n  ?business_id=FI-219E5DAC`,
            },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: "#0A2540",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "white", marginTop: 1,
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 6 }}>
                  {item.title}
                </p>
                <pre style={{
                  margin: 0, padding: "10px 14px",
                  background: "#F3F4F6", borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  color: "#374151", overflowX: "auto", whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}>
                  {item.code}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
