"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShieldCheck, ArrowLeftRight, Banknote, TrendingUp,
  ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle,
  ChevronRight, Plus, Zap, Clock, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveBusiness } from "@/lib/business-context";
import { supabase } from "@/lib/supabase";

interface ScoreRow {
  composite_score:      number;
  lender_risk:          string;
  risk_level:           string; // legacy alias — use lender_risk for risk, getScoreLabel() for display
  dimensions: {
    revenue_stability?:       number;
    cashflow_predictability?: number;
    expense_discipline?:      number;
    liquidity_strength?:      number;
    financial_consistency?:   number;
    risk_profile?:            number;
  };
  data_quality_score:   number | null;
  data_months_analyzed: number | null;
}

interface LinkedAccount {
  account_id:            string;
  bank_name:             string;
  account_number_masked: string;
  is_primary:            boolean;
  last_synced:           string | null;
}

interface Transaction {
  id:                   string;
  counterparty_cluster: string | null;
  amount:               number;
  direction:            "credit" | "debit";
  date:                 string;
  category:             string | null;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `N${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `N${(n / 1_000).toFixed(0)}K`;
  return `N${n}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function relativeDate(iso: string | null): string {
  if (!iso) return "No sync yet";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  === 1) return "Yesterday";
  return `${days}d ago`;
}

function riskColor(level: string): string {
  if (level?.toLowerCase().includes("low"))    return "#10B981";
  if (level?.toLowerCase().includes("medium")) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 900) return { label: 'Excellent',  color: '#10B981' };
  if (score >= 800) return { label: 'Very Good',  color: '#38BDF8' };
  if (score >= 700) return { label: 'Good',        color: '#818CF8' };
  if (score >= 600) return { label: 'Fair',        color: '#F59E0B' };
  if (score >= 500) return { label: 'Poor',        color: '#F97316' };
  return                     { label: 'Very Poor', color: '#EF4444' };
}

function buildDimensions(score: ScoreRow) {
  const d = score.dimensions ?? {};
  const extract = (v: any): number | undefined => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && 'raw_score' in v) return v.raw_score;
    return undefined;
  };
  return [
    { label: "Revenue Stability",       value: extract(d.revenue_stability),       color: "#10B981" },
    { label: "Cashflow Predictability", value: extract(d.cashflow_predictability), color: "#38BDF8" },
    { label: "Expense Discipline",      value: extract(d.expense_discipline),      color: "#818CF8" },
    { label: "Liquidity Strength",      value: extract(d.liquidity_strength),      color: "#F59E0B" },
    { label: "Financial Consistency",   value: extract(d.financial_consistency),   color: "#10B981" },
    { label: "Risk Profile",            value: extract(d.risk_profile),            color: "#EF4444" },
  ].filter((x) => x.value !== null && x.value !== undefined) as { label: string; value: number; color: string }[];
}

function ScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / max);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle cx="55" cy="55" r={r} fill="none" stroke="#00D4FF" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25} transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="55" y="51" textAnchor="middle" fontSize="22" fontWeight="800"
        fill="#0A2540" fontFamily="var(--font-display)" letterSpacing="-1">{score}</text>
      <text x="55" y="64" textAnchor="middle" fontSize="9" fontWeight="500"
        fill="#9CA3AF" fontFamily="var(--font-display)">
        out of 1,000
      </text>
    </svg>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>{children}</div>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>{title}</p>
      {action}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, accent = false, loading = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent?: boolean; loading?: boolean;
}) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: accent ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: accent ? "#00D4FF" : "#6B7280" }}>
          {icon}
        </div>
      </div>
      {loading
        ? <div style={{ height: 32, width: 64, background: "#F3F4F6", borderRadius: 6, marginBottom: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
        : <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{value}</p>
      }
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </Card>
  );
}

function Skeleton({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: "#F3F4F6", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

function EmptyState({ icon, message, cta, href }: { icon: React.ReactNode; message: string; cta: string; href: string }) {
  return (
    <div style={{ padding: "32px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
      <div style={{ color: "#D1D5DB" }}>{icon}</div>
      <p style={{ fontSize: 13, color: "#9CA3AF" }}>{message}</p>
      <Link href={href} style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", textDecoration: "underline", textUnderlineOffset: 3 }}>{cta}</Link>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, activeBusiness, isLoading: bizLoading, refetch } = useActiveBusiness();

  const [score,        setScore]        = useState<ScoreRow | null>(null);
  const [accounts,     setAccounts]     = useState<LinkedAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineStatus,  setPipelineStatus]  = useState<{ type: 'success' | 'error' | 'cached'; message: string } | null>(null);

  const fetchDashboardData = async (businessId: string) => {
    setDataLoading(true);
    const [scoreRes, accountsRes, txRes] = await Promise.all([
      supabase
        .from("creditlinker_scores")
        .select("composite_score, lender_risk, dimensions, data_quality_score, data_months_analyzed")
        .eq("business_id", businessId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("linked_accounts")
        .select("account_id, bank_name, account_number_masked, is_primary, last_synced")
        .eq("business_id", businessId)
        .order("is_primary", { ascending: false }),
      supabase
        .from("normalized_transactions")
        .select("id, counterparty_cluster, amount, direction, date, category")
        .eq("business_id", businessId)
        .order("date", { ascending: false })
        .limit(5),
    ]);
    setScore(scoreRes.data ?? null);
    setAccounts(accountsRes.data ?? []);
    setTransactions(txRes.data ?? []);
    setDataLoading(false);
  };

  useEffect(() => {
    if (activeBusiness?.business_id) fetchDashboardData(activeBusiness.business_id);
  }, [activeBusiness?.business_id]);

  const handleRunPipeline = async () => {
    if (!activeBusiness) return;
    setRunningPipeline(true);
    setPipelineStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('/rest/v1', '') + '/functions/v1';
      const res = await fetch(`${functionsUrl}/run-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ business_id: activeBusiness.business_id, sync_reason: 'user_requested' }),
      });
      const data = await res.json();
      if (data?.cached) {
        setPipelineStatus({ type: 'cached', message: data.reason ?? 'Pipeline ran recently. Please try again later.' });
      } else if (data?.status === 'success' || data?.status === 'partial') {
        await fetchDashboardData(activeBusiness.business_id);
        setPipelineStatus({ type: 'success', message: `Pipeline complete. Score: ${data.composite_score?.raw_score ?? data.composite_score ?? 'updated'}.` });
      } else {
        setPipelineStatus({ type: 'error', message: data?.errors?.[0]?.message ?? data?.error ?? 'Pipeline did not complete successfully.' });
      }
    } catch (err: any) {
      setPipelineStatus({ type: 'error', message: err?.message ?? 'Failed to run pipeline.' });
    } finally {
      setRunningPipeline(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeBusiness) return;
    setRefreshing(true);
    await Promise.all([refetch(), fetchDashboardData(activeBusiness.business_id)]);
    setRefreshing(false);
  };

  const firstName    = currentUser.full_name.split(" ")[0];
  const loading      = bizLoading || dataLoading;
  const dimensions   = score ? buildDimensions(score) : [];
  const coverageText = score?.data_months_analyzed ? `${score.data_months_analyzed} months of data` : "No data yet";
  const showKycNudge     = activeBusiness?.kyc_status === "unverified";
  const showProfileNudge = activeBusiness?.profile_status === "incomplete" && !showKycNudge;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 900px) { .db-main-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .db-score-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
              {greeting()}, {firstName || "..."} 
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{bizLoading ? "Loading..." : (activeBusiness?.name ?? "No business found")}</span>
              {!loading && <><span style={{ color: "#E5E7EB" }}>.</span><span style={{ fontSize: 13, color: "#6B7280" }}>{coverageText}</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" style={{ gap: 6, height: 36 }} onClick={handleRefresh} disabled={refreshing || runningPipeline}>
                {refreshing ? <><Loader2 size={13} className="animate-spin" /> Refreshing...</> : <><RefreshCw size={13} /> Refresh Data</>}
              </Button>
              <Button variant="primary" size="sm" style={{ gap: 6, height: 36 }} onClick={handleRunPipeline} disabled={runningPipeline || refreshing}>
                {runningPipeline ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Zap size={13} /> Run Pipeline</>}
              </Button>
            </div>
            {pipelineStatus && (
              <p style={{
                fontSize: 11, fontWeight: 500,
                color: pipelineStatus.type === 'success' ? '#10B981' : pipelineStatus.type === 'cached' ? '#F59E0B' : '#EF4444',
              }}>
                {pipelineStatus.message}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <MetricCard label="Financial Score"  value={score ? String(score.composite_score) : "No score"}           sub={score ? "Out of 1,000" : "Run pipeline to generate"}         icon={<ShieldCheck size={16} />} accent loading={loading} />
          <MetricCard label="Data Quality"     value={score?.data_quality_score ? `${score.data_quality_score}%` : "No data"} sub={score?.data_quality_score ? "High confidence" : "No data yet"} icon={<Zap size={16} />} loading={loading} />
          <MetricCard label="Linked Accounts"  value={loading ? "..." : String(accounts.length)}                    sub={accounts.length > 0 ? "All synced" : "No accounts linked"}    icon={<ArrowLeftRight size={16} />} loading={loading} />
          <MetricCard label="Data Coverage"    value={score?.data_months_analyzed ? `${score.data_months_analyzed} mo` : "None"} sub={coverageText}                                    icon={<Clock size={16} />} loading={loading} />
        </div>

        <div className="db-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <Card>
              <CardHeader title="Financial Identity"
                action={<Link href="/financial-identity" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>View full identity <ChevronRight size={13} /></Link>}
              />
              {loading ? (
                <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <Skeleton height={110} /><Skeleton height={10} /><Skeleton height={10} width="80%" /><Skeleton height={10} width="60%" />
                </div>
              ) : score ? (
                <div className="db-score-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, padding: "18px 22px 22px", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <ScoreRing score={score.composite_score} />
                    <Badge variant="success" style={{ fontSize: 10, color: getScoreLabel(score.composite_score).color }}>{getScoreLabel(score.composite_score).label}</Badge>
                    {score.lender_risk && (
                      <p style={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>
                        {score.lender_risk.charAt(0).toUpperCase() + score.lender_risk.slice(1)} credit risk
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dimensions.map((d) => (
                      <div key={d.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{d.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${d.value}%`, background: d.color, borderRadius: 9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={<TrendingUp size={32} />} message="No score yet. Connect a bank account and run the pipeline to generate your financial identity." cta="Connect a bank account" href="/data-sources" />
              )}
            </Card>

            <Card>
              <CardHeader title="Recent Transactions"
                action={<Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>View all <ChevronRight size={13} /></Link>}
              />
              {loading ? (
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[1,2,3].map((i) => <Skeleton key={i} height={36} />)}
                </div>
              ) : transactions.length > 0 ? (
                <div style={{ padding: "10px 0 8px" }}>
                  {transactions.map((tx, i) => (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderBottom: i < transactions.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2", color: tx.direction === "credit" ? "#10B981" : "#EF4444" }}>
                        {tx.direction === "credit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{tx.counterparty_cluster ?? "Unknown"}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{relativeDate(tx.date)} · {tx.category ?? "Uncategorized"}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, color: tx.direction === "credit" ? "#10B981" : "#0A2540" }}>
                        {tx.direction === "credit" ? "+" : "-"}{fmt(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<ArrowLeftRight size={32} />} message="No transactions yet. Link a bank account to start seeing your data here." cta="Link a bank account" href="/data-sources" />
              )}
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <Card>
              <CardHeader title="Linked Accounts"
                action={<Link href="/data-sources" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}><Plus size={12} /> Add</Link>}
              />
              {loading ? (
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <Skeleton height={40} /><Skeleton height={40} />
                </div>
              ) : accounts.length > 0 ? (
                <div style={{ padding: "10px 0 8px" }}>
                  {accounts.map((acc, i) => (
                    <div key={acc.account_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < accounts.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0A2540" }}>
                        {acc.bank_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{acc.bank_name}</p>
                          {acc.is_primary && <Badge variant="secondary" style={{ fontSize: 9, padding: "1px 6px" }}>Primary</Badge>}
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{acc.account_number_masked} · {relativeDate(acc.last_synced)}</p>
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<ArrowLeftRight size={28} />} message="No bank accounts linked yet." cta="Connect your first account" href="/data-sources" />
              )}
            </Card>

            <Card>
              <CardHeader title="Financing Matches"
                action={<Link href="/financing" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>Explore <ChevronRight size={13} /></Link>}
              />
              {score ? (
                <div style={{ padding: "16px 22px" }}>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 12 }}>
                    Your score of <strong style={{ color: "#0A2540" }}>{score.composite_score}</strong> qualifies you for financing matches. Visit the Financing page to see which capital providers match your profile.
                  </p>
                  <Link href="/financing" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                    <Banknote size={14} /> Browse financers
                  </Link>
                </div>
              ) : (
                <EmptyState icon={<Banknote size={28} />} message="Generate your financial score to unlock financing matches." cta="Get started" href="/data-sources" />
              )}
            </Card>

            {showKycNudge && (
              <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlertCircle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>Verify your identity</p>
                  <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.5, marginBottom: 10 }}>Upload your CAC documents to unlock full verification and improve your score.</p>
                  <Link href="/documents" style={{ fontSize: 12, fontWeight: 700, color: "#92400E", textDecoration: "underline", textUnderlineOffset: 3 }}>Upload documents</Link>
                </div>
              </div>
            )}

            {showProfileNudge && (
              <div style={{ background: "#EFF6FF", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlertCircle size={15} style={{ color: "#3B82F6", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 3 }}>Complete your profile</p>
                  <p style={{ fontSize: 12, color: "#1D4ED8", lineHeight: 1.5, marginBottom: 10 }}>Add your business sector and registration details to strengthen your financial identity.</p>
                  <Link href="/business-profile" style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", textDecoration: "underline", textUnderlineOffset: 3 }}>Complete profile</Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
