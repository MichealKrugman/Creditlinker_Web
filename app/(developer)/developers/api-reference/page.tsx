"use client";

import { useState } from "react";
import { Search, X, ChevronDown, ChevronUp, Copy, CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────────────────── */
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Parameter = {
  name: string;
  in: "path" | "query" | "body";
  type: string;
  required: boolean;
  description: string;
};

type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  role: string;
  parameters?: Parameter[];
  response_shape: string;
};

type ApiGroup = {
  group: string;
  prefix: string;
  endpoints: ApiEndpoint[];
};

const API_GROUPS: ApiGroup[] = [
  {
    group: "Business — Score & Identity",
    prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/score",
        summary: "Get financial score",
        description: "Returns the latest computed financial score for the authenticated business, including all 6 dimensional scores and data quality metadata.",
        role: "business_owner",
        response_shape: `{
  "score_id": "scr_01HX...",
  "business_id": "biz_01HX...",
  "computed_at": "2025-01-15T10:32:44Z",
  "dimensions": {
    "revenue_stability":       { "score": 85, "label": "Strong" },
    "cashflow_predictability": { "score": 78, "label": "Good" },
    "expense_discipline":      { "score": 81, "label": "Good" },
    "liquidity_strength":      { "score": 74, "label": "Moderate" },
    "financial_consistency":   { "score": 80, "label": "Good" },
    "risk_profile":            { "score": 69, "label": "Moderate" }
  },
  "data_quality_score": 91,
  "data_months_analyzed": 24
}`,
      },
      {
        method: "GET", path: "/business/profile",
        summary: "Get business profile",
        description: "Returns the full profile for the authenticated business including identity status, operational data, and financing preferences.",
        role: "business_owner",
        response_shape: `{
  "business_id": "biz_01HX...",
  "name": "Aduke Bakeries Ltd.",
  "sector": "Food & Beverage",
  "profile_status": "active",
  "open_to_financing": true,
  "selected_capital_categories": ["working_capital"],
  "data_coverage_start": "2023-01-01",
  "data_coverage_end":   "2024-12-31"
}`,
      },
      {
        method: "PUT", path: "/business/profile",
        summary: "Update business profile",
        description: "Replaces the business profile with the provided payload. All fields are optional — omitted fields retain their current values.",
        role: "business_owner",
        parameters: [
          { name: "name",                        in: "body", type: "string",   required: false, description: "Legal business name" },
          { name: "sector",                      in: "body", type: "string",   required: false, description: "Industry sector" },
          { name: "open_to_financing",           in: "body", type: "boolean",  required: false, description: "Make business discoverable to capital providers" },
          { name: "selected_capital_categories", in: "body", type: "string[]", required: false, description: "Capital types the business is seeking" },
        ],
        response_shape: `{ "success": true }`,
      },
      {
        method: "GET", path: "/business/readiness",
        summary: "Get readiness assessments",
        description: "Returns readiness assessments for all capital categories the business is eligible for, grouped by category.",
        role: "business_owner",
        response_shape: `{
  "working_capital": [
    {
      "assessment_id": "ast_01HX...",
      "finance_type": "working_capital_loan",
      "readiness_score": 82,
      "status": "eligible",
      "assessed_at": "2025-01-15T10:32:44Z"
    }
  ]
}`,
      },
      {
        method: "GET", path: "/business/snapshots",
        summary: "Get identity snapshots",
        description: "Returns a chronological list of financial identity snapshots — versioned point-in-time records of the business's financial profile.",
        role: "business_owner",
        response_shape: `[
  {
    "snapshot_id": "snp_01HX...",
    "taken_at": "2025-01-15T10:32:44Z",
    "pipeline_run_id": "run_01HX...",
    "data_quality_score": 91,
    "identity_resolution_status": "verified"
  }
]`,
      },
    ],
  },
  {
    group: "Business — Data Sources",
    prefix: "/business",
    endpoints: [
      {
        method: "POST", path: "/business/mono/initiate",
        summary: "Initiate Mono bank link",
        description: "Initiates the Mono Connect flow for the authenticated business. Returns a URL to redirect the user to for OAuth bank linking.",
        role: "business_owner",
        response_shape: `{ "mono_link_url": "https://connect.mono.co/..." }`,
      },
      {
        method: "POST", path: "/business/mono/callback",
        summary: "Exchange Mono auth token",
        description: "Exchanges the Mono auth code (received after user completes the bank link flow) for a persistent account link.",
        role: "business_owner",
        parameters: [
          { name: "code", in: "body", type: "string", required: true, description: "The auth code returned by Mono after the user completes linking" },
        ],
        response_shape: `{ "success": true, "account_id": "acc_01HX..." }`,
      },
      {
        method: "POST", path: "/business/upload/csv",
        summary: "Upload CSV transactions",
        description: "Accepts a raw CSV string of transaction data and a column mapping definition. Records are ingested and queued for pipeline processing.",
        role: "business_owner",
        parameters: [
          { name: "csv_content", in: "body", type: "string", required: true, description: "Raw CSV text content" },
          { name: "column_map",  in: "body", type: "object", required: true, description: "Maps CSV columns to transaction fields (date, amount, direction, description)" },
        ],
        response_shape: `{ "success": true, "records_imported": 248 }`,
      },
    ],
  },
  {
    group: "Business — Consent",
    prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/consent",
        summary: "List active consents",
        description: "Returns all consent records for the business — both active and previously revoked — with access logs and permission details.",
        role: "business_owner",
        response_shape: `[
  {
    "consent_id": "con_01HX...",
    "institution_id": "inst_01HX...",
    "is_active": true,
    "granted_at": "2025-01-10T08:00:00Z",
    "permissions": {
      "can_view_score": true,
      "can_view_identity": true,
      "can_view_transaction_detail": false,
      "valid_until": "2025-02-10T08:00:00Z"
    }
  }
]`,
      },
      {
        method: "POST", path: "/business/consent/grant",
        summary: "Grant financer consent",
        description: "Grants a capital provider access to the business's financial identity for a specified duration. Creates a new ConsentRecord.",
        role: "business_owner",
        parameters: [
          { name: "institution_id",              in: "body", type: "string",  required: true,  description: "The institution to grant access to" },
          { name: "permissions.can_view_score",  in: "body", type: "boolean", required: false, description: "Allow institution to view dimensional scores" },
          { name: "permissions.can_view_identity", in: "body", type: "boolean", required: false, description: "Allow institution to view full identity profile" },
          { name: "duration_days",               in: "body", type: "number",  required: true,  description: "Access duration in days (e.g. 30)" },
        ],
        response_shape: `{
  "consent_id": "con_01HX...",
  "institution_id": "inst_01HX...",
  "is_active": true,
  "granted_at": "2025-01-15T10:32:44Z"
}`,
      },
      {
        method: "POST", path: "/business/consent/revoke",
        summary: "Revoke consent",
        description: "Revokes an active consent grant. The institution immediately loses access to the business's financial identity.",
        role: "business_owner",
        parameters: [
          { name: "consent_id", in: "body", type: "string", required: true, description: "The ID of the consent record to revoke" },
        ],
        response_shape: `{ "success": true }`,
      },
    ],
  },
  {
    group: "Business — Financing",
    prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/financing",
        summary: "List financing records",
        description: "Returns all financing records for the business including active, settled, and disputed records.",
        role: "business_owner",
        response_shape: `[
  {
    "financing_id": "fin_01HX...",
    "institution_id": "inst_01HX...",
    "capital_category": "working_capital",
    "status": "active",
    "granted_at": "2025-01-12T09:00:00Z",
    "terms": { "amount": 5000000, "currency": "NGN" }
  }
]`,
      },
      {
        method: "POST", path: "/business/financing/:financing_id/settlement",
        summary: "Submit settlement proof",
        description: "Submits repayment proof for an active financing record. The platform verifies the settlement against bank data where possible.",
        role: "business_owner",
        parameters: [
          { name: "financing_id", in: "path", type: "string", required: true,  description: "The financing record ID" },
          { name: "proof",        in: "body", type: "object", required: true,  description: "Settlement proof object including transaction references" },
        ],
        response_shape: `{
  "financing_id": "fin_01HX...",
  "status": "settled",
  "settled_at": "2025-01-30T14:22:00Z"
}`,
      },
    ],
  },
  {
    group: "Institution",
    prefix: "/institution",
    endpoints: [
      {
        method: "GET", path: "/institution/profile/:financial_identity_id",
        summary: "Get business profile (consent-gated)",
        description: "Returns the financial profile of a business. Requires an active consent record. Returns only fields permitted by the consent's permission scope.",
        role: "institution",
        parameters: [
          { name: "financial_identity_id", in: "path", type: "string", required: true, description: "The financial identity ID of the target business" },
        ],
        response_shape: `{
  "financial_identity_id": "fid_01HX...",
  "name": "Aduke Bakeries Ltd.",
  "sector": "Food & Beverage",
  "score": { ... },
  "data_quality_score": 91
}`,
      },
      {
        method: "GET", path: "/institution/discovery",
        summary: "Get discovery matches",
        description: "Returns anonymized discovery matches — businesses whose profiles match the institution's configured criteria and who have opted in to financing discovery.",
        role: "institution",
        response_shape: `[
  {
    "match_id": "mtc_01HX...",
    "anonymized_id": "anon_01HX...",
    "capital_category": "working_capital",
    "match_score": 94,
    "status": "pending"
  }
]`,
      },
      {
        method: "POST", path: "/institution/discovery/criteria",
        summary: "Set matching criteria",
        description: "Configures the institution's matching criteria. The discovery engine continuously evaluates business profiles against these criteria.",
        role: "institution",
        parameters: [
          { name: "capital_category",         in: "body", type: "string", required: true,  description: "Capital type this criteria applies to" },
          { name: "min_revenue_stability",    in: "body", type: "number", required: false, description: "Minimum Revenue Stability dimension score (0–100)" },
          { name: "min_data_months",          in: "body", type: "number", required: false, description: "Minimum months of financial data required" },
        ],
        response_shape: `{ "success": true, "criteria_id": "crt_01HX..." }`,
      },
      {
        method: "POST", path: "/institution/discovery/:match_id/request-access",
        summary: "Request business access",
        description: "Sends an access request to a matched business. The business receives a notification and can approve or deny the request.",
        role: "institution",
        parameters: [
          { name: "match_id", in: "path", type: "string", required: true, description: "The discovery match ID to request access for" },
        ],
        response_shape: `{ "success": true, "request_id": "req_01HX..." }`,
      },
    ],
  },
  {
    group: "Partner",
    prefix: "/partner",
    endpoints: [
      {
        method: "GET", path: "/partner/consent/status",
        summary: "Check consent status",
        description: "Returns the current consent status for a business token, including access tier and permitted fields.",
        role: "partner",
        parameters: [
          { name: "business_token", in: "query", type: "string", required: true, description: "Opaque business token issued when the business grants partner consent" },
        ],
        response_shape: `{
  "active": true,
  "access_tier": "read",
  "permitted_fields": ["score", "sector", "revenue_band"],
  "valid_until": "2025-03-01T00:00:00Z"
}`,
      },
      {
        method: "POST", path: "/partner/submit/:submission_type",
        summary: "Submit data to pipeline",
        description: "Allows a build-tier partner to contribute verified data into the Creditlinker pipeline for a business. Submission types: submit_bank_transactions, submit_identity_signals, submit_operational_data.",
        role: "partner",
        parameters: [
          { name: "submission_type", in: "path",  type: "string",   required: true, description: "Type of data being submitted" },
          { name: "business_token",  in: "body",  type: "string",   required: true, description: "Opaque business token" },
          { name: "data",            in: "body",  type: "array",    required: true, description: "Array of data records matching the submission type schema" },
        ],
        response_shape: `{
  "accepted": true,
  "submission_id": "sub_01HX...",
  "records_accepted": 120,
  "records_rejected": 2
}`,
      },
    ],
  },
  {
    group: "Health",
    prefix: "/",
    endpoints: [
      {
        method: "GET", path: "/health",
        summary: "Health check",
        description: "Returns platform health status. No authentication required.",
        role: "public",
        response_shape: `{ "status": "ok" }`,
      },
    ],
  },
];

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET:    { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  POST:   { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  PATCH:  { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  PUT:    { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  DELETE: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

const PARAM_IN_COLORS: Record<string, { bg: string; text: string }> = {
  path:  { bg: "#FFF7ED", text: "#C2410C" },
  query: { bg: "#F0FDFF", text: "#0891B2" },
  body:  { bg: "#F5F3FF", text: "#7C3AED" },
};

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 9px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.5)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   ENDPOINT ROW
───────────────────────────────────────────────────────── */
function EndpointRow({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const mc = METHOD_COLORS[ep.method];

  return (
    <div style={{
      border: `1px solid ${open ? "#D1D5DB" : "#F3F4F6"}`,
      borderRadius: 10, overflow: "hidden",
      background: open ? "white" : "#FAFAFA",
      transition: "all 0.15s",
      marginBottom: 8,
    }}>
      {/* Summary row */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "12px 16px",
          background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left" as const,
        }}
      >
        {/* Method */}
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
          padding: "3px 9px", borderRadius: 5,
          background: mc.bg, color: mc.text,
          border: `1px solid ${mc.border}`,
          fontFamily: "var(--font-mono, monospace)",
          minWidth: 48, textAlign: "center" as const, flexShrink: 0,
        }}>
          {ep.method}
        </span>

        {/* Path */}
        <code style={{
          fontSize: 13, color: "#0A2540",
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 600, flex: 1,
        }}>
          {ep.path}
        </code>

        {/* Summary */}
        <span style={{ fontSize: 13, color: "#6B7280", flex: 1, textAlign: "left" as const }}>
          {ep.summary}
        </span>

        {/* Role badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          padding: "2px 7px", borderRadius: 9999,
          background: "#F3F4F6", color: "#6B7280",
          flexShrink: 0,
        }}>
          {ep.role}
        </span>

        {/* Toggle */}
        <span style={{ color: "#9CA3AF", flexShrink: 0 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Detail panel */}
      {open && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          {/* Description */}
          <div style={{ padding: "14px 16px 0" }}>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{ep.description}</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: ep.parameters?.length ? "1fr 1fr" : "1fr",
            gap: 0,
          }}>
            {/* Parameters */}
            {ep.parameters && ep.parameters.length > 0 && (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                  Parameters
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ep.parameters.map(p => {
                    const pc = PARAM_IN_COLORS[p.in];
                    return (
                      <div key={p.name} style={{
                        padding: "10px 12px", borderRadius: 8,
                        background: "#F9FAFB", border: "1px solid #F3F4F6",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <code style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>
                            {p.name}
                          </code>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 9999,
                            background: pc.bg, color: pc.text,
                          }}>
                            {p.in}
                          </span>
                          <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "var(--font-mono, monospace)" }}>
                            {p.type}
                          </span>
                          {p.required && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444" }}>required</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{p.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Response */}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Response
                </p>
                <CopyBtn text={ep.response_shape} />
              </div>
              <div style={{
                background: "#0A2540", borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
              }}>
                <pre style={{
                  margin: 0, padding: "14px 16px",
                  fontSize: 11, lineHeight: 1.75,
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "var(--font-mono, monospace)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  overflowX: "auto",
                }}>
                  {ep.response_shape}
                </pre>
              </div>
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
export default function ApiReferencePage() {
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<HttpMethod | "ALL">("ALL");

  const filteredGroups = API_GROUPS.map(g => ({
    ...g,
    endpoints: g.endpoints.filter(ep => {
      const matchMethod = methodFilter === "ALL" || ep.method === methodFilter;
      const matchQuery = !query.trim() || ep.path.toLowerCase().includes(query.toLowerCase()) || ep.summary.toLowerCase().includes(query.toLowerCase());
      return matchMethod && matchQuery;
    }),
  })).filter(g => g.endpoints.length > 0);

  const totalEndpoints = API_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            API Reference
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="secondary">{totalEndpoints} endpoints</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Base URL: https://api.creditlinker.io</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", background: "#FFFBEB",
          border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10,
        }}>
          <Lock size={12} style={{ color: "#F59E0B" }} />
          <span style={{ fontSize: 12, color: "#92400E" }}>
            All endpoints require <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, background: "rgba(245,158,11,0.1)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &lt;key&gt;</code> unless marked public
          </span>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by path or description…"
            style={{
              width: "100%", padding: "9px 34px 9px 34px",
              border: "1px solid #E5E7EB", borderRadius: 9,
              fontSize: 13, color: "#374151", outline: "none",
              background: "white", boxSizing: "border-box",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Method filters */}
        {(["ALL", "GET", "POST", "PATCH", "PUT"] as const).map(m => {
          const active = methodFilter === m;
          const mc = m !== "ALL" ? METHOD_COLORS[m as HttpMethod] : null;
          return (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              style={{
                padding: "7px 12px", borderRadius: 8,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: m !== "ALL" ? "var(--font-mono, monospace)" : undefined,
                letterSpacing: m !== "ALL" ? "0.04em" : undefined,
                border: active
                  ? `1px solid ${mc ? mc.border : "#0A2540"}`
                  : "1px solid #E5E7EB",
                background: active
                  ? (mc ? mc.bg : "#0A2540")
                  : "white",
                color: active
                  ? (mc ? mc.text : "white")
                  : "#6B7280",
                transition: "all 0.12s",
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* ── GROUPS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {filteredGroups.length === 0 ? (
          <div style={{
            padding: "48px 24px", textAlign: "center" as const,
            background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
          }}>
            <Search size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>No endpoints match "{query}"</p>
          </div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.group}>
              {/* Group header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                  color: "#0A2540", letterSpacing: "-0.01em",
                }}>
                  {group.group}
                </h3>
                <code style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "var(--font-mono, monospace)" }}>
                  {group.prefix}
                </code>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{group.endpoints.length} endpoints</span>
              </div>

              {/* Endpoints */}
              <div>
                {group.endpoints.map(ep => (
                  <EndpointRow key={ep.method + ep.path} ep={ep} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
