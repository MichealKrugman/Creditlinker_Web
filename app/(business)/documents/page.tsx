"use client";

import React, { useState } from "react";
import {
  Upload, FileText, CheckCircle2, Clock, AlertCircle,
  Trash2, Download, Eye, X, Loader2, Plus, ShieldCheck,
  File, FileBadge, BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";

/* ─────────────────────────────────────────────────────────
   TYPES & CONFIG
───────────────────────────────────────────────────────── */
type DocStatus = "verified" | "pending" | "rejected" | "uploaded";

interface DocumentCategory {
  id: string;
  label: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
  impact: string;
  documents: UploadedDoc[];
}

interface UploadedDoc {
  doc_id: string;
  filename: string;
  size: string;
  uploaded_at: string;
  status: DocStatus;
  rejection_reason?: string;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "incorporation",
    label: "Incorporation Documents",
    description: "CAC certificate, memorandum, articles of association.",
    required: true,
    icon: <FileBadge size={16} />,
    impact: "Required for identity verification",
    documents: [
      {
        doc_id: "doc_001",
        filename: "CAC_Certificate_Aduke_Bakeries.pdf",
        size: "1.2 MB",
        uploaded_at: "Dec 20, 2024",
        status: "verified",
      },
    ],
  },
  {
    id: "tax",
    label: "Tax Documents",
    description: "TIN certificate, tax clearance certificates, VAT registration.",
    required: true,
    icon: <FileText size={16} />,
    impact: "Strengthens identity trust score",
    documents: [
      {
        doc_id: "doc_002",
        filename: "TIN_Certificate_2024.pdf",
        size: "420 KB",
        uploaded_at: "Dec 20, 2024",
        status: "pending",
      },
    ],
  },
  {
    id: "financial_statements",
    label: "Audited Financial Statements",
    description: "Audited P&L, balance sheet, and cash flow statements.",
    required: false,
    icon: <BookOpen size={16} />,
    impact: "Significantly improves data quality score",
    documents: [],
  },
  {
    id: "ownership",
    label: "Ownership & Directors",
    description: "Director IDs, shareholding structure, beneficial owner declaration.",
    required: true,
    icon: <File size={16} />,
    impact: "Required for KYB verification",
    documents: [
      {
        doc_id: "doc_003",
        filename: "Director_ID_Ada_Okonkwo.pdf",
        size: "680 KB",
        uploaded_at: "Dec 21, 2024",
        status: "rejected",
        rejection_reason: "Document is expired. Please upload a valid government-issued ID.",
      },
    ],
  },
  {
    id: "contracts",
    label: "Client Contracts",
    description: "Active client agreements validating recurring revenue claims.",
    required: false,
    icon: <FileText size={16} />,
    impact: "Validates recurring revenue dimension",
    documents: [],
  },
  {
    id: "other",
    label: "Other Supporting Documents",
    description: "Any other document relevant to your financial identity.",
    required: false,
    icon: <File size={16} />,
    impact: "Supplementary evidence",
    documents: [],
  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function statusConfig(status: DocStatus) {
  return {
    verified: { variant: "success"     as const, label: "Verified",  icon: <CheckCircle2 size={11} /> },
    pending:  { variant: "secondary"   as const, label: "Under review", icon: <Clock size={11} /> },
    rejected: { variant: "destructive" as const, label: "Rejected",  icon: <AlertCircle size={11} /> },
    uploaded: { variant: "outline"     as const, label: "Uploaded",  icon: <CheckCircle2 size={11} /> },
  }[status];
}

const totalDocs     = DOCUMENT_CATEGORIES.reduce((s, c) => s + c.documents.length, 0);
const verifiedDocs  = DOCUMENT_CATEGORIES.reduce((s, c) => s + c.documents.filter(d => d.status === "verified").length, 0);
const rejectedDocs  = DOCUMENT_CATEGORIES.reduce((s, c) => s + c.documents.filter(d => d.status === "rejected").length, 0);
const requiredMissing = DOCUMENT_CATEGORIES.filter(c => c.required && c.documents.length === 0).length;

/* ─────────────────────────────────────────────────────────
   UPLOAD MODAL
───────────────────────────────────────────────────────── */
function UploadModal({
  category,
  onClose,
}: {
  category: DocumentCategory;
  onClose: () => void;
}) {
  const [files,   setFiles]   = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles(prev => [...prev, ...Array.from(incoming)]);
  };

  const removeFile = (i: number) =>
    setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    // TODO: POST /documents/upload with category + files
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em" }}>
              Upload documents
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{category.label}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Impact note */}
          <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <ShieldCheck size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>{category.impact}</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => document.getElementById("doc-upload-input")?.click()}
            style={{ border: `2px dashed ${dragging ? "#0A2540" : "#E5E7EB"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" as const, cursor: "pointer", background: dragging ? "#F9FAFB" : "white", transition: "all 0.15s" }}
          >
            <input
              id="doc-upload-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <Upload size={26} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>Drop files here or click to browse</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>PDF, JPG, PNG · Max 10MB per file</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9 }}>
                  <FileText size={14} style={{ color: "#6B7280", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
          <Button
            variant="primary" size="lg" className="w-full"
            onClick={handleUpload} disabled={!files.length || loading}
            style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 10 }}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
              : <><Upload size={15} /> Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : "documents"}</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DOCUMENT ROW
───────────────────────────────────────────────────────── */
function ActionButtons({ doc, onDeleteRequest }: { doc: UploadedDoc; onDeleteRequest: (doc: UploadedDoc) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}>
        <Download size={12} />
      </button>
      <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}>
        <Eye size={12} />
      </button>
      {doc.status !== "verified" && (
        <button
          onClick={() => onDeleteRequest(doc)}
          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function DocumentRow({ doc, onDeleteRequest }: { doc: UploadedDoc; onDeleteRequest: (doc: UploadedDoc) => void }) {
  const sc = statusConfig(doc.status);

  return (
    <div>
      {/* ── DESKTOP ROW ── */}
      <div className="doc-desktop-row"
        style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", alignItems: "center", gap: 14, padding: "12px 24px", transition: "background 0.1s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
          <FileText size={13} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>
          {doc.filename}
        </p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.size}</p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.uploaded_at}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
            {sc.icon} {sc.label}
          </Badge>
          <ActionButtons doc={doc} onDeleteRequest={onDeleteRequest} />
        </div>
      </div>

      {/* ── MOBILE CARD ── */}
      <div className="doc-mobile-row" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
            <FileText size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginBottom: 3 }}>
              {doc.filename}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.size} · {doc.uploaded_at}</p>
          </div>
          <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, flexShrink: 0 }}>
            {sc.icon} {sc.label}
          </Badge>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ActionButtons doc={doc} onDeleteRequest={onDeleteRequest} />
        </div>
      </div>

      {/* Rejection reason — shown on both ─ full width */}
      {doc.status === "rejected" && doc.rejection_reason && (
        <div style={{ margin: "0 16px 12px", display: "flex", gap: 8, padding: "10px 14px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8 }}>
          <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>{doc.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────────────────────── */
function CategoryCard({
  cat,
  onUpload,
  onDeleteRequest,
}: {
  cat: DocumentCategory;
  onUpload: () => void;
  onDeleteRequest: (doc: UploadedDoc) => void;
}) {
  const allVerified = cat.documents.length > 0 && cat.documents.every(d => d.status === "verified");
  const hasRejected = cat.documents.some(d => d.status === "rejected");
  const isEmpty     = cat.documents.length === 0;

  return (
    <div style={{ background: "white", border: `1px solid ${hasRejected ? "rgba(239,68,68,0.25)" : "#E5E7EB"}`, borderRadius: 14, overflow: "hidden" }}>

      {/* Category header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: isEmpty ? "none" : "1px solid #F3F4F6", gap: 12, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: allVerified ? "#ECFDF5" : hasRejected ? "#FEF2F2" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: allVerified ? "#10B981" : hasRejected ? "#EF4444" : "#6B7280",
          }}>
            {cat.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
                {cat.label}
              </p>
              {cat.required && (
                <Badge variant="outline" style={{ fontSize: 9, padding: "1px 6px" }}>Required</Badge>
              )}
              {allVerified && (
                <Badge variant="success" style={{ fontSize: 9, padding: "1px 6px" }}>Complete</Badge>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{cat.description}</p>
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              <span style={{ color: "#00A8CC", fontWeight: 600 }}>↑ </span>{cat.impact}
            </p>
          </div>
        </div>

        <button
          onClick={onUpload}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 600, color: "#0A2540", cursor: "pointer", flexShrink: 0, transition: "all 0.12s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.background = "white"; }}
        >
          <Plus size={12} /> Upload
        </button>
      </div>

      {/* Documents list */}
      {cat.documents.length > 0 && (
        <div>
          {/* Desktop header — hidden on mobile */}
          <div className="doc-desktop-row" style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", gap: 14, padding: "6px 24px 8px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
            {["", "Filename", "Size", "Uploaded", "Status"].map((h) => (
              <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</p>
            ))}
          </div>
          {cat.documents.map((doc) => (
            <DocumentRow key={doc.doc_id} doc={doc} onDeleteRequest={onDeleteRequest} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div style={{ padding: "16px 20px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
          <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
            No documents uploaded yet.{cat.required ? " Required for verification." : ""}
          </p>
          <button
            onClick={onUpload}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "2px dashed #E5E7EB", background: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const, flexShrink: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
          >
            <Upload size={13} /> Upload now
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UploadedDoc | null>(null);

  return (
    <>
      {activeCategory && (
        <UploadModal
          category={activeCategory}
          onClose={() => setActiveCategory(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
              Documents
            </h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              {totalDocs} documents uploaded · {verifiedDocs} verified
              {rejectedDocs > 0 && <span style={{ color: "#EF4444" }}> · {rejectedDocs} need attention</span>}
              {requiredMissing > 0 && <span style={{ color: "#F59E0B" }}> · {requiredMissing} required categor{requiredMissing > 1 ? "ies" : "y"} missing</span>}
            </p>
          </div>
        </div>

        {/* ── ATTENTION BANNER ── */}
        {rejectedDocs > 0 && (
          <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>
                {rejectedDocs} document{rejectedDocs > 1 ? "s" : ""} rejected
              </p>
              <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5 }}>
                Review the rejection reasons below and re-upload the correct documents to continue verification.
              </p>
            </div>
          </div>
        )}

        {/* ── COMPLETENESS SUMMARY ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { label: "Total uploaded",  value: totalDocs,               color: "#0A2540" },
            { label: "Verified",        value: verifiedDocs,            color: "#10B981" },
            { label: "Under review",    value: DOCUMENT_CATEGORIES.reduce((s, c) => s + c.documents.filter(d => d.status === "pending").length, 0), color: "#F59E0B" },
            { label: "Rejected",        value: rejectedDocs,            color: "#EF4444" },
          ].map((s) => (
            <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>
                {s.label}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: s.color, letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── DOCUMENT CATEGORIES ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              onUpload={() => setActiveCategory(cat)}
              onDeleteRequest={(doc) => setPendingDelete(doc)}
            />
          ))}
        </div>

        {/* ── VERIFICATION INFO ── */}
        <div style={{ background: "#0A2540", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#00D4FF" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.02em", marginBottom: 3 }}>
                Documents are reviewed within 1–2 business days.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Verified documents strengthen your financial identity and improve your data quality score.
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
