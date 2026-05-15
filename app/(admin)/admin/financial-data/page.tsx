"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database, CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  Clock, Zap, BarChart2, Activity, ChevronRight, Eye,
  TrendingUp, TrendingDown, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminUser } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";

async function callFn(body: object): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  DETAIL DRAWER
// ─────────────────────────────────────────────────────────────

function RunDetailDrawer({ run, onClose }: { run: any; onClose: () => void }) {
  const STAGE_NAMES = ["Ingestion", "Normalization", "Feature Gen", "Scoring", "Risk Detection", "Snapshot"];
  const stagesPassed = run.stages ?? 6;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.4)", display: "flex", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 440, background: "white", height: "100%", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540" }}>Pipeline Run Detail</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><XCircle size={18} /></button>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{run.id}</p>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Business",      value: run.business ?? run.business_name ?? run.business_id ?? "—" },
              { label: "Duration",      value: run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—" },
              { label: "Score",         value: run.score ?? "—" },
              { label: "Data Quality",  value: run.dq ? `${run.dq}%` : (run.data_quality ? `${run.data_quality}%` : "—") },
              { label: "Stages Passed", value: `${stagesPassed} / 6` },
              { label: "Errors",        value: run.errors ?? run.error_count ?? 0 },
            ].map((item) => (
              <div key={item.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540" }}>{String(item.value)}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage Progression</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STAGE_NAMES.map((name, idx) => {
                const passed   = idx < stagesPassed;
                const isFailed = run.status === "failed" && idx === stagesPassed - 1;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isFailed ? "#FEF2F2" : passed ? "#ECFDF5" : "#F3F4F6", color: isFailed ? "#EF4444" : passed ? "#10B981" : "#D1D5DB" }}>
                      {isFailed ? <XCircle size={12} /> : passed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    </div>
                    <span style={{ fontSize: 13, color: isFailed ? "#EF4444" : passed ? "#374151" : "#9CA3AF", fontWeight: isFailed || passed ? 500 : 400 }}>{name}</span>
                    {isFailed && <Badge variant="destructive" style={{ fontSize: 10, marginLeft: "auto" }}>Failed here</Badge>}
                  </div>
                );
              })}
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

export default function AdminFinancialDataPage() {
  const [stages,      setStages]      = useState<any[]>([]);
  const [runs,        setRuns]        = useState<any[]>([]);
  const [dqDist,      setDqDist]      = useState<any[]>([]);
  const [summary,     setSummary]     = useState<any>({});
  const [loading,     setLoading]     = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const healthData = await callFn({ action: "get-pipeline-health" });
      setStages(healthData.stage_health ?? []);
      setSummary(healthData.summary ?? {});
      setDqDist(healthData.dq_distribution ?? []);
      setRuns(healthData.recent_runs ?? []);
    } catch (e) {
      console.error("[financial-data] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const degraded    = stages.filter(s => s.status === "degraded").length;
  const totalErrors = stages.reduce((s: number, st: any) => s + (st.errors_today ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Financial Data</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? <Badge variant="secondary">Loading…</Badge>
            : degraded > 0 ? <Badge variant="warning">{degraded} stage degraded</Badge>
            : <Badge variant="success">All stages healthy</Badge>}
          {!loading && (
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>
              {summary.runs_today ?? 0} pipeline runs today · {totalErrors} errors
            </span>
          )}
        </div>
      </div>

      {/* DEGRADED ALERT */}
      {!loading && degraded > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertTriangle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
              {stages.filter(s => s.status === "degraded").map((s: any) => s.name).join(", ")} stage degraded
            </p>
            <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>Elevated error rate detected. Monitor closely.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <Loader2 size={22} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading pipeline data…</p>
        </div>
      ) : (
        <>
          {/* STAGE HEALTH GRID */}
          {stages.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Pipeline Stage Health</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {stages.map((stage: any) => (
                  <div key={stage.name} style={{ background: "white", border: `1px solid ${stage.status === "degraded" ? "rgba(245,158,11,0.3)" : "#E5E7EB"}`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{stage.name}</p>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.status === "healthy" ? "#10B981" : stage.status === "degraded" ? "#F59E0B" : "#EF4444" }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Latency</p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: (stage.avg_latency_ms ?? 0) > 1000 ? "#F59E0B" : "#0A2540" }}>
                          {(stage.avg_latency_ms ?? 0) >= 1000 ? `${((stage.avg_latency_ms ?? 0) / 1000).toFixed(2)}s` : `${stage.avg_latency_ms ?? 0}ms`}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Success</p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: (stage.success_rate ?? 100) >= 99 ? "#10B981" : (stage.success_rate ?? 100) >= 97 ? "#F59E0B" : "#EF4444" }}>
                          {stage.success_rate ?? 100}%
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Errors</p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: (stage.errors_today ?? 0) > 0 ? "#EF4444" : "#9CA3AF" }}>{stage.errors_today ?? 0}</p>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6" }}>
                      <div style={{ height: "100%", width: `${stage.success_rate ?? 100}%`, background: (stage.success_rate ?? 100) >= 99 ? "#10B981" : (stage.success_rate ?? 100) >= 97 ? "#F59E0B" : "#EF4444", borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

            {/* RECENT RUNS TABLE */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Recent Pipeline Runs</p>
              </div>
              <div style={{ borderTop: "1px solid #F3F4F6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 70px 70px 40px", padding: "8px 22px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Business", "Run ID", "Duration", "Score", "DQ", ""].map((h) => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
                  ))}
                </div>
                {runs.length === 0 ? (
                  <div style={{ padding: "32px 22px", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>No pipeline runs found.</p>
                  </div>
                ) : runs.map((run: any, i: number) => (
                  <div key={run.id}
                    style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 70px 70px 40px", padding: "12px 22px", borderBottom: i < runs.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center", transition: "background 0.1s", cursor: "pointer" }}
                    onClick={() => setSelectedRun(run)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: run.status === "success" ? "#ECFDF5" : run.status === "failed" ? "#FEF2F2" : "#F0FDFF", color: run.status === "success" ? "#10B981" : run.status === "failed" ? "#EF4444" : "#0891B2" }}>
                        {run.status === "success" ? <CheckCircle2 size={12} /> : run.status === "failed" ? <XCircle size={12} /> : <RefreshCw size={12} />}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {run.business ?? run.business_name ?? run.business_id ?? "—"}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{String(run.id).slice(0, 10)}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : run.status === "running" ? "…" : "—"}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: run.score ? "#0A2540" : "#9CA3AF" }}>{run.score ?? "—"}</p>
                    <p style={{ fontSize: 12, color: run.dq ? (run.dq >= 85 ? "#10B981" : run.dq >= 70 ? "#F59E0B" : "#EF4444") : "#9CA3AF" }}>
                      {run.dq ? `${run.dq}%` : run.data_quality ? `${run.data_quality}%` : "—"}
                    </p>
                    <ChevronRight size={13} style={{ color: "#9CA3AF" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* DATA QUALITY DISTRIBUTION + SUMMARY */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dqDist.length > 0 && (
                <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "18px 20px" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Data Quality Distribution</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dqDist.map((band: any) => {
                      const total = dqDist.reduce((s: number, b: any) => s + b.count, 0);
                      const pct = total > 0 ? (band.count / total) * 100 : 0;
                      return (
                        <div key={band.band}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{band.band}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: band.color ?? "#0A2540" }}>{band.count}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: band.color ?? "#0A2540", borderRadius: 9999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Total businesses analyzed: {dqDist.reduce((s: number, b: any) => s + b.count, 0)}</p>
                  </div>
                </div>
              )}

              {/* Summary metrics */}
              {[
                { label: "Avg Pipeline Duration", value: summary.avg_duration_ms ? `${(summary.avg_duration_ms / 1000).toFixed(1)}s` : "—", icon: <Clock size={14} />, color: "#6B7280" },
                { label: "Runs Today",             value: String(summary.runs_today ?? 0),                                                   icon: <Zap size={14} />,   color: "#0A2540" },
                { label: "Avg Data Quality",       value: summary.avg_data_quality ? `${summary.avg_data_quality}%` : "—",                  icon: <Activity size={14} />, color: "#10B981" },
              ].map((m) => (
                <div key={m.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", flexShrink: 0 }}>{m.icon}</div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: m.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{m.value}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedRun && <RunDetailDrawer run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </div>
  );
}
