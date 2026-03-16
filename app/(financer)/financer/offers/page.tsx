"use client";

import { useState } from "react";
import {
  Plus, Tag, Edit2, Trash2, CheckCircle2,
  Clock, X, ChevronDown, Info, Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /institution/financing (offers view)
                 POST /institution/financing (create offer)
───────────────────────────────────────────────────────── */
type OfferStatus = "active" | "draft" | "expired" | "accepted";

const CAPITAL_CATEGORIES = [
  "Working Capital Loan",
  "Term Loan",
  "Equipment Financing",
  "Invoice Financing",
  "Revenue Advance",
  "Trade Finance",
  "Overdraft Facility",
  "Asset Leasing",
];

const OFFERS = [
  {
    id: "OFF-001",
    title: "SME Working Capital Facility",
    capital_category: "Working Capital Loan",
    amount_min: "₦5M",
    amount_max: "₦50M",
    interest_rate: "18% p.a.",
    tenor: "6 – 12 months",
    min_score: 700,
    min_data_months: 12,
    sectors: ["Food & Beverage", "Retail", "Manufacturing"],
    status: "active" as OfferStatus,
    applications: 7,
    accepted: 2,
    created: "Nov 2024",
  },
  {
    id: "OFF-002",
    title: "Equipment & Asset Finance",
    capital_category: "Equipment Financing",
    amount_min: "₦10M",
    amount_max: "₦200M",
    interest_rate: "16% p.a.",
    tenor: "12 – 48 months",
    min_score: 650,
    min_data_months: 18,
    sectors: ["Agriculture", "Manufacturing", "Healthcare", "Logistics"],
    status: "active" as OfferStatus,
    applications: 4,
    accepted: 1,
    created: "Oct 2024",
  },
  {
    id: "OFF-003",
    title: "Invoice Discounting Line",
    capital_category: "Invoice Financing",
    amount_min: "₦1M",
    amount_max: "₦20M",
    interest_rate: "3.5% flat",
    tenor: "30 – 90 days",
    min_score: 680,
    min_data_months: 6,
    sectors: ["Technology", "Professional Services"],
    status: "draft" as OfferStatus,
    applications: 0,
    accepted: 0,
    created: "Dec 2024",
  },
];

function statusConfig(s: OfferStatus) {
  return {
    active:   { label: "Active",   variant: "success"     as const },
    draft:    { label: "Draft",    variant: "secondary"   as const },
    expired:  { label: "Expired",  variant: "outline"     as const },
    accepted: { label: "Accepted", variant: "default"     as const },
  }[s];
}

/* ─────────────────────────────────────────────────────────
   CREATE OFFER MODAL
───────────────────────────────────────────────────────── */
function CreateOfferModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: "",
    capital_category: CAPITAL_CATEGORIES[0],
    amount_min: "",
    amount_max: "",
    interest_rate: "",
    tenor: "",
    min_score: "",
    min_data_months: "",
    notes: "",
  });

  const field = (label: string, key: keyof typeof form, placeholder: string, type = "text") => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      {key === "capital_category" ? (
        <div style={{ position: "relative" }}>
          <select
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              width: "100%", height: 38, padding: "0 30px 0 12px",
              borderRadius: 8, border: "1px solid #E5E7EB",
              fontSize: 13, color: "#0A2540", background: "white",
              outline: "none", appearance: "none", cursor: "pointer",
            }}
          >
            {CAPITAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
        </div>
      ) : key === "notes" ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%", padding: "9px 12px",
            borderRadius: 8, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#0A2540", resize: "vertical",
            outline: "none", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            width: "100%", height: 38, padding: "0 12px",
            borderRadius: 8, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#0A2540", outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16,
        width: "100%", maxWidth: 560,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>Create Financing Offer</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Define the terms you offer to matched businesses.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Offer Title", "title", "e.g. SME Working Capital Facility")}
          {field("Capital Category", "capital_category", "")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Min Amount", "amount_min", "e.g. ₦5,000,000")}
            {field("Max Amount", "amount_max", "e.g. ₦50,000,000")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Interest Rate", "interest_rate", "e.g. 18% p.a.")}
            {field("Tenor", "tenor", "e.g. 6 – 12 months")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Minimum Score", "min_score", "e.g. 700", "number")}
            {field("Min Data Months", "min_data_months", "e.g. 12", "number")}
          </div>
          {field("Additional Notes", "notes", "Optional. Requirements, constraints, notes for the business.")}

          <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8 }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
              This offer will be shown to matched businesses on the discovery marketplace. They'll be able to apply directly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 40, borderRadius: 8,
            border: "1px solid #E5E7EB", background: "white",
            fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer",
          }}>
            Save as Draft
          </button>
          <button onClick={() => {
            // TODO: POST offer to API
            onClose();
          }} style={{
            flex: 1, height: 40, borderRadius: 8, border: "none",
            background: "#0A2540", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Publish Offer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   OFFER CARD
───────────────────────────────────────────────────────── */
function OfferCard({ offer }: { offer: typeof OFFERS[0] }) {
  const sc = statusConfig(offer.status);
  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 14, overflow: "hidden",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Header */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Tag size={15} color="#6B7280" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#0A2540", letterSpacing: "-0.02em" }}>
                {offer.title}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                {offer.capital_category} · Created {offer.created}
              </p>
            </div>
          </div>
          <Badge variant={sc.variant}>{sc.label}</Badge>
        </div>
      </div>

      {/* Terms grid */}
      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Amount Range",   value: `${offer.amount_min} – ${offer.amount_max}` },
          { label: "Interest Rate",  value: offer.interest_rate },
          { label: "Tenor",          value: offer.tenor },
          { label: "Min. Score",     value: `≥ ${offer.min_score}` },
          { label: "Min. Data",      value: `${offer.min_data_months} months` },
          { label: "Applications",   value: `${offer.applications} (${offer.accepted} accepted)` },
        ].map(row => (
          <div key={row.label}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              {row.label}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{row.value}</p>
          </div>
        ))}
      </div>

      {/* Sectors */}
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {offer.sectors.map(s => (
          <span key={s} style={{
            fontSize: 11, fontWeight: 600, color: "#6B7280",
            padding: "3px 8px", borderRadius: 9999,
            background: "#F3F4F6", border: "1px solid #E5E7EB",
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, height: 34, borderRadius: 7,
          border: "1px solid #E5E7EB", background: "white",
          fontSize: 12, fontWeight: 600, color: "#0A2540",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <Edit2 size={12} /> Edit
        </button>
        <button style={{
          width: 34, height: 34, borderRadius: 7,
          border: "1px solid #FEE2E2", background: "#FEF2F2",
          color: "#EF4444", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerOffers() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      {showCreate && <CreateOfferModal onClose={() => setShowCreate(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
            }}>
              Financing Offers
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {OFFERS.filter(o => o.status === "active").length} active offers ·{" "}
              {OFFERS.reduce((a, o) => a + o.applications, 0)} total applications
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", height: 36, borderRadius: 8,
              border: "none", background: "#0A2540", color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={13} /> Create Offer
          </button>
        </div>

        {/* How it works strip */}
        <div style={{
          display: "flex", gap: 0,
          background: "white", border: "1px solid #E5E7EB",
          borderRadius: 12, overflow: "hidden",
        }}>
          {[
            { step: "1", label: "Define terms",          sub: "Set amount, rate, tenor, eligibility criteria" },
            { step: "2", label: "Matched businesses see it", sub: "Discovery marketplace surfaces your offer" },
            { step: "3", label: "Business applies",      sub: "They consent and submit a financing request" },
            { step: "4", label: "You review & fund",     sub: "Review their identity and create a financing record" },
          ].map((s, i, arr) => (
            <div key={s.step} style={{
              flex: 1, padding: "14px 18px",
              borderRight: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#0A2540", color: "white",
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.step}
                </span>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{s.label}</p>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Offer grid */}
        {OFFERS.length === 0 ? (
          <div style={{
            padding: "60px 24px", textAlign: "center" as const,
            background: "white", borderRadius: 14, border: "1px solid #E5E7EB",
          }}>
            <Tag size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No offers yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Create your first financing offer to appear on the discovery marketplace.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: "#0A2540", color: "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Create Offer
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {OFFERS.map(offer => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </div>
    </>
  );
}
