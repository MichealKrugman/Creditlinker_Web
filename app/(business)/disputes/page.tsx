"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle, CheckCircle2, Clock, XCircle,
  ChevronRight, Plus, X, Loader2, Save,
  FileText, Landmark, Shield, Info,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with:
     GET /business/financing → FinancingRecord[] (disputed ones)
     POST /business/financing/:financing_id/dispute
     DisputeRecord shape from data-models.json
───────────────────────────────────────────────────────── */
type DisputeStatus = "pending" | "resolved" | "rejected";
type DisputeInitiator = "business" | "financer";

interface DisputeRecord {
  dispute_id: string;
  financing_id: string;
  institution: string;
  capital_category: string;
  amount: number;
  initiated_by: DisputeInitiator;
  opened_at: string;
  reason: string;
  status: DisputeStatus;
  resolved_at?: string;
  resolution_notes?: string;
  platform_verified: boolean;
  direct_debit_triggered?: boolean;
}

const DISPUTES: DisputeRecord[] = [
  {
    dispute_id: "dsp_001",
    financing_id: "fin_002",
    institution: "Zenith Capital Ltd.",
    capital_category: "Working Capital Loan",
    amount: 8500000,
    initiated_by: "business",
    opened_at: "Dec 15, 2024",
    reason: "Settlement payment of ₦8.5M was made on Dec 12 via bank transfer reference ZCL-2024-8821. The financer has not confirmed receipt and is claiming non-payment.",
    status: "pending",
    platform_verified: false,
  },
  {
    dispute_id: "dsp_002",
    financing_id: "fin_003",
    institution: "Lapo Microfinance",
    capital_category: "Revenue Advance",
    amount: 1200000,
    initiated_by: "financer",
    opened_at: "Nov 4, 2024",
    reason: "Financer claims repayment instalment was missed in October. Business disputes this and has provided bank evidence.",
    status: "resolved",
    resolved_at: "Nov 20, 2024",
    resolution_notes: "Platform verified the October payment of ₦400,000 via transaction ID tx_oct_4821. Dispute resolved in favour of the business. Financer record updated.",
    platform_verified: true,
    direct_debit_triggered: false,
  },
  {
    dispute_id: "dsp_003",
    financing_id: "fin_004",
    institution: "Access Bank",
    capital_category: "Invoice Financing",
    amount: 2400000,
    initiated_by: "financer",
    opened_at: "Aug 22, 2024",
    reason: "Financer alleges invoice submitted for financing was fraudulent. Business maintains invoice is valid and has supporting documentation.",
    status: "rejected",
    resolved_at: "Sep 10, 2024",
    resolution_notes: "After review, the platform could not independently verify the invoice. Dispute closed without resolution. Business may escalate via formal legal channels.",
    platform_verified: false,
    direct_debit_triggered: true,
  },
];

const ACTIVE_FINANCING_FOR_DISPUTE = [
  { financing_id: "fin_001", institution: "Lapo Microfinance", capital_category: "Revenue Advance", amount: 3500000 },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${(n / 1_000).toFixed(0)}K`;
}

function statusConfig(status: DisputeStatus) {
  return {
    pending:  { variant: "warning"     as const, label: "Under review", icon: <Clock      size={11} /> },
    resolved: { variant: "success"     as const, label: "Resolved",     icon: <CheckCircle2 size={11} /> },
    rejected: { variant: "destructive" as const, label: "Closed",       icon: <XCircle     size={11} /> },
  }[status];
}

/* ─────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #F3F4F6", gap: 12 }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   OPEN DISPUTE MODAL
───────────────────────────────────────────────────────── */
function OpenDisputeModal({ onClose }: { onClose: () => void }) {
  const [financingId, setFinancingId] = useState("");
  const [reason,      setReason]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    if (!financingId) { setError("Please select a financing record."); return; }
    if (reason.trim().length < 30) { setError("Please provide a detailed reason (at least 30 characters)."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    // TODO: POST /business/financing/:financing_id/dispute { reason }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Open a dispute</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Raise a dispute against an active financing record.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* What to expect */}
          <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
              Creditlinker will review the dispute against available transaction data. Both parties will be notified. Resolution typically takes 3–5 business days.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
              <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
            </div>
          )}

          {/* Financing record selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Financing record
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ACTIVE_FINANCING_FOR_DISPUTE.map(f => (
                <button
                  key={f.financing_id}
                  onClick={() => setFinancingId(f.financing_id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 9, cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: financingId === f.financing_id ? "#0A2540" : "#E5E7EB",
                    background: financingId === f.financing_id ? "#F8FAFF" : "white",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ textAlign: "left" as const }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{f.institution}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{f.capital_category} · {fmt(f.amount)}</p>
                  </div>
                  {financingId === f.financing_id && <CheckCircle2 size={16} style={{ color: "#0A2540" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Reason for dispute
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe the issue in detail. Include relevant dates, amounts, and any reference numbers you have."
              rows={5}
              style={{
                padding: "12px 14px", borderRadius: 8, border: "1px solid #E5E7EB",
                fontSize: 13, color: "#0A2540", resize: "vertical" as const,
                fontFamily: "var(--font-body)", lineHeight: 1.6, outline: "none",
                transition: "border-color 0.12s",
              }}
              onFocus={e => (e.target.style.borderColor = "#0A2540")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
            <p style={{ fontSize: 11, color: reason.length < 30 ? "#F59E0B" : "#9CA3AF" }}>
              {reason.length} characters {reason.length < 30 ? `· ${30 - reason.length} more needed` : "· minimum met"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
              Cancel
            </button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1, height: 44, fontSize: 13, fontWeight: 700, borderRadius: 9 }}>
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                : <><AlertCircle size={13} /> Submit dispute</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DISPUTE CARD
───────────────────────────────────────────────────────── */
function DisputeCard({ dispute }: { dispute: DisputeRecord }) {
  const [expanded, setExpanded] = useState(dispute.status === "pending");
  const sc = statusConfig(dispute.status);

  return (
    <div style={{
      background: "white",
      border: `1px solid ${dispute.status === "pending" ? "rgba(245,158,11,0.25)" : "#E5E7EB"}`,
      borderRadius: 14, overflow: "hidden",
    }}>

      {/* Header row */}
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 24px", cursor: "pointer", flexWrap: "wrap" as const }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: dispute.status === "pending" ? "#FFFBEB" : dispute.status === "resolved" ? "#ECFDF5" : "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: dispute.status === "pending" ? "#F59E0B" : dispute.status === "resolved" ? "#10B981" : "#EF4444",
        }}>
          <AlertCircle size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
              {dispute.institution}
            </p>
            <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              {sc.icon} {sc.label}
            </Badge>
            {dispute.initiated_by === "financer" && (
              <Badge variant="secondary" style={{ fontSize: 10, whiteSpace: "nowrap" as const }}>Raised by financer</Badge>
            )}
            {dispute.direct_debit_triggered && (
              <Badge variant="destructive" style={{ fontSize: 10, whiteSpace: "nowrap" as const }}>Direct debit triggered</Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{dispute.capital_category}</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{fmt(dispute.amount)}</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Opened {dispute.opened_at}</span>
            {dispute.resolved_at && (
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Resolved {dispute.resolved_at}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>
          <Link
            href={`/financing`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
          >
            View financing <ChevronRight size={12} />
          </Link>
          <ChevronRight
            size={16}
            style={{ color: "#9CA3AF", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
          />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>

          {/* Dispute reason */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>
              Reason
            </p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{dispute.reason}</p>
          </div>

          {/* Platform verification status */}
          <div style={{ padding: "14px 24px", borderBottom: dispute.resolution_notes ? "1px solid #F3F4F6" : "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: dispute.platform_verified ? "#ECFDF5" : "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Shield size={13} style={{ color: dispute.platform_verified ? "#10B981" : "#9CA3AF" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: dispute.platform_verified ? "#10B981" : "#6B7280", marginBottom: 1 }}>
                {dispute.platform_verified ? "Platform verified" : "Pending platform verification"}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                {dispute.platform_verified
                  ? "Transaction data was used to independently verify this dispute."
                  : "Creditlinker is reviewing available transaction data to assess this dispute."
                }
              </p>
            </div>
          </div>

          {/* Resolution notes */}
          {dispute.resolution_notes && (
            <div style={{ padding: "16px 24px", background: dispute.status === "resolved" ? "#F0FDF4" : "#FEF2F2" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dispute.status === "resolved" ? "#10B981" : "#EF4444", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>
                Resolution
              </p>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{dispute.resolution_notes}</p>
            </div>
          )}

          {/* Actions — only for pending disputes */}
          {dispute.status === "pending" && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <Button variant="outline" size="sm" style={{ gap: 5 }}
                onClick={() => {
                  // TODO: open evidence upload modal
                  // POST /business/financing/:financing_id/dispute with additional evidence
                }}
              >
                <MessageSquare size={12} /> Add evidence
              </Button>
              <Link href="/documents" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", textDecoration: "none" }}>
                <FileText size={12} /> Upload supporting document
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DisputesPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter,    setFilter]    = useState<"all" | "pending" | "resolved" | "rejected">("all");

  const pendingCount  = DISPUTES.filter(d => d.status === "pending").length;
  const resolvedCount = DISPUTES.filter(d => d.status === "resolved").length;
  const visible       = DISPUTES.filter(d => filter === "all" || d.status === filter);

  return (
    <>
      {showModal && <OpenDisputeModal onClose={() => setShowModal(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
              Disputes
            </h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              {pendingCount > 0
                ? <><span style={{ color: "#F59E0B", fontWeight: 600 }}>{pendingCount} under review</span> · {DISPUTES.length} total</>
                : `${DISPUTES.length} disputes · ${resolvedCount} resolved`
              }
            </p>
          </div>
          {ACTIVE_FINANCING_FOR_DISPUTE.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)} style={{ gap: 6 }}>
              <Plus size={13} /> Open dispute
            </Button>
          )}
        </div>

        {/* ── PLATFORM PROCESS NOTE ── */}
        <div style={{ display: "flex", gap: 10, padding: "14px 18px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12 }}>
          <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>
              How Creditlinker handles disputes
            </p>
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
              When a dispute is raised, Creditlinker reviews available transaction data to independently verify the claim. Both parties are notified and given the opportunity to provide evidence. Resolution typically takes 3–5 business days. Where settlement can be verified from bank data, the platform will confirm it directly. If a dispute cannot be resolved, direct debit authorisation may be triggered where applicable.
            </p>
          </div>
        </div>

        {/* ── FILTER PILLS ── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["all", "pending", "resolved", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
                border: "1.5px solid",
                borderColor: filter === f ? "#0A2540" : "#E5E7EB",
                background: filter === f ? "#0A2540" : "white",
                color: filter === f ? "white" : "#6B7280",
                cursor: "pointer", transition: "all 0.12s",
                textTransform: "capitalize" as const,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── DISPUTE CARDS ── */}
        {visible.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "48px 24px", textAlign: "center" as const }}>
            <Shield size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No disputes</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {filter === "all"
                ? "You have no dispute records. Disputes can be raised against active financing arrangements."
                : `No ${filter} disputes.`
              }
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(d => <DisputeCard key={d.dispute_id} dispute={d} />)}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={18} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
                Settlement disputes are resolved using your bank data.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Keep your bank accounts synced so Creditlinker can verify payments independently.
              </p>
            </div>
          </div>
          <Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
            <ChevronRight size={13} /> Manage data sources
          </Link>
        </div>

      </div>
    </>
  );
}
