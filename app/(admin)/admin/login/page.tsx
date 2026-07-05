"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Shield, ShieldCheck, Activity, BarChart2, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { precheckLogin, reportLoginFailure, reportLoginSuccess, formatLockMessage } from "@/lib/login-guard";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // MFA step
  const [mfaRequired,  setMfaRequired]  = useState(false);
  const [mfaCode,      setMfaCode]      = useState("");
  const [factorId,     setFactorId]     = useState("");
  const [challengeId,  setChallengeId]  = useState("");
  const [mfaLoading,   setMfaLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    try {
      // SEC-04: check lockout BEFORE spending a Supabase Auth attempt.
      const lock = await precheckLogin("admin", email.trim());
      if (lock.locked) {
        setError(formatLockMessage(lock.retry_after_seconds));
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      });

      if (authError) {
        await reportLoginFailure("admin", email.trim());
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email or password is incorrect.");
        } else {
          setError(authError.message);
        }
        return;
      }

      // Check app_metadata.role === "admin"
      const role = data.user?.app_metadata?.role;
      if (role !== "admin") {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        return;
      }

      // Check for a verified TOTP factor. If present the session is aal1
      // and must be elevated to aal2 via challenge + verify before entry.
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factorsData?.totp?.find((f: any) => f.status === "verified");

      if (verifiedFactor) {
        // Issue a challenge immediately so the user can enter their code
        const { data: challengeData, error: challengeErr } =
          await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });

        if (challengeErr || !challengeData) {
          setError("Failed to initiate MFA challenge. Please try again.");
          return;
        }

        setFactorId(verifiedFactor.id);
        setChallengeId(challengeData.id);
        setMfaRequired(true);
        return; // wait for TOTP step
      }

      // No TOTP factor enrolled — offer optional MFA setup before proceeding.
      // mfa-setup page itself provides "Enable MFA" and "Skip for now" (-> dashboard),
      // so nothing here is compulsory.
      await reportLoginSuccess("admin", email.trim());
      router.push("/admin/mfa-setup");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = mfaCode.replace(/\s/g, "");
    if (code.length !== 6) return;

    setMfaLoading(true);
    setError("");

    try {
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (verifyErr) {
        await reportLoginFailure("admin", email.trim());
        setError("Invalid code. Please check your authenticator app and try again.");
        setMfaCode("");
        return;
      }

      await reportLoginSuccess("admin", email.trim());
      router.push("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setMfaLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width:        "100%",
    height:       42,
    padding:      "0 12px",
    background:   "#F9FAFB",
    border:       "1.5px solid #E5E7EB",
    borderRadius: 8,
    fontSize:     13,
    color:        "#0A2540",
    outline:      "none",
    fontFamily:   "var(--font-body)",
    boxSizing:    "border-box",
    transition:   "border-color 0.12s",
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#ffffff", overflow: "hidden" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        width:          "44%",
        background:     "#0A2540",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "60px 56px",
        position:       "relative",
        overflow:       "hidden",
        flexShrink:     0,
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 300, height: 300,
          background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(0,212,255,0.12)",
            border: "1px solid rgba(0,212,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={17} color="#00D4FF" />
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 17, color: "#ffffff", letterSpacing: "-0.03em",
          }}>
            Creditlinker
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: "#00D4FF", background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.2)",
            padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase",
          }}>
            Admin
          </span>
        </div>

        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 30, color: "#ffffff", letterSpacing: "-0.03em",
          lineHeight: 1.15, marginBottom: 12,
        }}>
          Platform Control Centre
        </h2>
        <p style={{
          color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 44,
        }}>
          Manage businesses, financers, verifications, and platform health from a single interface.
        </p>

        {[
          { icon: <ShieldCheck size={15} />, label: "Identity & KYB Verifications" },
          { icon: <BarChart2 size={15} />,   label: "Platform Analytics & Reports" },
          { icon: <Activity size={15} />,    label: "System Health & Audit Logs" },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#00D4FF",
            }}>
              {icon}
            </div>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>{label}</span>
          </div>
        ))}

        {/* Bottom note */}
        <p style={{
          position: "absolute", bottom: 32, left: 56,
          fontSize: 11, color: "#334155",
        }}>
          Restricted access — authorised personnel only
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "32px",
        background:     "#F5F7FA",
      }}>
        <div style={{
          width: "100%", maxWidth: 400,
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          padding: "36px 32px",
        }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 21, color: "#0A2540",
              letterSpacing: "-0.03em", marginBottom: 6,
            }}>
              Admin sign in
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              Sign in to access the Creditlinker admin portal
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "#374151", marginBottom: 6,
              }}>
                Email address
              </label>
              <input
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputBase}
                onFocus={(e)  => (e.target.style.borderColor = "#0A2540")}
                onBlur={(e)   => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "#374151", marginBottom: 6,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputBase, paddingRight: 40 }}
                  onFocus={(e)  => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e)   => (e.target.style.borderColor = "#E5E7EB")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9CA3AF", display: "flex", padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "10px 13px",
                color: "#DC2626", fontSize: 13, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 15 }}>⚠</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                width: "100%", height: 42,
                background: loading || !email.trim() || !password.trim()
                  ? "#E5E7EB" : "#0A2540",
                color: loading || !email.trim() || !password.trim()
                  ? "#9CA3AF" : "#ffffff",
                border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: loading || !email.trim() || !password.trim()
                  ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                transition: "background 0.12s",
                fontFamily: "var(--font-body)",
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>

          </form>

          {/* Footer note */}
          <p style={{
            marginTop: 20, fontSize: 11, color: "#D1D5DB",
            textAlign: "center", lineHeight: 1.6,
          }}>
            Admin access only. Unauthorised access is prohibited.
          </p>
        </div>
      </div>

    </div>
  );
}
