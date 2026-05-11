"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Building2, Landmark, Zap,
  ShieldCheck, DollarSign, Activity, BarChart2, Download, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMockAdminUser } from "@/lib/admin-rbac";
import { supabase } from "@/lib/supabase";

async function callFn(name: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n.toLocaleString()}`;
}

function MiniBarChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  const values = data.map((d: any) => d[valueKey] ?? 0);
  const max = Math.max(...values, 1);
  const H = 56;
  const W = 220;
  const barW = W / values.length - 4;

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      {values.map((v: number, i: number) => {
        const h = (v / max) * H;
        const x = i * (W / values.length);
        const y = H - h;
        return (
          <g key={i}>
            <rect x={x + 2} y={y} width={barW} height={h} fill={color} rx={3} opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2:    <Building2 size={16} />,
  Zap:          <Zap size={16} />,
  ShieldCheck:  <ShieldCheck size={16} />,
  Activity:     <Activity size={16} />,
  Landmark:     <Landmark size={16} />,
  BarChart2:    <BarChart2 size={16} />,
};

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function handleExport() {
    if (!data) return;
    const kpiRows = (data.kpi_deltas ?? []).map((k: any) =>
      [k.label, k.value, k.delta, k.period].join(",")
    );
    const sectorRows = (data.sector_breakdown ?? []).map((s: any) =>
      [`"${s.sector}"`, s.count].join(",")
    );
    const csv = [
      "=== KPI Summary ===",
      ["label", "value", "delta", "period"].join(","),
      ...kpiRows,
      "",
      "=== Sector Breakdown ===",
      ["sector", "count"].join(","),
      ...sectorRows,
      "",
      "=== Financing Summary ===",
      ["metric", "value"].join(","),
      `total_disbursed_ngn,${data.financing_summary?.total_disbursed_ngn ?? 0}`,
      `active_count,${data.financing_summary?.active_count ?? 0}`,
      `avg_ticket_ngn,${data.financing_summary?.avg_ticket_ngn ?? 0}`,
      `settlement_rate_pct,${data.financing_summary?.settlement_rate_pct ?? 0}`,
      `dispute_rate_pct,${data.financing_summary?.dispute_rate_pct ?? 0}`,
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `creditlinker-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callFn("admin-get-reports");
      setData(res);
    } catch (e) {
      console.error("[reports] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const growth          = data?.growth          ?? [];
  const sectorBreakdown = data?.sector_breakdown ?? [];
  const scoreDist       = data?.score_distribution ?? [];
  const financing       = data?.financing_summary  ?? {};
  const kpiDeltas       = data?.kpi_deltas          ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Reports</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Platform analytics · {loading ? "Loading…" : `Last updated: today`}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={handleExport} disabled={loading}><Download size={13} /> Export Report</Button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <Loader2 size={22} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading reports…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* KPI GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {kpiDeltas.map((kpi: any) => (
              <div key={kpi.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                    {ICON_MAP[kpi.icon_name] ?? <Activity size={16} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={11} style={{ color: "#10B981" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981" }}>{kpi.delta}</span>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.04em", marginBottom: 2 }}>{kpi.value}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{kpi.label}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>{kpi.period}</p>
              </div>
            ))}
          </div>

          {/* GROWTH + SECTOR */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Growth chart */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 18 }}>Business Growth (6 months)</p>
              {growth.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No growth data available yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(["businesses", "pipelines"] as const).map((key) => {
                    const last = growth[growth.length - 1]?.[key] ?? 0;
                    const prev = growth[growth.length - 2]?.[key] ?? 1;
                    const pct = (((last - prev) / prev) * 100).toFixed(1);
                    const color = key === "businesses" ? "#0A2540" : "#00D4FF";
                    const label = key === "businesses" ? "Businesses" : "Pipeline Runs";
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#0A2540" }}>{last.toLocaleString()}</span>
                            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>+{pct}%</span>
                          </div>
                        </div>
                        <MiniBarChart data={growth} valueKey={key} color={color} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          {growth.map((g: any) => <span key={g.month} style={{ fontSize: 10, color: "#9CA3AF" }}>{g.month}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sector breakdown */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Businesses by Sector</p>
              {sectorBreakdown.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No sector data available yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sectorBreakdown.map((s: any) => {
                    const total = sectorBreakdown.reduce((a: number, b: any) => a + b.count, 0);
                    const pct = (s.count / total) * 100;
                    return (
                      <div key={s.sector}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{s.sector}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color ?? "#0A2540" }}>{s.count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: s.color ?? "#0A2540", borderRadius: 9999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SCORE DISTRIBUTION + FINANCING SUMMARY */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Score dist */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Score Distribution</p>
              {scoreDist.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No score data available yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {scoreDist.map((band: any) => (
                    <div key={band.band}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{band.band}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: band.color ?? "#0A2540" }}>{band.count} ({band.pct}%)</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 9999, background: "#F3F4F6" }}>
                        <div style={{ height: "100%", width: `${band.pct}%`, background: band.color ?? "#0A2540", borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financing summary */}
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 22px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginBottom: 16 }}>Financing Summary</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Total Disbursed",  value: fmtNgn(financing.total_disbursed_ngn ?? 0), color: "#0A2540", large: true },
                  { label: "Active Financing", value: String(financing.active_count ?? 0),         color: "#0891B2" },
                  { label: "Avg Ticket Size",  value: fmtNgn(financing.avg_ticket_ngn ?? 0),       color: "#374151" },
                  { label: "Settlement Rate",  value: `${financing.settlement_rate_pct ?? 0}%`,    color: "#10B981" },
                  { label: "Dispute Rate",     value: `${financing.dispute_rate_pct ?? 0}%`,       color: (financing.dispute_rate_pct ?? 0) > 5 ? "#EF4444" : "#F59E0B" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: item.large ? 20 : 16, color: item.color, letterSpacing: "-0.03em" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
