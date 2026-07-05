"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldCheck, Copy, Check, Loader2, ArrowRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MfaSetupPage() {
  const router = useRouter();

  // Enrolment state
  const [qrCode,    setQrCode]    = useState<string | null>(null);
  const [secret,    setSecret]    = useState<string | null>(null);
  const [factorId,  setFactorId]  = useState<string | null>(null);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  // Verify step
  const [code,       setCode]       = useState("");
  const [verifying,  setVerifying]  = useState(false);
  const [verifyErr,  setVerifyErr]  = useState<string | null>(null);
  const [done,       setDone]       = useState(false);

  // Copy secret feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (error || !data) {
          setEnrollErr(error?.message ?? "Failed to start MFA enrolment.");
          return;
        }
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      } catch {
        setEnrollErr("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.replace(/\s/g, "").length !== 6) return;

    setVerifying(true);
    setVerifyErr(null);

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.replace(/\s/g, ""),
      });

      if (error) {
        setVerifyErr("Invalid code. Check your authenticator app and try again.");
        setCode("");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/admin/dashboard"), 1200);
    } catch {
      setVerifyErr("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleSkip() {
    router.push("/admin/dashboard");
  }

  async function handleCopySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputBase: React.CSSProperties = {
    width: "100%", height: 44,
    padding: "0 14px",
    background: "#F9FAFB",
    border: "1.5px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 20, fontWeight: 700,
    color: "#0A2540", letterSpacing: "0.25em",
    textAlign: "center",
    outline: "none",
    fontFamily: "var(--font-mono, monospace)",
    boxSizing: "border-box",
    transition: "border-color 0.12s",
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F7FA", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{
        width: "100%", maxWidth: 440,
        background: "white", border: "1px solid #E5E7EB",
        borderRadius: 18, boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: done ? "#ECFDF5" : "#EFF6FF",
              border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(10,37,64,0.1)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {done
                ? <ShieldCheck size={18} color="#10B981" />
                : <Shield size={18} color="#0A2540" />
              }
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 2 }}>
                {done ? "MFA enabled" : "Set up two-factor authentication"}
              </h1>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                {done ? "Redirecting to dashboard…" : "Protect your admin account with an authenticator app"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 32px 28px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px 0" }}>
              <Loader2 size={24} style={{ color: "#D1D5DB", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Preparing QR code…</p>
            </div>
          )}

          {/* Enrol error */}
          {!loading && enrollErr && (
            <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 20 }}>
              {enrollErr}
            </div>
          )}

          {/* QR + verify form */}
          {!loading && !enrollErr && !done && (
            <>
              {/* Step 1 — scan */}
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  1. Scan this QR code with your authenticator app
                </p>
                {qrCode && (
                  <div style={{
                    display: "flex", justifyContent: "center",
                    padding: 14, background: "#F9FAFB",
                    border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 10,
                  }}>
                    {/* qr_code is a data URI SVG */}
                    <img src={qrCode} alt="MFA QR code" style={{ width: 160, height: 160 }} />
                  </div>
                )}
                {/* Manual entry fallback */}
                {secret && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", background: "#F9FAFB",
                    border: "1px solid #E5E7EB", borderRadius: 8,
                  }}>
                    <code style={{ flex: 1, fontSize: 11, color: "#374151", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.1em", wordBreak: "break-all" }}>
                      {secret}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      title="Copy secret key"
                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: copied ? "#10B981" : "#9CA3AF", display: "flex", padding: 2 }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                  Can't scan? Enter the key above manually in your app.
                </p>
              </div>

              {/* Step 2 — verify */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  2. Enter the 6-digit code from your app to confirm
                </p>
                <form onSubmit={handleVerify}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    style={inputBase}
                    onFocus={e  => (e.target.style.borderColor = "#0A2540")}
                    onBlur={e   => (e.target.style.borderColor = "#E5E7EB")}
                  />

                  {verifyErr && (
                    <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{verifyErr}</p>
                  )}

                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    style={{
                      width: "100%", height: 42, marginTop: 14,
                      background: verifying || code.length !== 6 ? "#E5E7EB" : "#0A2540",
                      color: verifying || code.length !== 6 ? "#9CA3AF" : "white",
                      border: "none", borderRadius: 8,
                      fontSize: 13, fontWeight: 700, cursor: verifying || code.length !== 6 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      transition: "background 0.12s",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {verifying
                      ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Verifying…</>
                      : <><ShieldCheck size={14} /> Enable MFA</>
                    }
                  </button>
                </form>
              </div>

              {/* Skip */}
              <button
                onClick={handleSkip}
                style={{
                  width: "100%", height: 38,
                  background: "none", border: "1px solid #E5E7EB",
                  borderRadius: 8, fontSize: 13, fontWeight: 600,
                  color: "#9CA3AF", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.12s",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#6B7280"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9CA3AF"; }}
              >
                <X size={12} /> Skip for now
              </button>
            </>
          )}

          {/* Success state */}
          {done && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={24} color="#10B981" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>MFA enabled successfully</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
                <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} /> Taking you to the dashboard…
              </p>
            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
