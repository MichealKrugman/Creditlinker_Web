"use client";

import { useState } from "react";
import {
  TrendingUp, BarChart2, Download, FileText, Plus, Send,
  CheckCircle2, Clock, ArrowUpRight, X, ChevronRight,
  User, Users, UserCheck, Crown, AlertCircle, Star,
  MessageSquare, Eye, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────

// Businesses with granted access that can have reports generated
const ACCESSIBLE_BUSINESSES = [
  { id: "BIZ-1R8T", cl_id: "BIZ-1R8T",     name: "Kemi Superstores Ltd",          sector: "Retail",        score: 782, risk: "Low Risk",    data_months: 18 },
  { id: "BIZ-1R8T-041", cl_id: "BIZ-1R8T-041", name: "Kemi Superstores — Ikeja Branch", sector: "Retail",   score: 704, risk: "Low Risk",    data_months: 10 },
  { id: "BIZ-4F9T", cl_id: "BIZ-4F9T",     name: "Aduke Bakeries Ltd",             sector: "Food & Bev",   score: 742, risk: "Low Risk",    data_months: 24 },
  { id: "BIZ-9P4L", cl_id: "BIZ-9P4L",     name: "Bright Pharma",                 sector: "Healthcare",    score: 668, risk: "Medium Risk", data_months: 15 },
];

type ReportStatus = "draft" | "submitted" | "reviewed" | "approved" | "rejected";
type ForwardTarget = "analyst" | "team_lead" | "principal";

interface BusinessReport {
  id: string;
  business_cl_id: string;
  business_name: string;
  capital_category: string;
  recommended_amount: string;
  score: number;
  risk: string;
  originated_by: string;
  originated_by_id: string;
  created_at: string;
  status: ReportStatus;
  forwarded_to: ForwardTarget | null;
  forwarded_at: string | null;
  reviewer: string | null;
  reviewed_at: string | null;
  notes: string;
  auto_summary: string;
  approval_chain: { actor: string; role: string; action: string; at: string; note?: string }[];
}

const REPORTS: BusinessReport[] = [
  {
    id: "RPT-001",
    business_cl_id: "BIZ-4F9T",
    business_name: "Aduke Bakeries Ltd",
    capital_category: "Working Capital Loan",
    recommended_amount: "₦10M",
    score: 742,
    risk: "Low Risk",
    originated_by: "Amaka Nwosu",
    originated_by_id: "u4",
    created_at: "Today, 09:14",
    status: "submitted",
    forwarded_to: "team_lead",
    forwarded_at: "Today, 09:20",
    reviewer: "Chidi Eze",
    reviewed_at: null,
    notes: "Strong revenue consistency over 24 months. Seasonal peaks in Q4 align well with our working capital product. I recommend approving ₦10M at 18% p.a. Risk profile is clean — no anomaly flags.",
    auto_summary: "Revenue Stability: 85 · Cashflow: 78 · Expense Discipline: 81 · Liquidity: 74 · Consistency: 80 · Risk: 69 · Data Quality: 91%",
    approval_chain: [
      { actor: "Amaka Nwosu", role: "Analyst",   action: "Submitted report",  at: "Today, 09:20" },
    ],
  },
  {
    id: "RPT-002",
    business_cl_id: "BIZ-1R8T",
    business_name: "Kemi Superstores Ltd",
    capital_category: "Invoice Financing",
    recommended_amount: "₦8M",
    score: 782,
    risk: "Low Risk",
    originated_by: "Bola Fashola",
    originated_by_id: "u5",
    created_at: "Yesterday, 14:30",
    status: "reviewed",
    forwarded_to: "team_lead",
    forwarded_at: "Yesterday, 14:45",
    reviewer: "Chidi Eze",
    reviewed_at: "Yesterday, 16:00",
    notes: "High-velocity retail with consistent invoice cycles. The Ikeja branch was also assessed (BIZ-1R8T-041) and shows solid performance for the size. I recommend starting with the parent entity.",
    auto_summary: "Revenue Stability: 88 · Cashflow: 79 · Expense Discipline: 84 · Liquidity: 76 · Consistency: 82 · Risk: 74 · Data Quality: 88%",
    approval_chain: [
      { actor: "Bola Fashola", role: "Analyst",   action: "Submitted report",  at: "Yesterday, 14:45" },
      { actor: "Chidi Eze",    role: "Team Lead",  action: "Reviewed — recommends approval", at: "Yesterday, 16:00", note: "Agree. Strong profile. Forwarding for final sign-off." },
    ],
  },
  {
    id: "RPT-003",
    business_cl_id: "BIZ-9P4L",
    business_name: "Bright Pharma",
    capital_category: "Equipment Financing",
    recommended_amount: "₦7M",
    score: 668,
    risk: "Medium Risk",
    originated_by: "Amaka Nwosu",
    originated_by_id: "u4",
    created_at: "Dec 28, 11:00",
    status: "approved",
    forwarded_to: "team_lead",
    forwarded_at: "Dec 28, 11:20",
    reviewer: "Chidi Eze",
    reviewed_at: "Dec 28, 14:00",
    notes: "Expense discipline is exceptional at 85. Liquidity is lower than I'd prefer at 69 but the equipment financing is self-collateralising. Recommend conditional approval with equipment lien clause.",
    auto_summary: "Revenue Stability: 77 · Cashflow: 81 · Expense Discipline: 85 · Liquidity: 69 · Consistency: 78 · Risk: 80 · Data Quality: 76%",
    approval_chain: [
      { actor: "Amaka Nwosu", role: "Analyst",   action: "Submitted report",   at: "Dec 28, 11:20" },
      { actor: "Chidi Eze",   role: "Team Lead",  action: "Approved with conditions", at: "Dec 28, 14:00", note: "Conditional approval — equipment lien required. Forwarded to Principal." },
      { actor: "Tunde Adeyemi", role: "Principal", action: "Final approval granted", at: "Dec 28, 16:30", note: "Approved. ₦7M at 16% p.a. with lien. Deal team to proceed." },
    ],
  },
];

const PORTFOLIO_KPIs = [
  { label: "Total Deployed",  value: "₦248M", color: "#0A2540" },
  { label: "Total Repaid",    value: "₦102M", color: "#10B981" },
  { label: "Active Exposure", value: "₦146M", color: "#F59E0B" },
  { label: "Deals Closed",    value: "14",    color: "#0A2540" },
  { label: "Avg. Deal Size",  value: "₦17.7M",color: "#0A2540" },
  { label: "Repayment Rate",  value: "94%",   color: "#10B981" },
];

const MONTHLY = [
  { month: "Jul", deployed: 18, repaid: 6 },
  { month: "Aug", deployed: 25, repaid: 9 },
  { month: "Sep", deployed: 42, repaid: 14 },
  { month: "Oct", deployed: 30, repaid: 20 },
  { month: "Nov", deployed: 55, repaid: 22 },
  { month: "Dec", deployed: 38, repaid: 31 },
];
const MAX_VAL = Math.max(...MONTHLY.flatMap(m => [m.deployed, m.repaid]));

const ANALYST_PERFORMANCE = [
  { name: "Amaka Nwosu",  reports: 8,  approved: 6, rejected: 1, pending: 1, conversion: "75%", avg_score: 728 },
  { name: "Bola Fashola", reports: 6,  approved: 5, rejected: 0, pending: 1, conversion: "83%", avg_score: 751 },
];

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function statusConfig(s: ReportStatus) {
  return {
    draft:     { label: "Draft",     variant: "outline"      as const, color: "#9CA3AF" },
    submitted: { label: "Submitted", variant: "secondary"    as const, color: "#0891B2" },
    reviewed:  { label: "Reviewed",  variant: "warning"      as const, color: "#F59E0B" },
    approved:  { label: "Approved",  variant: "success"      as const, color: "#10B981" },
    rejected:  { label: "Rejected",  variant: "destructive"  as const, color: "#EF4444" },
  }[s];
}

function roleIcon(role: string) {
  if (role === "Principal") return <Crown     size={11} style={{ color: "#9CA3AF" }} />;
  if (role === "Team Lead") return <UserCheck size={11} style={{ color: "#9CA3AF" }} />;
  if (role === "Analyst")   return <User      size={11} style={{ color: "#9CA3AF" }} />;
  return                           <Users     size={11} style={{ color: "#9CA3AF" }} />;
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────
//  GENERATE REPORT MODAL
// ─────────────────────────────────────────────────────────────

function GenerateReportModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { business_id: string; capital_category: string; amount: string; notes: string; forward_to: ForwardTarget }) => void;
}) {
  const [selectedBiz, setSelectedBiz] = useState(ACCESSIBLE_BUSINESSES[0]);
  const [capitalCat,  setCapitalCat]  = useState("Working Capital Loan");
  const [amount,      setAmount]      = useState("");
  const [notes,       setNotes]       = useState("");
  const [forwardTo,   setForwardTo]   = useState<ForwardTarget>("team_lead");
  const [step,        setStep]        = useState<"compose" | "preview">("compose");

  const CAPITAL_CATS = ["Working Capital Loan", "Term Loan", "Equipment Financing", "Invoice Financing", "Revenue Advance", "Trade Finance"];

  const autoSummary = `Revenue Stability: ${Math.floor(Math.random() * 20 + 70)} · Cashflow: ${Math.floor(Math.random() * 20 + 65)} · Data Quality: ${Math.floor(Math.random() * 10 + 80)}%`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 580, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>Generate Business Report</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {step === "compose" ? "Select a business and add your assessment." : "Preview your report before submitting."}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={16} /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {step === "compose" ? (
            <>
              {/* Business selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Business <span style={{ color: "#EF4444" }}>*</span></label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ACCESSIBLE_BUSINESSES.map((biz) => (
                    <button key={biz.cl_id} onClick={() => setSelectedBiz(biz)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: `1.5px solid ${selectedBiz.cl_id === biz.cl_id ? "#0A2540" : "#E5E7EB"}`, borderRadius: 10, background: selectedBiz.cl_id === biz.cl_id ? "#F8FAFC" : "white", cursor: "pointer", textAlign: "left" as const }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00D4FF", flexShrink: 0 }}>
                        {biz.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{biz.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>{biz.cl_id}</span>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{biz.sector} · Score: {biz.score} · {biz.data_months}mo</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: biz.score >= 700 ? "#10B981" : "#F59E0B" }}>{biz.risk}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capital category + amount */}
              <div className="fnc-rep-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Capital Category</label>
                  <select value={capitalCat} onChange={e => setCapitalCat(e.target.value)}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", background: "white" }}>
                    {CAPITAL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Recommended Amount</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. ₦10,000,000"
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }} />
                </div>
              </div>

              {/* Personal notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Your Assessment & Notes <span style={{ color: "#EF4444" }}>*</span></label>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6, lineHeight: 1.5 }}>
                  These are your personal observations on this business. They travel with the report through the approval chain and are visible to reviewers. Be specific about what signals informed your recommendation.
                </p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5}
                  placeholder="e.g. Strong revenue consistency over 18 months. Cashflow dips in Q1 but recovers quickly. I recommend ₦10M at 18% p.a. — risk profile is clean with no anomaly flags."
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
                  onFocus={e => (e.target.style.borderColor = "#0A2540")}
                  onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
              </div>

              {/* Forward to */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Submit to</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { value: "analyst",   label: "Senior Analyst", icon: <User size={12} />, desc: "Routes to analyst for quality check first" },
                    { value: "team_lead", label: "Team Lead",      icon: <UserCheck size={12} />, desc: "Direct to your team lead" },
                    { value: "principal", label: "Principal",      icon: <Crown size={12} />, desc: "Escalate directly to principal" },
                  ] as const).map(opt => (
                    <button key={opt.value} onClick={() => setForwardTo(opt.value)}
                      style={{ flex: 1, padding: "10px 8px", border: `1.5px solid ${forwardTo === opt.value ? "#0A2540" : "#E5E7EB"}`, borderRadius: 10, background: forwardTo === opt.value ? "#F8FAFC" : "white", cursor: "pointer", textAlign: "center" as const }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "#0A2540", marginBottom: 3 }}>{opt.icon}
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                      </div>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW STEP */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00D4FF", flexShrink: 0 }}>
                    {selectedBiz.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{selectedBiz.name}</p>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF", background: "#E5E7EB", padding: "1px 5px", borderRadius: 4 }}>{selectedBiz.cl_id}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[
                    { label: "Capital Type",  value: capitalCat },
                    { label: "Recommended",   value: amount || "Not specified" },
                    { label: "CL Score",      value: String(selectedBiz.score) },
                  ].map(f => (
                    <div key={f.label}>
                      <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{f.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{f.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Auto-generated summary</p>
                  <p style={{ fontSize: 11, color: "#0E7490" }}>{autoSummary}</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Your Notes</p>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{notes || "(none)"}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
                <Send size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#065F46" }}>
                  This report will be submitted to <strong>{forwardTo === "analyst" ? "Senior Analyst" : forwardTo === "team_lead" ? "your Team Lead" : "Principal"}</strong> for review.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexShrink: 0 }}>
          {step === "compose" ? (
            <>
              <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Save as Draft</button>
              <button disabled={!notes.trim()} onClick={() => setStep("preview")}
                style={{ flex: 1, height: 40, borderRadius: 8, border: "none", background: notes.trim() ? "#0A2540" : "#E5E7EB", color: notes.trim() ? "white" : "#9CA3AF", fontSize: 13, fontWeight: 600, cursor: notes.trim() ? "pointer" : "not-allowed" }}>
                Preview Report →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("compose")} style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>← Edit</button>
              <button onClick={() => { onSubmit({ business_id: selectedBiz.cl_id, capital_category: capitalCat, amount, notes, forward_to: forwardTo }); onClose(); }}
                style={{ flex: 2, height: 40, borderRadius: 8, border: "none", background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Send size={13} /> Submit Report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  REPORT CARD
// ─────────────────────────────────────────────────────────────

function ReportCard({ report, onView }: { report: BusinessReport; onView: (r: BusinessReport) => void }) {
  const sc = statusConfig(report.status);
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00D4FF", flexShrink: 0 }}>
              {report.business_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{report.business_name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>{report.business_cl_id}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {report.capital_category} · {report.recommended_amount}</span>
              </div>
            </div>
          </div>
          <Badge variant={sc.variant} style={{ fontSize: 10, flexShrink: 0 }}>{sc.label}</Badge>
        </div>
      </div>

      {/* Notes preview */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          "{report.notes}"
        </p>
      </div>

      {/* Approval chain mini */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
          {report.approval_chain.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ fontSize: 10, color: "#D1D5DB" }}>→</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", background: "#F9FAFB", borderRadius: 9999, border: "1px solid #E5E7EB" }}>
                {roleIcon(step.role)}
                <span style={{ fontSize: 10, color: "#374151", fontWeight: 600 }}>{step.actor.split(" ")[0]}</span>
              </div>
            </div>
          ))}
          {report.forwarded_to && report.approval_chain.length < 3 && (
            <>
              <span style={{ fontSize: 10, color: "#D1D5DB" }}>→</span>
              <div style={{ padding: "3px 7px", background: "#FFFBEB", borderRadius: 9999, border: "1px solid rgba(245,158,11,0.2)" }}>
                <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>Awaiting review</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>By <strong style={{ color: "#374151" }}>{report.originated_by}</strong></span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{report.created_at}</span>
        </div>
        <button onClick={() => onView(report)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}>
          <Eye size={12} /> View
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  REPORT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────

function ReportDrawer({ report, onClose }: { report: BusinessReport; onClose: () => void }) {
  const sc = statusConfig(report.status);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(10,37,64,0.4)", display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 500, background: "white", height: "100%", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }}>
        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540", marginBottom: 3 }}>{report.business_name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF", background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>{report.business_cl_id}</span>
                <Badge variant={sc.variant} style={{ fontSize: 10 }}>{sc.label}</Badge>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Deal details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Capital Category",  value: report.capital_category },
              { label: "Recommended Amount",value: report.recommended_amount },
              { label: "CL Score",          value: String(report.score) },
              { label: "Risk Level",        value: report.risk },
            ].map(f => (
              <div key={f.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{f.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Auto summary */}
          <div style={{ background: "#F0FDFF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Creditlinker Auto-Summary</p>
            <p style={{ fontSize: 12, color: "#0E7490", lineHeight: 1.6 }}>{report.auto_summary}</p>
          </div>

          {/* Analyst notes */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Analyst Notes — {report.originated_by}
            </p>
            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{report.notes}</p>
            </div>
          </div>

          {/* Approval chain */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Decision Chain</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {report.approval_chain.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < report.approval_chain.length - 1 ? 16 : 0 }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                    </div>
                    {i < report.approval_chain.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "#E5E7EB", marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < report.approval_chain.length - 1 ? 0 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{step.actor}</p>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#9CA3AF" }}>
                        {roleIcon(step.role)} {step.role}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: step.note ? 4 : 0 }}>{step.action} · {step.at}</p>
                    {step.note && (
                      <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 7, padding: "7px 10px", marginTop: 4 }}>
                        <p style={{ fontSize: 12, color: "#374151", fontStyle: "italic" }}>"{step.note}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pending indicator */}
              {(report.status === "submitted" || report.status === "reviewed") && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={12} style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>Awaiting review from {report.reviewer ?? "next reviewer"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function FinancerReports() {
  const [activeTab, setActiveTab] = useState<"analytics" | "reports">("analytics");
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewReport,   setViewReport]   = useState<BusinessReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");

  const filteredReports = statusFilter === "all" ? REPORTS : REPORTS.filter(r => r.status === statusFilter);

  return (
    <>
      {showGenerate && (
        <GenerateReportModal
          onClose={() => setShowGenerate(false)}
          onSubmit={(data) => {
            // TODO: POST /institution/reports { ...data }
            console.log("Submitting report:", data);
          }}
        />
      )}
      {viewReport && <ReportDrawer report={viewReport} onClose={() => setViewReport(null)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Reports</h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Portfolio analytics · {REPORTS.length} business reports · {REPORTS.filter(r => r.status === "submitted").length} awaiting review</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", height: 36, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}>
              <Download size={13} /> Export
            </button>
            <Button variant="primary" size="sm" style={{ gap: 6 }} onClick={() => setShowGenerate(true)}>
              <Plus size={13} /> Generate Report
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {([
            { key: "analytics", label: "Portfolio Analytics", icon: <BarChart2 size={13} /> },
            { key: "reports",   label: "Business Reports",    icon: <FileText  size={13} /> },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "none", background: activeTab === tab.key ? "#0A2540" : "transparent", color: activeTab === tab.key ? "white" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {tab.icon} {tab.label}
              {tab.key === "reports" && REPORTS.filter(r => r.status === "submitted").length > 0 && (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: activeTab === "reports" ? "rgba(255,255,255,0.25)" : "#EF4444", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {REPORTS.filter(r => r.status === "submitted").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
              {PORTFOLIO_KPIs.map(m => (
                <Card key={m.label} style={{ padding: "18px 20px" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: m.color, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{m.value}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>{m.label}</p>
                </Card>
              ))}
            </div>

            <div className="fnc-rep-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Monthly chart */}
              <Card>
                <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Monthly Activity</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ color: "#0A2540", label: "Deployed" }, { color: "#10B981", label: "Repaid" }].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "20px 22px 18px", display: "flex", alignItems: "flex-end", gap: 14, height: 140 }}>
                  {MONTHLY.map(m => (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 100 }}>
                        <div style={{ width: 16, height: `${(m.deployed / MAX_VAL) * 100}px`, background: "#0A2540", borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                        <div style={{ width: 16, height: `${(m.repaid / MAX_VAL) * 100}px`, background: "#10B981", borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                      </div>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>{m.month}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Analyst performance intelligence */}
              <Card>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 2 }}>Analyst Performance</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Recommendation accuracy this quarter</p>
                </div>
                <div>
                  {ANALYST_PERFORMANCE.map((a, i) => (
                    <div key={a.name} style={{ padding: "14px 22px", borderBottom: i < ANALYST_PERFORMANCE.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0A2540", flexShrink: 0 }}>
                          {a.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{a.name}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{a.reports} reports · avg score {a.avg_score}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#10B981", fontFamily: "var(--font-display)" }}>{a.conversion}</span>
                      </div>
                      <div className="fnc-rep-analyst-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {[
                          { label: "Reports",  value: a.reports,  color: "#0A2540" },
                          { label: "Approved", value: a.approved, color: "#10B981" },
                          { label: "Rejected", value: a.rejected, color: "#EF4444" },
                          { label: "Pending",  value: a.pending,  color: "#F59E0B" },
                        ].map(s => (
                          <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", textAlign: "center" as const }}>
                            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: s.color, marginBottom: 2 }}>{s.value}</p>
                            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── BUSINESS REPORTS TAB ── */}
        {activeTab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {([
                { key: "all",       label: "All",       count: REPORTS.length },
                { key: "submitted", label: "Submitted", count: REPORTS.filter(r => r.status === "submitted").length },
                { key: "reviewed",  label: "Reviewed",  count: REPORTS.filter(r => r.status === "reviewed").length },
                { key: "approved",  label: "Approved",  count: REPORTS.filter(r => r.status === "approved").length },
                { key: "draft",     label: "Drafts",    count: REPORTS.filter(r => r.status === "draft").length },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${statusFilter === tab.key ? "#0A2540" : "#E5E7EB"}`, background: statusFilter === tab.key ? "#0A2540" : "white", color: statusFilter === tab.key ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {tab.label}
                  <span style={{ minWidth: 16, height: 16, borderRadius: 9999, background: statusFilter === tab.key ? "rgba(255,255,255,0.2)" : "#F3F4F6", color: statusFilter === tab.key ? "white" : "#9CA3AF", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredReports.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
                <FileText size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No reports yet</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Generate a business report on any business you have access to.</p>
                <Button variant="primary" size="sm" onClick={() => setShowGenerate(true)}><Plus size={13} /> Generate Report</Button>
              </div>
            ) : (
              <div className="fnc-rep-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {filteredReports.map(r => <ReportCard key={r.id} report={r} onView={setViewReport} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
