"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, AlertCircle, Clock, ArrowUpRight,
  ChevronDown, X, Info, Building2, Banknote,
  FileText, Shield, TrendingUp,
  ReceiptText, MessageSquare, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type FinancingStatus = "active" | "settled" | "disputed" | "withdrawn";
type DisputeStatus   = "pending" | "resolved" | "rejected";

interface RepaymentSchedule {
  due_date:  string;
  amount:    number;
  status:    "paid" | "due" | "overdue" | "upcoming";
  paid_at?:  string;
  tx_ref?:   string;
}

interface DisputeRecord {
  dispute_id:        string;
  initiated_by:      "business" | "institution";
  opened_at:         string;
  reason:            string;
  resolution:        DisputeStatus;
  resolved_at?:      string;
  resolution_notes?: string;
  platform_verified: boolean;
}

interface FinancingRecord {
  financing_id:          string;
  business_id:           string;
  business_name:         string;
  financial_identity_id: string;
  sector:                string;
  capital_category:      string;
  amount_raw:            number;
  amount:                string;
  interest_rate:         string;
  tenor:                 string;
  disbursed_at:          string;
  due_at:                string;
  status:                FinancingStatus;
  health:                "on_track" | "watch" | "overdue";
  repaid_pct:            number;
  repaid_amount:         string;
  outstanding:           string;
  consent_id:            string;
  consent_expiry:        string;
  originated_by:         string;
  approved_by:           string;
  schedule:              RepaymentSchedule[];
  disputes:              DisputeRecord[];
  settlement_proof?: {
    submitted_at: string;
    notes:        string;
    tx_refs:      string[];
  };
}

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with:
     GET  /institution/financing → FinancingRecord[]
     POST /institution/financing/:id/confirm-settlement
     POST /institution/financing/:id/dispute { reason }
───────────────────────────────────────────────────────── */
const RECORDS: FinancingRecord[] = [
  {
    financing_id:          "FIN-001",
    business_id:           "BIZ-1R8T",
    business_name:         "Kemi Superstores Ltd",
    financial_identity_id: "fid_1r8t",
    sector:                "Retail",
    capital_category:      "Working Capital Loan",
    amount_raw:            15_000_000,
    amount:                "₦15M",
    interest_rate:         "18% p.a.",
    tenor:                 "6 months",
    disbursed_at:          "Oct 15, 2024",
    due_at:                "Apr 15, 2025",
    status:                "active",
    health:                "on_track",
    repaid_pct:            42,
    repaid_amount:         "₦6.3M",
    outstanding:           "₦8.7M",
    consent_id:            "con_001",
    consent_expiry:        "Mar 31, 2025",
    originated_by:         "Bola Fashola",
    approved_by:           "Chidi Eze",
    schedule: [
      { due_date: "Nov 15, 2024", amount: 2_500_000, status: "paid",     paid_at: "Nov 14, 2024", tx_ref: "ZEN-9214-B" },
      { due_date: "Dec 15, 2024", amount: 2_500_000, status: "paid",     paid_at: "Dec 13, 2024", tx_ref: "ZEN-0033-A" },
      { due_date: "Jan 15, 2025", amount: 2_500_000, status: "paid",     paid_at: "Jan 15, 2025", tx_ref: "ZEN-1122-C" },
      { due_date: "Feb 15, 2025", amount: 2_500_000, status: "due" },
      { due_date: "Mar 15, 2025", amount: 2_500_000, status: "upcoming" },
      { due_date: "Apr 15, 2025", amount: 4_500_000, status: "upcoming" },
    ],
    disputes: [],
  },
  {
    financing_id:          "FIN-002",
    business_id:           "BIZ-3K2M",
    business_name:         "Nonso Logistics",
    financial_identity_id: "fid_3k2m",
    sector:                "Logistics",
    capital_category:      "Asset Financing",
    amount_raw:            42_000_000,
    amount:                "₦42M",
    interest_rate:         "16% p.a.",
    tenor:                 "24 months",
    disbursed_at:          "Sep 1, 2024",
    due_at:                "Sep 1, 2026",
    status:                "active",
    health:                "watch",
    repaid_pct:            18,
    repaid_amount:         "₦7.5M",
    outstanding:           "₦34.5M",
    consent_id:            "con_002",
    consent_expiry:        "Sep 1, 2025",
    originated_by:         "Amaka Nwosu",
    approved_by:           "Tunde Adeyemi",
    schedule: [
      { due_date: "Oct 1, 2024",  amount: 2_500_000, status: "paid",    paid_at: "Sep 30, 2024", tx_ref: "GTB-5521-K" },
      { due_date: "Nov 1, 2024",  amount: 2_500_000, status: "paid",    paid_at: "Nov 1, 2024",  tx_ref: "GTB-6612-L" },
      { due_date: "Dec 1, 2024",  amount: 2_500_000, status: "paid",    paid_at: "Dec 2, 2024",  tx_ref: "GTB-7723-M" },
      { due_date: "Jan 1, 2025",  amount: 2_500_000, status: "overdue" },
      { due_date: "Feb 1, 2025",  amount: 2_500_000, status: "due" },
      { due_date: "Mar 1, 2025",  amount: 2_500_000, status: "upcoming" },
    ],
    disputes: [],
  },
  {
    financing_id:          "FIN-003",
    business_id:           "BIZ-9P4L",
    business_name:         "Bright Pharma",
    financial_identity_id: "fid_9p4l",
    sector:                "Healthcare",
    capital_category:      "Invoice Financing",
    amount_raw:            8_000_000,
    amount:                "₦8M",
    interest_rate:         "3.5% flat",
    tenor:                 "60 days",
    disbursed_at:          "Dec 1, 2024",
    due_at:                "Jan 30, 2025",
    status:                "active",
    health:                "on_track",
    repaid_pct:            0,
    repaid_amount:         "₦0",
    outstanding:           "₦8M",
    consent_id:            "con_003",
    consent_expiry:        "Feb 28, 2025",
    originated_by:         "Amaka Nwosu",
    approved_by:           "Chidi Eze",
    schedule: [
      { due_date: "Jan 30, 2025", amount: 8_280_000, status: "due" },
    ],
    disputes: [],
  },
  {
    financing_id:          "FIN-004",
    business_id:           "BIZ-2B7R",
    business_name:         "Delta Textiles",
    financial_identity_id: "fid_2b7r",
    sector:                "Manufacturing",
    capital_category:      "Term Loan",
    amount_raw:            22_000_000,
    amount:                "₦22M",
    interest_rate:         "20% p.a.",
    tenor:                 "12 months",
    disbursed_at:          "Aug 5, 2024",
    due_at:                "Aug 5, 2025",
    status:                "disputed",
    health:                "watch",
    repaid_pct:            30,
    repaid_amount:         "₦6.6M",
    outstanding:           "₦15.4M",
    consent_id:            "con_004",
    consent_expiry:        "Aug 5, 2025",
    originated_by:         "Bola Fashola",
    approved_by:           "Chidi Eze",
    schedule: [
      { due_date: "Sep 5, 2024",  amount: 2_200_000, status: "paid",    paid_at: "Sep 4, 2024",  tx_ref: "UBA-3312-D" },
      { due_date: "Oct 5, 2024",  amount: 2_200_000, status: "paid",    paid_at: "Oct 5, 2024",  tx_ref: "UBA-4423-E" },
      { due_date: "Nov 5, 2024",  amount: 2_200_000, status: "paid",    paid_at: "Nov 6, 2024",  tx_ref: "UBA-5534-F" },
      { due_date: "Dec 5, 2024",  amount: 2_200_000, status: "overdue" },
      { due_date: "Jan 5, 2025",  amount: 2_200_000, status: "overdue" },
      { due_date: "Feb 5, 2025",  amount: 2_200_000, status: "due" },
    ],
    disputes: [
      {
        dispute_id:        "DIS-001",
        initiated_by:      "institution",
        opened_at:         "Jan 8, 2025",
        reason:            "Two consecutive missed repayments in December 2024 and January 2025. Business has not responded to messages. Requesting platform intervention and settlement enforcement.",
        resolution:        "pending",
        platform_verified: false,
      },
    ],
    settlement_proof: undefined,
  },
  {
    financing_id:          "FIN-005",
    business_id:           "BIZ-4F9T",
    business_name:         "Aduke Bakeries Ltd",
    financial_identity_id: "fid_4f9t",
    sector:                "Food & Beverage",
    capital_category:      "Working Capital Loan",
    amount_raw:            12_000_000,
    amount:                "₦12M",
    interest_rate:         "18% p.a.",
    tenor:                 "6 months",
    disbursed_at:          "Jun 10, 2024",
    due_at:                "Dec 10, 2024",
    status:                "settled",
    health:                "on_track",
    repaid_pct:            100,
    repaid_amount:         "₦12M",
    outstanding:           "₦0",
    consent_id:            "con_005",
    consent_expiry:        "Dec 10, 2024",
    originated_by:         "Amaka Nwosu",
    approved_by:           "Chidi Eze",
    schedule: [
      { due_date: "Jul 10, 2024",  amount: 2_160_000, status: "paid", paid_at: "Jul 9, 2024",  tx_ref: "ZEN-1001-A" },
      { due_date: "Aug 10, 2024",  amount: 2_160_000, status: "paid", paid_at: "Aug 8, 2024",  tx_ref: "ZEN-1002-B" },
      { due_date: "Sep 10, 2024",  amount: 2_160_000, status: "paid", paid_at: "Sep 10, 2024", tx_ref: "ZEN-1003-C" },
      { due_date: "Oct 10, 2024",  amount: 2_160_000, status: "paid", paid_at: "Oct 9, 2024",  tx_ref: "ZEN-1004-D" },
      { due_date: "Nov 10, 2024",  amount: 2_160_000, status: "paid", paid_at: "Nov 11, 2024", tx_ref: "ZEN-1005-E" },
      { due_date: "Dec 10, 2024",  amount: 1_200_000, status: "paid", paid_at: "Dec 10, 2024", tx_ref: "ZEN-1006-F" },
    ],
    disputes: [],
    settlement_proof: {
      submitted_at: "Dec 10, 2024",
      notes:        "Final repayment confirmed. Business settled all 6 instalments on or before due dates.",
      tx_refs:      ["ZEN-1001-A", "ZEN-1002-B", "ZEN-1003-C", "ZEN-1004-D", "ZEN-1005-E", "ZEN-1006-F"],
    },
  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function statusCfg(s: FinancingStatus) {
  return {
    active:    { label: "Active",    variant: "success"     as const },
    settled:   { label: "Settled",   variant: "secondary"   as const },
    disputed:  { label: "Disputed",  variant: "destructive" as const },
    withdrawn: { label: "Withdrawn", variant: "outline"     as const },
  }[s];
}

function healthCfg(h: "on_track" | "watch" | "overdue") {
  return {
    on_track: { label: "On Track", color: "#10B981" },
    watch:    { label: "Watch",    color: "#F59E0B" },
    overdue:  { label: "Overdue",  color: "#EF4444" },
  }[h];
}

function scheduleCfg(s: RepaymentSchedule["status"]) {
  return {
    paid:     { label: "Paid",     color: "#10B981", bg: "#ECFDF5", icon: <CheckCircle2 size={11} /> },
    due:      { label: "Due",      color: "#F59E0B", bg: "#FFFBEB", icon: <Clock        size={11} /> },
    overdue:  { label: "Overdue",  color: "#EF4444", bg: "#FEF2F2", icon: <AlertCircle  size={11} /> },
    upcoming: { label: "Upcoming", color: "#9CA3AF", bg: "#F9FAFB", icon: <Clock        size={11} /> },
  }[s];
}

/* ─────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   CONFIRM SETTLEMENT MODAL
───────────────────────────────────────────────────────── */
function ConfirmSettlementModal({
  record,
  onClose,
  onConfirm,
}: {
  record: FinancingRecord;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<"review" | "confirm">("review");
  const [notes, setNotes] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>Confirm Settlement</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{record.business_name} · {record.capital_category}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {step === "review" ? (
            <>
              {/* Summary */}
              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Total Financed", value: record.amount },
                    { label: "Total Repaid",   value: record.repaid_amount },
                    { label: "Outstanding",    value: record.outstanding },
                    { label: "Financing Type", value: record.capital_category },
                  ].map(f => (
                    <div key={f.label}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{f.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule review */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Repayment History</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {record.schedule.map((s, i) => {
                    const sc = scheduleCfg(s.status);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: sc.bg, borderRadius: 8 }}>
                        <span style={{ color: sc.color, flexShrink: 0 }}>{sc.icon}</span>
                        <p style={{ flex: 1, fontSize: 12, color: "#374151" }}>{s.due_date}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{fmt(s.amount)}</p>
                        {s.tx_ref && (
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>{s.tx_ref}</span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settlement proof if submitted */}
              {record.settlement_proof && (
                <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <ReceiptText size={13} style={{ color: "#00A8CC" }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0A5060" }}>Settlement proof submitted by business</p>
                  </div>
                  <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6, marginBottom: 8 }}>{record.settlement_proof.notes}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                    {record.settlement_proof.tx_refs.map(ref => (
                      <span key={ref} style={{ fontSize: 10, fontFamily: "monospace", background: "rgba(0,212,255,0.1)", color: "#0891B2", padding: "2px 7px", borderRadius: 4 }}>{ref}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Confirmation notes <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="e.g. All repayments verified against bank data. Settlement confirmed."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "#0A2540")}
                  onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
                <Info size={13} style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#065F46", lineHeight: 1.6 }}>
                  Confirming settlement closes this financing record permanently. Both parties' reputation scores will be updated.
                </p>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "24px", textAlign: "center" as const }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <CheckCircle2 size={24} style={{ color: "#10B981" }} />
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#065F46", marginBottom: 6 }}>Ready to confirm</p>
                <p style={{ fontSize: 13, color: "#059669", lineHeight: 1.6 }}>
                  Confirming full settlement for <strong>{record.business_name}</strong>. This closes the record and cannot be undone.
                </p>
              </div>
              {notes && (
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Your notes</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexShrink: 0 }}>
          {step === "review" ? (
            <>
              <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setStep("confirm")} style={{ flex: 2, height: 40, borderRadius: 8, border: "none", background: "#10B981", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={13} /> Review & Confirm →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("review")} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>← Back</button>
              <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 2, height: 40, borderRadius: 8, border: "none", background: "#10B981", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={13} /> Confirm Settlement
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   OPEN DISPUTE MODAL
───────────────────────────────────────────────────────── */
function OpenDisputeModal({
  record,
  onClose,
  onSubmit,
}: {
  record: FinancingRecord;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const PRESETS = [
    "Missed repayment — business has not made payment on the due date.",
    "Payment received but amount is incorrect.",
    "Business is unresponsive to outreach and messages.",
    "Settlement claimed by business but not reflected in bank data.",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>Open a Dispute</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{record.business_name} · {record.financing_id}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={16} /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "12px 14px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10 }}>
            <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>
              Opening a dispute flags this record for Creditlinker platform review. Both parties will be notified and the record placed under review.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Select or describe the issue</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => setReason(p)}
                  style={{ padding: "10px 14px", border: `1.5px solid ${reason === p ? "#EF4444" : "#E5E7EB"}`, borderRadius: 9, background: reason === p ? "#FEF2F2" : "white", color: reason === p ? "#991B1B" : "#374151", fontSize: 12, textAlign: "left" as const, cursor: "pointer", lineHeight: 1.5, transition: "all 0.1s" }}>
                  {p}
                </button>
              ))}
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Describe the issue in detail…"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = "#EF4444")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
          <button disabled={!reason.trim()} onClick={() => { if (reason.trim()) { onSubmit(reason); onClose(); } }}
            style={{ flex: 2, height: 40, borderRadius: 8, border: "none", background: reason.trim() ? "#EF4444" : "#E5E7EB", color: reason.trim() ? "white" : "#9CA3AF", fontSize: 13, fontWeight: 600, cursor: reason.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <AlertCircle size={13} /> Open Dispute
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   RECORD ROW
───────────────────────────────────────────────────────── */
function RecordRow({
  record, expanded, onToggle, onConfirmSettlement, onOpenDispute,
}: {
  record: FinancingRecord;
  expanded: boolean;
  onToggle: () => void;
  onConfirmSettlement: () => void;
  onOpenDispute: () => void;
}) {
  const sc  = statusCfg(record.status);
  const hc  = healthCfg(record.health);
  const hasOpenDispute = record.disputes.some(d => d.resolution === "pending");

  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "white" }}>

      {/* Summary row — mobile card / desktop grid */}
      <div onClick={onToggle} style={{ cursor: "pointer" }}>

      {/* Mobile card */}
      <div className="fnc-fin-row-mobile" style={{ display: "none", padding: "14px 16px", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: record.status === "settled" ? "#ECFDF5" : record.status === "disputed" ? "#FEF2F2" : "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: record.status === "settled" ? "#10B981" : record.status === "disputed" ? "#EF4444" : "#00D4FF" }}>
              {record.business_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{record.business_name}</p>
                <Badge variant={sc.variant} style={{ fontSize: 9, padding: "1px 6px" }}>{sc.label}</Badge>
                {hasOpenDispute && <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "1px 6px", borderRadius: 9999 }}>Dispute open</span>}
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{record.sector} · {record.capital_category}</p>
            </div>
          </div>
          <ChevronDown size={14} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <div><p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Amount</p><p style={{ fontSize: 15, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)" }}>{record.amount}</p></div>
          <div><p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Health</p><p style={{ fontSize: 13, fontWeight: 700, color: hc.color }}>{hc.label}</p></div>
          <div><p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Repaid</p><p style={{ fontSize: 13, fontWeight: 700, color: hc.color }}>{record.repaid_pct}% · {record.repaid_amount}</p></div>
          <div><p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Due</p><p style={{ fontSize: 12, color: "#6B7280" }}>{record.due_at}</p></div>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="fnc-fin-row-desktop" style={{ display: "grid", gridTemplateColumns: "36px 1fr 90px 110px 110px 80px 130px", gap: 12, padding: "14px 20px", alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: record.status === "settled" ? "#ECFDF5" : record.status === "disputed" ? "#FEF2F2" : "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: record.status === "settled" ? "#10B981" : record.status === "disputed" ? "#EF4444" : "#00D4FF" }}>
          {record.business_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{record.business_name}</p>
            <Badge variant={sc.variant} style={{ fontSize: 9, padding: "1px 6px", flexShrink: 0 }}>{sc.label}</Badge>
            {hasOpenDispute && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "1px 6px", borderRadius: 9999, flexShrink: 0 }}>Dispute open</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{record.sector} · {record.capital_category} · {record.financing_id}</p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 800, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{record.amount}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{record.disbursed_at}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{record.due_at}</p>
        <p style={{ fontSize: 11, fontWeight: 700, color: hc.color }}>{hc.label}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" as const }}>
          <div style={{ textAlign: "right" as const }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: hc.color }}>{record.repaid_pct}%</p>
            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{record.repaid_amount}</p>
          </div>
          <ChevronDown size={14} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
        </div>
      </div>

      </div>{/* end onClick wrapper */}

      {/* Progress bar */}
      <div style={{ height: 3, background: "#F3F4F6", margin: "0 20px" }}>
        <div style={{ height: "100%", width: `${record.repaid_pct}%`, background: hc.color, borderRadius: 9999 }} />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "20px", background: "#FAFAFA" }}>
          <div className="fnc-fin-panel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Key metrics */}
              <div className="fnc-fin-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Total Financed", value: record.amount,         color: "#0A2540" },
                  { label: "Total Repaid",   value: record.repaid_amount,  color: "#10B981" },
                  { label: "Outstanding",    value: record.outstanding,    color: record.status === "settled" ? "#9CA3AF" : "#F59E0B" },
                ].map(m => (
                  <div key={m.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{m.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: m.color, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Schedule */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Repayment Schedule</p>
                <div className="fnc-fin-schedule-wrap" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                  <div className="fnc-fin-schedule-inner">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 70px", gap: 10, padding: "8px 16px", borderBottom: "1px solid #F3F4F6" }}>
                    {["Due Date", "Amount", "Tx Reference", "Paid On", "Status"].map(h => (
                      <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                    ))}
                  </div>
                  {record.schedule.map((s, i) => {
                    const sc = scheduleCfg(s.status);
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 70px", gap: 10, padding: "10px 16px", borderBottom: i < record.schedule.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", background: s.status === "overdue" ? "rgba(239,68,68,0.02)" : "transparent" }}>
                        <p style={{ fontSize: 12, color: "#374151" }}>{s.due_date}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{fmt(s.amount)}</p>
                        <p style={{ fontSize: 10, fontFamily: "monospace", color: s.tx_ref ? "#0891B2" : "#D1D5DB" }}>{s.tx_ref ?? "—"}</p>
                        <p style={{ fontSize: 11, color: "#6B7280" }}>{s.paid_at ?? "—"}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: sc.color }}>
                          {sc.icon}
                          <span style={{ fontSize: 10, fontWeight: 700 }}>{sc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Open disputes */}
              {record.disputes.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Disputes</p>
                  {record.disputes.map(d => (
                    <div key={d.dispute_id} style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 1 }}>Dispute {d.dispute_id}</p>
                            <p style={{ fontSize: 11, color: "#B91C1C" }}>Opened {d.opened_at} · by {d.initiated_by === "institution" ? "You" : "Business"}</p>
                          </div>
                        </div>
                        <Badge variant={d.resolution === "pending" ? "destructive" : d.resolution === "resolved" ? "success" : "outline"} style={{ fontSize: 9, flexShrink: 0 }}>
                          {d.resolution === "pending" ? "Under Review" : d.resolution === "resolved" ? "Resolved" : "Rejected"}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.6 }}>{d.reason}</p>
                      {d.platform_verified && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Shield size={11} style={{ color: "#10B981" }} />
                          <p style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>Platform verified</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Settlement proof */}
              {record.settlement_proof && record.status !== "settled" && (
                <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <ReceiptText size={13} style={{ color: "#00A8CC" }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0A5060" }}>Business submitted settlement proof</p>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{record.settlement_proof.submitted_at}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#0A5060", marginBottom: 8, lineHeight: 1.6 }}>{record.settlement_proof.notes}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                    {record.settlement_proof.tx_refs.map(ref => (
                      <span key={ref} style={{ fontSize: 10, fontFamily: "monospace", background: "rgba(0,212,255,0.1)", color: "#0891B2", padding: "2px 7px", borderRadius: 4 }}>{ref}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Metadata */}
              <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Record Details</p>
                {[
                  { label: "Interest Rate",  value: record.interest_rate },
                  { label: "Tenor",          value: record.tenor },
                  { label: "Disbursed",      value: record.disbursed_at },
                  { label: "Due",            value: record.due_at },
                  { label: "Originated by",  value: record.originated_by },
                  { label: "Approved by",    value: record.approved_by },
                  { label: "Consent expiry", value: record.consent_expiry },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {record.status === "active" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href={`/financer/business-profile?id=${record.business_id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                    <Building2 size={12} /> View Financial Identity
                  </Link>
                  <Link href="/financer/messages" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                    <MessageSquare size={12} /> Message Business
                  </Link>
                  <button onClick={onConfirmSettlement} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, border: "none", background: "#10B981", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <CheckCircle2 size={12} /> Confirm Settlement
                  </button>
                  {!hasOpenDispute && (
                    <button onClick={onOpenDispute} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "white", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <AlertCircle size={12} /> Open Dispute
                    </button>
                  )}
                </div>
              )}

              {record.status === "disputed" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 3 }}>Under platform review</p>
                    <p style={{ fontSize: 11, color: "#B91C1C", lineHeight: 1.5 }}>Creditlinker is reviewing this dispute. You'll be notified when a resolution is reached.</p>
                  </div>
                  <Link href="/financer/messages" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                    <MessageSquare size={12} /> Message Business
                  </Link>
                </div>
              )}

              {record.status === "settled" && (
                <div style={{ padding: "16px", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, textAlign: "center" as const }}>
                  <CheckCircle2 size={20} style={{ color: "#10B981", marginBottom: 6 }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 2 }}>Fully Settled</p>
                  <p style={{ fontSize: 11, color: "#059669" }}>All repayments confirmed and recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerFinancing() {
  const [records,    setRecords]    = useState(RECORDS);
  const [expandedId, setExpanded]   = useState<string | null>(null);
  const [filter,     setFilter]     = useState<"all" | FinancingStatus>("all");
  const [settlementModal, setSettlementModal] = useState<FinancingRecord | null>(null);
  const [disputeModal,    setDisputeModal]    = useState<FinancingRecord | null>(null);

  const filtered = filter === "all" ? records : records.filter(r => r.status === filter);
  const active          = records.filter(r => r.status === "active").length;
  const disputed        = records.filter(r => r.status === "disputed").length;
  const settled         = records.filter(r => r.status === "settled").length;
  const overdueCount    = records.flatMap(r => r.schedule).filter(s => s.status === "overdue").length;

  function handleConfirmSettlement(id: string) {
    setRecords(prev => prev.map(r =>
      r.financing_id === id
        ? { ...r, status: "settled" as const, repaid_pct: 100, health: "on_track" as const, outstanding: "₦0", repaid_amount: r.amount }
        : r
    ));
  }

  function handleOpenDispute(id: string, reason: string) {
    setRecords(prev => prev.map(r =>
      r.financing_id === id
        ? {
            ...r,
            status: "disputed" as const,
            health: "watch" as const,
            disputes: [...r.disputes, {
              dispute_id:        `DIS-${Date.now()}`,
              initiated_by:      "institution" as const,
              opened_at:         "Today",
              reason,
              resolution:        "pending" as const,
              platform_verified: false,
            }],
          }
        : r
    ));
  }

  return (
    <>
      {settlementModal && (
        <ConfirmSettlementModal
          record={settlementModal}
          onClose={() => setSettlementModal(null)}
          onConfirm={() => handleConfirmSettlement(settlementModal.financing_id)}
        />
      )}
      {disputeModal && (
        <OpenDisputeModal
          record={disputeModal}
          onClose={() => setDisputeModal(null)}
          onSubmit={reason => handleOpenDispute(disputeModal.financing_id, reason)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Financing
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {records.length} financing records · {active} active · {settled} settled
            {disputed > 0 && <> · <span style={{ color: "#EF4444", fontWeight: 600 }}>{disputed} disputed</span></>}
            {overdueCount > 0 && <> · <span style={{ color: "#F59E0B", fontWeight: 600 }}>{overdueCount} overdue payment{overdueCount !== 1 ? "s" : ""}</span></>}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
          {[
            { label: "Total Deployed",   value: "₦248M",           sub: "Across all records",   icon: <Banknote      size={16} />, accent: true,  alert: false },
            { label: "Active",           value: String(active),     sub: "Currently open",       icon: <TrendingUp    size={16} />, accent: false, alert: false },
            { label: "Total Repaid",     value: "₦102M",           sub: "Across all records",   icon: <CheckCircle2  size={16} />, accent: false, alert: false },
            { label: "Overdue Payments", value: String(overdueCount), sub: "Need attention",     icon: <AlertCircle   size={16} />, accent: false, alert: overdueCount > 0 },
          ].map(m => (
            <Card key={m.label} style={{ padding: "20px 22px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, marginBottom: 14, background: m.accent ? "#0A2540" : m.alert ? "#FEF2F2" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: m.accent ? "#00D4FF" : m.alert ? "#EF4444" : "#6B7280" }}>
                {m.icon}
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: m.alert ? "#EF4444" : "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{m.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{m.label}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.sub}</p>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
          {([
            { key: "all",      label: "All",      count: records.length },
            { key: "active",   label: "Active",   count: active },
            { key: "disputed", label: "Disputed", count: disputed },
            { key: "settled",  label: "Settled",  count: settled },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: filter === tab.key ? "1px solid #0A2540" : "1px solid #E5E7EB", background: filter === tab.key ? "#0A2540" : "white", color: filter === tab.key ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
              {tab.label}
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: 9999, background: filter === tab.key ? "rgba(255,255,255,0.15)" : tab.key === "disputed" && tab.count > 0 ? "#FEF2F2" : "#F3F4F6", color: filter === tab.key ? "white" : tab.key === "disputed" && tab.count > 0 ? "#EF4444" : "#6B7280", fontSize: 10, fontWeight: 700, padding: "0 4px" }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Column headers — hidden on mobile via fnc-fin-col-headers */}
        <div className="fnc-fin-col-headers" style={{ display: "grid", gridTemplateColumns: "36px 1fr 90px 110px 110px 80px 130px", gap: 12, padding: "0 20px 6px" }}>
          {["", "Business", "Amount", "Disbursed", "Due", "Health", "Repaid"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
          ))}
        </div>

        {/* Records */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <FileText size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No records</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No financing records match the selected filter.</p>
            </div>
          ) : (
            filtered.map(record => (
              <RecordRow
                key={record.financing_id}
                record={record}
                expanded={expandedId === record.financing_id}
                onToggle={() => setExpanded(expandedId === record.financing_id ? null : record.financing_id)}
                onConfirmSettlement={() => setSettlementModal(record)}
                onOpenDispute={() => setDisputeModal(record)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
