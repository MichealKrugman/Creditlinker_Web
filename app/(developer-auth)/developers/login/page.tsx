"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Code2 } from "lucide-react";
import { signIn } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────
   LOGO
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.08)" />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DeveloperLoginPage() {
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // If already signed in as a developer, go straight to the portal
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const type = data.session.user.user_metadata?.account_type;
      if (type === "developer") router.replace("/developers/overview");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const { accountType } = await signIn(email.trim(), password);
      if (accountType !== "developer") {
        // Signed in but not a developer account — sign them out and show an error
        await supabase.auth.signOut();
        setError("This email is not registered as a developer account. Please use the correct portal.");
        setLoading(false);
        return;
      }
      router.replace("/developers/overview");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .dev-login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 400px 1fr;
        }
        @media (max-width: 800px) {
          .dev-login-root  { grid-template-columns: 1fr; }
          .dev-login-panel { display: none !important; }
          .dev-login-form  { padding: 48px 24px !important; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dev-login-animate { animation: fadein 0.24s cubic-bezier(0.16,1,0.3,1) both; }
        .dev-login-input:focus { border-color: #0A2540 !important; outline: none; }
        .dev-login-btn:hover:not(:disabled) { opacity: 0.9; }
      `}</style>

      <div className="dev-login-root">

        {/* ── LEFT DARK PANEL ── */}
        <div className="dev-login-panel" style={{
          background: "#0A2540",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Grid texture */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          {/* Glow */}
          <div aria-hidden style={{
            position: "absolute", top: "-60px", right: "-60px",
            width: 320, height: 320, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          }} />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} />
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                Creditlinker
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#00D4FF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Developers
              </p>
            </div>
          </div>

          {/* Body copy */}
          <div style={{ position: "relative" }}>
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #00D4FF, transparent)", marginBottom: 22, borderRadius: 2 }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "white", letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 16 }}>
              Build on the<br />Creditlinker API.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 270 }}>
              Access business financial identity data, consent infrastructure, and the credit scoring pipeline — all through a single REST API.
            </p>

            {/* Feature bullets */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
              {[
                { icon: "🔑", text: "Scoped API keys with permission control" },
                { icon: "🪝", text: "Webhook delivery for real-time events" },
                { icon: "🧪", text: "Full sandbox environment for integration testing" },
                { icon: "📊", text: "30-day usage analytics and request logs" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: "relative" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 18 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} Creditlinker · All data encrypted at rest and in transit.
            </p>
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="dev-login-form" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "56px 48px",
          background: "white",
        }}>
          <div className="dev-login-animate" style={{ maxWidth: 420, width: "100%" }}>

            {/* Icon */}
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <Code2 size={20} style={{ color: "#0A5060" }} />
            </div>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800, fontSize: 26,
              color: "#0A2540", letterSpacing: "-0.04em",
              lineHeight: 1.1, marginBottom: 6,
            }}>
              Sign in to your<br />developer account
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
              Don't have an account?{" "}
              <Link href="/developers/register" style={{ color: "#0A2540", fontWeight: 700, textDecoration: "none" }}>
                Create one
              </Link>
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.io"
                  required
                  autoFocus
                  className="dev-login-input"
                  style={{
                    width: "100%", height: 46, padding: "0 14px",
                    border: "1.5px solid #E5E7EB", borderRadius: 9,
                    fontSize: 14, color: "#0A2540",
                    background: "white", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {/* forgot password — future */}}
                    style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="dev-login-input"
                    style={{
                      width: "100%", height: 46, padding: "0 42px 0 14px",
                      border: "1.5px solid #E5E7EB", borderRadius: 9,
                      fontSize: 14, color: "#0A2540",
                      background: "white", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", color: "#9CA3AF", padding: 0,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "11px 14px",
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 9, fontSize: 13, color: "#DC2626", lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="dev-login-btn"
                style={{
                  height: 48, borderRadius: 10,
                  background: "#0A2540", border: "none",
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: loading || !email.trim() || !password ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Signing in…</>
                  : <>Sign in <ArrowRight size={15} /></>
                }
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            </div>

            {/* Register CTA */}
            <Link
              href="/developers/register"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                height: 46, borderRadius: 10,
                border: "1.5px solid #E5E7EB", background: "white",
                fontSize: 14, fontWeight: 600, color: "#374151",
                textDecoration: "none", transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              Create a developer account
            </Link>

            <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
              Looking for the business portal?{" "}
              <Link href="/login" style={{ color: "#6B7280", fontWeight: 600, textDecoration: "none" }}>
                Sign in here
              </Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
