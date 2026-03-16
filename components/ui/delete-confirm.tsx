"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trash2, RotateCcw } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   DELETE BUTTON
   Two-stage: first click shows a "Sure? Yes / No" popover
   positioned above the button so it never disrupts layout.
───────────────────────────────────────────────────────── */
export function DeleteButton({
  onConfirm,
  iconSize = 11,
  style = {},
}: {
  onConfirm: () => void;
  iconSize?: number;
  style?: React.CSSProperties;
}) {
  const [confirming, setConfirming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on outside click or after 4s of inactivity */
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [confirming]);

  return (
    <div ref={containerRef} style={{ position: "relative" as const, display: "inline-flex" }}>
      {/* Confirmation popover */}
      {confirming && (
        <div style={{
          position: "absolute" as const,
          bottom: "calc(100% + 6px)",
          right: 0,
          background: "#0A2540",
          borderRadius: 9,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          zIndex: 100,
          whiteSpace: "nowrap" as const,
          animation: "fadeIn 0.1s ease",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute" as const,
            bottom: -5, right: 9,
            width: 10, height: 10,
            background: "#0A2540",
            transform: "rotate(45deg)",
            borderRadius: 2,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            Delete?
          </span>
          <button
            onClick={e => { e.stopPropagation(); onConfirm(); setConfirming(false); }}
            style={{
              padding: "3px 9px", borderRadius: 5,
              border: "none", background: "#EF4444",
              color: "white", fontSize: 11, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Yes
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirming(false); }}
            style={{
              padding: "3px 8px", borderRadius: 5,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            No
          </button>
        </div>
      )}

      {/* The actual button */}
      <button
        onClick={e => { e.stopPropagation(); setConfirming(v => !v); }}
        style={{
          width: 26, height: 26, borderRadius: 6,
          border: confirming ? "1px solid #EF4444" : "1px solid rgba(239,68,68,0.2)",
          background: confirming ? "#FEE2E2" : "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#EF4444",
          transition: "all 0.12s",
          ...style,
        }}
        onMouseEnter={e => { if (!confirming) (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
        onMouseLeave={e => { if (!confirming) (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
        title="Delete"
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   UNDO TOAST
   Fixed bottom-center toast with a 5s countdown bar.
   Call onExpire when timer runs out (fires API delete).
   Call onUndo to restore the item.
───────────────────────────────────────────────────────── */
export function UndoToast({
  message,
  onUndo,
  onExpire,
}: {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
}) {
  const [pct, setPct] = useState(100);
  const DURATION = 5000;

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setPct(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: "fixed" as const,
      bottom: 28,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 300,
      background: "#0A2540",
      borderRadius: 12,
      boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      overflow: "hidden",
      minWidth: 300,
      maxWidth: 420,
    }}>
      {/* Countdown progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "#00D4FF",
          transition: "width 0.05s linear",
          borderRadius: 9999,
        }} />
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 16px",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trash2 size={13} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{message}</p>
        </div>
        <button
          onClick={onUndo}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            color: "white", fontSize: 12, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
            transition: "all 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"}
        >
          <RotateCcw size={11} /> Undo
        </button>
      </div>
    </div>
  );
}
