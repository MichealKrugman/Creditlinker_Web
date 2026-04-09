import Link from "next/link";
import { ArrowRight, Package, Banknote, FileText, TrendingUp, Handshake, ShieldCheck, ChevronRight, Layers, RefreshCw, Store, Clock, Share2, Wrench } from "lucide-react";

function GridBg({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(10,37,64,0.035)" : "rgba(255,255,255,0.03)";
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
  );
}

const categories = [
  {
    id: "loans",
    label: "Loans & Credit Lines",
    color: "#F59E0B",
    types: [
      {
        icon: <Banknote size={20} />,
        name: "Working Capital Loan",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "You are funding a documented cash gap in a business that already has revenue coming in. The deal is tied to a specific, verified payment cycle, so repayment is not based on hope. You get your money back when that cycle closes, backed by the business's cashflow history.",
        security: "Verified cashflow history + 10% reserve",
      },
      {
        icon: <RefreshCw size={20} />,
        name: "Term Loan",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "You deploy a fixed amount once and receive equal monthly repayments over 12 to 36 months. The repayment schedule is built around what the business has actually earned historically, so you know what is coming back and when. This is for growth deals with real numbers behind them, not distressed situations.",
        security: "Business cashflow + personal guarantee",
      },
      {
        icon: <Layers size={20} />,
        name: "Revolving Overdraft",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "You provide a standing credit limit that the business draws from and repays in cycles. Every repayment returns your capital, ready for the next deal. This is only open to businesses with a long, verified transaction record.",
        security: "Cashflow history + 10% reserve",
      },
    ],
  },
  {
    id: "assets",
    label: "Finance Against Assets",
    color: "#10B981",
    types: [
      {
        icon: <Package size={20} />,
        name: "Equipment Finance",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "You fund a specific piece of equipment the business needs. Title stays with the financer pool until fully repaid. If the business defaults, the asset is repossessed and sold. The equipment is the security, not the business's word.",
        security: "Equipment title held by financer pool",
      },
      {
        icon: <Store size={20} />,
        name: "Inventory Finance",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "You are lending against physical stock the business already owns and holds in a registered warehouse, not stock it plans to buy. A warehouse receipt is assigned to the financer pool as control. Repaid as the stock is sold to verified buyers.",
        security: "Warehouse receipt + independent valuation",
      },
      {
        icon: <Wrench size={20} />,
        name: "Asset Leasing",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "You purchase an asset outright and lease it to the business for a fixed monthly payment. Ownership stays with the financer pool for the entire lease term. The business never holds title. Only assets that bring in direct, trackable revenue qualify.",
        security: "Financer pool retains asset ownership",
      },
    ],
  },
  {
    id: "receivables",
    label: "Finance Against Confirmed Receivables",
    color: "#38BDF8",
    types: [
      {
        icon: <FileText size={20} />,
        name: "Invoice Discounting",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "Work is done. Invoice is raised. The buyer has not paid yet, but payment is due in 30 to 90 days. You advance up to 80% of that invoice value now. When the buyer pays, the collection account settles you first. The invoice is what backs your position.",
        security: "Assigned invoice + buyer credit check",
      },
      {
        icon: <TrendingUp size={20} />,
        name: "Contract Revenue Advance",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "The business holds a signed, recurring contract with a reliable counterparty, such as a retainer or supply agreement. You advance against the next few months of payments that are locked in by contract, not projected. The contract is what creates the repayment obligation.",
        security: "Signed contract + counterparty verification",
      },
      {
        icon: <ChevronRight size={20} />,
        name: "Receivables Purchase",
        risk: "Low Risk",
        riskColor: "#10B981",
        what: "You buy a verified book of short-term receivables at a discount and collect directly from debtors. The business gets its cash upfront and is out of the picture. You earn the difference between what you paid and what you collect.",
        security: "Verified receivables book + payment history",
      },
    ],
  },
  {
    id: "trade",
    label: "Supplier & Trade Finance",
    color: "#A78BFA",
    types: [
      {
        icon: <Handshake size={20} />,
        name: "Purchase Order Finance",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "A business has a confirmed order but needs capital to fulfil it. You fund the production or procurement cost. Repayment comes from the buyer's invoice settlement, which is already locked in by contract before you put in anything.",
        security: "Confirmed PO + buyer credit assessment",
      },
      {
        icon: <Share2 size={20} />,
        name: "Supplier Payment Finance",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "A buyer needs goods from a supplier who wants payment upfront. You pay the supplier directly on the buyer's behalf. The buyer then repays you on agreed terms, backed by their verified cashflow, not the goods.",
        security: "Buyer cashflow + verified trading record",
      },
      {
        icon: <Clock size={20} />,
        name: "Extended Payment Terms",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "A supplier delivers goods but does not wait for payment. You pay the supplier on day one and hold the receivable. The buyer settles with you on the agreed date. The supplier gets paid immediately; the buyer gets time.",
        security: "Signed supply contract + buyer credit check",
      },
    ],
  },
  {
    id: "service",
    label: "Contract-Backed Service Finance",
    color: "#F472B6",
    types: [
      {
        icon: <Clock size={20} />,
        name: "Milestone Contract Finance",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "A service business has a signed contract with defined payment milestones. You fund the operating costs between those milestones: payroll, equipment, overheads. The contract secures your position. Repaid when milestone payments come in from the client.",
        security: "Signed contract + milestone payment schedule",
      },
      {
        icon: <TrendingUp size={20} />,
        name: "Revenue-Share Agreement",
        risk: "Medium Risk",
        riskColor: "#F59E0B",
        what: "You provide capital in exchange for a fixed cut of the business's verified contract receipts over a set period. Not gross revenue, not projections. Only active contracts with named counterparties qualify. The share and the timeline are both fixed upfront.",
        security: "Active contract + revenue tracking",
      },
    ],
  },
];

export default function ProductsPage() {
  return (
    <>
      <style>{`
        .pt-card-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .pt-card-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 900px) {
          .pt-card-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .pt-card-grid-2 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .pt-card-grid-3, .pt-card-grid-2 { grid-template-columns: 1fr !important; }
          .pt-hero-btns { flex-direction: column !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#fff", padding: "80px 0 64px" }}>
        <GridBg light />
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(34px,5vw,58px)", letterSpacing: "-0.04em", color: "#0A2540", lineHeight: 1.08, marginBottom: 18 }}>
            14 ways to get funded.<br />
            <span style={{ color: "#00D4FF" }}>All with protection built in.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#4B5563", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
            Five categories of business financing, each structured around how the deal gets repaid and what backs it if it doesn't.
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

      {/* ── CATEGORIES ── */}
      <section style={{ background: "#F9FAFB", padding: "64px 0 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 60 }}>
          {categories.map((cat) => (
            <div key={cat.id}>
              {/* category label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(16px,2vw,20px)", color: "#0A2540", letterSpacing: "-0.02em", margin: 0 }}>{cat.label}</h2>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              </div>

              {/* cards */}
              <div className={cat.types.length === 2 ? "pt-card-grid-2" : "pt-card-grid-3"}>
                {cat.types.map((t) => (
                  <div key={t.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {/* card header */}
                    <div style={{ background: "#0A2540", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                      <GridBg />
                      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}20`, border: `1px solid ${cat.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color, flexShrink: 0 }}>{t.icon}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.riskColor, background: `${t.riskColor}18`, border: `1px solid ${t.riskColor}35`, padding: "3px 9px", borderRadius: 9999, flexShrink: 0, marginTop: 4, whiteSpace: "nowrap" }}>{t.risk}</span>
                      </div>
                      <h3 style={{ position: "relative", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "white", marginTop: 14, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{t.name}</h3>
                    </div>
                    {/* card body */}
                    <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                      <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.72, margin: 0 }}>{t.what}</p>
                      <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 9, padding: "10px 12px", marginTop: "auto" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#0A5060", textTransform: "uppercase", marginBottom: 3 }}>Secured by</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", margin: 0 }}>{t.security}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* protection note */}
          <div style={{ background: "#0A2540", borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "flex-start", gap: 16 }}>
            <ShieldCheck size={20} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: "white", fontSize: 15, marginBottom: 6 }}>Every deal has protection layers built in.</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>
                10% of every deal is set aside as a reserve. Optional insurance sits on top. For asset and equipment deals, the asset itself can be recovered. These layers absorb losses before they reach your money. But this is still business financing, not a savings account. Risk is real and returns are not guaranteed.
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
            Start as a financer from ₦50,000. Choose your risk level. Fund across any of the 14 deal types.
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