"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";

interface UndoToastProps {
  message: string;          // e.g. "Supplier deleted"
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;        // ms, default 5000
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setProgress(remaining * 100);
      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [duration, onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 400,
      background: "#0A2540",
      borderRadius: 12,
      boxShadow: "0 8px 32px rgba(10,37,64,0.3)",
      overflow: "hidden",
      minWidth: 300,
      maxWidth: 400,
      animation: "slideUp 0.2s ease-out",
    }}>
      {/* Progress bar */}
      <div style={{
        height: 3,
        background: "rgba(255,255,255,0.12)",
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "#00D4FF",
          transition: "width 0.05s linear",
        }} />
      </div>

      {/* Content */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px",
      }}>
        <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
          {message}
        </p>
        <button
          onClick={() => { cancelAnimationFrame(frameRef.current); onUndo(); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 7,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white", fontSize: 12, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
            transition: "background 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <RotateCcw size={11} /> Undo
        </button>
        <button
          onClick={() => { cancelAnimationFrame(frameRef.current); onDismiss(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", padding: 2, display: "flex",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          <X size={13} />
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
