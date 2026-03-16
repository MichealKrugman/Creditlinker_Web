"use client";

import { useState } from "react";
import {
  Search, X, ChevronRight, BookOpen, Code2,
  Zap, Shield, Webhook, ArrowLeftRight, ArrowLeft,
  CheckCircle2, AlertCircle, ExternalLink, Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Article = {
  title: string;
  desc: string;
  badge?: string;
  readTime: string;
  content: ArticleBlock[];
};

type ArticleBlock =
  | { type: "p";    text: string }
  | { type: "h2";   text: string }
  | { type: "h3";   text: string }
  | { type: "code"; lang: string; text: string }
  | { type: "note"; variant: "info" | "warn" | "tip"; text: string }
  | { type: "list"; items: string[] };

const ARTICLES: Record<string, Article> = {

  "Introduction to Creditlinker": {
    title: "Introduction to Creditlinker",
    desc: "What Creditlinker is and how the platform works",
    readTime: "4 min read",
    content: [
      { type: "p", text: "Creditlinker is a financial identity infrastructure platform. It builds verified, multi-dimensional financial identities for businesses from real financial data — bank transaction history, accounting ledger records, and operational signals." },
      { type: "h2", text: "What problem does it solve?" },
      { type: "p", text: "Traditional credit systems rely on credit bureau scores, collateral, and self-reported documents. Most African SMEs have no bureau history despite years of strong financial behavior. Creditlinker turns the data that already exists — their banking activity — into a verifiable, structured financial identity." },
      { type: "h2", text: "Core concepts" },
      { type: "h3", text: "Financial Identity" },
      { type: "p", text: "A persistent, versioned profile for a business — anchored to a stable persistent_business_id. It contains six independent financial health dimensions, a data quality score, feature store metrics, capital readiness assessments, and risk flags." },
      { type: "h3", text: "Six financial dimensions" },
      { type: "list", items: ["Revenue Stability — consistency and growth of inflows", "Cashflow Predictability — reliability of positive operating cash flow", "Expense Discipline — cost control relative to revenue", "Liquidity Strength — cash reserves and financial buffers", "Financial Consistency — completeness of financial activity patterns", "Risk Profile — absence of anomalies and irregular behavior"] },
      { type: "h3", text: "Capital provider types" },
      { type: "p", text: "Creditlinker supports lenders, equipment financiers, trade suppliers, and revenue financiers — each evaluating businesses against their own criteria using the financial dimensions." },
      { type: "h2", text: "How the platform layers fit together" },
      { type: "p", text: "Raw financial data flows through a 7-stage pipeline into a financial feature store that computes 40+ derived metrics. Scoring models pull from the feature store to produce the six dimensions. Capital providers query identities via a consent-gated API. Developers build integrations using the Partner API across three access tiers: Read, Signal, and Build." },
      { type: "note", variant: "tip", text: "Start with the Quick Start Guide to make your first API call in under 5 minutes." },
    ],
  },

  "Quick Start Guide": {
    title: "Quick Start Guide",
    desc: "Make your first API request in under 5 minutes",
    badge: "Start here",
    readTime: "5 min read",
    content: [
      { type: "h2", text: "Prerequisites" },
      { type: "list", items: ["A Creditlinker developer account", "Node.js 18+ or any HTTP client", "Your sandbox API key from /developers/api-keys"] },
      { type: "h2", text: "1. Install the SDK" },
      { type: "code", lang: "bash", text: "npm install @creditlinker/sdk" },
      { type: "h2", text: "2. Initialize the client" },
      { type: "code", lang: "typescript", text: "import { Creditlinker } from '@creditlinker/sdk'\n\nconst cl = new Creditlinker({\n  apiKey: process.env.CREDITLINKER_API_KEY,\n  environment: 'sandbox',\n})" },
      { type: "h2", text: "3. Fetch a financial identity" },
      { type: "p", text: "In the sandbox, use a pre-seeded business token to test identity queries:" },
      { type: "code", lang: "typescript", text: "const identity = await cl.partner.getProfile('btoken_sandbox_demo_01')\n\nconsole.log(identity.score)          // 742\nconsole.log(identity.riskProfile)    // \"low\"\nconsole.log(identity.dimensions)\n// {\n//   revenueStability: 85,\n//   cashflowPredictability: 78,\n//   expenseDiscipline: 81,\n//   liquidityStrength: 74,\n//   financialConsistency: 88,\n//   riskProfile: 91\n// }" },
      { type: "h2", text: "4. Check consent status" },
      { type: "code", lang: "typescript", text: "const consent = await cl.partner.getConsentStatus('btoken_sandbox_demo_01')\n\nconsole.log(consent.active)           // true\nconsole.log(consent.accessTier)       // \"signal\"\nconsole.log(consent.permittedFields)  // [\"score\", \"dimensions\", \"profile\"]" },
      { type: "note", variant: "info", text: "Sandbox tokens never expire and always return deterministic data. Switch to production tokens only after testing your integration fully." },
    ],
  },

  "Authentication": {
    title: "Authentication",
    desc: "API keys, JWT tokens, and how to authorize requests",
    readTime: "5 min read",
    content: [
      { type: "p", text: "All Creditlinker API requests require a Bearer JWT token in the Authorization header. Tokens are issued by Keycloak using your API key credentials." },
      { type: "h2", text: "Getting a token" },
      { type: "code", lang: "bash", text: "curl -X POST https://auth.creditlinker.io/realms/creditlinker/protocol/openid-connect/token \\\n  -d \"grant_type=client_credentials\" \\\n  -d \"client_id=YOUR_API_KEY_ID\" \\\n  -d \"client_secret=YOUR_API_KEY_SECRET\"" },
      { type: "p", text: "The response includes an access_token valid for 3600 seconds (1 hour). Cache and reuse this token rather than requesting a new one for every API call." },
      { type: "h2", text: "Using the token" },
      { type: "code", lang: "bash", text: "curl https://api.creditlinker.io/v1/business/score \\\n  -H \"Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...\"" },
      { type: "h2", text: "Token expiry and refresh" },
      { type: "p", text: "Tokens expire after 1 hour. The SDK handles token refresh automatically. If you are using raw HTTP, check the expires_in field and re-authenticate before expiry." },
      { type: "h2", text: "API key types" },
      { type: "list", items: ["Sandbox keys — prefixed sk_test_, work only against sandbox environment", "Production keys — prefixed sk_live_, require production account approval", "Scoped keys — created with specific endpoint permissions for least-privilege integrations"] },
      { type: "note", variant: "warn", text: "Never expose API keys in client-side code or public repositories. Use environment variables and server-side requests only." },
    ],
  },

  "Sandbox vs Production": {
    title: "Sandbox vs Production",
    desc: "Differences between environments and how to switch",
    readTime: "3 min read",
    content: [
      { type: "h2", text: "Sandbox" },
      { type: "p", text: "The sandbox environment is pre-seeded with synthetic businesses, realistic identity data, and simulated pipeline events. No real financial data is ever used." },
      { type: "list", items: ["Base URL: https://api.creditlinker.io/v1 with sandbox API key", "Pre-seeded business tokens available in /developers/sandbox", "Pipeline events can be triggered manually", "Webhook deliveries are simulated but real HTTP calls to your endpoint", "Rate limits are relaxed: 5,000 req/min"] },
      { type: "h2", text: "Production" },
      { type: "list", items: ["Uses real business bank data via Mono Open Banking", "Requires business consent before any identity data is accessible", "All pipeline runs use live transaction data", "Rate limits: 1,000 req/min (Read/Signal), 500 req/min (Build)"] },
      { type: "h2", text: "Switching environments" },
      { type: "code", lang: "typescript", text: "// Sandbox\nconst cl = new Creditlinker({ apiKey: 'sk_test_...', environment: 'sandbox' })\n\n// Production\nconst cl = new Creditlinker({ apiKey: 'sk_live_...', environment: 'production' })" },
      { type: "note", variant: "info", text: "API keys are environment-scoped. A sandbox key will be rejected by production endpoints and vice versa." },
    ],
  },

  "Error Handling": {
    title: "Error Handling",
    desc: "Error codes, retry logic, and handling failures gracefully",
    readTime: "4 min read",
    content: [
      { type: "h2", text: "Error response format" },
      { type: "code", lang: "json", text: "{\n  \"error\": {\n    \"code\": \"CONSENT_NOT_ACTIVE\",\n    \"message\": \"No active consent grant for this business token.\",\n    \"status\": 403,\n    \"request_id\": \"req_01HX2K9QRM\"\n  }\n}" },
      { type: "h2", text: "Common error codes" },
      { type: "list", items: ["UNAUTHORIZED (401) — Invalid or expired token", "CONSENT_NOT_ACTIVE (403) — Business has not granted consent", "PERMISSION_DENIED (403) — Consent active but requested field not permitted", "BUSINESS_NOT_FOUND (404) — Invalid business token", "PIPELINE_NOT_RUN (404) — No identity snapshot exists yet", "RATE_LIMITED (429) — Too many requests, check Retry-After header", "INVALID_PAYLOAD (422) — Request body validation failed", "INTERNAL_ERROR (500) — Platform error, safe to retry"] },
      { type: "h2", text: "Retry logic" },
      { type: "p", text: "Retry 5xx errors and 429s with exponential backoff. Never retry 4xx errors except 429 — they indicate a client-side issue that retrying will not fix." },
      { type: "code", lang: "typescript", text: "async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {\n  for (let attempt = 0; attempt < maxAttempts; attempt++) {\n    try {\n      return await fn()\n    } catch (err: any) {\n      const status = err?.status ?? 0\n      const isRetryable = status === 429 || status >= 500\n      if (!isRetryable || attempt === maxAttempts - 1) throw err\n      await new Promise(r => setTimeout(r, 2 ** attempt * 500))\n    }\n  }\n  throw new Error('Max retries exceeded')\n}" },
    ],
  },

  "What is Financial Identity?": {
    title: "What is Financial Identity?",
    desc: "How Creditlinker builds and manages business financial identities",
    readTime: "5 min read",
    content: [
      { type: "p", text: "A financial identity is a persistent, versioned, verified profile for a business built from real financial data. It is not a credit score — it is a structured set of financial health signals that capital providers use to evaluate a business on its actual behavior." },
      { type: "h2", text: "What it contains" },
      { type: "list", items: ["Identity score (0-1000) — composite signal across all dimensions", "Six independent financial dimensions, each scored 0-100", "Data quality score — reliability indicator for underlying data", "Capital readiness assessment — per-category eligibility across 14 financing types", "Feature store metrics — 40+ derived financial metrics (margin, ratios, turnover)", "Risk flags — detected anomalies and irregular behavioral patterns", "Financing history — record of past capital relationships and outcomes", "Reputation signals — repayment reliability and data consistency over time"] },
      { type: "h2", text: "Identity persistence" },
      { type: "p", text: "Each business has a stable persistent_business_id that persists across ownership changes, account additions, or profile updates. Identity attributes are versioned — material changes create identity version records. This ensures capital providers always have access to an accurate historical record." },
      { type: "h2", text: "Identity snapshots" },
      { type: "p", text: "Every time the pipeline runs, a financial identity snapshot is created and frozen. Snapshots are immutable — they represent the state of the identity at a specific point in time. Capital providers can retrieve historical snapshots for trend analysis." },
      { type: "note", variant: "tip", text: "Use GET /business/snapshots to retrieve the full history of a business identity over time." },
    ],
  },

  "The Data Pipeline": {
    title: "The Data Pipeline",
    desc: "Ingestion, normalization, enrichment, and scoring explained",
    readTime: "6 min read",
    content: [
      { type: "p", text: "The Creditlinker pipeline is a 7-stage deterministic process that transforms raw financial data into a verified financial identity. It runs automatically when new data is added to a business account." },
      { type: "h2", text: "Stage 1: Data ingestion" },
      { type: "p", text: "Raw data is ingested from three source types: bank transactions via Mono Open Banking, accounting ledger uploads (CSV/PDF), and operational data submitted via the Partner API. All sources are deduplicated and timestamped." },
      { type: "h2", text: "Stage 2: Normalization" },
      { type: "p", text: "Transactions are categorized, cleaned, and enriched with counterparty clustering. Each normalized record receives a confidence_score. The pipeline reports a normalization_confidence_avg — typically 95%+ for well-structured bank data." },
      { type: "h2", text: "Stage 3: Ledger reconciliation" },
      { type: "p", text: "Balance figures are verified against transaction history. Inconsistencies raise observability warnings but do not halt the pipeline." },
      { type: "h2", text: "Stage 4: Feature store update" },
      { type: "p", text: "The financial feature store is updated with 40+ computed metrics. These are stored and versioned — scoring models read from the feature store rather than recalculating from raw transactions." },
      { type: "list", items: ["Monthly revenue growth rate", "Revenue volatility coefficient", "Operating margin", "Cash reserve ratio", "Client concentration index", "Receivable turnover days", "Expense-to-revenue ratio", "Payment regularity score"] },
      { type: "h2", text: "Stage 5: Six-dimensional scoring" },
      { type: "p", text: "Each of the six dimensions is computed independently from the feature store. No dimension depends on another. This independence allows capital providers to analyze the full financial shape of a business." },
      { type: "h2", text: "Stage 6: Risk detection" },
      { type: "p", text: "The risk detection engine scans for anomalies: unusual debit spikes, irregular counterparty patterns, sudden revenue drops, and other signals associated with financial distress or fraud." },
      { type: "h2", text: "Stage 7: Identity snapshot" },
      { type: "p", text: "The pipeline closes by creating a frozen identity snapshot and triggering a FINANCIAL_PROFILE_UPDATED event. The business is notified, and any Signal-tier partners with active consent receive the event via webhook." },
    ],
  },

  "Dimensional Scoring": {
    title: "Dimensional Scoring",
    desc: "Understanding the 6 financial health dimensions",
    readTime: "5 min read",
    content: [
      { type: "p", text: "Creditlinker scores six independent financial health dimensions, each on a scale of 0-100. These are scored separately — a high score in one dimension does not compensate for a low score in another." },
      { type: "h2", text: "The six dimensions" },
      { type: "h3", text: "1. Revenue Stability (0-100)" },
      { type: "p", text: "Measures consistency and predictability of revenue inflows over the analysis window. Considers growth trends, seasonal regularity, and the absence of large unexplained gaps in income." },
      { type: "h3", text: "2. Cashflow Predictability (0-100)" },
      { type: "p", text: "Measures how reliably the business generates positive operating cash flow. Tracks month-to-month inflow-to-outflow ratios and identifies persistent negative cash cycles." },
      { type: "h3", text: "3. Expense Discipline (0-100)" },
      { type: "p", text: "Measures cost control relative to revenue. Penalizes irregular, non-operational expense bursts and patterns that indicate poor margin management." },
      { type: "h3", text: "4. Liquidity Strength (0-100)" },
      { type: "p", text: "Measures the level of cash reserves and financial buffers. Reflects the business's capacity to absorb short-term financial shocks without distress." },
      { type: "h3", text: "5. Financial Consistency (0-100)" },
      { type: "p", text: "Measures completeness and regularity of financial data patterns. Rewards businesses with continuous, well-structured financial activity across the analysis window." },
      { type: "h3", text: "6. Risk Profile (0-100)" },
      { type: "p", text: "Detects anomalies and irregular behavioral signals. A score of 90+ indicates clean, predictable patterns with no detected red flags." },
      { type: "h2", text: "Accessing dimension scores" },
      { type: "code", lang: "typescript", text: "const identity = await cl.partner.getProfile(businessToken)\n\nconst { dimensions } = identity\n// {\n//   revenueStability: 85,\n//   cashflowPredictability: 78,\n//   expenseDiscipline: 81,\n//   liquidityStrength: 74,\n//   financialConsistency: 88,\n//   riskProfile: 91\n// }" },
    ],
  },

  "Data Quality Score": {
    title: "Data Quality Score",
    desc: "How data reliability affects scoring and identity confidence",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Every financial identity carries a data_quality_score (0-100) alongside the six financial dimensions. This score indicates how reliable the underlying financial data is." },
      { type: "h2", text: "What affects data quality?" },
      { type: "list", items: ["Number of bank accounts linked (more = better coverage)", "Length of data history (18+ months scores highest)", "Normalization confidence average from the pipeline", "Absence of large data gaps (weeks with no transactions)", "Consistency between linked accounts", "Presence of supplementary ledger or operational data"] },
      { type: "h2", text: "Interpreting the score" },
      { type: "list", items: ["90-100: High reliability — full confidence in dimension scores", "70-89: Good — minor gaps, dimensions are still reliable", "50-69: Moderate — some gaps, use dimensions with caution", "Below 50: Low — insufficient data, identity should not be used for decisions"] },
      { type: "note", variant: "warn", text: "Do not make financing decisions based on identities with a data_quality_score below 60. Low quality scores indicate insufficient data coverage." },
      { type: "h2", text: "Accessing the score" },
      { type: "code", lang: "typescript", text: "const identity = await cl.partner.getProfile(businessToken)\nconsole.log(identity.dataQualityScore)  // e.g. 94" },
    ],
  },

  "Financial Identity Snapshots": {
    title: "Financial Identity Snapshots",
    desc: "Versioned identity records and how to retrieve history",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Every pipeline run creates a financial identity snapshot — a frozen, immutable record of the business's identity at that point in time. Snapshots persist permanently and cannot be deleted." },
      { type: "h2", text: "What a snapshot contains" },
      { type: "list", items: ["snapshot_id — unique identifier", "taken_at — ISO timestamp of when the pipeline ran", "pipeline_run_id — reference to the pipeline run that created it", "score — full identity score at the time", "dimensions — all six dimension scores", "data_quality_score — data reliability at the time", "readiness_assessments — capital readiness across all 14 categories", "identity_resolution_status — verification level at the time"] },
      { type: "h2", text: "Retrieving snapshots" },
      { type: "code", lang: "typescript", text: "// Business retrieves their own snapshot history\nconst snapshots = await cl.business.getSnapshots()\n\n// Institution retrieves snapshots for a consented business\nconst snapshots = await cl.institution.getSnapshots(financialIdentityId)" },
      { type: "note", variant: "info", text: "Snapshots are useful for trend analysis — comparing a business score trajectory over time before making a capital decision." },
    ],
  },

  "Linking Bank Accounts via Mono": {
    title: "Linking Bank Accounts via Mono",
    desc: "The Mono Connect flow — initiate, callback, and sync",
    readTime: "5 min read",
    content: [
      { type: "p", text: "Creditlinker uses Mono Open Banking to link business bank accounts. The flow involves initiating a link session, displaying the Mono widget to the user, and exchanging the returned auth code for a permanent account link." },
      { type: "h2", text: "Step 1: Initiate the link session" },
      { type: "code", lang: "typescript", text: "const response = await cl.business.monoInitiate()\n// { mono_link_url: \"https://connect.mono.co/...\" }\n\nwindow.location.href = response.mono_link_url" },
      { type: "h2", text: "Step 2: Handle the callback" },
      { type: "p", text: "After the user completes the Mono flow, Mono calls your configured callback URL with a code parameter. Exchange this code with Creditlinker:" },
      { type: "code", lang: "typescript", text: "const code = req.query.code as string\n\nconst result = await cl.business.monoCallback({ code })\n// { success: true, account_id: \"acc_01HX...\" }" },
      { type: "h2", text: "Step 3: Pipeline runs automatically" },
      { type: "p", text: "Once the account is linked, Creditlinker automatically ingests the available transaction history and runs the pipeline. The business receives a FINANCIAL_PROFILE_UPDATED event when the identity is ready." },
      { type: "h2", text: "Supported banks" },
      { type: "p", text: "All 30+ banks supported by Mono in Nigeria are supported — including Access Bank, GTBank, UBA, Zenith Bank, First Bank, Stanbic IBTC, Polaris, and Wema Bank." },
      { type: "note", variant: "info", text: "Businesses can link multiple accounts from different banks. Each additional account strengthens the identity — more data means a higher data quality score." },
    ],
  },

  "Uploading CSV Transactions": {
    title: "Uploading CSV Transactions",
    desc: "Format requirements and column mapping for CSV imports",
    readTime: "4 min read",
    content: [
      { type: "p", text: "Businesses can upload transaction history as CSV files when Mono connection is not available or to supplement bank data with additional records." },
      { type: "h2", text: "Required columns" },
      { type: "list", items: ["date — ISO 8601 format (YYYY-MM-DD)", "amount — numeric, absolute value (no currency symbols)", "direction — 'credit' or 'debit'", "description — transaction narrative text"] },
      { type: "h2", text: "Optional columns" },
      { type: "list", items: ["balance_after — closing balance after transaction", "reference — bank reference number", "currency — defaults to NGN if omitted"] },
      { type: "h2", text: "Example CSV" },
      { type: "code", lang: "csv", text: "date,amount,direction,description,balance_after\n2026-03-14,420000,credit,CUSTOMER PAYMENT REF-0042,1820000\n2026-03-14,85000,debit,RENT PAYMENT MARCH,1735000\n2026-03-13,310000,credit,INVOICE SETTLED INV-0091,1510000" },
      { type: "h2", text: "Upload with column mapping" },
      { type: "code", lang: "typescript", text: "const csvContent = fs.readFileSync('transactions.csv', 'utf-8')\n\nconst result = await cl.business.uploadCsv({\n  csvContent,\n  columnMap: {\n    date: 'date',\n    amount: 'amount',\n    direction: 'direction',\n    description: 'description',\n    balanceAfter: 'balance_after',\n  },\n})\n\nconsole.log(result.recordsImported)  // e.g. 847" },
    ],
  },

  "Uploading PDF Bank Statements": {
    title: "Uploading PDF Bank Statements",
    desc: "Parsing PDF statements and supported bank formats",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Businesses can upload PDF bank statements directly when Mono linking is not available. The platform parses transaction data from the PDF and feeds it into the pipeline." },
      { type: "h2", text: "Upload a PDF statement" },
      { type: "code", lang: "typescript", text: "import fs from 'fs'\n\nconst pdfBuffer = fs.readFileSync('statement.pdf')\nconst pdfBase64 = pdfBuffer.toString('base64')\n\nconst result = await cl.business.uploadPdf({\n  pdfBase64,\n  password: 'optional-password-if-encrypted',\n})\n\nconsole.log(result.success)             // true\nconsole.log(result.transactionsParsed)  // e.g. 312" },
      { type: "h2", text: "Supported formats" },
      { type: "list", items: ["Standard PDF bank statements from all major Nigerian banks", "Password-protected PDFs — pass the password in the request body", "Multi-page statements — all pages are parsed in a single request", "Statements in NGN only (foreign currency statements are not currently supported)"] },
      { type: "note", variant: "info", text: "PDF parsing has lower confidence than Mono-linked transactions. After upload, check the normalization_confidence_avg in the pipeline run observability record to assess data quality." },
      { type: "h2", text: "After upload" },
      { type: "p", text: "The pipeline runs automatically after a successful upload. The business receives a FINANCIAL_PROFILE_UPDATED event when the new data has been incorporated into their financial identity." },
    ],
  },

  "Partner Data Submissions": {
    title: "Partner Data Submissions",
    desc: "How partners can submit verified data into the pipeline",
    readTime: "4 min read",
    content: [
      { type: "p", text: "Build-tier partners can submit verified financial data directly into the Creditlinker pipeline. This allows fintech applications, accounting platforms, and POS systems to contribute their own data to strengthen a business financial identity." },
      { type: "h2", text: "Submission types" },
      { type: "list", items: ["submit_bank_transactions — verified transaction records", "submit_identity_signals — identity verification data", "submit_operational_data — equipment, inventory, contract data"] },
      { type: "h2", text: "Submitting transactions" },
      { type: "code", lang: "typescript", text: "const result = await cl.partner.submitData({\n  submissionType: 'submit_bank_transactions',\n  businessToken: businessToken,\n  data: [{\n    date: '2026-03-14',\n    amount: 420000,\n    direction: 'credit',\n    description: 'CUSTOMER PAYMENT REF-0042',\n    currency: 'NGN',\n  }],\n})\n\nconsole.log(result.accepted)         // true\nconsole.log(result.recordsAccepted)  // 1\nconsole.log(result.recordsRejected)  // 0" },
      { type: "note", variant: "warn", text: "All submitted data must be verifiably sourced from your platform's own data acquisition. Submitting fabricated or unverified data will result in immediate partner access suspension." },
    ],
  },

  "Consent Model Overview": {
    title: "Consent Model Overview",
    desc: "How businesses control access to their financial identity",
    readTime: "5 min read",
    content: [
      { type: "p", text: "All access to a business's financial identity is governed by explicit, time-bounded, revocable consent. No capital provider or partner can access any data without an active consent grant from the business." },
      { type: "h2", text: "The consent lifecycle" },
      { type: "list", items: ["Discovery — business appears anonymously to capital providers whose criteria match", "Access request — capital provider sends a consent request specifying permissions needed", "Evaluation — business reviews and grants or denies access with their own scope and duration", "Active financing — access remains locked during active financing obligation", "Post-settlement — business can revoke access after repayment is confirmed"] },
      { type: "h2", text: "Consent permissions" },
      { type: "list", items: ["can_view_score — access to identity score and dimension breakdown", "can_view_identity — access to full financial identity profile", "can_view_transaction_detail — access to normalized transaction records", "valid_until — ISO timestamp when access expires automatically"] },
      { type: "h2", text: "Audit trail" },
      { type: "p", text: "Every consent grant, access event, and revocation is logged in an immutable audit trail with actor, timestamp, action type, and purpose." },
    ],
  },

  "Granting Consent": {
    title: "Granting Consent",
    desc: "API flow for businesses granting financer access",
    readTime: "3 min read",
    content: [
      { type: "h2", text: "Grant consent programmatically" },
      { type: "code", lang: "typescript", text: "const consent = await cl.business.grantConsent({\n  institutionId: 'inst_fastcash_01',\n  permissions: {\n    canViewScore: true,\n    canViewIdentity: true,\n    canViewTransactionDetail: false,\n  },\n  durationDays: 90,\n})\n\nconsole.log(consent.consentId)   // cns_01HX...\nconsole.log(consent.isActive)    // true" },
      { type: "h2", text: "Responding to a discovery request" },
      { type: "code", lang: "typescript", text: "const requests = await cl.business.getDiscoveryRequests()\n\nconst consent = await cl.business.grantDiscoveryRequest(requestId, {\n  permissions: { canViewScore: true, canViewIdentity: true },\n  durationDays: 30,\n})" },
    ],
  },

  "Revoking Consent": {
    title: "Revoking Consent",
    desc: "How businesses revoke active access grants",
    readTime: "2 min read",
    content: [
      { type: "p", text: "Businesses can revoke any active consent grant at any time. Revocation is immediate — the capital provider loses access in real time, with no grace period." },
      { type: "code", lang: "typescript", text: "await cl.business.revokeConsent({ consentId: 'cns_01HX...' })\n// { success: true }" },
      { type: "h2", text: "What happens on revocation" },
      { type: "list", items: ["The consent record is marked revoked_at with the current timestamp", "is_active is set to false immediately", "A CONSENT_REVOKED platform event fires", "Any Signal-tier partners with active consent receive the event via webhook", "The capital provider's API requests for that business begin returning 403 CONSENT_NOT_ACTIVE"] },
      { type: "note", variant: "warn", text: "Revoking consent on an active financing record does not terminate the financing obligation. Settlement and dispute processes continue independently of consent status." },
    ],
  },

  "Consent Permissions": {
    title: "Consent Permissions",
    desc: "Granular permission scopes and how to request them",
    readTime: "4 min read",
    content: [
      { type: "p", text: "Every consent grant carries a permissions object that defines exactly what the capital provider can see. Permissions are set by the business at the time of granting — not by the provider." },
      { type: "h2", text: "Available permissions" },
      { type: "list", items: ["can_view_score — access to the identity score (0-1000), risk profile, and all six dimension scores", "can_view_identity — access to the full financial identity profile including feature store metrics and capital readiness assessment", "can_view_transaction_detail — access to normalized transaction records (the most sensitive permission)", "valid_until — ISO 8601 timestamp defining when access automatically expires"] },
      { type: "h2", text: "Granting specific permissions" },
      { type: "code", lang: "typescript", text: "// Score only — lowest exposure\nawait cl.business.grantConsent({\n  institutionId: 'inst_01',\n  permissions: {\n    canViewScore: true,\n    canViewIdentity: false,\n    canViewTransactionDetail: false,\n  },\n  durationDays: 30,\n})\n\n// Score + identity — standard evaluation grant\nawait cl.business.grantConsent({\n  institutionId: 'inst_01',\n  permissions: {\n    canViewScore: true,\n    canViewIdentity: true,\n    canViewTransactionDetail: false,\n  },\n  durationDays: 90,\n})" },
      { type: "h2", text: "Provider-side enforcement" },
      { type: "p", text: "The API enforces permissions on every request. If a provider calls GET /institution/score/:fid without can_view_score being granted, the request returns 403 PERMISSION_DENIED. The profile endpoint only returns fields permitted by the consent grant." },
      { type: "note", variant: "warn", text: "can_view_transaction_detail should only be granted for deep due diligence. Most financing decisions can be made from the identity score and dimensions alone." },
    ],
  },

  "Consent Expiry": {
    title: "Consent Expiry",
    desc: "Setting and renewing consent duration",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Every consent grant has a hard expiry — a valid_until timestamp after which access ends automatically, with no action required from either party. This is enforced at the API level." },
      { type: "h2", text: "Setting duration at grant time" },
      { type: "code", lang: "typescript", text: "const consent = await cl.business.grantConsent({\n  institutionId: 'inst_01',\n  permissions: { canViewScore: true, canViewIdentity: true },\n  durationDays: 30,\n})\n\nconsole.log(consent.permissions.valid_until)\n// e.g. \"2026-04-16T00:00:00Z\"" },
      { type: "h2", text: "Renewing an active consent" },
      { type: "code", lang: "typescript", text: "const renewed = await cl.business.renewConsent({\n  consentId: 'cns_01HX...',\n  durationDays: 90,\n})\n\nconsole.log(renewed.permissions.valid_until) // new expiry" },
      { type: "h2", text: "What happens at expiry" },
      { type: "list", items: ["The consent is_active field becomes false", "A CONSENT_EXPIRED event fires automatically", "Signal-tier partners receive the event via webhook", "Provider API calls for that business begin returning 403 CONSENT_NOT_ACTIVE", "The access log entry is closed with the expiry timestamp"] },
      { type: "note", variant: "info", text: "Consent expiry does not affect active financing records. Financing record obligations and settlement processes remain intact after consent expires." },
    ],
  },

  "Webhook Overview": {
    title: "Webhook Overview",
    desc: "Receiving real-time events from the Creditlinker platform",
    readTime: "4 min read",
    content: [
      { type: "p", text: "Creditlinker fires HTTP POST requests to your configured webhook endpoint whenever a meaningful platform event occurs. This allows you to build reactive integrations that respond automatically to identity changes, consent activity, and financing lifecycle events." },
      { type: "h2", text: "Supported events" },
      { type: "list", items: ["DATA_INGESTED — new financial data received", "FEATURES_GENERATED — feature store updated", "FINANCIAL_PROFILE_UPDATED — identity profile changed", "SCORE_RECALCULATED — all 6 dimensions re-scored", "CONSENT_GRANTED — business granted access", "CONSENT_REVOKED — business revoked access", "FINANCING_GRANTED — offer accepted", "SETTLEMENT_CONFIRMED — repayment verified", "DISPUTE_OPENED — financing dispute initiated"] },
      { type: "h2", text: "Event payload structure" },
      { type: "code", lang: "json", text: "{\n  \"event_type\": \"SCORE_RECALCULATED\",\n  \"event_id\": \"evt_01HX2K9QRM\",\n  \"occurred_at\": \"2026-03-16T14:22:05Z\",\n  \"payload\": {\n    \"business_id\": \"biz_...\",\n    \"pipeline_run_id\": \"run_...\",\n    \"score\": 742,\n    \"previous_score\": 724\n  }\n}" },
      { type: "h2", text: "Delivery guarantees" },
      { type: "p", text: "Creditlinker delivers events at-least-once. Your handler should be idempotent — use the event_id to deduplicate if needed. Failed deliveries are retried up to 5 times over 24 hours with exponential backoff." },
    ],
  },

  "Verifying Webhook Signatures": {
    title: "Verifying Webhook Signatures",
    desc: "How to verify X-CL-Signature to authenticate payloads",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Every webhook request includes an X-CL-Signature header. Verify this signature to confirm the request genuinely originates from Creditlinker and has not been tampered with." },
      { type: "h2", text: "How it works" },
      { type: "p", text: "Creditlinker signs each payload with your webhook signing secret using HMAC-SHA256. The signature is the hex-encoded HMAC of the raw request body." },
      { type: "h2", text: "Verifying in Node.js" },
      { type: "code", lang: "typescript", text: "import crypto from 'crypto'\n\nfunction verifyWebhookSignature(\n  rawBody: string,\n  signature: string,\n  secret: string\n): boolean {\n  const expected = crypto\n    .createHmac('sha256', secret)\n    .update(rawBody, 'utf8')\n    .digest('hex')\n  return crypto.timingSafeEqual(\n    Buffer.from(expected, 'hex'),\n    Buffer.from(signature, 'hex')\n  )\n}\n\napp.post('/webhooks/creditlinker', express.raw({ type: '*/*' }), (req, res) => {\n  const sig = req.headers['x-cl-signature'] as string\n  if (!verifyWebhookSignature(req.body.toString(), sig, process.env.WEBHOOK_SECRET!)) {\n    return res.status(401).json({ error: 'Invalid signature' })\n  }\n  const event = JSON.parse(req.body.toString())\n  res.json({ received: true })\n})" },
      { type: "note", variant: "warn", text: "Always use express.raw() or equivalent to get the raw body bytes before parsing JSON. Parsing first changes the byte representation and will break signature verification." },
    ],
  },

  "Webhook Event Reference": {
    title: "Webhook Event Reference",
    desc: "Full list of events, payloads, and retry behavior",
    readTime: "5 min read",
    content: [
      { type: "p", text: "Every platform event fires as an HTTP POST to your configured webhook endpoint. All payloads share a common envelope with event_type, event_id, occurred_at, and a payload object specific to the event." },
      { type: "h2", text: "Common envelope" },
      { type: "code", lang: "json", text: "{\n  \"event_type\": \"SCORE_RECALCULATED\",\n  \"event_id\": \"evt_01HX2K9QRM\",\n  \"occurred_at\": \"2026-03-16T14:22:05Z\",\n  \"payload\": { ... }\n}" },
      { type: "h2", text: "Data pipeline events" },
      { type: "list", items: ["DATA_INGESTED — payload: { business_id, source, record_count, ingested_at }", "TRANSACTION_NORMALIZED — payload: { business_id, pipeline_run_id, normalization_confidence_avg }", "FEATURES_GENERATED — payload: { business_id, pipeline_run_id, metrics_computed }"] },
      { type: "h2", text: "Identity events" },
      { type: "list", items: ["FINANCIAL_PROFILE_UPDATED — payload: { business_id, pipeline_run_id, snapshot_id, score, previous_score, dimensions }", "SCORE_RECALCULATED — payload: { business_id, pipeline_run_id, score, previous_score, dimensions, data_quality_score }", "IDENTITY_VERSION_CREATED — payload: { business_id, persistent_business_id, version, changed_fields }"] },
      { type: "h2", text: "Consent events" },
      { type: "list", items: ["CONSENT_GRANTED — payload: { consent_id, business_id, institution_id, permissions, valid_until }", "CONSENT_REVOKED — payload: { consent_id, business_id, institution_id, revoked_at }", "CONSENT_RENEWED — payload: { consent_id, business_id, institution_id, new_valid_until }", "CONSENT_EXPIRED — payload: { consent_id, business_id, institution_id, expired_at }"] },
      { type: "h2", text: "Financing events" },
      { type: "list", items: ["FINANCING_GRANTED — payload: { financing_id, consent_id, business_id, institution_id, capital_category, terms }", "SETTLEMENT_CONFIRMED — payload: { financing_id, business_id, institution_id, settled_at, settlement_proof }", "DISPUTE_OPENED — payload: { dispute_id, financing_id, business_id, institution_id, initiated_by, reason }", "DISPUTE_RESOLVED — payload: { dispute_id, financing_id, resolution, resolved_at, resolution_notes, direct_debit_triggered }"] },
      { type: "h2", text: "Retry behavior" },
      { type: "p", text: "Failed deliveries (non-2xx responses or timeouts) are retried up to 5 times over 24 hours using exponential backoff: 30s, 2m, 10m, 1h, 4h. After 5 failures the event is moved to the dead-letter queue, visible in /developers/logs." },
      { type: "note", variant: "warn", text: "Your endpoint must respond within 10 seconds. If it takes longer, Creditlinker treats the delivery as failed and retries. Use a queue (e.g. BullMQ, SQS) to acknowledge immediately and process asynchronously." },
    ],
  },

  "Handling Failed Deliveries": {
    title: "Handling Failed Deliveries",
    desc: "Retries, dead-letter queues, and redelivery options",
    readTime: "3 min read",
    content: [
      { type: "p", text: "When a webhook delivery fails — either because your endpoint returned a non-2xx status or timed out — Creditlinker automatically retries delivery with exponential backoff." },
      { type: "h2", text: "Retry schedule" },
      { type: "list", items: ["Attempt 1: Immediately", "Attempt 2: 30 seconds after failure", "Attempt 3: 2 minutes after failure", "Attempt 4: 10 minutes after failure", "Attempt 5: 1 hour after failure", "Attempt 6 (final): 4 hours after failure"] },
      { type: "p", text: "After 6 failed attempts, the event is marked as failed and moved to the dead-letter queue. No further automatic retries occur." },
      { type: "h2", text: "Viewing and replaying failed events" },
      { type: "p", text: "Failed events appear in the Event Log at /developers/logs. You can trigger a manual redelivery from the portal or via the API:" },
      { type: "code", lang: "typescript", text: "// Replay a specific failed event\nawait cl.developer.replayEvent('evt_01HX2K9QRM')" },
      { type: "h2", text: "Making your handler idempotent" },
      { type: "p", text: "Because events can be delivered more than once (retries, replays), your handler must be idempotent. Use the event_id to deduplicate:" },
      { type: "code", lang: "typescript", text: "app.post('/webhooks/creditlinker', async (req, res) => {\n  const { event_id, event_type, payload } = req.body\n\n  // Deduplicate using event_id\n  const alreadyProcessed = await redis.get(`event:${event_id}`)\n  if (alreadyProcessed) {\n    return res.json({ received: true, duplicate: true })\n  }\n\n  await processEvent(event_type, payload)\n  await redis.setex(`event:${event_id}`, 86400, '1')\n\n  res.json({ received: true })\n})" },
      { type: "note", variant: "tip", text: "Acknowledge the webhook immediately (return 200) and process the event asynchronously in a background queue. This prevents timeouts from causing unnecessary retries." },
    ],
  },

  "Discovery and Matching": {
    title: "Discovery and Matching",
    desc: "How businesses get matched with capital providers",
    readTime: "4 min read",
    content: [
      { type: "p", text: "The Creditlinker discovery system continuously matches businesses with capital providers based on financial identity dimensions, capital category interest, and provider-defined criteria — all before any personal data is shared." },
      { type: "h2", text: "Business side" },
      { type: "code", lang: "typescript", text: "await cl.business.updateDiscovery({\n  openToFinancing: true,\n  selectedCapitalCategories: ['working_capital_loan', 'invoice_financing', 'trade_credit'],\n})" },
      { type: "p", text: "Once enabled, the business appears as an anonymized profile to capital providers whose criteria match. No personal or identifying information is visible until consent is granted." },
      { type: "h2", text: "Capital provider side" },
      { type: "code", lang: "typescript", text: "await cl.institution.postCriteria({\n  capitalCategory: 'working_capital_loan',\n  minScore: 680,\n  sectors: ['food_beverage', 'agriculture', 'retail'],\n  minDataCoverageMonths: 12,\n  ticketSizeMin: 1000000,\n  ticketSizeMax: 20000000,\n})\n\nconst matches = await cl.institution.getDiscovery()" },
      { type: "h2", text: "Requesting access" },
      { type: "p", text: "Once a provider identifies a promising match, they send a consent request specifying the permissions they need. The business reviews and grants or denies access on their own terms." },
    ],
  },

  "Creating Financing Records": {
    title: "Creating Financing Records",
    desc: "The API flow from consent to financing record creation",
    readTime: "5 min read",
    content: [
      { type: "p", text: "A financing record represents an active capital relationship between a business and a capital provider. It is created when a business accepts a financing offer and links back to the consent record that enabled the evaluation." },
      { type: "h2", text: "The financing record data model" },
      { type: "list", items: ["financing_id — unique identifier", "consent_id — the consent that granted the provider access", "business_id and institution_id — both parties", "capital_category — e.g. working_capital_loan, invoice_financing", "terms — JSONB object with amount, rate, tenor, repayment schedule", "status — active | settled | disputed | withdrawn", "settlement_proof — submitted by the business on repayment", "dispute_ids — array of linked DisputeRecord IDs if conflicts arise"] },
      { type: "h2", text: "Step 1: Institution creates an offer" },
      { type: "code", lang: "typescript", text: "// Institution side\nconst offer = await cl.institution.createOffer({\n  financialIdentityId: 'fid_01HX...',\n  capitalCategory: 'working_capital_loan',\n  terms: {\n    amount: 5000000,\n    interestRate: 0.24,\n    tenorMonths: 12,\n    repaymentSchedule: 'monthly',\n    collateralRequired: false,\n  },\n})" },
      { type: "h2", text: "Step 2: Business reviews and accepts" },
      { type: "code", lang: "typescript", text: "// Business side — list received offers\nconst financing = await cl.business.getFinancing()\n\n// Accept a specific offer\nconst record = await cl.business.grantFinancing(consentId, {\n  terms: offer.terms,\n})\n\nconsole.log(record.financingId)  // fin_01HX...\nconsole.log(record.status)       // 'active'" },
      { type: "h2", text: "Step 3: Financing record is live" },
      { type: "p", text: "Once accepted, a FINANCING_GRANTED event fires. The financing record is immutable — it contributes to both parties' reputation scores. The record tracks the full lifecycle: active to settled (or disputed or withdrawn)." },
      { type: "note", variant: "info", text: "A financing record cannot be deleted. Even withdrawn or disputed records remain permanently in the system and contribute to the institution reputation score." },
    ],
  },

  "Settlement Verification": {
    title: "Settlement Verification",
    desc: "How the platform verifies repayments via bank data",
    readTime: "3 min read",
    content: [
      { type: "p", text: "Creditlinker verifies financing settlement against real bank transaction data where the business has an active linked account. This removes reliance on self-reported repayment claims." },
      { type: "h2", text: "Business submits settlement proof" },
      { type: "code", lang: "typescript", text: "await cl.business.submitSettlement(financingId, {\n  proof: {\n    transactionReference: 'TXN-2026-03-14-0042',\n    amount: 5000000,\n    settledAt: '2026-03-14T10:30:00Z',\n    bankAccountId: 'acc_01HX...',\n  },\n})" },
      { type: "h2", text: "Institution confirms settlement" },
      { type: "code", lang: "typescript", text: "await cl.institution.confirmSettlement(financingId)\n// { status: 'settled', settledAt: '2026-03-14T...' }" },
      { type: "p", text: "Confirmed settlements fire a SETTLEMENT_CONFIRMED event and update the business repayment reliability signal in their reputation record." },
      { type: "note", variant: "info", text: "Disputes can be opened by either party via the dispute endpoints if there is a disagreement about settlement." },
    ],
  },

  "Dispute Handling": {
    title: "Dispute Handling",
    desc: "Opening and resolving financing disputes",
    readTime: "5 min read",
    content: [
      { type: "p", text: "Either party in a financing relationship — the business or the capital provider — can open a dispute against an active financing record. Disputes are mediated by the Creditlinker platform and resolved with reference to verified bank transaction data where available." },
      { type: "h2", text: "The dispute data model" },
      { type: "list", items: ["dispute_id — unique identifier", "financing_record_id — the financing record under dispute", "initiated_by — 'business' or 'institution'", "reason — free-text description of the dispute", "resolution — 'pending' | 'resolved' | 'rejected'", "platform_verified — whether the platform verified the resolution against bank data", "direct_debit_triggered — whether the platform triggered a direct debit to enforce repayment", "resolution_notes — written outcome from platform review"] },
      { type: "h2", text: "Opening a dispute" },
      { type: "code", lang: "typescript", text: "// Business opens a dispute\nconst dispute = await cl.business.openDispute(financingId, {\n  reason: 'Settlement of 5,000,000 was made on 14 Mar 2026 (ref TXN-0042) but institution has not confirmed.',\n})\n\nconsole.log(dispute.disputeId)   // dsp_01HX...\nconsole.log(dispute.resolution)  // 'pending'\n\n// Institution opens a dispute\nconst dispute = await cl.institution.openDispute(financingId, {\n  reason: 'No repayment received against the agreed schedule. Last due date was 14 Mar 2026.',\n})" },
      { type: "h2", text: "Platform resolution" },
      { type: "p", text: "Creditlinker reviews disputes by cross-referencing the business's linked bank transaction data against the claimed repayment. If the platform can verify a transaction matching the settlement amount and reference, the dispute is resolved in the business's favor and platform_verified is set to true." },
      { type: "h2", text: "Direct debit enforcement" },
      { type: "p", text: "Where the financing agreement includes a direct debit authorization and the platform determines non-payment, direct_debit_triggered may be set to true and a repayment collection initiated against the business's linked bank account." },
      { type: "h2", text: "Resolution states" },
      { type: "list", items: ["pending — dispute is under review by the platform", "resolved — dispute resolved in one party's favor; resolution_notes contain the outcome", "rejected — dispute was found to be without merit or insufficient evidence was provided"] },
      { type: "h2", text: "Impact on reputation" },
      { type: "p", text: "Disputes are recorded in both parties' reputation histories regardless of outcome. Institutions that initiate spurious disputes and businesses that have unresolved payment disputes will see their reputation scores affected." },
      { type: "code", lang: "typescript", text: "// Check dispute and financing status\nconst financing = await cl.business.getFinancingSingle(financingId)\nconsole.log(financing.status)      // 'disputed'\nconsole.log(financing.disputeIds)  // ['dsp_01HX...']" },
      { type: "note", variant: "warn", text: "Once a financing record enters 'disputed' status, settlement cannot be confirmed by either party until the dispute is resolved or rejected by the platform." },
    ],
  },

};

/* ─────────────────────────────────────────────────────────
   DOCS STRUCTURE
───────────────────────────────────────────────────────── */
type DocSection = {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: string;
  articles: { key: string; badge?: string }[];
};

const SECTIONS: DocSection[] = [
  {
    title: "Getting Started",
    icon: Zap,
    articles: [
      { key: "Introduction to Creditlinker" },
      { key: "Quick Start Guide", badge: "Start here" },
      { key: "Authentication" },
      { key: "Sandbox vs Production" },
      { key: "Error Handling" },
    ],
  },
  {
    title: "Financial Identity",
    icon: Shield,
    articles: [
      { key: "What is Financial Identity?" },
      { key: "The Data Pipeline" },
      { key: "Dimensional Scoring" },
      { key: "Data Quality Score" },
      { key: "Financial Identity Snapshots" },
    ],
  },
  {
    title: "Data Sources",
    icon: ArrowLeftRight,
    articles: [
      { key: "Linking Bank Accounts via Mono" },
      { key: "Uploading CSV Transactions" },
      { key: "Uploading PDF Bank Statements" },
      { key: "Partner Data Submissions" },
    ],
  },
  {
    title: "Consent & Access",
    icon: Shield,
    badge: "Core",
    articles: [
      { key: "Consent Model Overview" },
      { key: "Granting Consent" },
      { key: "Revoking Consent" },
      { key: "Consent Permissions" },
      { key: "Consent Expiry" },
    ],
  },
  {
    title: "Webhooks",
    icon: Webhook,
    articles: [
      { key: "Webhook Overview" },
      { key: "Verifying Webhook Signatures" },
      { key: "Webhook Event Reference" },
      { key: "Handling Failed Deliveries" },
    ],
  },
  {
    title: "Financing Lifecycle",
    icon: Code2,
    articles: [
      { key: "Discovery and Matching" },
      { key: "Creating Financing Records" },
      { key: "Settlement Verification" },
      { key: "Dispute Handling" },
    ],
  },
];

const POPULAR_KEYS = [
  "Quick Start Guide",
  "Authentication",
  "Linking Bank Accounts via Mono",
  "Consent Model Overview",
  "Verifying Webhook Signatures",
  "Dimensional Scoring",
];

/* ─────────────────────────────────────────────────────────
   ARTICLE RENDERER
───────────────────────────────────────────────────────── */
function ArticleView({ articleKey, onBack }: { articleKey: string; onBack: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const article = ARTICLES[articleKey];

  if (!article) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
        <p style={{ color: "#9CA3AF" }}>Article not found.</p>
        <button onClick={onBack} style={{ marginTop: 12, fontSize: 13, color: "#0A2540", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          Back
        </button>
      </div>
    );
  }

  function copyCode(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const headings = article.content.filter(b => b.type === "h2" || b.type === "h3") as { type: string; text: string }[];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 28, alignItems: "start" }}>
      <article>
        <button
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: "0 0 20px" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#0A2540"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft size={14} /> Back to docs
        </button>

        <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {article.badge && <Badge variant="success" style={{ fontSize: 9 }}>{article.badge}</Badge>}
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{article.readTime}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.035em", marginBottom: 8 }}>
            {article.title}
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>{article.desc}</p>
        </div>

        <div>
          {article.content.map((block, i) => {
            if (block.type === "p") return (
              <p key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>{block.text}</p>
            );
            if (block.type === "h2") return (
              <h2 key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#0A2540", letterSpacing: "-0.025em", marginTop: 32, marginBottom: 12 }}>{block.text}</h2>
            );
            if (block.type === "h3") return (
              <h3 key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", marginTop: 20, marginBottom: 8 }}>{block.text}</h3>
            );
            if (block.type === "list") return (
              <ul key={i} style={{ margin: "0 0 16px 0", padding: "0 0 0 20px" }}>
                {block.items.map((item, j) => (
                  <li key={j} style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, marginBottom: 5 }}>{item}</li>
                ))}
              </ul>
            );
            if (block.type === "code") {
              const codeId = `code-${i}`;
              return (
                <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0d1117", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(0,212,255,0.55)" }}>{block.lang.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(block.text, codeId)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: copied === codeId ? "#10B981" : "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {copied === codeId ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copied === codeId ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: "16px", fontSize: 12.5, lineHeight: 1.7, color: "#e6edf3", fontFamily: "'Fira Code','Cascadia Code','JetBrains Mono',Menlo,monospace", overflowX: "auto", whiteSpace: "pre" }}>
                    <code>{block.text}</code>
                  </pre>
                </div>
              );
            }
            if (block.type === "note") {
              const noteStyles = {
                info: { bg: "#EFF6FF", border: "rgba(59,130,246,0.25)", icon: <BookOpen size={14} style={{ color: "#3B82F6", flexShrink: 0 }} />, color: "#1E40AF" },
                warn: { bg: "#FFFBEB", border: "rgba(245,158,11,0.25)", icon: <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />, color: "#92400E" },
                tip:  { bg: "#ECFDF5", border: "rgba(16,185,129,0.25)", icon: <CheckCircle2 size={14} style={{ color: "#10B981", flexShrink: 0 }} />, color: "#065F46" },
              };
              const s = noteStyles[block.variant];
              return (
                <div key={i} style={{ display: "flex", gap: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                  {s.icon}
                  <p style={{ fontSize: 13, color: s.color, lineHeight: 1.65, margin: 0 }}>{block.text}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </article>

      {headings.length > 0 && (
        <div style={{ position: "sticky", top: 80 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>On this page</p>
          {headings.map((h, i) => (
            <p key={i} style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, paddingLeft: h.type === "h3" ? 10 : 0, lineHeight: 1.4 }}>
              {h.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DocsPage() {
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState<string | null>(null);

  if (active) {
    return (
      <div>
        <ArticleView articleKey={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  const filteredSections = SECTIONS.map(s => ({
    ...s,
    articles: query.trim()
      ? s.articles.filter(a => {
          const art = ARTICLES[a.key];
          if (!art) return false;
          const q = query.toLowerCase();
          return art.title.toLowerCase().includes(q) || art.desc.toLowerCase().includes(q);
        })
      : s.articles,
  })).filter(s => s.articles.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Documentation
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Guides, concepts, and references for integrating with Creditlinker.
        </p>
      </div>

      <div style={{ position: "relative", maxWidth: 540 }}>
        <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search documentation…"
          style={{
            width: "100%", padding: "11px 36px 11px 40px",
            border: "1px solid #E5E7EB", borderRadius: 10,
            fontSize: 14, color: "#374151", outline: "none",
            background: "white", boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#0A2540")}
          onBlur={e  => (e.currentTarget.style.borderColor = "#E5E7EB")}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, alignItems: "start" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredSections.map(section => (
            <div key={section.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
                  <section.icon size={13} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
                  {section.title}
                </h3>
                {section.badge && <Badge variant="secondary" style={{ fontSize: 9 }}>{section.badge}</Badge>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {section.articles.map(({ key, badge }) => {
                  const art = ARTICLES[key];
                  const hasContent = !!art;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => hasContent && setActive(key)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "13px 15px",
                        background: "white", border: "1px solid #E5E7EB",
                        borderRadius: 10, textAlign: "left",
                        cursor: hasContent ? "pointer" : "default",
                        transition: "all 0.12s",
                        width: "100%",
                      }}
                      onMouseEnter={e => { if (hasContent) { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      <BookOpen size={13} style={{ color: hasContent ? "#9CA3AF" : "#D1D5DB", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: hasContent ? "#0A2540" : "#9CA3AF" }}>{key}</p>
                          {(badge || art?.badge) && <Badge variant="success" style={{ fontSize: 9 }}>{badge || art?.badge}</Badge>}
                        </div>
                        <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
                          {art?.desc || "Coming soon"}
                        </p>
                      </div>
                      <ChevronRight size={12} style={{ color: hasContent ? "#D1D5DB" : "#E5E7EB", flexShrink: 0, marginTop: 2 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div style={{ padding: "40px 24px", textAlign: "center" as const }}>
              <BookOpen size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#9CA3AF" }}>No articles match &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80 }}>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540" }}>Popular Articles</p>
            </div>
            {POPULAR_KEYS.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => ARTICLES[key] && setActive(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "10px 16px",
                  borderBottom: i < POPULAR_KEYS.length - 1 ? "1px solid #F9FAFB" : "none",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D1D5DB", minWidth: 16 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, lineHeight: 1.4 }}>{key}</span>
              </button>
            ))}
          </div>

          <Link href="/developers/api-reference" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: "#0A2540", textDecoration: "none" }}>
            <Code2 size={15} style={{ color: "#00D4FF", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>API Reference</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Browse all endpoints →</p>
            </div>
          </Link>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid #E5E7EB", background: "white", textDecoration: "none", fontSize: 13, fontWeight: 600, color: "#374151" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}
          >
            <ExternalLink size={13} style={{ color: "#9CA3AF" }} />
            Open full docs site
          </a>
        </div>
      </div>
    </div>
  );
}
