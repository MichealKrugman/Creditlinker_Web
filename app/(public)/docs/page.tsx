"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen, Zap, Key, Code2, Webhook, Database, ShieldCheck, Package,
  ArrowRight, ChevronRight, CheckCircle2, Copy, Check, ExternalLink,
  Layers, Lock, RefreshCw, AlertCircle, FileText, BarChart3, Globe2,
  Terminal, ArrowUpRight, Search, Menu, X,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */

function GridBg({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(10,37,64,0.03)" : "rgba(255,255,255,0.025)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

function InlineBadge({ children, color = "#00D4FF" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color, background: `${color}15`, border: `1px solid ${color}30`, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace", whiteSpace: "nowrap" as const }}>
      {children}
    </span>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" }) {
  const colors: Record<string, { bg: string; color: string }> = {
    GET:    { bg: "rgba(56,189,248,0.12)",  color: "#38BDF8" },
    POST:   { bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
    PATCH:  { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    PUT:    { bg: "rgba(129,140,248,0.12)", color: "#818CF8" },
    DELETE: { bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  };
  const m = colors[method];
  return (
    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: m.color, background: m.bg, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace", flexShrink: 0 }}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: copied ? "#10B981" : "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "color 0.15s" }}
      aria-label="Copy code"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ title, lang, code, dark = true }: { title?: string; lang: string; code: string; dark?: boolean }) {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, background: dark ? "#0d1117" : "#F9FAFB", marginBottom: 20 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", background: dark ? "rgba(255,255,255,0.04)" : "white", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", fontFamily: "monospace" }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: dark ? "rgba(0,212,255,0.6)" : "#0A5060", background: dark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.06)", border: `1px solid ${dark ? "rgba(0,212,255,0.15)" : "rgba(0,212,255,0.18)"}`, padding: "1px 7px", borderRadius: 4 }}>{lang}</span>
            <CopyButton text={code} />
          </div>
        </div>
      )}
      <pre style={{ margin: 0, padding: "18px 20px", overflowX: "auto", fontSize: 13, lineHeight: 1.72, color: dark ? "#e6edf3" : "#0A2540", fontFamily: "'Fira Code','Cascadia Code','JetBrains Mono',Menlo,monospace" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: 20, gap: 0 }}>
        {tabs.map((t, i) => (
          <button key={t.label} onClick={() => setActive(i)} style={{ padding: "9px 16px", fontSize: 13, fontWeight: 600, color: active === i ? "#0A2540" : "#9CA3AF", background: "none", border: "none", borderBottom: active === i ? "2px solid #0A2540" : "2px solid transparent", marginBottom: -1, cursor: "pointer", transition: "color 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active].content}
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "tip" | "danger"; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF", icon: <AlertCircle size={14} /> },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", icon: <AlertCircle size={14} /> },
    tip:     { bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", icon: <CheckCircle2 size={14} /> },
    danger:  { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B", icon: <AlertCircle size={14} /> },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 20 }}>
      <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ fontSize: 13, color: s.color, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function EndpointRow({ method, path, desc, auth, badge }: { method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; path: string; desc: string; auth: string; badge?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: "1px solid #F3F4F6" }}>
      <MethodBadge method={method} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          <code style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", fontFamily: "monospace" }}>{path}</code>
          {badge && <InlineBadge color="#818CF8">{badge}</InlineBadge>}
        </div>
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 5, flexShrink: 0, fontFamily: "monospace", whiteSpace: "nowrap" as const }}>{auth}</span>
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
          <ChevronRight size={14} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 3 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

const NAV = [
  {
    group: "Getting Started",
    icon: <Zap size={13} />,
    items: [
      { id: "introduction",    label: "Introduction"           },
      { id: "quickstart",      label: "Quickstart"             },
      { id: "authentication",  label: "Authentication"         },
      { id: "base-url",        label: "Base URL & Versioning"  },
      { id: "errors",          label: "Errors & Status Codes"  },
    ],
  },
  {
    group: "Core Concepts",
    icon: <Layers size={13} />,
    items: [
      { id: "financial-identity",  label: "Financial Identity"       },
      { id: "dimensions",          label: "6 Financial Dimensions"   },
      { id: "pipeline",            label: "Data Pipeline"            },
      { id: "feature-store",       label: "Feature Store"            },
      { id: "data-quality",        label: "Data Quality Score"       },
      { id: "provenance",          label: "Data Provenance"          },
    ],
  },
  {
    group: "Data Sources",
    icon: <Database size={13} />,
    items: [
      { id: "mono-openbanking",  label: "Mono Open Banking"      },
      { id: "csv-upload",        label: "CSV Import"             },
      { id: "pdf-upload",        label: "PDF Bank Statements"    },
      { id: "manual-entry",      label: "Manual Entry"           },
    ],
  },
  {
    group: "Consent & Access",
    icon: <Lock size={13} />,
    items: [
      { id: "consent-model",     label: "Consent Model"          },
      { id: "granting-consent",  label: "Granting Consent"       },
      { id: "revoking-consent",  label: "Revoking Consent"       },
      { id: "permissions",       label: "Permission Scopes"      },
      { id: "access-logs",       label: "Access Logs"            },
    ],
  },
  {
    group: "API Reference",
    icon: <Code2 size={13} />,
    items: [
      { id: "api-business",      label: "Business API"           },
      { id: "api-institution",   label: "Institution API"        },
      { id: "api-partner",       label: "Partner API"            },
      { id: "api-admin",         label: "Admin API"              },
    ],
  },
  {
    group: "Webhooks",
    icon: <Webhook size={13} />,
    items: [
      { id: "webhook-overview",  label: "Overview"               },
      { id: "webhook-events",    label: "Event Reference"        },
      { id: "webhook-security",  label: "Signature Verification" },
      { id: "webhook-retries",   label: "Retries & Delivery"     },
    ],
  },
  {
    group: "SDK",
    icon: <Package size={13} />,
    items: [
      { id: "sdk-install",       label: "Installation"           },
      { id: "sdk-typescript",    label: "TypeScript SDK"         },
      { id: "sdk-examples",      label: "Examples"               },
    ],
  },
  {
    group: "Security",
    icon: <ShieldCheck size={13} />,
    items: [
      { id: "security-overview", label: "Overview"               },
      { id: "api-keys",          label: "API Key Management"     },
      { id: "rate-limits",       label: "Rate Limits"            },
      { id: "data-encryption",   label: "Data Encryption"        },
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
        @media (max-width: 1024px) {
          .docs-layout { grid-template-columns: 1fr !important; }
          .docs-sidebar { display: none !important; }
          .docs-toc     { display: none !important; }
        }
      `}</style>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E5E7EB", height: 56 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", textDecoration: "none", letterSpacing: "-0.03em" }}>
              Creditlinker
            </Link>
            <span style={{ color: "#E5E7EB" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>Documentation</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#0A5060", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 8px", borderRadius: 9999 }}>
              v1.0
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/developers/api-reference" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#6B7280", textDecoration: "none" }}>
              API Reference <ExternalLink size={11} />
            </Link>
            <Link href="/developers/api-keys" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0A2540", color: "white", padding: "6px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12 }}>
              Get API key
            </Link>
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px" }}>
        <div className="docs-layout" style={{ display: "grid", gridTemplateColumns: "240px 1fr 200px", gap: 0, alignItems: "start" }}>

          {/* LEFT SIDEBAR */}
          <div className="docs-sidebar" style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", padding: "28px 20px 28px 0", borderRight: "1px solid #F3F4F6" }}>
            <Sidebar />
          </div>

          {/* MAIN CONTENT */}
          <div ref={contentRef} style={{ padding: "40px 48px 120px", minWidth: 0 }}>

            <DocSection id="introduction">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BookOpen size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Getting Started</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,3.5vw,42px)", letterSpacing: "-0.04em", color: "#0A2540", marginBottom: 16, lineHeight: 1.1 }}>
                Creditlinker Documentation
              </h1>
              <P>
                Creditlinker is financial identity infrastructure for businesses. This documentation covers everything you need to integrate with the Creditlinker API — from linking bank accounts and running the data pipeline to querying financial identities and building capital-access products on top of the platform.
              </P>
              <P>
                The platform is built around four core actors: <strong>Businesses</strong> that build financial identities, <strong>Capital providers (Institutions)</strong> that evaluate and fund them, <strong>Partners</strong> that integrate the identity layer into their own products, and <strong>Admins</strong> that operate the platform.
              </P>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: <Zap size={16} />,    title: "Quickstart",       desc: "Be up and running in 5 minutes",   id: "quickstart"       },
                  { icon: <Code2 size={16} />,   title: "API Reference",    desc: "Full endpoint documentation",      id: "api-business"     },
                  { icon: <Webhook size={16} />, title: "Webhooks",         desc: "Real-time identity change events", id: "webhook-overview" },
                  { icon: <Package size={16} />, title: "TypeScript SDK",   desc: "Install and use the official SDK", id: "sdk-install"      },
                ].map((card) => (
                  <button
                    key={card.title}
                    onClick={() => scrollTo(card.id)}
                    style={{ display: "flex", gap: 12, padding: 16, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, textAlign: "left", cursor: "pointer" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{card.title}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </DocSection>

            <DocSection id="quickstart">
              <H2>Quickstart</H2>
              <P>Get a financial identity query running in under 5 minutes using the TypeScript SDK.</P>
              <H3>1. Install the SDK</H3>
              <CodeBlock title="Terminal" lang="bash" code={`npm install @creditlinker/sdk`} />
              <H3>2. Initialize the client</H3>
              <CodeBlock title="client.ts" lang="TypeScript" code={`import { Creditlinker } from '@creditlinker/sdk'

const cl = new Creditlinker({
  apiKey: process.env.CREDITLINKER_API_KEY,
  environment: 'sandbox', // or 'production'
})`} />
              <H3>3. Fetch a financial identity</H3>
              <DocTabs tabs={[
                {
                  label: "TypeScript SDK",
                  content: <CodeBlock lang="TypeScript" code={`// Requires an active consent grant for this business token
const identity = await cl.partner.getProfile(businessToken)

console.log(identity.score)         // 742
console.log(identity.dimensions)    // { revenueStability: 85, ... }
console.log(identity.dataQuality)   // 94
console.log(identity.riskProfile)   // "low"`} />
                },
                {
                  label: "cURL",
                  content: <CodeBlock lang="bash" code={`curl https://api.creditlinker.io/v1/partner/profile/{business_token} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`} />
                },
                {
                  label: "Response",
                  content: <CodeBlock lang="JSON" code={`{
  "score": 742,
  "riskProfile": "low",
  "dataQualityScore": 94,
  "dataCoverageMonths": 18,
  "dimensions": {
    "revenueStability": 85,
    "cashflowPredictability": 78,
    "expenseDiscipline": 81,
    "liquidityStrength": 74,
    "financialConsistency": 88,
    "riskProfile": 91
  }
}`} />
                },
              ]} />
              <Callout type="tip">Use the sandbox environment with pre-seeded business tokens during development. Production keys require a verified institution account.</Callout>
            </DocSection>

            <DocSection id="authentication">
              <H2>Authentication</H2>
              <P>All API requests are authenticated using Bearer JWTs issued by Keycloak. Tokens are scoped to a specific role (<code>business_owner</code>, <code>institution</code>, <code>partner</code>, or <code>platform_admin</code>) and expire after 1 hour.</P>
              <H3>Obtaining a token</H3>
              <CodeBlock title="Token request" lang="bash" code={`curl -X POST https://auth.creditlinker.io/realms/creditlinker/protocol/openid-connect/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`} />
              <H3>Using the token</H3>
              <CodeBlock lang="bash" code={`curl https://api.creditlinker.io/v1/business/score \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`} />
              <Callout type="warning">Never expose API keys or client secrets in client-side code or public repositories. Use environment variables and server-side token exchange.</Callout>
              <H3>Token roles</H3>
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { role: "business_owner", desc: "Access to business-facing endpoints — score, consent, financing, data sources", color: "#10B981" },
                  { role: "institution",    desc: "Access to institution endpoints — discovery, consent-gated profiles, offers",     color: "#38BDF8" },
                  { role: "partner",        desc: "Access to partner endpoints — profile queries and data submission",               color: "#818CF8" },
                  { role: "platform_admin", desc: "Access to admin endpoints — observability, audit logs, system management",       color: "#F59E0B" },
                ].map((r, i, arr) => (
                  <div key={r.role} style={{ display: "flex", gap: 14, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #E5E7EB" : "none", alignItems: "flex-start" }}>
                    <InlineBadge color={r.color}>{r.role}</InlineBadge>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="base-url">
              <H2>Base URL &amp; Versioning</H2>
              <P>All API requests use versioned base URLs. The current stable version is <code>v1</code>.</P>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Production", url: "https://api.creditlinker.io/v1",    color: "#10B981" },
                  { label: "Sandbox",    url: "https://sandbox.creditlinker.io/v1", color: "#818CF8" },
                ].map((e) => (
                  <div key={e.label} style={{ background: "#0d1117", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, display: "inline-block" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{e.label}</span>
                    </div>
                    <code style={{ fontSize: 13, color: "#00D4FF", fontFamily: "monospace" }}>{e.url}</code>
                  </div>
                ))}
              </div>
              <P>Breaking changes are never introduced in a versioned release. They are announced and released under a new version number with a 6-month deprecation window.</P>
            </DocSection>

            <DocSection id="errors">
              <H2>Errors &amp; Status Codes</H2>
              <P>The API uses standard HTTP status codes. Error responses include a machine-readable <code>code</code> and a human-readable <code>message</code>.</P>
              <CodeBlock lang="JSON" code={`{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "No active consent grant found for this business token.",
    "status": 403,
    "docs": "https://docs.creditlinker.io/consent-model"
  }
}`} />
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { code: "200", label: "OK",                    desc: "Request succeeded"                                        },
                  { code: "201", label: "Created",               desc: "Resource created successfully"                           },
                  { code: "400", label: "Bad Request",           desc: "Invalid parameters or malformed request body"            },
                  { code: "401", label: "Unauthorized",          desc: "Missing or expired authentication token"                 },
                  { code: "403", label: "Forbidden",             desc: "Authenticated but insufficient permissions or no consent" },
                  { code: "404", label: "Not Found",             desc: "Resource not found"                                      },
                  { code: "409", label: "Conflict",              desc: "Resource already exists or state conflict"               },
                  { code: "429", label: "Too Many Requests",     desc: "Rate limit exceeded — check Retry-After header"          },
                  { code: "500", label: "Internal Server Error", desc: "Platform error — retry with exponential backoff"         },
                ].map((s, i, arr) => (
                  <div key={s.code} style={{ display: "grid", gridTemplateColumns: "56px 140px 1fr", gap: 12, padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <code style={{ fontSize: 12, fontWeight: 700, color: parseInt(s.code) >= 400 ? "#EF4444" : "#10B981", fontFamily: "monospace" }}>{s.code}</code>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="financial-identity">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Layers size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Core Concepts</span>
              </div>
              <H2>Financial Identity</H2>
              <P>A financial identity is the core output of the Creditlinker platform. It is a persistent, versioned profile built from a business's real financial data — bank transactions, accounting records, and operational signals — processed through a seven-stage pipeline.</P>
              <P>Unlike a traditional credit score, a financial identity is multidimensional. It captures the full financial shape of a business across six independent dimensions, plus a data quality score, a set of derived feature store metrics, capital readiness assessments, and risk flags.</P>
              <H3>Identity fields</H3>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { field: "financial_identity_id",  type: "string",    desc: "Stable UUID anchoring the identity — persists across pipeline runs"          },
                  { field: "persistent_business_id", type: "string",    desc: "Permanent business identifier — survives ownership and registration changes" },
                  { field: "score",                  type: "object",    desc: "Six-dimensional score with individual dimension values (0–100 each)"          },
                  { field: "data_quality_score",     type: "number",    desc: "Reliability of the underlying financial data (0–100)"                       },
                  { field: "data_months_analyzed",   type: "number",    desc: "Number of months of financial data included in the current pipeline run"     },
                  { field: "readiness_assessments",  type: "object",    desc: "Capital readiness scores across all 14 financing categories"                 },
                  { field: "risk_flags",             type: "array",     desc: "Active risk signals detected during pipeline processing"                     },
                  { field: "pipeline_run_id",        type: "string",    desc: "ID of the pipeline run that produced this identity snapshot"                 },
                  { field: "taken_at",               type: "timestamp", desc: "ISO 8601 timestamp of when this identity snapshot was created"               },
                ].map((f, i, arr) => (
                  <div key={f.field} style={{ display: "grid", gridTemplateColumns: "200px 80px 1fr", gap: 12, padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "baseline", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <code style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", fontFamily: "monospace" }}>{f.field}</code>
                    <InlineBadge color="#818CF8">{f.type}</InlineBadge>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{f.desc}</span>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="dimensions">
              <H2>6 Financial Dimensions</H2>
              <P>Creditlinker scores each business across six independent financial health dimensions. Each dimension is scored 0–100. No single composite score is computed — capital providers evaluate the full shape.</P>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[
                  { name: "Revenue Stability",       key: "revenueStability",       color: "#10B981", desc: "How consistent and predictable revenue inflows are over time. Measures volatility, seasonal patterns, and growth trajectory of credits." },
                  { name: "Cashflow Predictability", key: "cashflowPredictability", color: "#38BDF8", desc: "How reliably the business generates positive operating cashflow. Examines the timing relationship between inflows and outflows." },
                  { name: "Expense Discipline",      key: "expenseDiscipline",      color: "#818CF8", desc: "How well the business controls operating costs relative to revenue. Tracks operating expense ratios, cost patterns, and discretionary spending behavior." },
                  { name: "Liquidity Strength",      key: "liquidityStrength",      color: "#F59E0B", desc: "The level of cash reserves and financial buffers available. Measures average balance, trough balances, and cash reserve ratio." },
                  { name: "Financial Consistency",   key: "financialConsistency",   color: "#00D4FF", desc: "How complete and regular the business's financial activity and reporting patterns are. Rewards continuous, well-documented transaction history." },
                  { name: "Risk Profile",            key: "riskProfile",            color: "#F472B6", desc: "Detects anomalies, irregular behavior, and risk signals across all financial activity. Includes counterparty clustering and fraud pattern detection." },
                ].map((d) => (
                  <div key={d.name} style={{ display: "flex", gap: 14, padding: "16px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${d.color}15`, border: `1px solid ${d.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "block" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", margin: 0 }}>{d.name}</p>
                        <code style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>score.dimensions.{d.key}</code>
                      </div>
                      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="pipeline">
              <H2>Data Pipeline</H2>
              <P>Every financial identity is produced by a deterministic seven-stage pipeline. The pipeline runs automatically when new financial data is ingested, and again when triggered manually via <code>POST /business/pipeline/run</code>.</P>
              <div style={{ background: "#0A2540", borderRadius: 14, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
                <GridBg />
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { n: "01", label: "Data Ingestion",        event: "DATA_INGESTED",             desc: "Raw transactions received from Mono, CSV, PDF, or partner submission"             },
                    { n: "02", label: "Normalization",         event: "TRANSACTION_NORMALIZED",    desc: "Categorized, de-duplicated, internal transfers flagged, recurring patterns tagged" },
                    { n: "03", label: "Ledger Reconciliation", event: "LEDGER_RECONCILED",         desc: "Inflows and outflows reconciled against closing balances"                          },
                    { n: "04", label: "Feature Generation",    event: "FEATURES_GENERATED",        desc: "40+ derived metrics computed and written to the feature store"                     },
                    { n: "05", label: "Dimensional Scoring",   event: "SCORE_RECALCULATED",        desc: "Six dimensions scored independently from feature store data"                       },
                    { n: "06", label: "Risk Detection",        event: "RISK_FLAGS_EVALUATED",      desc: "Anomaly detection, fraud patterns, and behavioral risk flags applied"              },
                    { n: "07", label: "Identity Snapshot",     event: "FINANCIAL_PROFILE_UPDATED", desc: "Versioned snapshot written and business notified via webhook"                      },
                  ].map((step, i) => (
                    <div key={step.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00D4FF", fontFamily: "monospace" }}>{step.n}</div>
                        {i < 6 && <div style={{ width: 1, height: 20, background: "rgba(0,212,255,0.15)", margin: "3px 0" }} />}
                      </div>
                      <div style={{ paddingBottom: i < 6 ? 6 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{step.label}</span>
                          <code style={{ fontSize: 10, color: "rgba(0,212,255,0.6)", fontFamily: "monospace" }}>{step.event}</code>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DocSection>

            <DocSection id="feature-store">
              <H2>Feature Store</H2>
              <P>The feature store holds 40+ derived financial metrics computed from normalized transaction data. Scoring models and capital readiness assessments pull from this store rather than recomputing from raw data on each query.</P>
              <H3>Available metrics</H3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {[
                  "monthlyRevenueAvg", "revenueGrowth6mo", "revenueVolatility", "revenueConcentration",
                  "operatingMargin", "expenseRatio", "payrollRatio", "discretionarySpendRatio",
                  "cashReserveRatio", "avgClosingBalance", "troughBalance", "liquidityCoverageRatio",
                  "receivableTurnoverDays", "payableTurnoverDays", "workingCapitalRatio",
                  "counterpartyCount", "topCounterpartyConcentration", "recurringExpenseRatio",
                  "paymentRegularityScore", "internalTransferRatio",
                ].map((m) => (
                  <code key={m} style={{ fontSize: 12, color: "#0A5060", background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", padding: "5px 10px", borderRadius: 6, fontFamily: "monospace" }}>{m}</code>
                ))}
              </div>
              <Callout type="info">The full feature store schema is available in the API reference under <code>GET /business/score</code>. Feature values are updated on every pipeline run.</Callout>
            </DocSection>

            <DocSection id="data-quality">
              <H2>Data Quality Score</H2>
              <P>Every financial identity carries a <code>data_quality_score</code> (0–100) that reflects how reliable the underlying financial data is. Capital providers can use this to calibrate their confidence in the identity dimensions.</P>
              <UL items={[
                "High (85-100): Multiple linked accounts, 12+ months of continuous data, high normalization confidence",
                "Medium (60-84): Single account or gaps in data coverage, some unresolvable transactions",
                "Low (0-59): Sparse data, short history, or low normalization confidence across most transactions",
              ]} />
              <P>The data quality score does not modify the dimensional scores — it is reported separately so providers can apply their own tolerance thresholds.</P>
            </DocSection>

            <DocSection id="provenance">
              <H2>Data Provenance</H2>
              <P>Every metric in the Creditlinker feature store and every dimension score carries provenance metadata — a record of which data sources, accounts, and transactions contributed to that value.</P>
              <CodeBlock lang="JSON" code={`// GET /institution/profile/:financial_identity_id/provenance
{
  "metrics": {
    "monthlyRevenueAvg": {
      "value": 4200000,
      "source": "bank_transactions",
      "accounts": ["account_abc123", "account_def456"],
      "transactionCount": 847,
      "periodFrom": "2024-09-01",
      "periodTo": "2026-03-01",
      "confidenceScore": 0.96
    }
  }
}`} />
            </DocSection>

            <DocSection id="mono-openbanking">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Database size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Data Sources</span>
              </div>
              <H2>Mono Open Banking</H2>
              <P>The recommended primary data source. Mono Open Banking provides real-time, bank-verified transaction histories for Nigerian financial institutions. The Creditlinker SDK wraps the Mono Link flow into a single initiation call.</P>
              <H3>Linking a bank account</H3>
              <CodeBlock title="link-bank.ts" lang="TypeScript" code={`// Step 1: Initiate the Mono Link flow
const { monoLinkUrl } = await cl.business.monoInitiate()

// Redirect the user to monoLinkUrl
// After they complete the Mono Link flow, Mono calls your redirect_uri with a code

// Step 2: Exchange the code for a linked account
const result = await cl.business.monoCallback({ code: monoCode })
console.log(result.accountId) // "account_abc123"
// Pipeline runs automatically after successful link`} />
              <H3>REST equivalent</H3>
              <EndpointRow method="POST" path="/business/mono/initiate" desc="Start the Mono Link flow — returns a link URL to redirect the user to" auth="business_owner" />
              <EndpointRow method="POST" path="/business/mono/callback" desc="Exchange Mono auth code for a linked account record" auth="business_owner" />
            </DocSection>

            <DocSection id="csv-upload">
              <H2>CSV Import</H2>
              <P>For businesses that cannot connect via Mono, or want to supplement bank data with additional accounts, CSV bank statement import is supported. A configurable column map tells the pipeline how to interpret the file structure.</P>
              <CodeBlock lang="TypeScript" code={`const result = await cl.business.uploadCsv({
  csvContent: fs.readFileSync('statement.csv', 'utf-8'),
  columnMap: {
    date: 'Transaction Date',
    amount: 'Amount',
    direction: 'DR/CR',
    description: 'Narration',
    balance: 'Closing Balance',
    reference: 'Reference No',
  }
})
console.log(result.recordsImported) // 423`} />
            </DocSection>

            <DocSection id="pdf-upload">
              <H2>PDF Bank Statements</H2>
              <P>Creditlinker includes a PDF parsing pipeline that extracts transaction records from structured PDF bank statements. Password-protected statements are supported.</P>
              <CodeBlock lang="TypeScript" code={`const pdfBuffer = fs.readFileSync('statement.pdf')
const base64 = pdfBuffer.toString('base64')

const result = await cl.business.uploadPdf({
  pdfBase64: base64,
  password: 'optional-pdf-password',
})
console.log(result.transactionsParsed) // 312`} />
              <Callout type="warning">PDF extraction confidence is lower than Mono Open Banking. Pages with non-standard table layouts may produce incomplete results. Check the pipeline observability record for per-page confidence scores.</Callout>
            </DocSection>

            <DocSection id="manual-entry">
              <H2>Manual Entry</H2>
              <P>Individual transactions can be submitted manually for businesses that need to supplement automated data sources. Manual entries are tagged with a lower confidence weight in the feature store and flagged for data quality scoring purposes.</P>
              <Callout type="info">Manual entry is intended as a fallback for edge cases. Identities built primarily from manual data will have a lower <code>data_quality_score</code> and may be filtered by capital providers with high confidence thresholds.</Callout>
            </DocSection>

            <DocSection id="consent-model">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Lock size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Consent &amp; Access</span>
              </div>
              <H2>Consent Model</H2>
              <P>Creditlinker operates a strict, explicit consent model. No capital provider or partner can access a business's financial identity data without an active consent record. Consent is always time-limited, scoped to specific permissions, and revocable by the business at any time.</P>
              <H3>Consent lifecycle</H3>
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                {[
                  { step: "Discovery",       desc: "Capital provider sees an anonymized match. No identity data exposed." },
                  { step: "Access request",  desc: "Capital provider sends a consent request specifying required permissions and duration." },
                  { step: "Business review", desc: "Business reviews the request — which institution, what permissions, how long." },
                  { step: "Grant or deny",   desc: "Business grants time-limited, scoped consent. Or denies with no explanation required." },
                  { step: "Evaluation",      desc: "Capital provider queries the financial identity within granted permissions." },
                  { step: "Expiry / Revoke", desc: "Consent expires automatically at the set date, or is revoked by the business immediately." },
                ].map((s, i, arr) => (
                  <div key={s.step} style={{ display: "flex", gap: 12, paddingBottom: i < arr.length - 1 ? 16 : 0, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? "1px solid #E5E7EB" : "none" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, fontFamily: "monospace" }}>{i + 1}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{s.step}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="granting-consent">
              <H2>Granting Consent</H2>
              <CodeBlock title="grant-consent.ts" lang="TypeScript" code={`const consent = await cl.business.grantConsent({
  institutionId: 'inst_fastcash_001',
  permissions: {
    canViewScore: true,
    canViewIdentity: true,
    canViewTransactionDetail: false,
  },
  durationDays: 90,
})

console.log(consent.consentId)  // "consent_xyz789"
console.log(consent.validUntil) // "2026-06-14T00:00:00Z"`} />
            </DocSection>

            <DocSection id="revoking-consent">
              <H2>Revoking Consent</H2>
              <P>A business can revoke any active consent grant at any time. Revocation is immediate — the capital provider loses access the moment the call completes.</P>
              <CodeBlock lang="TypeScript" code={`await cl.business.revokeConsent({ consentId: 'consent_xyz789' })
// Capital provider immediately loses access
// CONSENT_REVOKED webhook fires to all subscribers`} />
            </DocSection>

            <DocSection id="permissions">
              <H2>Permission Scopes</H2>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { scope: "can_view_score",              desc: "View the overall identity score and all six dimensional scores"        },
                  { scope: "can_view_identity",           desc: "View the full filtered financial identity profile (feature store, readiness assessments, risk flags)" },
                  { scope: "can_view_transaction_detail", desc: "View individual normalized transactions (highest sensitivity)"         },
                ].map((p, i, arr) => (
                  <div key={p.scope} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <code style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", fontFamily: "monospace" }}>{p.scope}</code>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="access-logs">
              <H2>Access Logs</H2>
              <P>Every data access event made against a consent record is logged in the <code>access_log</code> field of the consent record. Businesses can inspect all access events for any of their consent grants.</P>
              <CodeBlock lang="TypeScript" code={`const consents = await cl.business.getConsents()
const consent = consents.find(c => c.consentId === 'consent_xyz789')
console.log(consent.accessLog)
// [
//   { actor: 'inst_fastcash_001', action: 'VIEW_SCORE',    timestamp: '2026-03-14T10:22Z' },
//   { actor: 'inst_fastcash_001', action: 'VIEW_IDENTITY', timestamp: '2026-03-14T10:22Z' },
//   { actor: 'inst_fastcash_001', action: 'CREATE_OFFER',  timestamp: '2026-03-14T11:05Z' },
// ]`} />
            </DocSection>

            <DocSection id="api-business">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Code2 size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>API Reference</span>
              </div>
              <H2>Business API</H2>
              <P>All endpoints require a <code>business_owner</code> role token. Businesses can manage their data sources, consent grants, financing records, and profile via these endpoints.</P>
              <H3>Profile &amp; Score</H3>
              <EndpointRow method="GET"   path="/business/profile"                  desc="Retrieve the current business profile"                                  auth="business_owner" />
              <EndpointRow method="PUT"   path="/business/profile"                  desc="Replace the full business profile"                                     auth="business_owner" />
              <EndpointRow method="PATCH" path="/business/profile/:section"         desc="Update a specific section of the business profile"                     auth="business_owner" />
              <EndpointRow method="GET"   path="/business/score"                    desc="Retrieve current score with all six dimensions and data quality score" auth="business_owner" />
              <EndpointRow method="GET"   path="/business/snapshots"                desc="List historical financial identity snapshots"                          auth="business_owner" />
              <H3>Data Sources</H3>
              <EndpointRow method="POST"  path="/business/mono/initiate"            desc="Initiate Mono Open Banking link flow"                                  auth="business_owner" />
              <EndpointRow method="POST"  path="/business/mono/callback"            desc="Exchange Mono auth code for a linked account"                          auth="business_owner" />
              <EndpointRow method="POST"  path="/business/upload/csv"               desc="Import transactions from a CSV bank statement"                         auth="business_owner" />
              <EndpointRow method="POST"  path="/business/upload/pdf"               desc="Parse and import transactions from a PDF bank statement"               auth="business_owner" />
              <H3>Consent</H3>
              <EndpointRow method="GET"   path="/business/consent"                  desc="List all consent records (active and revoked)"                         auth="business_owner" />
              <EndpointRow method="POST"  path="/business/consent/grant"            desc="Grant a capital provider access to the financial identity"             auth="business_owner" />
              <EndpointRow method="POST"  path="/business/consent/revoke"           desc="Immediately revoke an active consent grant"                            auth="business_owner" />
              <EndpointRow method="POST"  path="/business/consent/renew"            desc="Renew an expiring consent grant"                                       auth="business_owner" />
              <H3>Financing</H3>
              <EndpointRow method="GET"   path="/business/financing"                desc="List all financing records"                                            auth="business_owner" />
              <EndpointRow method="GET"   path="/business/financing/:id"            desc="Retrieve a specific financing record"                                  auth="business_owner" />
              <EndpointRow method="POST"  path="/business/financing/:id/settlement" desc="Submit settlement proof for a financing record"                       auth="business_owner" />
              <EndpointRow method="POST"  path="/business/financing/:id/dispute"    desc="Open a dispute on a financing record"                                  auth="business_owner" />
              <H3>Readiness &amp; Discovery</H3>
              <EndpointRow method="GET"   path="/business/readiness"                desc="Capital readiness assessments for all 14 financing categories"         auth="business_owner" />
              <EndpointRow method="GET"   path="/business/readiness/:type"          desc="Readiness assessment for a single financing type"                      auth="business_owner" />
              <EndpointRow method="PATCH" path="/business/discovery"                desc="Set open_to_financing flag and capital category preferences"           auth="business_owner" />
              <EndpointRow method="GET"   path="/business/discovery/requests"       desc="List incoming consent requests from capital providers"                 auth="business_owner" />
            </DocSection>

            <DocSection id="api-institution">
              <H2>Institution API</H2>
              <P>Requires an <code>institution</code> role token. All profile and score endpoints require an active consent record for the queried <code>financial_identity_id</code>.</P>
              <EndpointRow method="GET"  path="/institution/score/:fid"                         desc="Fetch identity score (requires can_view_score consent)"              auth="institution" />
              <EndpointRow method="GET"  path="/institution/profile/:fid"                       desc="Fetch filtered identity profile (requires can_view_identity consent)" auth="institution" />
              <EndpointRow method="GET"  path="/institution/profile/:fid/provenance"            desc="Full metric provenance metadata"                                     auth="institution" />
              <EndpointRow method="GET"  path="/institution/profile/:fid/snapshots"             desc="Historical identity snapshots"                                       auth="institution" />
              <EndpointRow method="GET"  path="/institution/discovery"                          desc="List anonymized businesses matching your criteria"                   auth="institution" />
              <EndpointRow method="POST" path="/institution/discovery/criteria"                 desc="Create or update your matching criteria"                             auth="institution" />
              <EndpointRow method="GET"  path="/institution/discovery/criteria"                 desc="Retrieve your current matching criteria"                             auth="institution" />
              <EndpointRow method="POST" path="/institution/discovery/:match_id/request-access" desc="Send a consent request to a matched business"                       auth="institution" />
              <EndpointRow method="GET"  path="/institution/financing"                          desc="List all financing records for this institution"                     auth="institution" />
              <EndpointRow method="POST" path="/institution/financing/:id/confirm-settlement"   desc="Confirm that a settlement has been received"                        auth="institution" />
              <EndpointRow method="POST" path="/institution/alert/subscribe"                    desc="Subscribe to identity change alerts for a business"                  auth="institution" />
            </DocSection>

            <DocSection id="api-partner">
              <H2>Partner API</H2>
              <P>The partner API is used by external platforms integrating Creditlinker under one of three access tiers: Read, Signal, or Build. All calls use a <code>business_token</code> — an opaque identifier that does not expose the underlying business identity.</P>
              <EndpointRow method="GET"  path="/partner/consent/status"          desc="Check consent status and permitted fields for a business token"        auth="partner" />
              <EndpointRow method="GET"  path="/partner/profile/:business_token" desc="Fetch the scoped financial profile (permitted fields only)"             auth="partner" />
              <EndpointRow method="POST" path="/partner/submit/:submission_type" desc="Submit verified data into the pipeline (Build tier only)"              auth="partner" badge="Build tier" />
              <Callout type="info">Submission types: <code>submit_bank_transactions</code> · <code>submit_identity_signals</code> · <code>submit_operational_data</code></Callout>
            </DocSection>

            <DocSection id="api-admin">
              <H2>Admin API</H2>
              <P>Requires a <code>platform_admin</code> role token. Restricted to internal platform operations — not available on partner API keys.</P>
              <EndpointRow method="GET" path="/admin/observability/:pipeline_run_id"      desc="Full observability record for a pipeline run"                   auth="platform_admin" />
              <EndpointRow method="GET" path="/admin/observability/business/:business_id" desc="List recent pipeline runs for a business"                       auth="platform_admin" />
              <EndpointRow method="GET" path="/admin/audit"                               desc="Paginated audit log with actor, action, and business filters"   auth="platform_admin" />
              <EndpointRow method="GET" path="/admin/events"                              desc="Paginated SDK event log with type and business filters"         auth="platform_admin" />
            </DocSection>

            <DocSection id="webhook-overview">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Webhook size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Webhooks</span>
              </div>
              <H2>Webhook Overview</H2>
              <P>Creditlinker fires webhook events whenever meaningful platform state changes occur. Configure your endpoint URL in the developer portal and subscribe to the event types you care about.</P>
              <CodeBlock title="webhook-handler.ts" lang="TypeScript" code={`import { CreditlinkerWebhookEvent } from '@creditlinker/sdk'

app.post('/webhooks/creditlinker', async (req, res) => {
  const sig = req.headers['x-creditlinker-signature']

  // Verify the signature first
  const event = cl.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET)

  switch (event.type) {
    case 'FINANCIAL_PROFILE_UPDATED':
      await refreshBusinessCache(event.payload.businessId)
      break
    case 'CONSENT_GRANTED':
      await notifyUnderwriter(event.payload)
      break
    case 'SETTLEMENT_CONFIRMED':
      await markLoanSettled(event.payload.financingId)
      break
  }

  res.json({ received: true })
})`} />
            </DocSection>

            <DocSection id="webhook-events">
              <H2>Event Reference</H2>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { category: "Pipeline",  color: "#38BDF8", events: [
                    { type: "DATA_INGESTED",             desc: "New financial data received and queued for processing"    },
                    { type: "TRANSACTION_NORMALIZED",    desc: "All transactions in a batch normalized and categorized"   },
                    { type: "FEATURES_GENERATED",        desc: "Feature store updated with new computed metrics"         },
                  ]},
                  { category: "Identity",  color: "#10B981", events: [
                    { type: "FINANCIAL_PROFILE_UPDATED", desc: "Identity profile updated after pipeline completion"      },
                    { type: "SCORE_RECALCULATED",        desc: "All six dimensions re-scored and published"              },
                    { type: "RISK_FLAG_RAISED",          desc: "New risk flag detected during pipeline processing"       },
                  ]},
                  { category: "Consent",   color: "#818CF8", events: [
                    { type: "CONSENT_GRANTED",           desc: "Business granted a capital provider access"             },
                    { type: "CONSENT_REVOKED",           desc: "Business immediately revoked an access grant"           },
                    { type: "CONSENT_RENEWED",           desc: "Business renewed an expiring consent grant"             },
                    { type: "CONSENT_EXPIRED",           desc: "A consent grant reached its expiry date"                },
                  ]},
                  { category: "Financing", color: "#F59E0B", events: [
                    { type: "FINANCING_GRANTED",         desc: "Business accepted a financing offer"                    },
                    { type: "SETTLEMENT_CONFIRMED",      desc: "Capital provider confirmed repayment receipt"           },
                    { type: "DISPUTE_OPENED",            desc: "A financing dispute was initiated by either party"      },
                    { type: "DISPUTE_RESOLVED",          desc: "A financing dispute was resolved"                       },
                  ]},
                ].map((group) => (
                  <div key={group.category}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: group.color, display: "inline-block" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{group.category}</span>
                    </div>
                    {group.events.map((e, i, arr) => (
                      <div key={e.type} style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F9FAFB" : "1px solid #E5E7EB", alignItems: "baseline" }}>
                        <code style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", fontFamily: "monospace" }}>{e.type}</code>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{e.desc}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="webhook-security">
              <H2>Signature Verification</H2>
              <P>Every webhook request includes an <code>X-Creditlinker-Signature</code> header — an HMAC-SHA256 signature of the raw request body using your webhook secret. Always verify this signature before processing the event.</P>
              <CodeBlock lang="TypeScript" code={`import crypto from 'crypto'

function verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}`} />
              <Callout type="danger">Never process webhook events without verifying the signature. Unverified webhooks could allow attackers to inject fraudulent events into your system.</Callout>
            </DocSection>

            <DocSection id="webhook-retries">
              <H2>Retries &amp; Delivery</H2>
              <P>Creditlinker retries failed webhook deliveries up to 5 times using exponential backoff: 1 min · 5 min · 30 min · 2 hr · 8 hr. Your endpoint should respond with a <code>2xx</code> status within 10 seconds. After 5 failed attempts, the event is marked as undeliverable and you receive a <code>WEBHOOK_DELIVERY_FAILED</code> notification.</P>
              <UL items={[
                "Respond with 200 immediately — process the event asynchronously if needed",
                "Your endpoint must respond within 10 seconds",
                "Implement idempotency — webhooks may be delivered more than once",
                "Use the event_id field to deduplicate retried deliveries",
              ]} />
            </DocSection>

            <DocSection id="sdk-install">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Package size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>SDK</span>
              </div>
              <H2>Installation</H2>
              <DocTabs tabs={[
                { label: "npm",  content: <CodeBlock lang="bash" code={`npm install @creditlinker/sdk`} /> },
                { label: "yarn", content: <CodeBlock lang="bash" code={`yarn add @creditlinker/sdk`} /> },
                { label: "pnpm", content: <CodeBlock lang="bash" code={`pnpm add @creditlinker/sdk`} /> },
              ]} />
              <Callout type="tip">The SDK ships with full TypeScript definitions. No <code>@types</code> package required.</Callout>
            </DocSection>

            <DocSection id="sdk-typescript">
              <H2>TypeScript SDK</H2>
              <P>The official TypeScript SDK wraps the Creditlinker REST API with full type coverage, automatic retries, and typed webhook event handlers.</P>
              <CodeBlock title="index.ts" lang="TypeScript" code={`import { Creditlinker } from '@creditlinker/sdk'

const cl = new Creditlinker({
  apiKey: process.env.CREDITLINKER_API_KEY!,
  environment: 'production',  // 'sandbox' | 'production'
  timeout: 30_000,
  maxRetries: 3,
})`} />
            </DocSection>

            <DocSection id="sdk-examples">
              <H2>Examples</H2>
              <H3>Run the identity pipeline</H3>
              <CodeBlock lang="TypeScript" code={`const run = await cl.business.runPipeline()
console.log(run.pipelineRunId)  // "run_abc123"
console.log(run.status)         // "queued"
// FINANCIAL_PROFILE_UPDATED webhook fires when done`} />
              <H3>Check financing readiness</H3>
              <CodeBlock lang="TypeScript" code={`const readiness = await cl.business.getReadiness()
console.log(readiness['working_capital_loan'].readinessScore)  // 82
console.log(readiness['invoice_financing'].status)             // "eligible"
console.log(readiness['equipment_financing'].readinessScore)   // 67`} />
              <H3>Manage discovery preferences</H3>
              <CodeBlock lang="TypeScript" code={`await cl.business.updateDiscovery({
  openToFinancing: true,
  selectedCapitalCategories: [
    'working_capital_loan',
    'invoice_financing',
    'revenue_advance',
  ],
})`} />
            </DocSection>

            <DocSection id="security-overview">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <ShieldCheck size={16} style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase" }}>Security</span>
              </div>
              <H2>Security Overview</H2>
              <P>Creditlinker is designed as financial infrastructure, which means security is non-negotiable at every layer.</P>
              <UL items={[
                "All data in transit encrypted with TLS 1.3",
                "All data at rest encrypted with AES-256",
                "JWT tokens are short-lived (1 hour) and role-scoped",
                "Every API call is logged in the immutable audit trail",
                "Consent revocation is immediate — no grace period, no cached access",
                "PII fields are encrypted separately at the field level",
                "Webhook payloads signed with HMAC-SHA256",
              ]} />
              <P>For security vulnerability disclosures, contact <a href="mailto:security@creditlinker.io" style={{ color: "#0A2540", fontWeight: 600 }}>security@creditlinker.io</a>.</P>
            </DocSection>

            <DocSection id="api-keys">
              <H2>API Key Management</H2>
              <P>API keys are created and managed in the developer portal. Each key is scoped to an environment (sandbox or production) and a set of allowed endpoints.</P>
              <UL items={[
                "Create separate keys for sandbox and production environments",
                "Rotate keys without downtime — old key remains active for 24 hours after rotation",
                "Revoke keys immediately from the portal — access terminates within seconds",
                "Per-key usage analytics available in the developer portal",
              ]} />
            </DocSection>

            <DocSection id="rate-limits">
              <H2>Rate Limits</H2>
              <P>Rate limits are enforced per API key. Exceeding the limit returns a <code>429 Too Many Requests</code> response with a <code>Retry-After</code> header.</P>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {[
                  { tier: "Sandbox",        limit: "100 req / min",   burst: "200 req"   },
                  { tier: "Read tier",      limit: "1,000 req / min", burst: "2,000 req" },
                  { tier: "Signal tier",    limit: "1,000 req / min", burst: "2,000 req" },
                  { tier: "Build tier",     limit: "500 req / min",   burst: "1,000 req" },
                  { tier: "platform_admin", limit: "200 req / min",   burst: "400 req"   },
                ].map((r, i, arr) => (
                  <div key={r.tier} style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px", gap: 12, padding: "11px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{r.tier}</span>
                    <code style={{ fontSize: 12, color: "#0A2540", fontFamily: "monospace" }}>{r.limit}</code>
                    <code style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.burst} burst</code>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="data-encryption">
              <H2>Data Encryption</H2>
              <P>All financial data stored on the Creditlinker platform is encrypted at rest using AES-256. PII fields — business owner names, identification numbers, bank account numbers — are encrypted at the field level using envelope encryption with per-tenant keys managed in a dedicated key management service.</P>
              <P>Bank account numbers are masked in all API responses (e.g., <code>****1234</code>). Full account numbers are never returned through the API.</P>
            </DocSection>

          </div>

          {/* RIGHT TOC */}
          <div className="docs-toc" style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", padding: "40px 0 40px 24px", borderLeft: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12 }}>On this page</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { id: "introduction",       label: "Introduction"       },
                { id: "quickstart",         label: "Quickstart"         },
                { id: "authentication",     label: "Authentication"     },
                { id: "errors",             label: "Errors"             },
                { id: "financial-identity", label: "Financial Identity" },
                { id: "dimensions",         label: "6 Dimensions"       },
                { id: "pipeline",           label: "Data Pipeline"      },
                { id: "feature-store",      label: "Feature Store"      },
                { id: "consent-model",      label: "Consent Model"      },
                { id: "api-business",       label: "Business API"       },
                { id: "api-institution",    label: "Institution API"    },
                { id: "api-partner",        label: "Partner API"        },
                { id: "webhook-overview",   label: "Webhooks"           },
                { id: "webhook-events",     label: "Event Reference"    },
                { id: "webhook-security",   label: "Signatures"         },
                { id: "sdk-install",        label: "SDK"                },
                { id: "rate-limits",        label: "Rate Limits"        },
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
