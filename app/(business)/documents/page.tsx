"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Upload, FileText, CheckCircle2, Clock, AlertCircle,
  Trash2, Download, Eye, X, Loader2, Plus, ShieldCheck,
  File, FileBadge, BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Permitted file types with their MIME types and accepted extensions.
 * This is a UX-layer gate. Real validation is done server-side in the
 * upload-document edge function via magic byte inspection.
 */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ACCEPT_ATTR =
  ".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const VALID_CATEGORIES = new Set([
  "incorporation",
  "tax",
  "financial_statements",
  "ownership",
  "contracts",
  "other",
] as const);

type CategoryId = "incorporation" | "tax" | "financial_statements" | "ownership" | "contracts" | "other";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

type DocStatus = "verified" | "pending" | "rejected";

interface UploadedDoc {
  doc_id:           string;
  filename:         string;
  file_path:        string;   // needed for signed URL generation
  file_size_bytes:  number;
  uploaded_at:      string;
  status:           DocStatus;
  rejection_reason?: string;
}

interface DocumentCategory {
  id:          CategoryId;
  label:       string;
  description: string;
  required:    boolean;
  icon:        React.ReactNode;
  impact:      string;
  documents:   UploadedDoc[];
}

/* ─────────────────────────────────────────────────────────
   STATIC CATEGORY CONFIG
   (labels/icons/descriptions — DB provides the documents)
───────────────────────────────────────────────────────── */

const CATEGORY_CONFIG: Omit<DocumentCategory, "documents">[] = [
  {
    id: "incorporation",
    label: "Incorporation Documents",
    description: "CAC certificate, memorandum, articles of association.",
    required: true,
    icon: <FileBadge size={16} />,
    impact: "Required for identity verification",
  },
  {
    id: "tax",
    label: "Tax Documents",
    description: "TIN certificate, tax clearance certificates, VAT registration.",
    required: true,
    icon: <FileText size={16} />,
    impact: "Strengthens identity trust score",
  },
  {
    id: "financial_statements",
    label: "Audited Financial Statements",
    description: "Audited P&L, balance sheet, and cash flow statements.",
    required: false,
    icon: <BookOpen size={16} />,
    impact: "Significantly improves data quality score",
  },
  {
    id: "ownership",
    label: "Ownership & Directors",
    description: "Director IDs, shareholding structure, beneficial owner declaration.",
    required: true,
    icon: <File size={16} />,
    impact: "Required for KYB verification",
  },
  {
    id: "contracts",
    label: "Client Contracts",
    description: "Active client agreements validating recurring revenue claims.",
    required: false,
    icon: <FileText size={16} />,
    impact: "Validates recurring revenue dimension",
  },
  {
    id: "other",
    label: "Other Supporting Documents",
    description: "Any other document relevant to your financial identity.",
    required: false,
    icon: <File size={16} />,
    impact: "Supplementary evidence",
  },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function statusConfig(status: DocStatus) {
  return {
    verified: { variant: "success"     as const, label: "Verified",      icon: <CheckCircle2 size={11} /> },
    pending:  { variant: "secondary"   as const, label: "Under review",  icon: <Clock size={11} /> },
    rejected: { variant: "destructive" as const, label: "Rejected",      icon: <AlertCircle size={11} /> },
  }[status];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Strips characters that can be used for path traversal or injection.
 * This is the client-side copy of the server-side sanitizer in the edge function.
 * The server always re-sanitises independently — this is a UX gate only.
 */
function sanitizeFilename(name: string): string {
  let safe = name.replace(/[/\\]/g, "_").replace(/\0/g, "");
  safe = safe.replace(/[?%*:|"<>$`!;{}[\]]/g, "_");
  safe = safe.replace(/^\.+/, "_");
  const lastDot = safe.lastIndexOf(".");
  if (lastDot > 0) {
    const base = safe.slice(0, lastDot).replace(/\./g, "_");
    safe = base + safe.slice(lastDot);
  }
  safe = safe.trim().slice(0, 200);
  return safe || "document";
}

/**
 * Client-side file validation (UX gate — not a security boundary).
 * Returns an error string or null.
 */
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `File is too large (max 10 MB). This file is ${fmtSize(file.size)}.`;
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "File type not permitted. Allowed: PDF, JPEG, PNG, DOCX, XLSX.";
  }
  return null;
}

/* ─────────────────────────────────────────────────────────
   UPLOAD MODAL
───────────────────────────────────────────────────────── */

function UploadModal({
  category,
  businessId,
  onClose,
  onSuccess,
}: {
  category:   DocumentCategory;
  businessId: string;
  onClose:    () => void;
  onSuccess:  (doc: UploadedDoc) => void;
}) {
  const [files,    setFiles]    = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid: File[] = [];
    const errors: string[] = [];
    Array.from(incoming).forEach((f) => {
      const err = validateFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else valid.push(f);
    });
    if (errors.length) setError(errors.join("\n"));
    else setError(null);
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please refresh and try again.");
      setLoading(false);
      return;
    }
    const authHeader = `Bearer ${session.access_token}`;

    const uploadedDocs: UploadedDoc[] = [];

    for (const file of files) {
      const documentId   = crypto.randomUUID();
      const safeFilename = sanitizeFilename(file.name);
      const storagePath  = `${businessId}/${category.id}/${documentId}/${safeFilename}`;

      // 1. Upload to Storage
      const { error: storageError } = await supabase.storage
        .from("business-documents")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert:      false,
        });

      if (storageError) {
        setError(`Failed to upload ${safeFilename}: ${storageError.message}`);
        setLoading(false);
        return;
      }

      // 2. Call edge function to validate + register
      let efRes: Response;
      try {
        efRes = await fetch(`${supabaseUrl}/functions/v1/upload-document`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            business_id:     businessId,
            category:        category.id,
            document_id:     documentId,
            filename:        safeFilename,
            file_size_bytes: file.size,
            mime_type:       file.type,
          }),
        });
      } catch (fetchErr) {
        // Edge function unreachable — clean up the orphaned file
        await supabase.storage.from("business-documents").remove([storagePath]);
        setError(`Network error while registering ${safeFilename}. File removed.`);
        setLoading(false);
        return;
      }

      if (!efRes.ok) {
        const errBody = await efRes.json().catch(() => ({}));
        // Edge function rejected the file (e.g. magic bytes mismatch) —
        // it deletes the file itself in that case, so we don't need to.
        setError(errBody.error ?? `Registration failed for ${safeFilename}.`);
        setLoading(false);
        return;
      }

      uploadedDocs.push({
        doc_id:          documentId,
        filename:        safeFilename,
        file_path:       storagePath,
        file_size_bytes: file.size,
        uploaded_at:     new Date().toISOString(),
        status:          "pending",
      });
    }

    setLoading(false);
    uploadedDocs.forEach(onSuccess);
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

          {/* Allowed types note */}
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
            Accepted: PDF, JPEG, PNG, DOCX, XLSX · Max 10 MB per file
          </p>

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
              accept={ACCEPT_ATTR}
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <Upload size={26} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>Drop files here or click to browse</p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>PDF, JPEG, PNG, DOCX, XLSX · Max 10 MB</p>
          </div>

          {/* Validation error */}
          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
              <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6, whiteSpace: "pre-line" as const }}>{error}</p>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9 }}>
                  <FileText size={14} style={{ color: "#6B7280", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtSize(f.size)}</p>
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
   ACTION BUTTONS
───────────────────────────────────────────────────────── */

function ActionButtons({
  doc,
  onDeleteRequest,
}: {
  doc:             UploadedDoc;
  onDeleteRequest: (doc: UploadedDoc) => void;
}) {
  const [signingDownload, setSigningDownload] = useState(false);
  const [signingPreview,  setSigningPreview]  = useState(false);

  const getSignedUrl = async (): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("business-documents")
      .createSignedUrl(doc.file_path, 120); // 2-minute TTL
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  const handleDownload = async () => {
    setSigningDownload(true);
    const url = await getSignedUrl();
    setSigningDownload(false);
    if (!url) return;
    // Force download — do not rely on browser content sniffing to open the file
    const a = document.createElement("a");
    a.href     = url;
    a.download = doc.filename;
    a.rel      = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = async () => {
    setSigningPreview(true);
    const url = await getSignedUrl();
    setSigningPreview(false);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={handleDownload}
        disabled={signingDownload}
        title="Download"
        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: signingDownload ? "not-allowed" : "pointer", color: "#9CA3AF" }}
      >
        {signingDownload ? <Loader2 size={11} className="animate-spin" /> : <Download size={12} />}
      </button>
      <button
        onClick={handlePreview}
        disabled={signingPreview}
        title="Preview"
        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: signingPreview ? "not-allowed" : "pointer", color: "#9CA3AF" }}
      >
        {signingPreview ? <Loader2 size={11} className="animate-spin" /> : <Eye size={12} />}
      </button>
      {doc.status !== "verified" && (
        <button
          onClick={() => onDeleteRequest(doc)}
          title="Delete"
          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DOCUMENT ROW
───────────────────────────────────────────────────────── */

function DocumentRow({
  doc,
  onDeleteRequest,
}: {
  doc:             UploadedDoc;
  onDeleteRequest: (doc: UploadedDoc) => void;
}) {
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
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtSize(doc.file_size_bytes)}</p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(doc.uploaded_at)}</p>
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
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtSize(doc.file_size_bytes)} · {fmtDate(doc.uploaded_at)}</p>
          </div>
          <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, flexShrink: 0 }}>
            {sc.icon} {sc.label}
          </Badge>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ActionButtons doc={doc} onDeleteRequest={onDeleteRequest} />
        </div>
      </div>

      {/* Rejection reason */}
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
  cat:             DocumentCategory;
  onUpload:        () => void;
  onDeleteRequest: (doc: UploadedDoc) => void;
}) {
  const allVerified = cat.documents.length > 0 && cat.documents.every((d) => d.status === "verified");
  const hasRejected = cat.documents.some((d) => d.status === "rejected");
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
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();

  const [rawDocs,       setRawDocs]       = useState<UploadedDoc[]>([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(null);
  const [pendingDelete,  setPendingDelete]  = useState<UploadedDoc | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [deleteError,    setDeleteError]    = useState<string | null>(null);

  /* ── Fetch documents from DB ── */
  const loadDocs = useCallback(async () => {
    if (!activeBusiness) return;
    setPageLoading(true);

    const { data, error } = await supabase
      .from("business_documents")
      .select("document_id, category, filename, file_path, file_size_bytes, uploaded_at, status, rejection_reason")
      .eq("business_id", activeBusiness.business_id)
      .order("uploaded_at", { ascending: false });

    if (!error && data) {
      setRawDocs(
        data.map((row: any): UploadedDoc => ({
          doc_id:          row.document_id,
          filename:        row.filename,
          file_path:       row.file_path,
          file_size_bytes: row.file_size_bytes ?? 0,
          uploaded_at:     row.uploaded_at,
          status:          row.status as DocStatus,
          rejection_reason: row.rejection_reason ?? undefined,
        }))
      );
    }

    setPageLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    if (!bizLoading && activeBusiness) loadDocs();
  }, [activeBusiness, bizLoading, loadDocs]);

  /* ── Merge DB docs into category config ── */
  const categories = useMemo<DocumentCategory[]>(() => {
    // Build a map: category_id → UploadedDoc[]
    const docMap = new Map<string, UploadedDoc[]>();
    rawDocs.forEach((doc) => {
      // We need the category stored in the DB row.
      // We stored it in file_path: {business_id}/{category}/{document_id}/{filename}
      // Parse it back out as the source of truth.
      const parts = doc.file_path.split("/");
      const categoryFromPath = parts[1] as CategoryId;
      if (!VALID_CATEGORIES.has(categoryFromPath as any)) return;
      if (!docMap.has(categoryFromPath)) docMap.set(categoryFromPath, []);
      docMap.get(categoryFromPath)!.push(doc);
    });

    return CATEGORY_CONFIG.map((cfg) => ({
      ...cfg,
      documents: docMap.get(cfg.id) ?? [],
    }));
  }, [rawDocs]);

  /* ── Stats (derived from live data) ── */
  const totalDocs      = useMemo(() => rawDocs.length, [rawDocs]);
  const verifiedDocs   = useMemo(() => rawDocs.filter((d) => d.status === "verified").length, [rawDocs]);
  const rejectedDocs   = useMemo(() => rawDocs.filter((d) => d.status === "rejected").length, [rawDocs]);
  const pendingCount   = useMemo(() => rawDocs.filter((d) => d.status === "pending").length, [rawDocs]);
  const requiredMissing = useMemo(
    () => categories.filter((c) => c.required && c.documents.length === 0).length,
    [categories]
  );

  /* ── Optimistic add (called from UploadModal on success) ── */
  const handleDocUploaded = useCallback((doc: UploadedDoc) => {
    setRawDocs((prev) => [doc, ...prev]);
  }, []);

  /* ── Delete handler ── */
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);

    // 1. Delete from Storage
    const { error: storageErr } = await supabase.storage
      .from("business-documents")
      .remove([pendingDelete.file_path]);

    if (storageErr) {
      // Non-fatal: file may already be gone. Proceed to DB delete.
      console.error("Storage delete error:", storageErr.message);
    }

    // 2. Delete from DB
    const { error: dbErr } = await supabase
      .from("business_documents")
      .delete()
      .eq("document_id", pendingDelete.doc_id);

    if (dbErr) {
      setDeleteError(`Failed to delete document: ${dbErr.message}`);
      setDeleting(false);
      return;
    }

    // 3. Remove from local state
    setRawDocs((prev) => prev.filter((d) => d.doc_id !== pendingDelete.doc_id));
    setDeleting(false);
    setPendingDelete(null);
  };

  /* ── Loading state ── */
  if (bizLoading || pageLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} style={{ color: "#D1D5DB" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Upload modal */}
      {activeCategory && (
        <UploadModal
          category={activeCategory}
          businessId={activeBusiness!.business_id}
          onClose={() => setActiveCategory(null)}
          onSuccess={handleDocUploaded}
        />
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <ConfirmDeleteModal
          title="Delete document?"
          description={`This will permanently delete "${pendingDelete.filename}" from your documents. This action cannot be undone.`}
          confirmLabel="Delete document"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            if (!deleting) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
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
              {totalDocs} document{totalDocs !== 1 ? "s" : ""} uploaded · {verifiedDocs} verified
              {rejectedDocs > 0 && <span style={{ color: "#EF4444" }}> · {rejectedDocs} need attention</span>}
              {requiredMissing > 0 && <span style={{ color: "#F59E0B" }}> · {requiredMissing} required categor{requiredMissing > 1 ? "ies" : "y"} missing</span>}
            </p>
          </div>
        </div>

        {/* Delete error (shown outside modal in case modal is closed before error clears) */}
        {deleteError && (
          <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#991B1B" }}>{deleteError}</p>
          </div>
        )}

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
            { label: "Total uploaded",  value: totalDocs,    color: "#0A2540" },
            { label: "Verified",        value: verifiedDocs, color: "#10B981" },
            { label: "Under review",    value: pendingCount, color: "#F59E0B" },
            { label: "Rejected",        value: rejectedDocs, color: "#EF4444" },
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
          {categories.map((cat) => (
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
