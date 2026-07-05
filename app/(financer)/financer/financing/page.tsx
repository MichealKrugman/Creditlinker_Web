"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Download, CheckCircle2, Clock, AlertCircle,
  Building2, Loader2, ArrowUpRight, BarChart2, Banknote,
  ChevronDown, ChevronRight, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { generateReport } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
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
  };
  settlement_proof: {
    total_paid?: number;
    installments?: { paid_at: string; amount: number }[];
  };
  institution_name?: string;
  business_name?:    string;
  anonymized_id?:    string;
};

type ConsentedBusiness = {
  consent_id:       string;
  business_id:      string;
  anonymized_id:    string;
  business_name?:   string;
  granted_at:       string;
  is_active:        boolean;
  permissions:      Record<string, unknown>;
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function repaidPct(r: FinancingRecord) {
  const paid = r.settlement_proof?.total_paid ?? 0;
  const amt  = r.terms?.amount ?? 0;
  if (!amt) return 0;
  return Math.min(100, Math.round((paid / amt) * 100));
}

function healthConfig(r: FinancingRecord) {
  if (r.status === "settled")  return { label: "Settled",  variant: "success"     as const, icon: <CheckCircle2 size={11} /> };
  if (r.status === "disputed") return { label: "Disputed", variant: "destructive" as const, icon: <AlertCircle  size={11} /> };
  const pct = repaidPct(r);
  if (pct >= 50) return { label: "On Track", variant: "success" as const, icon: <CheckCircle2 size={11} /> };
  return              { label: "Active",    variant: "warning" as const, icon: <Clock       size={11} /> };
}

/* ─────────────────────────────────────────────────────────
   DOWNLOAD BUTTON — calls generate-report edge fn
───────────────────────────────────────────────────────── */
function DownloadReportBtn({ businessId, reportType, label }: {
  businessId: string;
  reportType: "financial_identity" | "readiness" | "full";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateReport(businessId, reportType, "pdf");
      if (!result.download_url) throw new Error("No download URL returned");
      window.open(result.download_url, "_blank");
    } catch (e: any) {
      setError(e.message ?? "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 12px", borderRadius: 7,
          border: "1px solid #E5E7EB", background: loading ? "#F9FAFB" : "white",
          color: loading ? "#9CA3AF" : "#0A2540",
          fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
          : <Download size={11} />}
        {label}
      </button>
      {error && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DEAL ROW
───────────────────────────────────────────────────────── */
function DealRow({ record, expanded, onToggle }: {
  record: FinancingRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hc      = healthConfig(record);
  const pct     = repaidPct(record);
  const shortId = `FIN-${record.financing_id.slice(0, 6).toUpperCase()}`;
  const amount  = record.terms?.amount ? formatNGN(record.terms.amount) : "—";

  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid", gridTemplateColumns: "1fr 110px 100px 110px 130px 24px",
          gap: 12, padding: "14px 20px", alignItems: "center", cursor: "pointer",
        }}
        className="fin-row"
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0A2540", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={14} color="#00D4FF" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>{shortId}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
              {record.capital_category.replace(/_/g, " ")}
              {" · "}{record.business_name ?? (record.anonymized_id ? `BIZ-${record.anonymized_id.slice(0,6).toUpperCase()}` : "—")}
              {record.institution_name ? ` · ${record.institution_name}` : ""}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{amount}</p>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>Repaid</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 50 ? "#10B981" : "#F59E0B", borderRadius: 9999 }} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(record.granted_at)}</p>
        <Badge variant={hc.variant} style={{ fontSize: 10, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {hc.icon} {hc.label}
        </Badge>
        <div style={{ color: "#9CA3AF", display: "flex" }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "18px 20px", background: "#FAFAFA" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px",
              background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px",
            }}>
              {[
                { label: "Financing ID",  value: record.financing_id },
                { label: "Business",       value: record.business_name ?? (record.anonymized_id ? `BIZ-${record.anonymized_id.slice(0,6).toUpperCase()}` : "—") },
                { label: "Institution",   value: record.institution_name ?? "—" },
                { label: "Capital Type",  value: record.capital_category.replace(/_/g, " ") },
                { label: "Amount",        value: amount },
                { label: "Rate",          value: record.terms?.rate ? String(record.terms.rate) : "—" },
                { label: "Tenure",        value: record.terms?.tenure ? String(record.terms.tenure) : "—" },
                { label: "Disbursed",     value: fmtDate(record.granted_at) },
                { label: "Due Date",      value: record.terms?.due_date ? fmtDate(record.terms.due_date as string) : "—" },
                { label: "Total Repaid",  value: record.settlement_proof?.total_paid ? formatNGN(record.settlement_proof.total_paid) : "—" },
                { label: "Status",        value: hc.label },
              ].map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>{r.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{r.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
              <Link
                href={`/financer/portfolio/${record.financing_id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, background: "#0A2540", color: "white",
                  fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}
              >
                Full Record <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONSENTED BUSINESS ROW (for report generation)
───────────────────────────────────────────────────────── */
function ConsentedBizRow({ biz }: { biz: ConsentedBusiness }) {
  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
      padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={14} color="#00D4FF" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", marginBottom: 1 }}>
            {biz.business_name ?? `BIZ-${biz.anonymized_id.slice(0, 6).toUpperCase()}`}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Consent granted {fmtDate(biz.granted_at)}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <DownloadReportBtn businessId={biz.business_id} reportType="financial_identity" label="Identity Report" />
        <DownloadReportBtn businessId={biz.business_id} reportType="readiness"          label="Readiness Report" />
        <DownloadReportBtn businessId={biz.business_id} reportType="full"               label="Full Report" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerFinancing() {
  const { user } = useSession();

  const [records,    setRecords]    = useState<FinancingRecord[]>([]);
  const [consented,  setConsented]  = useState<ConsentedBusiness[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<"deals" | "reports">("deals");
  const [dealFilter, setDealFilter] = useState<"all" | FinancingStatus>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      // Resolve institution
      const instId = await getMyInstitutionId(user.id);
      if (!instId) { setError("No institution found."); setLoading(false); return; }

      // Fetch financing records
      const [recordsRes, consentedRes] = await Promise.all([
        supabase
          .from("financing_records")
          .select(`
            financing_id, capital_category, terms, status,
            granted_at, settlement_proof, institution_id, business_id,
            institutions ( name, category )
          `)
          .eq("institution_id", instId)
          .order("granted_at", { ascending: false }),

        // Businesses where we have active consent (for report generation)
        supabase
          .from("consent_records")
          .select("consent_id, business_id, granted_at, is_active, permissions")
          .eq("institution_id", instId)
          .eq("is_active", true)
          .order("granted_at", { ascending: false }),
      ]);

      if (recordsRes.error) {
        setError(`Failed to load financing records: ${recordsRes.error.message}`);
        setLoading(false);
        return;
      }

      // Fetch business names separately for both financing records and consented businesses
      const allBusinessIds = [...new Set([
        ...(recordsRes.data ?? []).map((r: any) => r.business_id),
        ...(consentedRes.data ?? []).map((c: any) => c.business_id),
      ].filter(Boolean))];
      let bizMap: Record<string, { name: string; financial_identity_id: string }> = {};
      if (allBusinessIds.length > 0) {
        const { data: bizRows } = await supabase
          .from("businesses")
          .select("business_id, name, financial_identity_id")
          .in("business_id", allBusinessIds);
        (bizRows ?? []).forEach((b: any) => { bizMap[b.business_id] = b; });
      }

      setRecords((recordsRes.data ?? []).map((r: any) => {
        const t = r.terms ?? {};
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
            total_paid:   sp.amount_paid   ?? sp.total_paid   ?? undefined,
            installments: sp.installments  ?? undefined,
          },
          institution_id:   r.institution_id,
          institution_name: r.institutions?.name ?? undefined,
          business_name:    biz?.name ?? undefined,
          anonymized_id:    biz?.financial_identity_id ?? undefined,
        };
      }));

      setConsented((consentedRes.data ?? []).map((c: any) => {
        const biz = bizMap[c.business_id];
        return {
          consent_id:    c.consent_id,
          business_id:   c.business_id,
          anonymized_id: biz?.financial_identity_id ?? c.business_id,
          business_name: biz?.name ?? undefined,
          granted_at:    c.granted_at,
          is_active:     c.is_active,
          permissions:   c.permissions ?? {},
        };
      }));

      setLoading(false);
    })();
  }, [user]);

  const filteredRecords = dealFilter === "all"
    ? records
    : records.filter(r => r.status === dealFilter);

  const totalDeployed = records.filter(r => r.status === "active").reduce((s, r) => s + (r.terms?.amount ?? 0), 0);
  const totalRepaid   = records.reduce((s, r) => s + (r.settlement_proof?.total_paid ?? 0), 0);

  const counts = {
    all:       records.length,
    active:    records.filter(r => r.status === "active").length,
    settled:   records.filter(r => r.status === "settled").length,
    disputed:  records.filter(r => r.status === "disputed").length,
    withdrawn: records.filter(r => r.status === "withdrawn").length,
  };

  const dealTabs: { key: "all" | FinancingStatus; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "active",    label: "Active" },
    { key: "settled",   label: "Settled" },
    { key: "disputed",  label: "Disputed" },
    { key: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
        }}>
          Financing
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          {loading ? "Loading…" : (
            <>
              {counts.active} active deal{counts.active !== 1 ? "s" : ""}
              {totalDeployed > 0 && <> · <span style={{ fontWeight: 600, color: "#0A2540" }}>{formatNGN(totalDeployed)} deployed</span></>}
              {totalRepaid   > 0 && <> · <span style={{ color: "#10B981", fontWeight: 600 }}>{formatNGN(totalRepaid)} repaid</span></>}
            </>
          )}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {/* Metric cards */}
      {!loading && records.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>
          {[
            { label: "Active Deals",   value: String(counts.active),        accent: true  },
            { label: "Total Deployed", value: formatNGN(totalDeployed),      accent: false },
            { label: "Total Repaid",   value: formatNGN(totalRepaid),        accent: false },
            { label: "Settled Deals",  value: String(counts.settled),        accent: false },
          ].map(m => (
            <div key={m.label} style={{
              background: m.accent ? "#0A2540" : "white",
              border: "1px solid", borderColor: m.accent ? "#0A2540" : "#E5E7EB",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: m.accent ? "#6B7280" : "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>
                {m.label}
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: m.accent ? "white" : "#0A2540", letterSpacing: "-0.03em" }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E5E7EB", paddingBottom: 0 }}>
        {([
          { key: "deals"   as const, label: "Deals",           icon: <Banknote  size={13} /> },
          { key: "reports" as const, label: "Generate Reports", icon: <FileText  size={13} /> },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", border: "none", background: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: activeTab === tab.key ? "#0A2540" : "#9CA3AF",
              borderBottom: `2px solid ${activeTab === tab.key ? "#0A2540" : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.12s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* DEALS TAB */}
      {activeTab === "deals" && (
        <>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {dealTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setDealFilter(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 7,
                  border: dealFilter === tab.key ? "1px solid #0A2540" : "1px solid #E5E7EB",
                  background: dealFilter === tab.key ? "#0A2540" : "white",
                  color: dealFilter === tab.key ? "white" : "#6B7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {tab.label}
                <span style={{
                  minWidth: 16, height: 16, padding: "0 3px", borderRadius: 9999,
                  background: dealFilter === tab.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
                  color: dealFilter === tab.key ? "white" : "#6B7280",
                  fontSize: 10, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Table header */}
          {!loading && filteredRecords.length > 0 && (
            <>
              <div className="fin-desktop-header" style={{ display: "grid", gridTemplateColumns: "1fr 110px 100px 110px 130px 24px", gap: 12, padding: "0 20px 4px" }}>
                {["Deal", "Amount", "Repaid", "Disbursed", "Status", ""].map(h => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
                ))}
              </div>
              <style>{`@media (max-width: 768px) { .fin-desktop-header, .fin-row { grid-template-columns: 1fr 100px 130px 24px !important; } }`}</style>
            </>
          )}

          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
              <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>Loading deals…</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
              <Banknote size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No deals yet</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                {dealFilter === "all" ? "Financing records will appear here once deals are created." : `No ${dealFilter} deals.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredRecords.map(r => (
                <DealRow
                  key={r.financing_id}
                  record={r}
                  expanded={expanded === r.financing_id}
                  onToggle={() => setExpanded(expanded === r.financing_id ? null : r.financing_id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <>
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
            fontSize: 13, color: "#0A5060",
          }}>
            Reports are generated from the business's latest financial identity snapshot.
            They are available for any business that has granted your institution consent.
          </div>

          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
              <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>Loading…</p>
            </div>
          ) : consented.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
              <FileText size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No consented businesses</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                Request access to businesses on the{" "}
                <Link href="/financer/businesses" style={{ color: "#0A2540", fontWeight: 600 }}>Businesses</Link>
                {" "}page. Reports become available once consent is granted.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {consented.map(biz => (
                <ConsentedBizRow key={biz.consent_id} biz={biz} />
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
