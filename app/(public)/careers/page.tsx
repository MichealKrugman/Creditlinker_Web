"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  Handshake,
  Code2,
  BarChart3,
  Globe2,
  ShieldCheck,
  Zap,
  Building2,
  Mail,
  MessageSquare,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

function SectionHeading({
  id, badge, title, sub, center = false, dark = false,
}: {
  id?: string; badge?: React.ReactNode; title: React.ReactNode; sub?: string; center?: boolean; dark?: boolean;
}) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 56 }}>
      {badge && <div style={{ marginBottom: 16 }}>{badge}</div>}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.035em", color: dark ? "white" : "#0A2540", lineHeight: 1.1, marginBottom: sub ? 16 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: dark ? "rgba(255,255,255,0.5)" : "#4B5563", lineHeight: 1.78, maxWidth: center ? 580 : 520, margin: center ? "0 auto" : undefined }}>{sub}</p>}
    </div>
  );
}

function PillarCard({ icon, title, desc, dark = false }: { icon: React.ReactNode; title: string; desc: string; dark?: boolean }) {
  return (
    <div className="cr-card" style={{ background: dark ? "rgba(255,255,255,0.04)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, borderRadius: 16, padding: 24 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? "rgba(0,212,255,0.10)" : "#F0FDFF", border: `1px solid ${dark ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", marginBottom: 16 }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "white" : "#0A2540", marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</h3>
      <p style={{ fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "#6B7280", lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ROLE CARD
───────────────────────────────────────────────────────── */
function RoleCard({ title, type, desc, tags }: { title: string; type: string; desc: string; tags: string[] }) {
  return (
    <div className="cr-card" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</p>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0A5060", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 10px", borderRadius: 9999 }}>{type}</span>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
          <Briefcase size={15} aria-hidden="true" />
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.75, margin: 0 }}>{desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((tag) => (
          <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "3px 10px", borderRadius: 6 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────────────────── */

type FormType = "team" | "partnership" | "general";
type FormStatus = "idle" | "submitting" | "success" | "error";

interface FormState {
  name: string;
  email: string;
  type: FormType;
  organisation: string;
  message: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    type: "general",
    organisation: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!isValidEmail(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) next.message = "Please tell us a bit about yourself or your proposal.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    // TODO: wire to real API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus("success");
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    fontSize: 14,
    color: "#0A2540",
    background: "white",
    border: `1px solid ${hasError ? "#EF4444" : "#D1D5DB"}`,
    borderRadius: 10,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "48px 32px", background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#00D4FF" }}>
          <CheckCircle2 size={24} aria-hidden="true" />
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 10 }}>Submission received.</p>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, maxWidth: 360, margin: "0 auto" }}>
          Thank you for reaching out. All submissions are reviewed by the founding team and we will respond as promptly as circumstances allow.
        </p>
      </div>
    );
  }

  return (
    <div className="cr-form-box" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 6 }}>Submit an enquiry</p>
      <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 28 }}>Please complete the form below with sufficient detail for us to respond appropriately. All submissions are reviewed directly by the founding team.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Name + Email */}
        <div className="cr-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label htmlFor="cr-name" style={labelStyle}>
              Full name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="cr-name"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={inputStyle(!!errors.name)}
              placeholder="Your name"
            />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="cr-email" style={labelStyle}>
              Email <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="cr-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              style={inputStyle(!!errors.email)}
              placeholder="you@example.com"
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="cr-type" style={labelStyle}>I am reaching out about</label>
          <select
            id="cr-type"
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value as FormType)}
            style={{ ...inputStyle(false), appearance: "none", cursor: "pointer" } as React.CSSProperties}
          >
            <option value="general">General enquiry</option>
            <option value="team">Joining the team</option>
            <option value="partnership">Partnership or integration</option>
          </select>
        </div>

        {/* Organisation shown for partnership */}
        {form.type === "partnership" && (
          <div>
            <label htmlFor="cr-org" style={labelStyle}>Organisation</label>
            <input
              id="cr-org"
              type="text"
              autoComplete="organization"
              maxLength={200}
              value={form.organisation}
              onChange={(e) => handleChange("organisation", e.target.value)}
              style={inputStyle(false)}
              placeholder="Your company or organisation name"
            />
          </div>
        )}

        {/* Message */}
        <div>
          <label htmlFor="cr-message" style={labelStyle}>
            {form.type === "team"
              ? "Tell us about yourself"
              : form.type === "partnership"
              ? "Describe the opportunity"
              : "Your message"}{" "}
            <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            id="cr-message"
            rows={5}
            maxLength={2000}
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
            style={{ ...inputStyle(!!errors.message), resize: "vertical", minHeight: 120 } as React.CSSProperties}
            placeholder={
              form.type === "team"
                ? "Your background, what you want to work on, a link to your work..."
                : form.type === "partnership"
                ? "What you are building, how you see us working together, what you need..."
                : "How can we help?"
            }
          />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, textAlign: "right" }}>{form.message.length} / 2000</p>
          {errors.message && <p style={errorStyle}>{errors.message}</p>}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "submitting"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: status === "submitting" ? "#6B7280" : "#0A2540",
            color: "white",
            padding: "13px 24px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: status === "submitting" ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            width: "100%",
          }}
        >
          {status === "submitting" ? "Submitting..." : "Submit enquiry"}
          {status !== "submitting" && <ArrowRight size={15} aria-hidden="true" />}
        </button>

        {status === "error" && (
          <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>An error occurred. Please try again or contact us directly.</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function CareersPage() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .cr-hero-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cr-roles-grid   { grid-template-columns: 1fr !important; }
          .cr-partner-grid { grid-template-columns: 1fr 1fr !important; }
          .cr-pillars-grid { grid-template-columns: 1fr 1fr !important; }
          .cr-contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cr-section      { padding: 60px 0 !important; }
          .cr-hero-section { padding-top: 60px !important; padding-bottom: 60px !important; }
          .cr-pad          { padding: 0 20px !important; }
        }
        @media (max-width: 600px) {
          .cr-partner-grid { grid-template-columns: 1fr !important; }
          .cr-pillars-grid { grid-template-columns: 1fr !important; }
          .cr-cta-btns     { flex-direction: column !important; align-items: stretch !important; }
          .cr-cta-btns a   { justify-content: center !important; }
          .cr-section      { padding: 48px 0 !important; }
          .cr-hero-section { padding-top: 48px !important; padding-bottom: 48px !important; }
          .cr-pad          { padding: 0 16px !important; }
          .cr-card         { padding: 16px !important; }
          .cr-hero-infobox { padding: 20px !important; }
          .cr-form-box     { padding: 24px 16px !important; }
          .cr-form-row     { grid-template-columns: 1fr !important; }
          .cr-info-row     { flex-direction: column !important; align-items: flex-start !important; gap: 3px !important; }
          .cr-info-row .cr-info-value { text-align: left !important; }
        }
      `}</style>

      {/* HERO */}
      <section aria-label="Careers hero" className="cr-hero-section" style={{ position: "relative", overflow: "hidden", background: "#0A2540", paddingTop: 88, paddingBottom: 88 }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "-20%", right: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)" }} />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", bottom: "-15%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 65%)" }} />

        <div className="cr-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="cr-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 80, alignItems: "center" }}>

            <div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 }} />
                  Careers and partnerships
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(36px,4.8vw,60px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.06, marginBottom: 22 }}>
                Build the future of<br />African financial<br />
                <span style={{ color: "#00D4FF" }}>infrastructure.</span>
              </h1>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.78, marginBottom: 36, maxWidth: 500 }}>
                Creditlinker is building the data layer that connects SMEs to capital. We are looking for builders who care about this problem and partners who want to embed financial identity into their own products.
              </p>
              <div className="cr-cta-btns" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href="#open-roles" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                  See open roles <ArrowRight size={15} aria-hidden="true" />
                </a>
                <a href="#contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10, textDecoration: "none" }}>
                  Partner with us
                </a>
              </div>
            </div>

            <div className="cr-hero-infobox" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,212,255,0.6)", textTransform: "uppercase", marginBottom: 20 }}>What we are building</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                {[
                  { label: "Product type",   value: "Financial identity infrastructure" },
                  { label: "Market",         value: "African SMEs and capital providers" },
                  { label: "Stage",          value: "Early-stage build, high impact" },
                  { label: "Location",       value: "Lagos, Nigeria" },
                  { label: "Team size",      value: "Small and growing" },
                  { label: "Working style",  value: "Async-friendly, outcome-driven" },
                ].map((r, i, arr) => (
                  <div key={r.label} className="cr-info-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{r.label}</span>
                    <span className="cr-info-value" style={{ fontSize: 12, fontWeight: 700, color: "#00D4FF", fontFamily: "var(--font-display)", textAlign: "right" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY JOIN */}
      <section aria-labelledby="why-heading" className="cr-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="cr-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="why-heading"
            badge={<Badge><Zap size={10} aria-hidden="true" /> Why join us</Badge>}
            title={<>Work on a problem<br />that matters.</>}
            sub="Creditlinker is an early-stage team solving a structural problem in African financial infrastructure. If you are committed to work that produces real economic outcomes, this is the right environment."
            center
          />
          <div className="cr-pillars-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            <PillarCard icon={<Globe2 size={20} />} title="Measurable impact" desc="Every business that builds a verified financial identity through Creditlinker moves closer to capital it previously could not access. The outcomes are concrete and direct." />
            <PillarCard icon={<Zap size={20} />} title="High-leverage, early-stage" desc="The decisions made here will shape the product, the architecture, and the trajectory of the company. Contributors at this stage carry significant influence over outcomes." />
            <PillarCard icon={<ShieldCheck size={20} />} title="Ownership and accountability" desc="We engage people who are capable of owning problems end to end. Each person is given a clear scope, the relevant context, and the authority to execute." />
            <PillarCard icon={<BarChart3 size={20} />} title="Substantive technical problems" desc="Financial identity scoring, consent architecture, open banking integrations, and multidimensional data pipelines. The engineering and analytical challenges here are non-trivial." />
            <PillarCard icon={<Users size={20} />} title="A professional, respectful environment" desc="We operate without unnecessary hierarchy or internal friction. Feedback is direct and constructive. Contributions are evaluated on merit and results." />
            <PillarCard icon={<Building2 size={20} />} title="Strategic equity" desc="This is not a transactional role. Contributors are building a piece of critical financial infrastructure for a market of over 60 million SMEs across Africa." />
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section id="open-roles" aria-labelledby="roles-heading" className="cr-section" style={{ padding: "88px 0", background: "white" }}>
        <div className="cr-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="roles-heading"
            badge={<Badge><Briefcase size={10} aria-hidden="true" /> Open roles</Badge>}
            title={<>Positions we are<br />currently recruiting for.</>}
            sub="Creditlinker is at an early and consequential stage of development. The following areas represent our current priorities. All positions carry meaningful scope and responsibility."
          />
          <div className="cr-roles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 32 }}>
            <RoleCard
              title="Full-Stack Engineer"
              type="Full-time"
              desc="Take ownership of features across the API, dashboard, and data pipeline. Candidates should be capable of carrying a problem from specification through to production independently."
              tags={["TypeScript", "Full-stack", "API design", "Databases"]}
            />
            <RoleCard
              title="Credit and Data Analyst"
              type="Full-time"
              desc="Contribute to the refinement and expansion of our six-dimensional financial scoring model. This role involves working directly with transaction data, validating scoring logic, identifying edge cases, and improving how financial health is modelled across SME profiles."
              tags={["Financial analysis", "Data modeling", "SME credit", "Python or SQL"]}
            />
            <RoleCard
              title="Business Development"
              type="Full-time"
              desc="Develop the supply side of the platform by identifying, engaging, and onboarding capital providers. Candidates should have a clear understanding of how financers evaluate risk and make deployment decisions, and the ability to present a product compellingly to institutional audiences."
              tags={["Fintech", "Partnerships", "Capital markets", "Nigeria"]}
            />
            <RoleCard
              title="Open Application"
              type="Any"
              desc="If none of the listed positions correspond to your background, we remain open to hearing from individuals with a serious interest in the problem we are solving. Please outline your area of expertise and how you believe you could contribute."
              tags={["Any background", "Any function"]}
            />
          </div>

          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
              <Mail size={16} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>
              All positions are remote-compatible with a preference for Lagos, Nigeria.{" "}
              <a href="#contact" style={{ color: "#0A2540", fontWeight: 600, textDecoration: "underline" }}>Submit an application or enquiry using the form below.</a>
            </p>
          </div>
        </div>
      </section>

      {/* PARTNERSHIPS */}
      <section id="partnerships" aria-labelledby="partner-heading" className="cr-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "20%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="cr-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <SectionHeading
            id="partner-heading"
            badge={<Badge><Handshake size={10} aria-hidden="true" /> Partnerships</Badge>}
            title={<>Build on top of<br />financial identity.</>}
            sub="Creditlinker exposes a consent-gated partner API. Organisations building products that serve SMEs or capital providers are encouraged to explore what an integration could enable."
            center
            dark
          />
          <div className="cr-partner-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            <PillarCard
              dark
              icon={<Code2 size={20} />}
              title="Platform integrations"
              desc="Operators of platforms that serve SMEs, including accounting software, payment infrastructure, or business management tools, can contribute verified financial data to the Creditlinker pipeline through the partner API."
            />
            <PillarCard
              dark
              icon={<Building2 size={20} />}
              title="Capital providers"
              desc="Banks, microfinance institutions, equipment financiers, and alternative lenders may query verified financial identities and integrate Creditlinker directly into their underwriting and portfolio assessment workflows."
            />
            <PillarCard
              dark
              icon={<Globe2 size={20} />}
              title="Embedded finance builders"
              desc="Organisations incorporating lending, credit access, or financial assessment capabilities into their own products may leverage Creditlinker as the underlying financial identity layer, removing the need to build and maintain this infrastructure independently."
            />
          </div>

          <div style={{ marginTop: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0, maxWidth: 560 }}>
              Partner integrations are structured around three API access tiers: Read, Signal, and Build. All integrations require explicit business consent. Developer documentation is available for qualified partners.
            </p>
            <Link href="/developers" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF", padding: "10px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0 }}>
              Developer docs <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" aria-labelledby="contact-heading" className="cr-section" style={{ padding: "88px 0", background: "#F9FAFB" }}>
        <div className="cr-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="cr-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "start" }}>

            <div>
              <SectionHeading
                id="contact-heading"
                badge={<Badge><MessageSquare size={10} aria-hidden="true" /> Contact</Badge>}
                title={<>Reach out to<br />the team.</>}
                sub="Whether you are applying for a position, proposing a partnership, or seeking to understand more about the platform, please use the form to send us a message."
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: <Users size={15} />, title: "Employment applications", desc: "Please include a summary of your professional background, the area you wish to contribute to, and a link to relevant work. A formal CV is not required." },
                  { icon: <Handshake size={15} />, title: "Partnership enquiries", desc: "Please describe your organisation, your product, and how you envisage an integration with Creditlinker. We will follow up with relevant documentation or a meeting invitation." },
                  { icon: <MessageSquare size={15} />, title: "General correspondence", desc: "For general questions about the platform, our infrastructure, or our approach, please include sufficient detail for us to provide a useful response." },
                ].map((item) => (
                  <div key={item.title} style={{ display: "flex", gap: 14, padding: "16px 18px", background: "white", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* SEPARATOR */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        <Separator style={{ background: "#E5E7EB" }} />
      </div>

      {/* CTA */}
      <section aria-label="Call to action" className="cr-section" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />

        <div className="cr-pad" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
              Get started
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(32px,4.5vw,56px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
            Ready to build your<br />
            <span style={{ color: "#00D4FF" }}>financial identity?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.78, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
            Connect your bank account and get a verified multidimensional financial identity backed by your real financial data.
          </p>
          <div className="cr-cta-btns" style={{ display: "inline-flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              Create your financial identity <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/about" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "13px 22px", borderRadius: 10, textDecoration: "none" }}>
              Learn about us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
