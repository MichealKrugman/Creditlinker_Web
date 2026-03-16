"use client";

import { useState } from "react";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, Eye,
  FileText, AlertTriangle, ChevronRight, User, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/verifications (queue)
// ─────────────────────────────────────────────────────────────

const QUEUE = [
  {
    id: "ver_001", business_id: "biz_003", name: "Greenfield Farms Ltd",
    sector: "Agriculture", type: "CAC + Bank Statement",
    submitted: "Today, 08:14", priority: "high",
    documents: ["CAC Certificate", "6-month statement"],
    score_before: 598, months_data: 12,
    notes: "Inconsistency between CAC registration date and stated founding year.",
  },
  {
    id: "ver_002", business_id: "biz_002", name: "TechPay Solutions",
    sector: "Fintech", type: "Identity Verification",
    submitted: "Today, 09:30", priority: "high",
    documents: ["Director NIN", "BVN Confirmation"],
    score_before: 681, months_data: 18,
    notes: "",
  },
  {
    id: "ver_003", business_id: "biz_011", name: "Sunrise Poultry Farm",
    sector: "Agriculture", type: "Bank Statement",
    submitted: "Yesterday, 14:20", priority: "normal",
    documents: ["12-month bank statement"],
    score_before: 576, months_data: 14,
    notes: "",
  },
  {
    id: "ver_004", business_id: "biz_009", name: "Arise Digital Agency",
    sector: "Tech Services", type: "Full KYB",
    submitted: "Yesterday, 16:45", priority: "normal",
    documents: ["CAC Form CO2", "Director IDs", "Utility Bill", "3-month statement"],
    score_before: 659, months_data: 16,
    notes: "",
  },
  {
    id: "ver_005", business_id: "biz_007", name: "Amaka Tailoring Co.",
    sector: "Fashion", type: "Bank Statement",
    submitted: "2 days ago", priority: "normal",
    documents: ["3-month statement"],
    score_before: 0, months_data: 0,
    notes: "New business — first verification request. No pipeline data yet.",
  },
];

const RECENT_RESOLVED = [
  { name: "Aduke Bakeries Ltd",  type: "Full KYB",      outcome: "approved",  reviewer: "Tunde Adeyemi",  time: "3h ago" },
  { name: "PrimeMed Pharmacy",   type: "CAC Update",    outcome: "approved",  reviewer: "Chisom Eze",     time: "5h ago" },
  { name: "QuickBuild Contractors", type: "Bank Stmt",  outcome: "rejected",  reviewer: "Tunde Adeyemi",  time: "Yesterday" },
  { name: "Lagos Auto Spares",   type: "Identity",      outcome: "rejected",  reviewer: "Fatima Bello",   time: "Yesterday" },
];

// ─────────────────────────────────────────────────────────────
//  REVIEW MODAL
// ─────────────────────────────────────────────────────────────

function ReviewModal({
  item, onApprove, onReject, onClose,
}: {
  item: typeof QUEUE[0];
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}) {
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
                  <Button variant="primary" size="sm" onClick={() => onApprove(notes)} style={{ background: "#10B981" }}>
                    <CheckCircle2 size={13} /> Approve Verification
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
                  <Button variant="primary" size="sm" disabled={!reason.trim()} onClick={() => onReject(reason.trim())} style={{ background: "#EF4444" }}>
                    <XCircle size={13} /> Reject
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
  const [selected, setSelected] = useState<typeof QUEUE[0] | null>(null);

  const urgent = QUEUE.filter(q => q.priority === "high").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Verifications</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning">{QUEUE.length} in queue</Badge>
            {urgent > 0 && <Badge variant="destructive">{urgent} urgent</Badge>}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Pending",         value: QUEUE.length,                                      color: "#F59E0B" },
          { label: "Urgent",          value: urgent,                                             color: "#EF4444" },
          { label: "Approved Today",  value: RECENT_RESOLVED.filter(r => r.outcome === "approved" && r.time.includes("h ago")).length, color: "#10B981" },
          { label: "Rejected Today",  value: RECENT_RESOLVED.filter(r => r.outcome === "rejected" && r.time.includes("h ago")).length, color: "#EF4444" },
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
            {QUEUE.map((item, i) => (
              <div key={item.id}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < QUEUE.length - 1 ? "1px solid #F9FAFB" : "none", transition: "background 0.1s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A2540", flexShrink: 0 }}>
                  {item.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                    {item.priority === "high" && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase", flexShrink: 0 }}>Urgent</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{item.type} · {item.submitted}</p>
                </div>

                {/* Docs count */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <FileText size={12} style={{ color: "#9CA3AF" }} />
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{item.documents.length}</span>
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
            {RECENT_RESOLVED.map((r, i) => (
              <div key={i} style={{ padding: "12px 22px", borderBottom: i < RECENT_RESOLVED.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, marginRight: 8 }}>{r.name}</p>
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
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{r.type} · {r.reviewer} · {r.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <ReviewModal
          item={selected}
          onApprove={(notes) => {
            // TODO: POST /admin/verifications/:id/approve { notes }
            console.log("Approved:", selected.id, notes);
            setSelected(null);
          }}
          onReject={(reason) => {
            // TODO: POST /admin/verifications/:id/reject { reason }
            console.log("Rejected:", selected.id, reason);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
