"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Download, FileText, BarChart2, ShieldCheck,
  Clock, ChevronRight, Calendar, RefreshCw,
  Loader2, File, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActiveBusiness } from "@/lib/business-context";
import {
  getSnapshots, generateReport,
  IdentitySnapshot, ReportType, ReportFormat,
} from "@/lib/api";

/* ─────────────────────────────────────────────────────────
   STATIC REPORT DEFINITIONS
───────────────────────────────────────────────────────── */
const REPORT_DEFS = [
  {
    id:          "financial_identity" as ReportType,
    title:       "Financial Identity Report",
    description: "Full financial identity snapshot — all six dimensions, data quality score, risk flags, and data provenance. Suitable for sharing with capital providers.",
    icon:        <ShieldCheck size={18} />,
    accent:      true,
    formats:     ["pdf"] as ReportFormat[],
    requires:    null,
  },
  {
    id:          "readiness" as ReportType,
    title:       "Financing Readiness Report",
    description: "Your readiness status across all financing types — blockers, criteria pass/fail, and projected ready dates.",
    icon:        <BarChart2 size={18} />,
    accent:      false,
    formats:     ["pdf"] as ReportFormat[],
    requires:    null,
  },
  {
    id:          "full" as ReportType,
    title:       "Full Financial Report",
    description: "Combined financial identity and financing readiness report. Complete package for capital providers.",
    icon:        <File size={18} />,
    accent:      false,
    formats:     ["pdf", "csv"] as ReportFormat[],
    requires:    "verified",
  },
  {
    id:          "financial_identity" as ReportType,
    title:       "Transaction Export",
    description: "Full normalised transaction history with categories, counterparty clusters, and flags. Useful for accounting reconciliation.",
    icon:        <FileText size={18} />,
    accent:      false,
    formats:     ["csv"] as ReportFormat[],
    requires:    null,
    _label:      "transaction_export",
  },
  {
    id:          "financial_identity" as ReportType,
    title:       "Consent & Access Audit",
    description: "Full log of every consent granted, revoked, and every financer access event against your financial identity.",
    icon:        <Clock size={18} />,
    accent:      false,
    formats:     ["pdf"] as ReportFormat[],
    requires:    null,
    _label:      "audit_trail",
  },
];

const DATE_RANGES = ["Last 3 months", "Last 6 months", "Last 12 months", "All time"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function formatTakenAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${time}`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  lastGenerated,
  generatingKey,
  onGenerate,
  verified,
}: {
  report: typeof REPORT_DEFS[0];
  lastGenerated: string | null;
  generatingKey: string | null;
  onGenerate: (reportType: ReportType, format: ReportFormat, uiKey: string) => void;
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
                  Requires verification
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{report.description}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #F3F4F6", flexWrap: "wrap" as const, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 5 }}>
            {report.formats.map(f => (
              <span key={f} style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", background: "#F3F4F6", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.04em" }}>
                {f.toUpperCase()}
              </span>
            ))}
          </div>
          {lastGenerated && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Last: {lastGenerated}</span>
          )}
        </div>

        {locked ? (
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Locked</span>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            {report.formats.map(f => {
              const uiKey = `${report._label ?? report.id}_${f}`;
              const busy  = generatingKey === uiKey;
              return (
                <button
                  key={f}
                  onClick={() => !busy && onGenerate(report.id, f, uiKey)}
                  disabled={busy}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 7,
                    border: "1px solid #E5E7EB", background: "white",
                    fontSize: 12, fontWeight: 600, color: "#0A2540",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1, transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}
                >
                  {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                  {busy ? "Generating…" : `Download ${f.toUpperCase()}`}
                </button>
              );
            })}
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
  const { activeBusiness } = useActiveBusiness();

  const [snapshots,     setSnapshots]     = useState<IdentitySnapshot[]>([]);
  const [snapLoading,   setSnapLoading]   = useState(true);
  const [snapError,     setSnapError]     = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [genError,      setGenError]      = useState<string | null>(null);
  const [dateRange,     setDateRange]     = useState("Last 12 months");

  const verified = activeBusiness?.kyc_status === "verified";

  // ── Load snapshots ─────────────────────────────────────────
  const loadSnapshots = useCallback(async () => {
    if (!activeBusiness?.business_id) return;
    setSnapLoading(true);
    setSnapError(null);
    try {
      const res = await getSnapshots(activeBusiness.business_id);
      setSnapshots(res.snapshots);
    } catch (err: any) {
      setSnapError(err?.message ?? "Failed to load snapshot history.");
    } finally {
      setSnapLoading(false);
    }
  }, [activeBusiness?.business_id]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  // ── Generate + download ────────────────────────────────────
  const handleGenerate = useCallback(async (
    reportType:  ReportType,
    format:      ReportFormat,
    uiKey:       string,
    snapshotId?: string,
  ) => {
    if (!activeBusiness?.business_id) return;
    setGeneratingKey(uiKey);
    setGenError(null);
    try {
      const res = await generateReport(activeBusiness.business_id, reportType, format, snapshotId);
      triggerDownload(res.download_url, res.file_name.split("/").pop() ?? "report");
    } catch (err: any) {
      setGenError(err?.message ?? "Report generation failed. Please try again.");
    } finally {
      setGeneratingKey(null);
    }
  }, [activeBusiness?.business_id]);

  // Derive last_generated from latest snapshot
  const lastGenerated = snapshots[0] ? formatTakenAt(snapshots[0].taken_at) : null;

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

        <div className="cl-overflow-x-auto" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden", minWidth: "fit-content" }}>
            {DATE_RANGES.map((r, i) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  padding: "6px 12px", fontSize: 12, fontWeight: 600, border: "none",
                  borderRight: i < DATE_RANGES.length - 1 ? "1px solid #E5E7EB" : "none",
                  background: dateRange === r ? "#0A2540" : "white",
                  color: dateRange === r ? "white" : "#6B7280",
                  cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GENERATION ERROR ── */}
      {genError && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {genError}
        </div>
      )}

      {/* ── REPORT CARDS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {REPORT_DEFS.map((report, idx) => (
          <ReportCard
            key={`${report._label ?? report.id}_${idx}`}
            report={report}
            lastGenerated={lastGenerated}
            generatingKey={generatingKey}
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
              onClick={loadSnapshots}
              disabled={snapLoading}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: snapLoading ? "not-allowed" : "pointer" }}
            >
              {snapLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Refresh
            </button>
          }
        />

        <div style={{ padding: "4px 0 8px" }}>

          {/* Error state */}
          {snapError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 24px", padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {snapError}
            </div>
          )}

          {/* Loading skeleton */}
          {snapLoading && !snapError && (
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 44, borderRadius: 8, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!snapLoading && !snapError && snapshots.length === 0 && (
            <div style={{ padding: "32px 24px", textAlign: "center" as const, color: "#9CA3AF", fontSize: 13 }}>
              No snapshots yet. Run the pipeline to generate your first financial identity snapshot.
            </div>
          )}

          {/* ── DESKTOP TABLE ── */}
          {!snapLoading && snapshots.length > 0 && (
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
                  {snapshots.map((snap, i) => {
                    const rowKey = `${snap.snapshot_id}_pdf`;
                    const busy   = generatingKey === rowKey;
                    const score  = snap.composite_score ?? 0;
                    const scoreCol = score >= 730 ? "#10B981" : score >= 650 ? "#F59E0B" : "#EF4444";
                    const riskLabel = snap.risk_level
                      ? snap.risk_level.charAt(0).toUpperCase() + snap.risk_level.slice(1) + " Risk"
                      : "—";
                    const riskVariant = snap.risk_level === "low" ? "success" : snap.risk_level === "medium" ? "warning" : "destructive";
                    return (
                      <div
                        key={snap.snapshot_id}
                        style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 140px", gap: 14, padding: "13px 24px", borderBottom: i < snapshots.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: "#0A2540", marginBottom: 2 }}>
                            {formatTakenAt(snap.taken_at)}
                            {i === 0 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>(latest)</span>}
                          </p>
                          <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{snap.pipeline_run_id}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: scoreCol }}>
                          {snap.composite_score ?? "—"}
                        </p>
                        <Badge variant={riskVariant as any} style={{ width: "fit-content", fontSize: 10 }}>{riskLabel}</Badge>
                        <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
                          {snap.data_quality_score != null ? `${snap.data_quality_score}%` : "—"}
                        </p>
                        <button
                          onClick={() => !busy && handleGenerate("financial_identity", "pdf", rowKey, snap.snapshot_id)}
                          disabled={busy}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const, opacity: busy ? 0.6 : 1 }}
                          onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; } }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
                        >
                          {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                          {busy ? "Generating…" : "Download PDF"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE CARDS ── */}
          {!snapLoading && snapshots.length > 0 && (
            <div className="bp-op-mobile">
              {snapshots.map((snap, i) => {
                const rowKey = `mob_${snap.snapshot_id}_pdf`;
                const busy   = generatingKey === rowKey;
                const score  = snap.composite_score ?? 0;
                const scoreCol = score >= 730 ? "#10B981" : score >= 650 ? "#F59E0B" : "#EF4444";
                const riskLabel = snap.risk_level
                  ? snap.risk_level.charAt(0).toUpperCase() + snap.risk_level.slice(1) + " Risk"
                  : "—";
                const riskVariant = snap.risk_level === "low" ? "success" : snap.risk_level === "medium" ? "warning" : "destructive";
                return (
                  <div key={snap.snapshot_id} style={{ padding: "14px 16px", borderBottom: i < snapshots.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: "#0A2540", marginBottom: 2 }}>
                        {formatTakenAt(snap.taken_at)}
                        {i === 0 && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 6 }}>(latest)</span>}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{snap.pipeline_run_id}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" as const }}>
                      <p style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: scoreCol }}>
                        {snap.composite_score ?? "—"}
                      </p>
                      <Badge variant={riskVariant as any} style={{ fontSize: 10 }}>{riskLabel}</Badge>
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
                        Quality: {snap.data_quality_score != null ? `${snap.data_quality_score}%` : "—"}
                      </span>
                    </div>
                    <button
                      onClick={() => !busy && handleGenerate("financial_identity", "pdf", rowKey, snap.snapshot_id)}
                      disabled={busy}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: busy ? "not-allowed" : "pointer" }}
                    >
                      {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                      {busy ? "Generating…" : "Download PDF"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
