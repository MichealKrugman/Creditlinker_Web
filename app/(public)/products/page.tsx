import Link from "next/link";
import { ArrowRight, ChevronRight, CreditCard, Zap, Activity, ShieldCheck, Receipt, FileBarChart, TrendingUp, Gauge, FileText, Handshake, PieChart } from "lucide-react";

function GridBg({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(10,37,64,0.035)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

export default function ProductsPage() {
  return (
    <>
      <style>{`
        .pt-pulse-grid  { display: grid; grid-template-columns: 1fr 420px; gap: 72px; align-items: center; }
        @media (max-width: 900px) {
          .pt-pulse-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .pt-pulse-card  { display: none !important; }
          .pt-products-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .pt-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .pt-hero-btns a { text-align: center !important; justify-content: center !important; width: 100% !important; box-sizing: border-box !important; }
          .pt-hero-section  { padding: 48px 0 36px !important; }
          .pt-hero-inner     { padding: 0 20px !important; }
          .pt-products-section { padding: 44px 0 !important; }
          .pt-products-inner   { padding: 0 20px !important; }
          .pt-products-grid    { grid-template-columns: 1fr !important; }
          .pt-pulse-section  { padding: 44px 0 !important; }
          .pt-pulse-inner    { padding: 0 20px !important; }
          .pt-cta-section    { padding: 44px 20px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="pt-hero-section" style={{ position: "relative", overflow: "hidden", background: "#fff", padding: "80px 0 64px" }}>
        <GridBg light />
        <div className="pt-hero-inner" style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(34px,5vw,58px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.08, marginBottom: 18 }}>
            The software behind<br />
            <span style={{ color: "#00D4FF" }}>your financial identity.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#4B5563", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
            From verification to reporting to matching, Creditlinker is the software layer that builds, maintains, and puts a business's financial identity to work. Financing itself is structured directly between you and the business.
          </p>
          <div className="pt-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Get started <ArrowRight size={15} />
            </Link>
            <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
              For financers <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="pt-products-section" style={{ background: "#F9FAFB", padding: "72px 0" }}>
        <div className="pt-products-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(24px,3vw,36px)", letterSpacing: "-0.03em", color: "#0A2540", marginBottom: 12 }}>
              One financial identity. A full toolkit to run on.
            </h2>
            <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Build your financial identity on Creditlinker and it unlocks every tool below for your business, at no extra setup. The more you use, the stronger your identity gets, and the more it can do for you.
            </p>
          </div>

          <div className="pt-products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: <ShieldCheck size={20} />, name: "Financial Identity & Verification", desc: "Verifies a business and builds its core financial identity from real bank, accounting, and operational data, not self-reported numbers." },
              { icon: <Receipt size={20} />, name: "Bookkeeping & Expense Tracking", desc: "Ongoing categorisation and tracking of income and expenses, kept current so the financial identity reflects what is actually happening in the business." },
              { icon: <FileBarChart size={20} />, name: "Accounting & Financial Statements", desc: "Generates standard accounting records and financial statements directly from verified transaction data." },
              { icon: <TrendingUp size={20} />, name: "Revenue & Cashflow Analysis", desc: "Verifies revenue and analyses cashflow patterns to show how money actually moves through the business over time." },
              { icon: <Activity size={20} />, name: "Performance Monitoring", desc: "Ongoing financial analysis that tracks how a business is performing, so changes show up as they happen, not only at a point in time." },
              { icon: <Gauge size={20} />, name: "Readiness & Risk Assessments", desc: "Structured assessments covering financing risk, loan readiness, investor readiness, and tax readiness, each scored from the same verified data." },
              { icon: <FileText size={20} />, name: "Business Reports", desc: "Produces shareable reports summarising a business's financial identity for financers, investors, or internal use." },
              { icon: <Handshake size={20} />, name: "Financing Marketplace", desc: "Matches businesses to financers, and businesses to other businesses, based on verified profile fit rather than self-reported claims." },
              { icon: <PieChart size={20} />, name: "Portfolio Monitoring", desc: "Gives financers an ongoing view across every business they have financed, so performance and risk are visible in one place." },
            ].map((p) => (
              <div key={p.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 16 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 8, letterSpacing: "-0.02em" }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.72, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULSE CARD ── */}
      <section className="pt-pulse-section" style={{ background: "#0A2540", padding: "72px 0", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "30%", right: "-4%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 70%)" }} />
        <div className="pt-pulse-inner" style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          {/* label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 9999, letterSpacing: "0.08em" }}>
              <Zap size={11} /> NEW PRODUCT
            </span>
          </div>

          <div className="pt-pulse-grid">
            {/* left */}
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.08, marginBottom: 20 }}>
                Creditlinker<br />
                <span style={{ color: "#00D4FF" }}>Pulse Card</span>
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, marginBottom: 32, maxWidth: 480 }}>
                Creditlinker doesn't issue the card. It powers it. The Pulse Card lets you offer a business a credit line whose limit recalculates in real time from their live financial identity, the same verified cashflow, revenue stability, and liquidity data you already evaluate, instead of a fixed limit set once and left to age.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                {[
                  { icon: <Activity size={15} />, title: "A live signal, not a point-in-time score", desc: "Because the limit moves with the business's financial identity, card activity gives you a continuous read on how a business is actually performing between formal financing decisions." },
                  { icon: <Zap size={15} />, title: "Built on the same six-dimensional profile", desc: "The card limit is powered by the same verified data you already review when evaluating a business for financing. One profile, multiple ways to put it to use." },
                  { icon: <CreditCard size={15} />, title: "Operational spend, fed back into the record", desc: "Card spend is tied to business operations: suppliers, services, inventory. Every transaction adds to the business's financial identity, strengthening the data you rely on for future decisions." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>{f.icon}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "white", marginBottom: 4 }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.72 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}>
                Learn about the Pulse Card <ArrowRight size={15} />
              </Link>
            </div>

            {/* right — card visual */}
            <div className="pt-pulse-card" style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 380, height: 240,
                borderRadius: 20,
                background: "linear-gradient(135deg, #0d2d4e 0%, #061524 60%, #0a1e35 100%)",
                boxShadow: "0 48px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
                padding: "28px 30px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                position: "relative", overflow: "hidden",
              }}>
                {/* glow */}
                <div aria-hidden style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
                {/* top row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Creditlinker</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>PULSE</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,212,255,0.25)", border: "1px solid rgba(0,212,255,0.4)" }} />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", marginLeft: -10 }} />
                  </div>
                </div>
                {/* mid — live limit indicator */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, letterSpacing: "0.08em" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4FF", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                      LIVE LIMIT
                    </span>
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1 }}>₦2,400,000</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Updated 4 mins ago · Score 742</p>
                </div>
                {/* bottom row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em" }}>ADUKE BAKERIES LTD</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>BUSINESS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pt-cta-section" style={{ background: "#0A2540", padding: "64px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(26px,4vw,42px)", color: "white", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 14 }}>
            Ready to fund businesses<br /><span style={{ color: "#00D4FF" }}>you can actually verify?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.7 }}>
            Apply as an institution, set your criteria, and get access to verified business data you can act on.
          </p>
          <div className="pt-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Get started <ArrowRight size={15} />
            </Link>
            <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.15)", padding: "13px 22px", borderRadius: 10 }}>
              How it works <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}