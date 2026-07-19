"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck, Search, ArrowRight, Link2, GitCommit,
  Anchor, CheckCircle2, Clock, AlertTriangle, XCircle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   STATUS LEGEND — mirrors G2's verification_status enum
───────────────────────────────────────────────────────── */
const STATES = [
  {
    key: "VERIFIED",
    icon: CheckCircle2,
    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", glow: "rgba(16,185,129,0.18)",
    title: "Verified",
    body: "Every event's hash checks out, every day's Merkle root matches, and the anchor is confirmed on Stellar.",
  },
  {
    key: "PENDING",
    icon: Clock,
    color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", glow: "rgba(3,105,161,0.16)",
    title: "Pending",
    body: "Today's activity hasn't been anchored yet — anchoring runs once per day, so this is expected for events written today.",
  },
  {
    key: "INTEGRITY_WARNING",
    icon: AlertTriangle,
    color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", glow: "rgba(217,119,6,0.18)",
    title: "Integrity warning",
    body: "The event chain itself is intact, but a day's anchor hasn't been independently confirmed on-chain yet.",
  },
  {
    key: "TAMPERED",
    icon: XCircle,
    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", glow: "rgba(220,38,38,0.18)",
    title: "Tampered",
    body: "A recomputed hash or Merkle root doesn't match what was recorded — the record has been altered since it was written.",
  },
];

/* ─────────────────────────────────────────────────────────
   HASH-CHAIN SIGNATURE STRIP
───────────────────────────────────────────────────────── */
function ChainStrip() {
  const nodes = ["event_hash", "event_hash", "event_hash", "merkle_root", "stellar_tx"];
  return (
    <div className="flex items-center justify-center flex-wrap py-2">
      {nodes.map((label, i) => {
        const isRoot = label === "merkle_root";
        const isTx = label === "stellar_tx";
        const isLastLink = i === nodes.length - 2;
        return (
          <div key={i} className="flex items-center">
            <div
              className="flex flex-col items-center gap-1.5 rounded-[10px] px-3.5 py-2.5 min-w-[96px]"
              style={{
                background: isTx ? "#0A2540" : isRoot ? "rgba(0,212,255,0.08)" : "#F9FAFB",
                border: `1px solid ${isTx ? "#0A2540" : isRoot ? "rgba(0,212,255,0.3)" : "#E5E7EB"}`,
                boxShadow: isTx ? "0 0 22px rgba(0,212,255,0.35)" : isRoot ? "0 0 14px rgba(0,212,255,0.12)" : "none",
              }}
            >
              {isTx ? <Anchor size={13} color="#00D4FF" /> : isRoot ? <GitCommit size={13} style={{ color: "#00A8CC" }} /> : <Link2 size={12} style={{ color: "#9CA3AF" }} />}
              <span
                className="font-mono text-[10px] font-semibold"
                style={{ color: isTx ? "white" : isRoot ? "#0A5060" : "#6B7280" }}
              >
                {label}
              </span>
            </div>
            {i < nodes.length - 1 && (
              <div
                className="w-5 flex-shrink-0"
                style={{
                  height: isLastLink ? 2 : 1,
                  background: isLastLink ? "linear-gradient(90deg, #D1D5DB, #00D4FF)" : "#D1D5DB",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EYEBROW BADGE
───────────────────────────────────────────────────────── */
function Eyebrow({ label, variant = "dark" }: { label: string; variant?: "dark" | "light" }) {
  const onDark = variant === "dark";
  return (
    <div
      className="inline-flex items-center gap-[7px] rounded-full px-3.5 py-1.5"
      style={{
        background: onDark ? "rgba(0,212,255,0.1)" : "#F0FDFF",
        border: `1px solid ${onDark ? "rgba(0,212,255,0.3)" : "#BAE9F5"}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: "#00D4FF", boxShadow: "0 0 8px rgba(0,212,255,0.8)" }}
      />
      <span
        className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
        style={{ color: onDark ? "#67E8F9" : "#0A2540" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STATUS SWITCHER — segmented pill row + single detail panel.
   Replaces the old 4-card auto-fit grid, which wrapped unevenly
   (3 + 1) at this container width and left a lone card looking
   empty next to a large gap.
───────────────────────────────────────────────────────── */
function StatusSwitcher() {
  const [active, setActive] = useState(STATES[0].key);
  const current = STATES.find(s => s.key === active) ?? STATES[0];
  const Icon = current.icon;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {STATES.map(s => {
          const isActive = s.key === active;
          const SIcon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all cursor-pointer"
              style={{
                background: isActive ? s.bg : "white",
                border: `1.5px solid ${isActive ? s.border : "#E5E7EB"}`,
                color: isActive ? s.color : "#6B7280",
                boxShadow: isActive ? `0 0 14px ${s.glow}` : "none",
              }}
            >
              <SIcon size={14} />
              {s.title}
            </button>
          );
        })}
      </div>

      <Card
        className="max-w-2xl mx-auto py-8 px-8 transition-colors"
        style={{ borderColor: current.border, boxShadow: `0 4px 24px ${current.glow}` }}
      >
        <div className="flex gap-4 items-start">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: current.bg, border: `1px solid ${current.border}`, color: current.color }}
          >
            <Icon size={20} />
          </div>
          <div>
            <p className="font-display font-extrabold text-[17px] mb-1.5" style={{ color: "#0A2540", letterSpacing: "-0.02em" }}>
              {current.title}
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: "#6B7280" }}>
              {current.body}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function VerifyLandingPage() {
  const router = useRouter();
  const [clId, setClId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clId.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a Creditlinker ID to look up.");
      return;
    }
    const normalized = trimmed.startsWith("CL-") ? trimmed : `CL-${trimmed}`;
    router.push(`/verify/${normalized}`);
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden px-6 text-center"
        style={{
          background: "linear-gradient(180deg, #061529 0%, #0A2540 60%, #0C2C4D 100%)",
          padding: "104px 24px 72px",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: -160, left: "50%", transform: "translateX(-50%)",
            width: 640, height: 420, borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(0,212,255,0.16), transparent)",
          }}
        />

        <div className="relative max-w-[640px] mx-auto">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-[22px]"
            style={{
              background: "linear-gradient(155deg, #0F3A5F, #0A2540)",
              border: "1px solid rgba(0,212,255,0.35)",
              boxShadow: "0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.3)",
            }}
          >
            <ShieldCheck size={24} color="#00D4FF" />
          </div>

          <div className="mb-[22px]">
            <Eyebrow label="Integrity Explorer" variant="dark" />
          </div>

          <h1
            className="font-display font-extrabold mb-5"
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              color: "#F8FAFC",
              letterSpacing: "-0.04em",
              lineHeight: 1.12,
            }}
          >
            Don't take our word for it.<br />
            <span style={{ color: "#00D4FF" }}>Check the math.</span>
          </h1>
          <p className="text-base leading-[1.7] max-w-[480px] mx-auto mb-10" style={{ color: "#94A3B8" }}>
            Every event on a Creditlinker financial identity is hashed, chained, and sealed daily into a Merkle root anchored on Stellar. Enter a Creditlinker ID below to independently verify one.
          </p>

          <form onSubmit={handleSubmit} className="max-w-[440px] mx-auto">
            <div
              className="flex gap-2 p-2 rounded-2xl transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${focused ? "rgba(0,212,255,0.45)" : "rgba(255,255,255,0.1)"}`,
                boxShadow: focused ? "0 0 0 4px rgba(0,212,255,0.12)" : "none",
              }}
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }} />
                <input
                  type="text"
                  value={clId}
                  onChange={e => { setClId(e.target.value); setError(null); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="CL-XXXXXX"
                  className="w-full h-11 pl-10 pr-3.5 rounded-[10px] border-none bg-transparent font-mono text-sm uppercase outline-none"
                  style={{ color: "#F8FAFC" }}
                />
              </div>
              <button
                type="submit"
                className="ie-cta-btn flex items-center gap-1.5 h-11 px-[22px] rounded-[10px] font-extrabold text-sm cursor-pointer flex-shrink-0"
                style={{ background: "#00D4FF", color: "#0A2540", boxShadow: "0 0 20px rgba(0,212,255,0.35)" }}
              >
                Verify <ArrowRight size={14} />
              </button>
            </div>
            {error && <p className="text-xs mt-2.5 text-left" style={{ color: "#FCA5A5" }}>{error}</p>}
            <p className="text-xs mt-3.5" style={{ color: "#64748B" }}>
              Find this on any business's profile — it looks like <span className="font-mono" style={{ color: "#94A3B8" }}>CL-4F9A2C</span>.
            </p>
          </form>
        </div>
      </section>

      {/* ── CHAIN STRIP ── */}
      <section className="py-12 px-6 border-b" style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}>
        <ChainStrip />
        <p className="text-xs text-center mt-4 max-w-[480px] mx-auto" style={{ color: "#9CA3AF" }}>
          Each event links to the one before it. Each day's events seal into a Merkle root. Each root anchors on Stellar — publicly, permanently, independently checkable.
        </p>
      </section>

      {/* ── STATUS SWITCHER ── */}
      <section className="max-w-[960px] mx-auto px-6" style={{ padding: "80px 24px" }}>
        <div className="flex justify-center mb-8">
          <Eyebrow label="What you'll see" variant="light" />
        </div>
        <StatusSwitcher />
      </section>

      {/* ── WHY THIS EXISTS ── */}
      <section className="border-t px-6" style={{ borderColor: "#E5E7EB", padding: "80px 24px" }}>
        <div className="max-w-[640px] mx-auto text-center">
          <div className="flex justify-center mb-5">
            <Eyebrow label="Why this exists" variant="light" />
          </div>
          <p
            className="font-display font-extrabold mb-4"
            style={{ fontSize: "clamp(22px, 4vw, 32px)", color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1.2 }}
          >
            We wanted a system where you don't have to take our word for it.
          </p>
          <p className="text-[15px] leading-[1.7] max-w-[520px] mx-auto" style={{ color: "#6B7280" }}>
            Institutions extending credit need to know a business's records haven't been altered — not just told they haven't. So every action on Creditlinker is written once, hashed, and locked in place at the database level. Not even our own engineers can edit history after the fact; they can only append a new, equally-hashed correction that leaves the original visible forever. The goal isn't to make tampering hard to notice. It's to make it mathematically impossible to hide.
          </p>
        </div>
      </section>

      {/* ── HOW IT HAPPENS ── */}
      <section className="border-t border-b px-6" style={{ borderColor: "#E5E7EB", padding: "80px 24px", background: "#F9FAFB" }}>
        <div className="max-w-[640px] mx-auto">
          <div className="flex justify-center mb-5">
            <Eyebrow label="How it happens" variant="light" />
          </div>
          <p
            className="font-display font-extrabold mb-4 text-center"
            style={{ fontSize: "clamp(22px, 4vw, 32px)", color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1.2 }}
          >
            From one event to a public, unchangeable fingerprint.
          </p>
          <p className="text-[15px] leading-[1.7] max-w-[480px] mx-auto mb-10 text-center" style={{ color: "#6B7280" }}>
            Five steps, all automatic, all happening quietly in the background of every business on the platform.
          </p>

          <Card className="p-0 py-2 gap-0">
            {[
              {
                n: "1",
                title: "Every action becomes an event",
                body: "A document uploaded, a bank statement synced, capital received, a repayment made — each one is written once, as its own permanent, append-only record. Nothing is ever edited or deleted after the fact, by anyone.",
              },
              {
                n: "2",
                title: "Each event is hashed and chained",
                body: "Every event is run through SHA-256 over a canonical, deterministic version of its data, then linked to the hash of the event immediately before it. Change one byte of history and every hash after it breaks — there's no way to alter one record without it showing everywhere downstream.",
              },
              {
                n: "3",
                title: "Every day, a Merkle root is sealed",
                body: "At 00:00 UTC, that business's events from the day are built into a Merkle tree — a single root hash that represents everything that happened, all at once. Even a day with zero activity gets a fixed, well-formed root, so a missing day is itself a red flag.",
              },
              {
                n: "4",
                title: "The root is anchored on Stellar",
                body: "That day's root is written on-chain via a Stellar transaction — public, permanent, and completely outside Creditlinker's own database. Only the root itself is anchored: a 32-byte fingerprint, never business names, figures, or documents.",
              },
              {
                n: "5",
                title: "Anyone can verify it independently",
                body: "A financer, auditor, or the business itself can recompute the same hashes from the same event data, rebuild the same Merkle root, and compare it against what's actually sitting on the Stellar ledger — using any Stellar endpoint they choose, not one Creditlinker points them to.",
              },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex gap-4 px-6 py-5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-extrabold text-[13px]"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.3)", color: "#0A7A94" }}
                >
                  {step.n}
                </div>
                <div>
                  <p className="font-display font-bold text-[15px] mb-1" style={{ color: "#0A2540", letterSpacing: "-0.01em" }}>{step.title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </Card>

          <p className="text-[13px] leading-relaxed text-center mt-8 max-w-[480px] mx-auto" style={{ color: "#9CA3AF" }}>
            This explorer only ever shows hashes, roots, and blockchain status — never the underlying financial data itself. Verification never requires access to what happened, only proof that whatever happened hasn't been changed since.
          </p>
          <div className="flex justify-center mt-6">
            <Link
              href="/security"
              className="inline-flex items-center gap-2 rounded-[10px] font-bold text-sm no-underline"
              style={{ padding: "13px 28px", background: "#0A2540", color: "white", letterSpacing: "-0.01em" }}
            >
              Read more about our security model
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ie-cta-btn:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
        .ie-cta-btn {
          transition: filter 120ms ease, transform 120ms ease;
        }
      `}</style>
    </div>
  );
}
