"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   IDENTITY CARD  — the centrepiece visual
   Shows what a Creditlinker Financial Identity looks like.
   Pure SVG/inline — no images, no external deps.
───────────────────────────────────────────────────────── */
function IdentityCard() {
  const dims = [
    { label: "Revenue Stability",       v: 85, c: "#10B981" },
    { label: "Cashflow Predictability", v: 78, c: "#38BDF8" },
    { label: "Expense Discipline",      v: 81, c: "#818CF8" },
    { label: "Liquidity Strength",      v: 74, c: "#F59E0B" },
    { label: "Financial Consistency",   v: 88, c: "#00D4FF" },
    { label: "Risk Profile",            v: 91, c: "#F472B6" },
  ];

  const R    = 52;
  const circ = 2 * Math.PI * R;
  const score = 742;
  const dash = circ * (score / 1000);

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d2845 0%, #061524 100%)",
      borderRadius: 24,
      boxShadow: "0 48px 120px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)",
      overflow: "hidden",
      width: "100%",
      maxWidth: 440,
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 3 }}>
            Financial Identity
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>
            Aduke Bakeries Ltd.
          </p>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
          color: "#10B981", fontSize: 10, fontWeight: 800,
          padding: "4px 12px", borderRadius: 9999, letterSpacing: "0.08em",
        }}>
          ✓ VERIFIED
        </span>
      </div>

      {/* Score + dimensions */}
      <div className="home-card-inner" style={{ padding: "22px 24px", display: "flex", gap: 22, alignItems: "center" }}>
        {/* Ring */}
        <div style={{ flexShrink: 0, position: "relative", width: 124, height: 124 }}>
          <svg width="124" height="124" viewBox="0 0 124 124" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="62" cy="62" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <circle
              cx="62" cy="62" r={R} fill="none"
              stroke="url(#g1)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.33,1,.68,1)" }}
            />
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{score}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>Low Risk</span>
          </div>
        </div>

        {/* Bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {dims.map(d => (
            <div key={d.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{d.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: d.c }}>{d.v}</span>
              </div>
              <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", width: `${d.v}%`, background: d.c, borderRadius: 9999 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        padding: "14px 24px",
        background: "rgba(0,212,255,0.06)",
        borderTop: "1px solid rgba(0,212,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            <span style={{ color: "#00D4FF" }}>2 capital providers</span> want to connect
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>24 months of verified data</p>
        </div>
        <span style={{ fontSize: 11, color: "#00D4FF", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
          Review <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        .home-grid {
          display: grid;
          grid-template-columns: 1fr 460px;
          gap: 80px;
          align-items: center;
        }
        .home-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .trust-row { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; }

        @media (max-width: 960px) {
          .home-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .home-card-wrap { display: flex; justify-content: center; }
          .home-grid-inner { padding: 56px 24px !important; }
          .home-hero-section { min-height: auto !important; }
        }
        @media (max-width: 600px) {
          .home-grid-inner { padding: 40px 20px 44px !important; }
          /* Hide card on mobile — headline carries the story */
          .home-card-wrap { display: none !important; }
          /* Tighten hero text */
          .home-body-text { font-size: 15px !important; line-height: 1.65 !important; margin-bottom: 28px !important; }
          .home-eyebrow { margin-bottom: 16px !important; font-size: 11px !important; }
          /* Stack CTAs full-width */
          .home-ctas { flex-direction: column !important; gap: 10px !important; margin-bottom: 32px !important; }
          .home-ctas a { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; text-align: center !important; }
          /* Trust row compact */
          .trust-row { gap: 8px 14px !important; }
          .trust-label { font-size: 11px !important; margin-bottom: 8px !important; }
          /* Problem section */
          .home-problem-section { padding: 44px 20px !important; }
          .home-problem-body { display: none !important; }
          /* CTA section */
          .home-cta-section { padding: 44px 20px !important; }
          .home-cta-body { font-size: 15px !important; }
          .home-cta-btns { flex-direction: column !important; gap: 10px !important; }
          .home-cta-btns a { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        className="home-hero-section"
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex", alignItems: "center",
          background: "radial-gradient(ellipse 800px 600px at 80% 40%, rgba(0,212,255,0.06) 0%, transparent 65%), #ffffff",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Dot grid */}
        <div aria-hidden style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(10,37,64,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div
          className="home-grid home-grid-inner"
          style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "80px 32px", width: "100%", boxSizing: "border-box" }}
        >
          {/* ── LEFT ── */}
          <div>
            {/* Eyebrow */}
            <div
              className="animate-fade-up home-eyebrow"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)",
                color: "#0A5060", fontSize: 12, fontWeight: 700,
                padding: "5px 14px", borderRadius: 9999, marginBottom: 28,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", flexShrink: 0, display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
              Your business has a financial story. Tell it.
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up delay-100"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "#0A2540",
                lineHeight: 1.02,
                marginBottom: 28,
                fontSize: "clamp(42px, 5.5vw, 72px)",
                letterSpacing: "-0.045em",
              }}
            >
              Capital doesn&apos;t know<br />
              your business.<br />
              <span style={{
                background: "linear-gradient(90deg, #00D4FF, #38BDF8, #0A2540, #00D4FF)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer-text 5s linear infinite",
              }}>
                We fix that.
              </span>
            </h1>

            {/* Sub */}
            <p
              className="animate-fade-up delay-200 home-body-text"
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                color: "#4B5563",
                lineHeight: 1.75,
                marginBottom: 40,
                maxWidth: 500,
              }}
            >
              Creditlinker is your business&apos;s{" "}
              <strong style={{ color: "#0A2540", fontWeight: 700 }}>financial identity</strong> — a verified,
              portable profile built from your real financial activity: transactions,
              ledger records, contracts, payment logs, and more. Any capital provider —
              bank, fintech, DFI, cooperative, leasing company — can evaluate your
              business on how it actually operates. Not a credit score. A complete picture.
            </p>

            {/* CTAs */}
            <div className="home-ctas animate-fade-up delay-300" style={{ marginBottom: 48 }}>
              <Link
                href="/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0A2540", color: "white",
                  padding: "15px 28px", borderRadius: 12,
                  fontWeight: 700, fontSize: 16,
                  boxShadow: "0 4px 16px rgba(10,37,64,0.2)",
                  transition: "background 0.15s, box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#0d3060";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(10,37,64,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "#0A2540";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(10,37,64,0.2)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Get my Creditlinker ID <ArrowRight size={17} />
              </Link>
              <Link
                href="/for-financers"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "#6B7280", fontSize: 15, fontWeight: 500,
                  padding: "14px 22px", borderRadius: 12,
                  border: "1.5px solid #E5E7EB",
                  transition: "border-color 0.15s, color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
                  (e.currentTarget as HTMLElement).style.color = "#0A2540";
                  (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
                  (e.currentTarget as HTMLElement).style.color = "#6B7280";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                I&apos;m a capital provider
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up delay-400">
              <p className="trust-label" style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Used by businesses with accounts at
              </p>
              <div className="trust-row">
                {["Access Bank", "GTBank", "UBA", "Zenith Bank", "Stanbic IBTC", "Polaris", "First Bank"].map(b => (
                  <span key={b} style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>{b}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — Identity card ── */}
          <div className="home-card-wrap animate-float">
            <IdentityCard />
          </div>
        </div>
      </section>

      {/* ══ THE PROBLEM (3 lines, no fluff) ═══════════════════════ */}
      <section
        aria-label="The problem"
        className="home-problem-section"
        style={{ padding: "88px 32px", background: "#0A2540", position: "relative", overflow: "hidden" }}
      >
        <div aria-hidden style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            color: "white", lineHeight: 1.1, marginBottom: 24,
            fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em",
          }}>
            Your business works hard.<br />
            The financial system
            {" "}<span style={{ color: "#00D4FF" }}>can&apos;t see it.</span>
          </h2>
          <p className="home-problem-body" style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 48, maxWidth: 600, margin: "0 auto 48px" }}>
            Traditional credit systems were built for large enterprises with formal records.
            Most SMEs — even thriving ones — are invisible to lenders because the system
            looks for documents, not behavior. Creditlinker reads your actual financial activity
            and turns it into a verified identity that capital providers can trust.
          </p>
          <Link
            href="/what-is-financial-identity"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.12)", padding: "10px 20px", borderRadius: 8,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "white";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            What is a financial identity? <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════ */}
      <section
        aria-label="Sign up"
        className="home-cta-section"
        style={{ padding: "96px 32px", background: "white", textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: "#00A8CC", textTransform: "uppercase", marginBottom: 20 }}>
            Free to start
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540",
            fontSize: "clamp(30px, 4.5vw, 54px)", letterSpacing: "-0.04em",
            lineHeight: 1.05, marginBottom: 20,
          }}>
            Build your financial identity.<br />
            <span style={{ color: "#00D4FF" }}>In minutes.</span>
          </h2>
          <p className="home-cta-body" style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.75, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Connect your accounts and financial records. We do the rest — and you
            get a verified Creditlinker ID that follows your business wherever
            capital is available.
          </p>
          <div className="home-cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#0A2540", color: "white",
                padding: "15px 32px", borderRadius: 12,
                fontWeight: 700, fontSize: 16,
                boxShadow: "0 4px 20px rgba(10,37,64,0.18)",
                transition: "background 0.15s, box-shadow 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#0d3060";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(10,37,64,0.28)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#0A2540";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(10,37,64,0.18)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              Get my Creditlinker ID <ArrowRight size={17} />
            </Link>
            <Link
              href="/how-it-works"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: "#6B7280", fontSize: 15, fontWeight: 500,
                padding: "14px 22px", borderRadius: 12,
                border: "1.5px solid #E5E7EB",
                transition: "border-color 0.15s, color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
                (e.currentTarget as HTMLElement).style.color = "#0A2540";
                (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
                (e.currentTarget as HTMLElement).style.color = "#6B7280";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
