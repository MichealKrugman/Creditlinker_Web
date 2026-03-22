import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Banknote,
  Lock,
  BarChart3,
  Eye,
  ArrowUpRight,
  Layers,
  Landmark,
  TrendingUp,
  Database,
  RefreshCw,
  Star,
  AlertCircle,
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

function SectionHeading({ id, badge, title, sub, center = false, dark = false }: { id?: string; badge?: React.ReactNode; title: React.ReactNode; sub?: string; center?: boolean; dark?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 56 }}>
      {badge && <div style={{ marginBottom: 16 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: dark ? "white" : "#0A2540", lineHeight: 1.1, marginBottom: sub ? 16 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: dark ? "rgba(255,255,255,0.5)" : "#4B5563", lineHeight: 1.78, maxWidth: center ? 580 : 520, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP ROW (timeline)
───────────────────────────────────────────────────────── */
function TimelineStep({ n, icon, title, desc, detail, last = false, dark = false }: { n: string; icon: React.ReactNode; title: string; desc: string; detail?: string; last?: boolean; dark?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 22 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: dark ? "rgba(0,212,255,0.12)" : "#0A2540", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1px rgba(0,212,255,${dark ? "0.25" : "0.18"})`, position: "relative" }}>
          {icon}
          <span style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#00D4FF", color: "#0A2540", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)" }}>{n}</span>
        </div>
        {!last && <div style={{ width: 2, flex: 1, minHeight: 40, marginTop: 8, background: `linear-gradient(to bottom, rgba(0,212,255,${dark ? "0.3" : "0.22"}), rgba(0,212,255,0.04))` }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 44, flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: dark ? "white" : "#0A2540", letterSpacing: "-0.025em", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: dark ? "rgba(255,255,255,0.45)" : "#4B5563", lineHeight: 1.78, marginBottom: detail ? 12 : 0 }}>{desc}</p>
        {detail && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: dark ? "rgba(0,212,255,0.08)" : "#F0FDFF", border: `1px solid rgba(0,212,255,${dark ? "0.2" : "0.18"})`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: dark ? "#00D4FF" : "#0A5060", fontWeight: 500 }}>
            <CheckCircle2 size={12} aria-hidden="true" style={{ color: "#00D4FF", flexShrink: 0 }} />{detail}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CHECK ITEM
───────────────────────────────────────────────────────── */
function CheckItem({ title, desc, dark = false }: { title: string; desc: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: dark ? "rgba(0,212,255,0.10)" : "rgba(0,212,255,0.10)", border: `1px solid rgba(0,212,255,${dark ? "0.25" : "0.22"})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#00D4FF" }}>
        <CheckCircle2 size={12} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: dark ? "white" : "#0A2540", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.72 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DIMENSION BAR (compact)
───────────────────────────────────────────────────────── */
function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{value}</span>
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 9999 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BUSINESS ROW (discovery panel)
───────────────────────────────────────────────────────── */
function BusinessRow({ name, sector, type, score, risk, rc, providerType, last = false }: { name: string; sector: string; type: string; score: number; risk: string; rc: string; providerType: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(255,255,255,0.02)", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)", marginBottom: 3 }}>{name}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{sector} · {type} · <span style={{ color: "rgba(0,212,255,0.6)" }}>{providerType}</span></p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{score}</p>
        <span style={{ fontSize: 10, fontWeight: 700, color: rc, background: `${rc}18`, padding: "2px 8px", borderRadius: 9999, marginTop: 4, display: "inline-block" }}>{risk} Risk</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROVIDER TYPE CARD
───────────────────────────────────────────────────────── */
function ProviderCard({ icon, type, desc, examples, dark = false }: { icon: React.ReactNode; type: string; desc: string; examples: string[]; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 16, padding: 24 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 16 }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "white" : "#0A2540", marginBottom: 8, letterSpacing: "-0.02em" }}>{type}</h3>
      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.72, marginBottom: 14 }}>{desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map((e) => (
          <span key={e} style={{ fontSize: 11, fontWeight: 600, color: dark ? "rgba(0,212,255,0.8)" : "#0A5060", background: dark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.06)", border: `1px solid ${dark ? "rgba(0,212,255,0.18)" : "rgba(0,212,255,0.15)"}`, padding: "2px 9px", borderRadius: 9999 }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ForFinancersPage() {
  const businesses = [
    { name: "Aduke Bakeries Ltd.",    sector: "Food & Beverage",  type: "Working Capital",  score: 742, risk: "Low",    rc: "#10B981", providerType: "Financer"             },
    { name: "Lagosfresh Produce",     sector: "Agriculture",      type: "Invoice Finance",  score: 721, risk: "Low",    rc: "#10B981", providerType: "Revenue financer"    },
    { name: "Buildwise Contractors",  sector: "Construction",     type: "Equipment Financing", score: 698, risk: "Medium", rc: "#F59E0B", providerType: "Equipment financier" },
    { name: "TechServe Solutions",    sector: "Technology",       type: "Revenue Advance",  score: 715, risk: "Low",    rc: "#10B981", providerType: "Revenue financer"    },
    { name: "Nour Fashion Hub",       sector: "Retail",           type: "Trade Credit",     score: 681, risk: "Medium", rc: "#F59E0B", providerType: "Trade supplier"      },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .ff-hero-grid    { grid-template-columns: 1fr !important; }
          .ff-type-grid    { grid-template-columns: 1fr 1fr !important; }
          .ff-journey-grid { grid-template-columns: 1fr !important; }
          .ff-data-grid    { grid-template-columns: 1fr !important; }
          .ff-consent-grid { grid-template-columns: 1fr !important; }
          .ff-workflow-grid{ grid-template-columns: 1fr !important; }
          .ff-sticky       { position: static !important; }
        }
        @media (max-width: 600px) {
          .ff-type-grid    { grid-template-columns: 1fr !important; }
          .ff-cta-btns     { flex-direction: column !important; align-items: stretch !important; }
          .ff-match-strip  { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .ff-match-strip a { text-align: center !important; justify-content: center !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Page hero" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 900px 600px at 70% -60px, rgba(0,212,255,0.07) 0%, transparent 60%),#ffffff", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg light />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 520px", gap: 72, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <Badge>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  For capital providers
                </Badge>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(38px,4.8vw,62px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.06, marginBottom: 22 }}>
                Underwrite on<br />verified behavior,<br />
                <span style={{ background: "linear-gradient(90deg, #00D4FF, #38BDF8, #0A2540, #00D4FF)", backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer-text 5s linear infinite" }}>
                  not paperwork.
                </span>
              </h1>
              <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, marginBottom: 36, maxWidth: 520 }}>
                Creditlinker gives financers, equipment financiers, trade suppliers, and revenue
                financers access to verified, six-dimensional financial identities built from real
                bank transactions, accounting ledger data, and operational records — with full data
                provenance and consent-gated access.
              </p>
              <div className="ff-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)" }}>
                  Register as a provider <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
                  See how it works
                </a>
              </div>

              {/* Proof strip */}
              <div style={{ display: "flex", alignItems: "center", gap: 28, paddingTop: 28, borderTop: "1px solid #E5E7EB", flexWrap: "wrap" }}>
                {[
                  { v: "500+",   l: "Verified businesses"  },
                  { v: "6",      l: "Financial dimensions"  },
                  { v: "14",     l: "Capital categories"    },
                  { v: "100%",   l: "Consent-gated access"  },
                ].map((s, i, arr) => (
                  <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.v}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>{s.l}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — discovery panel */}
            <div>
              <div style={{ background: "linear-gradient(160deg, #0e2d4e 0%, #071a2e 100%)", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
                <GridBg />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Discovery · Matched to your criteria</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>127 verified businesses</p>
                  </div>
                  <span style={{ fontSize: 11, color: "#00D4FF", fontWeight: 600, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "3px 10px", borderRadius: 9999 }}>Live</span>
                </div>

                {businesses.map((b, i) => (
                  <BusinessRow key={b.name} {...b} last={i === businesses.length - 1} />
                ))}

                <div style={{ background: "#071a2e", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>+122 more match your criteria</p>
                  <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", padding: "5px 12px", borderRadius: 7 }}>
                    View all <ChevronRight size={13} aria-hidden="true" />
                  </Link>
                </div>

                {/* Floating offer card */}
                <div style={{ margin: "0 16px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 10 }}>Offer created · Aduke Bakeries Ltd.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "Type",   v: "Working Capital" },
                      { l: "Amount", v: "₦5,000,000"      },
                      { l: "Rate",   v: "24% p.a."        },
                      { l: "Tenor",  v: "12 months"       },
                    ].map((t) => (
                      <div key={t.l}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>{t.l}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>{t.v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#10B981" }}>Accepted by business</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROVIDER TYPES ════════════════════════════════════════ */}
      <section aria-labelledby="types-heading" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="types-heading"
            badge={<Badge><Landmark size={10} aria-hidden="true" /> Who this is for</Badge>}
            title={<>Built for every type<br />of capital provider.</>}
            sub="Creditlinker is not a lending marketplace. It's infrastructure. Any institution that evaluates business financial health before deploying capital can use it."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <ProviderCard
              icon={<Banknote size={20} aria-hidden="true" />}
              type="Financers"
              desc="Banks, microfinance institutions, and credit funds evaluating businesses for debt capital facilities."
              examples={["Working capital", "Term financing", "Overdraft"]}
            />
            <ProviderCard
              icon={<Layers size={20} aria-hidden="true" />}
              type="Equipment financiers"
              desc="Institutions financing physical assets — machinery, vehicles, and production equipment for growing businesses."
              examples={["Equipment financing", "Asset leasing", "Hire purchase"]}
            />
            <ProviderCard
              icon={<TrendingUp size={20} aria-hidden="true" />}
              type="Revenue financers"
              desc="Funds and platforms that advance capital against future revenue — invoices, receivables, or projected cashflow."
              examples={["Invoice finance", "Revenue advance", "Receivables purchase"]}
            />
            <ProviderCard
              icon={<Star size={20} aria-hidden="true" />}
              type="Trade suppliers"
              desc="Suppliers and distributors extending payment terms or credit lines based on verified business financial health."
              examples={["Trade credit", "Supplier finance", "Deferred payment"]}
            />
          </div>
        </div>
      </section>

      {/* ══ THE DATA ══════════════════════════════════════════════ */}
      <section aria-labelledby="data-heading" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "40%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Database size={10} aria-hidden="true" /> The data</Badge></div>
              <h2 id="data-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
                Six dimensions.<br />
                <span style={{ color: "#00D4FF" }}>Real evidence.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36, maxWidth: 460 }}>
                Every financial identity is built from three data source types, processed through
                a seven-stage pipeline, and stored in a financial feature store that computes 40+
                derived metrics. You evaluate the full shape of a business — not a single number.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
                {[
                  { title: "Three verified data source types", desc: "Bank transaction history via Mono Open Banking, accounting ledger data, and operational signals — equipment, inventory, contracts, receivables." },
                  { title: "Six independent financial dimensions", desc: "Revenue Stability, Cashflow Predictability, Expense Discipline, Liquidity Strength, Financial Consistency, and Risk Profile — each scored 0–100 independently." },
                  { title: "Separate data quality score", desc: "Every identity carries a data_quality_score so you know exactly how reliable the underlying data is before making a decision." },
                  { title: "Full metric provenance", desc: "Every computed metric traces back to its source transactions, account origin, and analysis period. No black boxes." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} dark />)}
              </div>
            </div>

            {/* Right — identity card mockup */}
            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Financial Identity · Verified</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>Aduke Bakeries Ltd.</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#00D4FF", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>742</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>Low Risk</p>
                  </div>
                </div>

                {/* 6 dimensions */}
                <div style={{ padding: "18px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 14 }}>6 financial dimensions</p>
                  <DimBar label="Revenue Stability"       value={85} color="#10B981" />
                  <DimBar label="Cashflow Predictability" value={78} color="#38BDF8" />
                  <DimBar label="Expense Discipline"      value={81} color="#818CF8" />
                  <DimBar label="Liquidity Strength"      value={74} color="#F59E0B" />
                  <DimBar label="Financial Consistency"   value={88} color="#00D4FF" />
                  <DimBar label="Risk Profile"            value={91} color="#F472B6" />
                </div>

                {/* Data quality + provenance */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>Data quality score</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>94</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>High reliability</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>Data coverage</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>18mo</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>3 bank accounts</p>
                  </div>
                </div>

                {/* Key metrics */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>Feature store metrics</p>
                  {[
                    { label: "Avg monthly revenue",   value: "₦4.2M"    },
                    { label: "Revenue growth (6mo)",  value: "+12%"      },
                    { label: "Operating margin",       value: "31%"       },
                    { label: "Cash reserve ratio",     value: "2.4x"      },
                    { label: "Receivable turnover",   value: "18 days"   },
                    { label: "Client concentration",  value: "Low"        },
                  ].map((m, i) => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section id="how-it-works" aria-labelledby="hiw-heading" style={{ padding: "88px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-journey-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Left — steps */}
            <div>
              <SectionHeading
                id="hiw-heading"
                badge={<Badge><RefreshCw size={10} aria-hidden="true" /> Your journey</Badge>}
                title={<>From registration<br />to financing offer.</>}
                sub="Five steps to start evaluating verified businesses and deploying capital through Creditlinker."
              />
              <TimelineStep n="1" icon={<Landmark size={18} aria-hidden="true" />}
                title="Register your institution"
                desc="Create your institution profile with your financing mandate — capital category, sectors you serve, ticket size range, and minimum identity score threshold."
                detail="Verified institution onboarding"
              />
              <TimelineStep n="2" icon={<Layers size={18} aria-hidden="true" />}
                title="Define your matching criteria"
                desc="Post your criteria once. The Creditlinker discovery engine continuously evaluates the platform's verified business identities against your parameters and surfaces matching businesses anonymously — without exposing any individual's data."
                detail="Automatic, continuous matching"
              />
              <TimelineStep n="3" icon={<Eye size={18} aria-hidden="true" />}
                title="Request consent from matched businesses"
                desc="Send a consent request specifying the permissions you need — identity score, full profile, or transaction detail. The business reviews your request and grants or denies access with their own time limit and scope."
                detail="Business retains full control"
              />
              <TimelineStep n="4" icon={<ShieldCheck size={18} aria-hidden="true" />}
                title="Evaluate the verified financial identity"
                desc="Access the business's six financial dimensions, data quality score, 40+ feature store metrics, capital readiness assessment, and risk flags — all derived from verified data with full provenance. Every query is logged."
              />
              <TimelineStep n="5" icon={<Banknote size={18} aria-hidden="true" />}
                title="Create and track financing offers"
                desc="Structure your offer on-platform with capital type, amount, rate, tenor, and repayment terms. The business accepts or declines. Financing records are immutable and contribute to your institution's reputation score on the platform."
                last
              />

              <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#0A2540", marginTop: 12, textDecoration: "underline", textUnderlineOffset: 4 }}>
                Full platform walkthrough <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* Right — sticky offer panel */}
            <div className="ff-sticky" style={{ position: "sticky", top: 88 }}>
              <div style={{ borderRadius: 18, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 8px 48px rgba(0,0,0,0.06)" }}>
                {/* Criteria panel */}
                <div style={{ background: "#0A2540", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Your matching criteria</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>FastCash Microfinance</p>
                </div>
                <div style={{ background: "white" }}>
                  {[
                    { label: "Capital category",    value: "Debt · Working capital" },
                    { label: "Min identity score",  value: "680 / 1000"             },
                    { label: "Ticket size",         value: "₦1M – ₦20M"            },
                    { label: "Sectors",             value: "Food · Agri · Retail"   },
                    { label: "Risk appetite",       value: "Low to Medium"          },
                    { label: "Data coverage min",   value: "12 months"              },
                  ].map((c, i) => (
                    <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < 5 ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{c.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.value}</span>
                    </div>
                  ))}
                </div>

                {/* Match result */}
                <div className="ff-match-strip" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Businesses matched</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#0A2540", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>127</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Consent granted</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: "#10B981", lineHeight: 1, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>14</p>
                  </div>
                  <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0A2540", color: "white", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                    Get started <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Access log snippet */}
              <div style={{ marginTop: 16, background: "#0A2540", borderRadius: 14, padding: "16px 20px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>Audit log · All access events</p>
                {[
                  { action: "Viewed identity profile",    biz: "Aduke Bakeries",   t: "2h ago" },
                  { action: "Viewed 6D score breakdown",  biz: "Lagosfresh Prod.", t: "3h ago" },
                  { action: "Created offer ₦5M",          biz: "Aduke Bakeries",   t: "1h ago" },
                  { action: "Consent request sent",       biz: "TechServe Ltd.",   t: "4h ago" },
                ].map((e) => (
                  <div key={e.action + e.t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4FF", flexShrink: 0, display: "inline-block" }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{e.action}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{e.biz}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginLeft: 10 }}>{e.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONSENT & COMPLIANCE ══════════════════════════════════ */}
      <section aria-labelledby="consent-heading" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-consent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — copy */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Lock size={10} aria-hidden="true" /> Consent & compliance</Badge></div>
              <h2 id="consent-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                Every access event<br />is logged and<br />
                <span style={{ color: "#00D4FF" }}>auditable.</span>
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                Creditlinker's consent model is designed for regulatory compliance from the ground
                up. Every data access is explicit, time-bounded, and logged in an immutable audit
                trail. No business data is accessible without active consent — and no consent
                persists beyond its agreed expiry.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { title: "Business-controlled permissions",  desc: "Each business grants specific permission scopes — score, identity profile, or transaction detail — independently per provider. You only see what you're granted." },
                  { title: "Hard consent expiry",              desc: "Every access grant has a defined expiry. When it lapses, access ends automatically. No manual revocation required from either party." },
                  { title: "Real-time revocation",             desc: "A business can revoke your access at any time. Your access is terminated immediately — no grace period, no cached data." },
                  { title: "Immutable audit trail",            desc: "Every query you make — score views, identity reads, offer creation — is logged with timestamp, actor, and action. Full compliance evidence for every financing decision." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} />)}
              </div>
            </div>

            {/* Right — permission UI */}
            <div>
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Your access grant</p>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540" }}>Aduke Bakeries Ltd.</p>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 9999 }}>
                    <CheckCircle2 size={10} aria-hidden="true" /> Active
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>Granted 14 Mar 2026 · Expires 14 Jun 2026 · 90 day grant</p>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Your permissions</p>
                  {[
                    { label: "View identity score (0–1000)",       granted: true  },
                    { label: "View 6-dimensional breakdown",        granted: true  },
                    { label: "View full identity profile",          granted: true  },
                    { label: "View transaction detail",             granted: false },
                    { label: "Create financing offer",              granted: true  },
                    { label: "Subscribe to score change alerts",    granted: false },
                  ].map((p) => (
                    <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{p.label}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: p.granted ? "#10B981" : "#9CA3AF", background: p.granted ? "#ECFDF5" : "#F9FAFB", border: `1px solid ${p.granted ? "rgba(16,185,129,0.2)" : "#E5E7EB"}`, padding: "2px 9px", borderRadius: 9999 }}>
                        {p.granted ? <><CheckCircle2 size={10} aria-hidden="true" /> Granted</> : <><Lock size={10} aria-hidden="true" /> Restricted</>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Access log */}
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Your access log · This business</p>
                  {[
                    { a: "Viewed identity score",       t: "2h ago" },
                    { a: "Viewed identity profile",     t: "2h ago" },
                    { a: "Viewed 6D breakdown",         t: "2h ago" },
                    { a: "Created offer ₦5,000,000",   t: "1h ago" },
                  ].map((e) => (
                    <div key={e.a} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: "50%", background: "#00D4FF", display: "inline-block" }} />
                        {e.a}
                      </span>
                      <span style={{ color: "#9CA3AF" }}>{e.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ REPUTATION ════════════════════════════════════════════ */}
      <section aria-labelledby="rep-heading" style={{ padding: "88px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Star size={10} aria-hidden="true" /> Reputation system</Badge></div>
              <h2 id="rep-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                Your institution<br />builds reputation too.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                Creditlinker tracks reputation signals for both businesses and capital providers.
                The better you perform as a financing partner — completing deals, confirming
                settlements, resolving disputes fairly — the stronger your institution's standing
                on the platform becomes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { title: "Deal completion rate",          desc: "The ratio of offers accepted and successfully settled vs opened. Tracks your reliability as a capital partner." },
                  { title: "Settlement confirmation",       desc: "How reliably you confirm repayment settlements against bank-verified transaction data. Delayed confirmations lower your score." },
                  { title: "Dispute behavior",              desc: "How disputes you initiate or are subject to are resolved. Fair, platform-verified resolutions strengthen your record." },
                  { title: "Capital deployment history",    desc: "Volume, frequency, and diversity of capital deployed across business types. Demonstrates active, committed participation." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} />)}
              </div>
            </div>

            {/* Right — reputation card */}
            <div>
              <div style={{ background: "#0A2540", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(10,37,64,0.18), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
                <GridBg />
                <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Institution reputation</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>FastCash Microfinance</p>
                </div>

                {/* Reputation metrics */}
                <div style={{ padding: "18px 22px" }}>
                  {[
                    { label: "Deal completion rate",       value: "94%",  color: "#10B981", bar: 94 },
                    { label: "Settlement confirmation",    value: "98%",  color: "#38BDF8", bar: 98 },
                    { label: "Dispute resolution",         value: "91%",  color: "#818CF8", bar: 91 },
                    { label: "Capital deployment score",   value: "87%",  color: "#F59E0B", bar: 87 },
                  ].map((m) => (
                    <div key={m.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                        <span>{m.label}</span>
                        <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                        <div style={{ height: "100%", width: `${m.bar}%`, background: m.color, borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portfolio summary */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 22px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { l: "Active deals",     v: "14"    },
                    { l: "Total deployed",   v: "₦84M"  },
                    { l: "Platform rank",    v: "Top 5%" },
                  ].map((m, i) => (
                    <div key={m.l} style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingRight: i < 2 ? 12 : 0 }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>{m.l}</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHY CREDITLINKER ══════════════════════════════════════ */}
      <section aria-labelledby="why-heading" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 500px at 30% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="why-heading"
            badge={<Badge><AlertCircle size={10} aria-hidden="true" /> Why it matters</Badge>}
            title={<>Stop underwriting blind.</>}
            sub="The African SME financing gap exists partly because of information asymmetry — businesses have strong financial behavior that providers can't see. Creditlinker closes that gap."
            center
            dark
          />

          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              {
                icon: <Database size={20} aria-hidden="true" />,
                title: "Verified, not self-reported",
                desc: "Every metric in a Creditlinker identity is derived from raw financial data — bank transactions, ledger records, operational signals — processed through a deterministic pipeline. No self-reported documents. No projections.",
              },
              {
                icon: <BarChart3 size={20} aria-hidden="true" />,
                title: "Six dimensions, not one score",
                desc: "A business with strong revenue stability and expense discipline might have lower liquidity strength. Seeing all six dimensions independently lets you make a nuanced evaluation — not a binary approve/decline.",
              },
              {
                icon: <ShieldCheck size={20} aria-hidden="true" />,
                title: "Provenance on everything",
                desc: "Every computed metric traces back to its source transactions, account origin, and analysis period. You can validate what you're seeing and defend your underwriting decision with a full evidence trail.",
              },
            ].map((f) => (
              <ProviderCard
                key={f.title}
                icon={f.icon}
                type={f.title}
                desc={f.desc}
                examples={[]}
                dark
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ background: "#0A2540", borderRadius: 24, padding: "64px 64px", position: "relative", overflow: "hidden", textAlign: "center" }}>
            <GridBg />
            <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 700px 400px at 50% 50%, rgba(0,212,255,0.08) 0%, transparent 70%)" }} />

            <div style={{ position: "relative" }}>
              <div style={{ marginBottom: 20 }}>
                <Badge><Landmark size={10} aria-hidden="true" /> For capital providers</Badge>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.04em", color: "white", marginBottom: 18, lineHeight: 1.1 }}>
                Start evaluating businesses<br />with <span style={{ color: "#00D4FF" }}>real evidence.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 44, lineHeight: 1.78, maxWidth: 560, margin: "0 auto 44px" }}>
                Register your institution, define your criteria, and let the matching engine surface
                verified businesses that fit your mandate. The first consent grant you receive is
                waiting on the other side of signup.
              </p>
              <div className="ff-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
                  Register as a provider <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.14)", padding: "13px 22px", borderRadius: 10 }}>
                  Talk to the team
                </Link>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>
                Verified institution onboarding · Consent-gated access from day one · Full audit trail
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
