"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowUpRight, Building2, TrendingUp,
  ArrowDownLeft, ChevronRight, AlertCircle, Info, Loader2,
  CheckCircle2, MessageSquare, Send, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type DimensionScore = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Transaction = {
  description: string;
  amount: number;
  direction: "credit" | "debit";
  date: string;
  category: string;
};

type ProfileData = {
  business_id:         string;
  consent_id:          string;       // needed to open the right message thread
  business_name:       string | null;
  anonymized_id:       string;      // financial_identity_id slug
  sector:              string | null;
  kyc_status:          string | null;
  registration_number: string | null;
  data_months:         number;
  coverage:            string;
  consent_expiry:      string | null;
  overall_score:       number | null;
  risk_level:          string | null;
  data_quality_score:  number | null;
  dimensions:          DimensionScore[];
  recent_transactions: Transaction[];
};

const DIM_META: Record<string, { label: string; color: string }> = {
  revenue_stability:       { label: "Revenue Stability",       color: "#10B981" },
  cashflow_predictability: { label: "Cashflow Predictability", color: "#38BDF8" },
  expense_discipline:      { label: "Expense Discipline",      color: "#818CF8" },
  liquidity_strength:      { label: "Liquidity Strength",      color: "#F59E0B" },
  financial_consistency:   { label: "Financial Consistency",   color: "#10B981" },
  risk_profile:            { label: "Risk Profile",            color: "#EF4444" },
};

function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function riskVariant(r: string | null) {
  if (!r) return "secondary" as const;
  if (r.toLowerCase().includes("low"))    return "success"     as const;
  if (r.toLowerCase().includes("medium")) return "warning"     as const;
  return "destructive" as const;
}

/* ─────────────────────────────────────────────────────────
   CARD PRIMITIVE
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerBusinessProfile() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anonymizedId = searchParams.get("id");

  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Compose modal state
  const [msgOpen,   setMsgOpen]   = useState(false);
  const [msgBody,   setMsgBody]   = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError,  setMsgError]  = useState<string | null>(null);
  const [instId,    setInstId]    = useState<string | null>(null);

  useEffect(() => {
    if (!user || !anonymizedId) return;

    (async () => {
      setLoading(true);
      setError(null);

      // 1. Resolve institution
      const resolvedInstId = await getMyInstitutionId(user.id);
      if (!resolvedInstId) { setError("No institution found."); setLoading(false); return; }
      setInstId(resolvedInstId);
      const instId = resolvedInstId;

      // 2. Resolve business_id from financial_identity_id.
      //    PostgREST cannot filter a parent table via a joined column,
      //    so we do this in two steps.
      const { data: bizRow, error: bizErr } = await supabase
        .from("businesses")
        .select("business_id")
        .eq("financial_identity_id", anonymizedId)
        .maybeSingle();

      if (bizErr || !bizRow) {
        setError("Business not found.");
        setLoading(false);
        return;
      }

      // 3. Verify active consent for this institution + business
      const { data: consent, error: cErr } = await supabase
        .from("consent_records")
        .select(`
          consent_id,
          business_id,
          granted_at,
          is_active,
          permissions,
          businesses (
            name,
            financial_identity_id,
            sector,
            kyc_status,
            registration_number
          )
        `)
        .eq("institution_id", instId)
        .eq("business_id", bizRow.business_id)
        .eq("is_active", true)
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cErr) { setError(cErr.message); setLoading(false); return; }

      if (!consent) {
        setError("No active consent found for this business. Access may have been revoked.");
        setLoading(false);
        return;
      }
      // 4. Fetch latest score — table is creditlinker_scores, all fields are top-level columns
      const { data: score } = await supabase
        .from("creditlinker_scores")
        .select(
          "composite_score, lender_risk, data_quality_score, data_months_analyzed, dimensions, computed_at"
        )
        .eq("business_id", bizRow.business_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const biz = (consent as any).businesses;

      const compositeScore = score?.composite_score ?? null;
      const lenderRisk     = score?.lender_risk     ?? null;
      const dataMonths     = score?.data_months_analyzed ?? 0;
      const dataQuality    = score?.data_quality_score   ?? null;

      const computedAt = score?.computed_at ? new Date(score.computed_at) : null;

      // Build "MMM YYYY - MMM YYYY" coverage range from end date minus months
      let coverageStr = "No data";
      if (computedAt && dataMonths > 0) {
        const endDate   = computedAt;
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - (dataMonths - 1));
        const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
        coverageStr = `${fmt(startDate)} - ${fmt(endDate)}`;
      }

      const expiryRaw = (consent.permissions as Record<string, unknown> | null)?.expires_at as string | undefined;
      const expiryStr = expiryRaw
        ? new Date(expiryRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;

      // dimensions — each key is either a raw number or { raw_score, grade, signal, trend }
      const rawDims = (score?.dimensions ?? {}) as Record<string, number | { raw_score?: number } | null>;
      const dimensions: DimensionScore[] = Object.entries(DIM_META).map(([key, meta]) => {
        const val = rawDims[key];
        const numeric =
          typeof val === "number" ? val
          : (typeof val === "object" && val !== null) ? (val.raw_score ?? 0)
          : 0;
        return { key, label: meta.label, color: meta.color, value: Math.round(numeric) };
      });

      // Recent transactions — no description column; use counterparty_cluster
      const { data: txRows } = await supabase
        .from("normalized_transactions")
        .select("id, date, amount, direction, category, counterparty_cluster")
        .eq("business_id", bizRow.business_id)
        .order("date", { ascending: false })
        .limit(6);

      const recentTx: Transaction[] = (txRows ?? []).map((tx: any) => ({
        description: tx.counterparty_cluster ?? "Transaction",
        amount:      tx.amount ?? 0,
        direction:   tx.direction as "credit" | "debit",
        date:        tx.date
          ? new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : "—",
        category: tx.category ?? "Other",
      }));

      setData({
        business_id:         bizRow.business_id,
        consent_id:          consent.consent_id,
        business_name:       biz?.name ?? null,
        anonymized_id:       anonymizedId,
        sector:              biz?.sector ?? null,
        kyc_status:          biz?.kyc_status ?? null,
        registration_number: biz?.registration_number ?? null,
        data_months:         dataMonths,
        coverage:            coverageStr,
        consent_expiry:      expiryStr,
        overall_score:       compositeScore,
        risk_level:          lenderRisk,
        data_quality_score:  dataQuality,
        dimensions,
        recent_transactions: recentTx,
      });

      setLoading(false);
    })();
  }, [user, anonymizedId]);

  /* ── Send opening message ── */
  async function sendMessage() {
    if (!msgBody.trim() || !data || !instId) return;
    setMsgSending(true);
    setMsgError(null);

    try {
      // Use the Edge Function — direct Supabase inserts are blocked by RLS
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${supabaseUrl}/functions/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          consent_id:   data.consent_id,
          content:      msgBody.trim(),
          sender_type:  "institution",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? `Send failed (${res.status})`);
      }

      setMsgOpen(false);
      setMsgBody("");
      router.push(`/financer/messages?consent=${data.consent_id}`);
    } catch (e: any) {
      setMsgError(e.message ?? "Failed to send message");
    } finally {
      setMsgSending(false);
    }
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={28} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading business profile…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── No ID in URL ── */
  if (!anonymizedId) return (
    <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
      No business ID provided.{" "}
      <Link href="/financer/businesses" style={{ color: "#B91C1C", fontWeight: 600 }}>Go back</Link>
    </div>
  );

  /* ── Error / no consent ── */
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/financer/businesses" style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to businesses
      </Link>
      <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
        <ShieldCheck size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 6 }}>Access unavailable</p>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>{error}</p>
        <Link href="/financer/businesses" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          Browse businesses <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );

  if (!data) return null;

  // Show real business name if available; fall back to anonymized slug
  const displayName = data.business_name ?? `BIZ-${data.anonymized_id.slice(0, 6).toUpperCase()}`;
  const shortId = displayName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Compose message modal ── */}
      {msgOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={15} color="#00D4FF" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: 2 }}>
                    Message {displayName}
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>This will open a message thread under active consent.</p>
                </div>
              </div>
              <button onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            {/* Modal body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {msgError && (
                <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
                  {msgError}
                </div>
              )}
              <textarea
                autoFocus
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Hi ${displayName}, I\'d like to discuss a financing opportunity…`}
                rows={5}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" as const, fontFamily: "inherit" }}
                onFocus={e => (e.target.style.borderColor = "#0A2540")}
                onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
              />
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>Press Enter to send · Shift+Enter for a new line</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }}
                  style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!msgBody.trim() || msgSending}
                  style={{ flex: 2, height: 42, borderRadius: 9, border: "none", background: msgBody.trim() && !msgSending ? "#0A2540" : "#E5E7EB", fontSize: 13, fontWeight: 700, color: msgBody.trim() && !msgSending ? "white" : "#9CA3AF", cursor: msgBody.trim() && !msgSending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.12s" }}
                >
                  {msgSending
                    ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
                    : <><Send size={13} /> Send Message</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/financer/businesses" style={{ color: "#9CA3AF", textDecoration: "none", fontWeight: 500 }}>Businesses</Link>
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
                {displayName}
              </h2>
              <Badge variant="success" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <ShieldCheck size={9} /> Consent active
              </Badge>
              {data.kyc_status === "verified" && (
                <Badge variant="secondary" style={{ fontSize: 10 }}>KYC Verified</Badge>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {data.sector ?? "Sector not disclosed"}
              {data.data_months > 0 ? ` · ${data.data_months}mo data · ${data.coverage}` : " · No pipeline data yet"}
              {data.consent_expiry && <> · Access expires <strong>{data.consent_expiry}</strong></>}
            </p>
          </div>
        </div>
        <Link
          href={`/financer/financial-analysis`}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          <TrendingUp size={13} /> Full Analysis
        </Link>
      </div>

      {/* Consent notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10 }}>
        <ShieldCheck size={13} style={{ color: "#00A8CC" }} />
        <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.5 }}>
          You are viewing this profile under an active consent agreement. Data is sourced exclusively from verified bank transaction records.
        </p>
      </div>

      {data.data_months === 0 ? (
        <Card>
          <div style={{ padding: "48px 24px", textAlign: "center" as const }}>
            <Info size={28} style={{ color: "#D1D5DB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No financial data yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              This business has granted consent but their financial identity snapshot hasn't been generated yet.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Score header */}
            {data.overall_score !== null && (
              <Card>
                <div style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
                  <div style={{ textAlign: "center" as const }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, color: "#0A2540", letterSpacing: "-0.05em", lineHeight: 1 }}>
                      {data.overall_score}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginTop: 4 }}>Creditlinker Score</p>
                  </div>
                  <div style={{ width: 1, height: 60, background: "#F3F4F6" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.risk_level && (
                      <Badge variant={riskVariant(data.risk_level)} style={{ fontSize: 11, padding: "4px 10px", width: "fit-content" }}>
                        {data.risk_level}
                      </Badge>
                    )}
                    {data.data_quality_score !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: "#10B981" }} />
                        <span style={{ fontSize: 12, color: "#6B7280" }}>
                          Data quality: <strong style={{ color: "#0A2540" }}>{data.data_quality_score}%</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Dimension scores */}
            <Card>
              <div style={{ padding: "18px 22px 0" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Financial Dimensions</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Six-axis financial health assessment</p>
              </div>
              <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {data.dimensions.map(d => (
                  <div key={d.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{d.label}</p>
                      <span style={{ fontSize: 16, fontWeight: 800, color: d.color, fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>{d.value}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent transactions */}
            {data.recent_transactions.length > 0 && (
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Transaction Signals</p>
                  <Link href="/financer/financial-analysis" style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                    Full analysis <ChevronRight size={12} />
                  </Link>
                </div>
                <div style={{ padding: "10px 0 8px" }}>
                  {data.recent_transactions.map((tx, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderBottom: i < data.recent_transactions.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: tx.direction === "credit" ? "#ECFDF5" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: tx.direction === "credit" ? "#10B981" : "#6B7280" }}>
                        {tx.direction === "credit" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{tx.date} · {tx.category}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: tx.direction === "credit" ? "#10B981" : "#0A2540", flexShrink: 0 }}>
                        {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Profile summary */}
            <Card>
              <div style={{ padding: "16px 18px 0" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540" }}>Profile Summary</p>
              </div>
              <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Business Name",  value: data.business_name ?? "Anonymized" },
                  { label: "Sector",          value: data.sector ?? "Not disclosed" },
                  { label: "KYC Status",      value: data.kyc_status ?? "Unknown" },
                  { label: "Reg. Number",     value: data.registration_number ?? "Not disclosed" },
                  { label: "Data Coverage",   value: data.coverage },
                  { label: "Months of Data",  value: data.data_months > 0 ? `${data.data_months} months` : "None yet" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{r.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", textAlign: "right" as const }}>{r.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card style={{ padding: "16px 18px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540", marginBottom: 12 }}>Actions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => { setMsgOpen(true); setMsgError(null); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0D3060")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#0A2540")}
                >
                  <MessageSquare size={13} /> Send Message
                </button>
                <Link href="/financer/financial-analysis" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <TrendingUp size={13} /> View Full Analysis
                </Link>
                <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <ArrowUpRight size={13} /> View Request
                </Link>
                <Link
                  href={`/financer/messages?consent=${data.consent_id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  <MessageSquare size={13} /> View All Messages
                </Link>
              </div>
            </Card>

            {/* Data notice */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
              <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>
                All data is sourced from verified bank transactions via Creditlinker's financial identity pipeline. Business identity remains anonymized to protect commercial confidentiality.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
