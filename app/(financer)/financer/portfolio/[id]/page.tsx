"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, CheckCircle2, Clock, AlertCircle,
  Loader2, ChevronRight, ShieldCheck, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type FinancingStatus = "active" | "settled" | "disputed" | "withdrawn";

type FullRecord = {
  financing_id:     string;
  capital_category: string;
  status:           FinancingStatus;
  granted_at:       string | null;
  settled_at:       string | null;
  withdrawn_at:     string | null;
  outcome:          string | null;
  institution_id:   string;
  business_id:      string;
  terms: {
    amount?:   number;
    rate?:     string | number;
    tenure?:   string;
    due_date?: string;
    [k: string]: unknown;
  };
  settlement_proof: {
    total_paid?:   number;
    installments?: { paid_at: string; amount: number }[];
    [k: string]:   unknown;
  };
  institution_name?: string;
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function repaidPct(r: FullRecord): number {
  const paid = r.settlement_proof?.total_paid ?? 0;
  const amt  = r.terms?.amount ?? 0;
  if (!amt) return 0;
  return Math.min(100, Math.round((paid / amt) * 100));
}

function statusConfig(s: FinancingStatus) {
  const map = {
    active:    { label: "Active",    variant: "warning"     as const, icon: <Clock         size={11} /> },
    settled:   { label: "Settled",   variant: "success"     as const, icon: <CheckCircle2  size={11} /> },
    disputed:  { label: "Disputed",  variant: "destructive" as const, icon: <AlertCircle   size={11} /> },
    withdrawn: { label: "Withdrawn", variant: "secondary"   as const, icon: <Clock         size={11} /> },
  };
  return map[s] ?? { label: s, variant: "secondary" as const, icon: null };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", wordBreak: "break-all" }}>{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function PortfolioDetailPage() {
  const { user } = useSession();
  const params   = useParams();
  const id       = params?.id as string | undefined;

  const [record,  setRecord]  = useState<FullRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      setError(null);

      const instId = await getMyInstitutionId(user.id);
      if (!instId) { setError("No institution found."); setLoading(false); return; }

      const { data, error: fetchErr } = await supabase
        .from("financing_records")
        .select(`
          financing_id, capital_category, terms, status,
          granted_at, settled_at, withdrawn_at, outcome,
          settlement_proof, institution_id, business_id,
          institutions ( name )
        `)
        .eq("financing_id", id)
        .eq("institution_id", instId)
        .maybeSingle();

      if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
      if (!data)    { setError("Record not found or access denied."); setLoading(false); return; }

      // Fetch business name separately
      const r = data as any;
      let businessName: string | undefined;
      let anonymizedId: string | undefined;
      if (r.business_id) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, financial_identity_id")
          .eq("business_id", r.business_id)
          .maybeSingle();
        businessName = biz?.name ?? undefined;
        anonymizedId = biz?.financial_identity_id ?? undefined;
      }
      const t  = r.terms            ?? {};
      const sp = r.settlement_proof ?? {};
      setRecord({
        financing_id:     r.financing_id,
        capital_category: r.capital_category,
        status:           r.status,
        granted_at:       r.granted_at,
        settled_at:       r.settled_at   ?? null,
        withdrawn_at:     r.withdrawn_at ?? null,
        outcome:          r.outcome      ?? null,
        institution_id:   r.institution_id,
        business_id:      r.business_id,
        terms: {
          amount:   t.financing_amount ?? t.amount ?? undefined,
          rate:     t.interest_rate    ?? t.rate   ?? undefined,
          tenure:   t.tenure_months != null ? `${t.tenure_months} months` : (t.tenure ?? undefined),
          due_date: t.settlement_date  ?? t.due_date ?? undefined,
        },
        settlement_proof: {
          total_paid:   sp.amount_paid  ?? sp.total_paid  ?? undefined,
          installments: sp.installments ?? undefined,
        },
        institution_name: r.institutions?.name ?? undefined,
        business_name:    businessName,
        anonymized_id:    anonymizedId,
      });
      setLoading(false);
    })();
  }, [user, id]);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={28} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading record…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── Error ── */
  if (error || !record) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/financer/portfolio" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Back to Portfolio
      </Link>
      <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
        <AlertCircle size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 6 }}>Record unavailable</p>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>{error ?? "This financing record could not be loaded."}</p>
      </div>
    </div>
  );

  const sc       = statusConfig(record.status);
  const pct      = repaidPct(record);
  const amount   = record.terms?.amount ? formatNGN(record.terms.amount) : "—";
  const paid     = record.settlement_proof?.total_paid ? formatNGN(record.settlement_proof.total_paid) : "—";
  const shortId  = `FIN-${record.financing_id.slice(0, 6).toUpperCase()}`;
  const bizLabel = record.business_name
    ?? (record.anonymized_id ? `BIZ-${record.anonymized_id.slice(0, 6).toUpperCase()}` : "Unknown");
  const installments = record.settlement_proof?.installments ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/financer/portfolio" style={{ color: "#9CA3AF", textDecoration: "none", fontWeight: 500 }}>Portfolio</Link>
        <ChevronRight size={12} style={{ color: "#D1D5DB" }} />
        <span style={{ color: "#0A2540", fontWeight: 600 }}>{shortId}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#00D4FF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>
                {shortId}
              </h2>
              <Badge variant={sc.variant} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                {sc.icon} {sc.label}
              </Badge>
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {record.capital_category.replace(/_/g, " ")}
              {record.institution_name ? ` · ${record.institution_name}` : ""}
              {` · ${bizLabel}`}
            </p>
          </div>
        </div>
        <Link href="/financer/portfolio" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={13} /> Portfolio
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Terms */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Financing Terms</p>
            </div>
            <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 28px" }}>
              <Field label="Financing ID"   value={record.financing_id} />
              <Field label="Business"       value={bizLabel} />
              <Field label="Institution"    value={record.institution_name ?? "—"} />
              <Field label="Capital Type"   value={record.capital_category.replace(/_/g, " ")} />
              <Field label="Amount"         value={amount} />
              <Field label="Rate"           value={record.terms?.rate ? String(record.terms.rate) : "—"} />
              <Field label="Tenure"         value={record.terms?.tenure ? String(record.terms.tenure) : "—"} />
              <Field label="Due Date"       value={record.terms?.due_date ? fmtDate(record.terms.due_date as string) : "—"} />
              <Field label="Disbursed"      value={fmtDate(record.granted_at)} />
              <Field label="Status"         value={sc.label} />
              {record.settled_at   && <Field label="Settled"   value={fmtDate(record.settled_at)} />}
              {record.withdrawn_at && <Field label="Withdrawn" value={fmtDate(record.withdrawn_at)} />}
              {record.outcome      && <Field label="Outcome"   value={record.outcome} />}
            </div>
          </div>

          {/* Installments */}
          {installments.length > 0 && (
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Repayment Instalments</p>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{installments.length} recorded</span>
              </div>
              <div>
                {installments.map((inst, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 22px", borderBottom: i < installments.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={12} style={{ color: "#10B981" }} />
                      </div>
                      <span style={{ fontSize: 13, color: "#374151" }}>{fmtDate(inst.paid_at)}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{formatNGN(inst.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Repayment progress */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 14 }}>Repayment Progress</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 10 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, color: "#0A2540", letterSpacing: "-0.05em", lineHeight: 1 }}>{pct}%</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>repaid</p>
            </div>
            <div style={{ height: 8, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 50 ? "#10B981" : "#F59E0B", borderRadius: 9999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Total Repaid</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>{paid}</p>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Amount</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{amount}</p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 12 }}>Quick Links</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {record.anonymized_id && (
                <Link
                  href={`/financer/business-profile?id=${record.anonymized_id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  <ShieldCheck size={13} /> Business Profile
                </Link>
              )}
              <Link
                href="/financer/portfolio"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                <ArrowLeft size={13} /> All Records
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
            <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>
              This record is visible only to your institution. Settlement data is provided by the business via Creditlinker's verified pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
