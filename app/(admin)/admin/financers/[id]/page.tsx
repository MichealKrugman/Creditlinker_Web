"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw,
  Building2, DollarSign, ShieldCheck, Scale,
  Ban, CheckCircle2, Activity, Info, Users, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { canManage } from "@/lib/admin-rbac";
import { useAdminUser } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
//  callFn — still used for existing deployed functions (none here now)
// ─────────────────────────────────────────────────────────────
async function callFn(name: string, body?: object, method: "GET" | "POST" = "POST") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const base  = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res   = await fetch(base, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any)?.error?.message ?? `Request failed: ${res.status}`); }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  DIRECT DATA LOADER — replaces admin-get-financer-detail
// ─────────────────────────────────────────────────────────────
async function loadFinancerDetail(id: string) {
  const [instR, financingR, consentsR, disputesR] = await Promise.allSettled([
    supabase.from("institutions").select("*").eq("institution_id", id).single(),
    supabase.from("financing_records")
      .select("financing_id, business_id, status, terms, capital_category, granted_at")
      .eq("institution_id", id).order("granted_at", { ascending: false }).limit(50),
    supabase.from("consent_records")
      .select("consent_id, business_id, is_active, granted_at, expires_at")
      .eq("institution_id", id).order("granted_at", { ascending: false }),
    supabase.from("dispute_records")
      .select("dispute_id, business_id, reason, resolution, opened_at, resolved_at, initiated_by")
      .eq("institution_id", id).order("opened_at", { ascending: false }),
  ]);

  const inst      = instR.status      === "fulfilled" ? instR.value.data      : null;
  const financing = financingR.status === "fulfilled" ? (financingR.value.data ?? []) : [];
  const consents  = consentsR.status  === "fulfilled" ? (consentsR.value.data  ?? []) : [];
  const disputes  = disputesR.status  === "fulfilled" ? (disputesR.value.data  ?? []) : [];

  if (!inst) throw new Error("Institution not found");

  // Fetch business names for all business_ids
  const bizIds = [
    ...financing.map((f: any) => f.business_id),
    ...consents.map((c: any) => c.business_id),
    ...disputes.map((d: any) => d.business_id),
  ].filter(Boolean);
  const uniqueBizIds = [...new Set(bizIds)] as string[];
  let bizMap: Record<string, { name: string; sector: string }> = {};
  if (uniqueBizIds.length > 0) {
    const { data: bizRows } = await supabase
      .from("businesses")
      .select("business_id, name, sector")
      .in("business_id", uniqueBizIds);
    (bizRows ?? []).forEach((b: any) => { bizMap[b.business_id] = { name: b.name, sector: b.sector }; });
  }

  const activeFinancing  = (financing as any[]).filter((f: any) => f.status === "active");
  const totalPrincipal   = (financing as any[]).reduce((s: number, f: any) => s + ((f.terms as any)?.principal ?? (f.terms as any)?.amount ?? 0), 0);
  const activePrincipal  = activeFinancing.reduce((s: number, f: any) => s + ((f.terms as any)?.principal ?? (f.terms as any)?.amount ?? 0), 0);
  const openDisputes     = (disputes as any[]).filter((d: any) => d.resolution === "pending" || !d.resolution).length;

  return {
    institution: {
      institution_id:  inst.institution_id,
      name:            inst.name,
      category:        inst.category,
      tier:            inst.tier,
      owner_id:        inst.owner_id,
      created_at:      inst.created_at,
      approval_status: inst.approval_status ?? "pending",
      approved_at:     inst.approved_at     ?? null,
      suspended_at:    inst.suspended_at    ?? null,
      approval_notes:  inst.approval_notes  ?? null,
    },
    metrics: {
      total_financing:  (financing as any[]).length,
      active_financing: activeFinancing.length,
      total_principal:  totalPrincipal,
      active_principal: activePrincipal,
      active_consents:  (consents as any[]).filter((c: any) => c.is_active).length,
      total_consents:   (consents as any[]).length,
      open_disputes:    openDisputes,
      total_disputes:   (disputes as any[]).length,
    },
    financing: (financing as any[]).map((f: any) => ({
      id:           f.financing_id,
      business:     bizMap[f.business_id]?.name    ?? f.business_id,
      business_id:  f.business_id,
      sector:       bizMap[f.business_id]?.sector   ?? "—",
      status:       f.status,
      principal:    (f.terms as any)?.principal ?? (f.terms as any)?.amount ?? 0,
      category:     f.capital_category ?? "—",
      disbursed_at: f.granted_at,
      created_at:   f.granted_at,
    })),
    consents: (consents as any[]).map((co: any) => ({
      id:          co.consent_id,
      business:    bizMap[co.business_id]?.name   ?? co.business_id,
      business_id: co.business_id,
      sector:      bizMap[co.business_id]?.sector  ?? "—",
      is_active:   co.is_active,
      granted_at:  co.granted_at,
      expires_at:  co.expires_at,
    })),
    disputes: (disputes as any[]).map((d: any) => ({
      id:           d.dispute_id,
      business:     bizMap[d.business_id]?.name ?? d.business_id,
      business_id:  d.business_id,
      reason:       d.reason,
      resolution:   d.resolution ?? "pending",
      initiated_by: d.initiated_by,
      opened_at:    d.opened_at,
      resolved_at:  d.resolved_at,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
//  DIRECT ACTION — approve / suspend / reactivate financer
// ─────────────────────────────────────────────────────────────
async function applyFinancerAction(
  type: "approve" | "suspend" | "activate",
  institutionId: string,
  reason: string,
) {
  const now = new Date().toISOString();
  const updates: Record<string, any> = { approval_notes: reason };

  if (type === "approve") {
    updates.approval_status = "approved";
    updates.approved_at     = now;
    updates.suspended_at    = null;
  } else if (type === "suspend") {
    updates.approval_status = "suspended";
    updates.suspended_at    = now;
  } else {
    updates.approval_status = "approved";
    updates.suspended_at    = null;
  }

  const { error: updateErr } = await supabase
    .from("institutions")
    .update(updates)
    .eq("institution_id", institutionId);
  if (updateErr) throw new Error(updateErr.message);

  // Write audit log
  const { data: { session } } = await supabase.auth.getSession();
  await supabase.from("audit_logs").insert({
    actor_id:    session?.user?.id ?? "admin",
    actor_type:  "admin",
    action:      `admin.financer_${type}d`,
    target_type: "institution",
    target_id:   institutionId,
    metadata:    { reason, new_status: updates.approval_status },
  });
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function fmtNGN(v: number) {
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `₦${(v / 1_000).toFixed(0)}K`;
  return v > 0 ? `₦${v}` : "₦0";
}
function approvalColor(s: string) {
  if (s === "approved")  return { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)"  };
  if (s === "suspended") return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)"  };
  return                        { bg: "#FFFBEB", color: "#D97706", border: "rgba(217,119,6,0.2)"  };
}
function statusColor(s: string) {
  if (s === "active"   || s === "resolved") return { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)" };
  if (s === "suspended"|| s === "rejected") return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" };
  if (s === "pending")                      return { bg: "#FFFBEB", color: "#D97706", border: "rgba(217,119,6,0.2)" };
  return { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, description, label, danger, onConfirm, onClose }: {
  title: string; description: string; label: string; danger?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  async function go() {
    if (!reason.trim()) return;
    setLoading(true); setError("");
    try { await onConfirm(reason.trim()); onClose(); }
    catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(10,37,64,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", width:"100%", maxWidth:440, padding:28 }}>
        <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:17, color:"#0A2540", marginBottom:8 }}>{title}</h3>
        <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, marginBottom:20 }}>{description}</p>
        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Reason <span style={{ color:"#EF4444" }}>*</span></label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason — recorded in audit log"
          style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, resize:"none", outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }}
          onFocus={(e) => (e.target.style.borderColor="#0A2540")} onBlur={(e) => (e.target.style.borderColor="#E5E7EB")} />
        {error && <p style={{ fontSize:12, color:"#EF4444", marginTop:6 }}>{error}</p>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" disabled={!reason.trim() || loading} onClick={go}
            style={{ gap:6, background: danger ? "#EF4444" : undefined }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : null} {label}
          </Button>
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
    <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:"#6B7280" }}>{icon}</span>
        <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>{title}</p>
      </div>
      <div style={{ padding:"16px 20px" }}>{children}</div>
    </div>
  );
}
function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
      <p style={{ fontSize:13, color:"#0A2540" }}>{value ?? "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function FinancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { adminUser: user } = useAdminUser();
  const canAct = canManage(user, "financers");

  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState<"overview" | "portfolio" | "consents" | "disputes" | "actions">("overview");
  const [confirm, setConfirm] = useState<{ type: "approve"|"suspend"|"activate"; title: string; description: string; label: string; danger?: boolean } | null>(null);
  const [msg,     setMsg]     = useState("");
  const [err,     setErr]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await loadFinancerDetail(id)); }
    catch (e: any) { setError(e.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function runAction(type: "approve"|"suspend"|"activate", reason: string) {
    setMsg(""); setErr("");
    try {
      await applyFinancerAction(type, id, reason);
      setMsg("Action completed successfully.");
      await load();
    } catch (e: any) { setErr(e.message ?? "Action failed"); }
  }

  // ── LOADING / ERROR ────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"50vh", gap:12 }}>
      <Loader2 size={24} style={{ color:"#9CA3AF" }} className="animate-spin" />
      <p style={{ fontSize:14, color:"#9CA3AF" }}>Loading financer profile…</p>
    </div>
  );

  if (error || !data?.institution) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"50vh", gap:16 }}>
      <AlertTriangle size={28} style={{ color:"#EF4444" }} />
      <p style={{ fontSize:15, color:"#374151" }}>{error || "Institution not found"}</p>
      <Link href="/admin/financers"><Button variant="outline" size="sm" style={{ gap:6 }}><ArrowLeft size={13} /> Back</Button></Link>
    </div>
  );

  const inst = data.institution;
  const m    = data.metrics;
  const ac   = approvalColor(inst.approval_status);

  const tabs = [
    { id:"overview",  label:"Overview"  },
    { id:"portfolio", label:"Portfolio" },
    { id:"consents",  label:"Consents"  },
    { id:"disputes",  label:"Disputes"  },
    { id:"actions",   label:"Actions",  highlight: canAct },
  ] as const;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* BACK + HEADER */}
      <div>
        <Link href="/admin/financers" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"#6B7280", textDecoration:"none", marginBottom:14 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color="#0A2540")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color="#6B7280")}>
          <ArrowLeft size={14} /> All Financers
        </Link>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:14, background: ac.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color: ac.color, flexShrink:0 }}>
              {inst.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em", marginBottom:6 }}>{inst.name}</h2>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                {/* approval status badge */}
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:9999, background: ac.bg, color: ac.color, border:`1px solid ${ac.border}`, textTransform:"capitalize" }}>
                  {inst.approval_status}
                </span>
                <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:9999, background:"#F3F4F6", color:"#6B7280", border:"1px solid #E5E7EB" }}>{inst.category}</span>
                {inst.tier && <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:9999, background:"rgba(99,102,241,0.08)", color:"#6366F1", border:"1px solid rgba(99,102,241,0.2)", textTransform:"capitalize" }}>{inst.tier}</span>}
              </div>
            </div>
          </div>

          {/* Metric strip */}
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:12, padding:"12px 20px", display:"flex", gap:0 }}>
            {[
              { label:"Active Financing", value: m.active_financing },
              { label:"Active Portfolio", value: fmtNGN(m.active_principal) },
              { label:"Active Consents",  value: m.active_consents },
              { label:"Open Disputes",    value: m.open_disputes, warn: m.open_disputes > 0 },
            ].map((s, i) => (
              <div key={s.label} style={{ display:"flex", alignItems:"stretch" }}>
                {i > 0 && <div style={{ width:1, background:"#F3F4F6", margin:"0 24px" }} />}
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color: s.warn ? "#EF4444" : "#0A2540", letterSpacing:"-0.03em" }}>{s.value}</p>
                  <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:2, background:"white", border:"1px solid #E5E7EB", borderRadius:12, padding:4, width:"fit-content" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none", background: tab===t.id ? "#0A2540" : "transparent", color: tab===t.id ? "white" : "#6B7280", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.12s", position:"relative" }}>
            {t.label}
            {"highlight" in t && t.highlight && tab!==t.id && <span style={{ position:"absolute", top:6, right:6, width:6, height:6, borderRadius:"50%", background:"#EF4444" }} />}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card title="Institution Profile" icon={<Building2 size={15} />}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <KV label="Institution ID"   value={<span style={{ fontFamily:"monospace", fontSize:12 }}>{inst.institution_id}</span>} />
              <KV label="Category"         value={inst.category} />
              <KV label="Tier"             value={inst.tier ?? "—"} />
              <KV label="Registered"       value={fmt(inst.created_at)} />
              <KV label="Approval Status"  value={
                <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:ac.bg, color:ac.color, border:`1px solid ${ac.border}`, textTransform:"capitalize" }}>
                  {inst.approval_status}
                </span>
              } />
              <KV label="Approved At"      value={fmt(inst.approved_at)} />
              {inst.suspended_at && <KV label="Suspended At" value={fmt(inst.suspended_at)} />}
              {inst.approval_notes && (
                <div style={{ gridColumn:"1 / -1" }}>
                  <KV label="Last Action Notes" value={
                    <span style={{ fontSize:12, color:"#6B7280", lineHeight:1.6 }}>{inst.approval_notes}</span>
                  } />
                </div>
              )}
            </div>
          </Card>

          <Card title="Portfolio Summary" icon={<DollarSign size={15} />}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <KV label="Total Records"    value={m.total_financing} />
              <KV label="Active Financing" value={m.active_financing} />
              <KV label="Total Deployed"   value={fmtNGN(m.total_principal)} />
              <KV label="Active Portfolio" value={fmtNGN(m.active_principal)} />
              <KV label="Total Consents"   value={m.total_consents} />
              <KV label="Active Consents"  value={m.active_consents} />
              <KV label="Total Disputes"   value={m.total_disputes} />
              <KV label="Open Disputes"    value={
                <span style={{ color: m.open_disputes > 0 ? "#EF4444" : "#374151", fontWeight: m.open_disputes > 0 ? 700 : 400 }}>
                  {m.open_disputes}
                </span>
              } />
            </div>
          </Card>
        </div>
      )}

      {/* ── PORTFOLIO ───────────────────────────────────────── */}
      {tab === "portfolio" && (
        <Card title={`Financing Records (${data.financing.length})`} icon={<DollarSign size={15} />}>
          {data.financing.length === 0 ? (
            <p style={{ fontSize:13, color:"#9CA3AF" }}>No financing records.</p>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                    {["Business","Sector","Principal","Status","Category","Date"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.financing.map((f: any) => {
                    const c = statusColor(f.status);
                    return (
                      <tr key={f.id} style={{ borderBottom:"1px solid #F9FAFB" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background="#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"10px 12px" }}>
                          <Link href={`/admin/businesses/${f.business_id}`} style={{ fontSize:13, fontWeight:600, color:"#0A2540", textDecoration:"none" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="none")}>
                            {f.business}
                          </Link>
                        </td>
                        <td style={{ padding:"10px 12px", fontSize:12, color:"#6B7280" }}>{f.sector}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, fontWeight:700, color:"#0A2540" }}>{fmtNGN(f.principal)}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}`, textTransform:"capitalize" }}>{f.status}</span>
                        </td>
                        <td style={{ padding:"10px 12px", fontSize:12, color:"#6B7280", textTransform:"capitalize" }}>{f.category}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#9CA3AF" }}>{fmt(f.disbursed_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── CONSENTS ────────────────────────────────────────── */}
      {tab === "consents" && (
        <Card title={`Consent Records (${data.consents.length})`} icon={<Users size={15} />}>
          {data.consents.length === 0 ? (
            <p style={{ fontSize:13, color:"#9CA3AF" }}>No consents granted.</p>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                    {["Business","Sector","Status","Granted","Expires"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.consents.map((co: any) => {
                    const c = statusColor(co.is_active ? "active" : "suspended");
                    return (
                      <tr key={co.id} style={{ borderBottom:"1px solid #F9FAFB" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background="#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"10px 12px" }}>
                          <Link href={`/admin/businesses/${co.business_id}`} style={{ fontSize:13, fontWeight:600, color:"#0A2540", textDecoration:"none" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="none")}>
                            {co.business}
                          </Link>
                        </td>
                        <td style={{ padding:"10px 12px", fontSize:12, color:"#6B7280" }}>{co.sector}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
                            {co.is_active ? "Active" : "Revoked"}
                          </span>
                        </td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{fmt(co.granted_at)}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{fmt(co.expires_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── DISPUTES ────────────────────────────────────────── */}
      {tab === "disputes" && (
        <Card title={`Disputes (${data.disputes.length})`} icon={<Scale size={15} />}>
          {data.disputes.length === 0 ? (
            <p style={{ fontSize:13, color:"#9CA3AF" }}>No disputes on record.</p>
          ) : data.disputes.map((d: any) => {
            const c = statusColor(d.resolution === "resolved" ? "active" : "pending");
            return (
              <div key={d.id} style={{ padding:"12px 0", borderBottom:"1px solid #F9FAFB" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <Link href={`/admin/businesses/${d.business_id}`} style={{ fontSize:13, fontWeight:600, color:"#0A2540", textDecoration:"none" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="underline")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration="none")}>
                        {d.business}
                      </Link>
                      <Link href={`/admin/disputes/${d.id}`} style={{ fontSize:11, color:"#6366F1", fontWeight:600, textDecoration:"none" }}>
                        View →
                      </Link>
                    </div>
                    <p style={{ fontSize:13, color:"#374151", marginBottom:3 }}>{d.reason}</p>
                    <p style={{ fontSize:12, color:"#9CA3AF" }}>Opened {fmt(d.opened_at)} · by {d.initiated_by}{d.resolved_at ? ` · Resolved ${fmt(d.resolved_at)}` : ""}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}`, whiteSpace:"nowrap", textTransform:"capitalize" }}>{d.resolution}</span>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── ACTIONS ─────────────────────────────────────────── */}
      {tab === "actions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {!canAct && (
            <div style={{ background:"#FFFBEB", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"14px 18px", display:"flex", gap:10 }}>
              <Info size={14} style={{ color:"#D97706", flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:13, color:"#92400E" }}>Your role is view-only. You cannot take actions on this institution.</p>
            </div>
          )}

          {msg && <div style={{ background:"#ECFDF5", border:"1px solid rgba(16,185,129,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#065F46" }}>{msg}</div>}
          {err && <div style={{ background:"#FEF2F2", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#991B1B" }}>{err}</div>}

          {/* Current status */}
          <Card title="Onboarding Status" icon={<ShieldCheck size={15} />}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom: canAct ? 18 : 0 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:4 }}>Approval Status</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, padding:"4px 12px", borderRadius:9999, background:ac.bg, color:ac.color, border:`1px solid ${ac.border}`, textTransform:"capitalize" }}>
                    {inst.approval_status}
                  </span>
                  {inst.approved_at && (
                    <span style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                      <Clock size={11} /> Approved {fmt(inst.approved_at)}
                    </span>
                  )}
                  {inst.suspended_at && (
                    <span style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                      <Clock size={11} /> Suspended {fmt(inst.suspended_at)}
                    </span>
                  )}
                </div>
                {inst.approval_notes && (
                  <p style={{ fontSize:12, color:"#6B7280", marginTop:8, lineHeight:1.6 }}>
                    Last note: <em>{inst.approval_notes}</em>
                  </p>
                )}
              </div>
            </div>

            {canAct && (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingTop: 16, borderTop:"1px solid #F3F4F6" }}>
                {inst.approval_status !== "approved" && (
                  <Button variant="outline" size="sm" style={{ gap:6, color:"#10B981", borderColor:"rgba(16,185,129,0.3)" }}
                    onClick={() => setConfirm({ type:"approve", title:`Approve ${inst.name}?`, description:"Grant this institution full platform access. They can now browse businesses and create financing offers. This is recorded in the audit log.", label:"Approve Financer" })}>
                    <CheckCircle2 size={13} /> Approve Access
                  </Button>
                )}
                {inst.approval_status !== "suspended" && (
                  <Button variant="outline" size="sm" style={{ gap:6, color:"#EF4444", borderColor:"rgba(239,68,68,0.3)" }}
                    onClick={() => setConfirm({ type:"suspend", title:`Suspend ${inst.name}?`, description:"Immediately revoke this institution's platform access. Active consents are preserved but no new actions can be taken. This is recorded in the audit log.", label:"Suspend Access", danger:true })}>
                    <Ban size={13} /> Suspend Access
                  </Button>
                )}
                {inst.approval_status === "suspended" && (
                  <Button variant="outline" size="sm" style={{ gap:6 }}
                    onClick={() => setConfirm({ type:"activate", title:`Reactivate ${inst.name}?`, description:"Restore full platform access for this institution.", label:"Reactivate" })}>
                    <RefreshCw size={13} /> Reactivate
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title} description={confirm.description} label={confirm.label} danger={confirm.danger}
          onConfirm={async (reason) => { await runAction(confirm.type, reason); }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
