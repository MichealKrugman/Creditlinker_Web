"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight, CheckCircle2, Clock, AlertCircle,
  Banknote, Building2, Loader2, ChevronDown, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES — real financing_records schema
───────────────────────────────────────────────────────── */
type FinancingStatus = "active" | "settled" | "disputed" | "withdrawn";

type FinancingRecord = {
  financing_id:     string;
  capital_category: string;
  status:           FinancingStatus;
  granted_at:       string | null;
  institution_id:   string;
  terms: {
    amount?:   number;
    rate?:     string | number;
    tenure?:   string;
    due_date?: string;
    [key: string]: unknown;
  };
  settlement_proof: {
    installments?: { paid_at: string; amount: number }[];
    total_paid?:   number;
  };
  // joined
  institution_name?: string;
  institution_type?: string;
  business_name?:    string;
  anonymized_id?:    string;
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function formatNGN(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function healthConfig(r: FinancingRecord) {
  if (r.status === "settled")   return { label: "Settled",   variant: "success"     as const, icon: <CheckCircle2 size={11} /> };
  if (r.status === "disputed")  return { label: "Disputed",  variant: "destructive" as const, icon: <AlertCircle  size={11} /> };
  if (r.status === "withdrawn") return { label: "Withdrawn", variant: "secondary"   as const, icon: <Clock        size={11} /> };
  // active — look at repayment progress
  const totalPaid = r.settlement_proof?.total_paid ?? 0;
  const totalAmt  = r.terms?.amount ?? 0;
  const pct       = totalAmt > 0 ? totalPaid / totalAmt : 0;
  if (pct >= 0.5) return { label: "On Track",  variant: "success" as const, icon: <CheckCircle2 size={11} /> };
  return               { label: "Active",     variant: "warning" as const, icon: <Clock       size={11} /> };
}

function repaidPct(r: FinancingRecord): number {
  const totalPaid = r.settlement_proof?.total_paid ?? 0;
  const totalAmt  = r.terms?.amount ?? 0;
  if (!totalAmt) return 0;
  return Math.min(100, Math.round((totalPaid / totalAmt) * 100));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────
   PORTFOLIO RECORD ROW
───────────────────────────────────────────────────────── */
function RecordRow({ record, expanded, onToggle }: {
  record: FinancingRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hc       = healthConfig(record);
  const pct      = repaidPct(record);
  const shortId  = `FIN-${record.financing_id.slice(0, 6).toUpperCase()}`;
  const amount   = record.terms?.amount ? formatNGN(record.terms.amount) : "—";
  const totalPaid = record.settlement_proof?.total_paid
    ? formatNGN(record.settlement_proof.total_paid) : "—";
  const dueDate  = record.terms?.due_date ? fmtDate(record.terms.due_date as string) : "—";

  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Summary row */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 110px 100px 100px 130px 28px",
          gap: 12, padding: "14px 20px", alignItems: "center", cursor: "pointer",
        }}
        className="portfolio-row"
      >
        {/* Business */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: "#0A2540",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={15} color="#00D4FF" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>{shortId}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
              {record.capital_category.replace(/_/g, " ")}
              {" · "}{record.business_name ?? (record.anonymized_id ? `BIZ-${record.anonymized_id.slice(0,6).toUpperCase()}` : "—")}
              {record.institution_name ? ` · ${record.institution_name}` : ""}
            </p>
          </div>
        </div>

        {/* Amount */}
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{amount}</p>

        {/* Repaid */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>Repaid</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 50 ? "#10B981" : "#F59E0B", borderRadius: 9999 }} />
          </div>
        </div>

        {/* Disbursed */}
        <p style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(record.granted_at)}</p>

        {/* Due */}
        <p style={{ fontSize: 12, color: "#6B7280" }}>{dueDate}</p>

        {/* Status */}
        <Badge variant={hc.variant} style={{ fontSize: 10, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {hc.icon} {hc.label}
        </Badge>

        {/* Chevron */}
        <div style={{ color: "#9CA3AF", display: "flex" }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "20px", background: "#FAFAFA" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
            {/* Left: terms grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px",
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 10, padding: "16px 18px",
            }}>
              {[
                { label: "Financing ID",    value: record.financing_id },
                { label: "Business",        value: record.business_name ?? (record.anonymized_id ? `BIZ-${record.anonymized_id.slice(0,6).toUpperCase()}` : "—") },
                { label: "Institution",     value: record.institution_name ?? "—" },
                { label: "Capital Type",    value: record.capital_category.replace(/_/g, " ") },
                { label: "Amount",          value: amount },
                { label: "Total Repaid",    value: totalPaid },
                { label: "Rate",            value: record.terms?.rate ? String(record.terms.rate) : "—" },
                { label: "Tenure",          value: record.terms?.tenure ? String(record.terms.tenure) : "—" },
                { label: "Disbursed",       value: fmtDate(record.granted_at) },
                { label: "Due Date",        value: dueDate },
                { label: "Status",          value: hc.label },
              ].map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
                    {r.label}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{r.value}</p>
                </div>
              ))}
            </div>

            {/* Right: repayment progress + link */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
              <div style={{
                background: "white", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "14px 16px",
              }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>Repayment</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {pct}%
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>repaid</p>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 50 ? "#10B981" : "#F59E0B", borderRadius: 9999 }} />
                </div>
                {record.settlement_proof?.installments && record.settlement_proof.installments.length > 0 && (
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
                    {record.settlement_proof.installments.length} instalment{record.settlement_proof.installments.length !== 1 ? "s" : ""} recorded
                  </p>
                )}
              </div>

              <Link
                href={`/financer/portfolio/${record.financing_id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 8,
                  background: "#0A2540", color: "white",
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}
              >
                Full Record <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerPortfolio() {
  const { user } = useSession();

  const [records,  setRecords]  = useState<FinancingRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | FinancingStatus>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      // Resolve institution
      const instId = await getMyInstitutionId(user.id);
      if (!instId) { setError("No institution found."); setLoading(false); return; }

      const { data, error: fetchErr } = await supabase
        .from("financing_records")
        .select(`
          financing_id,
          capital_category,
          terms,
          status,
          granted_at,
          settlement_proof,
          institution_id,
          business_id,
          institutions ( name, category )
        `)
        .eq("institution_id", instId)
        .order("granted_at", { ascending: false });

      if (fetchErr) { setError(`Failed to load portfolio: ${fetchErr.message}`); setLoading(false); return; }

      // Fetch business names separately
      const businessIds = [...new Set((data ?? []).map((r: any) => r.business_id).filter(Boolean))];
      let bizMap: Record<string, { name: string; financial_identity_id: string }> = {};
      if (businessIds.length > 0) {
        const { data: bizRows } = await supabase
          .from("businesses")
          .select("business_id, name, financial_identity_id")
          .in("business_id", businessIds);
        (bizRows ?? []).forEach((b: any) => { bizMap[b.business_id] = b; });
      }

      const shaped: FinancingRecord[] = (data ?? []).map((r: any) => {
        const t  = r.terms            ?? {};
        const sp = r.settlement_proof ?? {};
        const biz = bizMap[r.business_id];
        return {
          financing_id:     r.financing_id,
          capital_category: r.capital_category,
          terms: {
            amount:   t.amount    ?? undefined,
            rate:     t.rate      ?? undefined,
            tenure:   t.tenure    ?? undefined,
            due_date: t.due_date  ?? undefined,
          },
          status:           r.status,
          granted_at:       r.granted_at,
          settlement_proof: {
            total_paid:   sp.amount_paid  ?? sp.total_paid  ?? undefined,
            installments: sp.installments ?? undefined,
          },
          institution_id:   r.institution_id,
          institution_name: r.institutions?.name     ?? undefined,
          institution_type: r.institutions?.category ?? undefined,
          business_name:    biz?.name                ?? undefined,
          anonymized_id:    biz?.financial_identity_id ?? undefined,
        };
      });

      setRecords(shaped);
      setLoading(false);
    })();
  }, [user]);

  const filtered = filter === "all" ? records : records.filter(r => r.status === filter);

  const totalDeployed = records
    .filter(r => r.status === "active")
    .reduce((s, r) => s + (r.terms?.amount ?? 0), 0);
  const totalRepaid = records
    .reduce((s, r) => s + (r.settlement_proof?.total_paid ?? 0), 0);

  const counts = {
    all:       records.length,
    active:    records.filter(r => r.status === "active").length,
    settled:   records.filter(r => r.status === "settled").length,
    disputed:  records.filter(r => r.status === "disputed").length,
    withdrawn: records.filter(r => r.status === "withdrawn").length,
  };

  const tabs: { key: "all" | FinancingStatus; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "active",    label: "Active" },
    { key: "settled",   label: "Settled" },
    { key: "disputed",  label: "Disputed" },
    { key: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            Portfolio
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            {loading ? "Loading…" : (
              <>
                {counts.active} active deal{counts.active !== 1 ? "s" : ""}
                {totalDeployed > 0 && <> · <span style={{ fontWeight: 600, color: "#0A2540" }}>{formatNGN(totalDeployed)} deployed</span></>}
                {totalRepaid > 0 && <> · <span style={{ color: "#10B981", fontWeight: 600 }}>{formatNGN(totalRepaid)} repaid</span></>}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Summary metric cards */}
      {!loading && records.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { label: "Active Deals",    value: String(counts.active),             icon: <Banknote  size={15} />, accent: true  },
            { label: "Total Deployed",  value: formatNGN(totalDeployed),           icon: <ArrowUpRight size={15} />, accent: false },
            { label: "Total Repaid",    value: formatNGN(totalRepaid),             icon: <CheckCircle2 size={15} />, accent: false },
            { label: "Settled Deals",   value: String(counts.settled),             icon: <CheckCircle2 size={15} />, accent: false },
          ].map(m => (
            <div key={m.label} style={{
              background: m.accent ? "#0A2540" : "white",
              border: "1px solid", borderColor: m.accent ? "#0A2540" : "#E5E7EB",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: m.accent ? "#00D4FF" : "#9CA3AF" }}>
                {m.icon}
                <p style={{ fontSize: 11, fontWeight: 600, color: m.accent ? "#9CA3AF" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {m.label}
                </p>
              </div>
              <p style={{
                fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800,
                color: m.accent ? "white" : "#0A2540", letterSpacing: "-0.03em",
              }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8,
              border: filter === tab.key ? "1px solid #0A2540" : "1px solid #E5E7EB",
              background: filter === tab.key ? "#0A2540" : "white",
              color: filter === tab.key ? "white" : "#6B7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {tab.label}
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9999, padding: "0 4px",
              background: filter === tab.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
              color: filter === tab.key ? "white" : "#6B7280",
              fontSize: 10, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table header — desktop only */}
      {!loading && filtered.length > 0 && (
        <>
          <div
            className="portfolio-desktop-header"
            style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 100px 100px 130px 28px", gap: 12, padding: "0 20px 4px" }}
          >
            {["Deal", "Amount", "Repaid", "Disbursed", "Due", "Status", ""].map(h => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
            ))}
          </div>
          <style>{`
            @media (max-width: 768px) { .portfolio-desktop-header { display: none !important; } }
            @media (max-width: 768px) { .portfolio-row { grid-template-columns: 1fr 100px 130px 28px !important; } }
          `}</style>
        </>
      )}

      {/* Records */}
      {loading ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>Loading portfolio…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
          <Banknote size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No deals yet</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {filter === "all"
              ? "Financing records will appear here once deals are created."
              : `No ${filter} deals.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(r => (
            <RecordRow
              key={r.financing_id}
              record={r}
              expanded={expanded === r.financing_id}
              onToggle={() => setExpanded(expanded === r.financing_id ? null : r.financing_id)}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
