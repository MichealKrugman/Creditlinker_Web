"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronRight, CheckCircle2, ExternalLink,
  Layers, Lock, AlertCircle, BarChart3,
  ShieldCheck, Database, Eye, Search, Menu, X,
  HelpCircle, Zap, RefreshCw, UserCheck, Globe2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */

function Callout({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF", icon: <AlertCircle size={14} /> },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", icon: <AlertCircle size={14} /> },
    tip:     { bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", icon: <CheckCircle2 size={14} /> },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 20 }}>
      <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ fontSize: 14, color: s.color, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function DocSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ paddingTop: 8, marginBottom: 64 }}>
      {children}
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "#0A2540", marginBottom: 12, lineHeight: 1.2 }}>{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#0A2540", marginBottom: 10, marginTop: 28, lineHeight: 1.3 }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.85, marginBottom: 16 }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", gap: 10, fontSize: 14, color: "#4B5563", lineHeight: 1.65 }}>
          <CheckCircle2 size={14} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 3 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{number}</div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

function DimensionCard({ name, color, desc }: { name: string; color: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{name}</p>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

function QA({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid #F3F4F6" }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", marginBottom: 8 }}>{q}</p>
      <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.8 }}>{a}</div>
    </div>
  );
}

const NAV = [
  {
    group: "Overview",
    icon: <BookOpen size={13} />,
    items: [
      { id: "introduction",   label: "What is Creditlinker?"    },
      { id: "who-is-it-for",  label: "Who is it for?"           },
      { id: "how-it-works",   label: "How it works"             },
    ],
  },
  {
    group: "Your Financial Profile",
    icon: <BarChart3 size={13} />,
    items: [
      { id: "what-is-profile",    label: "What is a profile?"         },
      { id: "six-dimensions",     label: "The 6 health dimensions"    },
      { id: "profile-quality",    label: "Profile quality"            },
      { id: "profile-updates",    label: "When your profile updates"  },
    ],
  },
  {
    group: "How We Collect Data",
    icon: <Database size={13} />,
    items: [
      { id: "data-overview",    label: "What data we use"          },
      { id: "bank-connection",  label: "Connecting your bank"      },
      { id: "statements",       label: "Uploading statements"      },
      { id: "data-we-dont-use", label: "What we don't collect"     },
    ],
  },
  {
    group: "How Lenders Evaluate You",
    icon: <Eye size={13} />,
    items: [
      { id: "lender-view",       label: "What lenders see"           },
      { id: "discovery",         label: "How lenders find you"       },
      { id: "evaluation",        label: "The evaluation process"     },
    ],
  },
  {
    group: "Your Consent & Control",
    icon: <Lock size={13} />,
    items: [
      { id: "consent-explained",  label: "How consent works"         },
      { id: "granting-access",    label: "Granting access"           },
      { id: "revoking-access",    label: "Revoking access"           },
      { id: "what-lenders-see",   label: "Permission levels"         },
      { id: "access-history",     label: "Viewing access history"    },
    ],
  },
  {
    group: "Security & Privacy",
    icon: <ShieldCheck size={13} />,
    items: [
      { id: "security",        label: "How we protect your data"  },
      { id: "privacy",         label: "Your privacy rights"        },
      { id: "data-retention",  label: "Data retention"            },
    ],
  },
  {
    group: "Common Questions",
    icon: <HelpCircle size={13} />,
    items: [
      { id: "faq-profile",    label: "About your profile"        },
      { id: "faq-lenders",    label: "About lenders"             },
      { id: "faq-data",       label: "About your data"           },
    ],
  },
];

export default function DocsPage() {
  const [activeId, setActiveId] = useState("introduction");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allIds = NAV.flatMap((g) => g.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    allIds.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveId(id);
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Sidebar = () => (
    <nav aria-label="Documentation navigation" style={{ width: 240, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, marginBottom: 24, cursor: "pointer" }}>
        <Search size={13} style={{ color: "#9CA3AF" }} />
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>Search docs...</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#D1D5DB", fontFamily: "monospace" }}>Cmd+K</span>
      </div>
      {NAV.map((group) => (
        <div key={group.group} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9CA3AF", marginBottom: 8 }}>
            <span style={{ color: "#CBD5E1" }}>{group.icon}</span>
            {group.group}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  textAlign: "left", padding: "6px 10px", borderRadius: 7, fontSize: 13,
                  fontWeight: activeId === item.id ? 600 : 400,
                  color: activeId === item.id ? "#0A2540" : "#6B7280",
                  background: activeId === item.id ? "rgba(0,212,255,0.07)" : "transparent",
                  border: "none", cursor: "pointer", transition: "all 0.1s",
                  borderLeft: activeId === item.id ? "2px solid #00D4FF" : "2px solid transparent",
                  paddingLeft: activeId === item.id ? 8 : 10,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
      <style>{`
        /* ── Base containment ── */
        .docs-content {
          overflow-x: hidden;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .docs-content *, .docs-content *::before, .docs-content *::after {
          box-sizing: border-box;
        }

        /* ── Tables: always horizontally scrollable ── */
        .docs-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
        }
        .docs-table-wrap > div {
          min-width: 480px;
        }

        /* ── Code block wrapper ── */
        .docs-code-block {
          max-width: 100%;
          overflow: hidden;
        }
        .docs-content pre {
          max-width: 100%;
          overflow-x: auto;
        }

        /* ── Inline code: allow wrapping ── */
        .docs-content p > code,
        .docs-content li > code {
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        /* ── Mobile menu button hidden by default ── */
        .docs-mobile-menu-btn { display: none; }

        /* ── Breakpoint: tablet / small desktop ── */
        @media (max-width: 1024px) {
          .docs-layout { grid-template-columns: 1fr !important; }
          .docs-sidebar { display: none !important; }
          .docs-toc     { display: none !important; }
          .docs-mobile-menu-btn { display: flex !important; }
        }

        /* ── Breakpoint: mobile ── */
        @media (max-width: 768px) {
          .docs-content       { padding: 24px 16px 80px !important; }
          .docs-cards-grid    { grid-template-columns: 1fr !important; }
          .docs-url-grid      { grid-template-columns: 1fr !important; }
          .docs-metrics-grid  { grid-template-columns: 1fr !important; }
          .docs-topbar-label  { display: none !important; }
          .docs-topbar-apiref { display: none !important; }
        }

        /* ── Breakpoint: small mobile ── */
        @media (max-width: 600px) {
          .docs-content       { padding: 20px 12px 80px !important; }

          /* Endpoint rows: wrap and hide auth badge */
          .docs-endpoint-row  { flex-wrap: wrap; gap: 8px !important; }
          .docs-endpoint-auth { display: none !important; }
          /* Long API paths wrap instead of overflowing */
          .docs-endpoint-path {
            word-break: break-all !important;
            white-space: pre-wrap !important;
            font-size: 12px !important;
          }

          /* Tab bar: scroll horizontally if tabs don't fit */
          .docs-tabs-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            flex-wrap: nowrap !important;
          }
          .docs-tabs-bar button {
            white-space: nowrap;
            flex-shrink: 0;
          }

          /* Pipeline event codes: hide to save space */
          .docs-pipeline-event { display: none !important; }

          /* URL / Base-URL cards: wrap long URLs */
          .docs-url-card code {
            word-break: break-all;
            font-size: 11px !important;
          }

          /* Dimension key codes: hide to save space */
          .docs-dimension-key { display: none !important; }

          /* Token/identity table rows: stack on tiny screens */
          .docs-table-wrap > div {
            min-width: 420px;
          }
        }
      `}</style>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E5E7EB", height: 56 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="docs-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              style={{ alignItems: "center", justifyContent: "center", width: 36, height: 36, background: "none", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", color: "#374151", flexShrink: 0 }}
            >
              <Menu size={16} />
            </button>
            <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", textDecoration: "none", letterSpacing: "-0.03em" }}>
              Creditlinker
            </Link>
            <span className="docs-topbar-label" style={{ color: "#E5E7EB" }}>·</span>
            <span className="docs-topbar-label" style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>Documentation</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#0A5060", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 8px", borderRadius: 9999 }}>
              v1.0
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link className="docs-topbar-apiref" href="/developers" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#6B7280", textDecoration: "none" }}>
              Developer docs <ExternalLink size={11} />
            </Link>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0A2540", color: "white", padding: "6px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12 }}>
              Get started
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {mobileNavOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileNavOpen(false)}
          />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, maxWidth: "85vw", background: "white", zIndex: 51, overflowY: "auto", padding: "20px 16px", boxShadow: "4px 0 24px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "#0A2540", letterSpacing: "-0.03em" }}>Navigation</span>
              <button onClick={() => setMobileNavOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }} aria-label="Close navigation">
                <X size={18} />
              </button>
            </div>
            <Sidebar />
          </div>
        </>
      )}

      {/* LAYOUT */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px" }}>
        <div className="docs-layout" style={{ display: "grid", gridTemplateColumns: "240px 1fr 200px", gap: 0, alignItems: "start" }}>

          {/* LEFT SIDEBAR */}
          <div className="docs-sidebar" style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", padding: "28px 20px 28px 0", borderRight: "1px solid #F3F4F6" }}>
            <Sidebar />
          </div>

          {/* MAIN CONTENT */}
          <div ref={contentRef} className="docs-content" style={{ padding: "40px 48px 120px", minWidth: 0, maxWidth: "100%", overflowX: "hidden" }}>

            {/* ═══════════════════════════════════════
                OVERVIEW
            ═══════════════════════════════════════ */}
            <DocSection id="introduction">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BookOpen size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Overview</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,40px)", letterSpacing: "-0.04em", color: "#0A2540", marginBottom: 16, lineHeight: 1.15 }}>
                How Creditlinker works
              </h1>
              <P>
                Creditlinker helps Nigerian businesses build a verified financial identity from their real banking activity — and use that identity to access the capital they deserve. This guide explains what that means for you, how your data is used, and what rights you have at every step.
              </P>
              <div className="docs-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: <BarChart3 size={16} />, title: "Your profile",        desc: "How your financial identity is built",  id: "what-is-profile"   },
                  { icon: <Database size={16} />,  title: "Your data",           desc: "What we collect and how",              id: "data-overview"     },
                  { icon: <Eye size={16} />,        title: "Lender access",      desc: "What lenders can and can't see",       id: "lender-view"       },
                  { icon: <Lock size={16} />,       title: "Your control",       desc: "Consent, permissions & revocation",    id: "consent-explained" },
                ].map((card) => (
                  <button
                    key={card.title}
                    onClick={() => scrollTo(card.id)}
                    style={{ display: "flex", gap: 12, padding: 16, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, textAlign: "left", cursor: "pointer", width: "100%" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{card.title}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Callout type="info">
                This documentation is for business owners and anyone curious about how Creditlinker works. If you're a developer integrating with our API, visit our <Link href="/developers" style={{ color: "#1E40AF", fontWeight: 600 }}>developer portal</Link>.
              </Callout>
            </DocSection>

            <DocSection id="who-is-it-for">
              <H2>Who is Creditlinker for?</H2>
              <P>
                Creditlinker is built for small and medium-sized businesses in Nigeria that struggle to access capital because they lack a formal credit history — not because their finances aren't healthy.
              </P>
              <P>
                Traditional lenders rely on credit bureau scores, which many businesses either don't have or haven't had enough time to build. Creditlinker fills that gap by creating a financial identity from the real evidence of how your business operates: your transactions, your cash flow, your payment patterns.
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {[
                  { who: "Business owners",      desc: "Connect your bank, build your financial identity, and get discovered by lenders who match your profile." },
                  { who: "Capital providers",     desc: "Access verified, consent-gated business profiles to make faster, fairer lending decisions." },
                  { who: "Platform partners",     desc: "Embed Creditlinker's financial identity layer into your own product to offer capital access to your users." },
                ].map((r) => (
                  <div key={r.who} style={{ display: "flex", gap: 14, padding: "14px 18px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00D4FF", flexShrink: 0, marginTop: 6 }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{r.who}</p>
                      <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.65 }}>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="how-it-works">
              <H2>How it works — the big picture</H2>
              <P>From connecting your bank to receiving a financing offer, here's the full journey.</P>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <StepCard number="1" title="Connect your financial data" desc="You link your bank account through our secure Mono Open Banking integration, or upload bank statements directly. Your raw transaction history is the foundation." />
                <StepCard number="2" title="We build your financial profile" desc="Our system analyzes your transactions — categorizing income, expenses, cash flow patterns, and payment behavior — and produces a verified financial identity." />
                <StepCard number="3" title="Lenders discover you (anonymously)" desc="Capital providers can see you exist and roughly match their criteria, but they can't see your details until you explicitly grant them access." />
                <StepCard number="4" title="You choose who sees what" desc="When a lender requests access, you review their request and decide whether to grant it — and for how long. You can revoke access at any time." />
                <StepCard number="5" title="Lenders evaluate and make offers" desc="Once you've granted access, the lender can review your profile and make a financing offer. You're never obligated to accept." />
              </div>
            </DocSection>

            {/* ═══════════════════════════════════════
                YOUR FINANCIAL PROFILE
            ═══════════════════════════════════════ */}
            <DocSection id="what-is-profile">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BarChart3 size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Your Financial Profile</span>
              </div>
              <H2>What is a financial profile?</H2>
              <P>
                Your financial profile is a structured, verified summary of your business's financial health — built entirely from your real banking activity. It is not a credit score in the traditional sense. It's a richer picture: six distinct dimensions of how your business manages money, how consistent your income is, and how disciplined your spending has been.
              </P>
              <P>
                Think of it as your business's financial CV. It exists in our system, belongs to you, and is shared with lenders only on your terms.
              </P>
              <Callout type="tip">
                Unlike a bureau credit score, your Creditlinker profile is built from your actual banking activity — not from loan repayment history or debt records. A business with no loans on record can still build a strong profile.
              </Callout>
            </DocSection>

            <DocSection id="six-dimensions">
              <H2>The 6 financial health dimensions</H2>
              <P>
                Your profile is scored across six independent dimensions. Each one is evaluated separately — no single number hides the full picture. Lenders can see all six and weight them based on what they care about.
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
                <DimensionCard name="Revenue Stability" color="#10B981" desc="How consistent and predictable your income is over time. A business with steady, growing revenue scores higher than one with erratic or declining inflows." />
                <DimensionCard name="Cashflow Predictability" color="#38BDF8" desc="How reliably your business generates positive cash flow. This looks at the timing between when money comes in and when it goes out." />
                <DimensionCard name="Expense Discipline" color="#818CF8" desc="How well your business controls its costs relative to revenue. Businesses that spend proportionally and avoid wasteful spending score higher." />
                <DimensionCard name="Liquidity Strength" color="#F59E0B" desc="The depth of your cash reserves. This looks at your average balance, your lowest recorded balance, and how much buffer you carry month to month." />
                <DimensionCard name="Financial Consistency" color="#00D4FF" desc="How regular and complete your financial activity and record-keeping is. Businesses with continuous, well-documented histories are rewarded here." />
                <DimensionCard name="Risk Profile" color="#F472B6" desc="Whether there are any unusual patterns in your transactions — like irregular counterparties, sudden behavioral shifts, or signs of financial distress." />
              </div>
              <P style={{ marginTop: 16 }}>Each dimension is scored from 0 to 100. A score of 80+ is considered strong. Lenders can see exactly where your strengths lie and which dimensions matter most for the type of financing you're seeking.</P>
            </DocSection>

            <DocSection id="profile-quality">
              <H2>Profile quality</H2>
              <P>
                Alongside your six dimension scores, every profile carries a <strong>data quality indicator</strong> — a signal to lenders about how much financial data underpins the profile. More data, from more accounts, over a longer period, means a higher quality score.
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Strong",   range: "85–100", desc: "Multiple linked accounts, 12+ months of transactions, high confidence",       color: "#10B981" },
                  { label: "Moderate", range: "60–84",  desc: "Single account or some gaps in coverage, still enough data to be meaningful",  color: "#F59E0B" },
                  { label: "Thin",     range: "0–59",   desc: "Limited history or sparse data — the profile exists, but lenders may be cautious", color: "#EF4444" },
                ].map((t) => (
                  <div key={t.label} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 18px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.color, background: `${t.color}15`, border: `1px solid ${t.color}30`, padding: "2px 10px", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>{t.label} · {t.range}</span>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.65 }}>{t.desc}</p>
                  </div>
                ))}
              </div>
              <Callout type="info">Your quality score does not lower your dimension scores — it is shown separately. A business can have strong dimensions with moderate data quality, and a lender can decide how much that matters to them.</Callout>
            </DocSection>

            <DocSection id="profile-updates">
              <H2>When does your profile update?</H2>
              <P>
                Your profile is not static. It rebuilds automatically whenever new financial data arrives — for example, when your bank account syncs or when you upload a new bank statement. You can also trigger a manual refresh from your dashboard at any time.
              </P>
              <UL items={[
                "Profile rebuilds automatically when new bank data is synced",
                "Each rebuild creates a versioned snapshot — your history is preserved",
                "Lenders who have active access are notified when your profile changes",
                "The timestamp of the most recent rebuild is always visible on your profile",
              ]} />
              <P>This means your profile gets stronger over time, simply by continuing to run your business normally.</P>
            </DocSection>

            {/* ═══════════════════════════════════════
                HOW WE COLLECT DATA
            ═══════════════════════════════════════ */}
            <DocSection id="data-overview">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Database size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>How We Collect Data</span>
              </div>
              <H2>What data we use</H2>
              <P>
                Everything in your financial profile comes from your bank transactions. We look at the flow of money in and out of your business accounts — not your personal life, not your social media, not your phone activity.
              </P>
              <P>Specifically, we analyze:</P>
              <UL items={[
                "Transaction dates, amounts, and directions (money in vs. money out)",
                "Transaction descriptions and counterparty names (who you pay and who pays you)",
                "Account balances over time",
                "Patterns in timing, regularity, and volume of transactions",
              ]} />
              <P>We do not use your personal credit score, your tax records, your social media, or any data outside of what you explicitly connect.</P>
            </DocSection>

            <DocSection id="bank-connection">
              <H2>Connecting your bank</H2>
              <P>
                The recommended way to share your financial data is through <strong>Mono Open Banking</strong> — a secure, bank-authorized connection. When you connect your bank through Creditlinker, you log in directly with your bank (we never see your banking credentials) and authorize us to read your transaction history.
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <StepCard number="1" title={`You click "Connect bank account"`} desc="This opens a secure Mono-powered window. Mono is a regulated open banking provider used by hundreds of Nigerian fintechs." />
                <StepCard number="2" title="You log in with your bank directly" desc="You enter your internet banking credentials into Mono's interface — not ours. Creditlinker never sees your username or password." />
                <StepCard number="3" title="Your transaction history is pulled" desc="Mono securely retrieves your transaction records and sends them to Creditlinker. Your profile is built from this data automatically." />
              </div>
              <Callout type="tip">Connecting via open banking gives you the highest quality profile. Your account syncs automatically, so your profile stays up to date without any manual effort.</Callout>
            </DocSection>

            <DocSection id="statements">
              <H2>Uploading bank statements</H2>
              <P>
                If your bank isn't supported by Mono, or you prefer not to use a live connection, you can upload your bank statements directly. We accept PDF statements from all major Nigerian banks, and CSV exports from internet banking portals.
              </P>
              <UL items={[
                "PDF statements are parsed automatically — no manual data entry required",
                "CSV files from any bank that allows transaction exports are supported",
                "Password-protected PDFs are accepted — you enter the password, we process it securely",
                "You can upload statements from multiple accounts to build a fuller picture",
              ]} />
              <Callout type="warning">Uploaded statements produce a slightly lower data quality indicator than a live bank connection, because the data is a point-in-time snapshot. Your profile won't update automatically — you'll need to upload new statements periodically.</Callout>
            </DocSection>

            <DocSection id="data-we-dont-use">
              <H2>What we don't collect</H2>
              <P>We believe in collecting the minimum necessary to do our job well. The following are explicitly out of scope:</P>
              <UL items={[
                "Your personal credit bureau score or any bureau records",
                "Your tax filings or FIRS records",
                "Your personal bank accounts (only business accounts)",
                "Your phone contacts, SMS messages, or app usage data",
                "Social media profiles or online presence",
                "Location data of any kind",
              ]} />
              <P>If something isn't listed above under what we <em>do</em> use, we don't use it.</P>
            </DocSection>

            {/* ═══════════════════════════════════════
                HOW LENDERS EVALUATE YOU
            ═══════════════════════════════════════ */}
            <DocSection id="lender-view">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Eye size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>How Lenders Evaluate You</span>
              </div>
              <H2>What lenders can see</H2>
              <P>
                Lenders on Creditlinker can only ever see what you've explicitly permitted them to see. There are three levels of access, and you control which level each lender receives:
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { level: "Score only",         color: "#10B981", desc: "The lender sees your six dimension scores and your overall profile rating. No transaction detail, no account balances — just the scores." },
                  { level: "Full profile",        color: "#818CF8", desc: "The lender sees your scores plus the derived financial metrics that support them: average revenue, cash reserve ratio, expense patterns, and more." },
                  { level: "Transaction detail",  color: "#EF4444", desc: "The lender can view the individual normalized transactions that make up your profile. This is the highest sensitivity level and is entirely optional." },
                ].map((a, i, arr) => (
                  <div key={a.level} style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: a.color, background: `${a.color}15`, border: `1px solid ${a.color}30`, padding: "3px 10px", borderRadius: 5, flexShrink: 0, marginTop: 2, whiteSpace: "nowrap" as const }}>{a.level}</span>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.7 }}>{a.desc}</p>
                  </div>
                ))}
              </div>
              <Callout type="tip">You can grant different lenders different levels of access. A lender you trust more can see more. A lender you're less sure about can start with scores only.</Callout>
            </DocSection>

            <DocSection id="discovery">
              <H2>How lenders find you</H2>
              <P>
                You are never visible to lenders by default. You have to opt in to discovery — a setting in your dashboard that signals you're open to financing. Once you opt in, lenders can see that a business matching your general profile exists, but they see no identifying information.
              </P>
              <P>
                The anonymized match includes things like: roughly what size your monthly revenue is, which financing categories your profile qualifies for, and your data quality tier. Nothing more.
              </P>
              <P>
                If a lender thinks you might be a good fit, they send you a formal access request. You review it — who they are, exactly what they're asking to see, and for how long — and then you decide.
              </P>
            </DocSection>

            <DocSection id="evaluation">
              <H2>The evaluation process</H2>
              <P>
                Once you grant a lender access, here's what they do with your profile:
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <StepCard number="1" title="Review your dimension scores" desc="They look at which of your six dimensions are strongest, and whether those align with the type of financing they offer." />
                <StepCard number="2" title="Check capital readiness" desc="Your profile automatically calculates how ready you are for 14 different financing categories — from working capital loans to invoice financing and revenue advances." />
                <StepCard number="3" title="Assess risk signals" desc="If any unusual patterns were flagged during your profile build, the lender can see those flags. You can see them too, so there are no surprises." />
                <StepCard number="4" title="Make an offer (or not)" desc="Based on what they see, the lender decides whether to make an offer, what terms they'd propose, and when. You're never obligated to accept." />
              </div>
              <Callout type="info">Your access log (visible in your dashboard) records every action a lender takes against your profile — what they viewed and when. You always know exactly how your data was used.</Callout>
            </DocSection>

            {/* ═══════════════════════════════════════
                CONSENT & CONTROL
            ═══════════════════════════════════════ */}
            <DocSection id="consent-explained">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Lock size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Your Consent &amp; Control</span>
              </div>
              <H2>How consent works</H2>
              <P>
                Consent is the mechanism through which any lender gains access to your profile data. Without an active consent grant from you, no lender can see anything beyond an anonymized match signal. This is non-negotiable — it's how the system is built.
              </P>
              <P>
                Every consent grant has three properties you control:
              </P>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Who",       desc: "You see the lender's name, registration, and track record before deciding. You can always look them up and ask questions before granting access." },
                  { label: "What",      desc: "You choose which permission level to grant — scores only, full profile, or including transaction detail. You can always start conservative." },
                  { label: "How long",  desc: "Every consent has an expiry date. A lender can't hold access indefinitely. Typical grants are 30–90 days, after which access expires automatically." },
                ].map((c) => (
                  <div key={c.label} style={{ display: "flex", gap: 14, padding: "14px 18px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#0A2540", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 10px", borderRadius: 5, flexShrink: 0, height: "fit-content", marginTop: 2 }}>{c.label}</span>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.7 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="granting-access">
              <H2>Granting access</H2>
              <P>When a lender sends you a request, you'll receive a notification in your dashboard. The request shows you:</P>
              <UL items={[
                "The lender's full name and a brief description of who they are",
                "Exactly what permission level they're requesting (score, profile, or transactions)",
                "How long they're asking for access",
                "Any specific note they've added explaining what they'll use it for",
              ]} />
              <P>
                You can approve the request as-is, approve it with a shorter duration, or decline entirely — no reason needed. A declined request is final; the lender cannot reapply for the same profile automatically.
              </P>
            </DocSection>

            <DocSection id="revoking-access">
              <H2>Revoking access</H2>
              <P>
                You can revoke any active consent grant at any time from your dashboard. Revocation is immediate and absolute — the lender loses access the moment you click confirm. They are notified that access has been revoked, but they are not told why.
              </P>
              <P>
                Any data they downloaded or viewed before revocation remains subject to the terms they agreed to when requesting access. Revocation prevents any future access, not past views.
              </P>
              <Callout type="warning">Revoking access ends the evaluation process. If a lender was in the middle of reviewing your profile for an offer, revoking access will interrupt that process. Only revoke if you no longer want the lender to proceed.</Callout>
            </DocSection>

            <DocSection id="what-lenders-see">
              <H2>Permission levels in plain language</H2>
              <P>Here's what each permission level actually means for what a lender can do:</P>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
                {[
                  {
                    level: "Scores only",
                    suitable: "Initial discovery, quick pre-screening",
                    color: "#10B981",
                    bullets: [
                      "Can see your six dimension scores (each out of 100)",
                      "Can see your profile quality indicator",
                      "Cannot see any underlying metrics or transactions",
                      "Cannot see your business name or identifying details",
                    ],
                  },
                  {
                    level: "Full profile",
                    suitable: "Serious evaluation, offer preparation",
                    color: "#818CF8",
                    bullets: [
                      "Everything in scores only, plus:",
                      "Can see derived financial metrics (average revenue, expense ratios, liquidity metrics)",
                      "Can see your capital readiness assessments by financing type",
                      "Can see any active risk flags",
                      "Still cannot see individual transactions",
                    ],
                  },
                  {
                    level: "Transaction detail",
                    suitable: "Deep due diligence, only when you're comfortable",
                    color: "#EF4444",
                    bullets: [
                      "Everything in full profile, plus:",
                      "Can view individual normalized transactions",
                      "Transaction descriptions and counterparty names are visible",
                      "This is the highest sensitivity level — grant it selectively",
                    ],
                  },
                ].map((p) => (
                  <div key={p.level} style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{p.level}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>· {p.suitable}</span>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      <UL items={p.bullets} />
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="access-history">
              <H2>Viewing your access history</H2>
              <P>
                Your dashboard shows a complete log of every time a lender accessed your profile — what they viewed and when. This log is immutable: it cannot be edited or deleted, by you or by anyone else.
              </P>
              <UL items={[
                "See every lender who has ever had or currently has access to your profile",
                "See exactly what actions they took (viewed scores, viewed profile, viewed transactions)",
                "See precise timestamps for each access event",
                "Download your full access history at any time",
              ]} />
              <P>If you ever see access you don't recognize or didn't authorize, contact us immediately at <a href="mailto:support@creditlinker.io" style={{ color: "#0A2540", fontWeight: 600 }}>support@creditlinker.io</a>.</P>
            </DocSection>

            {/* ═══════════════════════════════════════
                SECURITY & PRIVACY
            ═══════════════════════════════════════ */}
            <DocSection id="security">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <ShieldCheck size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Security &amp; Privacy</span>
              </div>
              <H2>How we protect your data</H2>
              <P>
                Your financial data is among the most sensitive information that exists. We treat it accordingly.
              </P>
              <UL items={[
                "All data is encrypted in transit using TLS 1.3 — the same standard used by major banks",
                "All stored data is encrypted at rest using AES-256 encryption",
                "Sensitive fields like account numbers and business owner names are encrypted separately at the field level",
                "Your bank account number is never shown in full — it's always masked (e.g. ****1234)",
                "Our infrastructure is hosted on ISO 27001-certified cloud infrastructure",
                "Access to your data by Creditlinker staff requires multi-factor authentication and is fully logged",
              ]} />
              <H3>We never sell your data</H3>
              <P>
                Creditlinker does not sell, rent, or trade your financial data to any third party for any purpose. The only parties who ever see your data are lenders you have explicitly consented to, and Creditlinker's own systems in the process of building your profile.
              </P>
              <Callout type="tip">To report a security concern, email us at <a href="mailto:security@creditlinker.io" style={{ color: "#065F46", fontWeight: 600 }}>security@creditlinker.io</a>. We respond to all reports within 24 hours.</Callout>
            </DocSection>

            <DocSection id="privacy">
              <H2>Your privacy rights</H2>
              <P>As a Creditlinker user, you have the following rights over your data at all times:</P>
              <UL items={[
                "Right to access: you can request a full export of all data we hold about you",
                "Right to correction: if any information in your profile is incorrect, you can flag it for review",
                "Right to deletion: you can request that your account and all associated data be permanently deleted",
                "Right to portability: your financial data export is yours — you can take it anywhere",
                "Right to revoke consent: you can withdraw any lender's access at any time, instantly",
              ]} />
              <P>To exercise any of these rights, visit the Privacy section of your dashboard or contact <a href="mailto:privacy@creditlinker.io" style={{ color: "#0A2540", fontWeight: 600 }}>privacy@creditlinker.io</a>.</P>
            </DocSection>

            <DocSection id="data-retention">
              <H2>Data retention</H2>
              <P>
                We keep your financial data for as long as your account is active. If you close your account, we delete all your financial data within 30 days. Access logs are retained for 7 years to meet regulatory obligations, but are not shared with any third party after your account is closed.
              </P>
              <P>
                If you disconnect a bank account or delete a statement, that data is removed from your active profile on the next rebuild. Historical snapshots that were built with that data are archived but remain accessible to lenders who had active consent at the time they were created.
              </P>
            </DocSection>

            {/* ═══════════════════════════════════════
                COMMON QUESTIONS
            ═══════════════════════════════════════ */}
            <DocSection id="faq-profile">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <HelpCircle size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Common Questions</span>
              </div>
              <H2>About your profile</H2>
              <QA
                q="How long does it take to build my profile?"
                a="Once you connect your bank account, your initial profile is typically ready within a few minutes. If you're uploading statements, it may take up to 30 minutes depending on the volume of transactions."
              />
              <QA
                q="What if my business is seasonal — will that hurt my score?"
                a="No. Our system is designed to understand seasonal businesses. Revenue stability is measured against your own historical patterns, not against an arbitrary benchmark. A business that consistently earns more in Q4 will have that pattern recognized and accounted for."
              />
              <QA
                q="Can I see my own profile before sharing it with anyone?"
                a="Yes. Your full financial profile is always visible in your dashboard. You can review every dimension score, every derived metric, and any risk flags before you decide to grant any lender access."
              />
              <QA
                q="What if I think something in my profile is wrong?"
                a={<>Contact us at <a href="mailto:support@creditlinker.io" style={{ color: "#0A2540", fontWeight: 600 }}>support@creditlinker.io</a> and describe what you believe is incorrect. We'll review the underlying transactions and correct any processing errors. In most cases, uploading additional or more recent bank statements will also naturally improve or correct a profile.</>}
              />
              <QA
                q="Does my profile affect a bureau credit score?"
                a="No. Creditlinker is separate from the credit bureau system. Your Creditlinker profile does not appear on or affect any credit bureau report."
              />
            </DocSection>

            <DocSection id="faq-lenders">
              <H2>About lenders</H2>
              <QA
                q="Who are the lenders on Creditlinker?"
                a="Lenders on Creditlinker are licensed capital providers — banks, microfinance institutions, fintech lenders, and other regulated financial institutions that have been verified and onboarded onto our platform. You can see a lender's profile before granting them access."
              />
              <QA
                q="Can a lender contact me without my consent?"
                a="No. A lender can send you a formal access request through the platform, but they cannot contact you directly, see your name, or reach out through any channel until you grant them access and choose to engage."
              />
              <QA
                q="Do I have to accept any offer a lender makes?"
                a="Absolutely not. Receiving an offer means a lender thinks your profile qualifies — but accepting or rejecting it is entirely your decision. You can decline without explanation, and declining has no impact on your profile or future eligibility."
              />
              <QA
                q="Can multiple lenders see my profile at the same time?"
                a="Yes. You can grant access to as many lenders as you like simultaneously. Each consent is independent — granting access to one lender doesn't affect your relationship with any other."
              />
            </DocSection>

            <DocSection id="faq-data">
              <H2>About your data</H2>
              <QA
                q="Is connecting my bank safe? Can Creditlinker move money?"
                a="Yes, connecting your bank is safe. The integration is read-only — we can only view your transaction history. We have no ability to initiate transfers, move money, or make any changes to your bank account. The connection is powered by Mono, a licensed open banking provider."
              />
              <QA
                q="What happens if I disconnect my bank account?"
                a="If you disconnect your bank, we stop pulling new data. Your existing profile remains in place until you rebuild it with new data. You can reconnect at any time or switch to uploading statements."
              />
              <QA
                q="Can Creditlinker share my data with anyone without my knowledge?"
                a="No. We do not share your financial data with any third party without your explicit consent. The only exception is if we are legally compelled to do so by a court order, in which case we will notify you to the extent permitted by law."
              />
              <QA
                q="How do I delete my account?"
                a={<>You can request account deletion from the Settings section of your dashboard. Alternatively, email <a href="mailto:privacy@creditlinker.io" style={{ color: "#0A2540", fontWeight: 600 }}>privacy@creditlinker.io</a>. Your account and all associated financial data will be permanently deleted within 30 days.</>}
              />
            </DocSection>

          </div>

          {/* RIGHT TOC */}
          <div className="docs-toc" style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", padding: "40px 0 40px 24px", borderLeft: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12 }}>On this page</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { id: "introduction",      label: "How it works"           },
                { id: "who-is-it-for",     label: "Who is it for?"         },
                { id: "how-it-works",      label: "The journey"            },
                { id: "what-is-profile",   label: "Your profile"           },
                { id: "six-dimensions",    label: "6 dimensions"           },
                { id: "profile-quality",   label: "Profile quality"        },
                { id: "data-overview",     label: "What data we use"       },
                { id: "bank-connection",   label: "Connecting your bank"   },
                { id: "statements",        label: "Uploading statements"   },
                { id: "lender-view",       label: "What lenders see"       },
                { id: "discovery",         label: "How lenders find you"   },
                { id: "consent-explained", label: "How consent works"      },
                { id: "what-lenders-see",  label: "Permission levels"      },
                { id: "access-history",    label: "Access history"         },
                { id: "security",          label: "Protecting your data"   },
                { id: "privacy",           label: "Your rights"            },
                { id: "faq-profile",       label: "Profile questions"      },
                { id: "faq-lenders",       label: "Lender questions"       },
                { id: "faq-data",          label: "Data questions"         },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{ textAlign: "left", padding: "4px 8px", borderRadius: 5, fontSize: 12, fontWeight: activeId === item.id ? 600 : 400, color: activeId === item.id ? "#0A2540" : "#9CA3AF", background: activeId === item.id ? "rgba(0,212,255,0.06)" : "transparent", border: "none", cursor: "pointer", transition: "color 0.1s" }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
