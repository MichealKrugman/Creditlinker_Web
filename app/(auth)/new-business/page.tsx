"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Building2, FileCheck, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   SECTOR OPTIONS (same master list as business-profile)
───────────────────────────────────────────────────────── */
const SECTOR_GROUPS: { group: string; options: string[] }[] = [
  { group: "Agriculture", options: ["Agriculture & Crop Farming","Agro-processing & Milling","Fisheries & Aquaculture","Livestock & Animal Husbandry","Forestry & Timber","Horticulture & Floriculture"] },
  { group: "Food & Consumer", options: ["Food & Beverage Manufacturing","Restaurant & Catering","Bakery & Confectionery","Packaged Foods & FMCG"] },
  { group: "Retail & Trade", options: ["Retail & Consumer Goods","Wholesale & Distribution","E-commerce & Online Retail","Import & Export","Supermarkets & Grocery","Market Traders & Kiosk"] },
  { group: "Manufacturing", options: ["Manufacturing & Industrial","Textile & Garment","Leather & Footwear","Plastics & Rubber","Chemical & Cleaning Products","Furniture & Wood Products","Metal Fabrication & Steel","Printing & Packaging","Automotive Parts & Assembly"] },
  { group: "Construction & Real Estate", options: ["Construction & Civil Engineering","Real Estate & Property Development","Building Materials & Hardware","Interior Design & Fit-out","Facility Management"] },
  { group: "Logistics & Transport", options: ["Logistics & Freight","Haulage & Trucking","Last-mile Delivery","Ride-hailing & Mobility","Maritime & Shipping","Aviation & Air Cargo"] },
  { group: "Technology", options: ["Software & SaaS","Fintech & Payments","Edtech","Healthtech","Agritech","Logistics Tech","Telecommunications","Hardware & Electronics","Cybersecurity","Cryptocurrency & Web3"] },
  { group: "Professional Services", options: ["Consulting & Advisory","Legal & Compliance","Accounting & Audit","Human Resources & Recruitment","Marketing & Advertising","Market Research & Analytics","Architecture & Engineering"] },
  { group: "Healthcare", options: ["Healthcare & Clinics","Pharmaceuticals & Medical Supplies","Dental & Optical Services","Mental Health & Wellness","Veterinary Services"] },
  { group: "Education", options: ["Education & Schools","Vocational & Skills Training","Tutoring & Test Prep","Childcare & Early Learning"] },
  { group: "Energy & Environment", options: ["Energy & Power","Solar & Renewables","Oil & Gas Services","Waste Management & Recycling","Water & Sanitation"] },
  { group: "Hospitality & Lifestyle", options: ["Hotels & Hospitality","Travel & Tourism","Events & Entertainment","Sports & Fitness","Fashion & Apparel","Beauty & Personal Care","Photography & Videography","Arts, Crafts & Creative"] },
  { group: "Media & Content", options: ["Media & Publishing","Film & Music Production","Digital Content & Influencer"] },
  { group: "Financial Services", options: ["Financial Services","Insurance","Microfinance & Cooperative","Pension & Investment"] },
  { group: "Other", options: ["Mining & Solid Minerals","Quarrying & Aggregates","Security Services","Fire Safety & Equipment","Non-profit & NGO","Religious & Faith-Based","Government & Public Sector","Social Enterprise","Other"] },
];

const ALL_SECTORS = SECTOR_GROUPS.flatMap(g => g.options);

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function LogoMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill={dark ? "rgba(255,255,255,0.08)" : "#0A2540"} />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
   Three steps:
     1 → Business details (name + registration status)
     2 → Sector
     3 → Done — creating the entity, redirect to dashboard
───────────────────────────────────────────────────────── */
export default function NewBusinessPage() {
  const [step,       setStep]       = useState<1 | 2 | 3>(1);
  const [name,       setName]       = useState("");
  const [status,     setStatus]     = useState<"registered" | "unregistered">("registered");
  const [sector,     setSector]     = useState("");
  const [loading,    setLoading]    = useState(false);

  /* ── Step 1 → 2 ── */
  const handleStep1 = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  /* ── Step 2 → 3 (create) ── */
  const handleCreate = async () => {
    if (!sector) return;
    setLoading(true);
    // TODO: POST /business/register { name, status, sector }
    // → creates the Business entity in the DB
    // → adds UserBusinessMembership { user_id, business_id, role: "owner" }
    // → sets active_business_id in session
    // → redirect to /dashboard
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep(3);
    await new Promise(r => setTimeout(r, 800));
    window.location.href = "/dashboard";
  };

  /* Panel copy per step */
  const panelCopy = [
    { headline: <>Every business<br />deserves its own<br />financial identity.</>,   sub: "This is a new, independent business entity. It will have its own transactions, score, and profile — completely separate from any other business you manage." },
    { headline: <>What does<br />{name || "this business"}<br />do?</>,               sub: "Your sector shapes how your financial identity is interpreted. You can update it any time from your business profile." },
    { headline: <>Setting up<br />{name}…</>,                                          sub: "Creating your business entity and workspace. You'll be taken to your dashboard in a moment." },
  ][step - 1];

  return (
    <>
      <style>{`
        .nb-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 420px 1fr;
          background: #fff;
        }
        @media (max-width: 860px) {
          .nb-root { grid-template-columns: 1fr; }
          .nb-dark { display: none !important; }
          .nb-right { padding: 40px 24px !important; }
        }
        @keyframes nb-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-animate { animation: nb-in 0.26s cubic-bezier(0.16,1,0.3,1) both; }
        .sector-option:hover { background: #F9FAFB !important; }
      `}</style>

      <div className="nb-root">

        {/* ── LEFT: DARK PANEL ── */}
        <div className="nb-dark" style={{ background: "#0A2540", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 56px", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <div aria-hidden style={{ position: "absolute", bottom: "-80px", left: "-80px", width: 380, height: 380, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} dark />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "white", letterSpacing: "-0.03em" }}>Creditlinker</span>
          </div>

          {/* Steps indicator */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ height: 3, borderRadius: 2, width: s === step ? 32 : 14, background: s < step ? "#10B981" : s === step ? "#00D4FF" : "rgba(255,255,255,0.12)", transition: "all 0.3s ease" }} />
              ))}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Step {step} of 3</span>
            </div>

            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #00D4FF, transparent)", marginBottom: 24, borderRadius: 2 }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "white", letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 14 }}>
              {panelCopy.headline}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 275 }}>
              {panelCopy.sub}
            </p>

            {/* Data isolation note */}
            {step <= 2 && (
              <div style={{ marginTop: 28, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  🔒 This business will have its own financial data, credit score, and profile — completely independent of any other businesses you operate.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ position: "relative" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
              All data is encrypted in transit and at rest.
            </p>
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="nb-right" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "56px 48px", background: "white" }}>
          <div style={{ maxWidth: 460, width: "100%" }}>

            {/* ── STEP 1: BUSINESS DETAILS ── */}
            {step === 1 && (
              <div className="nb-animate">
                {/* Back to selector */}
                <Link href="/select-business"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6B7280", textDecoration: "none", marginBottom: 32 }}>
                  <ArrowLeft size={14} /> Back to businesses
                </Link>

                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 8 }}>
                  New business entity
                </h1>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 36 }}>
                  This creates a standalone credit entity with its own financial identity and profile.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Business name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Business name *</label>
                    <Input
                      placeholder="e.g. Aduke Bakeries Ltd., Okonkwo Farms"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoFocus
                      style={{ height: 46, fontSize: 14, borderRadius: 9 }}
                      onKeyDown={e => { if (e.key === "Enter") handleStep1(); }}
                    />
                  </div>

                  {/* Registration status */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Registration status</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {(["registered", "unregistered"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          style={{
                            padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s",
                            border: `1.5px solid ${status === s ? "#0A2540" : "#E5E7EB"}`,
                            background: status === s ? "#0A2540" : "white",
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 700, color: status === s ? "white" : "#0A2540", marginBottom: 2, textTransform: "capitalize" as const }}>{s}</p>
                          <p style={{ fontSize: 11, color: status === s ? "rgba(255,255,255,0.5)" : "#9CA3AF" }}>
                            {s === "registered" ? "CAC registered business" : "Informal / sole trader"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary" size="lg"
                    disabled={!name.trim()}
                    onClick={handleStep1}
                    style={{ height: 48, fontSize: 15, fontWeight: 700, borderRadius: 10 }}
                  >
                    Continue <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: SECTOR ── */}
            {step === 2 && (
              <div className="nb-animate">
                <button onClick={() => setStep(1)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 32 }}>
                  <ArrowLeft size={14} /> Back
                </button>

                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 8 }}>
                  Select your sector
                </h1>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
                  This shapes how your financial data is interpreted and scored.
                </p>

                {/* Sector dropdown */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em", display: "block", marginBottom: 7 }}>
                    Industry / Sector *
                  </label>
                  <div style={{ position: "relative" as const }}>
                    <select
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                      style={{
                        width: "100%", height: 46, padding: "0 38px 0 14px",
                        borderRadius: 9, border: `1.5px solid ${sector ? "#0A2540" : "#E5E7EB"}`,
                        fontSize: 14, color: sector ? "#0A2540" : "#9CA3AF",
                        background: "white", appearance: "none", outline: "none", cursor: "pointer",
                        fontWeight: sector ? 500 : 400,
                      }}
                    >
                      <option value="">— Choose a sector —</option>
                      {SECTOR_GROUPS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronRight size={13} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: "#9CA3AF", pointerEvents: "none" }} />
                  </div>
                </div>

                {/* What happens next */}
                <div style={{ padding: "16px 18px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 28 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 10 }}>What happens after you create this business:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { icon: "🏢", text: "A standalone business profile is created" },
                      { icon: "📊", text: "Connect bank accounts to start building your financial identity" },
                      { icon: "🔒", text: "Data is completely separate from your other businesses" },
                      { icon: "🌿", text: "Add branches or franchises any time from Business Profile" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary" size="lg"
                  disabled={!sector || loading}
                  onClick={handleCreate}
                  style={{ width: "100%", height: 48, fontSize: 15, fontWeight: 700, borderRadius: 10 }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Creating business…</>
                    : <>Create business <ArrowRight size={15} /></>
                  }
                </Button>
              </div>
            )}

            {/* ── STEP 3: DONE ── */}
            {step === 3 && (
              <div className="nb-animate" style={{ textAlign: "center" as const }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <CheckCircle2 size={32} style={{ color: "#10B981" }} />
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "#0A2540", letterSpacing: "-0.04em", marginBottom: 10 }}>
                  {name} created
                </h1>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 28px" }}>
                  Taking you to your dashboard. Start by connecting your bank accounts to build your financial identity.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 1s linear infinite" }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="7" cy="7" r="5.5" stroke="#0A2540" strokeWidth="2" strokeDasharray="10 25" fill="none" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>Opening dashboard…</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
