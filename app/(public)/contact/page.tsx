"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MessageSquare,
  Building2,
  Code2,
  Handshake,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Send,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

/* ─────────────────────────────────────────────────────────
   CHANNEL CARD
───────────────────────────────────────────────────────── */
function ChannelCard({
  icon, title, desc, action, href, tag,
}: {
  icon: React.ReactNode; title: string; desc: string;
  action: string; href: string; tag?: string;
}) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
          {icon}
        </div>
        {tag && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 9px", borderRadius: 9999 }}>
            {tag}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>{desc}</p>
      </div>
      <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#0A2540", textDecoration: "none", marginTop: "auto" }}>
        {action} <ArrowUpRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LABEL
───────────────────────────────────────────────────────── */
function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
    </label>
  );
}

/* ─────────────────────────────────────────────────────────
   NATIVE SELECT  (no radix required)
───────────────────────────────────────────────────────── */
function NativeSelect({ id, value, onChange, children }: {
  id: string; value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 40, width: "100%", borderRadius: 8,
        border: "1px solid #E5E7EB", background: "white",
        padding: "0 12px", fontSize: 14, color: value ? "#0A2540" : "#9CA3AF",
        outline: "none", cursor: "pointer", appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: 36,
      }}
    >
      {children}
    </select>
  );
}

/* ─────────────────────────────────────────────────────────
   CONTACT FORM  (client component)
───────────────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", type: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 32px", textAlign: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.10)", border: "1.5px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
          <CheckCircle2 size={28} style={{ color: "#10B981" }} />
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em" }}>Message sent.</p>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, maxWidth: 340 }}>
          We&apos;ll get back to you within one business day. Check your inbox — you&apos;ll receive a confirmation shortly.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", type: "", subject: "", message: "" }); }}
          style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Name + Email */}
      <div className="ct-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Label htmlFor="ct-name" required>Full name</Label>
          <Input id="ct-name" placeholder="Ada Obi" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <Label htmlFor="ct-email" required>Work email</Label>
          <Input id="ct-email" type="email" placeholder="ada@company.ng" value={form.email} onChange={set("email")} required />
        </div>
      </div>

      {/* Company + Type */}
      <div className="ct-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Label htmlFor="ct-company">Company</Label>
          <Input id="ct-company" placeholder="Acme Ltd." value={form.company} onChange={set("company")} />
        </div>
        <div>
          <Label htmlFor="ct-type" required>I am a…</Label>
          <NativeSelect id="ct-type" value={form.type} onChange={(v) => setForm((p) => ({ ...p, type: v }))}>
            <option value="" disabled>Select one</option>
            <option value="business">Business / SME</option>
            <option value="financer">Financer / Capital provider</option>
            <option value="developer">Developer / Partner</option>
            <option value="press">Press / Media</option>
            <option value="other">Other</option>
          </NativeSelect>
        </div>
      </div>

      {/* Subject */}
      <div>
        <Label htmlFor="ct-subject" required>Subject</Label>
        <Input id="ct-subject" placeholder="How do I link my bank account?" value={form.subject} onChange={set("subject")} required />
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="ct-message" required>Message</Label>
        <Textarea
          id="ct-message"
          placeholder="Tell us what you need help with, or what you'd like to discuss…"
          value={form.message}
          onChange={set("message") as React.ChangeEventHandler<HTMLTextAreaElement>}
          style={{ minHeight: 140 }}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: loading ? "#E5E7EB" : "#0A2540", color: loading ? "#9CA3AF" : "white",
          padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15,
          border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
          width: "100%",
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: "2px solid #9CA3AF", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "ct-spin 0.7s linear infinite" }} />
            Sending…
          </>
        ) : (
          <><Send size={15} aria-hidden="true" /> Send message</>
        )}
      </button>

      <style>{`@keyframes ct-spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ContactPage() {
  return (
    <>
      <style>{`
        @media (max-width: 960px) {
          .ct-main-grid  { grid-template-columns: 1fr !important; }
          .ct-chan-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .ct-chan-grid  { grid-template-columns: 1fr !important; }
          .ct-form-row   { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section aria-label="Contact hero" style={{ position: "relative", overflow: "hidden", background: "#0A2540", paddingTop: 80, paddingBottom: 80 }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: "-20%", right: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)" }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", display: "inline-block" }} />
                Contact us
              </span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(36px,4.5vw,58px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.08, marginBottom: 20 }}>
              We&apos;re here to help<br />
              <span style={{ color: "#00D4FF" }}>and easy to reach.</span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.78, maxWidth: 500 }}>
              Whether you&apos;re a business trying to build your financial identity, a capital provider evaluating the platform, or a developer looking to integrate — we&apos;ll get back to you within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* ══ CHANNELS ══════════════════════════════════════════════ */}
      <section aria-label="Contact channels" style={{ padding: "64px 0", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ct-chan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <ChannelCard
              icon={<MessageSquare size={20} />}
              title="General enquiries"
              desc="Questions about the platform, pricing, how financial identity works, or anything else."
              action="Send a message"
              href="#contact-form"
              tag="1 day response"
            />
            <ChannelCard
              icon={<Building2 size={20} />}
              title="Business support"
              desc="Help linking your bank account, understanding your score, or navigating the financing marketplace."
              action="Get support"
              href="#contact-form"
            />
            <ChannelCard
              icon={<Handshake size={20} />}
              title="Financer partnerships"
              desc="Want to offer capital to verified SMEs using Creditlinker financial identities? Let&apos;s talk."
              action="Start a conversation"
              href="#contact-form"
            />
            <ChannelCard
              icon={<Code2 size={20} />}
              title="Developer & API"
              desc="Integration questions, API access requests, webhook setup, or partner data agreements."
              action="Developer portal"
              href="/developers"
            />
          </div>
        </div>
      </section>

      {/* ══ MAIN SECTION: FORM + SIDEBAR ═══════════════════════ */}
      <section id="contact-form" aria-labelledby="form-heading" style={{ padding: "88px 0", background: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div className="ct-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 72, alignItems: "start" }}>

            {/* ── LEFT: FORM ── */}
            <div>
              <div style={{ marginBottom: 36 }}>
                <div style={{ marginBottom: 14 }}>
                  <Badge><Mail size={10} aria-hidden="true" /> Send us a message</Badge>
                </div>
                <h2 id="form-heading" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(26px,3vw,40px)", letterSpacing: "-0.035em", color: "#0A2540", lineHeight: 1.1, marginBottom: 12 }}>
                  Tell us what you need.
                </h2>
                <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75 }}>
                  Fill in the form and the right team member will follow up directly. No bots, no ticket queues.
                </p>
              </div>

              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 18, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                <ContactForm />
              </div>
            </div>

            {/* ── RIGHT: SIDEBAR ── */}
            <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Office info */}
              <div style={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28, position: "relative", overflow: "hidden" }}>
                <GridBg />
                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 20 }}>Our office</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <MapPin size={15} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2 }}>Lagos, Nigeria</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Victoria Island<br />Lagos, NG 101241</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <Mail size={15} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2 }}>Email</p>
                        <a href="mailto:hello@creditlinker.io" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>hello@creditlinker.io</a>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <Clock size={15} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2 }}>Response time</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Within 1 business day<br />Mon–Fri, 9am–6pm WAT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 14 }}>Quick links</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { label: "How Creditlinker works",      href: "/how-it-works"    },
                    { label: "For businesses",              href: "/for-businesses"  },
                    { label: "For capital providers",       href: "/for-financers"   },
                    { label: "Developer documentation",     href: "/developers/docs" },
                    { label: "Security & data privacy",     href: "/security"        },
                    { label: "Careers",                     href: "/careers"         },
                  ].map((l, i, arr) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 0", fontSize: 13, color: "#374151", fontWeight: 500,
                        borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                      <ChevronRight size={13} style={{ color: "#9CA3AF" }} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Docs callout */}
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0 }}>
                  <Code2 size={18} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 4 }}>Building on Creditlinker?</p>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65, marginBottom: 10 }}>Check the developer docs and API reference before reaching out — most integration questions are answered there.</p>
                  <Link href="/developers/docs" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#0A2540", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Open docs <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════ */}
      <section aria-label="Call to action" style={{ padding: "88px 0", background: "#0A2540", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px,4vw,50px)", letterSpacing: "-0.04em", color: "white", lineHeight: 1.1, marginBottom: 18 }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.78, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            Create your financial identity in minutes, or explore the platform for your use case.
          </p>
          <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00D4FF", color: "#0A2540", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
              Create your financial identity <ArrowRight size={15} />
            </Link>
            <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.14)", padding: "12px 20px", borderRadius: 10 }}>
              See how it works →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
