"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download, FileText, BarChart2, ShieldCheck,
  Clock, CheckCircle2, Lock, ChevronRight,
  Calendar, RefreshCw, Loader2, File,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /business/snapshots → FinancialIdentitySnapshot[]
                 GET /business/score
                 GET /business/profile
───────────────────────────────────────────────────────── */
const AVAILABLE_REPORTS = [
  {
    id: "financial_identity",
    title: "Financial Identity Report",
    description: "Full financial identity snapshot — all six dimensions, data quality score, risk flags, and data provenance. Suitable for sharing with capital providers.",
    icon: <ShieldCheck size={18} />,
    accent: true,
    format: ["PDF"],
    last_generated: "Today, 09:14",
    requires: null,
  },
  {
    id: "score_summary",
    title: "Score Summary",
    description: "A concise one-page summary of your financial score, dimension breakdown, and risk level.",
    icon: <BarChart2 size={18} />,
    accent: false,
    format: ["PDF"],
    last_generated: "Today, 09:14",
    requires: null,
  },
  {
    id: "transaction_export",
    title: "Transaction Export",
    description: "Full normalised transaction history with categories, counterparty clusters, and flags. Useful for accounting reconciliation.",
    icon: <FileText size={18} />,
    accent: false,
    format: ["CSV", "XLSX"],
    last_generated: "Dec 28, 2024",
    requires: null,
  },
  {
    id: "cashflow_analysis",
    title: "Cashflow Analysis Report",
    description: "Monthly revenue, expense, and net cashflow breakdown with trend indicators over your data coverage period.",
    icon: <BarChart2 size={18} />,
    accent: false,
    format: ["PDF"],
    last_generated: "Dec 28, 2024",
    requires: null,
  },
  {
    id: "data_room",
    title: "Data Room Package",
    description: "Complete package for sharing with financers — financial identity report, score summary, and transaction export bundled into one download.",
    icon: <File size={18} />,
    accent: false,
    format: ["ZIP"],
    last_generated: null,
    requires: "verified",
  },
  {
    id: "audit_trail",
    title: "Consent & Access Audit",
    description: "Full log of every consent granted, revoked, and every financer access event against your financial identity.",
    icon: <Clock size={18} />,
    accent: false,
    format: ["PDF", "CSV"],
    last_generated: "Dec 27, 2024",
    requires: null,
  },
];

const SNAPSHOT_HISTORY = [
  { taken_at: "Dec 28, 2024 · 09:14", pipeline_run_id: "run_7x9a2k", score: 742, risk: "Low Risk",    quality: 91 },
  { taken_at: "Nov 30, 2024 · 18:42", pipeline_run_id: "run_6w8b1j", score: 724, risk: "Low Risk",    quality: 89 },
  { taken_at: "Oct 31, 2024 · 11:05", pipeline_run_id: "run_5v7c0i", score: 698, risk: "Medium Risk", quality: 84 },
  { taken_at: "Sep 30, 2024 · 09:30", pipeline_run_id: "run_4u6d9h", score: 671, risk: "Medium Risk", quality: 80 },
];

const DATE_RANGES = ["Last 3 months", "Last 6 months", "Last 12 months", "All time"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
type GeneratingState = Record<string, boolean>;

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
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F3F4F6", gap: 12, flexWrap: "wrap" as const }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REPORT CARD
───────────────────────────────────────────────────────── */
function ReportCard({
  report,
  generating,
  onGenerate,
  verified,
}: {
  report: typeof AVAILABLE_REPORTS[0];
  generating: boolean;
  onGenerate: (id: string, format: string) => void;
  verified: boolean;
}) {
  const locked = report.requires === "verified" && !verified;

  return (
    <div style={{
      background: "white",
      border: `1.5px solid ${report.accent ? "#0A2540" : "#E5E7EB"}`,
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      opacity: locked ? 0.6 : 1,
      position: "relative" as const,
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: report.accent ? "#0A2540" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: report.accent ? "#00D4FF" : "#6B7280",
          }}>
            {report.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
                {report.title}
              </p>
              {report.accent && <Badge variant="default" style={{ fontSize: 9 }}>Recommended</Badge>}
              {locked && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 9999 }}>
                  <Lock size={9} /> Requires verification
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{report.description}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #F3F4F6", flexWrap: "wrap" as const, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          {/* Format badges */}
          <div style={{ display: "flex", gap: 5 }}>
            {report.format.map(f => (
              <span key={f} style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.04em" }}>
                {f}
              </span>
            ))}
          </div>
          {report.last_generated && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              Last: {report.last_generated}
            </span>
          )}
        </div>

        {locked ? (
          <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <Lock size={11} /> Locked
          </span>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            {report.format.map(f => (
              <button
                key={f}
                onClick={() => !generating && onGenerate(report.id, f)}
                disabled={generating}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 7,
                  border: "1px solid #E5E7EB", background: "white",
                  fontSize: 12, fontWeight: 600, color: "#0A2540",
                  cursor: generating ? "not-allowed" : "pointer",
                  transition: "all 0.12s",
                  opacity: generating ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!generating) {
                    (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
                    (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
                  (e.currentTarget as HTMLElement).style.background = "white";
                }}
              >
                {generating
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Download size={11} />
                }
                {generating ? "Generating…" : `Download ${f}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [generating, setGenerating] = useState<GeneratingState>({});
  const [dateRange, setDateRange]   = useState("Last 12 months");
  const verified = true; // TODO: derive from business profile_status + document verification

  const handleGenerate = async (id: string, format: string) => {
    const key = `${id}_${format}`;
    setGenerating(g => ({ ...g, [key]: true }));
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(g => ({ ...g, [key]: false }));
    // TODO: POST /business/reports/generate { report_type: id, format, date_range }
    // Then trigger browser download from returned signed URL
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Reports
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Generate and download reports from your financial identity data.
          </p>
        </div>

        {/* Date range selector */}
        <div className="cl-overflow-x-auto" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden", minWidth: "fit-content" }}>
            {DATE_RANGES.map((r, i) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  padding: "6px 12px", fontSize: 12, fontWeight: 600,
                  border: "none",
                  borderRight: i < DATE_RANGES.length - 1 ? "1px solid #E5E7EB" : "none",
                  background: dateRange === r ? "#0A2540" : "white",
                  color: dateRange === r ? "white" : "#6B7280",
                  cursor: "pointer", transition: "all 0.12s",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── REPORT CARDS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {AVAILABLE_REPORTS.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            generating={!!(generating[`${report.id}_PDF`] || generating[`${report.id}_CSV`] || generating[`${report.id}_XLSX`] || generating[`${report.id}_ZIP`])}
            onGenerate={handleGenerate}
            verified={verified}
          />
        ))}
      </div>

      {/* ── IDENTITY SNAPSHOT HISTORY ── */}
      <Card>
        <CardHeader
          title="Identity Snapshot History"
          sub="A report can be generated from any historical pipeline run."
          action={
            <button
              onClick={() => window.location.reload()}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          }
        />
        <div style={{ padding: "4px 0 8px" }}>

          {/* ── DESKTOP TABLE ── */}
          <div className="bp-op-desktop">
            <div className="cl-table-scroll">
              <div style={{ minWidth: 560 }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 140px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  {["Pipeline run", "Score", "Risk level", "Quality", ""].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
                  ))}
                </div>
                {/* Rows */}
                {SNAPSHOT_HISTORY.map((snap, i) => (
                  <div
                    key={snap.pipeline_run_id}
                    style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 140px", gap: 14, padding: "13px 24px", borderBottom: i < SNAPSHOT_HISTORY.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: "#0A2540", marginBottom: 2 }}>
                        {snap.taken_at}
                        {i === 0 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>(latest)</span>}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{snap.pipeline_run_id}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: snap.score >= 730 ? "#10B981" : snap.score >= 650 ? "#F59E0B" : "#EF4444" }}>
                      {snap.score}
                    </p>
                    <Badge variant={snap.risk === "Low Risk" ? "success" : "warning"} style={{ width: "fit-content", fontSize: 10 }}>
                      {snap.risk}
                    </Badge>
                    <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{snap.quality}%</p>
                    <button
                      onClick={() => handleGenerate("financial_identity", "PDF")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer", whiteSpace: "nowrap" as const }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                    >
                      <Download size={11} /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="bp-op-mobile">
            {SNAPSHOT_HISTORY.map((snap, i) => (
              <div
                key={snap.pipeline_run_id}
                style={{ padding: "14px 16px", borderBottom: i < SNAPSHOT_HISTORY.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                {/* Run + timestamp */}
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: "#0A2540", marginBottom: 2 }}>
                    {snap.taken_at}
                    {i === 0 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>(latest)</span>}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{snap.pipeline_run_id}</p>
                </div>
                {/* Metrics row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" as const }}>
                  <p style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: snap.score >= 730 ? "#10B981" : snap.score >= 650 ? "#F59E0B" : "#EF4444" }}>
                    {snap.score}
                  </p>
                  <Badge variant={snap.risk === "Low Risk" ? "success" : "warning"} style={{ fontSize: 10 }}>
                    {snap.risk}
                  </Badge>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Quality: {snap.quality}%</span>
                </div>
                {/* Action */}
                <button
                  onClick={() => handleGenerate("financial_identity", "PDF")}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
                >
                  <Download size={11} /> Download PDF
                </button>
              </div>
            ))}
          </div>

        </div>
      </Card>

      {/* ── SHARING NOTE ── */}
      <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} color="#00D4FF" />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
              Share directly — no download required.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              Capital providers can access your financial identity directly via consent. Reports are for your own records and offline sharing.
            </p>
          </div>
        </div>
        <Link href="/financers" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
          <ChevronRight size={13} /> Manage consent
        </Link>
      </div>

    </div>
  );
}
