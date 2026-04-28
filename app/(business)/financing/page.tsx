"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Banknote, CheckCircle2, Clock, XCircle, ChevronRight,
  ArrowUpRight, AlertCircle, Building2, Filter,
  TrendingUp, ShieldCheck, Landmark, X, Lightbulb,
  CircleCheck, CircleMinus, CircleX, Info, Loader2,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────
   API HELPER
───────────────────────────────────────────────────────── */
const FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "") +
  "/functions/v1";

async function callFn(
  name: string,
  body?: Record<string, unknown>,
  method: "POST" | "GET" = "POST"
): Promise<any> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `${name} failed (${res.status})`);
  return json;
}

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type CriterionResult = "pass" | "partial" | "fail";

interface AssessmentCriterion {
  label: string;
  result: CriterionResult;
  weight: "high" | "medium" | "low";
  your_value: string;
  required_value: string;
  note: string;
}

interface ReadinessItem {
  assessment_id: string;
  finance_type: string;
  capital_category: string;
  label: string;
  readiness_score: number;
  status: "eligible" | "conditional" | "not_ready";
  amount_range: string;
  definition: string;
  summary: string;
  criteria: AssessmentCriterion[];
  how_to_improve?: string;
}

interface Installment {
  id: string;
  amount: number;
  reference: string;
  submitted_at: string;
  status: "pending" | "verified";
}

interface ActiveFinancingRecord {
  financing_id: string;
  institution_name: string;
  institution_type: string;
  capital_category: string;
  terms: { amount?: number; rate?: string; tenure?: string; due?: string };
  status: "active" | "settled" | "disputed" | "withdrawn";
  granted_at: string;
  settlement_proof: { installments: Installment[]; total_paid: number };
}

interface MarketplaceItem {
  match_id: string;
  institution_id: string;
  name: string;
  type: string;
  capital_category: string;
  label: string;
  match_score: number;
  amount_range: string;
  rate: string;
  tenure: string;
  turnaround: string;
  status: string;
  access_requested_at: string | null;
  consent_granted: boolean;
}

/* ─────────────────────────────────────────────────────────
   STATIC MAPS
───────────────────────────────────────────────────────── */
const CAPITAL_DEFINITIONS: Record<string, string> = {
  working_capital_loan:
    "Short-term loan for stock, salaries and supplier payments.",
  invoice_financing:
    "Get paid upfront on invoices; the financier collects from your client.",
  revenue_advance:
    "Cash now, repaid as a cut of your future monthly revenue.",
  equipment_financing:
    "Loan to buy machinery or vehicles, using the equipment as collateral.",
  overdraft_facility:
    "Spend beyond your balance when needed; repay as cash comes in.",
  term_loan:
    "Lump sum repaid in fixed monthly instalments over 1–5 years.",
};

const CAPITAL_LABELS: Record<string, string> = {
  working_capital_loan: "Working Capital Loan",
  invoice_financing: "Invoice Financing",
  revenue_advance: "Revenue Advance",
  equipment_financing: "Equipment Financing",
  overdraft_facility: "Overdraft Facility",
  term_loan: "Term Loan",
};

const CAPITAL_FILTERS = [
  "All",
  "Working Capital",
  "Invoice",
  "Revenue",
  "Equipment",
];

/* ─────────────────────────────────────────────────────────
   MAPPING HELPERS
───────────────────────────────────────────────────────── */
function mapReadinessStatus(
  dbStatus: string
): "eligible" | "conditional" | "not_ready" {
  if (dbStatus === "ready") return "eligible";
  if (dbStatus === "almost_ready") return "conditional";
  return "not_ready";
}

function mapReadinessItem(r: any): ReadinessItem {
  const status = mapReadinessStatus(r.status);
  const actions = (r.improvement_actions ?? []) as { action: string }[];
  const howTo =
    actions.length > 0
      ? actions.map((a: any) => a.action).join(" ")
      : undefined;
  const strengths = (r.strengths ?? []) as { label: string }[];
  const summary =
    strengths.length > 0
      ? `Strong ${strengths
          .map((s: any) => s.label.toLowerCase())
          .join(", ")} — see criteria for full breakdown.`
      : status === "not_ready"
      ? "Several key criteria are not yet met. Review the breakdown below."
      : "Review the criteria breakdown for details.";
  // Remap criteria from SDK shape to UI shape
  const criteria: AssessmentCriterion[] = (r.criteria ?? []).map((c: any) => {
    const w = typeof c.weight === 'number'
      ? c.weight >= 0.18 ? 'high' : c.weight >= 0.12 ? 'medium' : 'low'
      : (c.weight as string);
    return {
      label:          c.label,
      result:         (c.pass ?? c.result ?? 'fail') as CriterionResult,
      weight:         w as 'high' | 'medium' | 'low',
      your_value:     String(c.your_value ?? '—'),
      required_value: String(c.required_value ?? '—'),
      note:           c.note ?? '',
    };
  });

  return {
    assessment_id: r.assessment_id,
    finance_type: r.finance_type ?? r.capital_category,
    capital_category: r.capital_category,
    label:
      CAPITAL_LABELS[r.finance_type as string] ??
      CAPITAL_LABELS[r.capital_category] ??
      r.capital_category,
    readiness_score: r.readiness_score,
    status,
    amount_range: r.amount_range?.display ?? "—",
    definition:
      CAPITAL_DEFINITIONS[r.finance_type as string] ??
      CAPITAL_DEFINITIONS[r.capital_category] ??
      "Capital product.",
    summary,
    criteria,
    how_to_improve: howTo,
  };
}

function mapMarketplaceItem(m: any): MarketplaceItem {
  return {
    ...m,
    label: CAPITAL_LABELS[m.capital_category] ?? m.capital_category,
  };
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : `₦${(n / 1_000).toFixed(0)}K`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readinessColor(score: number) {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function statusConfig(status: ActiveFinancingRecord["status"]) {
  return {
    active: { variant: "success" as const, label: "Active" },
    settled: { variant: "outline" as const, label: "Settled" },
    disputed: { variant: "destructive" as const, label: "Disputed" },
    withdrawn: { variant: "secondary" as const, label: "Withdrawn" },
  }[status];
}

/* ─────────────────────────────────────────────────────────
   CARD SHELL
───────────────────────────────────────────────────────── */
function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "20px 24px 0",
        gap: 12,
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "#0A2540",
            letterSpacing: "-0.02em",
            marginBottom: sub ? 3 : 0,
          }}
        >
          {title}
        </p>
        {sub && <p style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ASSESSMENT DRAWER
───────────────────────────────────────────────────────── */
function criterionIcon(result: CriterionResult) {
  if (result === "pass")
    return (
      <CircleCheck size={15} style={{ color: "#10B981", flexShrink: 0 }} />
    );
  if (result === "partial")
    return (
      <CircleMinus size={15} style={{ color: "#F59E0B", flexShrink: 0 }} />
    );
  return <CircleX size={15} style={{ color: "#EF4444", flexShrink: 0 }} />;
}

function weightLabel(w: string) {
  if (w === "high")
    return { label: "High weight", color: "#EF4444", bg: "#FEF2F2" };
  if (w === "medium")
    return { label: "Medium weight", color: "#F59E0B", bg: "#FFFBEB" };
  return { label: "Low weight", color: "#9CA3AF", bg: "#F3F4F6" };
}

function AssessmentDrawer({
  item,
  onClose,
}: {
  item: ReadinessItem;
  onClose: () => void;
}) {
  const color = readinessColor(item.readiness_score);
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = circ * (item.readiness_score / 100);
  const passCount = item.criteria.filter((c) => c.result === "pass").length;
  const partialCount = item.criteria.filter(
    (c) => c.result === "partial"
  ).length;
  const failCount = item.criteria.filter((c) => c.result === "fail").length;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(10,37,64,0.4)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          width: "min(520px, 100vw)",
          background: "white",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto" as const,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F3F4F6",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#0A2540",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.label}
                </p>
                <Badge
                  variant={
                    item.status === "eligible"
                      ? "success"
                      : item.status === "conditional"
                      ? "warning"
                      : "destructive"
                  }
                  style={{ fontSize: 10 }}
                >
                  {item.status === "eligible"
                    ? "Eligible"
                    : item.status === "conditional"
                    ? "Conditional"
                    : "Not Ready"}
                </Badge>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginBottom: 6,
                }}
              >
                Readiness assessment · {item.amount_range}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  lineHeight: 1.6,
                  maxWidth: 360,
                }}
              >
                {item.definition}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                padding: 4,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Score + summary */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            style={{ flexShrink: 0 }}
          >
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="7"
            />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={circ * 0.25}
              transform="rotate(-90 40 40)"
            />
            <text
              x="40"
              y="36"
              textAnchor="middle"
              fontSize="18"
              fontWeight="800"
              fill="#0A2540"
              fontFamily="var(--font-display)"
            >
              {item.readiness_score}
            </text>
            <text
              x="40"
              y="50"
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#9CA3AF"
              fontFamily="var(--font-display)"
            >
              / 100
            </text>
          </svg>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                color: "#374151",
                lineHeight: 1.65,
                marginBottom: 12,
              }}
            >
              {item.summary}
            </p>
            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}
            >
              {passCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#10B981",
                    background: "#ECFDF5",
                    padding: "3px 9px",
                    borderRadius: 9999,
                  }}
                >
                  <CircleCheck size={10} /> {passCount} passed
                </span>
              )}
              {partialCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#F59E0B",
                    background: "#FFFBEB",
                    padding: "3px 9px",
                    borderRadius: 9999,
                  }}
                >
                  <CircleMinus size={10} /> {partialCount} partial
                </span>
              )}
              {failCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#EF4444",
                    background: "#FEF2F2",
                    padding: "3px 9px",
                    borderRadius: 9999,
                  }}
                >
                  <CircleX size={10} /> {failCount} failed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              marginBottom: 14,
            }}
          >
            Criteria breakdown
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {item.criteria.map((c, i) => {
              const wl = weightLabel(c.weight);
              const borderColor =
                c.result === "pass"
                  ? "#D1FAE5"
                  : c.result === "partial"
                  ? "#FEF3C7"
                  : "#FEE2E2";
              const bg =
                c.result === "pass"
                  ? "#F0FDF4"
                  : c.result === "partial"
                  ? "#FFFBEB"
                  : "#FEF2F2";
              return (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    {criterionIcon(c.result)}
                    <p
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0A2540",
                      }}
                    >
                      {c.label}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: wl.color,
                        background: wl.bg,
                        padding: "2px 7px",
                        borderRadius: 9999,
                        flexShrink: 0,
                      }}
                    >
                      {wl.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRight: `1px solid ${borderColor}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#9CA3AF",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.05em",
                          marginBottom: 3,
                        }}
                      >
                        Your value
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0A2540",
                        }}
                      >
                        {c.your_value}
                      </p>
                    </div>
                    <div style={{ padding: "10px 14px" }}>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#9CA3AF",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.05em",
                          marginBottom: 3,
                        }}
                      >
                        Required
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#6B7280",
                        }}
                      >
                        {c.required_value}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <Info
                      size={12}
                      style={{
                        color: "#9CA3AF",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        lineHeight: 1.6,
                      }}
                    >
                      {c.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to improve */}
        {item.how_to_improve && (
          <div style={{ padding: "0 24px 24px", flexShrink: 0 }}>
            <div
              style={{
                background: "#0A2540",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lightbulb size={14} color="#00D4FF" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#00D4FF",
                    marginBottom: 4,
                  }}
                >
                  How to improve your readiness
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.65,
                  }}
                >
                  {item.how_to_improve}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   READINESS CARD
───────────────────────────────────────────────────────── */
function ReadinessCard({
  item,
  onClick,
}: {
  item: ReadinessItem;
  onClick: () => void;
}) {
  const color = readinessColor(item.readiness_score);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (item.readiness_score / 100);
  const passCount = item.criteria.filter((c) => c.result === "pass").length;
  const partialCount = item.criteria.filter(
    (c) => c.result === "partial"
  ).length;
  const failCount = item.criteria.filter((c) => c.result === "fail").length;

  return (
    <div
      onClick={onClick}
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 10px rgba(10,37,64,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="5"
        />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          transform="rotate(-90 26 26)"
        />
        <text
          x="26"
          y="30"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill={color}
          fontFamily="var(--font-display)"
        >
          {item.readiness_score}
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0A2540",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
            marginBottom: 3,
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#6B7280",
            lineHeight: 1.5,
            marginBottom: 8,
          }}
        >
          {item.definition}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap" as const,
          }}
        >
          <Badge
            variant={
              item.status === "eligible"
                ? "success"
                : item.status === "conditional"
                ? "warning"
                : "destructive"
            }
            style={{ fontSize: 10 }}
          >
            {item.status === "eligible"
              ? "Eligible"
              : item.status === "conditional"
              ? "Conditional"
              : "Not Ready"}
          </Badge>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>
            {passCount}✓
            {partialCount > 0 ? ` ${partialCount}~` : ""}
            {failCount > 0 ? ` ${failCount}✗` : ""}
          </span>
        </div>
      </div>
      <ChevronRight size={15} style={{ color: "#9CA3AF", flexShrink: 0 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SETTLE BUTTON
───────────────────────────────────────────────────────── */
function SettleButton({
  financingId,
  totalAmount,
  initialProof,
  onSettled,
}: {
  financingId: string;
  totalAmount: number;
  initialProof: { installments: Installment[]; total_paid: number };
  onSettled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [reference, setReference] = useState("");
  const [partialAmt, setPartialAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>(
    initialProof.installments ?? []
  );
  const [totalPaidState, setTotalPaid] = useState(
    initialProof.total_paid ?? 0
  );
  const [fullySettled, setFullySettled] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const remaining = totalAmount - totalPaidState;
  const paidPct = Math.min(100, (totalPaidState / totalAmount) * 100);
  const hasHistory = installments.length > 0;

  const fmtLocal = (n: number) =>
    n >= 1_000_000
      ? `₦${(n / 1_000_000).toFixed(2)}M`
      : `₦${(n / 1_000).toFixed(0)}K`;

  const handleSubmit = async () => {
    const amount =
      mode === "full" ? remaining : Number(partialAmt);
    if (!reference.trim() || amount <= 0) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await callFn("submit-settlement", {
        financing_id: financingId,
        amount,
        reference: reference.trim(),
        is_partial: mode === "partial",
      });
      // Update local state from response
      setInstallments(
        res.settlement_proof?.installments ?? [
          ...installments,
          {
            id: res.installment.id,
            amount: res.installment.amount,
            reference: res.installment.reference,
            submitted_at: res.installment.submitted_at,
            status: "pending" as const,
          },
        ]
      );
      setTotalPaid(res.total_paid);
      if (res.fully_settled) {
        setFullySettled(true);
        onSettled?.();
        setOpen(false);
      }
      setReference("");
      setPartialAmt("");
    } catch (e: any) {
      setSubmitError(e.message ?? "Failed to submit settlement");
    } finally {
      setLoading(false);
    }
  };

  const triggerButton = fullySettled ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 6,
        background: "#ECFDF5",
        border: "1px solid rgba(16,185,129,0.2)",
        fontSize: 12,
        fontWeight: 600,
        color: "#10B981",
      }}
    >
      <CheckCircle2 size={12} /> Fully settled
    </div>
  ) : hasHistory ? (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "5px 10px",
        borderRadius: 7,
        border: "1px solid #E5E7EB",
        background: "white",
        cursor: "pointer",
        minWidth: 110,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2540" }}>
          {fmtLocal(totalPaidState)} paid
        </span>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>
          {Math.round(paidPct)}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 9999,
          background: "#F3F4F6",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${paidPct}%`,
            background: "#10B981",
            borderRadius: 9999,
            transition: "width 0.4s",
          }}
        />
      </div>
    </button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      style={{ fontSize: 12, gap: 5 }}
      onClick={() => setOpen(true)}
    >
      <CheckCircle2 size={12} /> Settle
    </Button>
  );

  return (
    <>
      {triggerButton}

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(10,37,64,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              overflow: "hidden",
              maxHeight: "90vh",
              overflowY: "auto" as const,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#0A2540",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Record settlement
                </p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  Full payment or instalment — Creditlinker verifies against
                  your bank data.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  padding: 4,
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Repayment progress */}
              <div
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#0A2540" }}
                  >
                    Repayment progress
                  </span>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {fmtLocal(totalPaidState)} of {fmtLocal(totalAmount)}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 9999,
                    background: "#E5E7EB",
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${paidPct}%`,
                      background: paidPct >= 100 ? "#10B981" : "#3B82F6",
                      borderRadius: 9999,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {installments.length} instalment
                    {installments.length !== 1 ? "s" : ""} submitted
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: remaining > 0 ? "#F59E0B" : "#10B981",
                    }}
                  >
                    {remaining > 0
                      ? `${fmtLocal(remaining)} remaining`
                      : "Fully paid"}
                  </span>
                </div>
              </div>

              {submitError && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "10px 12px",
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                  }}
                >
                  <AlertTriangle
                    size={13}
                    style={{
                      color: "#EF4444",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <p style={{ fontSize: 12, color: "#991B1B" }}>
                    {submitError}
                  </p>
                </div>
              )}

              {/* Mode toggle */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 9,
                  overflow: "hidden",
                }}
              >
                {(["full", "partial"] as const).map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      height: 38,
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      borderRight:
                        i === 0 ? "1.5px solid #E5E7EB" : "none",
                      background: mode === m ? "#0A2540" : "white",
                      color: mode === m ? "white" : "#6B7280",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {m === "full"
                      ? `Full payment (${fmtLocal(remaining)})`
                      : "Part payment"}
                  </button>
                ))}
              </div>

              {/* Partial amount field */}
              {mode === "partial" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#374151",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Amount paid (₦)
                  </label>
                  <input
                    type="number"
                    value={partialAmt}
                    onChange={(e) => setPartialAmt(e.target.value)}
                    placeholder={`Max ${fmtLocal(remaining)}`}
                    min={1}
                    max={remaining}
                    style={{
                      height: 44,
                      padding: "0 14px",
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      fontSize: 13,
                      color: "#0A2540",
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "#0A2540")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "#E5E7EB")
                    }
                  />
                  {Number(partialAmt) > remaining && (
                    <p style={{ fontSize: 11, color: "#EF4444" }}>
                      Amount exceeds the remaining balance of{" "}
                      {fmtLocal(remaining)}.
                    </p>
                  )}
                </div>
              )}

              {/* Reference */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                  }}
                >
                  Payment reference or narration
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TRF/2025/01/LAPO-8821"
                  style={{
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    fontSize: 13,
                    color: "#0A2540",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                  Creditlinker will match this against your linked bank
                  transactions to verify the payment.
                </p>
              </div>

              {/* Past instalments */}
              {hasHistory && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.05em",
                    }}
                  >
                    Previous instalments
                  </p>
                  {installments.map((inst) => (
                    <div
                      key={inst.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background:
                            inst.status === "verified"
                              ? "#ECFDF5"
                              : "#FFFBEB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {inst.status === "verified" ? (
                          <CheckCircle2
                            size={13}
                            style={{ color: "#10B981" }}
                          />
                        ) : (
                          <Clock size={13} style={{ color: "#F59E0B" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#0A2540",
                            marginBottom: 1,
                          }}
                        >
                          {fmtLocal(inst.amount)}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {inst.reference} ·{" "}
                          {fmtDate(inst.submitted_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inst.status === "verified" ? "success" : "warning"
                        }
                        style={{ fontSize: 9, flexShrink: 0 }}
                      >
                        {inst.status === "verified" ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 9,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={
                    !reference.trim() ||
                    loading ||
                    (mode === "partial" &&
                      (!partialAmt ||
                        Number(partialAmt) <= 0 ||
                        Number(partialAmt) > remaining))
                  }
                  style={{
                    flex: 2,
                    height: 42,
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 9,
                    gap: 6,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />{" "}
                      Submitting…
                    </>
                  ) : mode === "full" ? (
                    <>
                      <CheckCircle2 size={13} /> Submit full payment
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Submit instalment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   MARKETPLACE CARD
───────────────────────────────────────────────────────── */
function MarketplaceCard({
  item,
  onAccessGranted,
}: {
  item: MarketplaceItem;
  onAccessGranted: (matchId: string) => void;
}) {
  const [requested, setRequested] = useState(
    item.consent_granted || item.status === "access_requested"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      await callFn("manage-financing-access", {
        action: "grant_consent",
        match_id: item.match_id,
      });
      setRequested(true);
      onAccessGranted(item.match_id);
    } catch (e: any) {
      setError(e.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "20px 22px",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#0A2540";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 16px rgba(10,37,64,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#F3F4F6",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "#0A2540",
            }}
          >
            {item.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0A2540",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                marginBottom: 2,
              }}
            >
              {item.name}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.type}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.03em",
              color: item.match_score >= 85 ? "#10B981" : "#F59E0B",
              lineHeight: 1,
            }}
          >
            {item.match_score}%
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#9CA3AF",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            match
          </p>
        </div>
      </div>

      {/* Capital type badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: 9999,
          background: "#F3F4F6",
          fontSize: 11,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 14,
        }}
      >
        <Banknote size={11} style={{ marginRight: 5 }} />
        {item.label}
      </div>

      {/* Terms grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Amount", value: item.amount_range },
          { label: "Rate", value: item.rate },
          { label: "Tenure", value: item.tenure },
          { label: "Turnaround", value: item.turnaround },
        ].map((t) => (
          <div key={t.label}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                marginBottom: 2,
              }}
            >
              {t.label}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              {t.value}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 10px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 7,
            marginBottom: 8,
          }}
        >
          <AlertTriangle
            size={11}
            style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ fontSize: 11, color: "#991B1B" }}>{error}</p>
        </div>
      )}

      {/* CTA */}
      {requested ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 8,
            background: "#F0FDF4",
            border: "1px solid rgba(16,185,129,0.2)",
            fontSize: 12,
            fontWeight: 600,
            color: "#10B981",
          }}
        >
          <CheckCircle2 size={13} /> Access requested — awaiting review
        </div>
      ) : (
        <button
          onClick={handleRequestAccess}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "1.5px solid #0A2540",
            background: "white",
            color: "#0A2540",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            transition: "all 0.12s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.background = "#0A2540";
              (e.currentTarget as HTMLElement).style.color = "white";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "white";
            (e.currentTarget as HTMLElement).style.color = "#0A2540";
          }}
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Requesting…
            </>
          ) : (
            <>
              <ArrowUpRight size={13} /> Request Access
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancingPage() {
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [readiness,        setReadiness]        = useState<ReadinessItem[]>([]);
  const [activeFinancing,  setActiveFinancing]  = useState<ActiveFinancingRecord[]>([]);
  const [marketplace,      setMarketplace]      = useState<MarketplaceItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<MarketplaceItem[]>([]);
  const [capFilter,        setCapFilter]        = useState("All");
  const [activeAssessment, setActiveAssessment] = useState<ReadinessItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callFn("get-financing-data", undefined, "GET");

      // Map then deduplicate by finance_type (the true product identifier),
      // keeping the entry with the highest readiness_score per product.
      // capital_category is a grouping key (debt_capital, asset_based) not a
      // product key — deduplicating by it would collapse multiple products.
      const mapped: ReadinessItem[] = (data.readiness ?? []).map(mapReadinessItem);
      const deduped = Array.from(
        mapped
          .sort((a, b) => b.readiness_score - a.readiness_score)
          .reduce((acc, item) => {
            const key = item.finance_type ?? item.capital_category;
            if (!acc.has(key)) acc.set(key, item);
            return acc;
          }, new Map<string, ReadinessItem>())
          .values()
      );
      setReadiness(deduped);

      setActiveFinancing(
        (data.financing ?? []).map((f: any) => ({
          financing_id:     f.financing_id,
          institution_name: f.institution_name,
          institution_type: f.institution_type,
          capital_category: f.capital_category,
          terms:            f.terms ?? {},
          status:           f.status,
          granted_at:       f.granted_at,
          settlement_proof: f.settlement_proof ?? { installments: [], total_paid: 0 },
        }))
      );

      setMarketplace((data.marketplace ?? []).map(mapMarketplaceItem));
      setIncomingRequests((data.incoming_requests ?? []).map(mapMarketplaceItem));
    } catch (e: any) {
      setError(e.message ?? "Failed to load financing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMarket = marketplace.filter((m) => {
    if (capFilter === "All") return true;
    return m.label.toLowerCase().includes(capFilter.toLowerCase());
  });

  const eligibleCount    = readiness.filter((r) => r.status === "eligible").length;
  const conditionalCount = readiness.filter((r) => r.status === "conditional").length;
  const activeFin        = activeFinancing.filter((f) => f.status === "active");

  /* ── LOADING STATE ── */
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 10,
          color: "#9CA3AF",
        }}
      >
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: 13 }}>Loading financing data…</span>
      </div>
    );
  }

  /* ── ERROR STATE ── */
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 12,
          textAlign: "center",
        }}
      >
        <AlertTriangle size={28} style={{ color: "#EF4444" }} />
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {error}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          style={{ gap: 6 }}
        >
          <RefreshCw size={13} /> Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      {activeAssessment && (
        <AssessmentDrawer
          item={activeAssessment}
          onClose={() => setActiveAssessment(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                color: "#0A2540",
                letterSpacing: "-0.03em",
                marginBottom: 4,
              }}
            >
              Financing
            </h2>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              {eligibleCount} capital type{eligibleCount !== 1 ? "s" : ""}{" "}
              eligible · {conditionalCount} conditional ·{" "}
              {activeFin.length} active financing
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            style={{ gap: 5, color: "#9CA3AF" }}
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        {/* ── READINESS ── */}
        {readiness.length > 0 && (
          <Card>
            <SectionHeader
              title="Financing Readiness"
              sub="Based on your current financial identity and score."
              action={
                <Link
                  href="/financial-analysis"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0A2540",
                    textDecoration: "none",
                  }}
                >
                  <TrendingUp size={13} /> Full analysis
                </Link>
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                padding: "16px 24px 24px",
              }}
            >
              {readiness.map((item) => (
                <ReadinessCard
                  key={item.assessment_id}
                  item={item}
                  onClick={() => setActiveAssessment(item)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* ── ACTIVE FINANCING ── */}
        {activeFin.length > 0 && (
          <Card>
            <SectionHeader
              title="Active Financing"
              sub="Financing currently in progress."
            />
            <div style={{ padding: "12px 0 8px" }}>
              {activeFin.map((rec, i) => {
                const sc = statusConfig(rec.status);
                const amount = rec.terms?.amount ?? 0;
                return (
                  <div
                    key={rec.financing_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px 1fr auto auto",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 24px",
                      borderBottom:
                        i < activeFin.length - 1
                          ? "1px solid #F3F4F6"
                          : "none",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#F3F4F6",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#0A2540",
                      }}
                    >
                      {rec.institution_name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 3,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0A2540",
                          }}
                        >
                          {rec.institution_name}
                        </p>
                        <Badge variant={sc.variant} style={{ fontSize: 10 }}>
                          {sc.label}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                        {CAPITAL_LABELS[rec.capital_category] ??
                          rec.capital_category}{" "}
                        · Granted {fmtDate(rec.granted_at)}
                        {rec.terms.due ? ` · Due ${rec.terms.due}` : ""}
                      </p>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: "right" as const }}>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          fontSize: 18,
                          color: "#0A2540",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {amount > 0 ? fmt(amount) : "—"}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {rec.terms.rate ?? ""}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {amount > 0 && (
                        <SettleButton
                          financingId={rec.financing_id}
                          totalAmount={amount}
                          initialProof={rec.settlement_proof}
                          onSettled={loadData}
                        />
                      )}
                      <Link
                        href="/disputes"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#EF4444",
                          textDecoration: "none",
                        }}
                      >
                        <AlertCircle size={12} /> Dispute
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── MARKETPLACE ── */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#0A2540",
                  letterSpacing: "-0.02em",
                  marginBottom: 2,
                }}
              >
                Financing Marketplace
              </h3>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                {filteredMarket.length} capital provider
                {filteredMarket.length !== 1 ? "s" : ""} matched to your
                financial identity.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap" as const,
              }}
            >
              <Filter size={13} style={{ color: "#9CA3AF" }} />
              {CAPITAL_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setCapFilter(f)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 9999,
                    border: "1.5px solid",
                    borderColor: capFilter === f ? "#0A2540" : "#E5E7EB",
                    background: capFilter === f ? "#0A2540" : "white",
                    color: capFilter === f ? "white" : "#6B7280",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredMarket.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                border: "1px dashed #E5E7EB",
                borderRadius: 12,
              }}
            >
              <Banknote
                size={24}
                style={{ color: "#D1D5DB", margin: "0 auto 10px" }}
              />
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6B7280",
                  marginBottom: 4,
                }}
              >
                No matches for this filter
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                Try a different category or check back after your pipeline
                runs.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14,
              }}
            >
              {filteredMarket.map((item) => (
                <MarketplaceCard
                  key={item.match_id}
                  item={item}
                  onAccessGranted={(id) => {
                    setMarketplace((prev) =>
                      prev.map((m) =>
                        m.match_id === id
                          ? { ...m, status: "access_requested", consent_granted: false }
                          : m
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── INCOMING CONSENT REQUESTS ── */}
        <Card>
          <SectionHeader
            title="Incoming Access Requests"
            sub="Capital providers requesting access to your financial identity."
            action={
              <Link
                href="/financers"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0A2540",
                  textDecoration: "none",
                }}
              >
                Manage all <ChevronRight size={13} />
              </Link>
            }
          />
          <div style={{ padding: "14px 24px 20px" }}>
            {incomingRequests.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  border: "1px dashed #E5E7EB",
                  borderRadius: 10,
                }}
              >
                <Landmark
                  size={24}
                  style={{ color: "#D1D5DB", margin: "0 auto 10px" }}
                />
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  No pending requests
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    lineHeight: 1.6,
                  }}
                >
                  When a capital provider requests access to your profile, it
                  will appear here for your review.
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {incomingRequests.map((req) => (
                  <IncomingRequestRow
                    key={req.match_id}
                    item={req}
                    onDecision={(id, decision) => {
                      setIncomingRequests((prev) =>
                        prev.filter((r) => r.match_id !== id)
                      );
                      if (decision === "approve") loadData();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── IDENTITY PROMPT ── */}
        <div
          style={{
            background: "#0A2540",
            borderRadius: 14,
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap" as const,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                flexShrink: 0,
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={18} color="#00D4FF" />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "white",
                  letterSpacing: "-0.02em",
                  marginBottom: 3,
                }}
              >
                Strengthen your profile to unlock better offers.
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.5,
                }}
              >
                Upload documents and connect all accounts to improve your
                readiness scores.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Link
              href="/documents"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Upload Docs
            </Link>
            <Link
              href="/financial-identity"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                background: "#00D4FF",
                color: "#0A2540",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Building2 size={13} /> View Identity
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   INCOMING REQUEST ROW
───────────────────────────────────────────────────────── */
function IncomingRequestRow({
  item,
  onDecision,
}: {
  item: MarketplaceItem;
  onDecision: (matchId: string, decision: "approve" | "deny") => void;
}) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (action: "approve" | "deny") => {
    setLoading(action);
    setError(null);
    try {
      await callFn("manage-financing-access", {
        action,
        match_id: item.match_id,
      });
      onDecision(item.match_id, action);
    } catch (e: any) {
      setError(e.message ?? "Action failed");
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: "#E5E7EB",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          color: "#0A2540",
        }}
      >
        {item.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0A2540",
            marginBottom: 2,
          }}
        >
          {item.name}
        </p>
        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
          {item.type} · Requesting access to your financial profile
        </p>
        {error && (
          <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
            {error}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => handle("deny")}
          disabled={!!loading}
          style={{
            height: 32,
            padding: "0 12px",
            borderRadius: 7,
            border: "1px solid #E5E7EB",
            background: "white",
            fontSize: 12,
            fontWeight: 600,
            color: "#6B7280",
            cursor: loading ? "default" : "pointer",
            opacity: loading === "deny" ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {loading === "deny" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <XCircle size={11} />
          )}{" "}
          Deny
        </button>
        <button
          onClick={() => handle("approve")}
          disabled={!!loading}
          style={{
            height: 32,
            padding: "0 12px",
            borderRadius: 7,
            border: "none",
            background: "#0A2540",
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            cursor: loading ? "default" : "pointer",
            opacity: loading === "approve" ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {loading === "approve" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <CheckCircle2 size={11} />
          )}{" "}
          Approve
        </button>
      </div>
    </div>
  );
}
