"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowUpRight, Building2, TrendingUp,
  ArrowDownLeft, ChevronRight, AlertCircle, Info, Loader2,
  CheckCircle2, MessageSquare, Send, X, Search, SlidersHorizontal,
  ChevronLeft, ArrowLeftRight, Repeat2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";
const PAGE_SIZE = 20;

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type DimensionScore = {
  key:   string;
  label: string;
  value: number;
  color: string;
};

type Transaction = {
  id:                   string;
  date:                 string;
  counterparty_cluster: string | null;
  amount:               number;
  direction:            "credit" | "debit";
  category:             string;
  is_recurring:         boolean;
  is_internal_transfer: boolean;
  flags:                string[];
  balance_after:        number | null;
};

type TransactionsResponse = {
  transactions: Transaction[];
  total:        number;
  page:         number;
  per_page:     number;
  total_pages:  number;
  stats: { total_in: number; total_out: number; net: number };
  meta: {
    categories:  string[];
    date_range:  { from: string; to: string } | null;
  };
};

type ProfileData = {
  business_id:         string;
  consent_id:          string;
  business_name:       string | null;
  anonymized_id:       string;
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
};

const DIM_META: Record<string, { label: string; color: string }> = {
  revenue_stability:       { label: "Revenue Stability",       color: "#10B981" },
  cashflow_predictability: { label: "Cashflow Predictability", color: "#38BDF8" },
  expense_discipline:      { label: "Expense Discipline",      color: "#818CF8" },
  liquidity_strength:      { label: "Liquidity Strength",      color: "#F59E0B" },
  financial_consistency:   { label: "Financial Consistency",   color: "#10B981" },
  risk_profile:            { label: "Risk Profile",            color: "#EF4444" },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function riskVariant(r: string | null) {
  if (!r) return "secondary" as const;
  if (r.toLowerCase().includes("low"))    return "success"     as const;
  if (r.toLowerCase().includes("medium")) return "warning"     as const;
  return "destructive" as const;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    Revenue: "#10B981", Payroll: "#F59E0B", Tax: "#EF4444",
    Operations: "#6B7280", Transfer: "#38BDF8", Rent: "#F59E0B",
  };
  return map[cat] ?? "#9CA3AF";
}

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 9999, border: "1.5px solid", borderColor: active ? "#0A2540" : "#E5E7EB", background: active ? "#0A2540" : "white", color: active ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
      {label}
    </button>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: color ?? "#0A2540", letterSpacing: "-0.03em" }}>{value}</p>
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
  const [token,   setToken]   = useState<string | null>(null);

  // Compose modal
  const [msgOpen,    setMsgOpen]    = useState(false);
  const [msgBody,    setMsgBody]    = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError,   setMsgError]   = useState<string | null>(null);
  const [instId,     setInstId]     = useState<string | null>(null);

  // Transactions panel
  const [txOpen,       setTxOpen]       = useState(false);
  const [txRows,       setTxRows]       = useState<Transaction[]>([]);
  const [txTotal,      setTxTotal]      = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txStats,      setTxStats]      = useState<{ total_in: number; total_out: number; net: number } | null>(null);
  const [txMeta,       setTxMeta]       = useState<{ categories: string[]; date_range: { from: string; to: string } | null } | null>(null);
  const [txLoading,    setTxLoading]    = useState(false);
  const [txError,      setTxError]      = useState<string | null>(null);

  // Transaction filters
  const [txPage,      setTxPage]      = useState(1);
  const [txSearch,    setTxSearch]    = useState("");
  const [txDebSearch, setTxDebSearch] = useState("");
  const [txDir,       setTxDir]       = useState("");
  const [txCat,       setTxCat]       = useState("");
  const [txFrom,      setTxFrom]      = useState("");
  const [txTo,        setTxTo]        = useState("");
  const [showTxFilters, setShowTxFilters] = useState(false);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => { setTxDebSearch(txSearch); setTxPage(1); }, 350);
    return () => clearTimeout(t);
  }, [txSearch]);

  /* ── Load profile ── */
  useEffect(() => {
    if (!user || !anonymizedId) return;

    (async () => {
      setLoading(true);
      setError(null);

      const resolvedInstId = await getMyInstitutionId(user.id);
      if (!resolvedInstId) { setError("No institution found."); setLoading(false); return; }
      setInstId(resolvedInstId);

      const { data: bizRow, error: bizErr } = await supabase
        .from("businesses")
        .select("business_id")
        .eq("financial_identity_id", anonymizedId)
        .maybeSingle();

      if (bizErr || !bizRow) { setError("Business not found."); setLoading(false); return; }

      const { data: consent, error: cErr } = await supabase
        .from("consent_records")
        .select(`
          consent_id, business_id, granted_at, is_active, permissions,
          businesses ( name, financial_identity_id, sector, kyc_status, registration_number )
        `)
        .eq("institution_id", resolvedInstId)
        .eq("business_id", bizRow.business_id)
        .eq("is_active", true)
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cErr)     { setError(cErr.message); setLoading(false); return; }
      if (!consent) { setError("No active consent found for this business. Access may have been revoked."); setLoading(false); return; }

      const { data: score } = await supabase
        .from("creditlinker_scores")
        .select("composite_score, lender_risk, data_quality_score, data_months_analyzed, dimensions, computed_at")
        .eq("business_id", bizRow.business_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const biz          = (consent as any).businesses;
      const dataMonths   = score?.data_months_analyzed ?? 0;
      const computedAt   = score?.computed_at ? new Date(score.computed_at) : null;

      let coverageStr = "No data";
      if (computedAt && dataMonths > 0) {
        const endDate   = computedAt;
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - (dataMonths - 1));
        const f = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
        coverageStr = `${f(startDate)} - ${f(endDate)}`;
      }

      const expiryRaw = (consent.permissions as Record<string, unknown> | null)?.expires_at as string | undefined;
      const expiryStr = expiryRaw
        ? new Date(expiryRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;

      const rawDims = (score?.dimensions ?? {}) as Record<string, number | { raw_score?: number } | null>;
      const dimensions: DimensionScore[] = Object.entries(DIM_META).map(([key, meta]) => {
        const val = rawDims[key];
        const numeric =
          typeof val === "number" ? val
          : (typeof val === "object" && val !== null) ? ((val as any).raw_score ?? 0)
          : 0;
        return { key, label: meta.label, color: meta.color, value: Math.round(numeric) };
      });

      // Store token for the transactions API call
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);

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
        overall_score:       score?.composite_score ?? null,
        risk_level:          score?.lender_risk ?? null,
        data_quality_score:  score?.data_quality_score ?? null,
        dimensions,
      });

      setLoading(false);
    })();
  }, [user, anonymizedId]);

  /* ── Fetch transactions from the API ── */
  const fetchTransactions = useCallback(async () => {
    if (!data || !token) return;
    setTxLoading(true);
    setTxError(null);

    try {
      const params = new URLSearchParams({
        view:        "transactions",
        business_id: data.business_id,
        page:        String(txPage),
        per_page:    String(PAGE_SIZE),
      });
      if (txDebSearch) params.set("search",    txDebSearch);
      if (txDir)       params.set("direction", txDir);
      if (txCat)       params.set("category",  txCat);
      if (txFrom)      params.set("from",      txFrom);
      if (txTo)        params.set("to",        txTo);

      const res = await fetch(
        `${API_BASE}/get-business-profile?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );

      if (!res.ok) {
        let errMsg = `Request failed (${res.status})`;
        try {
          const errBody = await res.json();
          errMsg = errBody.error ?? errBody.message ?? errMsg;
        } catch { /* non-JSON body */ }
        throw new Error(errMsg);
      }

      const json: TransactionsResponse = await res.json();
      setTxRows(json.transactions);
      setTxTotal(json.total);
      setTxTotalPages(json.total_pages);
      setTxStats(json.stats);
      if (json.meta) setTxMeta(json.meta);
    } catch (e: any) {
      setTxError(e.message ?? "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [data, token, txPage, txDebSearch, txDir, txCat, txFrom, txTo]);

  /* ── Fetch when transactions panel opens or filters change ── */
  useEffect(() => {
    if (txOpen && data && token) fetchTransactions();
  }, [txOpen, fetchTransactions]);

  /* ── Send message ── */
  async function sendMessage() {
    if (!msgBody.trim() || !data || !instId) return;
    setMsgSending(true);
    setMsgError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ consent_id: data.consent_id, content: msgBody.trim(), sender_type: "institution" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Send failed (${res.status})`);
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

  const clearTxFilters = () => {
    setTxSearch(""); setTxDebSearch(""); setTxDir(""); setTxCat(""); setTxFrom(""); setTxTo(""); setTxPage(1);
  };
  const hasTxFilters = !!(txDebSearch || txDir || txCat || txFrom || txTo);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={28} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading business profile…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!anonymizedId) return (
    <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>
      No business ID provided. <Link href="/financer/businesses" style={{ color: "#B91C1C", fontWeight: 600 }}>Go back</Link>
    </div>
  );

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

  const displayName = data.business_name ?? `BIZ-${data.anonymized_id.slice(0, 6).toUpperCase()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Message modal ── */}
      {msgOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={15} color="#00D4FF" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 2 }}>Message {displayName}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>This will open a message thread under active consent.</p>
                </div>
              </div>
              <button onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {msgError && <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>{msgError}</div>}
              <textarea autoFocus value={msgBody} onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Hi ${displayName}, I'd like to discuss a financing opportunity…`}
                rows={5} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, color: "#0A2540", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" as const, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setMsgOpen(false); setMsgBody(""); setMsgError(null); }}
                  style={{ flex: 1, height: 42, borderRadius: 9, border: "1px solid #E5E7EB", background: "white", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
                <button onClick={sendMessage} disabled={!msgBody.trim() || msgSending}
                  style={{ flex: 2, height: 42, borderRadius: 9, border: "none", background: msgBody.trim() && !msgSending ? "#0A2540" : "#E5E7EB", fontSize: 13, fontWeight: 700, color: msgBody.trim() && !msgSending ? "white" : "#9CA3AF", cursor: msgBody.trim() && !msgSending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {msgSending ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : <><Send size={13} /> Send Message</>}
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
        <span style={{ color: "#0A2540", fontWeight: 600 }}>{displayName}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#00D4FF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#0A2540", letterSpacing: "-0.03em", margin: 0 }}>{displayName}</h2>
              <Badge variant="success" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <ShieldCheck size={9} /> Consent active
              </Badge>
              {data.kyc_status === "verified" && <Badge variant="secondary" style={{ fontSize: 10 }}>KYC Verified</Badge>}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>
              {data.sector ?? "Sector not disclosed"}
              {data.data_months > 0 ? ` · ${data.data_months}mo data · ${data.coverage}` : " · No pipeline data yet"}
              {data.consent_expiry && <> · Access expires <strong>{data.consent_expiry}</strong></>}
            </p>
          </div>
        </div>
        <Link href="/financer/financial-analysis" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
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
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>This business has granted consent but their financial identity snapshot hasn't been generated yet.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Score */}
            {data.overall_score !== null && (
              <Card>
                <div style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
                  <div style={{ textAlign: "center" as const }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, color: "#0A2540", letterSpacing: "-0.05em", lineHeight: 1 }}>{data.overall_score}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginTop: 4 }}>Creditlinker Score</p>
                  </div>
                  <div style={{ width: 1, height: 60, background: "#F3F4F6" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.risk_level && (
                      <Badge variant={riskVariant(data.risk_level)} style={{ fontSize: 11, padding: "4px 10px", width: "fit-content" }}>{data.risk_level}</Badge>
                    )}
                    {data.data_quality_score !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={12} style={{ color: "#10B981" }} />
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Data quality: <strong style={{ color: "#0A2540" }}>{data.data_quality_score}%</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Dimensions */}
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

            {/* ── TRANSACTIONS PANEL ── */}
            <Card>
              <button
                onClick={() => setTxOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Transaction Records</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    {txOpen && txTotal > 0
                      ? `${txTotal.toLocaleString()} transactions · ${txMeta?.date_range ? `${fmtDate(txMeta.date_range.from)} – ${fmtDate(txMeta.date_range.to)}` : ""}`
                      : "Verified bank transactions underlying this score"}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "#9CA3AF", transform: txOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </button>

              {txOpen && (
                <div style={{ borderTop: "1px solid #F3F4F6" }}>

                  {/* Stats row */}
                  {txStats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "14px 22px" }}>
                      <StatBox label="Total In"  value={fmt(txStats.total_in)}           color="#10B981" />
                      <StatBox label="Total Out" value={fmt(txStats.total_out)}           color="#EF4444" />
                      <StatBox label="Net Flow"  value={fmt(Math.abs(txStats.net))}       color={txStats.net >= 0 ? "#10B981" : "#EF4444"} />
                    </div>
                  )}

                  {/* Filters */}
                  <div style={{ padding: "0 22px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* Search */}
                      <div style={{ position: "relative" as const, flex: 1 }}>
                        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
                        <input
                          value={txSearch}
                          onChange={e => setTxSearch(e.target.value)}
                          placeholder="Search counterparty…"
                          style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#0A2540", outline: "none", boxSizing: "border-box" as const }}
                        />
                        {txSearch && (
                          <button onClick={() => setTxSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setShowTxFilters(f => !f)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", height: 34, border: "1.5px solid", borderRadius: 8, borderColor: showTxFilters ? "#0A2540" : "#E5E7EB", background: showTxFilters ? "#0A2540" : "white", color: showTxFilters ? "white" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <SlidersHorizontal size={12} /> Filters
                        {hasTxFilters && <span style={{ width: 5, height: 5, borderRadius: "50%", background: showTxFilters ? "#00D4FF" : "#0A2540" }} />}
                      </button>
                      {hasTxFilters && (
                        <button onClick={clearTxFilters} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
                          <X size={11} /> Clear
                        </button>
                      )}
                    </div>

                    {showTxFilters && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 14px", background: "#F9FAFB", borderRadius: 10 }}>
                        {/* Direction */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Direction</span>
                          {["", "credit", "debit"].map(d => (
                            <FilterPill key={d} label={d === "" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)} active={txDir === d} onClick={() => { setTxDir(d); setTxPage(1); }} />
                          ))}
                        </div>
                        {/* Category */}
                        {txMeta && txMeta.categories.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Category</span>
                            <FilterPill label="All" active={txCat === ""} onClick={() => { setTxCat(""); setTxPage(1); }} />
                            {txMeta.categories.map(c => (
                              <FilterPill key={c} label={c} active={txCat === c} onClick={() => { setTxCat(c); setTxPage(1); }} />
                            ))}
                          </div>
                        )}
                        {/* Date range */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", minWidth: 60 }}>Date</span>
                          <input type="date" value={txFrom} max={txTo || undefined}
                            onChange={e => { setTxFrom(e.target.value); setTxPage(1); }}
                            style={{ height: 30, padding: "0 8px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 12, color: txFrom ? "#0A2540" : "#9CA3AF", outline: "none" }} />
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>to</span>
                          <input type="date" value={txTo} min={txFrom || undefined}
                            onChange={e => { setTxTo(e.target.value); setTxPage(1); }}
                            style={{ height: 30, padding: "0 8px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 12, color: txTo ? "#0A2540" : "#9CA3AF", outline: "none" }} />
                          {(txFrom || txTo) && (
                            <button onClick={() => { setTxFrom(""); setTxTo(""); setTxPage(1); }} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                              <X size={11} /> Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction rows */}
                  <div style={{ borderTop: "1px solid #F3F4F6", opacity: txLoading ? 0.5 : 1, transition: "opacity 0.15s" }}>
                    {txError ? (
                      <div style={{ padding: "24px 22px", display: "flex", alignItems: "center", gap: 10 }}>
                        <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: "#EF4444" }}>{txError}</p>
                      </div>
                    ) : txLoading && txRows.length === 0 ? (
                      <div style={{ padding: "32px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Loader2 size={16} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
                        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading transactions…</p>
                      </div>
                    ) : txRows.length === 0 ? (
                      <div style={{ padding: "32px 22px", textAlign: "center" as const }}>
                        <p style={{ fontSize: 13, color: "#9CA3AF" }}>No transactions match the current filters.</p>
                      </div>
                    ) : (
                      txRows.map((tx, i) => (
                        <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 22px", borderBottom: i < txRows.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                          {/* Direction icon */}
                          <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.is_internal_transfer ? "rgba(56,189,248,0.1)" : tx.direction === "credit" ? "#ECFDF5" : "#F3F4F6", color: tx.is_internal_transfer ? "#38BDF8" : tx.direction === "credit" ? "#10B981" : "#6B7280" }}>
                            {tx.is_internal_transfer ? <ArrowLeftRight size={12} /> : tx.direction === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          </div>
                          {/* Description + meta */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" as const }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {tx.counterparty_cluster ?? tx.category}
                              </p>
                              {tx.is_recurring && <Repeat2 size={10} style={{ color: "#9CA3AF", flexShrink: 0 }} />}
                              {(tx.flags ?? []).length > 0 && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 4 }}>Flag</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(tx.date)}</p>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: categoryColor(tx.category) }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: categoryColor(tx.category) }} />
                                {tx.category}
                              </span>
                              {tx.balance_after !== null && (
                                <span style={{ fontSize: 10, color: "#9CA3AF" }}>bal. {fmt(tx.balance_after)}</span>
                              )}
                            </div>
                          </div>
                          {/* Amount */}
                          <p style={{ fontSize: 13, fontWeight: 700, color: tx.direction === "credit" ? "#10B981" : "#0A2540", flexShrink: 0 }}>
                            {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {txTotalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderTop: "1px solid #F3F4F6" }}>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                        {(txPage - 1) * PAGE_SIZE + 1}–{Math.min(txPage * PAGE_SIZE, txTotal)} of {txTotal.toLocaleString()}
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: txPage === 1 ? "not-allowed" : "pointer", color: txPage === 1 ? "#D1D5DB" : "#374151" }}>
                          <ChevronLeft size={13} />
                        </button>
                        {Array.from({ length: Math.min(txTotalPages, 5) }, (_, i) => {
                          let p = i + 1;
                          if (txTotalPages > 5) {
                            if (txPage <= 3)               p = i + 1;
                            else if (txPage >= txTotalPages - 2) p = txTotalPages - 4 + i;
                            else                             p = txPage - 2 + i;
                          }
                          return (
                            <button key={p} onClick={() => setTxPage(p)}
                              style={{ width: 30, height: 30, borderRadius: 7, border: "1.5px solid", borderColor: txPage === p ? "#0A2540" : "#E5E7EB", background: txPage === p ? "#0A2540" : "white", color: txPage === p ? "white" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              {p}
                            </button>
                          );
                        })}
                        <button onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: txPage === txTotalPages ? "not-allowed" : "pointer", color: txPage === txTotalPages ? "#D1D5DB" : "#374151" }}>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Data note */}
                  <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Transactions are normalized bank records from Creditlinker's ingestion pipeline. Raw bank descriptions are clustered into counterparty names.</p>
                  </div>
                </div>
              )}
            </Card>

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
                <button onClick={() => { setMsgOpen(true); setMsgError(null); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}>
                  <MessageSquare size={13} /> Send Message
                </button>
                <Link href="/financer/financial-analysis" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <TrendingUp size={13} /> View Full Analysis
                </Link>
                <Link href="/financer/requests" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <ArrowUpRight size={13} /> View Request
                </Link>
                <Link href={`/financer/messages?consent=${data.consent_id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#0A2540", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
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
