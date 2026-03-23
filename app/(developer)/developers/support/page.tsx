"use client";

import { useState } from "react";
import {
  MessageSquare, BookOpen, Github, Zap,
  CheckCircle2, Clock, ArrowUpRight, AlertCircle,
  Mail, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const RESOURCES = [
  {
    title: "Documentation",
    desc: "Integration guides, concepts, and how-tos",
    icon: BookOpen,
    href: "/developers/docs",
    cta: "Browse docs",
  },
  {
    title: "API Reference",
    desc: "All endpoints, parameters, and response shapes",
    icon: Zap,
    href: "/developers/api-reference",
    cta: "View reference",
  },
  {
    title: "GitHub",
    desc: "SDK source code, issue tracker, and examples",
    icon: Github,
    href: "#",
    cta: "Open GitHub",
    external: true,
  },
];

const FAQS = [
  {
    q: "How do I get production API access?",
    a: "Production keys are granted after you complete your sandbox integration and pass a brief review. Use the form below to request production access once your integration is ready.",
  },
  {
    q: "What is the rate limit on the API?",
    a: "The Free plan allows 10,000 requests per month. Rate limits are enforced per API key. Exceeding the limit returns a 429 response with a Retry-After header. Upgrade your plan to increase limits.",
  },
  {
    q: "How does the Mono bank linking flow work?",
    a: "Call POST /business/mono/initiate to get a redirect URL. Send the user to that URL to authenticate with their bank. Mono will call your callback or redirect the user back to your app with an auth code. Exchange the code via POST /business/mono/callback.",
  },
  {
    q: "How do I verify webhook signatures?",
    a: "Every webhook delivery includes an X-CL-Signature header. Compute HMAC-SHA256 of the raw request body using your webhook secret and compare it to the header value. Reject requests where they don't match.",
  },
  {
    q: "Can I use the sandbox without a real bank account?",
    a: "Yes. Sandbox requests return pre-seeded mock data. You can test all endpoints including score retrieval, consent flows, and financing lifecycle without linking a real bank account.",
  },
  {
    q: "How do I submit a data partnership request?",
    a: "Partners with build-tier access can submit verified data via the POST /partner/submit/:submission_type endpoint. To request partner access, use the form below and select 'Partner Integration' as the category.",
  },
];

type FormData = {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
};

const CATEGORIES = [
  "General question",
  "Production access request",
  "Integration help",
  "Bug report",
  "Partner integration",
  "Billing / plan upgrade",
  "Other",
];

/* ─────────────────────────────────────────────────────────
   FAQ ITEM
───────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "16px 22px",
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "left" as const,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", flex: 1, paddingRight: 16 }}>{q}</span>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          background: open ? "#0A2540" : "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: open ? "white" : "#9CA3AF", fontSize: 14, fontWeight: 700,
          transition: "all 0.15s",
        }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p style={{ padding: "0 22px 16px", fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
          {a}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FORM
───────────────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState<FormData>({ name: "", email: "", category: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const valid = form.name && form.email && form.category && form.subject && form.message;

  if (submitted) {
    return (
      <div style={{
        padding: "40px 24px", textAlign: "center" as const,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#ECFDF5", border: "2px solid #A7F3D0",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2 size={24} style={{ color: "#10B981" }} />
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", marginBottom: 6 }}>
            Message sent
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
            We typically respond within 1–2 business days. Check your email for a confirmation.
          </p>
        </div>
        <button
          onClick={() => { setForm({ name: "", email: "", category: "", subject: "", message: "" }); setSubmitted(false); }}
          style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #D1D5DB", borderRadius: 8,
    fontSize: 13, color: "#0A2540", outline: "none",
    background: "white", boxSizing: "border-box",
    transition: "border-color 0.12s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6,
  };

  return (
    <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row: name + email */}
      <div className="dev-support-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Name <span style={{ color: "#EF4444" }}>*</span></label>
          <input
            value={form.name} onChange={set("name")} placeholder="Your full name"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
          />
        </div>
        <div>
          <label style={labelStyle}>Email <span style={{ color: "#EF4444" }}>*</span></label>
          <input
            value={form.email} onChange={set("email")} placeholder="dev@yourcompany.io" type="email"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category <span style={{ color: "#EF4444" }}>*</span></label>
        <select
          value={form.category} onChange={set("category")}
          style={{ ...inputStyle, cursor: "pointer" }}
          onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
          onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label style={labelStyle}>Subject <span style={{ color: "#EF4444" }}>*</span></label>
        <input
          value={form.subject} onChange={set("subject")} placeholder="Brief description of your issue"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
          onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
        />
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>Message <span style={{ color: "#EF4444" }}>*</span></label>
        <textarea
          value={form.message} onChange={set("message")}
          placeholder="Describe your question or issue in detail. Include endpoint paths, error messages, or request IDs where relevant."
          rows={5}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
          onBlur={e => (e.currentTarget.style.borderColor = "#D1D5DB")}
        />
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary" size="sm"
          onClick={() => { if (valid) setSubmitted(true); }}
          disabled={!valid}
          style={{ gap: 6 }}
        >
          <Mail size={13} /> Send Message
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SupportPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Developer Support
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Get help with integrations, report issues, or request production access.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
          <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>Support online</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>· Typical response 1–2 days</span>
        </div>
      </div>

      {/* ── RESOURCE CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {RESOURCES.map(r => (
          <a
            key={r.title}
            href={r.href}
            target={r.external ? "_blank" : undefined}
            rel={r.external ? "noreferrer" : undefined}
            style={{
              display: "flex", flexDirection: "column", gap: 10,
              padding: "18px 20px",
              background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
              textDecoration: "none", transition: "all 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0A2540",
            }}>
              <r.icon size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>{r.title}</p>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{r.desc}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540" }}>
              {r.cta}
              {r.external ? <ExternalLink size={11} /> : <ArrowUpRight size={11} />}
            </div>
          </a>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <style>{`@media (max-width: 768px) { .dev-support-grid { grid-template-columns: 1fr !important; } .dev-support-form-row { grid-template-columns: 1fr !important; } }`}</style>
      <div className="dev-support-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>

        {/* LEFT — FAQ */}
        <div>
          <div style={{
            background: "white", border: "1px solid #E5E7EB",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
                Frequently Asked Questions
              </p>
            </div>
            {FAQS.map(faq => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>

        {/* RIGHT — Contact form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Form card */}
          <div style={{
            background: "white", border: "1px solid #E5E7EB",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{ padding: "18px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={15} style={{ color: "#0A2540" }} />
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
                  Send a message
                </p>
              </div>
            </div>
            <ContactForm />
          </div>

          {/* SLA info */}
          <div style={{
            padding: "16px 18px",
            background: "#F0FDFF",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Clock size={13} style={{ color: "#0891B2" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0A5060" }}>Response times</p>
            </div>
            {[
              { label: "General questions",        time: "1–2 business days" },
              { label: "Integration issues",        time: "Same business day" },
              { label: "Production access review",  time: "2–5 business days" },
              { label: "Critical / blocking bugs",  time: "Within 4 hours" },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingBottom: 7, marginBottom: 7,
                borderBottom: "1px solid rgba(0,212,255,0.1)",
              }}>
                <span style={{ fontSize: 12, color: "#0A5060" }}>{item.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0891B2" }}>{item.time}</span>
              </div>
            ))}
          </div>

          {/* Production access nudge */}
          <div style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, #0A2540, #0d3465)",
            borderRadius: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <AlertCircle size={13} style={{ color: "#00D4FF" }} />
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "white" }}>
                Requesting production access?
              </p>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>
              Select <strong style={{ color: "rgba(255,255,255,0.8)" }}>Production access request</strong> as the category above. Include your sandbox API key and a description of your integration.
            </p>
            <Link href="/developers/api-keys" style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 700, color: "#00D4FF",
              textDecoration: "none",
            }}>
              View your API keys <ArrowUpRight size={11} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
