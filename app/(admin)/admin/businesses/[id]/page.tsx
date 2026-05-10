"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, Loader2, Building2,
  ShieldCheck, AlertTriangle, CheckCircle2,
  Ban, Play, Edit2, Save, X, Wallet,
  Link as LinkIcon, FileText, TrendingUp,
  Clock, Activity, ChevronRight, Info,
  DollarSign, Scale, BarChart3,
} from "lucide-react";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
//  API HELPER
// ─────────────────────────────────────────────────────────────
async function callFn(name: string, body?: object, method: "GET" | "POST" = "GET") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const base  = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res   = await fetch(base, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
      apikey:         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

async function callFnWithParams(name: string, params: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const url   = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
      apikey:         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function scoreColor(s: number | null) {
  if (!s)       return "#9CA3AF";
  if (s >= 750) return "#10B981";
  if (s >= 600) return "#F59E0B";
  return "#EF4444";
}

function statusColor(s: string) {
  if (s === "active"   || s === "verified")  return { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)" };
  if (s === "suspended"|| s === "rejected")  return { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" };
  if (s === "pending"  || s === "incomplete")return { bg: "#FFFBEB", color: "#D97706", border: "rgba(217,119,6,0.2)" };
  return { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
}

function fmt(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" });
}

function fmtNGN(v: number) {
  return new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", minimumFractionDigits:0 }).format(v);
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel, danger, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; danger?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function go() {
    if (!reason.trim()) return;
    setLoading(true); setError("");
    try { await onConfirm(reason.trim()); onClose(); }
    catch (e: any) { setError(e.message ?? "Action failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(10,37,64,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", width:"100%", maxWidth:440, padding:28 }}>
        <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:17, color:"#0A2540", marginBottom:8 }}>{title}</h3>
        <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, marginBottom:20 }}>{description}</p>
        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
          Reason <span style={{ color:"#EF4444" }}>*</span>
        </label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Provide a reason — this is recorded in the audit log."
          style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, resize:"none", outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }}
          onFocus={(e) => (e.target.style.borderColor="#0A2540")}
          onBlur={(e) => (e.target.style.borderColor="#E5E7EB")} />
        {error && <p style={{ fontSize:12, color:"#EF4444", marginTop:6 }}>{error}</p>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" disabled={!reason.trim() || loading}
            style={{ gap:6, background: danger ? "#EF4444" : undefined }}
            onClick={go}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FIELD EDITOR
// ─────────────────────────────────────────────────────────────
type FieldDef = {
  key: string; label: string;
  type: "text" | "boolean" | "select";
  options?: string[];
};

const EDITABLE_FIELDS: FieldDef[] = [
  { key:"profile_status",    label:"Profile Status",    type:"select", options:["active","suspended","incomplete"] },
  { key:"kyc_status",        label:"KYC Status",        type:"select", options:["verified","pending","unverified","flagged","rejected"] },
  { key:"tier",              label:"Tier",              type:"select", options:["starter","standard","premium"] },
  { key:"sector",            label:"Sector",            type:"text" },
  { key:"revenue_range",     label:"Revenue Range",     type:"text" },
  { key:"years_operating",   label:"Years Operating",   type:"text" },
  { key:"financing_urgency", label:"Financing Urgency", type:"select", options:["immediate","near_term","exploring"] },
  { key:"open_to_financing", label:"Open to Financing", type:"boolean" },
  { key:"registration_number",label:"Reg. Number",      type:"text" },
];

function FieldEditor({ businessId, field, currentValue, onSaved, onClose }: {
  businessId: string; field: FieldDef; currentValue: any;
  onSaved: () => void; onClose: () => void;
}) {
  const [value,   setValue]   = useState(currentValue ?? (field.type === "boolean" ? false : ""));
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function save() {
    if (!reason.trim()) return;
    setLoading(true); setError("");
    try {
      await callFn("admin-update-business-field", {
        business_id: businessId,
        field: field.key,
        value: field.type === "boolean" ? Boolean(value) : value,
        reason,
      }, "POST");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Update failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(10,37,64,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", width:"100%", maxWidth:420, padding:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h3 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:16, color:"#0A2540" }}>
            Edit — {field.label}
          </h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>New Value</label>
            {field.type === "select" ? (
              <select value={value} onChange={(e) => setValue(e.target.value)}
                style={{ width:"100%", height:38, padding:"0 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", background:"white" }}>
                {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === "boolean" ? (
              <div style={{ display:"flex", gap:10 }}>
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setValue(v)}
                    style={{ flex:1, padding:"8px 14px", border:`1.5px solid ${value === v ? "#0A2540" : "#E5E7EB"}`, borderRadius:8, background: value === v ? "#0A2540" : "white", color: value === v ? "white" : "#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            ) : (
              <Input value={value} onChange={(e) => setValue(e.target.value)} style={{ height:38, fontSize:13 }} />
            )}
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
              Reason <span style={{ color:"#EF4444" }}>*</span>
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Why are you making this change? (recorded in audit log)"
              style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, resize:"none", outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }}
              onFocus={(e) => (e.target.style.borderColor="#0A2540")}
              onBlur={(e) => (e.target.style.borderColor="#E5E7EB")} />
          </div>

          {error && <p style={{ fontSize:12, color:"#EF4444" }}>{error}</p>}

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button size="sm" disabled={!reason.trim() || loading} onClick={save} style={{ gap:6 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION CARD
// ─────────────────────────────────────────────────────────────
function Card({ title, icon, children, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#6B7280" }}>{icon}</span>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"#0A2540" }}>{title}</p>
        </div>
        {action}
      </div>
      <div style={{ padding:"16px 20px" }}>{children}</div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
      <p style={{ fontSize:13, color:"#0A2540", fontFamily: mono ? "monospace" : undefined }}>{value ?? "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────
export default function BusinessDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const user     = getMockAdminUser();
  const canAct   = canManage(user, "businesses");

  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState<"overview"|"financial"|"pipeline"|"accounts"|"actions">("overview");

  const [confirm, setConfirm] = useState<{ type: string; title: string; description: string; label: string; danger?: boolean } | null>(null);
  const [editField, setEditField] = useState<FieldDef | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await callFnWithParams("admin-get-business-detail", { id });
      setData(d);
    } catch (e: any) {
      setError(e.message ?? "Failed to load business");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function runAction(type: string, reason: string) {
    setActionMsg(""); setActionErr("");
    try {
      if (type === "suspend") {
        await callFn("admin-suspend-business",  { business_id: id, reason }, "POST");
      } else if (type === "activate") {
        await callFn("admin-activate-business", { business_id: id, reason }, "POST");
      } else if (type === "verify") {
        await callFn("admin-approve-verification", { business_id: id, reason }, "POST");
      } else if (type === "pipeline") {
        await callFn("run-pipeline", { business_id: id, reason }, "POST");
      }
      setActionMsg("Action completed successfully.");
      await load();
    } catch (e: any) {
      setActionErr(e.message ?? "Action failed");
    }
  }

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"50vh", gap:12 }}>
      <Loader2 size={24} style={{ color:"#9CA3AF" }} className="animate-spin" />
      <p style={{ fontSize:14, color:"#9CA3AF" }}>Loading business profile…</p>
    </div>
  );

  if (error || !data?.business) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"50vh", gap:16 }}>
      <AlertTriangle size={28} style={{ color:"#EF4444" }} />
      <p style={{ fontSize:15, color:"#374151" }}>{error || "Business not found"}</p>
      <Link href="/admin/businesses"><Button variant="outline" size="sm" style={{ gap:6 }}><ArrowLeft size={13} /> Back</Button></Link>
    </div>
  );

  const biz = data.business;
  const score = data.score;
  const profileC = statusColor(biz.profile_status);
  const kycC     = statusColor(biz.kyc_status);

  const tabs = [
    { id:"overview",  label:"Overview"  },
    { id:"financial", label:"Financial" },
    { id:"pipeline",  label:"Pipeline"  },
    { id:"accounts",  label:"Accounts"  },
    { id:"actions",   label:"Actions",  highlight: canAct },
  ] as const;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* BACK + HEADER */}
      <div>
        <Link href="/admin/businesses" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"#6B7280", textDecoration:"none", marginBottom:14 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color="#0A2540")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color="#6B7280")}>
          <ArrowLeft size={14} /> All Businesses
        </Link>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#0A2540", flexShrink:0 }}>
              {biz.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:22, color:"#0A2540", letterSpacing:"-0.03em", marginBottom:6 }}>{biz.name}</h2>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:9999, background:profileC.bg, color:profileC.color, border:`1px solid ${profileC.border}`, textTransform:"capitalize" }}>{biz.profile_status}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:9999, background:kycC.bg, color:kycC.color, border:`1px solid ${kycC.border}`, textTransform:"capitalize" }}>KYC: {biz.kyc_status}</span>
                {biz.tier && <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:9999, background:"rgba(99,102,241,0.08)", color:"#6366F1", border:"1px solid rgba(99,102,241,0.2)", textTransform:"capitalize" }}>{biz.tier}</span>}
                <span style={{ fontSize:12, color:"#9CA3AF" }}>{biz.sector}</span>
              </div>
            </div>
          </div>

          {/* Quick score card */}
          <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:12, padding:"12px 20px", display:"flex", gap:24 }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:26, color:scoreColor(score.current), letterSpacing:"-0.03em" }}>
                {score.current ?? "—"}
              </p>
              <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>Credit Score</p>
            </div>
            <div style={{ width:1, background:"#F3F4F6" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:26, color:"#0A2540", letterSpacing:"-0.03em" }}>
                {score.data_quality ?? "—"}<span style={{ fontSize:14, color:"#9CA3AF" }}>%</span>
              </p>
              <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>Data Quality</p>
            </div>
            <div style={{ width:1, background:"#F3F4F6" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:26, color:"#0A2540", letterSpacing:"-0.03em" }}>
                {biz.months_of_data}
              </p>
              <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>Months Data</p>
            </div>
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

      {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          <Card title="Business Profile" icon={<Building2 size={15} />}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <KV label="Creditlinker ID" value={biz.creditlinker_id} mono />
              <KV label="Reg. Number"     value={biz.registration_number} />
              <KV label="Sector"          value={biz.sector} />
              <KV label="Years Operating" value={biz.years_operating} />
              <KV label="Revenue Range"   value={biz.revenue_range} />
              <KV label="Owner Role"      value={biz.owner_role} />
              <KV label="Financing Open"  value={biz.open_to_financing ? "Yes" : "No"} />
              <KV label="Urgency"         value={biz.financing_urgency} />
              <KV label="Registered"      value={fmt(biz.created_at)} />
              <KV label="Last Synced"     value={fmt(biz.last_synced_at)} />
            </div>
          </Card>

          <Card title="KYC Details" icon={<ShieldCheck size={15} />}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <KV label="KYC Status"  value={
                <span style={{ padding:"2px 8px", borderRadius:9999, background:kycC.bg, color:kycC.color, fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{biz.kyc_status}</span>
              } />
              <KV label="Submitted"   value={fmt(biz.kyc_submitted_at)} />
              <KV label="Gender"      value={biz.kyc_gender} />
              <KV label="DOB"         value={fmt(biz.kyc_dob)} />
              <KV label="BVN"         value={biz.kyc_bvn_masked} mono />
              <KV label="BVN Verified"value={biz.kyc_bvn_verified ? "✓ Yes" : "✗ No"} />
              <KV label="NIN"         value={biz.kyc_nin_masked} mono />
              <KV label="NIN Verified"value={biz.kyc_nin_verified ? "✓ Yes" : "✗ No"} />
              <KV label="ID Type"     value={biz.kyc_id_type} />
              <KV label="ID Verified" value={biz.kyc_id_verified ? "✓ Yes" : "✗ No"} />
            </div>
          </Card>

          <Card title="Data Coverage" icon={<BarChart3 size={15} />}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <KV label="Coverage Start" value={fmt(biz.data_coverage_start)} />
              <KV label="Coverage End"   value={fmt(biz.data_coverage_end)} />
              <KV label="Months of Data" value={`${biz.months_of_data} months`} />
              <KV label="Last Pipeline"  value={fmt(biz.last_pipeline_run_at)} />
            </div>
          </Card>

          <Card title="Wallet" icon={<Wallet size={15} />}>
            {data.wallet ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <KV label="Balance"    value={fmtNGN(data.wallet.balance)} />
                <KV label="Currency"   value={data.wallet.currency} />
                <KV label="Status"     value={data.wallet.status} />
                <KV label="Updated"    value={fmt(data.wallet.updated_at)} />
              </div>
            ) : (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No wallet found for this business.</p>
            )}
          </Card>
        </div>
      )}

      {/* ── FINANCIAL TAB ─────────────────────────────────────── */}
      {tab === "financial" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Score history */}
          <Card title="Score History" icon={<TrendingUp size={15} />}>
            {score.history.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No score history available.</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                      {["Date","Credit Score","Data Quality"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {score.history.map((s: any, i: number) => (
                      <tr key={i} style={{ borderBottom:"1px solid #F9FAFB" }}>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{fmt(s.computed_at)}</td>
                        <td style={{ padding:"10px 12px", fontFamily:"var(--font-display)", fontWeight:800, fontSize:15, color:scoreColor(s.score) }}>{s.score}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{s.data_quality}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Financing records */}
          <Card title="Financing Records" icon={<DollarSign size={15} />}>
            {data.financing.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No financing records found.</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                      {["Financer","Principal","Status","Disbursed","Created"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.financing.map((f: any) => {
                      const c = statusColor(f.status);
                      return (
                        <tr key={f.id} style={{ borderBottom:"1px solid #F9FAFB" }}>
                          <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{f.institution}</td>
                          <td style={{ padding:"10px 12px", fontSize:13, fontWeight:700, color:"#0A2540" }}>{fmtNGN(f.principal)}</td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}`, textTransform:"capitalize" }}>{f.status}</span>
                          </td>
                          <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{fmt(f.disbursed_at)}</td>
                          <td style={{ padding:"10px 12px", fontSize:13, color:"#9CA3AF" }}>{fmt(f.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Disputes */}
          <Card title="Disputes" icon={<Scale size={15} />}>
            {data.disputes.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No disputes on record.</p>
            ) : data.disputes.map((d: any) => {
              const c = statusColor(d.resolution === "resolved" ? "active" : "pending");
              return (
                <div key={d.id} style={{ padding:"12px 0", borderBottom:"1px solid #F9FAFB" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:4 }}>{d.reason}</p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>{d.institution} · opened {fmt(d.opened_at)} · by {d.initiated_by}</p>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}`, whiteSpace:"nowrap", textTransform:"capitalize" }}>{d.resolution}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── PIPELINE TAB ──────────────────────────────────────── */}
      {tab === "pipeline" && (
        <Card title="Pipeline Runs" icon={<Activity size={15} />}
          action={canAct ? (
            <Button size="sm" variant="outline" style={{ gap:6 }}
              onClick={() => setConfirm({ type:"pipeline", title:"Trigger Pipeline Run", description:`This will queue a new pipeline run for ${biz.name}. Depending on available data, this may take several minutes.`, label:"Trigger Run" })}>
              <Play size={12} /> Trigger Run
            </Button>
          ) : undefined}>
          {data.pipeline.runs.length === 0 ? (
            <p style={{ fontSize:13, color:"#9CA3AF" }}>No pipeline runs yet.</p>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #F3F4F6" }}>
                    {["Started","Status","Stage","Duration","Errors","Warnings"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pipeline.runs.map((r: any) => {
                    const c = statusColor(r.status === "completed" ? "active" : r.status === "failed" ? "suspended" : "pending");
                    return (
                      <tr key={r.id} style={{ borderBottom:"1px solid #F9FAFB" }}>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{fmt(r.started_at)}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, background:c.bg, color:c.color, border:`1px solid ${c.border}`, textTransform:"capitalize" }}>{r.status}</span>
                        </td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{r.stage_reached ?? "—"}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#374151" }}>{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color: r.error_count > 0 ? "#EF4444" : "#9CA3AF" }}>{r.error_count}</td>
                        <td style={{ padding:"10px 12px", fontSize:13, color: r.warning_count > 0 ? "#F59E0B" : "#9CA3AF" }}>{r.warning_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── ACCOUNTS TAB ──────────────────────────────────────── */}
      {tab === "accounts" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Card title="Linked Bank Accounts" icon={<LinkIcon size={15} />}>
            {data.accounts.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No linked accounts.</p>
            ) : data.accounts.map((a: any) => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #F9FAFB" }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#6B7280", flexShrink:0 }}>
                  {(a.provider ?? "??").slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0A2540" }}>{a.account_name}</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>{a.provider} · {a.account_type} · linked {fmt(a.linked_at)}</p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, ...statusColor(a.status), border:`1px solid ${statusColor(a.status).border}`, textTransform:"capitalize" }}>{a.status}</span>
              </div>
            ))}
          </Card>

          <Card title="Consent Records" icon={<ShieldCheck size={15} />}>
            {data.consents.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No consent records.</p>
            ) : data.consents.map((co: any) => (
              <div key={co.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #F9FAFB" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0A2540" }}>{co.institution}</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>Granted {fmt(co.granted_at)} · Expires {fmt(co.expires_at)}</p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:9999, ...statusColor(co.is_active ? "active" : "suspended"), border:`1px solid ${statusColor(co.is_active ? "active" : "suspended").border}` }}>
                  {co.is_active ? "Active" : "Revoked"}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── ACTIONS TAB ───────────────────────────────────────── */}
      {tab === "actions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {!canAct && (
            <div style={{ background:"#FFFBEB", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"14px 18px", display:"flex", gap:10 }}>
              <Info size={14} style={{ color:"#D97706", flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:13, color:"#92400E" }}>Your role is view-only. You cannot take actions on this account.</p>
            </div>
          )}

          {actionMsg && <div style={{ background:"#ECFDF5", border:"1px solid rgba(16,185,129,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#065F46" }}>{actionMsg}</div>}
          {actionErr && <div style={{ background:"#FEF2F2", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#991B1B" }}>{actionErr}</div>}

          {/* Account status actions */}
          <Card title="Account Status" icon={<ShieldCheck size={15} />}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Current Status</p>
                  <p style={{ fontSize:12, color:"#9CA3AF" }}>The business's current profile status is shown below.</p>
                </div>
                <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:9999, ...profileC, border:`1px solid ${profileC.border}`, textTransform:"capitalize" }}>{biz.profile_status}</span>
              </div>
              {canAct && (
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {biz.profile_status !== "suspended" && (
                    <Button variant="outline" size="sm" style={{ gap:6, color:"#EF4444", borderColor:"rgba(239,68,68,0.3)" }}
                      onClick={() => setConfirm({ type:"suspend", title:`Suspend ${biz.name}?`, description:"This immediately blocks the business from accessing their account and appearing in financer discovery. They will be notified.", label:"Suspend Business", danger:true })}>
                      <Ban size={13} /> Suspend
                    </Button>
                  )}
                  {biz.profile_status === "suspended" && (
                    <Button variant="outline" size="sm" style={{ gap:6, color:"#10B981", borderColor:"rgba(16,185,129,0.3)" }}
                      onClick={() => setConfirm({ type:"activate", title:`Reactivate ${biz.name}?`, description:"This restores full access for the business. They will be notified.", label:"Reactivate Business" })}>
                      <CheckCircle2 size={13} /> Reactivate
                    </Button>
                  )}
                  {biz.kyc_status !== "verified" && (
                    <Button variant="outline" size="sm" style={{ gap:6, color:"#6366F1", borderColor:"rgba(99,102,241,0.3)" }}
                      onClick={() => setConfirm({ type:"verify", title:`Verify ${biz.name}?`, description:"Mark this business as KYC verified. This improves their score and visibility to financers.", label:"Mark as Verified" })}>
                      <ShieldCheck size={13} /> Approve KYC
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Pipeline */}
          <Card title="Pipeline" icon={<Activity size={15} />}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#0A2540", marginBottom:2 }}>Manual Pipeline Trigger</p>
                <p style={{ fontSize:12, color:"#9CA3AF" }}>Forces a new pipeline run to refresh financial identity data for this business.</p>
                <p style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Last run: {fmt(biz.last_pipeline_run_at)}</p>
              </div>
              {canAct && (
                <Button variant="outline" size="sm" style={{ gap:6, flexShrink:0 }}
                  onClick={() => setConfirm({ type:"pipeline", title:"Trigger Pipeline Run", description:`This will queue a new pipeline run for ${biz.name}. This may take several minutes depending on available transaction data.`, label:"Trigger Run" })}>
                  <Play size={13} /> Trigger
                </Button>
              )}
            </div>
          </Card>

          {/* Field overrides */}
          {canAct && (
            <Card title="Direct Field Overrides" icon={<Edit2 size={15} />}>
              <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:16, lineHeight:1.6 }}>
                Edit individual business fields directly. Every change is recorded in the audit log with the reason and your admin ID.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
                {EDITABLE_FIELDS.map((f) => {
                  const current = (biz as any)[f.key];
                  return (
                    <button key={f.key} onClick={() => setEditField(f)}
                      style={{ padding:"12px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, background:"white", cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#0A2540"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#E5E7EB"; }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{f.label}</p>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0A2540" }}>
                        {current === null || current === undefined ? "—" : String(current)}
                      </p>
                      <p style={{ fontSize:11, color:"#6366F1", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                        <Edit2 size={10} /> Edit
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* MODALS */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.label}
          danger={confirm.danger}
          onConfirm={async (reason) => { await runAction(confirm.type, reason); }}
          onClose={() => setConfirm(null)}
        />
      )}

      {editField && (
        <FieldEditor
          businessId={id}
          field={editField}
          currentValue={(biz as any)[editField.key]}
          onSaved={load}
          onClose={() => setEditField(null)}
        />
      )}
    </div>
  );
}
