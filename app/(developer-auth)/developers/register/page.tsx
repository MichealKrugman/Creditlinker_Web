"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Code2 } from "lucide-react";
import { registerDeveloper } from "@/lib/auth";
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
   PASSWORD STRENGTH
───────────────────────────────────────────────────────── */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#E5E7EB" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score,  label: "Weak",   color: "#EF4444" };
  if (score <= 3) return { score,  label: "Fair",   color: "#F59E0B" };
  return              { score,  label: "Strong", color: "#10B981" };
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DeveloperRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const pwStrength = passwordStrength(password);

  // If already signed in as a developer, redirect straight in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const type = data.session.user.user_metadata?.account_type;
      if (type === "developer") router.replace("/developers/overview");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !agreed) return;
    if (pwStrength.score < 2) { setError("Please choose a stronger password (min 8 chars, mix of letters and numbers)."); return; }

    setLoading(true);
    setError(null);

    try {
      await registerDeveloper({ fullName: fullName.trim(), email: email.trim(), password });
      setDone(true);
      // Auto-redirect after a moment
      setTimeout(() => router.replace("/developers/overview"), 2200);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .dev-reg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 400px 1fr;
        }
        @media (max-width: 800px) {
          .dev-reg-root  { grid-template-columns: 1fr; }
          .dev-reg-panel { display: none !important; }
          .dev-reg-form  { padding: 48px 24px !important; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dev-reg-animate { animation: fadein 0.24s cubic-bezier(0.16,1,0.3,1) both; }
        .dev-reg-input:focus { border-color: #0A2540 !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dev-reg-root">

        {/* ── LEFT DARK PANEL ── */}
        <div className="dev-reg-panel" style={{
          background: "#0A2540",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div aria-hidden style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: 320, height: 320, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
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
              Start building<br />in minutes.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 270 }}>
              Create a developer account and immediately access the sandbox environment — no approval needed to start integrating.
            </p>

            {/* Steps */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { n: "1", text: "Create your account (takes 60 seconds)" },
                { n: "2", text: "Generate an API key in the developer portal" },
                { n: "3", text: "Test against the full sandbox environment" },
                { n: "4", text: "Request production access when ready" },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#00D4FF", marginTop: 1,
                  }}>
                    {step.n}
                  </span>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{step.text}</p>
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
        <div className="dev-reg-form" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "56px 48px",
          background: "white",
          overflowY: "auto",
        }}>
          <div className="dev-reg-animate" style={{ maxWidth: 420, width: "100%" }}>

            {/* Back */}
            <Link
              href="/developers/login"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6B7280", textDecoration: "none", marginBottom: 28 }}
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>

            {/* ── DONE STATE ── */}
            {done ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: "#ECFDF5", border: "1px solid #A7F3D0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <CheckCircle2 size={30} style={{ color: "#10B981" }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", marginBottom: 10 }}>
                  Account created!
                </h2>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 20px" }}>
                  Taking you to your developer portal…
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={16} style={{ color: "#0A2540", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>Opening portal…</span>
                </div>
              </div>
            ) : (
              <>
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 22,
                }}>
                  <Code2 size={20} style={{ color: "#0A5060" }} />
                </div>

                <h1 style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800, fontSize: 26,
                  color: "#0A2540", letterSpacing: "-0.04em",
                  lineHeight: 1.1, marginBottom: 6,
                }}>
                  Create your<br />developer account
                </h1>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
                  Already have one?{" "}
                  <Link href="/developers/login" style={{ color: "#0A2540", fontWeight: 700, textDecoration: "none" }}>
                    Sign in
                  </Link>
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Full name */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Tunde Balogun"
                      required
                      autoFocus
                      className="dev-reg-input"
                      style={{
                        width: "100%", height: 46, padding: "0 14px",
                        border: "1.5px solid #E5E7EB", borderRadius: 9,
                        fontSize: 14, color: "#0A2540",
                        background: "white", boxSizing: "border-box", fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>
                      Work email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.io"
                      required
                      className="dev-reg-input"
                      style={{
                        width: "100%", height: 46, padding: "0 14px",
                        border: "1.5px solid #E5E7EB", borderRadius: 9,
                        fontSize: 14, color: "#0A2540",
                        background: "white", boxSizing: "border-box", fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                        className="dev-reg-input"
                        style={{
                          width: "100%", height: 46, padding: "0 42px 0 14px",
                          border: "1.5px solid #E5E7EB", borderRadius: 9,
                          fontSize: 14, color: "#0A2540",
                          background: "white", boxSizing: "border-box", fontFamily: "inherit",
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

                    {/* Password strength bar */}
                    {password && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: i <= pwStrength.score ? pwStrength.color : "#E5E7EB",
                              transition: "background 0.2s",
                            }} />
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: pwStrength.color, fontWeight: 600 }}>
                          {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      style={{ marginTop: 2, accentColor: "#0A2540", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                      I agree to the{" "}
                      <Link href="/terms" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "none" }}>Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>.
                      Developer accounts are subject to the API Usage Policy.
                    </span>
                  </label>

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
                    disabled={loading || !fullName.trim() || !email.trim() || !password || !agreed}
                    style={{
                      height: 48, borderRadius: 10,
                      background: "#0A2540", border: "none",
                      color: "white", fontSize: 15, fontWeight: 700,
                      cursor: loading ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: loading || !fullName.trim() || !email.trim() || !password || !agreed ? 0.6 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {loading
                      ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Creating account…</>
                      : <>Create account <ArrowRight size={15} /></>
                    }
                  </button>

                </form>

                <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
                  Looking for the business portal?{" "}
                  <Link href="/login" style={{ color: "#6B7280", fontWeight: 600, textDecoration: "none" }}>
                    Sign in here
                  </Link>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
