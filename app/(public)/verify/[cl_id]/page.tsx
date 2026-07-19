"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, Clock, AlertTriangle, XCircle,
  HelpCircle, Anchor, Layers, GitCommit, ChevronDown, ChevronUp,
  Copy, CheckCheck, Loader2, Search, Link2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   TYPES — mirror business-integrity-report / -anchors-list /
   -event-proof response shapes exactly (see _shared/integrity-verify.ts)
───────────────────────────────────────────────────────── */
type VerificationStatus = "VERIFIED" | "PENDING" | "INTEGRITY_WARNING" | "TAMPERED" | "TAMPERED_REMEDIATED";

interface IntegrityReport {
  business_cl_id: string;
  verification_status: VerificationStatus;
  total_events_verified: number;
  number_of_anchored_batches: number;
  latest_blockchain_anchor: { batch_id?: string; anchor_date: string; stellar_tx_hash: string | null } | null;
  verification_timestamp: string;
  first_failed_event_id?: string;
  failed_hash_comparison?: string;
  failed_merkle_proof?: string;
  failed_blockchain_anchor_verification?: string;
}

interface AnchorRow {
  anchor_date: string;
  merkle_root: string;
  event_count: number;
  canonicalization_version: string;
  merkle_convention_version: string;
  stellar_tx_hash: string | null;
  stellar_ledger_seq: number | null;
  status: string;
  anchored_at: string | null;
}

interface ProofResponse {
  business_cl_id: string;
  anchor_date: string;
  event_count: number;
  events: { event_id: string; event_hash: string }[];
  merkle_root: string;
  canonicalization_version: string;
  merkle_convention_version: string;
  stellar_tx_hash: string | null;
  stellar_ledger_seq: number | null;
  anchor_status: string;
  anchored_at: string | null;
  event_proof?: {
    event_id: string;
    event_hash: string;
    proof: unknown;
    locally_recomputed_root: string;
    locally_recomputed_root_matches_stored: boolean;
    proof_walks_to_recomputed_root: boolean;
  };
}

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; glow: string; title: string; body: string }> = {
  VERIFIED: {
    icon: <CheckCircle2 size={20} />, color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", glow: "rgba(16,185,129,0.25)",
    title: "Verified",
    body: "Every event's hash checks out, every sealed day's Merkle root matches, and the anchor is confirmed on Stellar.",
  },
  PENDING: {
    icon: <Clock size={20} />, color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", glow: "rgba(3,105,161,0.22)",
    title: "Pending",
    body: "The chain is intact. Today's events haven't been anchored yet — that happens once per day, so this is expected.",
  },
  INTEGRITY_WARNING: {
    icon: <AlertTriangle size={20} />, color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", glow: "rgba(217,119,6,0.24)",
    title: "Integrity warning",
    body: "The event chain itself is intact, but at least one closed day's anchor hasn't been independently confirmed on-chain yet.",
  },
  TAMPERED: {
    icon: <XCircle size={20} />, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", glow: "rgba(220,38,38,0.24)",
    title: "Tampered",
    body: "A recomputed hash or Merkle root doesn't match what was recorded. The record has been altered since it was written.",
  },
  TAMPERED_REMEDIATED: {
    icon: <ShieldCheck size={20} />, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", glow: "rgba(124,58,237,0.24)",
    title: "Tampered — remediated",
    body: "A past discrepancy was detected, quarantined, and corrected through a compensating record with its own later anchor.",
  },
};

const ANCHOR_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  CONFIRMED: { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", label: "Confirmed" },
  PENDING:   { color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", label: "Pending" },
  FAILED:    { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Failed" },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function truncate(hash: string | null | undefined, head = 8, tail = 6): string {
  if (!hash) return "—";
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────
   EYEBROW BADGE — matches /verify landing
───────────────────────────────────────────────────────── */
function Eyebrow({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-[7px] rounded-full px-3.5 py-1.5" style={{ background: "#F0FDFF", border: "1px solid #BAE9F5" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00D4FF", boxShadow: "0 0 8px rgba(0,212,255,0.8)" }} />
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: "#0A2540" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COPYABLE HASH
───────────────────────────────────────────────────────── */
function CopyableHash({ value, head, tail, dark }: { value: string | null | undefined; head?: number; tail?: number; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="font-mono text-xs" style={{ color: dark ? "rgba(255,255,255,0.25)" : "#D1D5DB" }}>—</span>;
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  };
  return (
    <button onClick={copy} title={value} className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer p-0 font-mono text-xs" style={{ color: dark ? "#67E8F9" : "#374151" }}>
      {truncate(value, head, tail)}
      {copied ? <CheckCheck size={11} style={{ color: "#10B981" }} /> : <Copy size={11} style={{ color: dark ? "rgba(255,255,255,0.35)" : "#9CA3AF" }} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT TILE
───────────────────────────────────────────────────────── */
function StatTile({ label, value, sub, last }: { label: string; value: React.ReactNode; sub?: string; last?: boolean }) {
  return (
    <div className="p-5" style={{ borderRight: last ? "none" : "1px solid #F3F4F6" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="font-semibold text-[19px]" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#0A2540", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p className="text-[11px] mt-[3px]" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ANCHOR ROW — expandable proof drill-down
───────────────────────────────────────────────────────── */
function AnchorRowItem({
  anchor, clId, supabaseUrl, anonKey, isLast,
}: {
  anchor: AnchorRow; clId: string; supabaseUrl: string; anonKey: string; isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventIdInput, setEventIdInput] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  const statusCfg = ANCHOR_STATUS_CONFIG[anchor.status] ?? { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: anchor.status };

  const fetchProof = useCallback(async (eventId?: string) => {
    const setL = eventId ? setEventLoading : setLoading;
    setL(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ date: anchor.anchor_date });
      if (eventId) qs.set("event_id", eventId);
      const res = await fetch(
        `${supabaseUrl}/functions/v1/business-event-proof/${clId}/proof?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey } },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to load proof for this day.");
      } else {
        setProof(json.data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setL(false);
    }
  }, [anchor.anchor_date, clId, supabaseUrl, anonKey]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !proof && !loading) fetchProof();
  };

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #F3F4F6" }}>
      <button
        onClick={handleToggle}
        className="ie-anchor-row grid w-full gap-3 items-center px-6 py-3.5 bg-transparent border-none cursor-pointer text-left"
        style={{ gridTemplateColumns: "110px 90px 110px 1fr 90px 24px" }}
      >
        <span className="text-[13px] font-semibold" style={{ color: "#0A2540" }}>{fmtDate(anchor.anchor_date)}</span>
        <span className="text-xs" style={{ color: "#6B7280" }}>{anchor.event_count} event{anchor.event_count !== 1 ? "s" : ""}</span>
        <span
          className="inline-flex items-center justify-self-start px-2.5 py-[3px] rounded-full text-[10px] font-extrabold"
          style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
        >
          {statusCfg.label}
        </span>
        <span className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#9CA3AF" }}>
          {truncate(anchor.merkle_root, 10, 8)}
        </span>
        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{anchor.stellar_tx_hash ? "Anchored" : "No tx yet"}</span>
        {open ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
      </button>

      {open && (
        <div className="px-6 pb-5" style={{ background: "#FAFAFA" }}>
          {loading ? (
            <div className="flex items-center gap-2 py-4 px-1">
              <Loader2 size={14} className="animate-spin" style={{ color: "#9CA3AF" }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Loading independent proof data…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-[7px] p-3 rounded-lg mt-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertTriangle size={13} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: "#DC2626" }}>{error}</p>
            </div>
          ) : proof ? (
            <div className="pt-3 flex flex-col gap-3.5">

              {/* Anchor metadata — console-style dark panel */}
              <div
                className="rounded-xl p-4 grid gap-3.5"
                style={{ background: "#0B1220", border: "1px solid rgba(255,255,255,0.08)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Merkle root</p>
                  <CopyableHash value={proof.merkle_root} head={14} tail={10} dark />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Stellar tx</p>
                  <CopyableHash value={proof.stellar_tx_hash} head={14} tail={10} dark />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Ledger seq</p>
                  <p className="font-mono text-xs" style={{ color: "#E2E8F0" }}>{proof.stellar_ledger_seq ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Canonicalization / convention</p>
                  <p className="font-mono text-xs" style={{ color: "#E2E8F0" }}>{proof.canonicalization_version} / {proof.merkle_convention_version}</p>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                A real verifier fetches this day's Stellar transaction independently (via any Horizon/RPC endpoint) and confirms it carries this exact Merkle root — the value above alone is only Creditlinker's own claim.
              </p>

              {/* Leaf hashes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
                  Leaf event hashes ({proof.events.length}) — stable order used to build the tree
                </p>
                <div className="border rounded-[9px] overflow-hidden max-h-[220px] overflow-y-auto bg-white shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                  {proof.events.map((ev, i) => (
                    <div key={ev.event_id} className="flex justify-between gap-3 px-3 py-1.5" style={{ borderBottom: i < proof.events.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <CopyableHash value={ev.event_id} head={8} tail={4} />
                      <CopyableHash value={ev.event_hash} head={10} tail={8} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Single-event proof lookup */}
              <div className="border-t pt-3.5" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
                  Check one event's inclusion proof
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eventIdInput}
                    onChange={e => setEventIdInput(e.target.value)}
                    placeholder="event_id (uuid)"
                    className="flex-1 h-9 px-3 rounded-[7px] border text-xs font-mono outline-none"
                    style={{ borderColor: "#E5E7EB", color: "#0A2540" }}
                  />
                  <button
                    onClick={() => eventIdInput.trim() && fetchProof(eventIdInput.trim())}
                    disabled={!eventIdInput.trim() || eventLoading}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-[7px] border-none text-xs font-bold flex-shrink-0"
                    style={{
                      background: "#0A2540", color: "white",
                      cursor: eventIdInput.trim() ? "pointer" : "not-allowed", opacity: eventIdInput.trim() ? 1 : 0.5,
                    }}
                  >
                    {eventLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} Check
                  </button>
                </div>

                {proof.event_proof && (
                  <div
                    className="mt-3 p-3.5 rounded-[9px]"
                    style={{
                      background: proof.event_proof.proof_walks_to_recomputed_root && proof.event_proof.locally_recomputed_root_matches_stored ? "#ECFDF5" : "#FEF2F2",
                      border: `1px solid ${proof.event_proof.proof_walks_to_recomputed_root && proof.event_proof.locally_recomputed_root_matches_stored ? "#A7F3D0" : "#FECACA"}`,
                    }}
                  >
                    <div className="flex items-center gap-[7px] mb-1.5">
                      {proof.event_proof.proof_walks_to_recomputed_root && proof.event_proof.locally_recomputed_root_matches_stored
                        ? <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                        : <XCircle size={13} style={{ color: "#DC2626" }} />}
                      <p className="text-xs font-bold" style={{ color: "#0A2540" }}>
                        {proof.event_proof.proof_walks_to_recomputed_root && proof.event_proof.locally_recomputed_root_matches_stored
                          ? "Proof walks to the stored root"
                          : "Proof does not resolve to the stored root"}
                      </p>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>
                      This proof, plus the leaf hashes above, is a convenience cross-check computed server-side. A real verifier should recompute the Merkle path themselves rather than trust this result alone.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function VerifyReportPage({ params }: { params: Promise<{ cl_id: string }> }) {
  const { cl_id } = use(params);
  const clId = decodeURIComponent(cl_id).toUpperCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [anchors, setAnchors] = useState<AnchorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const headers = { Authorization: `Bearer ${anonKey}`, apikey: anonKey };
        const [reportRes, anchorsRes] = await Promise.all([
          fetch(`${supabaseUrl}/functions/v1/business-integrity-report/${clId}/integrity`, { headers }),
          fetch(`${supabaseUrl}/functions/v1/business-anchors-list/${clId}/anchors?limit=90`, { headers }),
        ]);

        if (reportRes.status === 404) {
          if (!cancelled) { setNotFound(true); setLoading(false); }
          return;
        }

        const reportJson = await reportRes.json();
        const anchorsJson = await anchorsRes.json();

        if (!reportRes.ok) throw new Error(reportJson?.error?.message ?? "Failed to load verification report.");

        if (!cancelled) {
          setReport(reportJson.data);
          setAnchors(anchorsRes.ok ? (anchorsJson.data?.anchors ?? []) : []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong loading this report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clId, supabaseUrl, anonKey]);

  const failures = report ? [
    report.failed_hash_comparison,
    report.failed_merkle_proof,
    report.failed_blockchain_anchor_verification,
  ].filter(Boolean) as string[] : [];

  return (
    <div className="bg-white min-h-screen">

      {/* ── TOP BAR ── */}
      <div className="border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="max-w-[880px] mx-auto px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/verify" className="inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline" style={{ color: "#6B7280" }}>
            <ArrowLeft size={14} /> Verify a different ID
          </Link>
          <Eyebrow label="Integrity Explorer" />
        </div>
      </div>

      <div className="max-w-[880px] mx-auto px-6" style={{ padding: "32px 24px 96px" }}>

        <div className="flex items-center gap-2.5 mb-6 flex-wrap">
          <p className="font-mono text-sm font-bold" style={{ color: "#9CA3AF" }}>{clId}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin" style={{ color: "#D1D5DB" }} />
          </div>
        ) : notFound ? (
          <Card className="text-center py-20 px-6 border-dashed border-2" style={{ borderColor: "#E5E7EB" }}>
            <HelpCircle size={30} className="mx-auto mb-3.5" style={{ color: "#D1D5DB" }} />
            <p className="font-display font-bold text-[17px] mb-2" style={{ color: "#0A2540" }}>No business found for {clId}</p>
            <p className="text-[13px] max-w-[380px] mx-auto" style={{ color: "#9CA3AF" }}>Double-check the Creditlinker ID — it's usually written as CL- followed by six characters.</p>
          </Card>
        ) : error ? (
          <div className="flex items-start gap-2.5 p-4 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
            <p className="text-[13px] leading-relaxed" style={{ color: "#DC2626" }}>{error}</p>
          </div>
        ) : report ? (
          <>
            {/* ── STATUS HERO ── */}
            {(() => {
              const cfg = STATUS_CONFIG[report.verification_status] ?? STATUS_CONFIG.INTEGRITY_WARNING;
              return (
                <Card
                  className="mb-6 py-7 px-7 flex-row gap-[18px] items-start"
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  <div
                    className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0"
                    style={{ border: `1px solid ${cfg.border}`, color: cfg.color, boxShadow: `0 0 0 5px ${cfg.bg}, 0 0 20px ${cfg.glow}` }}
                  >
                    {cfg.icon}
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-xl mb-1.5" style={{ color: "#0A2540", letterSpacing: "-0.03em" }}>{cfg.title}</p>
                    <p className="text-sm leading-relaxed max-w-[560px]" style={{ color: "#4B5563" }}>{cfg.body}</p>
                  </div>
                </Card>
              );
            })()}

            {/* ── FAILURE DETAIL ── */}
            {failures.length > 0 && (
              <div className="rounded-xl p-5 mb-6" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "#DC2626" }}>
                  What the verifier found
                </p>
                <div className="flex flex-col gap-2">
                  {report.first_failed_event_id && (
                    <p className="text-xs" style={{ color: "#7F1D1D" }}>First affected event: <span className="font-mono">{report.first_failed_event_id}</span></p>
                  )}
                  {failures.map((f, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: "#7F1D1D" }}>{f}</p>
                  ))}
                </div>
              </div>
            )}

            {/* ── STATS ── */}
            <Card className="grid p-0 mb-8 gap-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              <StatTile label="Events verified" value={report.total_events_verified.toLocaleString()} />
              <StatTile label="Anchored days" value={report.number_of_anchored_batches.toLocaleString()} />
              <StatTile
                label="Latest anchor"
                value={report.latest_blockchain_anchor ? fmtDate(report.latest_blockchain_anchor.anchor_date) : "—"}
                sub={report.latest_blockchain_anchor?.stellar_tx_hash ? truncate(report.latest_blockchain_anchor.stellar_tx_hash, 8, 6) : "Not yet anchored"}
              />
              <div className="p-5" style={{ gridColumn: "auto" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>Checked</p>
                <p className="font-semibold text-[15px]" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#0A2540", letterSpacing: "-0.01em" }}>{fmtDateTime(report.verification_timestamp)}</p>
                <p className="text-[11px] mt-[3px]" style={{ color: "#9CA3AF" }}>Just now — this page always re-verifies live</p>
              </div>
            </Card>

            {/* ── ANCHOR HISTORY ── */}
            <Card className="p-0 mb-10 overflow-hidden gap-0">
              <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div>
                  <p className="font-display font-bold text-sm" style={{ color: "#0A2540", letterSpacing: "-0.02em" }}>Anchor history</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>One row per sealed day. Expand any row to see its independently verifiable proof.</p>
                </div>
                <Anchor size={16} className="flex-shrink-0" style={{ color: "#9CA3AF" }} />
              </div>

              {anchors.length === 0 ? (
                <div className="py-9 px-6 text-center">
                  <Layers size={26} className="mx-auto mb-2.5" style={{ color: "#D1D5DB" }} />
                  <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No anchor batches recorded yet.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 px-6 py-2" style={{ gridTemplateColumns: "110px 90px 110px 1fr 90px 24px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Date", "Events", "Status", "Merkle root", "Anchor", ""].map(h => (
                      <p key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</p>
                    ))}
                  </div>
                  {anchors.map((a, i) => (
                    <AnchorRowItem key={a.anchor_date} anchor={a} clId={clId} supabaseUrl={supabaseUrl} anonKey={anonKey} isLast={i === anchors.length - 1} />
                  ))}
                </>
              )}
            </Card>

            {/* ── HOW VERIFICATION WORKS ── */}
            <Card className="py-6 px-[26px]" style={{ background: "#F9FAFB" }}>
              <div className="mb-3.5">
                <Eyebrow label="Verification steps" />
              </div>
              <p className="font-display font-bold text-sm mb-3.5" style={{ color: "#0A2540", letterSpacing: "-0.02em" }}>How this check works</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <GitCommit size={13} />, text: "Every event's hash is recomputed from its own fields and checked against what was stored." },
                  { icon: <Link2 size={13} />, text: "Each event's previous_event_hash is checked against the prior event, catching anything inserted, removed, or reordered." },
                  { icon: <Layers size={13} />, text: "Each sealed day's events are rebuilt into a Merkle tree and compared against the stored root." },
                  { icon: <Anchor size={13} />, text: "The anchor itself is only 'confirmed' once it's been submitted to and read back from Stellar." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-md bg-white border flex items-center justify-center flex-shrink-0" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>{step.icon}</div>
                    <p className="text-xs leading-relaxed pt-[3px]" style={{ color: "#6B7280" }}>{step.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed mt-4 pt-4 border-t" style={{ color: "#9CA3AF", borderColor: "#E5E7EB" }}>
                None of this requires trusting Creditlinker. Every hash and root above can be recomputed independently from the leaf data this page provides, and every anchor can be checked against Stellar directly.
              </p>
            </Card>
          </>
        ) : null}

      </div>

      <style jsx>{`
        .ie-anchor-row:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
