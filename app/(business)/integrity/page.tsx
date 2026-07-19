"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, XCircle,
  Loader2, ChevronDown, ChevronUp, Copy, CheckCheck, Download,
  FileText, Lock, ArrowUpRight, Info, GitCommit, Link2, Layers, Anchor,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

/* ─────────────────────────────────────────────────────────
   TYPES — same shapes as the public Integrity Explorer
   (/verify/[cl_id]), since both read business-integrity-report,
   business-anchors-list, and business-event-proof directly.
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
}

interface EventRow {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  previous_event_hash: string;
  event_hash: string;
}

interface AuditRow {
  action_id: string;
  occurred_at: string;
  actor: string;
  table_name: string;
  attempted_op: string;
  outcome: string;
  details: Record<string, unknown>;
}

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG — same five states as the public explorer
───────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; title: string; body: string }> = {
  VERIFIED: {
    icon: <CheckCircle2 size={18} />, color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0",
    title: "Verified",
    body: "Every event's hash checks out, every sealed day's Merkle root matches, and the anchor is confirmed on Stellar.",
  },
  PENDING: {
    icon: <Clock size={18} />, color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD",
    title: "Pending",
    body: "The chain is intact. Today's events haven't been anchored yet — that happens once per day, so this is expected.",
  },
  INTEGRITY_WARNING: {
    icon: <AlertTriangle size={18} />, color: "#D97706", bg: "#FFFBEB", border: "#FCD34D",
    title: "Integrity warning",
    body: "The event chain itself is intact, but at least one closed day's anchor hasn't been independently confirmed on-chain yet.",
  },
  TAMPERED: {
    icon: <XCircle size={18} />, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA",
    title: "Tampered",
    body: "A recomputed hash or Merkle root doesn't match what was recorded. Contact support immediately.",
  },
  TAMPERED_REMEDIATED: {
    icon: <ShieldCheck size={18} />, color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    title: "Tampered — remediated",
    body: "A past discrepancy was detected, quarantined, and corrected through a compensating record with its own later anchor.",
  },
};

const ANCHOR_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CONFIRMED: { color: "#10B981", bg: "#ECFDF5", label: "Confirmed" },
  PENDING:   { color: "#D97706", bg: "#FFFBEB", label: "Pending" },
  FAILED:    { color: "#DC2626", bg: "#FEF2F2", label: "Failed" },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function truncate(hash: string | null | undefined, head = 8, tail = 6): string {
  if (!hash) return "—";
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function humanizeEventType(eventType: string): string {
  return eventType.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────
   PRIMITIVES — mirrors graph/page.tsx's local style
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}
function StatBox({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: color ?? "#0A2540", letterSpacing: "-0.03em" }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}
function CopyableHash({ value, head, tail, dark }: { value: string | null | undefined; head?: number; tail?: number; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span style={{ fontFamily: "monospace", fontSize: 12, color: dark ? "rgba(255,255,255,0.25)" : "#D1D5DB" }}>—</span>;
  const copy = () => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  return (
    <button onClick={copy} title={value} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "monospace", fontSize: 12, color: dark ? "#67E8F9" : "#374151" }}>
      {truncate(value, head, tail)}
      {copied ? <CheckCheck size={11} style={{ color: "#10B981" }} /> : <Copy size={11} style={{ color: dark ? "rgba(255,255,255,0.35)" : "#9CA3AF" }} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   ANCHOR ROW — expandable proof drill-down + JSON download
───────────────────────────────────────────────────────── */
function AnchorRowItem({ anchor, clId, authedFetch, isLast }: { anchor: AnchorRow; clId: string; authedFetch: (path: string) => Promise<Response>; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusCfg = ANCHOR_STATUS_CONFIG[anchor.status] ?? { color: "#6B7280", bg: "#F3F4F6", label: anchor.status };

  const fetchProof = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await authedFetch(`/business-event-proof/${encodeURIComponent(clId)}/proof?date=${anchor.anchor_date}`);
      const json = await res.json();
      if (!res.ok) setError(json?.error?.message ?? "Failed to load proof for this day.");
      else setProof(json.data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, [anchor.anchor_date, clId, authedFetch]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !proof && !loading) fetchProof();
  };

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #F3F4F6" }}>
      <button onClick={handleToggle} style={{ display: "grid", width: "100%", gridTemplateColumns: "100px 80px 100px 1fr 24px", gap: 10, alignItems: "center", padding: "11px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{fmtDate(anchor.anchor_date)}</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>{anchor.event_count} evt{anchor.event_count !== 1 ? "s" : ""}</span>
        <span style={{ display: "inline-flex", alignItems: "center", justifySelf: "start", padding: "3px 9px", borderRadius: 9999, fontSize: 10, fontWeight: 800, color: statusCfg.color, background: statusCfg.bg }}>{statusCfg.label}</span>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{truncate(anchor.merkle_root, 10, 8)}</span>
        {open ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
      </button>

      {open && (
        <div style={{ padding: "0 20px 18px", background: "#FAFAFA" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 4px" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: "#9CA3AF" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Loading proof…</span>
            </div>
          ) : error ? (
            <p style={{ fontSize: 12, color: "#DC2626", padding: "10px 0" }}>{error}</p>
          ) : proof ? (
            <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ borderRadius: 10, padding: "14px 16px", background: "#0B1220", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, marginBottom: 4 }}>Merkle root</p>
                  <CopyableHash value={proof.merkle_root} head={12} tail={8} dark />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, marginBottom: 4 }}>Stellar tx</p>
                  <CopyableHash value={proof.stellar_tx_hash} head={12} tail={8} dark />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, marginBottom: 4 }}>Ledger seq</p>
                  <p style={{ fontFamily: "monospace", fontSize: 12, color: "#E2E8F0" }}>{proof.stellar_ledger_seq ?? "—"}</p>
                </div>
              </div>
              <button
                onClick={() => downloadJson(`creditlinker-proof-${clId}-${anchor.anchor_date}.json`, proof)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", padding: "7px 13px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}
              >
                <Download size={12} /> Download proof for this date
              </button>
              <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
                This is what you hand a financer who asks for proof your records haven't been tampered with — they can recompute everything in it independently.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EVENT LOG — gated, owner JWT
───────────────────────────────────────────────────────── */
function EventLogSection({ clId, authedFetch }: { clId: string; authedFetch: (path: string) => Promise<Response> }) {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 25;

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true); setError(null);
    try {
      const res = await authedFetch(`/business-integrity-report/${encodeURIComponent(clId)}/events?limit=${LIMIT}&offset=${nextOffset}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load event log.");
      const rows: EventRow[] = json.data.events;
      setEvents(prev => nextOffset === 0 ? rows : [...(prev ?? []), ...rows]);
      setHasMore(rows.length === LIMIT);
      setOffset(nextOffset + rows.length);
    } catch (e: any) {
      setError(e.message ?? "Failed to load event log.");
    } finally {
      setLoading(false);
    }
  }, [clId, authedFetch]);

  useEffect(() => { load(0); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clId]);

  return (
    <Card>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Event log</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>The raw append-only record every anchor is built from — every write, in order, unedited.</p>
      </div>
      {error && <p style={{ fontSize: 12, color: "#DC2626", padding: "16px 20px" }}>{error}</p>}
      {events && events.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: "#9CA3AF", padding: "24px 20px", textAlign: "center" as const }}>No events recorded yet.</p>
      )}
      {events && events.length > 0 && (
        <div>
          {events.map((ev, i) => (
            <div key={ev.event_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 20px", borderBottom: i < events.length - 1 ? "1px solid #F9FAFB" : "none", flexWrap: "wrap" as const }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{humanizeEventType(ev.event_type)}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDateTime(ev.created_at)}</p>
              </div>
              <CopyableHash value={ev.event_hash} head={8} tail={6} />
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 20px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={13} className="animate-spin" style={{ color: "#9CA3AF" }} /><span style={{ fontSize: 12, color: "#9CA3AF" }}>Loading…</span></div>
        ) : hasMore && events && events.length > 0 ? (
          <button onClick={() => load(offset)} style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Load more</button>
        ) : null}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   AUDIT TRAIL — gated, owner/admin only, framed plainly
───────────────────────────────────────────────────────── */
function AuditTrailSection({ clId, authedFetch }: { clId: string; authedFetch: (path: string) => Promise<Response> }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await authedFetch(`/business-integrity-report/${encodeURIComponent(clId)}/audit`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load audit trail.");
        setRows(json.data.audit_log);
      } catch (e: any) {
        setError(e.message ?? "Failed to load audit trail.");
      } finally {
        setLoading(false);
      }
    })();
  }, [clId, authedFetch]);

  return (
    <Card>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Blocked change attempts</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Your event log can't be edited or deleted by anyone, including Creditlinker's own team — this is the record of every attempt that was rejected because of that.</p>
      </div>
      {loading && (
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={14} className="animate-spin" style={{ color: "#9CA3AF" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Loading…</span>
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: "#DC2626", padding: "16px 20px" }}>{error}</p>}
      {rows && rows.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: "#9CA3AF", padding: "24px 20px", textAlign: "center" as const }}>No blocked attempts recorded — nothing has ever tried to alter this record.</p>
      )}
      {rows && rows.length > 0 && (
        <div>
          {rows.map((r, i) => (
            <div key={r.action_id} style={{ padding: "10px 20px", borderBottom: i < rows.length - 1 ? "1px solid #F9FAFB" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 9999 }}>{r.attempted_op} BLOCKED</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDateTime(r.occurred_at)}</span>
              </div>
              <p style={{ fontSize: 12, color: "#6B7280" }}>Attempted by <span style={{ fontFamily: "monospace" }}>{r.actor}</span> — {r.outcome}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function BusinessIntegrityPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();
  const clId = activeBusiness?.creditlinker_id ?? null;

  const [token, setToken] = useState<string | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [anchors, setAnchors] = useState<AnchorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGated, setShowGated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const authedFetch = useCallback((path: string) => fetch(
    `${API_BASE}${path}`,
    { headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
  ), [token]);

  useEffect(() => {
    if (!clId || !token) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [reportRes, anchorsRes] = await Promise.all([
          authedFetch(`/business-integrity-report/${encodeURIComponent(clId)}/integrity`),
          authedFetch(`/business-anchors-list/${encodeURIComponent(clId)}/anchors?limit=90`),
        ]);
        const reportJson = await reportRes.json();
        if (!reportRes.ok) throw new Error(reportJson?.error?.message ?? "Failed to load integrity report.");
        setReport(reportJson.data);
        if (anchorsRes.ok) {
          const anchorsJson = await anchorsRes.json();
          setAnchors(anchorsJson.data?.anchors ?? []);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load integrity report.");
      } finally {
        setLoading(false);
      }
    })();
  }, [clId, token, authedFetch]);

  const failures = report ? [report.failed_hash_comparison, report.failed_merkle_proof, report.failed_blockchain_anchor_verification].filter(Boolean) as string[] : [];

  if (bizLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={20} color="#00D4FF" />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>Integrity</h2>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Proof your records haven't been tampered with — verifiable independently, without trusting Creditlinker's word.</p>
          </div>
        </div>
        {clId && (
          <Link href={`/verify/${clId}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            View public page <ArrowUpRight size={13} />
          </Link>
        )}
      </div>

      {!clId ? (
        <Card>
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <ShieldCheck size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Nothing to verify yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 420, margin: "0 auto" }}>Your integrity ledger appears once the first event is recorded for this business.</p>
          </div>
        </Card>
      ) : loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "#D1D5DB" }} />
        </div>
      ) : error ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "16px 18px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12 }}>
          <AlertTriangle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: "#DC2626", lineHeight: 1.6 }}>{error}</p>
        </div>
      ) : report ? (
        <>
          {/* Status hero */}
          {(() => {
            const cfg = STATUS_CONFIG[report.verification_status] ?? STATUS_CONFIG.INTEGRITY_WARNING;
            return (
              <Card>
                <div style={{ padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start", background: cfg.bg }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "white", border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color }}>{cfg.icon}</div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>{cfg.title}</p>
                    <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6 }}>{cfg.body}</p>
                  </div>
                </div>
                {failures.length > 0 && (
                  <div style={{ padding: "14px 22px", borderTop: "1px solid #F3F4F6" }}>
                    {report.first_failed_event_id && <p style={{ fontSize: 12, color: "#7F1D1D", marginBottom: 4 }}>First affected event: <span style={{ fontFamily: "monospace" }}>{report.first_failed_event_id}</span></p>}
                    {failures.map((f, i) => <p key={i} style={{ fontSize: 12, color: "#7F1D1D" }}>{f}</p>)}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, padding: "16px 22px", borderTop: "1px solid #F3F4F6" }}>
                  <StatBox label="Events verified" value={report.total_events_verified.toLocaleString()} />
                  <StatBox label="Anchored days" value={report.number_of_anchored_batches.toLocaleString()} />
                  <StatBox label="Latest anchor" value={report.latest_blockchain_anchor ? fmtDate(report.latest_blockchain_anchor.anchor_date) : "—"} sub={report.latest_blockchain_anchor?.stellar_tx_hash ? truncate(report.latest_blockchain_anchor.stellar_tx_hash, 8, 6) : "Not yet anchored"} />
                  <StatBox label="Checked" value={fmtDateTime(report.verification_timestamp)} sub="Re-verifies live" />
                </div>
              </Card>
            );
          })()}

          {/* Anchor history */}
          <Card>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Anchor history</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>One row per sealed day. Expand a row to download proof for that date.</p>
            </div>
            {anchors.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "24px 20px", textAlign: "center" as const }}>No anchor batches recorded yet.</p>
            ) : (
              anchors.map((a, i) => <AnchorRowItem key={a.anchor_date} anchor={a} clId={clId} authedFetch={authedFetch} isLast={i === anchors.length - 1} />)
            )}
          </Card>

          {/* Gated sections toggle */}
          {!showGated ? (
            <button onClick={() => setShowGated(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer", alignSelf: "flex-start" }}>
              <Lock size={13} /> Show event log & blocked change attempts
            </button>
          ) : (
            <>
              <EventLogSection clId={clId} authedFetch={authedFetch} />
              <AuditTrailSection clId={clId} authedFetch={authedFetch} />
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>This is Creditlinker's own tamper-evidence ledger — separate from the Financial Relationship Graph's activity feed (see My Graph).</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
