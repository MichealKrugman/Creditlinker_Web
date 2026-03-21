"use client";

import { useState } from "react";
import {
  ArrowUpRight, Clock, CheckCircle2, XCircle,
  ChevronDown, Filter, Building2, ShieldCheck,
  TrendingUp, AlertCircle, Info, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/mobile-nav-context";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /institution/discovery (status: access_requested)
                 POST /institution/discovery/:match_id/request-access
───────────────────────────────────────────────────────── */
type RequestStatus = "pending" | "granted" | "denied";

const REQUESTS = [
  {
    id: "REQ-001",
    match_id: "match_7x9a",
    business_id: "BIZ-7X9A",
    sector: "Food & Beverage",
    capital_category: "Working Capital Loan",
    requested_amount: "₦10M",
    requested_at: "2 hours ago",
    status: "pending" as RequestStatus,
    data_months: 24,
    match_score: 94,
    dimensions: { revenue: 85, cashflow: 78, expense: 81, liquidity: 74, consistency: 80, risk: 69 },
    revenue_band: "₦5M – ₦20M/mo",
    risk_level: "Low Risk",
    note: "Business is open to working capital financing. 24 months of verified bank data available.",
  },
  {
    id: "REQ-002",
    match_id: "match_5n2w",
    business_id: "BIZ-5N2W",
    sector: "Agriculture",
    capital_category: "Trade Finance",
    requested_amount: "₦18M",
    requested_at: "Yesterday",
    status: "pending" as RequestStatus,
    data_months: 20,
    match_score: 83,
    dimensions: { revenue: 83, cashflow: 76, expense: 79, liquidity: 81, consistency: 75, risk: 72 },
    revenue_band: "₦15M – ₦60M/mo",
    risk_level: "Low Risk",
    note: "Seasonal revenue pattern detected. Strong liquidity buffer supports trade finance eligibility.",
  },
  {
    id: "REQ-003",
    match_id: "match_6g3h",
    business_id: "BIZ-6G3H",
    sector: "Healthcare",
    capital_category: "Equipment Financing",
    requested_amount: "₦7M",
    requested_at: "Dec 28",
    status: "pending" as RequestStatus,
    data_months: 15,
    match_score: 80,
    dimensions: { revenue: 77, cashflow: 81, expense: 85, liquidity: 69, consistency: 78, risk: 80 },
    revenue_band: "₦3M – ₦12M/mo",
    risk_level: "Medium Risk",
    note: "Expense discipline is a standout signal. Liquidity is slightly below threshold — review before committing.",
  },
  {
    id: "REQ-004",
    match_id: "match_9p4l",
    business_id: "BIZ-9P4L",
    sector: "Technology",
    capital_category: "Revenue Advance",
    requested_amount: "₦3.5M",
    requested_at: "Dec 26",
    status: "granted" as RequestStatus,
    data_months: 12,
    match_score: 88,
    dimensions: { revenue: 79, cashflow: 82, expense: 88, liquidity: 71, consistency: 77, risk: 83 },
    revenue_band: "₦2M – ₦8M/mo",
    risk_level: "Low Risk",
    note: "Access granted. Full financial profile now available.",
  },
  {
    id: "REQ-005",
    match_id: "match_2b7r",
    business_id: "BIZ-2B7R",
    sector: "Manufacturing",
    capital_category: "Working Capital Loan",
    requested_amount: "₦35M",
    requested_at: "Dec 22",
    status: "denied" as RequestStatus,
    data_months: 8,
    match_score: 72,
    dimensions: { revenue: 68, cashflow: 71, expense: 74, liquidity: 62, consistency: 66, risk: 58 },
    revenue_band: "₦20M – ₦80M/mo",
    risk_level: "Medium Risk",
    note: "Business declined to share full financial profile at this time.",
  },
];

const DIMENSION_KEYS   = ["revenue", "cashflow", "expense", "liquidity", "consistency", "risk"] as const;
const DIMENSION_SHORT  = ["Rev", "CF", "Exp", "Liq", "Con", "Risk"];
const DIMENSION_COLORS = ["#10B981", "#38BDF8", "#818CF8", "#F59E0B", "#10B981", "#EF4444"];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function riskVariant(r: string) {
  if (r === "Low Risk")    return "success"     as const;
  if (r === "Medium Risk") return "warning"     as const;
  return                          "destructive" as const;
}

function statusConfig(s: RequestStatus) {
  return {
    pending: { label: "Pending Review", variant: "warning"     as const, icon: <Clock      size={11} /> },
    granted: { label: "Access Granted", variant: "success"     as const, icon: <CheckCircle2 size={11} /> },
    denied:  { label: "Declined",       variant: "destructive" as const, icon: <XCircle     size={11} /> },
  }[s];
}

/* ─────────────────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────────────────── */
function ConfirmModal({
  action, request, onConfirm, onClose,
}: {
  action: "offer" | "decline";
  request: typeof REQUESTS[0];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isOffer = action === "offer";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16,
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>
            {isOffer ? "Create Financing Offer" : "Decline Request"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {isOffer ? (
            <>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>
                You're about to create a financing offer for <strong style={{ color: "#0A2540" }}>{request.business_id}</strong>.
                They'll be notified and can accept or negotiate terms.
              </p>
              <div style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 9, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Request details</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{request.capital_category} · {request.requested_amount}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{request.sector} · Match score: {request.match_score}%</p>
              </div>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
                You'll be taken to the Offers page to configure terms.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>
                Declining will notify <strong style={{ color: "#0A2540" }}>{request.business_id}</strong> that you're not moving forward.
                This action cannot be undone.
              </p>
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 40, borderRadius: 8,
              border: "1px solid #E5E7EB", background: "white",
              fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{
              flex: 1, height: 40, borderRadius: 8, border: "none",
              background: isOffer ? "#0A2540" : "#EF4444",
              fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer",
            }}>
              {isOffer ? "Create Offer" : "Decline"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REQUEST ROW
───────────────────────────────────────────────────────── */
function RequestRow({
  req, expanded, onToggle, onAction,
}: {
  req: typeof REQUESTS[0];
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: "offer" | "decline") => void;
}) {
  const sc = statusConfig(req.status);
  const isMobile = useIsMobile();

  return (
    <div style={{
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      overflow: "hidden",
      background: "white",
      transition: "border-color 0.12s",
    }}>
      {/* Summary row — mobile card / desktop grid */}
      <div onClick={onToggle} style={{ cursor: "pointer" }}>
        {isMobile ? (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={15} color="#9CA3AF" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{req.business_id}</p>
                    <Badge variant={riskVariant(req.risk_level)} style={{ fontSize: 9, padding: "1px 6px" }}>{req.risk_level}</Badge>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{req.sector} · {req.capital_category}</p>
                </div>
              </div>
              <ChevronDown size={14} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0, marginTop: 2 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Amount</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{req.requested_amount}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Match</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: req.match_score >= 90 ? "#10B981" : "#F59E0B", fontFamily: "var(--font-display)" }}>{req.match_score}%</p>
                </div>
              </div>
              <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>{sc.icon} {sc.label}</Badge>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 110px 120px 130px", gap: 12, padding: "14px 20px", alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={15} color="#9CA3AF" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{req.business_id}</p>
                <Badge variant={riskVariant(req.risk_level)} style={{ fontSize: 9, padding: "1px 6px" }}>{req.risk_level}</Badge>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{req.sector} · {req.capital_category}</p>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)" }}>{req.requested_amount}</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: req.match_score >= 90 ? "#10B981" : "#F59E0B", fontFamily: "var(--font-display)" }}>{req.match_score}% <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF" }}>match</span></p>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{req.requested_at}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <Badge variant={sc.variant} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>{sc.icon} {sc.label}</Badge>
              <ChevronDown size={14} style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "18px 20px", background: "#FAFAFA" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 200px",
            gap: 20,
          }}>
            {/* Left: dimensions + note */}
            <div>
              {/* Note */}
              {req.note && (
                <div style={{
                  display: "flex", gap: 8, marginBottom: 16,
                  padding: "10px 12px",
                  background: "white", border: "1px solid #E5E7EB",
                  borderRadius: 8,
                }}>
                  <Info size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{req.note}</p>
                </div>
              )}

              {/* Dimension bars */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Financial Dimensions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DIMENSION_KEYS.map((k, i) => (
                  <div key={k}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{DIMENSION_SHORT[i]}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: DIMENSION_COLORS[i] }}>
                        {req.dimensions[k]}
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${req.dimensions[k]}%`,
                        background: DIMENSION_COLORS[i], borderRadius: 9999,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: meta + actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Meta */}
              <div style={{
                background: "white", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "14px 16px",
              }}>
                {[
                  { label: "Revenue Band",  value: req.revenue_band },
                  { label: "Data Coverage", value: `${req.data_months} months` },
                  { label: "Request ID",    value: req.id },
                ].map(r => (
                  <div key={r.label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid #F3F4F6",
                  }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {req.status === "pending" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => onAction("offer")}
                    style={{
                      width: "100%", height: 38, borderRadius: 8, border: "none",
                      background: "#0A2540", color: "white",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <ArrowUpRight size={13} /> Create Offer
                  </button>
                  <button
                    onClick={() => onAction("decline")}
                    style={{
                      width: "100%", height: 38, borderRadius: 8,
                      border: "1px solid #E5E7EB", background: "white",
                      color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Decline
                  </button>
                </div>
              )}
              {req.status === "granted" && (
                <button style={{
                  width: "100%", height: 38, borderRadius: 8, border: "none",
                  background: "#0A2540", color: "white",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <ShieldCheck size={13} /> View Full Profile
                </button>
              )}
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
export default function FinancingRequests() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modal, setModal]           = useState<{ action: "offer" | "decline"; req: typeof REQUESTS[0] } | null>(null);
  const [filter, setFilter]         = useState<"all" | RequestStatus>("all");

  const filtered = filter === "all" ? REQUESTS : REQUESTS.filter(r => r.status === filter);
  const pending  = REQUESTS.filter(r => r.status === "pending").length;

  return (
    <>
      {modal && (
        <ConfirmModal
          action={modal.action}
          request={modal.req}
          onClose={() => setModal(null)}
          onConfirm={() => {
            // TODO: POST /institution/discovery/:match_id/request-access or decline
            setModal(null);
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
            }}>
              Financing Requests
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {REQUESTS.length} total requests
              {pending > 0 && <> · <span style={{ color: "#EF4444", fontWeight: 600 }}>{pending} awaiting review</span></>}
            </p>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{ display: "flex", gap: 4 }}>
          {([
            { key: "all",     label: "All",           count: REQUESTS.length },
            { key: "pending", label: "Pending",       count: REQUESTS.filter(r => r.status === "pending").length },
            { key: "granted", label: "Access Granted", count: REQUESTS.filter(r => r.status === "granted").length },
            { key: "denied",  label: "Declined",      count: REQUESTS.filter(r => r.status === "denied").length },
          ] as const).map(tab => (
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
                transition: "all 0.12s",
              }}
            >
              {tab.label}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 18, height: 18, borderRadius: 9999,
                background: filter === tab.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
                color: filter === tab.key ? "white" : "#6B7280",
                fontSize: 10, fontWeight: 700, padding: "0 4px",
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── TABLE HEADER (desktop only) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 110px 120px 130px", gap: 12, padding: "0 20px 8px" }} className="desktop-table-header">
          {["", "Business", "Amount", "Match", "Received", "Status"].map(h => (
            <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
          ))}
        </div>
        <style>{`@media (max-width: 768px) { .desktop-table-header { display: none !important; } }`}</style>

        {/* ── ROWS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" as const, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No requests</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>No financing requests match the selected filter.</p>
            </div>
          ) : (
            filtered.map(req => (
              <RequestRow
                key={req.id}
                req={req}
                expanded={expandedId === req.id}
                onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                onAction={(action) => setModal({ action, req })}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
