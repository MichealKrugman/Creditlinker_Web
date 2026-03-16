"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Database,
  CheckCircle2,
  ChevronRight,
  Zap,
  Lock,
  BarChart3,
  RefreshCw,
  Building2,
  Layers,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function r4(n: number) {
  return Math.round(n * 10000) / 10000;
}

/* ─────────────────────────────────────────────────────────
   SCORE RING
───────────────────────────────────────────────────────── */
function ScoreRing({ score = 742 }: { score?: number }) {
  const radius = 70;
  const circ   = 2 * Math.PI * radius;
  const target = circ * (1 - score / 1000);

  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 2 * Math.PI;
    return {
      x1: r4(90 + (radius - 6) * Math.cos(angle)),
      y1: r4(90 + (radius - 6) * Math.sin(angle)),
      x2: r4(90 + radius       * Math.cos(angle)),
      y2: r4(90 + radius       * Math.sin(angle)),
    };
  });

  return (
    <div
      role="img"
      aria-label={`Financial identity score: ${score} out of 1000`}
      style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.08) 60%, transparent 100%)" }} />
      <svg aria-hidden="true" width="180" height="180" viewBox="0 0 180 180" style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <circle
          cx="90" cy="90" r={radius} fill="none" stroke="url(#arcGrad)"
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={r4(circ)} strokeDashoffset={r4(circ)}
          className="animate-score"
          style={{ "--score-full": r4(circ), "--score-target": r4(target) } as React.CSSProperties}
        />
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 42, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", marginTop: 4, textTransform: "uppercase" }}>Score</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   GRID BG
───────────────────────────────────────────────────────── */
function GridBg() {
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
  );
}

/* ─────────────────────────────────────────────────────────
   HERO PRODUCT CARD
───────────────────────────────────────────────────────── */
function HeroCard() {
  // 6 real dimensions from the platform spec
  const dims = [
    { label: "Revenue Stability",      v: 85 },
    { label: "Cashflow Predictability", v: 78 },
    { label: "Expense Discipline",      v: 81 },
    { label: "Liquidity Strength",      v: 74 },
    { label: "Financial Consistency",   v: 88 },
    { label: "Risk Profile",            v: 91 },
  ];

  return (
    <div
      className="animate-float"
      style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #0e2d4e 0%, #071a2e 100%)", boxShadow: "0 40px 120px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      <GridBg />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Financial Identity</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>Aduke Bakeries Ltd.</p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 9999 }}>
          <CheckCircle2 size={11} aria-hidden="true" />
          VERIFIED
        </span>
      </div>

      {/* Score + 6 dimensions */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: "20px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <ScoreRing score={742} />
          <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700, letterSpacing: "0.06em" }}>LOW RISK</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Updated 2h ago</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 10 }}>6 financial dimensions</p>
          {dims.map((d) => (
            <div key={d.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                <span>{d.label}</span>
                <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{d.v}</span>
              </div>
              <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                <div style={{ height: "100%", width: `${d.v}%`, borderRadius: 9999, background: "linear-gradient(90deg,#00D4FF,#38BDF8)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { l: "Monthly Revenue",    v: "₦4.2M",     d: "↑ 12% MoM"      },
          { l: "Data Coverage",      v: "18 months",  d: "3 accounts"     },
          { l: "Capital Categories", v: "4 ready",    d: "Out of 14 types" },
          { l: "Providers Matched",  v: "2 active",   d: "Pending review" },
        ].map((m, i) => (
          <div key={m.l} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.025)", borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.04)" : "none", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4, fontWeight: 500 }}>{m.l}</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{m.v}</p>
            <p style={{ fontSize: 11, color: "#00D4FF", marginTop: 4, fontWeight: 500 }}>{m.d}</p>
          </div>
        ))}
      </div>

      {/* Capital provider alert */}
      <div style={{ margin: "12px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "12px 16px" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
            <span style={{ color: "#00D4FF" }}>2 capital providers</span> want to connect
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Grant consent to review their offers</p>
        </div>
        <span style={{ fontSize: 12, color: "#00D4FF", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
          Review <ChevronRight size={13} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PIPELINE STEP
───────────────────────────────────────────────────────── */
function PipelineStep({ n, icon, title, desc, last = false }: { n: string; icon: React.ReactNode; title: string; desc: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A2540", boxShadow: "0 0 0 1px rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#00D4FF" }}>{icon}</div>
        {!last && <div style={{ width: 1, flex: 1, minHeight: 32, marginTop: 8, background: "linear-gradient(to bottom, rgba(0,212,255,0.2), transparent)" }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 32, flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(0,212,255,0.6)", textTransform: "uppercase", marginBottom: 4 }}>Step {n}</p>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</h3>
        <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75 }}>{desc}</p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", color: "#0A5060", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9999, padding: "5px 14px" }}>
      <CheckCircle2 size={12} aria-hidden="true" style={{ color: "#00D4FF", flexShrink: 0 }} />
      {children}
    </span>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div style={{ borderLeft: "2px solid #00D4FF", paddingLeft: 20 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid     { grid-template-columns: 1fr !important; }
          .works-grid    { grid-template-columns: 1fr !important; }
          .biz-grid      { grid-template-columns: 1fr !important; }
          .fin-grid      { grid-template-columns: 1fr !important; }
          .security-grid { grid-template-columns: 1fr !important; }
          .hero-floats   { display: none !important; }
          .stat-grid     { grid-template-columns: 1fr 1fr !important; }
          .steps-sticky  { position: static !important; }
          .dim-grid      { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .stat-grid  { grid-template-columns: 1fr !important; }
          .dim-grid   { grid-template-columns: 1fr !important; }
          .pill-wrap  { flex-wrap: wrap; }
        }
      `}</style>

      {/* ── ANNOUNCEMENT BAR ── */}
      <div role="banner" style={{ background: "#0A2540", color: "rgba(255,255,255,0.75)", textAlign: "center", padding: "10px 24px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ background: "#00D4FF", color: "#0A2540", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 9999, letterSpacing: "0.06em", flexShrink: 0 }}>NEW</span>
        <span>Creditlinker now supports 30+ Nigerian banks via Mono Open Banking</span>
        <Link href="/how-it-works" style={{ color: "#00D4FF", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          Learn more <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Hero" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 1000px 600px at 75% -80px, rgba(0,212,255,0.07) 0%, transparent 60%),radial-gradient(ellipse 600px 500px at 8% 65%, rgba(147,197,253,0.09) 0%, transparent 55%),#ffffff" }}>
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(10,37,64,0.055) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="hero-grid" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "80px 32px 96px", display: "grid", gridTemplateColumns: "1fr 480px", gap: 64, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div className="animate-fade-up" style={{ marginBottom: 24 }}>
              <Badge>
                <span className="animate-pulse-dot" aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", flexShrink: 0, display: "inline-block" }} />
                Financial identity infrastructure for African businesses
              </Badge>
            </div>

            <h1 className="animate-fade-up delay-100" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540", lineHeight: 1.03, marginBottom: 24, fontSize: "clamp(40px, 5vw, 66px)", letterSpacing: "-0.04em" }}>
              Not a credit score.<br />
              <span style={{ background: "linear-gradient(90deg, #00D4FF, #38BDF8, #0A2540, #00D4FF)", backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer-text 5s linear infinite" }}>
                A financial identity.
              </span>
            </h1>

            <p className="animate-fade-up delay-200" style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, marginBottom: 36, maxWidth: 520 }}>
              Creditlinker builds a verified, multi-dimensional financial identity from your real
              transaction data — bank history, ledger records, and operational signals. Capital
              providers evaluate you on six independent financial health dimensions, not a single
              number that hides your story.
            </p>

            <div className="animate-fade-up delay-300" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)", transition: "background 0.15s, box-shadow 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#0d3060"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(10,37,64,0.28)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#0A2540"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(10,37,64,0.18)"; }}
              >
                Build my financial identity <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#0A2540", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                See how it works
              </a>
            </div>

            <div className="animate-fade-up delay-400 pill-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
              {["6 financial dimensions", "Bank + ledger + operational data", "14 capital categories", "30+ banks"].map((f) => <FeaturePill key={f}>{f}</FeaturePill>)}
            </div>

            <div className="animate-fade-up delay-500 stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, paddingTop: 32, borderTop: "1px solid #E5E7EB" }}>
              <StatCard value="500+"  label="Businesses"            sub="across Nigeria" />
              <StatCard value="₦2.4B" label="Transactions analyzed" sub="and growing"    />
              <StatCard value="30+"   label="Capital providers"     sub="on platform"   />
            </div>
          </div>

          {/* Right */}
          <div className="animate-fade-in delay-200" style={{ position: "relative" }}>
            <HeroCard />
            <div className="hero-floats" aria-hidden="true" style={{ position: "absolute", top: -16, right: -16, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid #E5E7EB", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#10B981" }}>
                <TrendingUp size={15} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>Expense Discipline improved</p>
                <p style={{ fontSize: 11, color: "#6B7280" }}>+11 pts after linking payroll account</p>
              </div>
            </div>
            <div className="hero-floats" aria-hidden="true" style={{ position: "absolute", bottom: -16, left: -24, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid #E5E7EB", padding: "12px 16px" }}>
              <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>New offer received</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF" }}>
                  <Banknote size={13} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>₦5M Working Capital</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div style={{ borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA" }}>
        <div className="trust-scroll" style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#9CA3AF", textTransform: "uppercase", flexShrink: 0 }}>Connected banks</span>
          {["Access Bank", "GTBank", "UBA", "Zenith Bank", "First Bank", "Stanbic IBTC", "Polaris", "Wema Bank"].map((b) => (
            <span key={b} style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>{b}</span>
          ))}
        </div>
      </div>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section id="how-it-works" aria-labelledby="works-heading" style={{ padding: "112px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="works-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Zap size={10} aria-hidden="true" /> The process</Badge></div>
              <h2 id="works-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540", fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", marginBottom: 16 }}>
                From financial data<br />to capital access.
              </h2>
              <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.75, marginBottom: 48, maxWidth: 420 }}>
                Creditlinker aggregates bank transactions, accounting ledger data, and operational
                financial records — transforming them into a verified financial identity that capital
                providers can evaluate with confidence.
              </p>

              <PipelineStep n="01" icon={<Database size={18} aria-hidden="true" />}
                title="Connect your financial data sources"
                desc="Link bank accounts via Mono Open Banking, upload accounting ledger exports, or add operational data. The more sources you connect, the richer and more credible your identity becomes."
              />
              <PipelineStep n="02" icon={<RefreshCw size={18} aria-hidden="true" />}
                title="Automated ingestion and enrichment"
                desc="Our pipeline normalizes, reconciles, and enriches your data. A dedicated feature store computes metrics like revenue volatility, operating margin, cash reserve ratio, and receivable turnover — stored and versioned."
              />
              <PipelineStep n="03" icon={<ShieldCheck size={18} aria-hidden="true" />}
                title="Six-dimensional financial identity"
                desc="Your identity is scored across six independent dimensions: Revenue Stability, Cashflow Predictability, Expense Discipline, Liquidity Strength, Financial Consistency, and Risk Profile. Each scored 0–100. No compression into a single number."
              />
              <PipelineStep n="04" icon={<Banknote size={18} aria-hidden="true" />}
                title="Connect to the right capital providers"
                desc="Matched against lenders, equipment financiers, trade suppliers, and revenue financiers — each evaluating you against their own criteria. You control access with time-bounded, revocable consent."
                last
              />
            </div>

            {/* Right — sticky pipeline panel */}
            <div className="steps-sticky" style={{ position: "sticky", top: 88 }}>
              <div style={{ borderRadius: 18, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 8px 48px rgba(0,0,0,0.06)" }}>
                <div style={{ background: "#0A2540", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Pipeline Run · Aduke Bakeries</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>7 stages · 1.67s total</p>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)", padding: "4px 10px", borderRadius: 9999 }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, background: "#10B981", borderRadius: "50%", animation: "pulse-dot 2s ease-in-out infinite" }} />
                    Complete
                  </span>
                </div>

                {[
                  { stage: "Data ingestion",       detail: "3 banks · 4,218 transactions",   ms: "120ms" },
                  { stage: "Normalization",         detail: "98.4% confidence avg",           ms: "344ms" },
                  { stage: "Ledger reconciliation", detail: "Balances verified",              ms: "203ms" },
                  { stage: "Feature store update",  detail: "42 metrics computed",            ms: "410ms" },
                  { stage: "6D scoring",            detail: "All dimensions computed",        ms: "287ms" },
                  { stage: "Risk detection",        detail: "0 flags raised",                 ms: "221ms" },
                  { stage: "Identity snapshot",     detail: "v14 · Persistent ID locked",     ms: "82ms"  },
                ].map((row, i) => (
                  <div key={row.stage} style={{ padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < 6 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CheckCircle2 size={15} aria-hidden="true" style={{ color: "#10B981", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{row.stage}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{row.detail}</p>
                      </div>
                    </div>
                    <code style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 5 }}>{row.ms}</code>
                  </div>
                ))}

                <div style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Identity score</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#0A2540", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>742</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Risk profile</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>Low Risk</p>
                  </div>
                  <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0A2540", color: "white", padding: "9px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
                    Get yours <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SIX DIMENSIONS ════════════════════════════════════════ */}
      <section aria-labelledby="dims-heading" style={{ padding: "96px 0", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ marginBottom: 16 }}><Badge><BarChart3 size={10} aria-hidden="true" /> The identity model</Badge></div>
            <h2 id="dims-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540", fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", marginBottom: 16 }}>
              Six dimensions.<br />One honest picture.
            </h2>
            <p style={{ fontSize: 17, color: "#4B5563", maxWidth: 560, margin: "0 auto", lineHeight: 1.78 }}>
              Unlike a single credit score that compresses your business into one number, Creditlinker
              scores each financial dimension independently — so capital providers see the full shape
              of your business and evaluate it against their own criteria.
            </p>
          </div>

          <div className="dim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { dim: "Revenue Stability",      score: 85, color: "#10B981", desc: "How consistent and predictable your revenue inflows are over time. Measures growth trends, seasonal patterns, and income regularity." },
              { dim: "Cashflow Predictability", score: 78, color: "#38BDF8", desc: "How reliably your business generates positive operating cash flow. Tracks the relationship between inflows and outflows month over month." },
              { dim: "Expense Discipline",      score: 81, color: "#818CF8", desc: "How well your business controls operating costs relative to revenue. Identifies runaway expense patterns and margin compression." },
              { dim: "Liquidity Strength",      score: 74, color: "#F59E0B", desc: "The level of cash reserves and financial buffers your business maintains. Measures your ability to absorb short-term obligations." },
              { dim: "Financial Consistency",   score: 88, color: "#00D4FF", desc: "How complete and regular your financial activity and reporting patterns are. Rewards businesses with continuous, well-structured data." },
              { dim: "Risk Profile",            score: 91, color: "#F472B6", desc: "Detects anomalies, irregular behavior, and risk signals in your financial activity. High score means clean, predictable patterns." },
            ].map((d) => (
              <div key={d.dim} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${d.color}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${d.color}12`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.03)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>{d.dim}</h3>
                  <span style={{ fontSize: 22, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{d.score}</span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${d.score}%`, background: d.color, borderRadius: 9999 }} />
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.75 }}>{d.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, background: "#0A2540", borderRadius: 14, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>Plus a separate data quality score</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>Every identity also carries a <code style={{ color: "#00D4FF", background: "rgba(0,212,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>data_quality_score</code> indicating how reliable the underlying financial data is — so capital providers know exactly how much to trust what they see.</p>
            </div>
            <Link href="/financial-identity" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
              Deep dive <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOR BUSINESSES ════════════════════════════════════════ */}
      <section id="for-businesses" aria-labelledby="biz-heading" style={{ padding: "96px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="biz-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            {/* Left copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Building2 size={10} aria-hidden="true" /> For businesses</Badge></div>
              <h2 id="biz-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540", fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", marginBottom: 20, lineHeight: 1.1 }}>
                Stop being invisible<br />to capital providers.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                Most SMEs are declined not because their business isn't viable — but because traditional
                systems can't see how they actually operate. Your bank history, expense patterns, and
                operational data already tell your story. We just verify it.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
                {[
                  { title: "Identity built from multiple data sources", desc: "Bank transactions, accounting ledger data, and operational signals — the more you connect, the stronger your identity." },
                  { title: "Six dimensions, not one number",            desc: "Capital providers see your full financial shape. A great revenue story isn't hidden by a weak credit bureau score." },
                  { title: "You own and control your data",             desc: "Grant specific permissions to specific providers for a defined period. Revoke anytime, instantly, with full audit trail." },
                  { title: "Access 14 capital categories",              desc: "Debt, asset-based, revenue-based, trade, and service capital — matched to your profile by the providers who offer them." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14 }}>
                    <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={12} style={{ color: "white" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 3 }}>{f.title}</p>
                      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/for-businesses" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                See business features <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {/* Right — capital readiness card */}
            <div>
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Capital Readiness Assessment</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 20 }}>Across 14 financing categories</p>

                {[
                  { type: "Working Capital Loan",     cat: "Debt",          score: 88, c: "#10B981", bg: "#ECFDF5", status: "Ready"     },
                  { type: "Invoice Financing",         cat: "Revenue-based", score: 76, c: "#10B981", bg: "#ECFDF5", status: "Ready"     },
                  { type: "Trade Credit",              cat: "Trade",         score: 71, c: "#10B981", bg: "#ECFDF5", status: "Ready"     },
                  { type: "Revenue Advance",           cat: "Revenue-based", score: 65, c: "#F59E0B", bg: "#FFFBEB", status: "Review"    },
                  { type: "Equipment Financing",       cat: "Asset-based",   score: 54, c: "#F59E0B", bg: "#FFFBEB", status: "Review"    },
                  { type: "Receivables Purchase",      cat: "Revenue-based", score: 42, c: "#EF4444", bg: "#FEF2F2", status: "Not ready" },
                ].map((r) => (
                  <div key={r.type} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{r.type}</span>
                          <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 6 }}>{r.cat}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.c, background: r.bg, padding: "2px 9px", borderRadius: 9999 }}>{r.status}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6" }}>
                        <div style={{ height: "100%", width: `${r.score}%`, background: r.c, borderRadius: 9999 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0A2540", width: 28, textAlign: "right", flexShrink: 0, fontFamily: "var(--font-display)" }}>{r.score}</span>
                  </div>
                ))}

                <div style={{ marginTop: 20, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>2 capital providers matched</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Grant consent to receive their offers</p>
                  </div>
                  <Link href="/register" style={{ background: "#0A2540", color: "white", padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Review →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOR CAPITAL PROVIDERS ════════════════════════════════ */}
      <section id="for-financers" aria-labelledby="fin-heading" style={{ padding: "96px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="fin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — discovery panel */}
            <div>
              <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div style={{ background: "#071a2e", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Discovery — Matched to your criteria</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>127 verified businesses</p>
                  </div>
                  <span style={{ fontSize: 11, color: "#00D4FF", fontWeight: 600, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "3px 10px", borderRadius: 9999 }}>Live</span>
                </div>

                {[
                  { name: "Aduke Bakeries Ltd.",    sector: "Food & Beverage",  score: 742, risk: "Low",    rc: "#10B981", type: "Working Capital",  provType: "Lender"              },
                  { name: "Lagosfresh Produce",      sector: "Agriculture",      score: 721, risk: "Low",    rc: "#10B981", type: "Invoice Finance",   provType: "Revenue financer"    },
                  { name: "Buildwise Contractors",   sector: "Construction",     score: 698, risk: "Medium", rc: "#F59E0B", type: "Equipment Loan",    provType: "Equipment financier" },
                  { name: "TechServe Solutions",     sector: "Technology",       score: 715, risk: "Low",    rc: "#10B981", type: "Trade Credit",      provType: "Trade supplier"      },
                  { name: "Nour Fashion Hub",        sector: "Retail",           score: 681, risk: "Medium", rc: "#F59E0B", type: "Revenue Advance",   provType: "Revenue financer"    },
                ].map((b, i, arr) => (
                  <div key={b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(255,255,255,0.02)", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)", marginBottom: 2 }}>{b.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{b.sector} · {b.type}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{b.score}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: b.rc, background: `${b.rc}18`, padding: "2px 8px", borderRadius: 9999, marginTop: 4, display: "inline-block" }}>{b.risk} Risk</span>
                    </div>
                  </div>
                ))}

                <div style={{ background: "#071a2e", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>+122 more match your criteria</p>
                  <Link href="/financer/register" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", padding: "5px 12px", borderRadius: 7 }}>
                    View all <ChevronRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Layers size={10} aria-hidden="true" /> For capital providers</Badge></div>
              <h2 id="fin-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "white", fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", marginBottom: 20, lineHeight: 1.1 }}>
                Underwrite on<br />
                <span style={{ color: "#00D4FF" }}>verified behavior.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36, maxWidth: 420 }}>
                Whether you're a lender, equipment financier, trade supplier, or revenue financier —
                Creditlinker gives you access to verified financial identities built from real banking
                and operational data. Six independent financial dimensions. No self-reporting. Full provenance on every metric.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
                {[
                  { title: "Verified, multi-source data",    desc: "Bank transactions, ledger data, and operational signals — normalized, reconciled, and stored with full data provenance." },
                  { title: "Six-dimensional profiles",       desc: "Evaluate the full shape of a business. Don't let one weak dimension hide four strong ones." },
                  { title: "Your criteria, your matches",    desc: "Define your risk appetite, capital category, sector, and ticket size. The matching engine surfaces the right businesses automatically." },
                  { title: "Consent-gated, audit-logged",   desc: "Access only what the business grants. Every query is logged. Full compliance trail for every financing decision." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14 }}>
                    <div aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#00D4FF" }}>
                      <CheckCircle2 size={11} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "white", marginBottom: 4 }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/financer/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
                  Evaluate businesses <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.12)", padding: "12px 20px", borderRadius: 10 }}>
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECURITY ══════════════════════════════════════════════ */}
      <section aria-labelledby="sec-heading" style={{ padding: "96px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}><Badge><Lock size={10} aria-hidden="true" /> Security & Privacy</Badge></div>
          <h2 id="sec-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540", fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", marginBottom: 16 }}>Built on trust.</h2>
          <p style={{ fontSize: 16, color: "#4B5563", maxWidth: 480, margin: "0 auto 64px", lineHeight: 1.78 }}>
            Your financial data belongs to you. We enforce strict consent controls, bank-grade encryption, and complete audit trails on every data access.
          </p>
          <div className="security-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, textAlign: "left" }}>
            {[
              { icon: <Lock size={22} aria-hidden="true" style={{ color: "#00D4FF" }} />,       title: "Bank-grade encryption",    desc: "AES-256 at rest, TLS 1.3 in transit. We never store raw bank credentials — only normalized, enriched data with your explicit consent.", detail: "SOC 2 Type II compliant" },
              { icon: <ShieldCheck size={22} aria-hidden="true" style={{ color: "#00D4FF" }} />, title: "Consent-first model",      desc: "You define exactly who sees which dimensions of your identity, and for how long. Every grant has a hard expiry. Revoke any provider instantly.", detail: "You're always in control" },
              { icon: <Database size={22} aria-hidden="true" style={{ color: "#00D4FF" }} />,    title: "Immutable audit trail",    desc: "Every data access is logged with actor, timestamp, action type, and purpose. A complete, tamper-proof record of every interaction with your identity.", detail: "Full provenance on all data" },
            ].map((s) => (
              <div key={s.title} style={{ borderRadius: 18, border: "1px solid #E5E7EB", padding: 28, transition: "border-color 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(0,212,255,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 13, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#0A2540", marginBottom: 12, letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.78, marginBottom: 20 }}>{s.desc}</p>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#00D4FF", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={11} aria-hidden="true" />{s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" style={{ padding: "96px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 900px 500px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "white", fontSize: "clamp(32px,4.5vw,54px)", letterSpacing: "-0.04em", marginBottom: 20 }}>
            Build your financial identity.<br />
            <span style={{ color: "#00D4FF" }}>Access the capital you deserve.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 48, lineHeight: 1.78 }}>
            Join hundreds of African SMEs who have built verified financial identities and connected
            to lenders, equipment financiers, trade suppliers, and revenue financiers — based on how
            their business actually operates.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
              Build my financial identity <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/financer/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.65)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: 10 }}>
              I&apos;m a capital provider →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
