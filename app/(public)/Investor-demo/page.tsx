"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Play,
  FileText,
  Building2,
  CalendarDays,
  Mail,
  Shield,
  TrendingUp,
  Globe,
} from "lucide-react";

/* ─────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────── */

function GridBg() {
  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

function ConfidentialBadge() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(0,212,255,0.07)",
        border: "1px solid rgba(0,212,255,0.2)",
        color: "#00D4FF",
        padding: "5px 14px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
      }}
    >
      <Shield size={11} />
      Investor Access
    </div>
  );
}

/* Primary CTA */
function PrimaryButton({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "#00D4FF",
        color: "#0A2540",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 15,
        padding: "14px 20px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap" as const,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "#26DCFF";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(0,212,255,0.35)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "#00D4FF";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {icon}
      {children}
    </a>
  );
}

/* Secondary CTA */
function SecondaryButton({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "rgba(255,255,255,0.05)",
        color: "#ffffff",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 15,
        padding: "14px 20px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap" as const,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.09)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.25)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      {icon}
      {children}
    </a>
  );
}

/* Stat card */
function StatCard({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: "28px 24px",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(28px,3vw,40px)",
          color: "#00D4FF",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "rgba(255,255,255,0.85)",
          marginBottom: sub ? 4 : 0,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sub}</div>
      )}
    </div>
  );
}

/* Value proposition item */
function ValueProp({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00D4FF",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            color: "#0A2540",
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.72 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */

export default function InvestorDemoPage() {
  return (
    <div style={{ background: "#ffffff" }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          background: "linear-gradient(160deg, #060F1C 0%, #0A2540 55%, #0d3060 100%)",
          overflow: "hidden",
          padding: "80px 20px 70px",
        }}
      >
        <GridBg />

        {/* Radial accent glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            background: "radial-gradient(ellipse, rgba(0,212,255,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 760,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div
            className="animate-fade-up"
            style={{ marginBottom: 28 }}
          >
            <ConfidentialBadge />
          </div>

          {/* Wordmark */}
          <div
            className="animate-fade-up delay-100"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            CREDITLINKER
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up delay-200"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(30px, 5vw, 56px)",
              letterSpacing: "-0.04em",
              color: "#ffffff",
              lineHeight: 1.08,
              marginBottom: 24,
            }}
          >
            Financial Identity Infrastructure
            <br />
            <span style={{ color: "#00D4FF" }}>for Businesses</span>
          </h1>

          {/* Sub */}
          <p
            className="animate-fade-up delay-300"
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.78,
              maxWidth: 580,
              margin: "0 auto 48px",
            }}
          >
            Creditlinker helps businesses build a trusted financial identity from
            their real business activity, making it easier to access funding, work
            with suppliers, and unlock financial opportunities.
          </p>

          {/* CTA Grid */}
          <div
            className="animate-fade-up delay-400 investor-cta-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <PrimaryButton href="#" icon={<Play size={15} />}>
              Access Live Demo
            </PrimaryButton>
            <SecondaryButton href="#" icon={<FileText size={15} />}>
              View Pitch Deck
            </SecondaryButton>
            <SecondaryButton href="#" icon={<Building2 size={15} />}>
              Company Overview
            </SecondaryButton>
            <SecondaryButton href="#" icon={<CalendarDays size={15} />}>
              Schedule Meeting
            </SecondaryButton>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section
        style={{
          background: "#0A2540",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
          className="investor-stats-grid"
        >
          <StatCard value="$331B+" label="Addressable Market" sub="Sub-Saharan Africa MSME financing gap" />
          <StatCard value="44M+" label="SMEs Underserved" sub="51% unable to access sufficient funding" />
          <StatCard value="3x–5x" label="Higher Approval Rate" sub="vs. traditional credit bureaus" />
          <div style={{ padding: "28px 24px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(28px,3vw,40px)",
                color: "#00D4FF",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              6
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
              Scoring Dimensions
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Proprietary identity model
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CREDITLINKER ── */}
      <section className="investor-why-section" style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Section label */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#00D4FF",
              }}
            >
              Why Creditlinker
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(26px, 3vw, 38px)",
              letterSpacing: "-0.035em",
              color: "#0A2540",
              lineHeight: 1.15,
              marginBottom: 16,
              maxWidth: 560,
            }}
          >
            Every business partner wants confidence before working with you
          </h2>

          <p
            style={{
              fontSize: 16,
              color: "#4B5563",
              lineHeight: 1.8,
              maxWidth: 700,
              marginBottom: 52,
            }}
          >
            Whether it's an investor, a bank, a microfinance institution, a supplier in Lagos
            or a manufacturer in China, every business partner wants to understand who you are,
            what your business does, how you operate, and whether your business is performing well.
            Creditlinker turns operational and financial data into clear, verifiable insights that
            inspire trust and open opportunities.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 36,
            }}
            className="investor-props-grid"
          >
            <ValueProp
              icon={<Shield size={18} />}
              title="Verified Financial Identity"
              desc="A six-dimensional score built from real transaction data, not self-reported financials. Credible to banks, investors, and supply chain partners."
            />
            <ValueProp
              icon={<TrendingUp size={18} />}
              title="Capital Access Intelligence"
              desc="Matches businesses to the right financing products based on their actual financial behaviour, unlocking funding that was previously inaccessible."
            />
            <ValueProp
              icon={<Globe size={18} />}
              title="Pan-African Infrastructure"
              desc="Built for the realities of African business: irregular cash flows, informal segments, and multi-currency environments, with global partner compatibility."
            />
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "var(--color-border)", margin: "0 24px" }} />

      {/* ── CONTACT FOOTER ── */}
      <section style={{ padding: "52px 24px", background: "#ffffff" }}>
        <div
          className="investor-contact-footer"
          style={{
            maxWidth: 860,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
                color: "#0A2540",
                marginBottom: 6,
              }}
            >
              Speak directly with the founder
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, maxWidth: 440 }}>
              For partnership enquiries, due diligence requests, or to arrange a
              call, reach out directly.
            </p>
          </div>
          <a
            href="mailto:Giwamicheal@creditlinker.com.ng"
            className="investor-contact-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0A2540",
              color: "#ffffff",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 9,
              textDecoration: "none",
              transition: "all 0.18s ease",
              flexShrink: 0,
              wordBreak: "break-all",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#0d3060";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#0A2540";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <Mail size={14} />
            Giwamicheal@creditlinker.com.ng
          </a>
        </div>

        {/* Confidentiality note */}
        <div
          style={{
            maxWidth: 860,
            margin: "32px auto 0",
            paddingTop: 24,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7, textAlign: "center" }}>
            This page is intended for prospective investors and authorised partners only.
            The information contained herein is confidential and is not for public distribution.
            &copy; {new Date().getFullYear()} Creditlinker. All rights reserved.
          </p>
        </div>
      </section>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        /* ── Stats strip ── */
        @media (max-width: 700px) {
          .investor-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .investor-stats-grid > div {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .investor-props-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .investor-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        /* ── CTA grid: 1 column on small screens ── */
        @media (max-width: 480px) {
          .investor-cta-grid {
            grid-template-columns: 1fr !important;
            max-width: 100% !important;
          }
        }

        /* ── Why section: tighter padding on mobile ── */
        @media (max-width: 600px) {
          .investor-why-section {
            padding: 56px 20px !important;
          }
        }

        /* ── Contact footer: stack on mobile ── */
        @media (max-width: 600px) {
          .investor-contact-footer {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .investor-contact-btn {
            width: 100%;
            justify-content: center;
            word-break: break-all;
            font-size: 13px !important;
          }
        }

        /* ── Stats strip: tighter on very small screens ── */
        @media (max-width: 360px) {
          .investor-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .investor-stats-grid > div {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
        }
      `}</style>
    </div>
  );
}
