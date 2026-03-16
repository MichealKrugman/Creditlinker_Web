"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 380,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        <div style={{ padding: "28px 28px 24px", textAlign: "center" as const }}>

          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: "#FEF2F2",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <AlertTriangle size={22} style={{ color: "#EF4444" }} />
          </div>

          <p style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
            color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 8,
          }}>
            {title}
          </p>

          <p style={{
            fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 24,
          }}>
            {description}
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, height: 42, borderRadius: 9,
                border: "1px solid #E5E7EB", background: "white",
                fontSize: 13, fontWeight: 600, color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1, height: 42, borderRadius: 9, border: "none",
                background: loading ? "#F3F4F6" : "#EF4444",
                color: loading ? "#9CA3AF" : "white",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "background 0.15s",
              }}
            >
              {loading
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Deleting…</>
                : confirmLabel
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
