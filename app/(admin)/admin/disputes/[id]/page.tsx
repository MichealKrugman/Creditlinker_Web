"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  Building2, Landmark, Scale, Clock, Activity,
  ShieldCheck, Zap, Info,
} from "lucide-react";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
//  API HELPER
// ─────────────────────────────────────────────────────────────
async function callFn(name: string, body?: object, method: "GET" | "POST" = "POST") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  DATA LOADER — direct Supabase queries
// ─────────────────────────────────────────────────────────────
async function loadDisputeDetail(id: string) {
  const { data: dispute, error } = await supabase
    .from("dispute_records")
    .select("*")
    .eq("dispute_id", id)
    .single();

  if (error || !dispute) throw new Error("Dispute not found");

  const [businessR, institutionR, timelineR, financingR] = await Promise.allSettled([
    supabase.from("businesses")
      .select("business_id, name, sector, profile_status, kyc_status, tier")
      .eq("business_id", dispute.business_id)
      .single(),
    supabase.from("institutions")
      .select("institution_id, name, category, tier")
      .eq("institution_id", dispute.institution_id)
      .single(),
    supabase.from("platform_events")
      .select("id, event_type, actor_type, actor_id, severity, message, metadata, created_at")
      .eq("target_id", id)
      .order("created_at", { ascending: true }),
    dispute.financing_record_id
      ? supabase.from("financing_records")
          .select("financing_id, status, terms, capital_category, granted_at")
          .eq("financing_id", dispute.financing_record_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const business   = businessR.status     === "fulfilled" ? businessR.value.data     : null;
  const institution= institutionR.status  === "fulfilled" ? institutionR.value.data  : null;
  const timeline   = timelineR.status     === "fulfilled" ? (timelineR.value.data ?? []) : [];
  const financing  = financingR.status    === "fulfilled" ? financingR.value.data    : null;

  return { dispute, business, institution, timeline, financing };
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
function fmtNGN(v: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(v);
}

function statusColor(s: string) {
  if (s === "active"    || s === "verified"  || s === "resolved") return { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)" };
  if (s === "suspended" || s === "rejected"  || s === "upheld")   return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" };
  if (s === "pending"   || s === "open"      || s === "disputed") return { bg: "#FFFBEB", color: "#D97706", border: "rgba(217,119,6,0.2)" };
  return { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
}

function severityColor(s: string) {
  if (s === "high"   || s === "critical") return "#EF4444";
  if (s === "medium" || s === "warning")  return "#F59E0B";
  return "#6B7280";
}

function eventIcon(type: string) {
  if (type?.includes("resolved") || type?.includes("closed"))  return <CheckCircle2 size={14} style={{ color: "#10B981" }} />;
  if (type?.includes("escalat")  || type?.includes("flag"))    return <AlertTriangle size={14} style={{ color: "#F59E0B" }} />;
  if (type?.includes("debit")    || type?.includes("payment"))  return <Zap size={14} style={{ color: "#EF4444" }} />;
  if (type?.includes("verif"))                                  return <ShieldCheck size={14} style={{ color: "#6366F1" }} />;
  return <Activity size={14} style={{ color: "#6B7280" }} />;
}

// ─────────────────────────────────────────────────────────────
//  RESOLVE MODAL
// ─────────────────────────────────────────────────────────────
function ResolveModal({
  dispute, onResolve, onClose,
}: {
  dispute: any;
  onResolve: (notes: string, triggerDebit: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [notes,        setNotes]        = useState("");
  const [triggerDebit, setTriggerDebit] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, overflow: "auto", maxHeight: "90vh" }}>
        <div style={{ padding: "24px 24px 18px", borderBottom: "1px solid #F3F4F6" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>Resolve Dispute</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>{dispute.dispute_id}</p>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Dispute Reason</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{dispute.reason ?? "No reason provided."}</p>
          </div>

          {dispute.initiated_by === "financer" && (
            <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" id="triggerDebit" checked={triggerDebit} onChange={(e) => setTriggerDebit(e.target.checked)} style={{ marginTop: 2, cursor: "pointer" }} />
                <div>
                  <label htmlFor="triggerDebit" style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", cursor: "pointer" }}>Trigger Direct Debit</label>
                  <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5, marginTop: 2 }}>
                    Authorize the financer to recover outstanding repayment from the business's linked account. Irreversible.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Resolution Notes <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain the resolution decision. This is recorded permanently…" rows={4}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
              onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")} />
          </div>

          {error && <p style={{ fontSize: 12, color: "#EF4444" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" disabled={!notes.trim() || saving}
              onClick={async () => {
                setSaving(true); setError("");
                try { await onResolve(notes.trim(), triggerDebit); }
                catch (e: any) { setError(e.message ?? "Resolution failed"); setSaving(false); }
              }}>
              <CheckCircle2 size={13} /> {saving ? "Resolving…" : "Mark Resolved"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CARD + KV
// ─────────────────────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#6B7280" }}>{icon}</span>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{title}</p>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, color: "#0A2540" }}>{value ?? "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function DisputeDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const user    = getMockAdminUser();
  const canAct  = canManage(user, "verifications");

  const [data,         setData]         = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [tab,          setTab]          = useState<"overview" | "timeline" | "resolution">("overview");
  const [showResolve,  setShowResolve]  = useState(false);
  const [actionMsg,    setActionMsg]    = useState("");
  const [actionErr,    setActionErr]    = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await loadDisputeDetail(id)); }
    catch (e: any) { setError(e.message ?? "Failed to load dispute"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleResolve(notes: string, triggerDebit: boolean) {
    const d = data.dispute;
    await callFn("resolve-dispute", {
      dispute_id:           d.dispute_id,
      financing_id:         d.financing_record_id,
      resolution_notes:     notes,
      trigger_direct_debit: triggerDebit,
    });
    setShowResolve(false);
    setActionMsg("Dispute resolved successfully.");
    await load();
  }

  // ── LOADING / ERROR STATES ───────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 12 }}>
      <Loader2 size={24} style={{ color: "#9CA3AF" }} className="animate-spin" />
      <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading dispute…</p>
    </div>
  );

  if (error || !data?.dispute) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16 }}>
      <AlertTriangle size={28} style={{ color: "#EF4444" }} />
      <p style={{ fontSize: 15, color: "#374151" }}>{error || "Dispute not found"}</p>
      <Link href="/admin/disputes"><Button variant="outline" size="sm" style={{ gap: 6 }}><ArrowLeft size={13} /> Back</Button></Link>
    </div>
  );

  const d          = data.dispute;
  const business   = data.business;
  const institution = data.institution;
  const timeline   = data.timeline as any[];
  const financing  = data.financing;

  const isOpen     = !d.resolution || d.resolution === "pending";
  const resC       = statusColor(d.resolution ?? "pending");
  const principal  = (financing?.terms as any)?.principal ?? (financing?.terms as any)?.amount ?? 0;

  const tabs = [
    { id: "overview",    label: "Overview"    },
    { id: "timeline",    label: "Timeline",   badge: timeline.length },
    { id: "resolution",  label: "Resolution"  },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* BACK + HEADER */}
      <div>
        <Link href="/admin/disputes"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", textDecoration: "none", marginBottom: 14 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0A2540")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6B7280")}>
          <ArrowLeft size={14} /> All Disputes
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: isOpen ? "#FEF2F2" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Scale size={18} style={{ color: isOpen ? "#EF4444" : "#10B981" }} />
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  Dispute
                </h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{d.dispute_id}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 9999, background: resC.bg, color: resC.color, border: `1px solid ${resC.border}`, textTransform: "capitalize" }}>
                {d.resolution ?? "Pending"}
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                Initiated by <strong style={{ color: "#374151" }}>{d.initiated_by}</strong>
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Opened {fmt(d.opened_at)}</span>
            </div>
          </div>

          {canAct && isOpen && (
            <Button size="sm" style={{ gap: 6 }} onClick={() => setShowResolve(true)}>
              <CheckCircle2 size={13} /> Resolve Dispute
            </Button>
          )}
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Status",       value: d.resolution ?? "Pending",        color: resC.color },
          { label: "Initiated By", value: d.initiated_by ?? "—",            color: "#0A2540" },
          { label: "Opened",       value: fmt(d.opened_at),                  color: "#0A2540" },
          { label: "Resolved",     value: fmt(d.resolved_at),                color: "#0A2540" },
          { label: "Direct Debit", value: d.direct_debit_triggered ? "Yes" : "No", color: d.direct_debit_triggered ? "#EF4444" : "#6B7280" },
          { label: "Platform Verified", value: d.platform_verified ? "Yes" : "No", color: d.platform_verified ? "#10B981" : "#6B7280" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: s.color, letterSpacing: "-0.02em", marginBottom: 2, textTransform: "capitalize" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 2, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: tab === t.id ? "#0A2540" : "transparent", color: tab === t.id ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}
            {"badge" in t && (t.badge as number) > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: tab === t.id ? "rgba(255,255,255,0.25)" : "#F3F4F6", color: tab === t.id ? "white" : "#6B7280", borderRadius: 9999, padding: "1px 6px" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {actionMsg && <div style={{ background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#065F46" }}>{actionMsg}</div>}
      {actionErr && <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#991B1B" }}>{actionErr}</div>}

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <Card title="Dispute Details" icon={<Scale size={15} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <KV label="Dispute ID"     value={<span style={{ fontFamily: "monospace", fontSize: 12 }}>{d.dispute_id}</span>} />
              <KV label="Status"         value={<span style={{ fontWeight: 700, color: resC.color, textTransform: "capitalize" }}>{d.resolution ?? "Pending"}</span>} />
              <KV label="Opened"         value={fmt(d.opened_at)} />
              <KV label="Resolved"       value={fmt(d.resolved_at)} />
              <KV label="Initiated By"   value={<span style={{ textTransform: "capitalize" }}>{d.initiated_by ?? "—"}</span>} />
              <KV label="Platform Verified" value={d.platform_verified ? "✓ Yes" : "✗ No"} />
              <KV label="Direct Debit"   value={d.direct_debit_triggered ? "⚡ Triggered" : "Not triggered"} />
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Reason</p>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#F9FAFB", padding: "12px 14px", borderRadius: 8 }}>{d.reason ?? "No reason provided."}</p>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <Card title="Business" icon={<Building2 size={15} />}>
              {business ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                      {business.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{business.name}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{business.sector}</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <KV label="Status" value={<span style={{ textTransform: "capitalize" }}>{business.profile_status}</span>} />
                    <KV label="KYC"    value={<span style={{ textTransform: "capitalize" }}>{business.kyc_status}</span>} />
                    <KV label="Tier"   value={<span style={{ textTransform: "capitalize" }}>{business.tier ?? "—"}</span>} />
                  </div>
                  <Link href={`/admin/businesses/${business.business_id}`}
                    style={{ fontSize: 12, color: "#6366F1", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    View business profile →
                  </Link>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Business data unavailable.</p>
              )}
            </Card>

            <Card title="Financer" icon={<Landmark size={15} />}>
              {institution ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#6366F1", flexShrink: 0 }}>
                      {institution.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{institution.name}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{institution.category}</p>
                    </div>
                  </div>
                  <KV label="Tier" value={<span style={{ textTransform: "capitalize" }}>{institution.tier ?? "—"}</span>} />
                  <Link href={`/admin/financers/${institution.institution_id}`}
                    style={{ fontSize: 12, color: "#6366F1", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    View financer profile →
                  </Link>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Financer data unavailable.</p>
              )}
            </Card>
          </div>

          {financing && (
            <Card title="Linked Financing Record" icon={<Info size={15} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <KV label="Financing ID" value={<span style={{ fontFamily: "monospace", fontSize: 12 }}>{financing.financing_id}</span>} />
                <KV label="Status"       value={<span style={{ textTransform: "capitalize" }}>{financing.status}</span>} />
                <KV label="Category"     value={financing.capital_category ?? "—"} />
                <KV label="Principal"    value={principal ? fmtNGN(principal) : "—"} />
                <KV label="Granted"      value={fmt(financing.granted_at)} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── TIMELINE TAB ─────────────────────────────────────── */}
      {tab === "timeline" && (
        <Card title="Event Timeline" icon={<Clock size={15} />}>
          {timeline.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <Activity size={18} style={{ color: "#D1D5DB", margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No platform events recorded for this dispute.</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              {/* vertical line */}
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#F3F4F6" }} />

              {timeline.map((ev: any, i: number) => (
                <div key={ev.id ?? i} style={{ position: "relative", marginBottom: i < timeline.length - 1 ? 24 : 0 }}>
                  {/* dot */}
                  <div style={{ position: "absolute", left: -21, top: 0, width: 16, height: 16, borderRadius: "50%", background: "white", border: "2px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {eventIcon(ev.event_type)}
                  </div>

                  <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", textTransform: "capitalize" }}>
                        {(ev.event_type ?? "event").replace(/_/g, " ")}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{fmtTime(ev.created_at)}</p>
                    </div>
                    {ev.message && (
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: 4 }}>{ev.message}</p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {ev.actor_type} · severity: <span style={{ color: severityColor(ev.severity), fontWeight: 600 }}>{ev.severity ?? "info"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── RESOLUTION TAB ───────────────────────────────────── */}
      {tab === "resolution" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isOpen ? (
            <Card title="Resolution" icon={<CheckCircle2 size={15} />}>
              <div style={{ padding: "8px 0" }}>
                {canAct ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                      <Info size={14} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
                        This dispute is currently <strong>open</strong>. You can mark it resolved after reviewing the reason and any platform events.
                        Resolution is permanent and creates an audit record.
                      </p>
                    </div>
                    <Button size="sm" style={{ gap: 6, alignSelf: "flex-start" }} onClick={() => setShowResolve(true)}>
                      <CheckCircle2 size={13} /> Resolve This Dispute
                    </Button>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>Your role does not allow resolving disputes.</p>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Resolution" icon={<CheckCircle2 size={15} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <KV label="Resolution"   value={<span style={{ fontWeight: 700, color: resC.color, textTransform: "capitalize" }}>{d.resolution}</span>} />
                <KV label="Resolved At"  value={fmt(d.resolved_at)} />
                <KV label="Platform Verified" value={d.platform_verified ? "✓ Yes" : "✗ No"} />
                <KV label="Direct Debit" value={d.direct_debit_triggered ? "⚡ Triggered" : "Not triggered"} />
              </div>
              {d.resolution_notes && (
                <div style={{ marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Resolution Notes</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#F9FAFB", padding: "12px 14px", borderRadius: 8 }}>{d.resolution_notes}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {showResolve && (
        <ResolveModal
          dispute={d}
          onResolve={handleResolve}
          onClose={() => setShowResolve(false)}
        />
      )}
    </div>
  );
}
