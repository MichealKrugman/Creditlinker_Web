import Link from "next/link";
import { ArrowRight, Package, Banknote, FileText, TrendingUp, Handshake, ShieldCheck, ChevronRight } from "lucide-react";

function GridBg({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(10,37,64,0.035)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

const types = [
  {
    id: "equipment",
    icon: <Package size={20} />,
    name: "Equipment Financing",
    risk: "Low Risk",
    riskColor: "#10B981",
    accent: "#10B981",
    what: "A business needs a machine, vehicle, or tool. Financers fund it together. If the business can't pay, the asset is recovered and sold.",
    security: "The equipment itself",
    example: "40 financers put in ₦50k each to fund a ₦2M bakery oven. Business pays back. Oven can be recovered if they don't.",
  },
  {
    id: "working-capital",
    icon: <Banknote size={20} />,
    name: "Working Capital",
    risk: "Medium Risk",
    riskColor: "#F59E0B",
    accent: "#F59E0B",
    what: "A business needs cash to keep running — stock, salaries, suppliers. We track their real cash activity and set aside a reserve buffer from day one.",
    security: "Cash tracking + 10% reserve",
    example: "A retailer needs ₦3M for festive stock. 60 financers fund it. If things go wrong, the reserve absorbs the first hit.",
  },
  {
    id: "invoice",
    icon: <FileText size={20} />,
    name: "Invoice Financing",
    risk: "Low Risk",
    riskColor: "#10B981",
    accent: "#38BDF8",
    what: "A business has done the work and is waiting to be paid. We advance the cash now. When their customer pays, financers get repaid.",
    security: "The specific unpaid invoice",
    example: "A contractor has ₦8M due in 60 days. We advance 85% now. When the client pays, financers are repaid.",
  },
  {
    id: "revenue-based",
    icon: <TrendingUp size={20} />,
    name: "Revenue-Based Financing",
    risk: "Medium Risk",
    riskColor: "#F59E0B",
    accent: "#A78BFA",
    what: "Instead of fixed monthly payments, the business pays back a slice of what it earns. Good months, more. Slow months, less. We track this in real time.",
    security: "Live revenue data",
    example: "A logistics company takes ₦5M and repays 15% of revenue until ₦7M is returned. Every naira that comes in is tracked.",
  },
  {
    id: "trade-credit",
    icon: <Handshake size={20} />,
    name: "Trade Credit Financing",
    risk: "Medium–High Risk",
    riskColor: "#EF4444",
    accent: "#F472B6",
    what: "A supplier delivers goods to a buyer who pays later. We finance the gap. The strength of their business relationship is the security.",
    security: "Buyer–supplier payment history",
    example: "A distributor supplies 3 supermarkets on 30-day terms and needs ₦4M to restock. The supermarkets' payment records are verified.",
  },
];

export default function ProductsPage() {
  return (
    <>
      <style>{`
        @media (max-width: 860px) { .pt-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px) { .pt-grid { grid-template-columns: 1fr !important; } .pt-hero-btns { flex-direction: column !important; } }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#fff", padding: "80px 0 64px" }}>
        <GridBg light />
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(34px,5vw,58px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.08, marginBottom: 18 }}>
            Five ways to fund a business.<br />
            <span style={{ color: "#00D4FF" }}>All with protection built in.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#4B5563", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
            Creditlinker is not one product. It is five types of business financing — each designed around how that deal gets repaid, and what happens if it doesn't.
          </p>
          <div className="pt-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Start financing <ArrowRight size={15} />
            </Link>
            <Link href="/for-financers" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0A2540", fontWeight: 600, fontSize: 15, border: "1.5px solid #D1D5DB", padding: "12px 20px", borderRadius: 10 }}>
              For financers <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FIVE TYPES ── */}
      <section style={{ background: "#F9FAFB", padding: "64px 0 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="pt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {types.map((t) => (
              <div key={t.id} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* card header */}
                <div style={{ background: "#0A2540", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                  <GridBg />
                  <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${t.accent}20`, border: `1px solid ${t.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accent }}>{t.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.riskColor, background: `${t.riskColor}18`, border: `1px solid ${t.riskColor}35`, padding: "3px 9px", borderRadius: 9999, flexShrink: 0, marginTop: 4 }}>{t.risk}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "white", marginTop: 14, letterSpacing: "-0.02em" }}>{t.name}</h3>
                </div>
                {/* card body */}
                <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.72 }}>{t.what}</p>
                  <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 9, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#0A5060", textTransform: "uppercase", marginBottom: 3 }}>Secured by</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{t.security}</p>
                  </div>
                  <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", marginTop: "auto" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 3 }}>Example</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{t.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* protection note */}
          <div style={{ marginTop: 32, background: "#0A2540", borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "flex-start", gap: 16 }}>
            <ShieldCheck size={20} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: "white", fontSize: 15, marginBottom: 6 }}>Every deal has protection layers built in.</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                10% of every deal is set aside as a reserve. Optional insurance sits on top. For equipment deals, the asset itself can be recovered. These layers absorb losses before they reach your money — but this is still business financing, not a savings account. Risk is real and returns are not guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#0A2540", padding: "64px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(26px,4vw,42px)", color: "white", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 14 }}>
            Ready to fund businesses<br /><span style={{ color: "#00D4FF" }}>and earn returns?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.7 }}>
            Start as a financer from ₦50,000. Choose your risk level. Fund across multiple deal types.
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
