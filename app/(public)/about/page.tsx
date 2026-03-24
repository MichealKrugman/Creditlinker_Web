import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  ShieldCheck,
  Layers,
  Zap,
  Heart,
  Lock,
  BarChart3,
  Users,
  Building2,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const c = light ? "rgba(10,37,64,0.035)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

function SectionHeading({ id, badge, title, sub, center = false, dark = false }: { id?: string; badge?: React.ReactNode; title: React.ReactNode; sub?: string; center?: boolean; dark?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 40 }}>
      {badge && <div style={{ marginBottom: 14 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(24px,3.5vw,42px)", letterSpacing: "-0.035em", color: dark ? "white" : "#0A2540", lineHeight: 1.1, marginBottom: sub ? 14 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: dark ? "rgba(255,255,255,0.5)" : "#4B5563", lineHeight: 1.7, maxWidth: center ? 540 : 480, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VALUE CARD
───────────────────────────────────────────────────────── */
function ValueCard({ icon, title, desc, dark = false }: { icon: React.ReactNode; title: string; desc: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 14, padding: "20px 18px" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 12 }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: dark ? "white" : "#0A2540", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</h3>
      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT PILL
───────────────────────────────────────────────────────── */
function StatPill({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 16px", background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 14 }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(26px,3vw,40px)", letterSpacing: "-0.04em", color: dark ? "#00D4FF" : "#0A2540", lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.4, margin: 0 }}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TEAM CARD
───────────────────────────────────────────────────────── */
function TeamCard({ initials, name, role, bg }: { initials: string; name: string; role: string; bg: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 18px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "white", letterSpacing: "-0.02em" }}>
        {initials}
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 3, letterSpacing: "-0.02em" }}>{name}</p>
      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{role}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .ab-hero-grid    { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ab-stats-grid   { grid-template-columns: 1fr 1fr !important; }
          .ab-val-grid     { grid-template-columns: 1fr 1fr !important; }
          .ab-team-grid    { grid-template-columns: 1fr 1fr !important; }
          .ab-problem-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ab-section      { padding: 52px 0 !important; }
          .ab-pad          { padding: 0 20px !important; }
        }
        @media (max-width: 600px) {
          .ab-stats-grid   { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .ab-val-grid     { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .ab-team-grid    { grid-template-columns: 1fr !important; }
          .ab-cta-btns     { flex-direction: column !important; align-items: stretch !important; }
          .ab-cta-btns a   { justify-content: center !important; }
          .ab-section      { padding: 40px 0 !important; }
          .ab-pad          { padding: 0 16px !important; }
          .ab-compare-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .ab-compare-wrap > div { min-width: 560px !important; }
          .ab-hero-pad     { padding: 52px 16px !important; }
          .ab-hiring       { flex-direction: column !important; }
          .ab-mission-card { display: none !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="About hero" style={{ position: "relative", overflow: "hidden", background: "#0A2540", paddingTop: 72, paddingBottom: 72 }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "-20%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)" }} />

        <div className="ab-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ab-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 64, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  Our story
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(34px,4.8vw,58px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.06, marginBottom: 18 }}>
                Built for businesses<br />that deserve better<br />
                <span style={{ color: "#00D4FF" }}>access to capital.</span>
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 28, maxWidth: 500 }}>
                Creditlinker was founded on a simple observation: SMEs globally are financially active, operationally real, and chronically underserved by traditional credit infrastructure. We started by solving this in Africa, where the gap is most visible.
              </p>
              <div className="ab-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/for-businesses" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                  For businesses <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "11px 18px", borderRadius: 10 }}>
                  Get in touch
                </Link>
              </div>
            </div>

            {/* Right - mission card (hidden on small mobile) */}
            <div className="ab-mission-card" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,212,255,0.6)", textTransform: "uppercase", marginBottom: 16 }}>Our mission</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(16px,1.8vw,21px)", color: "white", lineHeight: 1.45, letterSpacing: "-0.025em", marginBottom: 24 }}>
                &ldquo;Transform fragmented financial data into persistent, verifiable financial identities and connect those identities to the capital they deserve.&rdquo;
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                {[
                  { label: "Financial data ingested",   value: "Real transaction data"   },
                  { label: "Identity type",             value: "Multidimensional, 6-D"   },
                  { label: "Capital categories",        value: "14 financing types"       },
                  { label: "Consent model",             value: "Explicit, revocable"      },
                  { label: "Settlement verification",   value: "Bank-data matched"        },
                ].map((r, i, arr) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#00D4FF", fontFamily: "var(--font-display)" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════ */}
      <section aria-label="Platform statistics" style={{ padding: "48px 0", background: "#F9FAFB" }}>
        <div className="ab-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ab-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <StatPill value="14" label="Financing types supported" />
            <StatPill value="6" label="Financial health dimensions" />
            <StatPill value="100%" label="Consent-governed data access" />
            <StatPill value="0" label="Credit records required" />
          </div>
        </div>
      </section>

      {/* ══ THE PROBLEM WE SOLVE ══════════════════════════════════ */}
      <section aria-labelledby="problem-heading" className="ab-section" style={{ padding: "72px 0", background: "white" }}>
        <div className="ab-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ab-problem-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>

            {/* Left */}
            <div>
              <SectionHeading
                id="problem-heading"
                badge={<Badge><Building2 size={10} aria-hidden="true" /> The problem</Badge>}
                title={<>SMEs have financial history.<br />Capital providers can&apos;t see it.</>}
                sub="Traditional credit infrastructure was built for formal balance sheets and bureau records. Most African SMEs don't have those - but they do have transaction histories, cash flows, and repayment behavior."
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: <BarChart3 size={16} />, title: "Financial activity exists, but isn't structured", desc: "Businesses transact every day: payments in, expenses out, recurring suppliers. That data lives in bank statements that nobody reads systematically." },
                  { icon: <Globe2 size={16} />,    title: "Credit bureaus miss operational reality", desc: "Bureau records capture formal credit events. They miss cash flow, revenue patterns, and expense discipline - the signals that actually predict repayment." },
                  { icon: <Lock size={16} />,      title: "Capital providers have no trusted data layer", desc: "Financers operate on unverified financials and guesswork because there is no infrastructure that turns real financial activity into a verifiable identity." },
                ].map((item) => (
                  <div key={item.title} style={{ display: "flex", gap: 14, padding: "16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 4 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div>
              <SectionHeading
                badge={<Badge><CheckCircle2 size={10} aria-hidden="true" /> What we built</Badge>}
                title={<>Financial identity<br />infrastructure.</>}
                sub="Creditlinker is the data layer between businesses and capital, turning raw financial activity into a verified, multidimensional identity that any capital provider can query with consent."
              />

              {/* Pipeline visualization */}
              <div style={{ background: "#0A2540", borderRadius: 14, padding: 20, position: "relative", overflow: "hidden" }}>
                <GridBg />
                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 16 }}>The pipeline</p>
                  {[
                    { label: "Raw financial data",         detail: "Bank transactions, accounting records, operational data",        color: "#38BDF8" },
                    { label: "Normalization and enrichment", detail: "Categorized, de-duplicated, reconciled, confidence-scored",      color: "#818CF8" },
                    { label: "Feature store",              detail: "Revenue growth, cash flow, expense ratios, liquidity metrics",   color: "#F59E0B" },
                    { label: "6-D financial identity",     detail: "Scored across 6 independent financial health dimensions",        color: "#10B981" },
                    { label: "Consent-gated capital access", detail: "Capital providers query identities; businesses grant access",   color: "#00D4FF" },
                  ].map((step, i) => (
                    <div key={step.label}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, marginTop: 4 }} />
                      {i < 4 && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "3px 0" }} />}
                      </div>
                      <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 2 }}>{step.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, margin: 0 }}>{step.detail}</p>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ OUR VALUES ═══════════════════════════════════════════ */}
      <section aria-labelledby="values-heading" className="ab-section" style={{ padding: "72px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "20%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="ab-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="values-heading"
            badge={<Badge><Heart size={10} aria-hidden="true" /> What we stand for</Badge>}
            title={<>Values that<br />shape the platform.</>}
            sub="Every design decision in Creditlinker - from the consent model to the scoring architecture - reflects what we actually believe."
            center
            dark
          />
          <div className="ab-val-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <ValueCard dark icon={<ShieldCheck size={18} aria-hidden="true" />} title="Consent first" desc="No capital provider sees a business's financial identity without explicit, revocable, time-limited consent. Always." />
            <ValueCard dark icon={<Layers size={18} aria-hidden="true" />}      title="Real data only" desc="Financial identities are built from actual transaction histories - not self-reported figures, projections, or guesswork." />
            <ValueCard dark icon={<Zap size={18} aria-hidden="true" />}         title="Multidimensional" desc="A single credit score compresses too much. Six independent dimensions reveal the actual shape of a business's health." />
            <ValueCard dark icon={<Lock size={18} aria-hidden="true" />}        title="Data provenance" desc="Every computed metric tracks its source data: which account, which transactions, which time range. Full transparency." />
            <ValueCard dark icon={<Users size={18} aria-hidden="true" />}       title="Two-sided trust" desc="Reputation signals are built for both businesses and capital providers. The platform rewards reliability on both sides." />
            <ValueCard dark icon={<Globe2 size={18} aria-hidden="true" />}      title="Built for Africa" desc="Designed around NGN-denominated transaction data and the financing realities of African SMEs, not imported from elsewhere." />
          </div>
        </div>
      </section>

      {/* ══ HOW WE'RE DIFFERENT ══════════════════════════════════ */}
      <section aria-labelledby="diff-heading" className="ab-section" style={{ padding: "72px 0", background: "#F9FAFB" }}>
        <div className="ab-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="diff-heading"
            badge={<Badge><BarChart3 size={10} aria-hidden="true" /> Why we&apos;re different</Badge>}
            title={<>Not a financer. Not a bureau.<br />Infrastructure.</>}
            sub="Creditlinker does not extend capital or adjudicate credit. It builds the data layer that makes better capital decisions possible."
            center
          />

          {/* Comparison table */}
          <div className="ab-compare-wrap">
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: "#0A2540", padding: "12px 20px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Capability</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Credit bureaus</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Traditional financers</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4FF", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Creditlinker</span>
            </div>
            {[
              { cap: "Uses real transaction data",          bureau: false, lender: false, us: true  },
              { cap: "Multidimensional financial scoring",  bureau: false, lender: false, us: true  },
              { cap: "Business-controlled data consent",   bureau: false, lender: false, us: true  },
              { cap: "14 capital category types",          bureau: false, lender: false, us: true  },
              { cap: "Settlement verification",            bureau: false, lender: true,  us: true  },
              { cap: "Reputation history for both sides",  bureau: false, lender: false, us: true  },
              { cap: "Open API for capital providers",     bureau: false, lender: false, us: true  },
              { cap: "Works without collateral",           bureau: false, lender: false, us: true  },
            ].map((row, i, arr) => {
              const Dot = ({ yes }: { yes: boolean }) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: yes ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.08)", border: `1px solid ${yes ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: yes ? "#10B981" : "#EF4444" }}>{yes ? "✓" : "✗"}</span>
                  </div>
                </div>
              );
              return (
                <div key={row.cap} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{row.cap}</span>
                  <Dot yes={row.bureau} />
                  <Dot yes={row.lender} />
                  <Dot yes={row.us} />
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </section>

      {/* ══ TEAM ════════════════════════════════════════════════ */}
      <section aria-labelledby="team-heading" className="ab-section" style={{ padding: "72px 0", background: "white" }}>
        <div className="ab-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="team-heading"
            badge={<Badge><Users size={10} aria-hidden="true" /> The team</Badge>}
            title={<>Founded on a clear<br />mission.</>}
            sub="Creditlinker is built by someone who understands both sides of the problem: the businesses that need capital and the infrastructure that should connect them."
            center
          />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <TeamCard initials="GM" name="Giwa Micheal" role="Founder" bg="linear-gradient(135deg,#0A2540,#1a4a7a)" />
          </div>

          {/* Hiring callout */}
          <div className="ab-hiring" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", marginBottom: 5, letterSpacing: "-0.02em" }}>We&apos;re growing the team.</p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Looking for engineers, credit analysts, and business development leads who care about African SME infrastructure.</p>
            </div>
            <Link href="/careers" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              View open roles <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FAQ (Shadcn Accordion) ════════════════════════════════ */}
      <section aria-labelledby="faq-heading" className="ab-section" style={{ padding: "72px 0", background: "#F9FAFB" }}>
        <div className="ab-pad" style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="faq-heading"
            badge={<Badge>Questions</Badge>}
            title={<>Frequently asked<br />questions.</>}
            center
          />
          <Accordion type="single" collapsible className="w-full" defaultValue="faq-1">
            {[
              {
                id: "faq-1",
                q: "Is Creditlinker a financer?",
                a: "No. Creditlinker is financial identity infrastructure. We don't extend capital or set interest rates. We build the verified financial identity layer that allows capital providers - financers, equipment financiers, trade suppliers - to evaluate businesses using real financial data."
              },
              {
                id: "faq-2",
                q: "Who owns a business's financial data on Creditlinker?",
                a: "The business does, always. Creditlinker operates a strict consent model: no capital provider can view a business's financial identity without the business explicitly granting time-limited, revocable access. Businesses can revoke consent at any time."
              },
              {
                id: "faq-3",
                q: "How is Creditlinker different from a credit score?",
                a: "Traditional credit scores produce a single number that compresses a business's creditworthiness into one dimension. Creditlinker generates six independent financial health dimensions - Revenue Stability, Cashflow Predictability, Expense Discipline, Liquidity Strength, Financial Consistency, and Risk Profile - plus a separate data quality score. Capital providers can analyze the full shape of a business rather than a compressed proxy."
              },
              {
                id: "faq-4",
                q: "What data does Creditlinker use to build a financial identity?",
                a: "Primarily bank transaction histories, connected directly or uploaded as CSV or PDF bank statements. We also incorporate accounting ledger data, operational financial signals, and verified business profile information. All data feeds into a scoring pipeline that produces a versioned, persistent financial identity."
              },
              {
                id: "faq-5",
                q: "What types of financing can businesses access through Creditlinker?",
                a: "Fourteen capital categories including working capital financing, term financing, overdraft facilities, equipment financing, inventory financing, invoice financing, receivables purchases, revenue advances, trade credit, supplier financing, and deferred service agreements. The platform matches businesses to capital providers based on their financial identity and their capital preferences."
              },
              {
                id: "faq-6",
                q: "Can capital providers integrate Creditlinker into their own systems?",
                a: "Yes. Creditlinker exposes a partner API with three access tiers: Read (query financial identities), Signal (receive webhook events on identity changes), and Build (submit verified data into the pipeline). All partner integrations require explicit business consent."
              },
            ].map((item) => (
              <AccordionItem key={item.id} value={item.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <AccordionTrigger style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", textAlign: "left", padding: "18px 0" }}>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, paddingBottom: 18 }}>
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ══ SEPARATOR ════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        <Separator style={{ background: "#E5E7EB" }} />
      </div>

      {/* ══ CTA ══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" className="ab-section" style={{ padding: "72px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 700px 350px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="ab-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
              Get started
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,4.5vw,52px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.1, marginBottom: 16 }}>
            Ready to build your<br />
            <span style={{ color: "#00D4FF" }}>financial identity?</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            Connect your bank account, run the pipeline, and get a verified multidimensional financial identity backed by your real financial data.
          </p>
          <div className="ab-cta-btns" style={{ display: "inline-flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Create your financial identity <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10 }}>
              See how it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

