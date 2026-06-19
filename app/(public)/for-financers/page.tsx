"use client";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Banknote,
  Lock,
  Eye,
  ArrowUpRight,
  Layers,
  Landmark,
  TrendingUp,
  Database,
  RefreshCw,
  Star,
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
          .ff-cta-btns a   { text-align: center !important; justify-content: center !important; }
          .ff-match-strip  { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .ff-match-strip a { text-align: center !important; justify-content: center !important; }
          .ff-proof-strip  { gap: 16px !important; }
          .ff-hero-btns    { flex-direction: column !important; }
          .ff-hero-btns a  { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }
          .ff-section-heading { margin-bottom: 28px !important; }
          .ff-section-heading p { display: none !important; }
          .ff-cta-box      { padding: 36px 24px !important; }
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
                Creditlinker connects institutional capital providers to verified Nigerian businesses that need capital. You see their real financial data, decide your own terms, and structure the financing directly with the business. Creditlinker builds the financial identity and gives you the evidence. The financing decision is always yours.
              </p>
              <div className="ff-hero-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A2540", color: "white", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 2px 8px rgba(10,37,64,0.18)" }}>
                  Apply as an institution <ArrowRight size={15} aria-hidden="true" />
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
            title="Built for institutional capital providers."
            sub="Creditlinker is currently onboarding institutional capital providers: banks, microfinance institutions, equipment financiers, and trade suppliers. Each one gets access to verified business identity data to make their own financing decisions."
            center
          />
          <div style={{ maxWidth: 720, margin: "0 auto 40px" }}>
            <ProviderCard
              icon={<Landmark size={20} aria-hidden="true" />}
              type="Institutions and funds"
              desc="Banks, microfinance institutions, equipment financiers, and trade suppliers. You get access to verified six-dimensional business profiles to make your own financing decisions. Every access event is logged. Every decision has an evidence trail."
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
            title="Pick the type that fits what you have."
            sub="Not all financing works the same way. Each type below is a different deal structure, a different repayment source, and a different kind of financer. Pick what fits you."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <ProviderCard
              icon={<Banknote size={20} aria-hidden="true" />}
              type="Direct lenders"
              desc="You lend money directly to a business for day-to-day operations or growth. They repay you from their cashflow over time. Simple. Clean."
              examples={["Short-term loans", "Working capital", "Overdraft cover"]}
            />
            <ProviderCard
              icon={<Layers size={20} aria-hidden="true" />}
              type="Equipment financers"
              desc="You fund the purchase of machines, vehicles, or equipment. The asset itself is the security. If repayment stops, the asset is recovered."
              examples={["Equipment finance", "Asset leasing", "Hire purchase"]}
            />
            <ProviderCard
              icon={<TrendingUp size={20} aria-hidden="true" />}
              type="Revenue & invoice financers"
              desc="You advance money against real invoices or verified future revenue. The business's customers or their sales are what pays you back."
              examples={["Invoice advances", "Revenue share", "Receivables"]}
            />
            <ProviderCard
              icon={<Star size={20} aria-hidden="true" />}
              type="Trade & supplier financers"
              desc="You extend credit or payment terms to businesses you supply or trade with. Repayment is tied to your existing commercial relationship."
              examples={["Trade credit", "Supplier finance", "Deferred billing"]}
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN FINANCE */}
      <section aria-labelledby="loantypes-heading" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="loantypes-heading"
            badge={<Badge><Layers size={10} aria-hidden="true" /> What you can finance</Badge>}
            title={<>Multiple ways to put your<br />money to work.</>}
            sub="Each one has a different source of repayment and a different level of risk."
            center
          />
          <div className="ff-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
            {[
              {
                name: "Business loans & credit",
                tag: "Debt financing",
                risk: "Medium Risk",
                rc: "#F59E0B",
                security: "Repaid from the business's cashflow. Backed by their verified financial data and track record. Good for businesses that need cash now and pay it back over time.",
                types: ["Short-term loans", "Overdraft cover", "Working capital"]
              },
              {
                name: "Equipment & asset finance",
                tag: "Asset-backed",
                risk: "Low Risk",
                rc: "#10B981",
                security: "The equipment itself is the security. If the business stops paying, the asset is recovered and sold to cover what is owed. Lower risk because there is something physical to fall back on.",
                types: ["Equipment purchase", "Asset leasing", "Hire purchase"]
              },
              {
                name: "Invoice & revenue finance",
                tag: "Revenue-backed",
                risk: "Low Risk",
                rc: "#10B981",
                security: "Backed by the business's real customer invoices. When the customer pays their invoice, that money clears the deal. You are not waiting on the business. You are waiting on their customer.",
                types: ["Invoice advances", "Receivables purchase", "Revenue advance"]
              },
            ].map((lt) => (
              <div key={lt.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 9px", borderRadius: 9999 }}>{lt.tag}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: lt.rc, background: `${lt.rc}12`, border: `1px solid ${lt.rc}25`, padding: "2px 9px", borderRadius: 9999 }}>{lt.risk}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{lt.name}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, flex: 1 }}>{lt.security}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {lt.types.map((t) => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#0A5060", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", padding: "2px 9px", borderRadius: 9999 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: "#0A2540", border: "1.5px solid #D1D5DB", padding: "11px 20px", borderRadius: 10 }}>
              See all 14 financing types <ArrowUpRight size={15} aria-hidden="true" />
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
                desc="Sign up as an institution. Tell us what kind of businesses you want to evaluate for financing and what you are looking for."
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
                title="Agree terms and log the financing"
                desc="You agree financing terms directly with the business and structure the deal between you. Log the offer and its terms on Creditlinker, then track repayments as they happen. Institutions can do this via the dashboard or connect directly through the API, so the financing activity is captured automatically and powered by Creditlinker behind the scenes. This record feeds back into the business's financial identity."
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
                  { title: "Access expires automatically",         desc: "Every permission has a set end date. When it runs out, you lose access automatically. If there is an open obligation still being settled, such as an active financing arrangement, access continues until that obligation is resolved." },
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

      {/* PULSE CARD */}
      <section aria-label="Pulse Card" className="ff-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "20%", right: "-5%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)" }} />
        <div className="ff-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 9999, marginBottom: 20, letterSpacing: "0.08em" }}>
                ⚡ NEW, JUST LAUNCHED
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "white", fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 16 }}>
                Introducing the{" "}
                <span style={{ color: "#00D4FF" }}>Creditlinker Pulse Card</span>
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, maxWidth: 480, marginBottom: 28 }}>
                A business credit card with a limit that moves with the business&apos;s financial health. When a business performs well, their limit reflects that. In real time. Automatically. Powered by the same passport you already review.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {["Real-time dynamic limits", "Powered by the Creditlinker passport", "Business spend only"].map(tag => (
                  <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,212,255,0.8)", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "4px 12px", borderRadius: 9999 }}>{tag}</span>
                ))}
              </div>
              <Link
                href="/products"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 20px rgba(0,212,255,0.22)" }}
              >
                Learn about the Pulse Card <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 300, height: 190,
                borderRadius: 16,
                background: "linear-gradient(135deg, #0d2d4e 0%, #061524 60%, #0a1e35 100%)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.07)",
                padding: "22px 24px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                position: "relative", overflow: "hidden",
              }}>
                <div aria-hidden="true" style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 3 }}>Creditlinker</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>PULSE</p>
                  </div>
                  <div style={{ display: "flex" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,212,255,0.25)", border: "1px solid rgba(0,212,255,0.4)" }} />
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", marginLeft: -8 }} />
                  </div>
                </div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 9999, letterSpacing: "0.08em", marginBottom: 5 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00D4FF", display: "inline-block" }} /> LIVE LIMIT
                  </span>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.04em", lineHeight: 1 }}>₦2,400,000</p>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>ADUKE BAKERIES LTD</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Call to action" className="ff-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="ff-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ff-cta-box" style={{ background: "#0A2540", borderRadius: 24, padding: "64px 64px", position: "relative", overflow: "hidden", textAlign: "center" }}>
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
                  Apply as an institution <ArrowRight size={16} aria-hidden="true" />
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
