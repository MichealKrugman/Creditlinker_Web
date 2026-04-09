import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Lock,
  Layers,
  Database,
  Webhook,
  Key,
  Package,
  FlaskConical,
  BookOpen,
  ArrowUpRight,
  ChevronRight,
  Zap,
  ShieldCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", color: "#0A5060", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function GridBg({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(10,37,64,0.03)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

function SectionHeading({ id, badge, title, sub, center = false, dark = false }: { id?: string; badge?: React.ReactNode; title: React.ReactNode; sub?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className="fd-section-heading" style={{ textAlign: center ? "center" : "left", marginBottom: 56 }}>
      {badge && <div style={{ marginBottom: 16 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: dark ? "white" : "#0A2540", lineHeight: 1.1, marginBottom: sub ? 16 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: dark ? "rgba(255,255,255,0.5)" : "#4B5563", lineHeight: 1.78, maxWidth: center ? 580 : 520, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CODE BLOCK
───────────────────────────────────────────────────────── */
function CodeBlock({ title, lang, children }: { title: string; lang: string; children: string }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0d1117" }}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(0,212,255,0.6)", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", padding: "1px 7px", borderRadius: 4 }}>{lang}</span>
      </div>
      {/* Code */}
      <pre style={{ margin: 0, padding: "20px", overflowX: "auto", fontSize: 13, lineHeight: 1.7, color: "#e6edf3", fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, monospace" }}>
        <code dangerouslySetInnerHTML={{ __html: children }} />
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ENDPOINT ROW
───────────────────────────────────────────────────────── */
function EndpointRow({ method, path, desc, auth }: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; desc: string; auth: string }) {
  const methodColors: Record<string, { bg: string; color: string }> = {
    GET:    { bg: "rgba(56,189,248,0.12)",  color: "#38BDF8" },
    POST:   { bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
    PATCH:  { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    DELETE: { bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  };
  const mc = methodColors[method];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: mc.color, background: mc.bg, padding: "3px 9px", borderRadius: 6, flexShrink: 0, marginTop: 1, fontFamily: "monospace" }}>{method}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <code className="fd-endpoint-path" style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", fontFamily: "monospace", display: "block", marginBottom: 4 }}>{path}</code>
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
      </div>
      <span className="fd-endpoint-auth" style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 5, flexShrink: 0, fontFamily: "monospace", whiteSpace: "nowrap" }}>{auth}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ACCESS TIER CARD
───────────────────────────────────────────────────────── */
function TierCard({ tier, tag, desc, permissions, dark = false }: { tier: string; tag: string; desc: string; permissions: string[]; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "#0A2540" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 18, padding: 28, boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#00D4FF", background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.2)", padding: "3px 10px", borderRadius: 9999 }}>{tag}</span>
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: dark ? "white" : "#0A2540", marginBottom: 10, letterSpacing: "-0.025em" }}>{tier}</h3>
      <p style={{ fontSize: 14, color: dark ? "rgba(255,255,255,0.45)" : "#6B7280", lineHeight: 1.75, marginBottom: 20 }}>{desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {permissions.map((p) => (
          <div key={p} className="fd-perm-item" style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            <CheckCircle2 size={14} aria-hidden="true" style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.55)" : "#374151", lineHeight: 1.55 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, dark = false }: { icon: React.ReactNode; title: string; desc: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 16, padding: 24 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 16 }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "white" : "#0A2540", marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</h3>
      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ForDevelopersPage() {

  const quickstartCode = `<span style="color:#8b949e">// 1. Install the SDK</span>
<span style="color:#7ee787">npm</span> install @creditlinker/sdk

<span style="color:#8b949e">// 2. Initialize with your API key</span>
<span style="color:#ff7b72">import</span> <span style="color:#e6edf3">{ Creditlinker }</span> <span style="color:#ff7b72">from</span> <span style="color:#a5d6ff">'@creditlinker/sdk'</span>

<span style="color:#ff7b72">const</span> <span style="color:#79c0ff">cl</span> <span style="color:#ff7b72">=</span> <span style="color:#ff7b72">new</span> <span style="color:#ffa657">Creditlinker</span>({
  apiKey<span style="color:#ff7b72">:</span> process.<span style="color:#ffa657">env</span>.<span style="color:#79c0ff">CREDITLINKER_API_KEY</span>,
})

<span style="color:#8b949e">// 3. Fetch a business financial identity</span>
<span style="color:#ff7b72">const</span> <span style="color:#79c0ff">identity</span> <span style="color:#ff7b72">=</span> <span style="color:#ff7b72">await</span> cl.partner.<span style="color:#d2a8ff">getProfile</span>(businessToken)

console.<span style="color:#d2a8ff">log</span>(identity.<span style="color:#79c0ff">score</span>)        <span style="color:#8b949e">// 742</span>
console.<span style="color:#d2a8ff">log</span>(identity.<span style="color:#79c0ff">dimensions</span>)   <span style="color:#8b949e">// { revenueStability: 85, ... }</span>
console.<span style="color:#d2a8ff">log</span>(identity.<span style="color:#79c0ff">riskProfile</span>)  <span style="color:#8b949e">// "low"</span>`;

  const webhookCode = `<span style="color:#8b949e">// Listen for identity update events</span>
<span style="color:#ff7b72">app</span>.<span style="color:#d2a8ff">post</span>(<span style="color:#a5d6ff">'/webhooks/creditlinker'</span>, <span style="color:#ff7b72">async</span> (req, res) <span style="color:#ff7b72">=></span> {
  <span style="color:#ff7b72">const</span> { <span style="color:#79c0ff">event_type</span>, <span style="color:#79c0ff">payload</span> } <span style="color:#ff7b72">=</span> req.body

  <span style="color:#ff7b72">switch</span> (event_type) {
    <span style="color:#ff7b72">case</span> <span style="color:#a5d6ff">'FINANCIAL_PROFILE_UPDATED'</span><span style="color:#ff7b72">:</span>
      <span style="color:#8b949e">// Score or dimension changed</span>
      <span style="color:#ff7b72">await</span> <span style="color:#d2a8ff">updateLoanDecision</span>(payload.business_id)
      <span style="color:#ff7b72">break</span>

    <span style="color:#ff7b72">case</span> <span style="color:#a5d6ff">'SCORE_RECALCULATED'</span><span style="color:#ff7b72">:</span>
      <span style="color:#8b949e">// New pipeline run completed</span>
      <span style="color:#ff7b72">await</span> <span style="color:#d2a8ff">notifyUnderwriter</span>(payload)
      <span style="color:#ff7b72">break</span>

    <span style="color:#ff7b72">case</span> <span style="color:#a5d6ff">'CONSENT_REVOKED'</span><span style="color:#ff7b72">:</span>
      <span style="color:#8b949e">// Business revoked your access</span>
      <span style="color:#ff7b72">await</span> <span style="color:#d2a8ff">removeBusinessFromPipeline</span>(payload.business_id)
      <span style="color:#ff7b72">break</span>
  }

  res.<span style="color:#d2a8ff">json</span>({ received<span style="color:#ff7b72">:</span> <span style="color:#79c0ff">true</span> })
})`;

  const submitCode = `<span style="color:#8b949e">// Submit operational data (Build tier)</span>
<span style="color:#ff7b72">const</span> <span style="color:#79c0ff">result</span> <span style="color:#ff7b72">=</span> <span style="color:#ff7b72">await</span> cl.partner.<span style="color:#d2a8ff">submitData</span>({
  submissionType<span style="color:#ff7b72">:</span> <span style="color:#a5d6ff">'submit_bank_transactions'</span>,
  businessToken<span style="color:#ff7b72">:</span> <span style="color:#79c0ff">businessToken</span>,
  data<span style="color:#ff7b72">:</span> [
    {
      date<span style="color:#ff7b72">:</span> <span style="color:#a5d6ff">'2026-03-14'</span>,
      amount<span style="color:#ff7b72">:</span> <span style="color:#79c0ff">420000</span>,
      direction<span style="color:#ff7b72">:</span> <span style="color:#a5d6ff">'credit'</span>,
      description<span style="color:#ff7b72">:</span> <span style="color:#a5d6ff">'CUSTOMER PAYMENT REF-0042'</span>,
      currency<span style="color:#ff7b72">:</span> <span style="color:#a5d6ff">'NGN'</span>,
    },
  ],
})

console.<span style="color:#d2a8ff">log</span>(result.<span style="color:#79c0ff">accepted</span>)        <span style="color:#8b949e">// true</span>
console.<span style="color:#d2a8ff">log</span>(result.<span style="color:#79c0ff">recordsAccepted</span>) <span style="color:#8b949e">// 1</span>`;

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .fd-hero-grid    { grid-template-columns: 1fr !important; }
          .fd-tier-grid    { grid-template-columns: 1fr !important; }
          .fd-feat-grid    { grid-template-columns: 1fr 1fr !important; }
          .fd-api-grid     { grid-template-columns: 1fr !important; }
          .fd-event-grid   { grid-template-columns: 1fr 1fr !important; }
          .fd-webhook-grid { grid-template-columns: 1fr !important; }
          .fd-sticky       { position: static !important; }
        }
        @media (max-width: 600px) {
          .fd-feat-grid    { grid-template-columns: 1fr 1fr !important; }
          .fd-event-grid   { grid-template-columns: 1fr !important; }
          .fd-cta-btns     { flex-direction: column !important; align-items: stretch !important; }
          .fd-cta-btns a   { text-align: center !important; justify-content: center !important; }
          /* Hide heavy decorative panels on mobile */
          .fd-hide-mobile  { display: none !important; }
          /* Section padding */
          .fd-section      { padding: 44px 0 !important; }
          .fd-section-pad  { padding: 0 16px !important; }
          /* Tier cards */
          .fd-tier-grid > div { padding: 16px !important; border-radius: 12px !important; }
          .fd-tier-grid h3     { font-size: 17px !important; margin-bottom: 6px !important; }
          .fd-tier-grid p      { font-size: 12px !important; margin-bottom: 12px !important; }
          .fd-tier-grid span[style*='border-radius: 9999'] { font-size: 10px !important; padding: 2px 8px !important; }
          .fd-tier-grid .fd-perm-item span { font-size: 11px !important; }
          /* Feature cards */
          .fd-feat-grid > div  { padding: 14px !important; border-radius: 10px !important; }
          .fd-feat-grid h3     { font-size: 13px !important; margin-bottom: 4px !important; }
          .fd-feat-grid p      { font-size: 12px !important; }
          .fd-feat-grid > div > div:first-child { width: 34px !important; height: 34px !important; border-radius: 9px !important; margin-bottom: 10px !important; }
          /* Event cards */
          .fd-event-grid > div { padding: 14px 16px !important; border-radius: 10px !important; }
          .fd-event-grid p     { font-size: 11px !important; }
          /* Section headings */
          .fd-section-heading  { margin-bottom: 24px !important; }
          .fd-section-heading h2 { font-size: 24px !important; margin-bottom: 8px !important; }
          .fd-section-heading p  { font-size: 14px !important; }
          /* Fix endpoint row overflow */
          .fd-endpoint-path { font-size: 11px !important; word-break: break-all !important; }
          .fd-endpoint-auth { display: none !important; }
          /* Fix webhook event code overflow */
          .fd-event-code    { min-width: 0 !important; font-size: 11px !important; word-break: break-all !important; }
          /* Quick links wrap tighter */
          .fd-quick-links   { gap: 8px !important; }
          .fd-quick-links a { font-size: 12px !important; padding: 5px 10px !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Page hero" className="fd-section" style={{ position: "relative", overflow: "hidden", background: "#0d1117", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg />
        {/* Cyan glow */}
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "-20%", right: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)" }} />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", bottom: "-10%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 65%)" }} />

        <div className="fd-section-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fd-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 560px", gap: 72, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  For developers
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(38px,4.8vw,62px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.06, marginBottom: 22 }}>
                Build with<br />verified financial<br />
                <span style={{ color: "#00D4FF" }}>identity data.</span>
              </h1>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.78, marginBottom: 36, maxWidth: 500 }}>
                The Creditlinker API gives you access to six-dimensional financial identities,
                feature store metrics, and platform events for verified businesses. Every query
                requires explicit consent from the business you're querying.
              </p>
              <div className="fd-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
                <Link href="/developers/api-keys" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                  Get your API key <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10 }}>
                  Read the docs →
                </Link>
              </div>

              {/* Quick links */}
              <div className="fd-quick-links" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { label: "API Reference",  icon: <Code2 size={12} />,     href: "/developers/api-reference" },
                  { label: "SDKs",           icon: <Package size={12} />,   href: "/developers/sdks"          },
                  { label: "Webhooks",       icon: <Webhook size={12} />,   href: "/developers/webhooks"      },
                  { label: "Sandbox",        icon: <FlaskConical size={12} />, href: "/developers/sandbox"    },
                ].map((l) => (
                  <Link key={l.label} href={l.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 8, fontFamily: "monospace", transition: "color 0.15s, border-color 0.15s" }}>
                    <span style={{ color: "#00D4FF" }}>{l.icon}</span>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right — quickstart code (hidden on mobile) */}
            <div className="fd-hide-mobile">
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={13} aria-hidden="true" style={{ color: "#00D4FF" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>QUICKSTART</span>
              </div>
              <CodeBlock title="quickstart.ts" lang="TypeScript">
                {quickstartCode}
              </CodeBlock>

              {/* Response preview */}
              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 10 }}>Response</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { k: "score",              v: "742"      },
                    { k: "riskProfile",        v: '"low"'    },
                    { k: "revenueStability",   v: "85"       },
                    { k: "cashflowPredict.",   v: "78"       },
                    { k: "expenseDiscipline",  v: "81"       },
                    { k: "liquidityStrength",  v: "74"       },
                    { k: "financialConsist.",  v: "88"       },
                    { k: "riskProfileScore",   v: "91"       },
                    { k: "dataQualityScore",   v: "94"       },
                    { k: "dataCoverageMonths", v: "18"       },
                  ].map((r) => (
                    <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace" }}>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{r.k}:</span>
                      <span style={{ color: "#00D4FF", fontWeight: 600 }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ THREE ACCESS TIERS ════════════════════════════════════ */}
      <section aria-labelledby="tiers-heading" className="fd-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="fd-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="tiers-heading"
            badge={<Badge><Key size={10} aria-hidden="true" /> Partner access tiers</Badge>}
            title={<>Three tiers.<br />One consent model.</>}
            sub="All partner integrations require explicit business consent. The tier determines what you can do with the data you're granted access to."
            center
          />
          <div className="fd-tier-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            <TierCard
              tag="Read"
              tier="Read tier"
              desc="Query a business's financial identity — score, dimensions, profile — within the scope of their consent grant. Ideal for embedding creditworthiness signals into your own products."
              permissions={[
                "GET /partner/profile/:business_token",
                "GET /partner/consent/status",
                "View identity score and 6 dimensions",
                "View financial profile (permitted fields only)",
                "Check data quality score",
                "Read capital readiness assessment",
              ]}
            />
            <TierCard
              tag="Signal"
              tier="Signal tier"
              desc="Subscribe to webhook notifications when a business's financial identity changes. Build reactive systems that respond to score updates, pipeline completions, and consent events."
              permissions={[
                "All Read tier capabilities",
                "FINANCIAL_PROFILE_UPDATED events",
                "SCORE_RECALCULATED events",
                "CONSENT_GRANTED / REVOKED events",
                "FINANCING_GRANTED events",
                "Configurable webhook endpoints",
              ]}
              dark
            />
            <TierCard
              tag="Build"
              tier="Build tier"
              desc="Submit verified financial data into the Creditlinker pipeline on behalf of a business. Extend the platform's data coverage with your own verified data streams."
              permissions={[
                "All Signal tier capabilities",
                "POST /partner/submit/submit_bank_transactions",
                "POST /partner/submit/submit_identity_signals",
                "POST /partner/submit/submit_operational_data",
                "Data acceptance + rejection reporting",
                "Submission audit trail",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ══ API REFERENCE ═════════════════════════════════════════ */}
      <section aria-labelledby="api-heading" className="fd-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="fd-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fd-api-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — endpoints */}
            <div>
              <SectionHeading
                id="api-heading"
                badge={<Badge><Code2 size={10} aria-hidden="true" /> REST API</Badge>}
                title={<>Clean, predictable<br />endpoints.</>}
                sub="Bearer JWT auth via Keycloak. All endpoints return typed JSON. Full OpenAPI spec available in the developer portal."
              />

              {/* Partner endpoints */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 12 }}>Partner API</p>
                <EndpointRow method="GET"  path="/partner/consent/status"          desc="Check consent status and permitted fields for a business token"          auth="partner" />
                <EndpointRow method="GET"  path="/partner/profile/:business_token"  desc="Fetch the scoped financial identity profile (permitted fields only)"    auth="partner" />
                <EndpointRow method="POST" path="/partner/submit/:submission_type"  desc="Submit verified bank transactions, identity signals, or operational data" auth="partner · Build" />
              </div>

              {/* Business endpoints */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 12 }}>Business API</p>
                <EndpointRow method="GET"  path="/business/score"                   desc="Retrieve current identity score and all six financial dimensions"       auth="business_owner" />
                <EndpointRow method="POST" path="/business/mono/initiate"           desc="Initiate Mono Open Banking link flow. Returns a link URL."               auth="business_owner" />
                <EndpointRow method="POST" path="/business/mono/callback"           desc="Exchange Mono auth code for account link"                              auth="business_owner" />
                <EndpointRow method="POST" path="/business/upload/csv"              desc="Import transaction data from CSV with configurable column mapping"      auth="business_owner" />
                <EndpointRow method="GET"  path="/business/readiness"               desc="Get capital readiness assessments across all 14 financing categories"  auth="business_owner" />
                <EndpointRow method="GET"  path="/business/snapshots"               desc="Retrieve historical financial identity snapshots"                      auth="business_owner" />
                <EndpointRow method="POST" path="/business/consent/grant"           desc="Grant a capital provider access to financial identity data"            auth="business_owner" />
                <EndpointRow method="POST" path="/business/consent/revoke"          desc="Immediately revoke an active consent grant"                           auth="business_owner" />
              </div>

              {/* Institution endpoints */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 12 }}>Institution API</p>
                <EndpointRow method="GET"  path="/institution/score/:fid"           desc="Fetch a business's identity score (requires can_view_score consent)"   auth="institution" />
                <EndpointRow method="GET"  path="/institution/profile/:fid"         desc="Fetch filtered financial profile based on consent permissions"         auth="institution" />
                <EndpointRow method="GET"  path="/institution/profile/:fid/provenance" desc="Retrieve full metric provenance: source data, account, and period"    auth="institution" />
                <EndpointRow method="GET"  path="/institution/discovery"            desc="List anonymized businesses matching your criteria"                    auth="institution" />
                <EndpointRow method="POST" path="/institution/discovery/criteria"   desc="Post or update your matching criteria"                               auth="institution" />
              </div>
            </div>

            {/* Right — base URL + auth snippet (hidden on mobile) */}
            <div className="fd-sticky fd-hide-mobile" style={{ position: "sticky", top: 88 }}>
              <div style={{ background: "#0d1117", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>BASE URL</p>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <code style={{ fontSize: 14, color: "#00D4FF", fontFamily: "monospace" }}>https://api.creditlinker.io/v1</code>
                </div>
                <div style={{ padding: "0 18px 16px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", marginBottom: 10 }}>AUTHENTICATION</p>
                  <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#e6edf3", fontFamily: "monospace" }}>{`Authorization: Bearer <token>

// Token from Keycloak password grant:
POST /auth/realms/creditlinker/
  protocol/openid-connect/token`}</pre>
                </div>
              </div>

              {/* Sandbox callout */}
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04)", marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
                  <FlaskConical size={18} aria-hidden="true" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 5 }}>Sandbox environment</p>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 10 }}>Test all API calls against realistic synthetic business data — including pre-seeded identities, pipeline events, and consent flows — without touching production data.</p>
                  <Link href="/developers/sandbox" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#0A2540", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Open sandbox <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Rate limits */}
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Rate limits</p>
                {[
                  { tier: "Read",   limit: "1,000 req / min"  },
                  { tier: "Signal", limit: "1,000 req / min"  },
                  { tier: "Build",  limit: "500 req / min"    },
                ].map((r) => (
                  <div key={r.tier} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>{r.tier} tier</span>
                    <code style={{ color: "#0A2540", fontFamily: "monospace", fontSize: 12 }}>{r.limit}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WEBHOOKS ══════════════════════════════════════════════ */}
      <section aria-labelledby="webhook-heading" className="fd-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "30%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="fd-section-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fd-webhook-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — copy */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                  <Webhook size={10} aria-hidden="true" /> Webhooks
                </span>
              </div>
              <h2 id="webhook-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
                React to identity<br />changes in real time.
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36, maxWidth: 440 }}>
                Creditlinker fires events whenever something meaningful changes in a business's
                financial identity. Subscribe to the events you care about and build reactive
                systems that respond automatically.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Platform events</p>
                {[
                  { event: "DATA_INGESTED",           desc: "New financial data received and queued"       },
                  { event: "FEATURES_GENERATED",      desc: "Feature store updated with new metrics"       },
                  { event: "FINANCIAL_PROFILE_UPDATED",desc: "Identity profile changed after pipeline run" },
                  { event: "SCORE_RECALCULATED",      desc: "All 6 dimensions re-scored"                  },
                  { event: "CONSENT_GRANTED",         desc: "Business granted you data access"             },
                  { event: "CONSENT_REVOKED",         desc: "Business revoked your access"                 },
                  { event: "FINANCING_GRANTED",       desc: "Financing offer accepted"                     },
                  { event: "SETTLEMENT_CONFIRMED",    desc: "Repayment verified against bank data"         },
                  { event: "DISPUTE_OPENED",          desc: "Financing dispute initiated"                  },
                ].map((e, i, arr) => (
                  <div key={e.event} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <code className="fd-event-code" style={{ fontSize: 12, color: "#00D4FF", fontFamily: "monospace", flexShrink: 0, minWidth: 200 }}>{e.event}</code>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — webhook code (hidden on mobile) */}
            <div className="fd-hide-mobile">
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Webhook size={13} aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>WEBHOOK HANDLER</span>
              </div>
              <CodeBlock title="webhook.ts" lang="TypeScript">
                {webhookCode}
              </CodeBlock>

              {/* Build tier snippet */}
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Database size={13} aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>BUILD TIER — DATA SUBMISSION</span>
                </div>
                <CodeBlock title="submit-data.ts" lang="TypeScript">
                  {submitCode}
                </CodeBlock>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DEVELOPER TOOLS ═══════════════════════════════════════ */}
      <section aria-labelledby="tools-heading" className="fd-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="fd-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="tools-heading"
            badge={<Badge><Package size={10} aria-hidden="true" /> Developer tools</Badge>}
            title="Everything you need to ship."
            sub="SDKs, a sandbox environment, interactive API reference, and configurable webhook testing — all in the developer portal."
            center
          />
          <div className="fd-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <FeatureCard
              icon={<Package size={20} aria-hidden="true" />}
              title="TypeScript SDK"
              desc="Full type coverage, auto-pagination, retry logic, and typed webhook event handlers. npm install @creditlinker/sdk."
            />
            <FeatureCard
              icon={<FlaskConical size={20} aria-hidden="true" />}
              title="Sandbox"
              desc="Pre-seeded synthetic businesses with realistic identity data, consent flows, and pipeline events. No production data ever touched."
            />
            <FeatureCard
              icon={<BookOpen size={20} aria-hidden="true" />}
              title="API reference"
              desc="Interactive OpenAPI reference with try-it-now, request/response examples, and schema documentation for every endpoint."
            />
            <FeatureCard
              icon={<Webhook size={20} aria-hidden="true" />}
              title="Webhook testing"
              desc="Trigger any platform event manually in the developer portal. Inspect payloads, test handlers, and verify delivery in real time."
            />
            <FeatureCard
              icon={<Key size={20} aria-hidden="true" />}
              title="API key management"
              desc="Create scoped API keys per environment with configurable permissions. Rotate keys without downtime. Full usage analytics."
            />
            <FeatureCard
              icon={<ShieldCheck size={20} aria-hidden="true" />}
              title="Consent debugger"
              desc="Inspect active consent grants, permitted fields, and access logs for any business token in your sandbox or production environment."
            />
            <FeatureCard
              icon={<Database size={20} aria-hidden="true" />}
              title="Usage analytics"
              desc="Per-endpoint call volumes, latency percentiles, error rates, and consent event frequency — dashboarded by API key and environment."
            />
            <FeatureCard
              icon={<Layers size={20} aria-hidden="true" />}
              title="Event log"
              desc="Full searchable history of all SDK events, webhook deliveries, retries, and failures — with payload inspection and replay."
            />
          </div>
        </div>
      </section>

      {/* ══ EVENTS (system events table) ════════════════════════ */}
      <section aria-labelledby="system-events-heading" className="fd-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="fd-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="system-events-heading"
            badge={<Badge><Zap size={10} aria-hidden="true" /> Event-driven architecture</Badge>}
            title={<>Built on events.<br />Everything is observable.</>}
            sub="Creditlinker runs on an event-driven architecture. Every meaningful state change in the platform fires an event, making your integrations reactive, auditable, and debuggable."
            center
          />
          <div className="fd-event-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { category: "Data pipeline",   color: "#38BDF8", events: ["DATA_INGESTED", "TRANSACTION_NORMALIZED", "FEATURES_GENERATED"] },
              { category: "Identity",         color: "#10B981", events: ["FINANCIAL_PROFILE_UPDATED", "SCORE_RECALCULATED", "IDENTITY_VERSION_CREATED"] },
              { category: "Consent",          color: "#818CF8", events: ["CONSENT_GRANTED", "CONSENT_REVOKED", "CONSENT_RENEWED", "CONSENT_EXPIRED"] },
              { category: "Financing",        color: "#F59E0B", events: ["FINANCING_GRANTED", "SETTLEMENT_CONFIRMED", "DISPUTE_OPENED", "DISPUTE_RESOLVED"] },
              { category: "Discovery",        color: "#F472B6", events: ["DISCOVERY_MATCH_CREATED", "ACCESS_REQUESTED", "ACCESS_GRANTED", "ACCESS_DENIED"] },
              { category: "System",           color: "#00D4FF", events: ["PIPELINE_RUN_STARTED", "PIPELINE_RUN_COMPLETED", "RISK_FLAG_RAISED"] },
            ].map((g) => (
              <div key={g.category} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, display: "inline-block" }} />
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151" }}>{g.category}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {g.events.map((e) => (
                    <code key={e} style={{ fontSize: 12, color: "#0A2540", fontFamily: "monospace", background: "white", border: "1px solid #E5E7EB", padding: "4px 10px", borderRadius: 6, display: "block" }}>{e}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" className="fd-section" style={{ padding: "88px 0", background: "#0d1117", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="fd-section-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="fd-hero-grid">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.04em", color: "white", marginBottom: 18, lineHeight: 1.1 }}>
                Start building in<br />
                <span style={{ color: "#00D4FF" }}>minutes.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 36, lineHeight: 1.78 }}>
                Get your API key, spin up the sandbox, and make your first identity query before
                your coffee goes cold. The SDK ships with full TypeScript types and complete
                OpenAPI docs.
              </p>
              <div className="fd-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/developers/api-keys" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                  Get API key <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10 }}>
                  Read the docs →
                </Link>
              </div>
            </div>

            {/* Terminal-style checklist (hidden on mobile) */}
            <div className="fd-hide-mobile" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 16 }}>Getting started checklist</p>
              {[
                { step: "Sign up and create your developer account",          done: true  },
                { step: "Generate an API key in the developer portal",        done: true  },
                { step: "Install the SDK: npm install @creditlinker/sdk",     done: true  },
                { step: "Run your first query against the sandbox",           done: false },
                { step: "Configure webhook endpoints for identity events",    done: false },
                { step: "Test consent flows with synthetic business tokens",  done: false },
                { step: "Go live: switch to your production API key",             done: false },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: item.done ? "#10B981" : "rgba(255,255,255,0.08)", border: `1px solid ${item.done ? "#10B981" : "rgba(255,255,255,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {item.done && <CheckCircle2 size={11} aria-hidden="true" style={{ color: "white" }} />}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)", fontFamily: item.step.includes("npm") ? "monospace" : undefined, lineHeight: 1.55, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.step}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>3 of 7 steps complete</span>
                <div style={{ flex: 1, height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                  <div style={{ height: "100%", width: "43%", background: "#10B981", borderRadius: 9999 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
