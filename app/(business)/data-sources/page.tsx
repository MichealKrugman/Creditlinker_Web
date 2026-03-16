"use client";

import React, { useState } from "react";
import {
  Plus, RefreshCw, Trash2, MoreHorizontal, CheckCircle2,
  AlertCircle, Upload, FileText, Link2, Building2,
  ChevronRight, X, Loader2, BookOpen, ClipboardList,
  CheckCircle, XCircle, Clock, Activity, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
const LINKED_ACCOUNTS = [
  {
    account_id: "acc_001",
    bank_name: "Zenith Bank",
    account_number_masked: "****4821",
    account_type: "Current",
    currency: "NGN",
    is_primary: true,
    source: "mono",
    last_synced: "Today, 09:14",
    sync_status: "synced" as const,
    date_added: "Jan 15, 2023",
    tx_count: 842,
  },
  {
    account_id: "acc_002",
    bank_name: "GTBank",
    account_number_masked: "****0034",
    account_type: "Savings",
    currency: "NGN",
    is_primary: false,
    source: "mono",
    last_synced: "Today, 09:14",
    sync_status: "synced" as const,
    date_added: "Mar 8, 2023",
    tx_count: 391,
  },
];

const STATEMENT_UPLOADS = [
  {
    upload_id: "upl_001",
    filename: "zenith_statement_jan_dec_2023.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploaded_at: "Dec 20, 2024",
    records_parsed: 312,
    status: "processed" as const,
  },
  {
    upload_id: "upl_002",
    filename: "gtbank_export_q3_2024.csv",
    type: "csv",
    size: "148 KB",
    uploaded_at: "Oct 5, 2024",
    records_parsed: 89,
    status: "processed" as const,
  },
  {
    upload_id: "upl_003",
    filename: "gtbank_export_q4_2024.csv",
    type: "csv",
    size: "201 KB",
    uploaded_at: "Dec 27, 2024",
    records_parsed: 0,
    status: "processing" as const,
  },
];

const LEDGER_UPLOADS = [
  {
    upload_id: "led_001",
    filename: "aduke_bakeries_general_ledger_2023.csv",
    ledger_type: "General Ledger",
    size: "1.1 MB",
    uploaded_at: "Dec 20, 2024",
    records_parsed: 1840,
    period: "Jan 2023 – Dec 2023",
    status: "processed" as const,
  },
  {
    upload_id: "led_002",
    filename: "trial_balance_q3_2024.csv",
    ledger_type: "Trial Balance",
    size: "88 KB",
    uploaded_at: "Oct 5, 2024",
    records_parsed: 204,
    period: "Jul – Sep 2024",
    status: "processed" as const,
  },
];

/* Pipeline logs — shape matches ObservabilityRecord */
const PIPELINE_LOG = {
  pipeline_run_id: "run_7x9a2k",
  status: "completed",
  stage_reached: "financial_identity_snapshot",
  duration_ms: 4820,
  raw_transaction_count: 1233,
  normalization_confidence_avg: 0.94,
  data_quality_score: 91,
  active_risk_flag_count: 1,
  warnings_count: 2,
  errors_count: 0,
  recorded_at: "Today at 09:14",
  stages: [
    { name: "Data Ingestion",             status: "ok",      duration_ms: 620,  note: "1,233 raw transactions ingested across 2 accounts" },
    { name: "Normalisation",              status: "ok",      duration_ms: 1140, note: "94% average confidence · 12 transactions flagged for review" },
    { name: "Ledger Reconciliation",      status: "ok",      duration_ms: 680,  note: "General ledger reconciled against bank transactions" },
    { name: "Enrichment",                 status: "warning", duration_ms: 540,  note: "2 counterparty clusters could not be resolved" },
    { name: "Feature Generation",         status: "ok",      duration_ms: 720,  note: "48 financial features computed and stored" },
    { name: "Dimensional Scoring",        status: "ok",      duration_ms: 390,  note: "6 dimensions scored · Overall: 742" },
    { name: "Risk Detection",             status: "warning", duration_ms: 310,  note: "1 active risk flag: concentration risk detected" },
    { name: "Identity Snapshot",          status: "ok",      duration_ms: 420,  note: "Financial identity snapshot created and versioned" },
  ],
};

type SyncStatus   = "synced" | "error" | "syncing";
type UploadStatus = "processed" | "processing" | "failed";

const LEDGER_TYPES = [
  "General Ledger",
  "Trial Balance",
  "Profit & Loss Statement",
  "Balance Sheet",
  "Chart of Accounts",
  "Cash Flow Statement",
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function syncBadge(status: SyncStatus) {
  return {
    synced:  { variant: "success"     as const, label: "Synced",   icon: <CheckCircle2 size={11} /> },
    error:   { variant: "destructive" as const, label: "Error",    icon: <AlertCircle  size={11} /> },
    syncing: { variant: "secondary"   as const, label: "Syncing…", icon: <Loader2 size={11} className="animate-spin" /> },
  }[status];
}

function uploadBadge(status: UploadStatus) {
  return {
    processed:  { variant: "success"     as const, label: "Processed"  },
    processing: { variant: "secondary"   as const, label: "Processing" },
    failed:     { variant: "destructive" as const, label: "Failed"     },
  }[status];
}

function stageIcon(status: string) {
  if (status === "ok")      return <CheckCircle size={14} style={{ color: "#10B981" }} />;
  if (status === "warning") return <AlertCircle size={14} style={{ color: "#F59E0B" }} />;
  if (status === "error")   return <XCircle     size={14} style={{ color: "#EF4444" }} />;
  return <Clock size={14} style={{ color: "#9CA3AF" }} />;
}

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 0", gap: 12 }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: sub ? 3 : 0 }}>
          {title}
        </p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function UploadTableHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 100px 90px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}>
      {cols.map((h) => (
        <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
          {h}
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DROP ZONE (shared)
───────────────────────────────────────────────────────── */
function DropZone({
  accept, inputId, file, onFile, label,
}: {
  accept: string; inputId: string;
  file: File | null; onFile: (f: File) => void; label: string;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => document.getElementById(inputId)?.click()}
      style={{
        border: `2px dashed ${dragging ? "#0A2540" : file ? "#10B981" : "#E5E7EB"}`,
        borderRadius: 12, padding: "28px 20px", textAlign: "center" as const,
        cursor: "pointer",
        background: dragging ? "#F9FAFB" : file ? "#F0FDF4" : "white",
        transition: "all 0.15s", marginBottom: 16,
      }}
    >
      <input id={inputId} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <>
          <CheckCircle2 size={26} style={{ color: "#10B981", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{file.name}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
        </>
      ) : (
        <>
          <Upload size={26} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>{label}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>or click to browse</p>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONNECT BANK MODAL
───────────────────────────────────────────────────────── */
function ConnectModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleConnect = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    // TODO: POST /business/mono/initiate → open mono_link_url in popup
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Connect a bank account</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Powered by Mono</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Link2 size={15} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 3 }}>Secure open banking via Mono</p>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>Your credentials are never stored. Mono connects directly to your bank and shares only transaction data with Creditlinker.</p>
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Supported banks</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
            {["Zenith Bank", "GTBank", "Access Bank", "UBA", "First Bank", "Stanbic IBTC"].map((bank) => (
              <div key={bank} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#0A2540" }}>
                  {bank.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>{bank}</span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={handleConnect} disabled={loading} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Launching Mono Link…</> : <><Building2 size={15} /> Open Mono Link</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STATEMENT UPLOAD MODAL
───────────────────────────────────────────────────────── */
function StatementModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab]       = useState<"pdf" | "csv">("pdf");
  const [file, setFile]     = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    // TODO: POST /business/upload/pdf or /business/upload/csv
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Upload bank statement</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1.5px solid #E5E7EB", borderRadius: 9, overflow: "hidden", marginBottom: 20 }}>
            {(["pdf", "csv"] as const).map((t, i) => (
              <button key={t} onClick={() => { setTab(t); setFile(null); }}
                style={{ height: 38, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderRight: i === 0 ? "1.5px solid #E5E7EB" : "none", background: tab === t ? "#0A2540" : "white", color: tab === t ? "white" : "#6B7280", transition: "all 0.15s", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                {t.toUpperCase()} Statement
              </button>
            ))}
          </div>
          <DropZone
            accept={tab === "pdf" ? ".pdf" : ".csv,.xlsx"}
            inputId="stmt-file"
            file={file} onFile={setFile}
            label={`Drop your ${tab.toUpperCase()} statement here`}
          />
          <Button variant="primary" size="lg" className="w-full" onClick={handleUpload} disabled={!file || loading} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Upload size={15} /> Upload Statement</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LEDGER COLUMN MAPPING
───────────────────────────────────────────────────────── */
const CREDITLINKER_FIELDS = [
  { key: "date",         label: "Date",             required: true,  description: "Transaction or entry date" },
  { key: "description",  label: "Description",       required: true,  description: "Narration, memo, or entry name" },
  { key: "amount",       label: "Amount",            required: false, description: "Single amount column (if not split)" },
  { key: "debit",        label: "Debit",             required: false, description: "Debit amount (if split from credit)" },
  { key: "credit",       label: "Credit",            required: false, description: "Credit amount (if split from debit)" },
  { key: "account_code", label: "Account Code",      required: false, description: "Chart of accounts code" },
  { key: "account_name", label: "Account Name",      required: false, description: "Account or category name" },
  { key: "balance",      label: "Running Balance",   required: false, description: "Balance after entry" },
  { key: "reference",    label: "Reference",         required: false, description: "Invoice or transaction reference" },
];

function parseCSVHeaders(content: string): { headers: string[]; preview: string[][] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], preview: [] };
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const preview = lines.slice(1, 4).map(line =>
    line.split(",").map(c => c.replace(/^"|"$/g, "").trim())
  );
  return { headers, preview };
}

/* ─────────────────────────────────────────────────────────
   LEDGER UPLOAD MODAL
───────────────────────────────────────────────────────── */
function LedgerModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]             = useState<1 | 2>(1);
  const [ledgerType, setLedgerType] = useState(LEDGER_TYPES[0]);
  const [file, setFile]             = useState<File | null>(null);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo,   setPeriodTo]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [csvHeaders,   setCsvHeaders]   = useState<string[]>([]);
  const [csvPreview,   setCsvPreview]   = useState<string[][]>([]);
  const [columnMap,    setColumnMap]    = useState<Record<string, string>>({});

  const handleFileSelected = (f: File) => {
    setFile(f);
    if (f.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { headers, preview } = parseCSVHeaders(content);
        setCsvHeaders(headers);
        setCsvPreview(preview);
        // Auto-detect obvious column names
        const autoMap: Record<string, string> = {};
        CREDITLINKER_FIELDS.forEach(field => {
          const match = headers.find(h =>
            h.toLowerCase().includes(field.key) ||
            (field.key === "description" && (h.toLowerCase().includes("narration") || h.toLowerCase().includes("memo") || h.toLowerCase().includes("detail"))) ||
            (field.key === "date" && h.toLowerCase().includes("date")) ||
            (field.key === "debit" && (h.toLowerCase().includes("dr") || h.toLowerCase() === "debit")) ||
            (field.key === "credit" && (h.toLowerCase().includes("cr") || h.toLowerCase() === "credit"))
          );
          if (match) autoMap[field.key] = match;
        });
        setColumnMap(autoMap);
      };
      reader.readAsText(f);
    }
  };

  const handleContinue = () => {
    if (!file) return;
    if (file.name.endsWith(".csv") && csvHeaders.length > 0) {
      setStep(2);
    } else {
      handleUpload();
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    // TODO: POST /partner/submit/submit_operational_data
    // Payload: { file, ledger_type, period_from, period_to, column_map }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: step === 2 ? 620 : 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" as const, transition: "max-width 0.2s" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>
              {step === 1 ? "Upload accounting ledger" : "Map your columns"}
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {step === 1 ? "CSV or Excel format · Required for full financial analysis" : `${file?.name} · Assign your columns to Creditlinker fields`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Step indicator */}
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ height: 3, width: s === step ? 20 : 10, borderRadius: 2, background: s === step ? "#0A2540" : "#E5E7EB", transition: "all 0.2s" }} />
              ))}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
          </div>
        </div>

        {/* ── STEP 2: COLUMN MAPPING ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", overflowX: "auto" as const }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>File preview (first 3 rows)</p>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11 }}>
                  <thead>
                    <tr>
                      {csvHeaders.map(h => (
                        <th key={h} style={{ padding: "5px 10px", textAlign: "left" as const, background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 700, whiteSpace: "nowrap" as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, ri) => (
                      <tr key={ri}>
                        {csvHeaders.map((_, ci) => (
                          <td key={ci} style={{ padding: "4px 10px", border: "1px solid #F3F4F6", color: "#6B7280", whiteSpace: "nowrap" as const, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mapping UI */}
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 12 }}>
                Column assignments
              </p>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Creditlinker field</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Your column</p>
                </div>
                {CREDITLINKER_FIELDS.map((field, i) => (
                  <div key={field.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 14px", alignItems: "center", borderBottom: i < CREDITLINKER_FIELDS.length - 1 ? "1px solid #F9FAFB" : "none", background: columnMap[field.key] ? "white" : field.required ? "#FFFBEB" : "white" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{field.label}</p>
                        {field.required && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "1px 5px", borderRadius: 4 }}>Required</span>
                        )}
                        {columnMap[field.key] && (
                          <CheckCircle2 size={11} style={{ color: "#10B981" }} />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{field.description}</p>
                    </div>
                    <select
                      value={columnMap[field.key] ?? ""}
                      onChange={e => setColumnMap(m => ({ ...m, [field.key]: e.target.value }))}
                      style={{
                        height: 34, padding: "0 10px", borderRadius: 7,
                        border: `1px solid ${columnMap[field.key] ? "#0A2540" : "#E5E7EB"}`,
                        fontSize: 12, color: columnMap[field.key] ? "#0A2540" : "#9CA3AF",
                        background: "white", outline: "none", cursor: "pointer",
                        fontWeight: columnMap[field.key] ? 600 : 400,
                      }}
                    >
                      <option value="">— Not mapped —</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, height: 44, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
              >
                ← Back
              </button>
              <Button
                variant="primary" className="flex-1"
                onClick={handleUpload} disabled={loading}
                style={{ flex: 2, height: 44, fontSize: 13, fontWeight: 700, borderRadius: 9 }}
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" /> Processing ledger…</>
                  : <><BookOpen size={13} /> Submit ledger with mapping</>
                }
              </Button>
            </div>
          </div>
        )}

        {step === 1 && <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Why this matters */}
          <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <BookOpen size={14} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
              Your accounting ledger enables revenue recognition, expense categorisation, and ledger reconciliation — unlocking a significantly more accurate financial identity.
            </p>
          </div>

          {/* Ledger type selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Ledger type
            </label>
            <div style={{ position: "relative" as const }}>
              <button
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 14, color: "#0A2540", cursor: "pointer", fontWeight: 500 }}
              >
                {ledgerType}
                <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
              </button>
              {showTypeMenu && (
                <div style={{ position: "absolute" as const, top: 48, left: 0, right: 0, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" }}>
                  {LEDGER_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setLedgerType(t); setShowTypeMenu(false); }}
                      style={{ display: "block", width: "100%", padding: "10px 14px", background: t === ledgerType ? "#F9FAFB" : "white", border: "none", borderBottom: "1px solid #F3F4F6", fontSize: 13, fontWeight: t === ledgerType ? 600 : 400, color: "#0A2540", cursor: "pointer", textAlign: "left" as const }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Period */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Period covered
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                type="month" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)}
                placeholder="From"
                style={{ height: 44, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }}
              />
              <input
                type="month" value={periodTo} onChange={e => setPeriodTo(e.target.value)}
                placeholder="To"
                style={{ height: 44, padding: "0 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none" }}
              />
            </div>
          </div>

          {/* File drop */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Ledger file
            </label>
            <DropZone
              accept=".csv,.xlsx,.xls"
              inputId="ledger-file"
              file={file} onFile={handleFileSelected}
              label="Drop your CSV or Excel ledger file here"
            />
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleContinue} disabled={!file || loading} style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
              : file?.name.endsWith(".csv")
              ? <>Continue — Map columns →</>
              : <><BookOpen size={15} /> Upload Ledger</>
            }
          </Button>
        </div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PIPELINE LOGS MODAL
───────────────────────────────────────────────────────── */
function PipelineLogsModal({ onClose }: { onClose: () => void }) {
  const log = PIPELINE_LOG;
  const successStages = log.stages.filter(s => s.status === "ok").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>Pipeline run log</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              Run ID: <span style={{ fontFamily: "monospace" }}>{log.pipeline_run_id}</span> · {log.recorded_at}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}><X size={16} /></button>
        </div>

        {/* Summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          {[
            { label: "Duration",        value: `${(log.duration_ms / 1000).toFixed(2)}s` },
            { label: "Transactions",    value: log.raw_transaction_count.toLocaleString() },
            { label: "Data quality",    value: `${log.data_quality_score}%` },
            { label: "Stages passed",   value: `${successStages}/${log.stages.length}` },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "14px 20px", borderRight: i < 3 ? "1px solid #F3F4F6" : "none" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Stage breakdown */}
        <div style={{ overflowY: "auto" as const, flex: 1 }}>
          {log.stages.map((stage, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "20px 1fr auto",
              gap: 14, padding: "14px 24px",
              borderBottom: i < log.stages.length - 1 ? "1px solid #F9FAFB" : "none",
              alignItems: "flex-start",
            }}>
              <div style={{ paddingTop: 1 }}>{stageIcon(stage.status)}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 3 }}>{stage.name}</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{stage.note}</p>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const, paddingTop: 2 }}>
                {stage.duration_ms}ms
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DataSourcesPage() {
  const [showConnect,      setShowConnect]      = useState(false);
  const [showStatement,    setShowStatement]    = useState(false);
  const [showLedger,       setShowLedger]       = useState(false);
  const [showPipelineLogs, setShowPipelineLogs] = useState(false);
  const [activeMenu,       setActiveMenu]       = useState<string | null>(null);
  const [syncingAccounts,  setSyncingAccounts]  = useState<Set<string>>(new Set());

  const handleSync = async (accountId: string) => {
    setSyncingAccounts(s => new Set(s).add(accountId));
    await new Promise(r => setTimeout(r, 2000));
    // TODO: POST /business/mono/initiate for this account_id, then poll for completion
    setSyncingAccounts(s => { const n = new Set(s); n.delete(accountId); return n; });
  };

  return (
    <>
      {showConnect      && <ConnectModal      onClose={() => setShowConnect(false)}      />}
      {showStatement    && <StatementModal    onClose={() => setShowStatement(false)}    />}
      {showLedger       && <LedgerModal       onClose={() => setShowLedger(false)}       />}
      {showPipelineLogs && <PipelineLogsModal onClose={() => setShowPipelineLogs(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
              Data Sources
            </h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              Bank accounts, statements, and accounting ledgers powering your financial identity.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="sm" onClick={() => setShowLedger(true)} style={{ gap: 6 }}>
              <BookOpen size={13} /> Upload Ledger
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowStatement(true)} style={{ gap: 6 }}>
              <Upload size={13} /> Upload Statement
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowConnect(true)} style={{ gap: 6 }}>
              <Plus size={13} /> Connect Bank
            </Button>
          </div>
        </div>

        {/* ── CONNECTED BANK ACCOUNTS ── */}
        <Card>
          <SectionHeader
            title="Connected Bank Accounts"
            sub="Linked via Mono open banking. Transactions sync automatically."
          />
          <div style={{ padding: "16px 0 8px" }}>
            {LINKED_ACCOUNTS.map((acc, i) => {
              const sync = syncBadge(acc.sync_status);
              return (
                <div key={acc.account_id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto auto 36px", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: i < LINKED_ACCOUNTS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0A2540" }}>
                    {acc.bank_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{acc.bank_name}</p>
                      {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 10, padding: "1px 6px" }}>Primary</Badge>}
                      <Badge variant={sync.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, padding: "1px 6px" }}>{sync.icon} {sync.label}</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{acc.account_type} · {acc.account_number_masked}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{acc.tx_count.toLocaleString()} transactions</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>Added {acc.date_added}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Last synced</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{acc.last_synced}</p>
                  </div>
                  <button
                    onClick={() => handleSync(acc.account_id)}
                    disabled={syncingAccounts.has(acc.account_id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: syncingAccounts.has(acc.account_id) ? "#9CA3AF" : "#6B7280", cursor: syncingAccounts.has(acc.account_id) ? "not-allowed" : "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const, opacity: syncingAccounts.has(acc.account_id) ? 0.7 : 1 }}
                    onMouseEnter={(e) => { if (!syncingAccounts.has(acc.account_id)) { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; } }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = syncingAccounts.has(acc.account_id) ? "#9CA3AF" : "#6B7280"; }}
                  >
                    {syncingAccounts.has(acc.account_id)
                      ? <><Loader2 size={11} className="animate-spin" /> Syncing…</>
                      : <><RefreshCw size={11} /> Sync</>
                    }
                  </button>
                  <div style={{ position: "relative" as const }}>
                    <button onClick={() => setActiveMenu(activeMenu === acc.account_id ? null : acc.account_id)}
                      style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", cursor: "pointer" }}>
                      <MoreHorizontal size={14} />
                    </button>
                    {activeMenu === acc.account_id && (
                      <div style={{ position: "absolute" as const, right: 0, top: 36, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
                        {!acc.is_primary && (
                          <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left" as const }}>
                            <CheckCircle2 size={13} /> Set as primary
                          </button>
                        )}
                        <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#EF4444", textAlign: "left" as const, borderTop: "1px solid #F3F4F6" }}>
                          <Trash2 size={13} /> Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6" }}>
            <button onClick={() => setShowConnect(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 16px", border: "2px dashed #E5E7EB", borderRadius: 10, background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#9CA3AF", transition: "all 0.15s", justifyContent: "center" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <Plus size={15} /> Connect another account
            </button>
          </div>
        </Card>

        {/* ── ACCOUNTING LEDGERS ── */}
        <Card>
          <SectionHeader
            title="Accounting Ledgers"
            sub="General ledgers, trial balances, and P&L statements. Required for full financial analysis."
            action={
              <Button variant="outline" size="sm" onClick={() => setShowLedger(true)} style={{ gap: 6 }}>
                <BookOpen size={12} /> Upload Ledger
              </Button>
            }
          />
          <div style={{ padding: "12px 0 8px" }}>
            <UploadTableHeader cols={["", "Filename", "Period", "Uploaded", "Records", "Status"]} />
            {LEDGER_UPLOADS.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center" as const }}>
                <ClipboardList size={28} style={{ color: "#D1D5DB", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>No ledgers uploaded yet</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 16 }}>
                  Upload your general ledger or trial balance to unlock revenue recognition, expense categorisation, and reconciliation.
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowLedger(true)} style={{ gap: 6 }}>
                  <BookOpen size={13} /> Upload your first ledger
                </Button>
              </div>
            ) : (
              LEDGER_UPLOADS.map((upload, i) => {
                const ub = uploadBadge(upload.status);
                return (
                  <div key={upload.upload_id}
                    style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 100px 90px 80px", padding: "13px 24px", borderBottom: i < LEDGER_UPLOADS.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", color: "#3B82F6" }}>
                      <BookOpen size={13} />
                    </div>
                    <div style={{ minWidth: 0, paddingRight: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>
                        {upload.filename}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{upload.ledger_type}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{upload.period}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{upload.uploaded_at}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}>{upload.records_parsed.toLocaleString()}</p>
                    <Badge variant={ub.variant} style={{ fontSize: 10 }}>{ub.label}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* ── BANK STATEMENTS ── */}
        <Card>
          <SectionHeader
            title="Uploaded Bank Statements"
            sub="PDF and CSV statements for accounts not connected via Mono."
            action={
              <Button variant="outline" size="sm" onClick={() => setShowStatement(true)} style={{ gap: 6 }}>
                <Upload size={12} /> Upload
              </Button>
            }
          />
          <div style={{ padding: "12px 0 8px" }}>
            <UploadTableHeader cols={["", "Filename", "Size", "Uploaded", "Transactions", "Status"]} />
            {STATEMENT_UPLOADS.map((upload, i) => {
              const ub = uploadBadge(upload.status);
              return (
                <div key={upload.upload_id}
                  style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 100px 90px 80px", padding: "13px 24px", borderBottom: i < STATEMENT_UPLOADS.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: upload.type === "pdf" ? "#FEF2F2" : "#ECFDF5", color: upload.type === "pdf" ? "#EF4444" : "#10B981" }}>
                    <FileText size={13} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16 }}>
                    {upload.filename}
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{upload.size}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{upload.uploaded_at}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: upload.status === "processed" ? "#0A2540" : "#9CA3AF" }}>
                    {upload.status === "processed" ? upload.records_parsed.toLocaleString() : "—"}
                  </p>
                  <Badge variant={ub.variant} style={{ fontSize: 10 }}>{ub.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── PIPELINE STATUS BAR ── */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={17} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
                All data sources up to date.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Last pipeline run: Today at 09:14 · 8 stages completed · 1,233 transactions · 2 warnings
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPipelineLogs(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", flexShrink: 0, whiteSpace: "nowrap" as const }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
          >
            <Activity size={13} /> View pipeline logs
          </button>
        </div>

      </div>
    </>
  );
}
