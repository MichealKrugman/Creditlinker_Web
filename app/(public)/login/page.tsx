"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/* ─────────────────────────────────────────────────────────
   LOGO
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill={dark ? "rgba(255,255,255,0.10)" : "#0A2540"} />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { redirectPath } = await signIn(email, password);
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ─── Root ─── */
        .login-root {
          margin-top: calc(-1 * var(--header-height));
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #0A2540;
        }

        /* ─── Left: dark animated panel ─── */
        .login-dark {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 64px;
          overflow: hidden;
          background: #0A2540;
        }

        /* ─── Animated gradient orbs ─── */
        @keyframes orb-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1); opacity: 0.55; }
          33%  { transform: translate(40px, -30px) scale(1.08); opacity: 0.7; }
          66%  { transform: translate(-20px, 40px) scale(0.95); opacity: 0.5; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.55; }
        }
        @keyframes orb-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          40%  { transform: translate(-50px, 30px) scale(1.1); opacity: 0.45; }
          80%  { transform: translate(30px, -20px) scale(0.92); opacity: 0.28; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
        }
        @keyframes orb-drift-3 {
          0%   { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          50%  { transform: translate(25px, 50px) scale(1.05); opacity: 0.32; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
        }

        /* Subtle grid lines shift */
        @keyframes grid-shift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }

        .login-grid-texture {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-shift 12s linear infinite;
        }

        .login-orb-1 {
          position: absolute;
          bottom: -100px; left: -80px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.13) 0%, transparent 65%);
          pointer-events: none;
          animation: orb-drift-1 14s ease-in-out infinite;
        }
        .login-orb-2 {
          position: absolute;
          top: -60px; right: -60px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%);
          pointer-events: none;
          animation: orb-drift-2 18s ease-in-out infinite;
        }
        .login-orb-3 {
          position: absolute;
          top: 40%; left: 30%;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%);
          pointer-events: none;
          animation: orb-drift-3 22s ease-in-out infinite;
        }

        /* ─── Right: white form panel ─── */
        .login-right {
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 64px 72px;
        }

        /* ─── Input focus ─── */
        .login-input-wrap input:focus {
          border-color: #0A2540;
          box-shadow: 0 0 0 3px rgba(10,37,64,0.08);
        }

        /* ─── Entrance animations ─── */
        @keyframes login-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-a0 { animation: login-up 0.3s 0.00s cubic-bezier(0.16,1,0.3,1) both; }
        .login-a1 { animation: login-up 0.3s 0.07s cubic-bezier(0.16,1,0.3,1) both; }
        .login-a2 { animation: login-up 0.3s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
        .login-a3 { animation: login-up 0.3s 0.21s cubic-bezier(0.16,1,0.3,1) both; }

        /* ─── Mobile ─── */
        @media (max-width: 860px) {
          .login-root  { grid-template-columns: 1fr; background: #fff; }
          .login-dark  { display: none !important; }
          .login-right { padding: 48px 24px; justify-content: flex-start; align-items: stretch; }
          .login-inner { max-width: 100% !important; }
          .login-h1    { font-size: 26px !important; }
        }
      `}</style>

      <div className="login-root">

        {/* ══ LEFT PANEL ══════════════════════════════════════ */}
        <div className="login-dark">

          {/* Animated bg layers */}
          <div className="login-grid-texture" aria-hidden />
          <div className="login-orb-1" aria-hidden />
          <div className="login-orb-2" aria-hidden />
          <div className="login-orb-3" aria-hidden />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} dark />
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 17, color: "white", letterSpacing: "-0.03em",
            }}>
              Creditlinker
            </span>
          </div>

          {/* Hero copy */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 40, height: 2,
              background: "linear-gradient(90deg, #00D4FF, transparent)",
              borderRadius: 2, marginBottom: 28,
            }} />

            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(32px, 3vw, 44px)",
              color: "white", letterSpacing: "-0.04em",
              lineHeight: 1.1, marginBottom: 18,
            }}>
              Your financial<br />
              identity,{" "}
              <span style={{ color: "#00D4FF" }}>verified.</span>
            </h2>

            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.38)",
              lineHeight: 1.8, maxWidth: 300, marginBottom: 36,
            }}>
              Sign in to access your profile, track your credit position, and connect with capital providers.
            </p>

            {/* Trust signals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Bank-grade encryption",
                "Explicit data consent",
                "Real transaction data",
              ].map((label) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#00D4FF", opacity: 0.65, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: "rgba(255,255,255,0.32)",
                    letterSpacing: "0.01em",
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: "relative" }}>
            <Separator className="mb-5 opacity-10" />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
              All data is encrypted in transit and at rest.<br />
              Access is governed by explicit consent.
            </p>
          </div>
        </div>

        {/* ══ RIGHT PANEL ═════════════════════════════════════ */}
        <div className="login-right">
          <div className="login-inner" style={{ maxWidth: 420, width: "100%" }}>

            {/* Logo */}
            <div className="login-a0" style={{
              display: "flex", alignItems: "center", gap: 9, marginBottom: 48,
            }}>
              <LogoMark size={26} />
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 16, color: "#0A2540", letterSpacing: "-0.03em",
              }}>
                Creditlinker
              </span>
            </div>

            {/* Heading */}
            <div className="login-a1" style={{ marginBottom: 36 }}>
              <h1 className="login-h1" style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 30, color: "#0A2540", letterSpacing: "-0.04em",
                lineHeight: 1.1, marginBottom: 10,
              }}>
                Sign in
              </h1>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                No account yet?{" "}
                <Link href="/register" style={{
                  color: "#0A2540", fontWeight: 700,
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}>
                  Sign up
                </Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 14px",
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 8, marginBottom: 20,
              }}>
                <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#991B1B" }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form
              className="login-a2"
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label htmlFor="login-email" style={{
                  fontSize: 12, fontWeight: 700, color: "#374151",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  Email
                </label>
                <div className="login-input-wrap">
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required autoFocus
                    autoComplete="email"
                    style={{ height: 44, fontSize: 14, borderRadius: 8 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="login-password" style={{
                    fontSize: 12, fontWeight: 700, color: "#374151",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{
                    fontSize: 12, color: "#6B7280",
                    textDecoration: "underline", textUnderlineOffset: 3,
                  }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="login-input-wrap" style={{ position: "relative" }}>
                  <Input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ height: 44, fontSize: 14, borderRadius: 8, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute", right: 13, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#9CA3AF", display: "flex", alignItems: "center",
                      padding: 0, lineHeight: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
                style={{
                  height: 48, fontSize: 15, fontWeight: 700,
                  letterSpacing: "-0.01em", borderRadius: 10, marginTop: 4,
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in</>
                ) : (
                  <>Sign in <ArrowRight size={15} /></>
                )}
              </Button>
            </form>

            {/* Terms */}
            <p className="login-a3" style={{
              marginTop: 24, fontSize: 11, color: "#9CA3AF",
              lineHeight: 1.8, textAlign: "center",
            }}>
              By signing in you agree to our{" "}
              <Link href="/terms" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/privacy" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>
                Privacy Policy
              </Link>.
            </p>

          </div>
        </div>

      </div>
    </>
  );
}
