"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Loader2, AlertCircle,
  Eye, EyeOff, Building2, Landmark, Code2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type AccountType = "business" | "financer" | "developer";

interface AccountOption {
  id: AccountType;
  label: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
}

const ACCOUNT_TYPES: AccountOption[] = [
  {
    id: "business",
    label: "Business",
    description: "Build your financial identity",
    detail: "Connect your bank data, generate a verified financial profile, and access capital.",
    icon: <Building2 size={20} />,
  },
  {
    id: "financer",
    label: "Capital Provider",
    description: "Evaluate and fund businesses",
    detail: "Access verified financial identities and create financing offers for qualified businesses.",
    icon: <Landmark size={20} />,
  },
  {
    id: "developer",
    label: "Developer",
    description: "Build on the platform",
    detail: "Integrate financial identity data into your product via the Creditlinker API.",
    icon: <Code2 size={20} />,
  },
];

/* ─────────────────────────────────────────────────────────
   LOGO
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill={dark ? "rgba(255,255,255,0.08)" : "#0A2540"} />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   FIELD
───────────────────────────────────────────────────────── */
function Field({
  id, label, type = "text", placeholder, value, onChange, required, autoFocus, children,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; autoFocus?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 700, color: "#374151",
        letterSpacing: "0.04em", textTransform: "uppercase", display: "block",
      }}>
        {label}
      </label>
      {children ?? (
        <Input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          required={required} autoFocus={autoFocus}
          style={{ height: 44, fontSize: 14, borderRadius: 8 }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const [step, setStep]           = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [businessStatus, setBusinessStatus] = useState<"registered" | "unregistered">("registered");
  const [fullName, setFullName]   = useState("");
  const [orgName, setOrgName]     = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const selected = ACCOUNT_TYPES.find((t) => t.id === accountType);

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
    setError("");
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    // TODO: Register in Keycloak → POST /business/register or /institution/register → redirect
    setError("Something went wrong. Please try again.");
  };

  /* ── left panel copy per step ── */
  const panelHeadline = step === 1
    ? (<>One account.<br />Your financial<br />identity.</>)
    : (<>Welcome,<br />{fullName ? fullName.split(" ")[0] : "let's get"}<br />started.</>);

  const panelSub = step === 1
    ? "Choose how you want to use Creditlinker. You can always add more access later."
    : selected
      ? selected.detail
      : "";

  return (
    <>
      <style>{`
        .reg-root {
          margin-top: calc(-1 * var(--header-height));
          min-height: 100vh;
          display: grid;
          grid-template-columns: 480px 1fr;
          background: #fff;
        }
        @media (max-width: 860px) {
          .reg-root  { grid-template-columns: 1fr; }
          .reg-dark  { display: none !important; }
          .reg-form  { padding: 48px 24px !important; }
        }
        .reg-type-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 20px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          background: white;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          text-align: left;
          width: 100%;
        }
        .reg-type-card:hover {
          border-color: #0A2540;
          box-shadow: 0 0 0 3px rgba(10,37,64,0.06);
        }
        .reg-input input {
          height: 44px;
          font-size: 14px;
          border-radius: 8px;
        }
        .reg-input input:focus {
          border-color: #0A2540;
          box-shadow: 0 0 0 3px rgba(10,37,64,0.08);
        }
        @keyframes reg-slide-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-animate {
          animation: reg-slide-in 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      <div className="reg-root">

        {/* ── LEFT: DARK PANEL ── */}
        <div className="reg-dark" style={{
          background: "#0A2540",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px",
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
            position: "absolute", bottom: "-80px", left: "-80px",
            width: 360, height: 360, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }} />

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

          {/* Center content */}
          <div style={{ position: "relative" }}>
            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{
                  height: 3, borderRadius: 2,
                  width: s === step ? 32 : 16,
                  background: s === step ? "#00D4FF" : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s ease",
                }} />
              ))}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                Step {step} of 2
              </span>
            </div>

            <div style={{
              width: 48, height: 2,
              background: "linear-gradient(90deg, #00D4FF, transparent)",
              marginBottom: 24, borderRadius: 2,
            }} />

            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 28, color: "white", letterSpacing: "-0.04em",
              lineHeight: 1.2, marginBottom: 12,
              transition: "all 0.2s ease",
            }}>
              {panelHeadline}
            </p>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.35)",
              lineHeight: 1.7, maxWidth: 280,
            }}>
              {panelSub}
            </p>

            {/* Selected type badge */}
            {step === 2 && selected && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                marginTop: 24, padding: "8px 14px",
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 8,
              }}>
                <span style={{ color: "#00D4FF", display: "flex" }}>{selected.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  {selected.label}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ position: "relative" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
              All data is encrypted in transit and at rest.<br />
              Access is governed by explicit consent.
            </p>
          </div>
        </div>

        {/* ── RIGHT: CONTENT ── */}
        <div className="reg-form" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "64px 48px",
          background: "white",
        }}>
          <div style={{ maxWidth: 400, width: "100%" }}>

            {/* Mobile logo */}
            <div className="mobile-only" style={{
              display: "flex", alignItems: "center", gap: 9, marginBottom: 40,
            }}>
              <LogoMark size={26} />
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 16, color: "#0A2540", letterSpacing: "-0.03em",
              }}>
                Creditlinker
              </span>
            </div>

            {/* ── STEP 1: TYPE SELECTION ── */}
            {step === 1 && (
              <div className="reg-animate">
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: 30, color: "#0A2540", letterSpacing: "-0.04em",
                    lineHeight: 1.1, marginBottom: 10,
                  }}>
                    Create your account.
                  </h1>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{
                      color: "#0A2540", fontWeight: 700,
                      textDecoration: "underline", textUnderlineOffset: 3,
                    }}>
                      Sign in
                    </Link>
                  </p>
                </div>

                <p style={{
                  fontSize: 12, fontWeight: 700, color: "#9CA3AF",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  marginBottom: 14,
                }}>
                  I am a…
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ACCOUNT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      className="reg-type-card"
                      onClick={() => handleTypeSelect(type.id)}
                      type="button"
                    >
                      {/* Icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: "#F3F4F6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#0A2540",
                      }}>
                        {type.icon}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, color: "#0A2540",
                          marginBottom: 2, fontFamily: "var(--font-display)",
                          letterSpacing: "-0.01em",
                        }}>
                          {type.label}
                        </p>
                        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.4 }}>
                          {type.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight size={16} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 2 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: REGISTRATION FORM ── */}
            {step === 2 && (
              <div className="reg-animate">

                {/* Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 600, color: "#6B7280",
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, marginBottom: 28,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div style={{ marginBottom: 32 }}>
                  <h1 style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: 30, color: "#0A2540", letterSpacing: "-0.04em",
                    lineHeight: 1.1, marginBottom: 10,
                  }}>
                    {accountType === "business"  && "Set up your business."}
                    {accountType === "financer"  && "Set up your institution."}
                    {accountType === "developer" && "Set up your account."}
                  </h1>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{
                      color: "#0A2540", fontWeight: 700,
                      textDecoration: "underline", textUnderlineOffset: 3,
                    }}>
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 14px",
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    borderRadius: 8, marginBottom: 24,
                  }}>
                    <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#991B1B" }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* Full name */}
                  <Field
                    id="reg-name" label="Full name"
                    placeholder="Ada Okonkwo"
                    value={fullName} onChange={setFullName}
                    required autoFocus
                  />

                  {/* Business status toggle — business only */}
                  {accountType === "business" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: "#374151",
                        letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>
                        Business status
                      </span>
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        border: "1.5px solid #E5E7EB", borderRadius: 9,
                        overflow: "hidden",
                      }}>
                        {(["registered", "unregistered"] as const).map((status, i) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setBusinessStatus(status)}
                            style={{
                              height: 40, fontSize: 13, fontWeight: 600,
                              cursor: "pointer", border: "none",
                              borderRight: i === 0 ? "1.5px solid #E5E7EB" : "none",
                              background: businessStatus === status ? "#0A2540" : "white",
                              color: businessStatus === status ? "white" : "#6B7280",
                              transition: "all 0.15s",
                              textTransform: "capitalize",
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Org name — business + financer only */}
                  {(accountType === "business" || accountType === "financer") && (
                    <Field
                      id="reg-org"
                      label={accountType === "business" ? "Business name" : "Institution name"}
                      placeholder={accountType === "business" ? "Aduke Bakeries Ltd." : "Zenith Capital Ltd."}
                      value={orgName} onChange={setOrgName}
                      required
                    />
                  )}

                  {/* Email */}
                  <Field
                    id="reg-email"
                    label={accountType === "developer" ? "Email" : "Work email"}
                    type="email"
                    placeholder="you@company.com"
                    value={email} onChange={setEmail}
                    required
                  />

                  {/* Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label htmlFor="reg-password" style={{
                      fontSize: 12, fontWeight: 700, color: "#374151",
                      letterSpacing: "0.04em", textTransform: "uppercase", display: "block",
                    }}>
                      Password
                    </label>
                    <div className="reg-input" style={{ position: "relative" }}>
                      <Input
                        id="reg-password"
                        type={showPass ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        style={{ height: 44, fontSize: 14, borderRadius: 8, paddingRight: 44 }}
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
                    className="w-full"
                    style={{
                      height: 48, fontSize: 15, fontWeight: 700,
                      letterSpacing: "-0.01em", borderRadius: 10, marginTop: 4,
                    }}
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                    ) : (
                      <>Create account <ArrowRight size={15} /></>
                    )}
                  </Button>

                </form>

                {/* Terms */}
                <p style={{
                  marginTop: 20, fontSize: 11, color: "#9CA3AF",
                  lineHeight: 1.8, textAlign: "center",
                }}>
                  By creating an account you agree to our{" "}
                  <Link href="/terms" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>
                    Terms
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" style={{ color: "#6B7280", textDecoration: "underline", textUnderlineOffset: 2 }}>
                    Privacy Policy
                  </Link>.
                </p>

              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
