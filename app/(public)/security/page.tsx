import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, RefreshCw, AlertCircle } from "lucide-react";

const PILLARS = [
  {
    icon: <Lock size={18} />,
    title: "Encrypted everywhere.",
    body: "TLS 1.3 in transit. AES-256 at rest. Your data is unreadable to anyone without authorised access — including us.",
  },
  {
    icon: <Eye size={18} />,
    title: "Consent is the gate.",
    body: "No financer sees your data without your explicit permission. Every grant is time-bound and revocable at any time, instantly.",
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Role-scoped access.",
    body: "Businesses, capital providers, and developers operate in completely isolated contexts. No role can read outside its boundary.",
  },
  {
    icon: <FileText size={18} />,
    title: "Full audit trail.",
    body: "Every pipeline run, consent grant, and financer access is logged with a timestamp. You can see exactly who accessed what and when.",
  },
  {
    icon: <RefreshCw size={18} />,
    title: "Identity versioning.",
    body: "Changes to your financial identity are versioned, never overwritten. Material changes trigger re-verification automatically.",
  },
  {
    icon: <AlertCircle size={18} />,
    title: "Responsible disclosure.",
    body: "Found a vulnerability? We want to know. Report it to security@creditlinker.com and we'll respond within 48 hours.",
  },
];

export default function SecurityPage() {
  return (
    <div style={{ background: "white", minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <section style={{
        borderBottom: "1px solid #E5E7EB",
        padding: "96px 24px 80px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: 14,
            background: "#0A2540", marginBottom: 28,
          }}>
            <ShieldCheck size={22} color="#00D4FF" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 48px)",
            color: "#0A2540",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: 20,
          }}>
            Your data belongs<br />to you. Full stop.
          </h1>
          <p style={{
            fontSize: 16,
            color: "#6B7280",
            lineHeight: 1.7,
            maxWidth: 440,
            margin: "0 auto",
          }}>
            Creditlinker is built on a simple principle — no one accesses your financial data without your explicit, revocable consent.
          </p>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 1,
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          overflow: "hidden",
          background: "#E5E7EB",
        }}>
          {PILLARS.map((p) => (
            <div key={p.title} style={{
              background: "white",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0A2540",
              }}>
                {p.icon}
              </div>
              <div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700, fontSize: 15,
                  color: "#0A2540", letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}>
                  {p.title}
                </p>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONSENT CALLOUT ── */}
      <section style={{
        borderTop: "1px solid #E5E7EB",
        borderBottom: "1px solid #E5E7EB",
        padding: "80px 24px",
        background: "#F9FAFB",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(22px, 4vw, 32px)",
            color: "#0A2540",
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            marginBottom: 16,
          }}>
            Access is never assumed.<br />It is always granted.
          </p>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>
            When a capital provider requests access to your financial identity, you decide what they see, for how long, and you can revoke it at any moment — no questions asked.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px", borderRadius: 10,
              background: "#0A2540", color: "white",
              fontWeight: 700, fontSize: 14,
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
          >
            Build your financial identity
          </Link>
        </div>
      </section>

      {/* ── FOOTER NOTE ── */}
      <section style={{ padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>
          Questions about how we handle your data?{" "}
          <Link href="/contact" style={{ color: "#6B7280", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Contact us
          </Link>
          {" "}or review our{" "}
          <Link href="/privacy" style={{ color: "#6B7280", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Privacy Policy
          </Link>.
        </p>
      </section>

    </div>
  );
}
