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

/* -----------------------------------------------------------------
   PRIMITIVES
----------------------------------------------------------------- */

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

function TimelineStep({ n, icon, title, desc, last = false, dark = false }: { n: string; icon: React.ReactNode; title: string; desc: string; last?: boolean; dark?: boolean }) {
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
        <p style={{ fontSize: 14, color: dark ? "rgba(255,255,255,0.45)" : "#4B5563", lineHeight: 1.78 }}>{desc}</p>
      </div>
    </div>
  );
}

function CheckItem({ title, desc, dark = false }: { title: string; desc: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,212,255,0.10)", border: `1px solid rgba(0,212,255,${dark ? "0.25" : "0.22"})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, color: "#00D4FF" }}>
        <CheckCircle2 size={12} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: dark ? "white" : "#0A2540", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.72 }}>{desc}</p>
      </div>
    </div>
  );
}

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

function ProviderCard({ icon, type, desc, examples, dark = false }: { icon: React.ReactNode; type: string; desc: string; examples: string[]; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 16, padding: 24 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 16 }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "white" : "#0A2540", marginBottom: 8, letterSpacing: "-0.02em" }}>{type}</h3>
      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.72, marginBottom: examples.length ? 14 : 0 }}>{desc}</p>
      {examples.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {examples.map((e) => (
            <span key={e} style={{ fontSize: 11, fontWeight: 600, color: dark ? "rgba(0,212,255,0.8)" : "#0A5060", background: dark ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.06)", border: `1px solid ${dark ? "rgba(0,212,255,0.18)" : "rgba(0,212,255,0.15)"}`, padding: "2px 9px", borderRadius: 9999 }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------
   PAGE
----------------------------------------------------------------- */
export default function ForFinancersPage() {
  const businesses = [
    { name: "Aduke Bakeries Ltd.",    sector: "Food & Beverage",  type: "Working Capital",     score: 742, risk: "Low",    rc: "#10B981", providerType: "Financer"          },
    { name: "Lagosfresh Produce",     sector: "Agriculture",      type: "Invoice Financing",   score: 721, risk: "Low",    rc: "#10B981", providerType: "Revenue financer"  },
    { name: "Buildwise Contractors",  sector: "Construction",     type: "Equipment Financing", score: 698, risk: "Medium", rc: "#F59E0B", providerType: "Equipment financer"},
    { name: "TechServe Solutions",    sector: "Technology",       type: "Revenue Advance",     score: 715, risk: "Low",    rc: "#10B981", providerType: "Revenue financer"  },
    { name: "Nour Fashion Hub",       sector: "Retail",           type: "Trade Credit",        score: 681, risk: "Medium", rc: "#F59E0B", providerType: "Trade supplier"    },
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
          .ff-sticky       { position: static !important; }
          .ff-hero-panel   { display: none !important; }
        }
        @media (max-width: 600px) {
          .ff-section      { padding: 48px 0 !important; }
          .ff-pad          { padding: 0 20px !important; }
          .ff-type-grid    { grid-template-columns: 1fr !important; }
          .ff-cta-btns     { flex-direction: column !important; align-items: stretch !important; }
          .ff-match-strip  { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .ff-match-strip a { text-align: center !important; justify-content: center !important; }
          .ff-proof-strip  { gap: 16px !important; }
          .ff-hero-btns    { flex-direction: column !important; }
          .ff-hero-btns a  { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }
          .ff-section-heading { margin-bottom: 28px !important; }
          .ff-section-heading p { display: none !important; }
        }
      `}</style>

      {/* HERO */}
      <section aria-label="Page hero" className="ff-section" style={{ position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 900px 600px at 70% -60px, rgba(0,212,255,0.07) 0%, transparent 60%),#ffffff", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg light />
        <div className="ff-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 520px", gap: 72, alignItems: "center" }}>

            <div>
              <div style={{ marginBottom: 20 }}>
                <Badge>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  For capital providers
                </Badge>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(38px,4.8vw,62px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.06, marginBottom: 22 }}>
                Fund real businesses.<br />
                See their numbers.<br />
                <span style={{ color: "#00D4FF" }}>Know what you are getting into.</span>
              </h1>
              <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.78, marginBottom: 36, maxWidth: 520 }}>
                Whether you have ₦50,000 or ₦50 million to put to work, Creditlinker connects you to verified Nigerian businesses that need capital. You see their real financial data, pick how much to put in, choose your risk level, and earn returns as they grow.
              </p>
              <div className="ff-hero-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)" }}>
                  Start financing <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
                  See how it works
                </a>
              </div>

              <div className="ff-proof-strip" style={{ display: "flex", alignItems: "center", gap: 28, paddingTop: 28, borderTop: "1px solid #E5E7EB", flexWrap: "wrap" }}>
                {[
                  { v: "500+",  l: "Verified businesses" },
                  { v: "6",     l: "Financial dimensions" },
                  { v: "14",    l: "Financing categories" },
                  { v: "100%",  l: "Consent-gated access" },
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

            <div className="ff-hero-panel">
              <div style={{ background: "linear-gradient(160deg, #0e2d4e 0%, #071a2e 100%)", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
                <GridBg />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Matched to your criteria</p>
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
                  <div style={{ marginTop: 12 }}>
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#10B981" }}>Accepted by business</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section aria-labelledby="who-heading" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="who-heading"
            badge={<Badge><Landmark size={10} aria-hidden="true" /> Who can be a financer</Badge>}
            title="Anyone can fund a business."
            sub="You do not need to be a bank or a fund. If you have money you want to put to work, and you want to know exactly where it is going, Creditlinker is built for you."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
            <ProviderCard
              icon={<Banknote size={20} aria-hidden="true" />}
              type="Individual financers"
              desc="You start from as little as ₦50,000. You pick a business, see their verified financial numbers, choose how much to put in, and earn returns as they repay. You are not giving a gift. You are financing a real business with real data behind it."
              examples={["From ₦50k per unit", "Pick your risk level", "Diversify across businesses", "12 to 34% returns by risk"]}
            />
            <ProviderCard
              icon={<Landmark size={20} aria-hidden="true" />}
              type="Institutions and funds"
              desc="Banks, microfinance institutions, equipment financiers, and trade suppliers. You get access to verified six-dimensional business profiles and deploy capital at scale. Every access event is logged. Every decision has an evidence trail."
              examples={["Working capital", "Equipment financing", "Invoice and revenue finance", "Trade credit"]}
            />
          </div>
        </div>
      </section>

      {/* PROVIDER TYPES */}
      <section aria-labelledby="types-heading" className="ff-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="types-heading"
            badge={<Badge><Landmark size={10} aria-hidden="true" /> Types of financing</Badge>}
            title="Not all financing is the same."
            sub="Creditlinker covers five types of financing, each with its own repayment source and protection structure. You pick what fits your mandate."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <ProviderCard
              icon={<Banknote size={20} aria-hidden="true" />}
              type="Financers"
              desc="Fund businesses directly for working capital, operations, or growth. Repayment comes from cashflow."
              examples={["Working capital", "Term financing", "Overdraft"]}
            />
            <ProviderCard
              icon={<Layers size={20} aria-hidden="true" />}
              type="Equipment financiers"
              desc="Finance the purchase of machines, vehicles, and equipment. The asset itself backs the deal."
              examples={["Equipment financing", "Asset leasing", "Hire purchase"]}
            />
            <ProviderCard
              icon={<TrendingUp size={20} aria-hidden="true" />}
              type="Revenue financers"
              desc="Advance capital against future revenue. Security comes from verified invoices or projected cashflow."
              examples={["Invoice finance", "Revenue advance", "Receivables purchase"]}
            />
            <ProviderCard
              icon={<Star size={20} aria-hidden="true" />}
              type="Trade suppliers"
              desc="Extend payment terms or credit lines to buyers you already have a commercial relationship with."
              examples={["Trade credit", "Supplier finance", "Deferred payment"]}
            />
          </div>
        </div>
      </section>

      {/* HOW UNITS WORK */}
      <section aria-labelledby="frac-heading" className="ff-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "20%", left: "-6%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div className="ff-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <div style={{ marginBottom: 20 }}><Badge><Layers size={10} aria-hidden="true" /> How financing units work</Badge></div>
              <h2 id="frac-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
                Each financing deal<br />
                <span style={{ color: "#00D4FF" }}>is split into units.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36 }}>
                No single person funds an entire deal alone. A ₦5 million financing is broken into 100 units of ₦50,000 each. Multiple financers buy in. If the business has trouble repaying, no single person carries the full weight.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { title: "No one person carries the risk alone", desc: "If a business stops repaying, the impact is shared across all unit holders. One default does not destroy one investor." },
                  { title: "You control how much you put in", desc: "Buy 1 unit (₦50k) or 10 units (₦500k). Mix across different businesses, financing types, and risk levels." },
                  { title: "Harder to game the system", desc: "Because capital comes in small slices from many people, no single financer is a big target. Each unit is independently tracked." },
                  { title: "Returns are priced by the market", desc: "Safer deals get funded faster. Riskier ones attract higher return demands. The platform reflects real risk, not flat pricing." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} dark />)}
              </div>
            </div>
            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Financing unit breakdown · Aduke Bakeries Ltd.</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>Working Capital · ₦5,000,000 total</p>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  {[
                    { label: "Unit size",          value: "₦50,000" },
                    { label: "Total units",         value: "100 units" },
                    { label: "Reserve per unit",    value: "₦5,000 (10%)" },
                    { label: "Active unit holders", value: "87 financers" },
                    { label: "Units available",     value: "13 units left" },
                  ].map((row, i) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 10 }}>Units by risk level</p>
                  {[
                    { tranche: "Safe",        units: 45, color: "#10B981", pct: "45%" },
                    { tranche: "Balanced",    units: 30, color: "#F59E0B", pct: "30%" },
                    { tranche: "High-return", units: 12, color: "#EF4444", pct: "12%" },
                  ].map((t) => (
                    <div key={t.tranche} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
                        <span>{t.tranche}</span>
                        <span style={{ color: t.color, fontWeight: 700 }}>{t.units} units ({t.pct})</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 9999, background: "rgba(255,255,255,0.07)" }}>
                        <div style={{ height: "100%", width: t.pct, background: t.color, borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 9, padding: "10px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Your position</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)" }}>2 units</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>₦100,000</p>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Expected return</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "white", fontFamily: "var(--font-display)" }}>₦24,000</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>24% p.a. balanced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RISK LEVELS */}
      <section aria-labelledby="tranches-heading" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="tranches-heading"
            badge={<Badge><BarChart3 size={10} aria-hidden="true" /> Risk levels</Badge>}
            title="Pick the risk level that fits you."
            sub="Every financing deal has three levels you can choose from. Lower risk means lower returns. Higher risk means higher returns. You decide."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              {
                name: "Safe",
                color: "#10B981",
                range: "12 to 16% p.a.",
                priority: "Paid back first",
                protection: "Your units are covered by the reserve fund and insurance first. If the business does not repay, you are the last to take a loss.",
                exposure: "Lowest risk",
                best: "If you want steady returns and prefer to sleep well at night."
              },
              {
                name: "Balanced",
                color: "#F59E0B",
                range: "18 to 24% p.a.",
                priority: "Paid back second",
                protection: "Partial coverage from reserve and insurance. You absorb some loss only after high-return holders take their share first.",
                exposure: "Medium risk",
                best: "If you want better returns and are comfortable with some exposure across a diversified set of deals."
              },
              {
                name: "High-return",
                color: "#EF4444",
                range: "26 to 34% p.a.",
                priority: "First to take a loss",
                protection: "No reserve cover. You take the first hit if a business does not repay. The higher return is your compensation for accepting that.",
                exposure: "Highest risk",
                best: "If you understand private credit risk and want maximum returns across a wide portfolio."
              },
            ].map((t) => (
              <div key={t.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, marginTop: 5 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25`, padding: "3px 10px", borderRadius: 9999 }}>{t.exposure}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.025em", marginBottom: 6 }}>{t.name}</h3>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: t.color, letterSpacing: "-0.035em", marginBottom: 4, lineHeight: 1 }}>{t.range}</div>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>Target return</p>
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3 }}>Repayment order: {t.priority}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65 }}>{t.protection}</p>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}><strong style={{ color: "#374151" }}>Good for:</strong> {t.best}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", marginTop: 24 }}>Return ranges are targets, not guarantees. Actual returns depend on the business, deal type, and market conditions.</p>
        </div>
      </section>

      {/* WHAT HAPPENS IF A BUSINESS DOES NOT REPAY */}
      <section aria-labelledby="prot-heading" className="ff-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <div style={{ marginBottom: 20 }}><Badge><ShieldCheck size={10} aria-hidden="true" /> If a business does not repay</Badge></div>
              <h2 id="prot-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", lineHeight: 1.1, marginBottom: 20 }}>
                There are four things<br />that happen before<br />you lose anything.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 32 }}>
                We do not promise that every deal will pay back. What we do is make sure that if one does not, the impact on you is managed in layers rather than hitting you all at once.
              </p>
              <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12 }}>
                <AlertCircle size={16} aria-hidden="true" style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.65 }}>Creditlinker uses the language "partial loss protection" and "managed risk" — not "safe investment" or "guaranteed returns." You are putting capital into real businesses. There is real risk involved.</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { step: "1", color: "#10B981", label: "The business repays normally",         desc: "Your principal plus returns come back. The reserve held per deal is returned to unit holders after the financing cycle ends." },
                { step: "2", color: "#F59E0B", label: "The reserve fund steps in",            desc: "10% of every deal is set aside and invested in safe instruments. This pool is the first thing used to cover a shortfall if repayment stops." },
                { step: "3", color: "#38BDF8", label: "Insurance pays out (where applicable)", desc: "Some deals have optional insurance coverage. If activated, the insurer covers part or all of the remaining gap according to the policy." },
                { step: "4", color: "#A78BFA", label: "The asset is recovered (if there is one)", desc: "For equipment and asset-backed deals, the physical asset is taken back, sold, and the proceeds are returned to unit holders." },
                { step: "+", color: "#9CA3AF", label: "The platform buffer absorbs the rest",  desc: "A shared pool covers any remaining gap. This affects platform profitability, not your principal beyond your risk level exposure." },
              ].map((layer, i) => (
                <div key={layer.step} style={{ display: "flex", gap: 14, background: i === 4 ? "#F9FAFB" : "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${layer.color}12`, border: `1px solid ${layer.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 13, color: layer.color, fontFamily: "var(--font-display)" }}>{layer.step}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{layer.label}</p>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN FINANCE */}
      <section aria-labelledby="loantypes-heading" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="loantypes-heading"
            badge={<Badge><Layers size={10} aria-hidden="true" /> What you can finance</Badge>}
            title="Five categories. Each works differently."
            sub="Each financing category has a different source of repayment and a different protection structure. Pick the ones that match your appetite."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
            {[
              { name: "Equipment Financing",      security: "The equipment is the security. If repayment stops, the asset is recovered and sold.",   risk: "Low",    rc: "#10B981" },
              { name: "Working Capital",           security: "Backed by the business's verified cashflow data and the reserve fund.",                 risk: "Medium", rc: "#F59E0B" },
              { name: "Invoice and Revenue Finance", security: "Backed by verified customer invoices. The customer's payment clears the deal.",       risk: "Low",    rc: "#10B981" },
            ].map((lt) => (
              <div key={lt.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: lt.rc, background: `${lt.rc}12`, border: `1px solid ${lt.rc}25`, padding: "2px 9px", borderRadius: 9999 }}>{lt.risk} Risk</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginTop: 10, marginBottom: 6 }}>{lt.name}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{lt.security}</p>
              </div>
            ))}
          </div>
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {[
              { name: "Revenue-Based Financing", security: "A share of the business's actual daily or weekly revenue is collected until the full amount is returned.",   risk: "Medium",      rc: "#F59E0B" },
              { name: "Trade Credit Financing",  security: "Backed by the buyer and supplier's existing commercial relationship and payment history.",                    risk: "Medium-High", rc: "#EF4444" },
            ].map((lt) => (
              <div key={lt.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: lt.rc, background: `${lt.rc}12`, border: `1px solid ${lt.rc}25`, padding: "2px 9px", borderRadius: 9999 }}>{lt.risk} Risk</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginTop: 10, marginBottom: 6 }}>{lt.name}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{lt.security}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: "#0A2540", border: "1.5px solid #D1D5DB", padding: "11px 20px", borderRadius: 10 }}>
              Full breakdown of every financing type <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* THE DATA */}
      <section aria-labelledby="data-heading" className="ff-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "40%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="ff-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            <div>
              <div style={{ marginBottom: 20 }}><Badge><Database size={10} aria-hidden="true" /> What you see before you decide</Badge></div>
              <h2 id="data-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
                Real numbers.<br />
                <span style={{ color: "#00D4FF" }}>Not just a score.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 36, maxWidth: 460 }}>
                Before you put a single naira into a business, you see six independent measures of how that business actually operates. Not self-reported. Not projected. Pulled from their real bank accounts, accounting records, and operational data.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
                {[
                  { title: "Three data types, all verified", desc: "Bank transaction history, accounting ledger records, and operational signals like equipment, inventory, and receivables." },
                  { title: "Six measures, independently scored", desc: "Revenue Stability, Cashflow Predictability, Expense Discipline, Liquidity Strength, Financial Consistency, and Risk Profile. Each scored 0 to 100 on its own." },
                  { title: "A separate data reliability score", desc: "Every business profile carries a score showing how complete and trustworthy the underlying data is, so you know how much weight to give each number." },
                  { title: "Full source traceability", desc: "Every metric traces back to the actual transactions it came from. No black boxes." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} dark />)}
              </div>
            </div>

            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}>
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

                <div style={{ padding: "18px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 14 }}>6 financial measures</p>
                  <DimBar label="Revenue Stability"       value={85} color="#10B981" />
                  <DimBar label="Cashflow Predictability" value={78} color="#38BDF8" />
                  <DimBar label="Expense Discipline"      value={81} color="#818CF8" />
                  <DimBar label="Liquidity Strength"      value={74} color="#F59E0B" />
                  <DimBar label="Financial Consistency"   value={88} color="#00D4FF" />
                  <DimBar label="Risk Profile"            value={91} color="#F472B6" />
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>Data reliability score</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>94</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>High confidence</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>Data coverage</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>18mo</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>3 bank accounts</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>Key business metrics</p>
                  {[
                    { label: "Avg monthly revenue",   value: "₦4.2M"  },
                    { label: "Revenue growth (6mo)",  value: "+12%"    },
                    { label: "Operating margin",      value: "31%"     },
                    { label: "Cash reserve ratio",    value: "2.4x"    },
                    { label: "Receivable turnover",   value: "18 days" },
                    { label: "Client concentration",  value: "Low"     },
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

      {/* HOW IT WORKS */}
      <section id="how-it-works" aria-labelledby="hiw-heading" className="ff-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-journey-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            <div>
              <SectionHeading
                id="hiw-heading"
                badge={<Badge><RefreshCw size={10} aria-hidden="true" /> How it works</Badge>}
                title="From signup to your first financing."
                sub="Five steps to start putting your capital to work through Creditlinker."
              />
              <TimelineStep n="1" icon={<Landmark size={18} aria-hidden="true" />}
                title="Create your account"
                desc="Sign up as an individual or an institution. Tell us what kind of businesses you want to finance and how much you are looking to put in."
              />
              <TimelineStep n="2" icon={<Layers size={18} aria-hidden="true" />}
                title="Set your criteria"
                desc="Tell us your preferences once. The platform matches you to verified businesses that fit your capital range, sector focus, and risk appetite. This happens automatically in the background."
              />
              <TimelineStep n="3" icon={<Eye size={18} aria-hidden="true" />}
                title="Request access to a business profile"
                desc="When you find a business you want to evaluate, you request their consent. They decide what data to share with you and for how long. You only see what they have agreed to show you."
              />
              <TimelineStep n="4" icon={<ShieldCheck size={18} aria-hidden="true" />}
                title="Review their verified financial data"
                desc="You get their six financial measures, reliability score, key business metrics, and risk assessment. All of it comes from verified data, not from what the business told us about itself."
              />
              <TimelineStep n="5" icon={<Banknote size={18} aria-hidden="true" />}
                title="Put your capital in and track it"
                desc="Choose how many units you want to hold and at what risk level. The financing is structured on the platform. You track repayments, receive returns, and build a portfolio over time."
                last
              />

              <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#0A2540", marginTop: 12, textDecoration: "underline", textUnderlineOffset: 4 }}>
                Full platform walkthrough <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="ff-sticky" style={{ position: "sticky", top: 88 }}>
              <div style={{ borderRadius: 18, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 8px 48px rgba(0,0,0,0.06)" }}>
                <div style={{ background: "#0A2540", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Your matching criteria</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>FastCash Microfinance</p>
                </div>
                <div style={{ background: "white" }}>
                  {[
                    { label: "Financing category",  value: "Debt · Working capital" },
                    { label: "Min identity score",  value: "680 / 1000"             },
                    { label: "Ticket size",         value: "₦1M to ₦20M"           },
                    { label: "Sectors",             value: "Food · Agri · Retail"   },
                    { label: "Risk appetite",       value: "Low to Medium"          },
                    { label: "Min data coverage",   value: "12 months"              },
                  ].map((c, i) => (
                    <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < 5 ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{c.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{c.value}</span>
                    </div>
                  ))}
                </div>

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

              <div style={{ marginTop: 16, background: "#0A2540", borderRadius: 14, padding: "16px 20px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>Access log · All events</p>
                {[
                  { action: "Viewed identity profile",   biz: "Aduke Bakeries",   t: "2h ago" },
                  { action: "Viewed 6D breakdown",       biz: "Lagosfresh Prod.", t: "3h ago" },
                  { action: "Created offer ₦5M",         biz: "Aduke Bakeries",   t: "1h ago" },
                  { action: "Consent request sent",      biz: "TechServe Ltd.",   t: "4h ago" },
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

      {/* CONSENT */}
      <section aria-labelledby="consent-heading" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-consent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            <div>
              <div style={{ marginBottom: 20 }}><Badge><Lock size={10} aria-hidden="true" /> Access and consent</Badge></div>
              <h2 id="consent-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                Every time you look at<br />a business profile,<br />
                <span style={{ color: "#00D4FF" }}>it is logged.</span>
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                Businesses control who sees their data and for how long. You can only access a profile if they have granted you permission. Every view, every action, every offer you create is recorded. This builds trust on both sides.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { title: "Businesses control their own data",    desc: "Each business decides exactly what you can see. Score only, full profile, or transaction detail. They set it. You work within it." },
                  { title: "Access expires automatically",         desc: "Every permission has a set end date. When it runs out, you lose access. No manual action needed from either side." },
                  { title: "They can cut your access instantly",   desc: "A business can revoke your access at any time. It happens immediately." },
                  { title: "Everything is on the record",         desc: "Every view, every offer, every data access is logged with who did it and when. Your financing decisions have a full evidence trail." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} />)}
              </div>
            </div>

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
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>What you can see</p>
                  {[
                    { label: "Identity score (0 to 1000)",           granted: true  },
                    { label: "Six-dimensional breakdown",             granted: true  },
                    { label: "Full identity profile",                 granted: true  },
                    { label: "Transaction detail",                    granted: false },
                    { label: "Create financing offer",                granted: true  },
                    { label: "Score change alerts",                   granted: false },
                  ].map((p) => (
                    <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{p.label}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: p.granted ? "#10B981" : "#9CA3AF", background: p.granted ? "#ECFDF5" : "#F9FAFB", border: `1px solid ${p.granted ? "rgba(16,185,129,0.2)" : "#E5E7EB"}`, padding: "2px 9px", borderRadius: 9999 }}>
                        {p.granted ? <><CheckCircle2 size={10} aria-hidden="true" /> Granted</> : <><Lock size={10} aria-hidden="true" /> Restricted</>}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Your access log · This business</p>
                  {[
                    { a: "Viewed identity score",     t: "2h ago" },
                    { a: "Viewed identity profile",   t: "2h ago" },
                    { a: "Viewed 6D breakdown",       t: "2h ago" },
                    { a: "Created offer ₦5,000,000", t: "1h ago" },
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

      {/* REPUTATION */}
      <section aria-labelledby="rep-heading" className="ff-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            <div>
              <div style={{ marginBottom: 20 }}><Badge><Star size={10} aria-hidden="true" /> Your reputation on the platform</Badge></div>
              <h2 id="rep-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,44px)", letterSpacing: "-0.035em", color: "#0A2540", marginBottom: 20, lineHeight: 1.1 }}>
                The better you behave,<br />the stronger your<br />standing gets.
              </h2>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.78, marginBottom: 36 }}>
                Creditlinker tracks how you operate as a financing partner. Businesses can see your record before granting you access. A strong reputation means faster consent, better deals, and more trust from the businesses you want to reach.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { title: "Deal completion rate",      desc: "How many deals you open versus how many you actually complete and settle. Businesses watch this." },
                  { title: "Settlement speed",          desc: "How quickly you confirm repayments once a business has paid. Slow confirmations lower your standing." },
                  { title: "Dispute record",            desc: "How disputes involving you are resolved. Clean records are a signal of a fair, trustworthy financing partner." },
                  { title: "Capital activity",          desc: "Volume and variety of financing you have done. More activity across different business types signals genuine commitment." },
                ].map((f) => <CheckItem key={f.title} title={f.title} desc={f.desc} />)}
              </div>
            </div>

            <div>
              <div style={{ background: "#0A2540", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(10,37,64,0.18), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>
                <GridBg />
                <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>Institution reputation</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "var(--font-display)" }}>FastCash Microfinance</p>
                </div>

                <div style={{ padding: "18px 22px" }}>
                  {[
                    { label: "Deal completion rate",   value: "94%", color: "#10B981", bar: 94 },
                    { label: "Settlement speed",       value: "98%", color: "#38BDF8", bar: 98 },
                    { label: "Dispute resolution",     value: "91%", color: "#818CF8", bar: 91 },
                    { label: "Capital activity score", value: "87%", color: "#F59E0B", bar: 87 },
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

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 22px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { l: "Active deals",   v: "14"    },
                    { l: "Total deployed", v: "₦84M"  },
                    { l: "Platform rank",  v: "Top 5%" },
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

      {/* CTA */}
      <section aria-label="Call to action" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ background: "#0A2540", borderRadius: 24, padding: "64px 64px", position: "relative", overflow: "hidden", textAlign: "center" }}>
            <GridBg />
            <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 700px 400px at 50% 50%, rgba(0,212,255,0.08) 0%, transparent 70%)" }} />

            <div style={{ position: "relative" }}>
              <div style={{ marginBottom: 20 }}>
                <Badge><Landmark size={10} aria-hidden="true" /> For capital providers</Badge>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.04em", color: "white", marginBottom: 18, lineHeight: 1.1 }}>
                Start with a business<br />you can actually <span style={{ color: "#00D4FF" }}>verify.</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 44, lineHeight: 1.78, maxWidth: 560, margin: "0 auto 44px" }}>
                Sign up, set your criteria, and let the platform find verified businesses that match what you are looking for. The first consent request is waiting on the other side of registration.
              </p>
              <div className="ff-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
                  Register as a financer <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.14)", padding: "13px 22px", borderRadius: 10 }}>
                  Talk to the team
                </Link>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>
                Consent-gated access from day one · Full audit trail · No hidden fees
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
