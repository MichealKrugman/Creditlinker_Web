"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, CheckCircle2, XCircle, Eye,
  FileText, AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

async function callFn(name: string, body?: object, method: "POST" | "GET" = "GET") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  REVIEW MODAL
// ─────────────────────────────────────────────────────────────

function ReviewModal({
  item, onApprove, onReject, onClose,
}: {
  item: any;
  onApprove: (notes: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"review" | "reject">("review");
  const [notes,  setNotes]  = useState("");
  const [reason, setReason] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>{item.name}</h3>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>{item.type} · {item.sector}</p>
            </div>
            {item.priority === "high" && <Badge variant="destructive">Urgent</Badge>}
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Business info */}
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Business ID",    value: item.business_id },
              { label: "Current Score",  value: item.score_before > 0 ? String(item.score_before) : "No score" },
              { label: "Data Months",    value: item.months_data > 0 ? `${item.months_data}mo` : "None" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Documents submitted */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Submitted Documents</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {item.documents.map((doc) => (
                <div key={doc} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6" }}>
                  <FileText size={14} style={{ color: "#6B7280", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{doc}</span>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#0A2540", background: "none", border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Admin notes (if any) */}
          {item.notes && (
            <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
              <AlertTriangle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>{item.notes}</p>
            </div>
          )}

          {/* Action tabs */}
          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 18 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["review", "reject"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0A2540" : "#E5E7EB", background: tab === t ? "#0A2540" : "white", color: tab === t ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" as const }}>{t === "review" ? "Approve" : "Reject"}</button>
              ))}
            </div>

            {tab === "review" ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Reviewer notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations about this verification…" rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#10B981")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                  <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button variant="primary" size="sm" disabled={saving} onClick={async () => { setSaving(true); await onApprove(notes); setSaving(false); }} style={{ background: "#10B981" }}>
                    <CheckCircle2 size={13} /> {saving ? "Approving…" : "Approve Verification"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Rejection reason <span style={{ color: "#EF4444" }}>*</span></label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this verification is being rejected (shown to business)…" rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#EF4444")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                  <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button variant="primary" size="sm" disabled={!reason.trim() || saving} onClick={async () => { setSaving(true); await onReject(reason.trim()); setSaving(false); }} style={{ background: "#EF4444" }}>
                    <XCircle size={13} /> {saving ? "Rejecting…" : "Reject"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminVerificationsPage() {
  const user = getMockAdminUser();
  const canAct = canManage(user, "verifications");

  const [queue,    setQueue]    = useState<any[]>([]);
  const [resolved, setResolved] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callFn("admin-get-verification-queue");
      setQueue(data.queue ?? data.pending ?? []);
      setResolved(data.recent_resolved ?? data.resolved ?? []);
    } catch (e) {
      console.error("[verifications] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const urgent = queue.filter((q: any) => q.priority === "high" || q.urgency === "high").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Verifications</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning">{queue.length} in queue</Badge>
            {urgent > 0 && <Badge variant="destructive">{urgent} urgent</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Pending",        value: queue.length,                                                    color: "#F59E0B" },
          { label: "Urgent",         value: urgent,                                                          color: "#EF4444" },
          { label: "Approved Today", value: resolved.filter((r: any) => r.outcome === "approved").length,   color: "#10B981" },
          { label: "Rejected Today", value: resolved.filter((r: any) => r.outcome === "rejected").length,   color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        {/* QUEUE */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Verification Queue</p>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: "32px 22px", textAlign: "center" }}>
                <Loader2 size={18} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading queue…</p>
              </div>
            ) : queue.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center" }}>
                <CheckCircle2 size={20} style={{ color: "#10B981", margin: "0 auto 8px", display: "block" }} />
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>All caught up — no pending verifications.</p>
              </div>
            ) : queue.map((item: any, i: number) => (
              <div key={item.id ?? i}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < queue.length - 1 ? "1px solid #F9FAFB" : "none", transition: "background 0.1s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                  {(item.name ?? item.business_name ?? "??").slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name ?? item.business_name}</p>
                    {(item.priority === "high" || item.urgency === "high") && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase", flexShrink: 0 }}>Urgent</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.type ?? item.verification_type} · {item.submitted ?? (item.created_at ? new Date(item.created_at).toLocaleDateString() : "")}</p>
                </div>

                {/* Docs count */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <FileText size={12} style={{ color: "#9CA3AF" }} />
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{(item.documents ?? []).length}</span>
                </div>

                {/* Action */}
                {canAct ? (
                  <Button variant="primary" size="sm" onClick={() => setSelected(item)} style={{ flexShrink: 0 }}>
                    Review
                  </Button>
                ) : (
                  <button onClick={() => setSelected(item)} style={{ padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Eye size={12} /> View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RECENTLY RESOLVED */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Recently Resolved</p>
          </div>
          <div>
            {resolved.length === 0 ? (
              <div style={{ padding: "24px 22px", textAlign: "center" }}><p style={{ fontSize: 13, color: "#9CA3AF" }}>No resolved verifications yet.</p></div>
            ) : resolved.map((r: any, i: number) => (
              <div key={i} style={{ padding: "12px 22px", borderBottom: i < resolved.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, marginRight: 8 }}>{r.name ?? r.business_name}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
                    color: r.outcome === "approved" ? "#10B981" : "#EF4444",
                    background: r.outcome === "approved" ? "#ECFDF5" : "#FEF2F2",
                    border: `1px solid ${r.outcome === "approved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    textTransform: "capitalize", flexShrink: 0,
                  }}>
                    {r.outcome}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{r.type ?? r.verification_type} · {r.reviewer ?? r.reviewed_by ?? "Admin"} · {r.time ?? (r.created_at ? new Date(r.created_at).toLocaleDateString() : "")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {actionError && <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center", padding: "0 22px" }}>{actionError}</p>}

      {selected && (
        <ReviewModal
          item={selected}
          onApprove={async (notes) => {
            try {
              await callFn("admin-approve-verification", { verification_id: selected.id, business_id: selected.business_id, notes }, "POST");
              setSelected(null);
              setActionError("");
              await load();
            } catch (e: any) { setActionError(e.message ?? "Approval failed"); }
          }}
          onReject={async (reason) => {
            try {
              await callFn("admin-reject-verification", { verification_id: selected.id, business_id: selected.business_id, reason }, "POST");
              setSelected(null);
              setActionError("");
              await load();
            } catch (e: any) { setActionError(e.message ?? "Rejection failed"); }
          }}
          onClose={() => { setSelected(null); setActionError(""); }}
        />
      )}
    </div>
  );
}
