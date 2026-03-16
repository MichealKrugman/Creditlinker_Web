"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   LOGO
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill={dark ? "rgba(255,255,255,0.08)" : "#0A2540"} />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke={dark ? "white" : "white"} strokeWidth="2" strokeLinecap="round" />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    // TODO: POST to Keycloak token endpoint → decode JWT role → server-side redirect
    setError("Invalid credentials. Please try again.");
  };

  return (
    <>
      <style>{`
        .login-root {
          margin-top: calc(-1 * var(--header-height));
          min-height: 100vh;
          display: grid;
          grid-template-columns: 480px 1fr;
          background: #fff;
        }
        @media (max-width: 860px) {
          .login-root { grid-template-columns: 1fr; }
          .login-dark  { display: none !important; }
          .login-form  { padding: 48px 24px !important; }
        }
        .login-input-row { position: relative; }
        .login-input-row input { height: 44px; font-size: 14px; border-radius: 8px; }
        .login-input-row input:focus {
          border-color: #0A2540;
          box-shadow: 0 0 0 3px rgba(10,37,64,0.08);
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT: DARK BRAND PANEL ── */}
        <div className="login-dark" style={{
          background: "#0A2540",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "52px 64px",
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Subtle grid texture */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Accent glow */}
          <div aria-hidden style={{
            position: "absolute", bottom: "-80px", left: "-80px",
            width: 360, height: 360, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }} />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} dark />
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "white",
              letterSpacing: "-0.03em",
            }}>
              Creditlinker
            </span>
          </div>

          {/* Center mark */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 48, height: 2,
              background: "linear-gradient(90deg, #00D4FF, transparent)",
              marginBottom: 24,
              borderRadius: 2,
            }} />
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 28,
              color: "white",
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
              marginBottom: 12,
            }}>
              Your business,<br />fully verified.
            </p>
            <p style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.7,
              maxWidth: 280,
            }}>
              Sign in to manage your financial identity and access the capital your business deserves.
            </p>
          </div>

          {/* Bottom footnote */}
          <div style={{ position: "relative" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
              All data is encrypted in transit and at rest.<br />
              Access is governed by explicit consent.
            </p>
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="login-form" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "64px 48px",
          background: "white",
        }}>
          <div style={{ maxWidth: 400, width: "100%" }}>

            {/* Mobile logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 40 }}
              className="mobile-only">
              <LogoMark size={26} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", letterSpacing: "-0.03em" }}>
                Creditlinker
              </span>
            </div>

            {/* Heading block */}
            <div style={{ marginBottom: 36 }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 30,
                color: "#0A2540",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: 10,
              }}>
                Welcome back.
              </h1>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                New to Creditlinker?{" "}
                <Link href="/register" style={{
                  color: "#0A2540",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}>
                  Create an account
                </Link>
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 14px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                marginBottom: 24,
              }}>
                <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#991B1B" }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label htmlFor="login-email" style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  display: "block",
                }}>
                  Email address
                </label>
                <div className="login-input-row">
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="login-password" style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    display: "block",
                  }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{
                    fontSize: 12,
                    color: "#6B7280",
                    fontWeight: 500,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="login-input-row" style={{ position: "relative" }}>
                  <Input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
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
                className="w-full mt-1"
                style={{
                  height: 48,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  borderRadius: 10,
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                ) : (
                  <>Sign in <ArrowRight size={15} /></>
                )}
              </Button>

            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            </div>

            {/* Google SSO */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              style={{ height: 48, fontSize: 14, fontWeight: 600, borderRadius: 10, gap: 10 }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Terms */}
            <p style={{
              marginTop: 28,
              fontSize: 11,
              color: "#9CA3AF",
              lineHeight: 1.8,
              textAlign: "center",
            }}>
              By signing in you agree to our{" "}
              <Link href="/terms" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
            </p>

          </div>
        </div>

      </div>
    </>
  );
}
