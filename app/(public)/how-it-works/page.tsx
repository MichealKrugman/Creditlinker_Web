import Link from "next/link";
import {
  ArrowRight,
  Database,
  RefreshCw,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  Building2,
  Landmark,
  ArrowUpRight,
  BarChart3,
  Lock,
  Eye,
  GitBranch,
  Cpu,
  Layers,
  ChevronRight,
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
  const c = light ? "rgba(10,37,64,0.035)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

function SectionHeading({ id, badge, title, sub, center = false }: { id?: string; badge?: React.ReactNode; title: React.ReactNode; sub?: string; center?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 56 }}>
      {badge && <div style={{ marginBottom: 16 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "#0A2540", lineHeight: 1.1, marginBottom: sub ? 16 : 0 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, maxWidth: center ? 560 : 500, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

function Tag({ children, color = "#0A2540" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color, background: `${color}10`, border: `1px solid ${color}22`, padding: "3px 10px", borderRadius: 9999 }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   TIMELINE STEP
───────────────────────────────────────────────────────── */
function TimelineStep({ n, icon, title, desc, detail, last = false }: { n: string; icon: React.ReactNode; title: string; desc: string; detail?: string; last?: boolean }) {
  return (
    <div className="hiw-step-card" style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div className="hiw-step-num" style={{ width: 40, height: 40, borderRadius: 12, background: "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(0,212,255,0.18)", position: "relative" }}>
          {icon}
          <span className="hiw-step-numtag" style={{ position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: "50%", background: "#00D4FF", color: "#0A2540", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)" }}>{n}</span>
        </div>
        {!last && <div className="hiw-step-connector" style={{ width: 2, flex: 1, minHeight: 32, marginTop: 6, background: "linear-gradient(to bottom, rgba(0,212,255,0.25), rgba(0,212,255,0.04))" }} />}
      </div>
      <div className="hiw-step-pb" style={{ paddingBottom: last ? 0 : 36, flex: 1, minWidth: 0 }}>
        <h3 className="hiw-step-title" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", letterSpacing: "-0.025em", marginBottom: 8 }}>{title}</h3>
        <p className="hiw-step-desc" style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, marginBottom: detail ? 12 : 0 }}>{desc}</p>
        {detail && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#0A5060", fontWeight: 500 }}>
            <CheckCircle2 size={12} aria-hidden="true" style={{ color: "#00D4FF", flexShrink: 0 }} />
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PIPELINE ROW
───────────────────────────────────────────────────────── */
function PipelineRow({ stages }: { stages: { label: string; sub: string; icon: React.ReactNode; ms: string }[] }) {
  return (
    <div style={{ background: "#071a2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Pipeline execution · Aduke Bakeries Ltd.</p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 10px", borderRadius: 9999 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
          Complete · 1.7s total
        </span>
      </div>
      <div style={{ display: "flex", overflowX: "auto", padding: "20px", gap: 0 }}>
        {stages.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", minWidth: 150 }}>
              <div style={{ color: "#00D4FF", marginBottom: 8 }}>{s.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>{s.sub}</p>
              <code style={{ fontSize: 10, color: "#00D4FF", background: "rgba(0,212,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>{s.ms}</code>
            </div>
            {i < stages.length - 1 && (
              <div style={{ padding: "0 8px", color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
                <ChevronRight size={16} aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PERMISSION ROW
───────────────────────────────────────────────────────── */
function PermissionRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{label}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: granted ? "#10B981" : "#EF4444", background: granted ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${granted ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, padding: "2px 10px", borderRadius: 9999 }}>
        {granted ? <CheckCircle2 size={10} aria-hidden="true" /> : <Lock size={10} aria-hidden="true" />}
        {granted ? "Granted" : "Not granted"}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   AUDIENCE CARD
───────────────────────────────────────────────────────── */
function AudienceCard({ icon, label, title, desc, href, cta, dark = false }: { icon: React.ReactNode; label: string; title: string; desc: string; href: string; cta: string; dark?: boolean }) {
  const bg    = dark ? "#0A2540" : "white";
  const text  = dark ? "white"   : "#0A2540";
  const muted = dark ? "rgba(255,255,255,0.45)" : "#6B7280";
  const border= dark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  return (
    <div className="hiw-aud-card" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 18, padding: 32, display: "flex", flexDirection: "column", boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.18)" : "0 4px 24px rgba(0,0,0,0.04)" }}>
      <div className="hiw-aud-icon" style={{ width: 52, height: 52, borderRadius: 14, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 20 }}>{icon}</div>
      <Tag color={dark ? "#00D4FF" : "#0A2540"}>{label}</Tag>
      <h3 className="hiw-aud-title" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: text, letterSpacing: "-0.025em", marginTop: 14, marginBottom: 12 }}>{title}</h3>
      <p className="hiw-aud-desc" style={{ fontSize: 15, color: muted, lineHeight: 1.78, flex: 1, marginBottom: 28 }}>{desc}</p>
      <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: dark ? "#00D4FF" : "#0A2540" }}>
        {cta} <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPARE ROW
───────────────────────────────────────────────────────── */
function CompareRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="hiw-compare-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#EF4444", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", padding: "6px 12px", borderRadius: 8 }}>{before}</span>
      <span style={{ fontSize: 13, color: "#10B981", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.15)", padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 5 }}>
        <CheckCircle2 size={12} aria-hidden="true" /> {after}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  // The six real financial dimensions from the platform spec
  const sixDimensions = [
    { dim: "Revenue Stability",       score: 85, color: "#10B981", desc: "How consistent and predictable revenue inflows are over time. Measures growth trends, seasonal patterns, and income regularity across the analysis window." },
    { dim: "Cashflow Predictability", score: 78, color: "#38BDF8", desc: "How reliably the business generates positive operating cash flow. Tracks inflow-to-outflow ratios and identifies negative cash cycles." },
    { dim: "Expense Discipline",      score: 81, color: "#818CF8", desc: "How well operating costs are controlled relative to revenue. Identifies runaway expense patterns, margin compression, and unusual debit spikes." },
    { dim: "Liquidity Strength",      score: 74, color: "#F59E0B", desc: "The level of cash reserves and financial buffers available. Measures the business's capacity to absorb short-term financial obligations without distress." },
    { dim: "Financial Consistency",   score: 88, color: "#00D4FF", desc: "How complete and regular the business's financial activity and reporting patterns are. Rewards businesses with continuous, well-structured financial data." },
    { dim: "Risk Profile",            score: 91, color: "#F472B6", desc: "Detects anomalies, irregular behavior, and risk signals in financial activity. A high score means clean, predictable patterns with no red flags." },
  ];

  return (
    <>
      <style>{`
        /* ── Tablet ── */
        @media (max-width: 900px) {
          .hiw-hero-grid   { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hiw-audience    { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .hiw-dim-grid    { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .hiw-section     { padding: 64px 0 !important; }
          .hiw-pad         { padding: 0 24px !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .hiw-section     { padding: 40px 0 !important; }
          .hiw-pad         { padding: 0 20px !important; }

          /* Hero: hide data-flow card, stack buttons */
          .hiw-hero-card   { display: none !important; }
          .hiw-hero-grid   { grid-template-columns: 1fr !important; }
          .hiw-hero-btns   { flex-direction: column !important; }
          .hiw-hero-btns a { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }

          /* Hide the compare section entirely — too tabular on mobile */
          .hiw-compare-section { display: none !important; }

          /* Section headings: hide subtitle, tighten spacing */
          .hiw-sh          { margin-bottom: 24px !important; }
          .hiw-sh p        { display: none !important; }

          .hiw-steps-grid  { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .hiw-step-connector { display: none !important; }
          .hiw-step-card   { background: #F9FAFB !important; border: 1px solid #E5E7EB !important; border-radius: 12px !important; padding: 14px !important; flex-direction: column !important; }
          .hiw-step-desc   { display: none !important; }
          .hiw-step-title  { font-size: 13px !important; margin-bottom: 6px !important; line-height: 1.4 !important; }
          .hiw-step-pb     { padding-bottom: 0 !important; }
          .hiw-step-num    { width: 28px !important; height: 28px !important; border-radius: 8px !important; margin-bottom: 10px !important; }
          .hiw-step-numtag { width: 14px !important; height: 14px !important; font-size: 7px !important; top: -5px !important; right: -5px !important; }

          /* Pipeline deep-dive: hide entire section on mobile */
          .hiw-pipeline-section { display: none !important; }

          /* Consent section: hide UI card, show copy only */
          .hiw-consent-card { display: none !important; }

          /* Provider journey: hide sticky offer card */
          .hiw-offer-card  { display: none !important; }

          /* Audience section: hide entirely */
          .hiw-audience-section { display: none !important; }

          /* CTA: stack buttons full width */
          .hiw-cta-btns    { flex-direction: column !important; }
          .hiw-cta-btns a  { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }
          .hiw-cta-body    { font-size: 14px !important; margin-bottom: 24px !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Page hero" className="hiw-section" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 1000px 600px at 60% -60px, rgba(0,212,255,0.07) 0%, transparent 60%),#ffffff", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg light />
        <div className="hiw-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="hiw-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <Badge><GitBranch size={10} aria-hidden="true" /> The Creditlinker Engine</Badge>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(36px,4.5vw,58px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.06, marginBottom: 20 }}>
                From raw financial data<br />
                to verified<br />
                <span style={{ color: "#00D4FF" }}>financial identity.</span>
              </h1>
              <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, marginBottom: 36, maxWidth: 480 }}>
                Creditlinker pulls in your real banking, ledger, and operational data. It cleans,
                categorizes, and reconciles it, then scores six independent financial health dimensions
                that capital providers use to evaluate your business on how it actually operates.
              </p>
              <div className="hiw-hero-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)" }}>
                  Build my identity <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
                  I&apos;m a capital provider →
                </Link>
              </div>
            </div>

            {/* Right — data flow */}
            <div className="hiw-hero-card">
              <div style={{ background: "#0A2540", borderRadius: 20, padding: 24, boxShadow: "0 32px 96px rgba(10,37,64,0.2), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                <GridBg />
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 20 }}>Data flow</p>
                {[
                  { label: "Data sources",        sub: "Bank · Ledger · Operational",   icon: <Database size={16} aria-hidden="true" />,    color: "#38BDF8" },
                  { label: "Feature store",        sub: "42 metrics computed",            icon: <Layers size={16} aria-hidden="true" />,      color: "#818CF8" },
                  { label: "6D scoring engine",    sub: "Each dimension independent",     icon: <Cpu size={16} aria-hidden="true" />,         color: "#34D399" },
                  { label: "Financial identity",   sub: "Score · Risk · 14 categories",   icon: <ShieldCheck size={16} aria-hidden="true" />, color: "#00D4FF" },
                  { label: "Capital access",       sub: "Consent-gated · Audit-logged",   icon: <Eye size={16} aria-hidden="true" />,         color: "#F472B6" },
                ].map((node, i, arr) => (
                  <div key={node.label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${node.color}18`, border: `1px solid ${node.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: node.color, flexShrink: 0 }}>{node.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>{node.label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{node.sub}</p>
                      </div>
                      <CheckCircle2 size={14} aria-hidden="true" style={{ color: "#10B981", flexShrink: 0 }} />
                    </div>
                    {i < arr.length - 1 && <div style={{ display: "flex", alignItems: "center", paddingLeft: 30, paddingTop: 4, paddingBottom: 4 }}><div style={{ width: 2, height: 14, background: "linear-gradient(to bottom, rgba(0,212,255,0.3), rgba(0,212,255,0.08))" }} /></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ OLD WAY vs CREDITLINKER ═══════════════════════════════ */}
      <section aria-labelledby="compare-heading" className="hiw-section hiw-compare-section" style={{ padding: "96px 0", background: "#F9FAFB" }}>
        <div className="hiw-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="compare-heading"
            badge={<Badge>Why it matters</Badge>}
            title={<>Traditional credit doesn&apos;t work<br />for African businesses.</>}
            center
          />
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div className="hiw-compare-hdr" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 8 }}>
              <span />
              <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#EF4444", textAlign: "center" }}>Traditional</div>
              <div style={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#00D4FF", textAlign: "center" }}>Creditlinker</div>
            </div>
            {[
              { label: "Data source",      before: "Self-reported documents",    after: "Verified bank, ledger & ops data" },
              { label: "Score basis",       before: "Credit bureau proxy",        after: "6 independent dimensions"        },
              { label: "Capital types",     before: "Collateral-backed financing",  after: "14 categories, 5 types"          },
              { label: "Access control",    before: "Financer owns your data",    after: "You grant & revoke consent"      },
              { label: "Time to decision",  before: "4 to 12 weeks",             after: "Hours after linking data"        },
              { label: "Coverage",          before: "Formal credit history",      after: "Any bank-active business"        },
            ].map((r) => <CompareRow key={r.label} {...r} />)}
          </div>
        </div>
      </section>

      {/* ══ BUSINESS JOURNEY ══════════════════════════════════════ */}
      <section aria-labelledby="biz-journey-heading" className="hiw-section" style={{ padding: "96px 0", background: "white" }}>
        <div className="hiw-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="hiw-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <SectionHeading
                id="biz-journey-heading"
                badge={<Badge><Building2 size={10} aria-hidden="true" /> For businesses</Badge>}
                title={<>Your journey to<br />a verified financial identity.</>}
                sub="Six steps from signing up to receiving capital offers. Most businesses complete steps 1–3 in under 10 minutes."
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32 }}>
                {["Bank + ledger + operational data", "No collateral required", "6 independent dimensions", "Revocable consent"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9999, padding: "5px 14px" }}>
                    <CheckCircle2 size={12} aria-hidden="true" style={{ color: "#00D4FF" }} />{t}
                  </span>
                ))}
              </div>
            </div>

            <div>
            <div className="hiw-steps-grid">
              <TimelineStep n="1" icon={<Building2 size={18} aria-hidden="true" />}
                title="Create your business account"
                desc="Register with your business name and basic details. Creditlinker generates a persistent financial identity (anchored to your business, not just an individual login) that builds and versions over time."
              />
              <TimelineStep n="2" icon={<Database size={18} aria-hidden="true" />}
                title="Connect your financial data sources"
                desc="Link your bank accounts, upload accounting ledger exports, or add operational data such as equipment, inventory, and contract records. The more sources you connect, the richer and more credible your identity."
              />
              <TimelineStep n="3" icon={<Cpu size={18} aria-hidden="true" />}
                title="Pipeline and feature store update automatically"
                desc="Our engine processes, categorizes, and reconciles your data. A dedicated financial feature store computes 40+ derived metrics: monthly revenue growth, operating margin, cash reserve ratio, receivable turnover, and expense ratios. These are stored and versioned so scoring models never recalculate from scratch."
              />
              <TimelineStep n="4" icon={<ShieldCheck size={18} aria-hidden="true" />}
                title="Receive your six-dimensional financial identity"
                desc="Your identity is scored across six independent dimensions: Revenue Stability, Cashflow Predictability, Expense Discipline, Liquidity Strength, Financial Consistency, and Risk Profile, each on a 0 to 100 scale. A separate data quality score indicates how reliable the underlying data is. No compression into a single number."
              />
              <TimelineStep n="5" icon={<Eye size={18} aria-hidden="true" />}
                title="Grant consent to matched capital providers"
                desc="Creditlinker anonymously matches your profile to financers, equipment financiers, trade suppliers, and revenue financiers whose criteria fit your dimensions. You decide exactly which providers can see which data, for how long. Revoke anytime. Every access is logged."
              />
              <TimelineStep n="6" icon={<Banknote size={18} aria-hidden="true" />}
                title="Review and accept capital offers"
                desc="Matched providers review your verified identity against their own criteria and create structured offers. You compare terms, accept the best fit, and the financing record is created on-platform with full provenance."
                last
              />
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PIPELINE DEEP DIVE ════════════════════════════════════ */}
      <section aria-labelledby="pipeline-heading" className="hiw-section hiw-pipeline-section" style={{ padding: "96px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)" }} />

        <div className="hiw-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ marginBottom: 16 }}><Badge><Cpu size={10} aria-hidden="true" /> Under the hood</Badge></div>
            <h2 id="pipeline-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "white", lineHeight: 1.1, marginBottom: 16 }}>
              The data pipeline.
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.78, maxWidth: 540 }}>
              Seven deterministic stages. A financial feature store that avoids redundant computation.
              Full observability and an immutable audit log on every run.
            </p>
          </div>

          <PipelineRow stages={[
            { label: "Ingestion",        sub: "Bank · Ledger · Ops data",    icon: <Database size={18} aria-hidden="true" />,    ms: "120ms" },
            { label: "Normalization",    sub: "Categorize & clean",          icon: <RefreshCw size={18} aria-hidden="true" />,   ms: "344ms" },
            { label: "Ledger recon",     sub: "Balance verification",        icon: <BarChart3 size={18} aria-hidden="true" />,   ms: "203ms" },
            { label: "Feature store",    sub: "40+ metrics computed",        icon: <Layers size={18} aria-hidden="true" />,      ms: "410ms" },
            { label: "6D scoring",       sub: "All dimensions independent",  icon: <Cpu size={18} aria-hidden="true" />,         ms: "287ms" },
            { label: "Risk detection",   sub: "Anomaly & flag analysis",     icon: <ShieldCheck size={18} aria-hidden="true" />, ms: "221ms" },
            { label: "Identity snapshot",sub: "Persistent ID · versioned",   icon: <CheckCircle2 size={18} aria-hidden="true" />,ms: "82ms"  },
          ]} />

          {/* 6 dimension cards */}
          <div className="hiw-dim-grid" style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {sixDimensions.map((d) => (
              <div key={d.dim} className="hiw-dim-card" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "var(--font-display)", lineHeight: 1.3, maxWidth: 130 }}>{d.dim}</p>
                  <span style={{ fontSize: 18, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", flexShrink: 0, marginLeft: 8 }}>{d.score}</span>
                </div>
                <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.07)", marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${d.score}%`, background: d.color, borderRadius: 9999 }} />
                </div>
                <p className="hiw-dim-desc" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{d.desc}</p>
              </div>
            ))}
          </div>

          {/* Data quality note */}
          <div style={{ marginTop: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>Plus a separate data quality score</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                Every identity carries a <code style={{ color: "#00D4FF", background: "rgba(0,212,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>data_quality_score</code> indicating how reliable the underlying data is — so capital providers know exactly how much confidence to place in each dimension.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONSENT MODEL ═════════════════════════════════════════ */}
      <section aria-labelledby="consent-heading" className="hiw-section" style={{ padding: "96px 0", background: "#F9FAFB" }}>
        <div className="hiw-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="hiw-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — consent UI */}
            <div className="hiw-consent-card">
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Consent record</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 4 }}>FastCash Microfinance</h3>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 24 }}>Granted 14 Mar 2026 · Expires 14 Jun 2026 (90 days)</p>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Permissions</p>
                  <PermissionRow label="View financial identity score"     granted={true}  />
                  <PermissionRow label="View full identity profile"        granted={true}  />
                  <PermissionRow label="View transaction detail"           granted={false} />
                  <PermissionRow label="Create financing offer"            granted={true}  />
                  <PermissionRow label="Subscribe to score change alerts"  granted={false} />
                </div>

                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Recent access log</p>
                  {[
                    { action: "Viewed identity score",   time: "2h ago" },
                    { action: "Viewed identity profile", time: "2h ago" },
                    { action: "Created offer",           time: "1h ago" },
                  ].map((e) => (
                    <div key={e.action} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: "50%", background: "#00D4FF", display: "inline-block" }} />
                        FastCash: {e.action}
                      </span>
                      <span style={{ color: "#9CA3AF" }}>{e.time}</span>
                    </div>
                  ))}
                </div>

                <button type="button" aria-label="Revoke FastCash Microfinance access" style={{ marginTop: 20, width: "100%", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Lock size={13} aria-hidden="true" />
                  Revoke access
                </button>
              </div>
            </div>

            {/* Right — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Lock size={10} aria-hidden="true" /> Consent model</Badge></div>
              <h2 id="consent-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                Your data,<br />your rules.<br />Always.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                No capital provider sees any part of your financial identity without your explicit,
                time-bounded grant. You define the permission scope, set the expiry, and can revoke
                instantly. Every access event is logged in an immutable audit trail.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { title: "Permission-level control",  desc: "Grant score-only, full identity, or transaction detail — independently per provider. Mix and match based on your comfort level." },
                  { title: "Time-bounded expiry",       desc: "Every grant has a hard expiry date. Access ends automatically at 7, 30, or 90 days. No manual cleanup required." },
                  { title: "Instant revocation",        desc: "Revoke any provider's access in one action. They lose visibility immediately, in real time." },
                  { title: "Immutable audit log",       desc: "Every data access is logged with actor, timestamp, and action type. You always know exactly who saw what and when." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14 }}>
                    <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#00D4FF" }}>
                      <CheckCircle2 size={12} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 4 }}>{f.title}</p>
                      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CAPITAL PROVIDER JOURNEY ══════════════════════════════ */}
      <section aria-labelledby="fin-journey-heading" className="hiw-section" style={{ padding: "96px 0", background: "white" }}>
        <div className="hiw-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="hiw-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — steps */}
            <div>
              <SectionHeading
                id="fin-journey-heading"
                badge={<Badge><Landmark size={10} aria-hidden="true" /> For capital providers</Badge>}
                title={<>Evaluate businesses<br />with verified evidence.</>}
                sub="Whether you're a financer, equipment financier, trade supplier, or revenue financer. Creditlinker gives you access to six-dimensional financial identities built from real data."
              />
              <div className="hiw-steps-grid">
              <TimelineStep n="1" icon={<Landmark size={18} aria-hidden="true" />}
                title="Register as an institution"
                desc="Create your institution profile. Define your financing mandate: capital category, sectors you serve, ticket size ranges, and risk appetite."
              />
              <TimelineStep n="2" icon={<Layers size={18} aria-hidden="true" />}
                title="Set your matching criteria"
                desc="Post your criteria once. The discovery engine continuously matches you to businesses with verified identities that meet your parameters. Initial matches are anonymous."
              />
              <TimelineStep n="3" icon={<Eye size={18} aria-hidden="true" />}
                title="Request data access"
                desc="Send consent requests to matched businesses. They review the permissions scope you're requesting (score only, full identity, or transaction detail) and grant or deny on their own timeline."
              />
              <TimelineStep n="4" icon={<ShieldCheck size={18} aria-hidden="true" />}
                title="Review the verified financial identity"
                desc="Once granted, access the business's six financial dimensions, risk profile, data quality score, financial feature metrics, and capital readiness assessment. All figures are derived from verified transaction and operational data with full provenance."
              />
              <TimelineStep n="5" icon={<Banknote size={18} aria-hidden="true" />}
                title="Create and track financing offers"
                desc="Structure your offer on-platform with terms, tenor, and repayment schedule. The business reviews and accepts or declines. Financing records are created with full provenance and audit trail, and contribute to your institution's reputation score."
                last
              />
              </div>
            </div>

            {/* Right — offer card */}
            <div className="hiw-offer-card" style={{ position: "sticky", top: 88 }}>
              <div style={{ background: "#0A2540", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(10,37,64,0.18), 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Financing offer</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>FastCash MFB → Aduke Bakeries Ltd.</p>
                </div>
                <div style={{ padding: 20 }}>
                  {[
                    { label: "Capital type",     value: "Working Capital Financing", big: false },
                    { label: "Amount",           value: "₦5,000,000",             big: true  },
                    { label: "Interest rate",    value: "24% p.a.",               big: false },
                    { label: "Tenor",            value: "12 months",              big: false },
                    { label: "Repayment",        value: "Monthly installments",   big: false },
                    { label: "Collateral",       value: "None required",          big: false },
                  ].map((t) => (
                    <div key={t.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{t.label}</span>
                      <span style={{ fontSize: t.big ? 16 : 13, fontWeight: t.big ? 800 : 700, color: "white", fontFamily: t.big ? "var(--font-display)" : undefined }}>{t.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Underwriting basis</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                      Identity score <span style={{ color: "#00D4FF", fontWeight: 700 }}>742</span> · Low Risk ·
                      Revenue Stability 85 · Cashflow Predictability 78 · 18 months verified data
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button type="button" style={{ flex: 1, background: "#00D4FF", color: "#0A2540", padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>Accept offer</button>
                    <button type="button" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", padding: "11px", borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Decline</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ AUDIENCE CARDS ════════════════════════════════════════ */}
      <section aria-label="Who Creditlinker is for" className="hiw-section hiw-audience-section" style={{ padding: "96px 0", background: "#F9FAFB" }}>
        <div className="hiw-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading badge={<Badge>Get started</Badge>} title="Which path is yours?" sub="Creditlinker serves businesses, capital providers, and developers — each with a dedicated product experience." center />
          <div className="hiw-audience" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            <AudienceCard
              icon={<Building2 size={22} aria-hidden="true" />}
              label="For businesses"
              title="Build your financial identity"
              desc="Connect your bank accounts, ledger data, and operational records. Receive a six-dimensional verified identity and connect to the right capital providers based on how you actually operate."
              href="/for-businesses"
              cta="See business features"
            />
            <AudienceCard
              icon={<Landmark size={22} aria-hidden="true" />}
              label="For capital providers"
              title="Evaluate with verified data"
              desc="Access six-dimensional financial profiles built from real transaction and operational data. Whether you're a financer, equipment financier, trade supplier, or revenue financer, the data is verified and access is consent-gated."
              href="/for-financers"
              cta="See provider features"
              dark
            />
            <AudienceCard
              icon={<Layers size={22} aria-hidden="true" />}
              label="For developers"
              title="Build on the API"
              desc="Integrate financial identity data into your own applications. REST API, webhooks, sandbox environment, and full SDK support across three partner access tiers."
              href="/for-developers"
              cta="Read the docs"
            />
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" className="hiw-section" style={{ padding: "80px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div className="hiw-pad" style={{ position: "relative", maxWidth: 680, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.04em", color: "white", marginBottom: 16 }}>
            Ready to build your<br />
            <span style={{ color: "#00D4FF" }}>financial identity?</span>
          </h2>
          <p className="hiw-cta-body" style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 40, lineHeight: 1.78 }}>
            Sign up in minutes. Link your first data source in under two. See your six-dimensional identity before the end of the day.
          </p>
          <div className="hiw-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
              Build my financial identity <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10 }}>
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
