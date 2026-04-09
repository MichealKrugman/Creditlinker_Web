import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  ShieldCheck,
  Banknote,
  TrendingUp,
  Lock,
  BarChart3,
  RefreshCw,
  Eye,
  ArrowUpRight,
  Cpu,
  Layers,
  AlertCircle,
  XCircle,
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
    <div className="fb-section-heading" style={{ textAlign: center ? "center" : "left", marginBottom: 56 }}>
      {badge && <div style={{ marginBottom: 16 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "#0A2540", lineHeight: 1.1, marginBottom: sub ? 16 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, maxWidth: center ? 560 : 500, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MINI SCORE RING (static — server component safe)
───────────────────────────────────────────────────────── */
function MiniScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r      = size / 2 - 8;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score / 1000);
  const cx     = size / 2;
  return (
    <div role="img" aria-label={`Identity score ${score} out of 1000`} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="url(#miniGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        <defs>
          <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{score}</span>
        <span style={{ fontSize: size * 0.1, color: "rgba(255,255,255,0.3)", marginTop: 2, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Score</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP ROW
───────────────────────────────────────────────────────── */
function StepRow({ n, icon, title, desc, last = false }: { n: string; icon: React.ReactNode; title: string; desc: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(0,212,255,0.18)", position: "relative" }}>
          {icon}
          <span style={{ position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: "50%", background: "#00D4FF", color: "#0A2540", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)" }}>{n}</span>
        </div>
        {!last && <div style={{ width: 2, flex: 1, minHeight: 32, marginTop: 6, background: "linear-gradient(to bottom, rgba(0,212,255,0.25), rgba(0,212,255,0.04))" }} />}
      </div>
      <div className="fb-step-content" style={{ paddingBottom: last ? 0 : 36, flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</h3>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   READINESS ROW
───────────────────────────────────────────────────────── */
function ReadinessRow({ type, cat, score, status, c, bg }: { type: string; cat: string; score: number; status: string; c: string; bg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{type}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 6 }}>{cat}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: c, background: bg, padding: "2px 9px", borderRadius: 9999 }}>{status}</span>
        </div>
        <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6" }}>
          <div style={{ height: "100%", width: `${score}%`, background: c, borderRadius: 9999 }} />
        </div>
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", width: 28, textAlign: "right", flexShrink: 0, fontFamily: "var(--font-display)" }}>{score}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ForBusinessesPage() {
  // Six real dimensions
  const sixDimensions = [
    { dim: "Revenue Stability",       score: 85, color: "#10B981", weight: "How consistent and predictable your revenue has been over time.", improve: "Link all active accounts and extend your data coverage window." },
    { dim: "Cashflow Predictability", score: 78, color: "#38BDF8", weight: "How reliably your business generates positive cash flow.",        improve: "Reduce large unexplained debit spikes relative to inflows."   },
    { dim: "Expense Discipline",      score: 81, color: "#818CF8", weight: "How well your business controls its costs relative to what it earns.", improve: "Identify and reduce irregular, non-operational expense bursts." },
    { dim: "Liquidity Strength",      score: 74, color: "#F59E0B", weight: "The level of cash reserves your business holds at any given time.",  improve: "Maintain a higher average month-end balance across accounts."  },
    { dim: "Financial Consistency",   score: 88, color: "#00D4FF", weight: "How regular and complete your financial activity has been.",          improve: "Connect all your business accounts and upload ledger data."   },
    { dim: "Risk Profile",            score: 91, color: "#F472B6", weight: "Whether your financial data shows any unusual or irregular patterns.", improve: "Maintain predictable patterns. A high score means clean, consistent data."  },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .fb-hero-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
          .fb-steps-grid   { grid-template-columns: 1fr !important; gap: 40px !important; }
          .fb-market-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .fb-consent-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .fb-pain-grid    { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .fb-dim-grid     { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .fb-sticky       { position: static !important; }
          .fb-section      { padding: 56px 0 !important; }
          .fb-section-pad  { padding: 0 20px !important; }
        }
        @media (max-width: 600px) {
          .fb-pain-grid        { grid-template-columns: 1fr !important; }
          .fb-dim-grid         { grid-template-columns: 1fr !important; }
          .fb-hero-grid        { gap: 0 !important; }
          .fb-section          { padding: 44px 0 !important; }
          .fb-section-pad      { padding: 0 16px !important; }
          .fb-proof-strip      { flex-wrap: wrap !important; gap: 16px 0 !important; }
          .fb-proof-divider    { display: none !important; }
          .fb-proof-strip > div { flex: 0 0 50% !important; }
          .fb-metric-row       { grid-template-columns: 1fr !important; }
          .fb-cta-row          { flex-direction: column !important; align-items: stretch !important; }
          .fb-cta-row a        { text-align: center !important; justify-content: center !important; }
          /* Hide heavy decorative panels — content carries the page on mobile */
          .fb-hide-mobile      { display: none !important; }
          /* Tighten dimension cards — hide improve tips */
          .fb-dim-improve      { display: none !important; }
          /* Shorten step padding */
          .fb-steps-grid       { gap: 0 !important; }
          /* Compact all cards */
          .fb-pain-grid > div  { padding: 16px !important; border-radius: 12px !important; }
          .fb-pain-grid > div > div { width: 32px !important; height: 32px !important; margin-bottom: 10px !important; border-radius: 8px !important; }
          .fb-pain-grid h3     { font-size: 13px !important; margin-bottom: 6px !important; }
          .fb-pain-grid p      { font-size: 12px !important; }
          .fb-dim-grid > div   { padding: 16px !important; border-radius: 12px !important; }
          .fb-dim-grid h3      { font-size: 13px !important; }
          .fb-dim-grid > div > span { font-size: 18px !important; }
          /* Section headings tighter */
          .fb-section-heading  { margin-bottom: 28px !important; }
          .fb-section-heading h2 { font-size: 26px !important; margin-bottom: 10px !important; }
          .fb-section-heading p  { font-size: 14px !important; }
          /* Step rows tighter */
          .fb-step-content     { padding-bottom: 20px !important; }
          .fb-step-content h3  { font-size: 14px !important; }
          .fb-step-content p   { font-size: 13px !important; }
          /* Capital list tighter */
          .fb-cap-list > div   { padding: 8px 0 !important; }
          .fb-cap-list span    { font-size: 12px !important; }
          /* Fix banner */
          .fb-fix-banner       { padding: 20px !important; border-radius: 12px !important; }
          .fb-fix-banner p:first-child { font-size: 16px !important; }
          .fb-fix-banner p:last-child  { font-size: 13px !important; }
          /* Section padding */
          .fb-section          { padding: 36px 0 !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Page hero" className="fb-section" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 900px 600px at 65% -60px, rgba(0,212,255,0.07) 0%, transparent 60%),radial-gradient(ellipse 500px 400px at 5% 75%, rgba(147,197,253,0.08) 0%, transparent 55%),#ffffff", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg light />
        <div className="fb-section-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fb-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 500px", gap: 72, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <Badge>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  Built for African SMEs
                </Badge>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(38px,4.8vw,62px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.06, marginBottom: 22 }}>
                Not a credit score.<br />
                <span style={{ background: "linear-gradient(90deg, #00D4FF, #38BDF8, #0A2540, #00D4FF)", backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer-text 5s linear infinite" }}>
                  A financial identity.
                </span>
              </h1>
              <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, marginBottom: 36, maxWidth: 500 }}>
                Creditlinker builds a verified financial profile from your real financial activity,
                giving every capital provider a clear, trusted picture of how your business operates.
              </p>
              <div className="fb-cta-row" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)" }}>
                  Build my financial identity <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
                  See how it works
                </a>
              </div>

              {/* Proof strip */}
              <div className="fb-proof-strip" style={{ display: "flex", alignItems: "center", gap: 0, paddingTop: 28, borderTop: "1px solid #E5E7EB" }}>
                {[
                  { v: "500+",  l: "Businesses"         },
                  { v: "\u20a62.4B", l: "Data analyzed"      },
                  { v: "14",    l: "Capital categories"  },
                  { v: "30+",   l: "Capital providers"   },
                ].map((s, i, arr) => (
                  <React.Fragment key={s.l}>
                    <div style={{ flex: "0 0 auto" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.v}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>{s.l}</div>
                    </div>
                    {i < arr.length - 1 && <div className="fb-proof-divider" style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0, margin: "0 24px" }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right — identity card (hidden on mobile) */}
            <div className="fb-hide-mobile">
              <div style={{ background: "linear-gradient(160deg, #0e2d4e 0%, #071a2e 100%)", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
                <GridBg />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 3 }}>Financial Identity</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>Aduke Bakeries Ltd.</p>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 9999 }}>
                    <CheckCircle2 size={11} aria-hidden="true" /> VERIFIED
                  </span>
                </div>

                {/* Score + 6 dimensions */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "20px 22px 14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <MiniScoreRing score={742} size={108} />
                    <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700, letterSpacing: "0.06em" }}>LOW RISK</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>6 financial dimensions</p>
                    {[
                      { l: "Revenue Stability",       v: 85 },
                      { l: "Cashflow Predictability", v: 78 },
                      { l: "Expense Discipline",      v: 81 },
                      { l: "Liquidity Strength",      v: 74 },
                      { l: "Financial Consistency",   v: 88 },
                      { l: "Risk Profile",            v: 91 },
                    ].map((d) => (
                      <div key={d.l} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                          <span>{d.l}</span>
                          <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{d.v}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                          <div style={{ height: "100%", width: `${d.v}%`, borderRadius: 9999, background: "linear-gradient(90deg,#00D4FF,#38BDF8)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metric row */}
                <div className="fb-metric-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { l: "Monthly Revenue",   v: "₦4.2M",    d: "↑ 12% MoM"  },
                    { l: "Linked Accounts",   v: "3 banks",  d: "Active"      },
                    { l: "Capital Offers",    v: "2 active", d: "Pending"     },
                  ].map((m, i) => (
                    <div key={m.l} style={{ padding: "14px 14px", background: "rgba(255,255,255,0.025)", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4, fontWeight: 500 }}>{m.l}</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{m.v}</p>
                      <p style={{ fontSize: 11, color: "#00D4FF", marginTop: 4, fontWeight: 500 }}>{m.d}</p>
                    </div>
                  ))}
                </div>

                <div style={{ margin: "12px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "12px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ color: "#00D4FF" }}>2 capital providers</span> matched your profile
                  </p>
                  <Link href="/register" style={{ fontSize: 12, color: "#00D4FF", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Review <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ THE PROBLEM ═══════════════════════════════════════════ */}
      <section aria-labelledby="problem-heading" className="fb-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="fb-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="problem-heading"
            badge={<Badge><AlertCircle size={10} aria-hidden="true" /> The problem</Badge>}
            title={<>African SMEs are viable.<br />The system just can&apos;t prove it.</>}
            sub="Traditional credit systems ask for documents, collateral, and a borrowing history most SMEs simply do not have — even when the business is profitable and consistently active."
            center
          />

          <div className="fb-pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
            {[
              { title: "No formal credit history",      desc: "Most SMEs have never taken a formal loan, so their credit record is blank — despite years of consistent banking activity that proves the business works." },
              { title: "Documents that don't hold up",   desc: "Financial statements can be manipulated, and financers know it. So your real numbers rarely receive the weight they deserve." },
              { title: "Collateral most SMEs don't have", desc: "Most growing businesses have no land or equipment to pledge. Without collateral, even a consistently profitable business gets turned away." },
            ].map((p) => (
              <div key={p.title} style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 16, padding: "24px 24px 20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", marginBottom: 16 }}>
                  <XCircle size={18} aria-hidden="true" />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#7F1D1D", marginBottom: 8, letterSpacing: "-0.02em" }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.7, opacity: 0.8 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="fb-fix-banner" style={{ background: "#0A2540", borderRadius: 16, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
            <GridBg />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div style={{ maxWidth: 620 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "white", marginBottom: 8, letterSpacing: "-0.025em" }}>Creditlinker fixes this.</p>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                  We build your financial identity directly from your banking activity: the evidence that already proves your business works. No documents. No collateral. No credit history required.
                </p>
              </div>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, background: "#00D4FF", color: "#0A2540", padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                Get started <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section id="how-it-works" aria-labelledby="hiw-heading" className="fb-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="fb-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fb-steps-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — steps */}
            <div>
              <SectionHeading
                id="hiw-heading"
                badge={<Badge><RefreshCw size={10} aria-hidden="true" /> For you</Badge>}
                title={<>Up and running<br />in under 10 minutes.</>}
                sub="Four steps from sign-up to your verified financial identity. The pipeline typically completes in under 90 seconds after you connect your first data source."
              />
              <StepRow n="1" icon={<Database size={16} aria-hidden="true" />}
                title="Register your business"
                desc="Create an account with your business name and details. We create a verified financial identity for your business, one that updates and grows stronger as your business continues to operate."
              />
              <StepRow n="2" icon={<Layers size={16} aria-hidden="true" />}
                title="Connect your financial data sources"
                desc="Link your bank accounts, upload accounting ledger exports, or add operational data (equipment, inventory, contracts, receivables). The more you connect, the richer your identity."
              />
              <StepRow n="3" icon={<Cpu size={16} aria-hidden="true" />}
                title="We analyze your data automatically"
                desc="We extract over 40 financial metrics from your data: revenue trends, cash flow patterns, expense consistency. The entire process runs in seconds."
              />
              <StepRow n="4" icon={<ShieldCheck size={16} aria-hidden="true" />}
                title="Receive your verified financial identity"
                desc="You receive a verified identity score, a risk rating, and a clear view of your readiness across 14 financing categories. From there, you decide who gets access to your profile."
                last
              />
              <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#0A2540", marginTop: 12, textDecoration: "underline", textUnderlineOffset: 4 }}>
                Deep dive: how the pipeline works <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* Right — pipeline run panel (hidden on mobile) */}
            <div className="fb-sticky fb-hide-mobile" style={{ position: "sticky", top: 88 }}>
              <div style={{ background: "#0A2540", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(10,37,64,0.18), 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Live pipeline · Aduke Bakeries</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 10px", borderRadius: 9999 }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                    Complete
                  </span>
                </div>
                {[
                  { stage: "Data ingestion",       detail: "3 banks · 4,218 transactions",   ms: "120ms" },
                  { stage: "Normalization",         detail: "98.4% confidence avg",           ms: "344ms" },
                  { stage: "Ledger reconciliation", detail: "Balances verified",              ms: "203ms" },
                  { stage: "Feature store update",  detail: "42 metrics computed & stored",   ms: "410ms" },
                  { stage: "6D scoring",            detail: "All 6 dimensions computed",      ms: "287ms" },
                  { stage: "Risk detection",        detail: "0 flags raised",                 ms: "221ms" },
                  { stage: "Identity snapshot",     detail: "v14 · Persistent ID locked",     ms: "82ms"  },
                ].map((row, i) => (
                  <div key={row.stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", background: "rgba(255,255,255,0.02)", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CheckCircle2 size={14} aria-hidden="true" style={{ color: "#10B981", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{row.stage}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{row.detail}</p>
                      </div>
                    </div>
                    <code style={{ fontSize: 11, color: "#00D4FF", background: "rgba(0,212,255,0.08)", padding: "2px 7px", borderRadius: 5 }}>{row.ms}</code>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Identity score</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#00D4FF", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>742</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Risk level</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>Low Risk</p>
                  </div>
                  <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#00D4FF", color: "#0A2540", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                    Get mine <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CAPITAL MARKETPLACE ═══════════════════════════════════ */}
      <section aria-labelledby="market-heading" className="fb-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="fb-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fb-market-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — readiness card (hidden on mobile) */}
            <div className="fb-hide-mobile">
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Capital readiness</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", marginBottom: 20 }}>Across 14 financing categories</p>

                <ReadinessRow type="Working Capital Financing"  cat="Debt"          score={88} status="Ready"     c="#10B981" bg="#ECFDF5" />
                <ReadinessRow type="Invoice Financing"     cat="Revenue-based" score={76} status="Ready"     c="#10B981" bg="#ECFDF5" />
                <ReadinessRow type="Trade Credit"          cat="Trade"         score={71} status="Ready"     c="#10B981" bg="#ECFDF5" />
                <ReadinessRow type="Revenue Advance"       cat="Revenue-based" score={65} status="Review"    c="#F59E0B" bg="#FFFBEB" />
                <ReadinessRow type="Equipment Financing"   cat="Asset-based"   score={54} status="Review"    c="#F59E0B" bg="#FFFBEB" />
                <ReadinessRow type="Receivables Purchase"  cat="Revenue-based" score={42} status="Not ready" c="#EF4444" bg="#FEF2F2" />

                <div style={{ marginTop: 20, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>2 capital providers ready to offer</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Grant access to view their offers</p>
                  </div>
                  <Link href="/register" style={{ background: "#0A2540", color: "white", padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>View offers →</Link>
                </div>
              </div>
            </div>

            {/* Right — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Banknote size={10} aria-hidden="true" /> The capital network</Badge></div>
              <h2 id="market-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                14 ways to get funded.<br />One verified identity.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 28 }}>
                Not every business needs a loan. Creditlinker checks your readiness across 14 different ways to get funded — from invoice advances to equipment leasing — so you know exactly which doors are open before you knock on any of them.
              </p>
              <div className="fb-cap-list" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {[
                  { cat: "Loans & credit lines",    types: "Short-term business loans · Lump-sum term loans · Business overdraft cover"       },
                  { cat: "Finance against assets",  types: "Equipment purchase loans · Stock-backed financing · Equipment leasing"            },
                  { cat: "Finance against sales",   types: "Get paid on unpaid invoices · Cash advance on future revenue · Sell your receivables" },
                  { cat: "Supplier arrangements",   types: "Buy now, pay later from suppliers · Third-party supplier payment · Deferred billing" },
                  { cat: "Service-based deals",     types: "Pay for services after delivery · Revenue-share instead of upfront fees"             },
                ].map((g) => (
                  <div key={g.cat} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <CheckCircle2 size={15} aria-hidden="true" style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{g.cat}: </span>
                      <span style={{ fontSize: 13, color: "#6B7280" }}>{g.types}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DATA CONTROL ══════════════════════════════════════════ */}
      <section aria-labelledby="control-heading" className="fb-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "50%", left: "60%", transform: "translate(-50%,-50%)", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="fb-section-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fb-consent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Lock size={10} aria-hidden="true" /> Your control</Badge></div>
              <h2 id="control-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "white", marginBottom: 20, lineHeight: 1.1 }}>
                You decide who<br />sees your identity.<br />
                <span style={{ color: "#00D4FF" }}>Always.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36, maxWidth: 440 }}>
                No capital provider can access your financial data without your explicit permission.
                You decide what they can see, how long they have access, and you can revoke it at any time.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { title: "Choose exactly what they see",       desc: "Grant one provider access to your score only, another to your full profile. Every permission is set by you, independently per provider." },
                  { title: "Access expires automatically",         desc: "Every grant expires at 7, 30, or 90 days. Access ends on its own without you having to do anything." },
                  { title: "Revoke access instantly",              desc: "Remove any provider's access in one action. They lose visibility immediately, in real time." },
                  { title: "A complete record of every access",    desc: "Every time your data is accessed, it is logged. You can always see who viewed your profile and when." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14 }}>
                    <div aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#00D4FF" }}>
                      <CheckCircle2 size={11} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "white", marginBottom: 4 }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — consent UI (hidden on mobile) */}
            <div className="fb-hide-mobile">
              <div style={{ background: "white", borderRadius: 18, padding: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.28)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Active consent</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 4 }}>FastCash Microfinance</h3>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 24 }}>Granted 14 Mar 2026 · Expires 14 Jun 2026</p>
                {[
                  { label: "View identity score",             on: true  },
                  { label: "View full identity profile",      on: true  },
                  { label: "View transaction detail",         on: false },
                  { label: "Create financing offer",          on: true  },
                  { label: "Subscribe to score alerts",       on: false },
                ].map((p) => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{p.label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: p.on ? "#10B981" : "#9CA3AF", background: p.on ? "#ECFDF5" : "#F9FAFB", border: `1px solid ${p.on ? "rgba(16,185,129,0.2)" : "#E5E7EB"}`, padding: "2px 9px", borderRadius: 9999 }}>
                      {p.on ? <><CheckCircle2 size={10} aria-hidden="true" /> Granted</> : <><Lock size={10} aria-hidden="true" /> Restricted</>}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 16, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Access log</p>
                  {[{ a: "Viewed identity score", t: "2h ago" }, { a: "Viewed identity profile", t: "2h ago" }, { a: "Created offer", t: "1h ago" }].map((e) => (
                    <div key={e.a} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: "50%", background: "#00D4FF", display: "inline-block" }} />
                        FastCash: {e.a}
                      </span>
                      <span style={{ color: "#9CA3AF" }}>{e.t}</span>
                    </div>
                  ))}
                </div>
                <button type="button" aria-label="Revoke FastCash Microfinance access" style={{ marginTop: 20, width: "100%", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Lock size={13} aria-hidden="true" />
                  Revoke access instantly
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SIX DIMENSIONS ════════════════════════════════════════ */}
      <section aria-labelledby="score-heading" className="fb-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="fb-section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="score-heading"
            badge={<Badge><BarChart3 size={10} aria-hidden="true" /> Your identity explained</Badge>}
            title={<>Six dimensions.<br />Your full financial picture.</>}
            sub="Each area of your financial health is scored independently, from 0 to 100. Capital providers see the full picture of your business — not a single number that oversimplifies it."
            center
          />
          <div className="fb-dim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {sixDimensions.map((d) => (
              <div key={d.dim} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", lineHeight: 1.3, maxWidth: 130 }}>{d.dim}</h3>
                  <span style={{ fontSize: 22, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", flexShrink: 0, marginLeft: 8, letterSpacing: "-0.02em" }}>{d.score}</span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${d.score}%`, background: d.color, borderRadius: 9999 }} />
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 14, flex: 1 }}>{d.weight}</p>
                <div className="fb-dim-improve" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: "#0A2540" }}>How to improve: </span>
                  {d.improve}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, background: "#0A2540", borderRadius: 14, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 6 }}>Plus a separate data quality score</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                Your identity also carries a data quality score — so capital providers know how much confidence to place in each dimension when reviewing your profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" className="fb-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div className="fb-section-pad" style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4.5vw,52px)", letterSpacing: "-0.04em", color: "white", marginBottom: 18, lineHeight: 1.1 }}>
            Your business already<br />has a <span style={{ color: "#00D4FF" }}>strong financial story.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 44, lineHeight: 1.78, maxWidth: 540, margin: "0 auto 44px" }}>
            Let Creditlinker build the verified identity that tells it, and connect you to the right capital providers.
          </p>
          <div className="fb-cta-row" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
              Build my financial identity <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.14)", padding: "13px 22px", borderRadius: 10 }}>
              How it works →
            </Link>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>Free to create · No credit card required · Under 10 minutes</p>
        </div>
      </section>
    </>
  );
}
