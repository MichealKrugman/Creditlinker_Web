"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Loader2, AlertCircle, Info, TrendingUp, TrendingDown, Minus, SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/business-context";
import { getCustomScenarioForecast, type ForecastDriverInputs, type CustomScenarioForecast, type ApiError } from "@/lib/api";

/* ─────────────────────────────────────────────────────────
   TYPES — mirror SDK/engine/business-forecast.engine.ts
   (Phase K, Milestone 1) exactly.
───────────────────────────────────────────────────────── */
type ForecastScenarioId =
  | "severe_decline" | "moderate_decline" | "stable"
  | "moderate_growth" | "strong_growth" | "aggressive_growth";

type BusinessForecastBaseline = {
  monthly_revenue_avg: number;
  monthly_expense_avg: number;
  monthly_net_cashflow_avg: number;
  fixed_cost_weight: number;
  cash_runway_days: number;
  avg_closing_balance: number;
  trend_direction: "improving" | "declining" | "stable";
  trend_slope: number;
  trend_source: "cashflow_forecast" | "fallback_no_trend_data";
  data_months_used: number;
};

type ScenarioForecast = {
  scenario_id: ForecastScenarioId;
  label: string;
  growth_rate_pct: number;
  confidence: number;
  projected_monthly_revenue: number;
  projected_monthly_expenses: number;
  projected_monthly_net_cashflow: number;
  projected_net_cashflow_90d: number;
  projected_operating_runway_days: number | null;
  runway_outlook: "sustainable" | "depleting";
  explanation: string;
};

type BusinessPerformanceForecast = {
  forecast_id: string;
  business_id: string;
  computed_at: string;
  baseline: BusinessForecastBaseline;
  scenarios: ScenarioForecast[];
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₦${abs.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SCENARIO_COLOR: Record<ForecastScenarioId, string> = {
  severe_decline: "#EF4444",
  moderate_decline: "#F59E0B",
  stable: "#6B7280",
  moderate_growth: "#0EA5E9",
  strong_growth: "#10B981",
  aggressive_growth: "#00D4FF",
};

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: color ?? "#0A2540", letterSpacing: "-0.03em" }}>{value}</p>
    </div>
  );
}

function TrendBadge({ direction }: { direction: "improving" | "declining" | "stable" }) {
  const map = {
    improving: { icon: TrendingUp, color: "#10B981", label: "Improving" },
    declining: { icon: TrendingDown, color: "#EF4444", label: "Declining" },
    stable: { icon: Minus, color: "#6B7280", label: "Stable" },
  } as const;
  const { icon: Icon, color, label } = map[direction];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: "3px 8px", borderRadius: 6 }}>
      <Icon size={11} /> {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   SCENARIO CARD
───────────────────────────────────────────────────────── */
function ScenarioCard({ scenario, selected, onSelect }: { scenario: ScenarioForecast; selected: boolean; onSelect: () => void }) {
  const color = SCENARIO_COLOR[scenario.scenario_id];
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: "left" as const, cursor: "pointer",
        border: `1.5px solid ${selected ? color : "#E5E7EB"}`,
        background: selected ? `${color}08` : "white",
        borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 8,
        transition: "all 0.12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{scenario.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {scenario.growth_rate_pct > 0 ? "+" : ""}{scenario.growth_rate_pct}%
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#0A2540", letterSpacing: "-0.03em" }}>
        {fmt(scenario.projected_monthly_net_cashflow)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>/mo</span>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#F3F4F6", overflow: "hidden" }}>
          <div style={{ width: `${scenario.confidence}%`, height: "100%", background: color, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF" }}>{scenario.confidence}%</span>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   K5 — ADJUSTABLE DRIVERS (custom what-if calculator)
   Sliders move individual assumptions instead of one aggregate
   growth %. Nothing here is persisted — every change just calls
   the forecast-custom-scenario edge function fresh. See the design
   note on computeCustomScenarioForecast in
   business-forecast.engine.ts for why price/volume compound
   instead of add, and why receivables timing is a one-time cash
   effect rather than a recurring one.
───────────────────────────────────────────────────────── */
const DRIVER_DEFAULTS: Required<ForecastDriverInputs> = {
  avg_transaction_value_change_pct: 0,
  transaction_volume_change_pct: 0,
  expense_change_pct: 0,
  receivables_days_change: 0,
};

function DriverSlider({
  label, value, min, max, step = 1, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; suffix: string;
  onChange: (v: number) => void;
}) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: positive ? "#10B981" : negative ? "#EF4444" : "#9CA3AF" }}>
          {value > 0 ? "+" : ""}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#0A2540" }}
      />
    </div>
  );
}

function CustomScenarioSection({ businessId }: { businessId: string }) {
  const [drivers, setDrivers] = useState<Required<ForecastDriverInputs>>(DRIVER_DEFAULTS);
  const [result, setResult] = useState<CustomScenarioForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDriver = (key: keyof ForecastDriverInputs) => (v: number) =>
    setDrivers(d => ({ ...d, [key]: v }));

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const forecast = await getCustomScenarioForecast(businessId, drivers);
      setResult(forecast);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to compute custom scenario");
    } finally {
      setLoading(false);
    }
  }, [businessId, drivers]);

  const isDefault = JSON.stringify(drivers) === JSON.stringify(DRIVER_DEFAULTS);

  return (
    <Card>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
        <SlidersHorizontal size={16} style={{ color: "#0A2540" }} />
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Build your own scenario</p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>Move individual assumptions instead of one aggregate growth rate.</p>
        </div>
      </div>
      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <DriverSlider label="Average transaction value" value={drivers.avg_transaction_value_change_pct} min={-90} max={300} suffix="%" onChange={setDriver("avg_transaction_value_change_pct")} />
        <DriverSlider label="Transaction volume" value={drivers.transaction_volume_change_pct} min={-90} max={300} suffix="%" onChange={setDriver("transaction_volume_change_pct")} />
        <DriverSlider label="Operating expenses" value={drivers.expense_change_pct} min={-90} max={300} suffix="%" onChange={setDriver("expense_change_pct")} />
        <DriverSlider label="Receivables collection time" value={drivers.receivables_days_change} min={-180} max={180} suffix="d" onChange={setDriver("receivables_days_change")} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={calculate}
            disabled={loading}
            style={{ padding: "9px 16px", borderRadius: 8, background: "#0A2540", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>
          {!isDefault && (
            <button
              onClick={() => { setDrivers(DRIVER_DEFAULTS); setResult(null); setError(null); }}
              style={{ padding: "9px 14px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Reset
            </button>
          )}
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
            <AlertCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#991B1B" }}>{error}</p>
          </div>
        )}

        {result && (
          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <StatBox label="Revenue Growth" value={`${result.derived_revenue_growth_pct >= 0 ? "+" : ""}${result.derived_revenue_growth_pct}%`} color={result.derived_revenue_growth_pct >= 0 ? "#10B981" : "#EF4444"} />
              <StatBox label="Projected Revenue" value={fmt(result.projected_monthly_revenue)} />
              <StatBox label="Projected Expenses" value={fmt(result.projected_monthly_expenses)} />
              <StatBox label="Net Cashflow" value={fmt(result.projected_monthly_net_cashflow)} color={result.projected_monthly_net_cashflow >= 0 ? "#10B981" : "#EF4444"} />
              <StatBox label="Working Capital Impact" value={`${result.working_capital_cash_impact >= 0 ? "+" : ""}${fmt(result.working_capital_cash_impact)}`} color={result.working_capital_cash_impact >= 0 ? "#10B981" : "#EF4444"} />
              <StatBox
                label="Runway Outlook"
                value={result.runway_outlook === "sustainable" ? "Sustainable" : result.projected_operating_runway_days != null ? `${result.projected_operating_runway_days}d` : "—"}
                color={result.runway_outlook === "sustainable" ? "#10B981" : "#EF4444"}
              />
            </div>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{result.explanation}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE — "Performance Forecast" (Phase K, Milestone 2)
   Reads business_performance_forecasts directly under the
   business's own RLS-scoped session — same pattern as the
   cashflow forecast section on /financial-analysis. No
   computation happens in the browser; this is purely a
   reader for what forecast-business-performance already wrote.
───────────────────────────────────────────────────────── */
export default function PerformanceForecastPage() {
  const { activeBusiness, isLoading: bizLoading } = useActiveBusiness();
  const businessId = activeBusiness?.business_id ?? null;

  const [forecast, setForecast] = useState<BusinessPerformanceForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<ForecastScenarioId>("stable");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("business_performance_forecasts")
      .select("forecast_id, business_id, computed_at, forecast")
      .eq("business_id", businessId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setForecast(data ? (data.forecast as BusinessPerformanceForecast) : null);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    if (businessId) load();
  }, [businessId, load]);

  if (bizLoading || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const selected = forecast?.scenarios.find(s => s.scenario_id === selectedId) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={20} color="#00D4FF" />
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>Performance Forecast</h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Six scenarios for how your revenue, expenses, and cashflow could move from here.</p>
        </div>
      </div>

      {error && (
        <Card>
          <div style={{ padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#6B7280" }}>{error}</p>
          </div>
        </Card>
      )}

      {!error && !forecast && (
        <Card>
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <Sparkles size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No forecast yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 420, margin: "0 auto" }}>
              A performance forecast is generated automatically the first time your data pipeline runs successfully. Sync or upload your transaction data on Data Sources to get started.
            </p>
          </div>
        </Card>
      )}

      {!error && forecast && (
        <>
          {/* Baseline */}
          <Card>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Current baseline</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TrendBadge direction={forecast.baseline.trend_direction} />
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Computed {fmtDate(forecast.computed_at)}</span>
              </div>
            </div>
            <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <StatBox label="Monthly Revenue" value={fmt(forecast.baseline.monthly_revenue_avg)} />
              <StatBox label="Monthly Expenses" value={fmt(forecast.baseline.monthly_expense_avg)} />
              <StatBox label="Net Cashflow" value={fmt(forecast.baseline.monthly_net_cashflow_avg)} color={forecast.baseline.monthly_net_cashflow_avg >= 0 ? "#10B981" : "#EF4444"} />
              <StatBox label="Cash Runway" value={`${forecast.baseline.cash_runway_days}d`} />
              <StatBox label="Data Coverage" value={`${forecast.baseline.data_months_used}mo`} />
            </div>
            {forecast.baseline.trend_source === "fallback_no_trend_data" && (
              <div style={{ margin: "0 22px 18px", display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 8 }}>
                <Info size={12} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>Trend is assumed flat — this business has less than 6 months of data, so no trend has been detected yet. Scenario projections below are still based on your real monthly averages.</p>
              </div>
            )}
          </Card>

          {/* Scenario grid */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Scenarios</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {forecast.scenarios.map(s => (
                <ScenarioCard key={s.scenario_id} scenario={s} selected={s.scenario_id === selectedId} onSelect={() => setSelectedId(s.scenario_id)} />
              ))}
            </div>
          </div>

          {/* Selected scenario detail */}
          {selected && (
            <Card>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{selected.label} — detail</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: SCENARIO_COLOR[selected.scenario_id], background: `${SCENARIO_COLOR[selected.scenario_id]}15`, padding: "3px 8px", borderRadius: 6 }}>{selected.confidence}% confidence</span>
              </div>
              <div style={{ padding: "18px 22px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
                  <StatBox label="Projected Revenue" value={fmt(selected.projected_monthly_revenue)} />
                  <StatBox label="Projected Expenses" value={fmt(selected.projected_monthly_expenses)} />
                  <StatBox label="Projected Net Cashflow" value={fmt(selected.projected_monthly_net_cashflow)} color={selected.projected_monthly_net_cashflow >= 0 ? "#10B981" : "#EF4444"} />
                  <StatBox label="90-Day Net Cashflow" value={fmt(selected.projected_net_cashflow_90d)} />
                  <StatBox
                    label="Runway Outlook"
                    value={selected.runway_outlook === "sustainable" ? "Sustainable" : selected.projected_operating_runway_days != null ? `${selected.projected_operating_runway_days}d` : "—"}
                    color={selected.runway_outlook === "sustainable" ? "#10B981" : "#EF4444"}
                  />
                </div>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{selected.explanation}</p>
              </div>
            </Card>
          )}

          {businessId && <CustomScenarioSection businessId={businessId} />}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>These are directional scenarios, not guarantees — each one states its own assumption plainly. This does not include or imply any loan or credit limit amount.</p>
          </div>
        </>
      )}
    </div>
  );
}
