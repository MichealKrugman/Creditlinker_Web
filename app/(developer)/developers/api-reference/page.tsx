"use client";

import { useState } from "react";
import { Search, X, ChevronDown, ChevronUp, Copy, CheckCircle2, Lock, Globe, Zap, AlertTriangle, Activity, Shield, ChevronRight } from "lucide-react";

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type EpTab = "overview" | "parameters" | "response" | "errors" | "examples";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface RespField {
  name: string;
  type: string;
  nullable?: boolean;
  description: string;
}

interface ErrorDef {
  status: number;
  code: string;
  description: string;
}

interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  title: string;
  summary: string;
  description: string;
  role: "business_owner" | "institution" | "partner" | "public";
  auth_required: boolean;
  path_params?: Param[];
  query_params?: Param[];
  body_params?: Param[];
  response_shape: string;
  response_fields?: RespField[];
  errors?: ErrorDef[];
  rate_limit?: string;
  idempotent?: boolean;
  paginated?: boolean;
  webhooks_triggered?: string[];
}

interface ApiGroup {
  id: string;
  group: string;
  prefix: string;
  endpoints: ApiEndpoint[];
}

/* ════════════════════════════════════════════════════════
   PAGE META & SHARED DATA
════════════════════════════════════════════════════════ */
const PAGE_META = {
  environments: [
    { label: "Production", url: "https://api.creditlinker.com.ng",         live: true  },
    { label: "Sandbox",    url: "https://sandbox.api.creditlinker.com.ng", live: false },
  ],
  version: {
    current: "2026-01",
    header:  "Creditlinker-Version",
    note:    "Pass the version as a request header. Omitting it defaults to the latest stable version.",
  },
  auth: {
    note: "Keys are role-scoped: business_owner · institution · partner. A request authenticated with a key outside its role returns 403.",
  },
  rate_limit: {
    global:  "200 requests / minute per API key",
    burst:   "20 requests / second",
    headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    note:    "Exceeding the limit returns 429 with a Retry-After header in seconds.",
  },
  status_codes: [
    { s: 200, label: "OK",                    desc: "Request succeeded" },
    { s: 201, label: "Created",               desc: "Resource created successfully" },
    { s: 400, label: "Bad Request",           desc: "Malformed request or missing required fields" },
    { s: 401, label: "Unauthorized",          desc: "Missing or invalid Bearer token" },
    { s: 403, label: "Forbidden",             desc: "Valid key but insufficient role permissions" },
    { s: 404, label: "Not Found",             desc: "Resource does not exist or is not visible to this key" },
    { s: 422, label: "Unprocessable Entity",  desc: "Validation failed — inspect the errors array" },
    { s: 429, label: "Too Many Requests",     desc: "Rate limit exceeded — observe the Retry-After header" },
    { s: 500, label: "Internal Server Error", desc: "Platform error — retry with exponential backoff" },
  ],
};

const COMMON_ERRORS: ErrorDef[] = [
  { status: 401, code: "unauthorized",        description: "Missing or invalid API key" },
  { status: 403, code: "forbidden",           description: "API key does not have access to this resource" },
  { status: 422, code: "validation_error",    description: "One or more request parameters failed validation" },
  { status: 429, code: "rate_limit_exceeded", description: "Too many requests — check Retry-After header" },
  { status: 500, code: "internal_error",      description: "Unexpected server error — retry with backoff" },
];

const API_GROUPS: ApiGroup[] = [
  /* ── Business — Score & Identity ─────────────────────────────── */
  {
    id: "business-identity", group: "Business — Score & Identity", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/score",
        title: "Get Financial Score", summary: "Latest computed financial score",
        description: "Returns the latest computed financial score for the authenticated business, including all six dimensional scores and data quality metadata.",
        role: "business_owner", auth_required: true,
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
        response_fields: [
          { name: "score_id",             type: "string",   description: "Unique identifier for this score record" },
          { name: "business_id",          type: "string",   description: "ID of the authenticated business" },
          { name: "computed_at",          type: "ISO 8601", description: "Timestamp when this score was computed" },
          { name: "dimensions",           type: "object",   description: "Map of six dimensional scores, each 0–100 with a label" },
          { name: "data_quality_score",   type: "number",   description: "Quality of the underlying financial data (0–100)" },
          { name: "data_months_analyzed", type: "number",   description: "Months of transaction data used in this computation" },
        ],
        errors: [ ...COMMON_ERRORS, { status: 404, code: "score_not_found", description: "No score computed yet — run the pipeline first" } ],
      },
      {
        method: "GET", path: "/business/profile",
        title: "Get Business Profile", summary: "Full business profile and identity status",
        description: "Returns the full profile for the authenticated business including identity status, operational data, and financing preferences.",
        role: "business_owner", auth_required: true,
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
        response_fields: [
          { name: "business_id",                 type: "string",   description: "Unique business identifier" },
          { name: "name",                        type: "string",   description: "Legal business name" },
          { name: "sector",                      type: "string",   description: "Industry sector" },
          { name: "profile_status",              type: "string",   description: "One of: active · incomplete · suspended" },
          { name: "open_to_financing",           type: "boolean",  description: "Whether the business is discoverable by capital providers" },
          { name: "selected_capital_categories", type: "string[]", description: "Capital types the business is seeking" },
        ],
      },
      {
        method: "PUT", path: "/business/profile",
        title: "Update Business Profile", summary: "Update profile fields",
        description: "Replaces profile fields with the provided values. All fields are optional — omitted fields retain their current values.",
        role: "business_owner", auth_required: true, idempotent: true,
        body_params: [
          { name: "name",                        type: "string",   required: false, description: "Legal business name",                                 example: "Aduke Bakeries Ltd." },
          { name: "sector",                      type: "string",   required: false, description: "Industry sector",                                    example: "Food & Beverage"     },
          { name: "open_to_financing",           type: "boolean",  required: false, description: "Make business discoverable to capital providers"                                   },
          { name: "selected_capital_categories", type: "string[]", required: false, description: "Capital types the business is seeking"                                           },
        ],
        response_shape: `{ "success": true }`,
      },
      {
        method: "GET", path: "/business/readiness",
        title: "Get Readiness Assessments", summary: "Capital readiness by category",
        description: "Returns readiness assessments for all capital categories the business is eligible for, grouped by category.",
        role: "business_owner", auth_required: true,
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
        title: "Get Identity Snapshots", summary: "Point-in-time financial identity records",
        description: "Returns a chronological list of financial identity snapshots — versioned point-in-time records created after each pipeline run.",
        role: "business_owner", auth_required: true,
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

  /* ── Business — Data Sources ─────────────────────────────────── */
  {
    id: "business-data", group: "Business — Data Sources", prefix: "/business",
    endpoints: [
      {
        method: "POST", path: "/business/mono/initiate",
        title: "Initiate Mono Bank Link", summary: "Start the Mono Connect OAuth flow",
        description: "Initiates the Mono Connect flow. Returns a URL to redirect the user to for OAuth bank account linking.",
        role: "business_owner", auth_required: true,
        response_shape: `{ "mono_link_url": "https://connect.mono.co/..." }`,
      },
      {
        method: "POST", path: "/business/mono/callback",
        title: "Exchange Mono Auth Token", summary: "Complete bank link after OAuth",
        description: "Exchanges the Mono auth code received after the user completes the bank link flow for a persistent linked account.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "code", type: "string", required: true, description: "Auth code returned by Mono after user completes linking", example: "mono_auth_abc123" },
        ],
        response_shape: `{ "success": true, "account_id": "acc_01HX..." }`,
      },
      {
        method: "POST", path: "/business/upload/csv",
        title: "Upload CSV Transactions", summary: "Ingest transactions from a CSV file",
        description: "Accepts a raw CSV string and a column mapping definition. Records are ingested and queued for pipeline processing.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "csv_content", type: "string", required: true, description: "Raw CSV text content" },
          { name: "column_map",  type: "object", required: true, description: "Maps CSV column names to transaction fields: date, amount, direction, description" },
        ],
        response_shape: `{ "success": true, "records_imported": 248 }`,
      },
    ],
  },

  /* ── Business — Consent ────────────────────────────────────────── */
  {
    id: "business-consent", group: "Business — Consent", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/consent",
        title: "List Active Consents", summary: "All consent records for the business",
        description: "Returns all consent records — both active and previously revoked — with access logs and permission details.",
        role: "business_owner", auth_required: true,
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
        title: "Grant Financer Consent", summary: "Grant a capital provider access",
        description: "Grants a capital provider access to the business's financial identity for a specified duration. Creates a new ConsentRecord.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "institution_id",                   type: "string",  required: true,  description: "The institution to grant access to",            example: "inst_01HX..." },
          { name: "permissions.can_view_score",        type: "boolean", required: false, description: "Allow the institution to view dimensional scores"                   },
          { name: "permissions.can_view_identity",     type: "boolean", required: false, description: "Allow the institution to view the full identity profile"            },
          { name: "permissions.can_view_transactions", type: "boolean", required: false, description: "Allow the institution to view transaction-level detail"            },
          { name: "duration_days",                     type: "number",  required: true,  description: "Access duration in days",                       example: "30"          },
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
        title: "Revoke Consent", summary: "Revoke an active consent grant",
        description: "Revokes an active consent grant. The institution immediately loses access to the business's financial identity.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "consent_id", type: "string", required: true, description: "ID of the consent record to revoke", example: "con_01HX..." },
        ],
        response_shape: `{ "success": true }`,
      },
    ],
  },

  /* ── Business — Financing ──────────────────────────────────────── */
  {
    id: "business-financing", group: "Business — Financing", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/financing",
        title: "List Financing Records", summary: "All financing records for the business",
        description: "Returns all financing records including active, settled, and disputed records.",
        role: "business_owner", auth_required: true,
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
        method: "POST", path: "/business/financing/:financing_id/submit-settlement",
        title: "Submit Settlement", summary: "Signal intent to repay a financing record",
        description: "Initiates a settlement request. This creates the settlement record before proof is submitted.",
        role: "business_owner", auth_required: true,
        path_params: [ { name: "financing_id", type: "string", required: true, description: "The financing record ID", example: "fin_01HX..." } ],
        body_params:  [ { name: "amount", type: "number", required: true, description: "Amount being settled in kobo (NGN)", example: "5000000" } ],
        response_shape: `{ "settlement_id": "stl_01HX...", "financing_id": "fin_01HX...", "status": "pending_proof", "initiated_at": "2025-01-28T10:00:00Z" }`,
      },
      {
        method: "POST", path: "/business/financing/:financing_id/settlement",
        title: "Submit Settlement Proof", summary: "Attach repayment proof to a settlement",
        description: "Submits repayment proof for an active settlement record. The platform verifies the settlement against bank data where possible.",
        role: "business_owner", auth_required: true,
        path_params: [ { name: "financing_id", type: "string", required: true, description: "The financing record ID", example: "fin_01HX..." } ],
        body_params: [
          { name: "settlement_id",       type: "string", required: true, description: "The settlement record to attach proof to" },
          { name: "proof.reference",     type: "string", required: true, description: "Bank transaction reference number" },
          { name: "proof.bank",          type: "string", required: true, description: "Bank name or code",  example: "GTBank" },
          { name: "proof.transfer_date", type: "string", required: true, description: "Date of transfer (ISO date)", example: "2025-01-30" },
        ],
        response_shape: `{ "financing_id": "fin_01HX...", "status": "settled", "settled_at": "2025-01-30T14:22:00Z" }`,
      },
      {
        method: "POST", path: "/business/financing/:financing_id/confirm-settlement",
        title: "Confirm Settlement", summary: "Confirm receipt of settlement",
        description: "Confirms a previously submitted settlement once the institution has acknowledged receipt.",
        role: "business_owner", auth_required: true,
        path_params: [ { name: "financing_id",  type: "string", required: true, description: "The financing record ID",       example: "fin_01HX..." } ],
        body_params:  [ { name: "settlement_id", type: "string", required: true, description: "The settlement record to confirm", example: "stl_01HX..." } ],
        response_shape: `{ "financing_id": "fin_01HX...", "status": "settled", "confirmed_at": "2025-01-30T14:22:00Z" }`,
      },
    ],
  },

  /* ── Business — Transactions ──────────────────────────────────── */
  {
    id: "business-transactions", group: "Business — Transactions", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/transactions",
        title: "Get Transaction History", summary: "Paginated transaction history",
        description: "Returns paginated transaction history for the authenticated business across all linked data sources.",
        role: "business_owner", auth_required: true, paginated: true,
        query_params: [
          { name: "page",   type: "number", required: false, description: "Page number (default: 1)",                    example: "1"          },
          { name: "limit",  type: "number", required: false, description: "Results per page (default: 50, max: 200)",    example: "50"         },
          { name: "source", type: "string", required: false, description: "Filter by source: mono · csv · partner"                          },
          { name: "from",   type: "string", required: false, description: "ISO date range start",                        example: "2024-01-01" },
          { name: "to",     type: "string", required: false, description: "ISO date range end",                          example: "2024-12-31" },
        ],
        response_shape: `{
  "data": [
    {
      "transaction_id": "txn_01HX...",
      "date": "2025-01-14",
      "amount": 250000,
      "currency": "NGN",
      "direction": "credit",
      "description": "Transfer from Paystack",
      "source": "mono",
      "category": "revenue"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 1240 }
}`,
      },
      {
        method: "GET", path: "/business/mono/transactions",
        title: "Fetch Mono Transactions", summary: "Force-sync transactions from Mono",
        description: "Fetches the latest transactions from the linked Mono account and syncs them into the platform. Use to force a refresh outside the scheduled sync cycle.",
        role: "business_owner", auth_required: true,
        response_shape: `{ "synced": true, "records_fetched": 84, "synced_at": "2025-01-15T11:00:00Z" }`,
      },
    ],
  },

  /* ── Business — Forecasting & Reports ───────────────────────── */
  {
    id: "business-forecasting", group: "Business — Forecasting & Reports", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/forecast",
        title: "Get Cashflow Forecast", summary: "Forward-looking cashflow projection",
        description: "Returns a forward-looking cashflow forecast based on historical transaction patterns. Covers a 90-day projection window by default.",
        role: "business_owner", auth_required: true,
        query_params: [ { name: "days", type: "number", required: false, description: "Forecast horizon in days (default: 90, max: 180)", example: "90" } ],
        response_shape: `{
  "forecast_id": "fct_01HX...",
  "generated_at": "2025-01-15T10:32:44Z",
  "horizon_days": 90,
  "projected_inflow": 12400000,
  "projected_outflow": 9800000,
  "net_cashflow": 2600000,
  "confidence": 0.81,
  "periods": [ { "week": 1, "inflow": 1400000, "outflow": 1100000, "net": 300000 } ]
}`,
      },
      {
        method: "POST", path: "/business/reports",
        title: "Generate Report", summary: "Generate a structured financial report",
        description: "Triggers generation of a financial report for the authenticated business. Reports are returned as structured JSON.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "report_type", type: "string", required: true, description: "Type: cashflow_summary · income_statement · transaction_analysis", example: "cashflow_summary" },
          { name: "from",        type: "string", required: true, description: "Report period start (ISO date)",                                   example: "2024-01-01"       },
          { name: "to",          type: "string", required: true, description: "Report period end (ISO date)",                                     example: "2024-12-31"       },
        ],
        response_shape: `{ "report_id": "rpt_01HX...", "report_type": "cashflow_summary", "generated_at": "2025-01-15T10:32:44Z", "period": { "from": "2024-01-01", "to": "2024-12-31" }, "data": { "..." } }`,
      },
    ],
  },

  /* ── Business — Pipeline ─────────────────────────────────────────── */
  {
    id: "business-pipeline", group: "Business — Pipeline", prefix: "/business",
    endpoints: [
      {
        method: "POST", path: "/business/pipeline/run",
        title: "Run Pipeline", summary: "Trigger a full data pipeline run",
        description: "Triggers a full data pipeline run — ingesting, processing, and recomputing the financial identity and score for the authenticated business.",
        role: "business_owner", auth_required: true,
        webhooks_triggered: ["pipeline.started", "pipeline.completed", "pipeline.failed"],
        response_shape: `{ "run_id": "run_01HX...", "status": "queued", "queued_at": "2025-01-15T10:32:44Z" }`,
      },
      {
        method: "GET", path: "/business/pipeline/logs",
        title: "Get Pipeline Logs", summary: "History of pipeline runs",
        description: "Returns a list of pipeline runs for the business, including status, duration, and step-level logs.",
        role: "business_owner", auth_required: true,
        query_params: [ { name: "limit", type: "number", required: false, description: "Number of runs to return (default: 10)", example: "10" } ],
        response_shape: `[
  {
    "run_id": "run_01HX...",
    "status": "completed",
    "started_at": "2025-01-15T10:30:00Z",
    "completed_at": "2025-01-15T10:32:44Z",
    "steps": [
      { "step": "ingest", "status": "ok", "records": 248 },
      { "step": "score",  "status": "ok" }
    ]
  }
]`,
      },
    ],
  },

  /* ── Business — Settings ────────────────────────────────────────── */
  {
    id: "business-settings", group: "Business — Settings", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/settings",
        title: "Get Account Settings", summary: "Retrieve current account settings",
        description: "Returns the current account settings for the authenticated business, including notification preferences and integration flags.",
        role: "business_owner", auth_required: true,
        response_shape: `{ "notifications": { "email": true, "in_app": true }, "pipeline_auto_run": false, "discovery_visible": true }`,
      },
      {
        method: "PATCH", path: "/business/settings",
        title: "Update Account Settings", summary: "Partial update of account settings",
        description: "Partially updates account settings. Only provided fields are modified; others are unchanged.",
        role: "business_owner", auth_required: true, idempotent: true,
        body_params: [
          { name: "notifications",     type: "object",  required: false, description: "Notification preferences with email and in_app boolean fields" },
          { name: "pipeline_auto_run", type: "boolean", required: false, description: "Auto-trigger pipeline when new data arrives"                   },
          { name: "discovery_visible", type: "boolean", required: false, description: "Whether the business appears in institution discovery"          },
        ],
        response_shape: `{ "success": true }`,
      },
    ],
  },

  /* ── Business — Disputes ────────────────────────────────────────── */
  {
    id: "business-disputes", group: "Business — Disputes", prefix: "/business",
    endpoints: [
      {
        method: "GET", path: "/business/disputes",
        title: "List Disputes", summary: "All disputes for the business",
        description: "Returns all disputes raised by or involving the authenticated business.",
        role: "business_owner", auth_required: true,
        response_shape: `[
  {
    "dispute_id": "dsp_01HX...",
    "financing_id": "fin_01HX...",
    "status": "open",
    "reason": "settlement_not_reflected",
    "raised_at": "2025-01-20T09:00:00Z"
  }
]`,
      },
      {
        method: "POST", path: "/business/disputes",
        title: "Open a Dispute", summary: "Raise a dispute on a financing record",
        description: "Opens a dispute against a financing record. The platform notifies the relevant institution and flags the record for review.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "financing_id", type: "string", required: true,  description: "The financing record being disputed",                                          example: "fin_01HX..."              },
          { name: "reason",       type: "string", required: true,  description: "Reason: settlement_not_reflected · incorrect_terms · unauthorized_access",   example: "settlement_not_reflected" },
          { name: "description",  type: "string", required: false, description: "Free-text description of the issue"                                                                              },
        ],
        response_shape: `{ "dispute_id": "dsp_01HX...", "status": "open", "raised_at": "2025-01-20T09:00:00Z" }`,
        webhooks_triggered: ["dispute.opened"],
      },
    ],
  },

  /* ── Business — Franchises ──────────────────────────────────────── */
  {
    id: "business-franchises", group: "Business — Franchises", prefix: "/business",
    endpoints: [
      {
        method: "POST", path: "/business/franchise/invite",
        title: "Invite Franchise", summary: "Invite a branch or franchise business",
        description: "Sends an invitation to a franchise or branch business to join the network under the authenticated business.",
        role: "business_owner", auth_required: true,
        body_params: [
          { name: "email",         type: "string", required: true,  description: "Email address of the franchise to invite",  example: "franchise@example.com"  },
          { name: "business_name", type: "string", required: false, description: "Expected business name of the franchise",    example: "Aduke Bakeries — Lekki" },
        ],
        response_shape: `{ "success": true, "invite_id": "inv_01HX..." }`,
      },
    ],
  },

  /* ── Institution ──────────────────────────────────────────────────── */
  {
    id: "institution", group: "Institution", prefix: "/institution",
    endpoints: [
      {
        method: "GET", path: "/institution/profile/:financial_identity_id",
        title: "Get Business Profile", summary: "Consent-gated business profile",
        description: "Returns the financial profile of a business. Requires an active consent record. Returns only fields permitted by the consent's permission scope.",
        role: "institution", auth_required: true,
        path_params: [ { name: "financial_identity_id", type: "string", required: true, description: "The financial identity ID of the target business", example: "fid_01HX..." } ],
        errors: [ ...COMMON_ERRORS, { status: 403, code: "consent_required", description: "No active consent from this business for your institution" }, { status: 404, code: "identity_not_found", description: "Financial identity not found" } ],
        response_shape: `{ "financial_identity_id": "fid_01HX...", "name": "Aduke Bakeries Ltd.", "sector": "Food & Beverage", "score": { "..." }, "data_quality_score": 91 }`,
        response_fields: [
          { name: "financial_identity_id", type: "string",  description: "Unique financial identity identifier" },
          { name: "name",                  type: "string",  description: "Business name (visible if consent includes identity access)" },
          { name: "sector",                type: "string",  description: "Industry sector" },
          { name: "score",                 type: "object",  description: "Score data (visible if consent includes score access)" },
          { name: "data_quality_score",    type: "number",  description: "Quality of the business's financial data (0–100)" },
        ],
      },
      {
        method: "GET", path: "/institution/discovery",
        title: "Get Discovery Matches", summary: "Anonymized matched businesses",
        description: "Returns anonymized discovery matches — businesses whose profiles match the institution's configured criteria and who have opted into financing discovery.",
        role: "institution", auth_required: true,
        response_shape: `[
  {
    "match_id": "mtc_01HX...",
    "anonymized_id": "anon_01HX...",
    "capital_category": "working_capital",
    "match_score": 94,
    "status": "pending"
  }
]`,
        response_fields: [
          { name: "match_id",         type: "string", description: "Unique identifier for this match" },
          { name: "anonymized_id",    type: "string", description: "Opaque business identifier — revealed only after consent is granted" },
          { name: "capital_category", type: "string", description: "Capital type this match was evaluated against" },
          { name: "match_score",      type: "number", description: "Compatibility score against your criteria (0–100)" },
          { name: "status",           type: "string", description: "One of: pending · access_requested · consented · declined" },
        ],
      },
      {
        method: "POST", path: "/institution/discovery/criteria",
        title: "Set Matching Criteria", summary: "Configure discovery match criteria",
        description: "Configures the institution's matching criteria. The discovery engine continuously evaluates business profiles against these criteria.",
        role: "institution", auth_required: true,
        body_params: [
          { name: "capital_category",       type: "string", required: true,  description: "Capital type this criteria applies to",            example: "working_capital" },
          { name: "min_revenue_stability",  type: "number", required: false, description: "Minimum Revenue Stability score (0–100)",          example: "70"              },
          { name: "min_cashflow_score",     type: "number", required: false, description: "Minimum Cashflow Predictability score (0–100)",    example: "65"              },
          { name: "min_data_months",        type: "number", required: false, description: "Minimum months of financial data required",        example: "6"               },
          { name: "min_data_quality_score", type: "number", required: false, description: "Minimum data quality score required (0–100)",      example: "75"              },
        ],
        response_shape: `{ "success": true, "criteria_id": "crt_01HX..." }`,
      },
      {
        method: "POST", path: "/institution/discovery/:match_id/request-access",
        title: "Request Business Access", summary: "Send an access request to a matched business",
        description: "Sends an access request to a matched business. The business receives a notification and can approve or deny the request.",
        role: "institution", auth_required: true,
        path_params: [ { name: "match_id", type: "string", required: true, description: "The discovery match ID", example: "mtc_01HX..." } ],
        response_shape: `{ "success": true, "request_id": "req_01HX..." }`,
        webhooks_triggered: ["access_request.sent"],
      },
      {
        method: "GET", path: "/institution/financer",
        title: "Get Financer Data", summary: "Institution profile and performance data",
        description: "Returns profile and performance data for the authenticated institution, including total deployments, active financing records, and settlement rates.",
        role: "institution", auth_required: true,
        response_shape: `{ "institution_id": "inst_01HX...", "name": "Nexus Capital Ltd.", "active_financing_count": 12, "total_deployed_ngn": 45000000, "settlement_rate": 0.94 }`,
      },
      {
        method: "PATCH", path: "/institution/financing/:financing_id/access",
        title: "Manage Financing Access", summary: "Adjust permissions on a financing record",
        description: "Updates the access level or permissions on an active financing record.",
        role: "institution", auth_required: true,
        path_params: [ { name: "financing_id", type: "string", required: true, description: "The financing record ID", example: "fin_01HX..." } ],
        body_params: [
          { name: "can_view_transactions", type: "boolean", required: false, description: "Grant or revoke transaction-level visibility" },
          { name: "can_view_score",        type: "boolean", required: false, description: "Grant or revoke score visibility"              },
          { name: "can_view_identity",     type: "boolean", required: false, description: "Grant or revoke full identity profile visibility" },
        ],
        response_shape: `{ "success": true }`,
      },
      {
        method: "GET", path: "/institution/disputes",
        title: "List Disputes", summary: "Disputes on institution-issued financing",
        description: "Returns all disputes involving financing records issued by the authenticated institution.",
        role: "institution", auth_required: true,
        response_shape: `[
  {
    "dispute_id": "dsp_01HX...",
    "financing_id": "fin_01HX...",
    "business_id": "biz_01HX...",
    "status": "open",
    "reason": "settlement_not_reflected",
    "raised_at": "2025-01-20T09:00:00Z"
  }
]`,
      },
    ],
  },

  /* ── Partner ───────────────────────────────────────────────────────── */
  {
    id: "partner", group: "Partner", prefix: "/partner",
    endpoints: [
      {
        method: "GET", path: "/partner/consent/status",
        title: "Check Consent Status", summary: "Verify business consent and access tier",
        description: "Returns the current consent status for a business token, including access tier and permitted fields.",
        role: "partner", auth_required: true,
        query_params: [ { name: "business_token", type: "string", required: true, description: "Opaque token issued when a business grants partner consent", example: "btoken_01HX..." } ],
        response_shape: `{ "active": true, "access_tier": "read", "permitted_fields": ["score", "sector", "revenue_band"], "valid_until": "2025-03-01T00:00:00Z" }`,
      },
      {
        method: "POST", path: "/partner/submit/:submission_type",
        title: "Submit Data to Pipeline", summary: "Contribute verified data into the pipeline",
        description: "Allows a build-tier partner to contribute verified data into the Creditlinker pipeline. Valid types: submit_bank_transactions · submit_identity_signals · submit_operational_data.",
        role: "partner", auth_required: true,
        path_params: [ { name: "submission_type", type: "string", required: true, description: "submit_bank_transactions · submit_identity_signals · submit_operational_data", example: "submit_bank_transactions" } ],
        body_params: [
          { name: "business_token", type: "string", required: true, description: "Opaque business token",                                           example: "btoken_01HX..." },
          { name: "data",           type: "array",  required: true, description: "Array of data records matching the submission type schema" },
        ],
        response_shape: `{ "accepted": true, "submission_id": "sub_01HX...", "records_accepted": 120, "records_rejected": 2 }`,
      },
      {
        method: "GET", path: "/partner/query",
        title: "Query Partner Data", summary: "Status of previously submitted data",
        description: "Returns data the partner has previously submitted and its current processing status within the pipeline.",
        role: "partner", auth_required: true,
        query_params: [
          { name: "submission_id", type: "string", required: false, description: "Filter by a specific submission ID",                              example: "sub_01HX..." },
          { name: "status",        type: "string", required: false, description: "Filter by status: accepted · processing · completed · failed" },
        ],
        response_shape: `[
  {
    "submission_id": "sub_01HX...",
    "submission_type": "submit_bank_transactions",
    "status": "completed",
    "submitted_at": "2025-01-14T08:00:00Z",
    "records_processed": 120
  }
]`,
      },
      {
        method: "POST", path: "/partner/webhooks/dispatch",
        title: "Dispatch Webhook", summary: "Manually dispatch a webhook event",
        description: "Manually dispatches a webhook event to the partner's registered endpoint. Useful for testing and replaying missed events.",
        role: "partner", auth_required: true,
        body_params: [
          { name: "event_type", type: "string", required: true, description: "The event type to dispatch", example: "pipeline.completed" },
          { name: "payload",    type: "object", required: true, description: "Event payload matching the event type schema"            },
        ],
        response_shape: `{ "dispatched": true, "dispatch_id": "dsp_01HX...", "endpoint": "https://partner.example.com/webhooks" }`,
      },
      {
        method: "POST", path: "/partner/webhooks/test",
        title: "Test Webhook", summary: "Verify webhook connectivity",
        description: "Sends a test ping to the partner's registered webhook endpoint to verify connectivity and response handling.",
        role: "partner", auth_required: true,
        response_shape: `{ "success": true, "response_status": 200, "latency_ms": 142 }`,
      },
    ],
  },

  /* ── Health ─────────────────────────────────────────────────────────── */
  {
    id: "health", group: "Health", prefix: "/",
    endpoints: [
      {
        method: "GET", path: "/health",
        title: "Health Check", summary: "Platform health status",
        description: "Returns the current platform health status. No authentication required.",
        role: "public", auth_required: false,
        response_shape: `{ "status": "ok", "version": "2026-01" }`,
      },
    ],
  },
];

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string; border: string; dot: string }> = {
  GET:    { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", dot: "#10B981" },
  POST:   { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", dot: "#3B82F6" },
  PATCH:  { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A", dot: "#F59E0B" },
  PUT:    { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE", dot: "#8B5CF6" },
  DELETE: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", dot: "#EF4444" },
};

const PARAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  path:  { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  query: { bg: "#F0FDFF", text: "#0891B2", border: "#A5F3FC" },
  body:  { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
};

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */
function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.1)",
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.45)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s", letterSpacing: "0.02em",
      }}
    >
      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   CODE BLOCK
───────────────────────────────────────────────────────── */
function CodeBlock({ code, copyLabel }: { code: string; copyLabel?: string }) {
  return (
    <div style={{
      background: "#0D1F35",
      borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "8px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.2)",
      }}>
        <CopyBtn text={code} label={copyLabel} />
      </div>
      <pre style={{
        margin: 0, padding: "14px 16px",
        fontSize: 12, lineHeight: 1.8,
        color: "rgba(255,255,255,0.75)",
        fontFamily: "var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        overflowX: "auto",
      }}>
        {code}
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARAM TABLE
───────────────────────────────────────────────────────── */
function ParamRow({ p, location }: { p: { name: string; type: string; required: boolean; description: string; example?: string }; location: "path" | "query" | "body" }) {
  const pc = PARAM_COLORS[location];
  return (
    <div style={{
      padding: "12px 14px",
      borderBottom: "1px solid #F3F4F6",
      display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "start",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <code style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>
            {p.name}
          </code>
          {p.required && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", letterSpacing: "0.04em" }}>REQUIRED</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
            background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
            letterSpacing: "0.05em",
          }}>
            {location}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "var(--font-mono, monospace)" }}>{p.type}</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>{p.description}</p>
        {p.example && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>Example: </span>
            <code style={{ fontSize: 10, color: "#7C3AED", fontFamily: "var(--font-mono, monospace)", background: "#F5F3FF", padding: "1px 5px", borderRadius: 4 }}>{p.example}</code>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ENDPOINT ROW
───────────────────────────────────────────────────────── */
function EndpointRow({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<EpTab>("overview");
  const mc = METHOD_COLORS[ep.method];

  const hasParams = (ep.path_params?.length ?? 0) + (ep.query_params?.length ?? 0) + (ep.body_params?.length ?? 0) > 0;
  const hasErrors = (ep.errors?.length ?? 0) > 0;
  const hasMeta   = ep.idempotent || ep.paginated || ep.rate_limit || (ep.webhooks_triggered?.length ?? 0) > 0;

  const tabs: { id: EpTab; label: string }[] = [
    { id: "overview",   label: "Overview"   },
    { id: "parameters", label: "Parameters" },
    { id: "response",   label: "Response"   },
    { id: "errors",     label: "Errors"     },
    { id: "examples",   label: "Examples"   },
  ];

  const curlExample = `curl -X ${ep.method} \\\n  https://api.creditlinker.com.ng${ep.path} \\\n  -H "Authorization: Bearer <your-api-key>" \\\n  -H "Content-Type: application/json"${
    ep.body_params?.length
      ? ` \\\n  -d '{ ${ep.body_params.filter(p => p.required).map(p => `"${p.name}": "${p.example ?? `<${p.type}>`}"`).join(", ")} }'`
      : ""
  }`;

  return (
    <div style={{
      border: `1px solid ${open ? "#E5E7EB" : "#F3F4F6"}`,
      borderRadius: 12, overflow: "hidden",
      background: "white",
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: open ? "0 4px 24px rgba(10,37,64,0.06)" : "none",
      marginBottom: 6,
    }}>
      {/* ── COLLAPSED ROW ── */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) setTab("overview"); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "11px 16px",
          background: open ? "#FAFBFC" : "transparent",
          borderTop: "none", borderLeft: "none", borderRight: "none",
          borderBottom: open ? "1px solid #F3F4F6" : "none",
          cursor: "pointer", textAlign: "left" as const,
        }}
      >
        {/* Method badge */}
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.07em",
          padding: "3px 8px", borderRadius: 5,
          background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`,
          fontFamily: "var(--font-mono, monospace)",
          minWidth: 44, textAlign: "center" as const, flexShrink: 0,
        }}>{ep.method}</span>

        {/* Path */}
        <code style={{
          fontSize: 12, color: "#0A2540",
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 600, flex: "0 1 auto",
          wordBreak: "break-all",
        }}>{ep.path}</code>

        {/* Summary */}
        <span style={{ fontSize: 12, color: "#6B7280", flex: 1, textAlign: "left" as const, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ep.summary}
        </span>

        {/* Flags */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {ep.paginated && (
            <span title="Paginated" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>PAGED</span>
          )}
          {ep.idempotent && (
            <span title="Idempotent" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>IDMP</span>
          )}
          {!ep.auth_required && (
            <span title="No auth required" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>PUBLIC</span>
          )}
        </div>

        <span style={{ color: "#9CA3AF", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(0deg)" : "rotate(0deg)" }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* ── EXPANDED PANEL ── */}
      {open && (
        <div>
          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "center",
            borderBottom: "1px solid #F3F4F6",
            padding: "0 16px",
            background: "#FAFBFC",
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 14px",
                  fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? "#0A2540" : "#9CA3AF",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: tab === t.id ? "2px solid #0A2540" : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.12s",
                  letterSpacing: "0.01em",
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "20px 20px" }}>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Description */}
                <div>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{ep.description}</p>
                </div>

                {/* Meta grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  <MetaCard icon={<Lock size={13} />} label="Authentication" value={ep.auth_required ? `Required · ${ep.role}` : "Public — no auth needed"} accent={ep.auth_required ? "#F59E0B" : "#10B981"} />
                  {ep.rate_limit && <MetaCard icon={<Zap size={13} />} label="Rate Limit" value={ep.rate_limit} accent="#8B5CF6" />}
                  {ep.idempotent && <MetaCard icon={<Shield size={13} />} label="Idempotency" value="This endpoint is idempotent" accent="#7C3AED" />}
                  {ep.paginated && <MetaCard icon={<ChevronRight size={13} />} label="Pagination" value="Supports page · limit query params" accent="#2563EB" />}
                  {ep.webhooks_triggered && ep.webhooks_triggered.length > 0 && (
                    <MetaCard icon={<Activity size={13} />} label="Webhooks" value={ep.webhooks_triggered.join(" · ")} accent="#059669" />
                  )}
                </div>

                {/* Request headers */}
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", border: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Request Headers</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {ep.auth_required && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <code style={{ fontSize: 12, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", minWidth: 140 }}>Authorization</code>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Bearer &lt;api-key&gt; — required</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <code style={{ fontSize: 12, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", minWidth: 140 }}>Content-Type</code>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>application/json</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <code style={{ fontSize: 12, color: "#0A2540", fontFamily: "var(--font-mono, monospace)", minWidth: 140 }}>Creditlinker-Version</code>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>2026-01 (optional — defaults to latest)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PARAMETERS ── */}
            {tab === "parameters" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {!hasParams && (
                  <div style={{ padding: "24px 0", textAlign: "center" as const }}>
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>This endpoint has no parameters.</p>
                  </div>
                )}
                {ep.path_params && ep.path_params.length > 0 && (
                  <ParamSection title="Path Parameters" color={PARAM_COLORS.path}>
                    {ep.path_params.map(p => <ParamRow key={p.name} p={p} location="path" />)}
                  </ParamSection>
                )}
                {ep.query_params && ep.query_params.length > 0 && (
                  <ParamSection title="Query Parameters" color={PARAM_COLORS.query}>
                    {ep.query_params.map(p => <ParamRow key={p.name} p={p} location="query" />)}
                  </ParamSection>
                )}
                {ep.body_params && ep.body_params.length > 0 && (
                  <ParamSection title="Request Body" color={PARAM_COLORS.body}>
                    {ep.body_params.map(p => <ParamRow key={p.name} p={p} location="body" />)}
                  </ParamSection>
                )}
              </div>
            )}

            {/* ── RESPONSE ── */}
            {tab === "response" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Success Response — 200 / 201</p>
                  <CodeBlock code={ep.response_shape} copyLabel="Copy JSON" />
                </div>
                {ep.response_fields && ep.response_fields.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Response Fields</p>
                    <div style={{ border: "1px solid #F3F4F6", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "160px 80px 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Field</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Type</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Description</span>
                      </div>
                      {ep.response_fields.map((f, i) => (
                        <div key={f.name} style={{
                          display: "grid", gridTemplateColumns: "160px 80px 1fr",
                          padding: "10px 14px", alignItems: "start",
                          borderBottom: i < ep.response_fields!.length - 1 ? "1px solid #F9FAFB" : "none",
                          background: i % 2 === 0 ? "white" : "#FAFAFA",
                        }}>
                          <code style={{ fontSize: 12, fontWeight: 600, color: "#0A2540", fontFamily: "var(--font-mono, monospace)" }}>{f.name}</code>
                          <code style={{ fontSize: 11, color: "#7C3AED", fontFamily: "var(--font-mono, monospace)" }}>{f.type}</code>
                          <span style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6 }}>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ERRORS ── */}
            {tab === "errors" && (
              <div>
                {!hasErrors ? (
                  <div style={{ padding: "24px 0", textAlign: "center" as const }}>
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>No endpoint-specific error codes documented.</p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #F3F4F6", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "60px 200px 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Status</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Code</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Description</span>
                    </div>
                    {ep.errors!.map((e, i) => (
                      <div key={`${e.status}-${e.code}`} style={{
                        display: "grid", gridTemplateColumns: "60px 200px 1fr",
                        padding: "10px 14px", alignItems: "center",
                        borderBottom: i < ep.errors!.length - 1 ? "1px solid #F9FAFB" : "none",
                        background: i % 2 === 0 ? "white" : "#FAFAFA",
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: e.status >= 500 ? "#DC2626" : e.status >= 400 ? "#D97706" : "#059669",
                          fontFamily: "var(--font-mono, monospace)",
                        }}>{e.status}</span>
                        <code style={{ fontSize: 11, color: "#7C3AED", fontFamily: "var(--font-mono, monospace)" }}>{e.code}</code>
                        <span style={{ fontSize: 12, color: "#4B5563" }}>{e.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── EXAMPLES ── */}
            {tab === "examples" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>cURL</p>
                  <CodeBlock code={curlExample} copyLabel="Copy cURL" />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>JavaScript / TypeScript</p>
                  <CodeBlock code={buildJsExample(ep)} copyLabel="Copy JS" />
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   META CARD
───────────────────────────────────────────────────────── */
function MetaCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 8,
      background: "#FAFBFC", border: "1px solid #F3F4F6",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: accent }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9CA3AF" }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARAM SECTION
───────────────────────────────────────────────────────── */
function ParamSection({ title, color, children }: { title: string; color: { bg: string; text: string; border: string }; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 9999,
          background: color.bg, color: color.text, border: `1px solid ${color.border}`,
          letterSpacing: "0.06em",
        }}>{title}</span>
      </div>
      <div style={{ border: "1px solid #F3F4F6", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", padding: "7px 14px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Parameter</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Details</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   JS EXAMPLE BUILDER
───────────────────────────────────────────────────────── */
function buildJsExample(ep: ApiEndpoint): string {
  const hasBody = ep.body_params && ep.body_params.length > 0;
  const bodyFields = hasBody
    ? ep.body_params!.filter(p => p.required).map(p => `  ${p.name}: "${p.example ?? `<${p.type}>`}"`).join(",\n")
    : null;

  const path = ep.path.replace(/:([a-zA-Z_]+)/g, '${$1}');

  return `const response = await fetch(\n  \`https://api.creditlinker.com.ng${path}\`,\n  {\n    method: "${ep.method}",\n    headers: {\n      "Authorization": \`Bearer \${process.env.CREDITLINKER_API_KEY}\`,\n      "Content-Type": "application/json",\n    },${hasBody ? `\n    body: JSON.stringify({\n${bodyFields}\n    }),` : ""}\n  }\n);\n\nconst data = await response.json();`;
}

/* ─────────────────────────────────────────────────────────
   PAGE-LEVEL INFO STRIP
───────────────────────────────────────────────────────── */
function InfoStrip() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(v => v === id ? null : id);

  const cards = [
    {
      id: "environments",
      icon: <Globe size={13} />,
      label: "Environments",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14 }}>
          {PAGE_META.environments.map(e => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.live ? "#10B981" : "#F59E0B", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", minWidth: 90 }}>{e.label}</span>
              <code style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-mono, monospace)" }}>{e.url}</code>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "auth",
      icon: <Lock size={13} />,
      label: "Authentication",
      content: (
        <div style={{ paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, margin: 0 }}>
            Pass your key as <code style={{ fontFamily: "var(--font-mono, monospace)", background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &lt;key&gt;</code> on every request.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginTop: 8, marginBottom: 0 }}>{PAGE_META.auth.note}</p>
        </div>
      ),
    },
    {
      id: "ratelimit",
      icon: <Zap size={13} />,
      label: "Rate Limits",
      content: (
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Global</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: 0 }}>{PAGE_META.rate_limit.global}</p>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Burst</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: 0 }}>{PAGE_META.rate_limit.burst}</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>{PAGE_META.rate_limit.note}</p>
        </div>
      ),
    },
    {
      id: "statuscodes",
      icon: <Activity size={13} />,
      label: "Status Codes",
      content: (
        <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
          {PAGE_META.status_codes.map(sc => (
            <div key={sc.s} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <code style={{
                fontSize: 11, fontWeight: 700, minWidth: 36,
                fontFamily: "var(--font-mono, monospace)",
                color: sc.s >= 500 ? "#FCA5A5" : sc.s >= 400 ? "#FCD34D" : "#6EE7B7",
              }}>{sc.s}</code>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", minWidth: 80 }}>{sc.label}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sc.desc}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
    }}>
      {cards.map(card => (
        <button
          key={card.id}
          onClick={() => toggle(card.id)}
          style={{
            background: open === card.id ? "#0D1F35" : "#0A2540",
            border: `1px solid ${open === card.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10, padding: "12px 14px",
            cursor: "pointer", textAlign: "left" as const,
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{card.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}>{card.label}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", transition: "transform 0.15s" }}>
              {open === card.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
          </div>
          {open === card.id && card.content}
        </button>
      ))}
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
      const matchQuery = !query.trim() ||
        ep.path.toLowerCase().includes(query.toLowerCase()) ||
        ep.summary.toLowerCase().includes(query.toLowerCase()) ||
        ep.title.toLowerCase().includes(query.toLowerCase());
      return matchMethod && matchQuery;
    }),
  })).filter(g => g.endpoints.length > 0);

  const totalEndpoints = API_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
            color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 5,
          }}>API Reference</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 9999,
              background: "#F3F4F6", color: "#6B7280",
            }}>{totalEndpoints} endpoints</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>v{PAGE_META.version.current}</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", background: "#FFFBEB",
          border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10,
        }}>
          <Lock size={12} style={{ color: "#F59E0B" }} />
          <span style={{ fontSize: 12, color: "#92400E" }}>
            Requests require{" "}
            <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, background: "rgba(245,158,11,0.12)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &lt;key&gt;</code>
            {" "}unless marked PUBLIC
          </span>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <InfoStrip />

      {/* ── FILTERS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search endpoints…"
            style={{
              width: "100%", padding: "9px 34px 9px 34px",
              border: "1px solid #E5E7EB", borderRadius: 9,
              fontSize: 13, color: "#374151", outline: "none",
              background: "white", boxSizing: "border-box" as const,
              transition: "border-color 0.12s",
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
        {(["ALL", "GET", "POST", "PATCH", "PUT", "DELETE"] as const).map(m => {
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
                letterSpacing: "0.04em",
                border: active ? `1px solid ${mc ? mc.border : "#0A2540"}` : "1px solid #E5E7EB",
                background: active ? (mc ? mc.bg : "#0A2540") : "white",
                color: active ? (mc ? mc.text : "white") : "#6B7280",
                transition: "all 0.12s",
              }}
            >{m}</button>
          );
        })}
      </div>

      {/* ── GROUPS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {filteredGroups.length === 0 ? (
          <div style={{
            padding: "48px 24px", textAlign: "center" as const,
            background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
          }}>
            <Search size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>No endpoints match "{query}"</p>
          </div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.group}>
              {/* Group header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                  color: "#0A2540", letterSpacing: "0.01em", textTransform: "uppercase" as const,
                  flexShrink: 0,
                }}>{group.group}</h3>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <span style={{ fontSize: 11, color: "#D1D5DB", flexShrink: 0 }}>{group.endpoints.length}</span>
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
