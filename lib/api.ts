/**
 * lib/api.ts
 * Wrapper for all Creditlinker Edge Function calls.
 * Automatically attaches the user's JWT to every request.
 * All endpoints are protected — no token = 401 from Supabase.
 */

import { getAccessToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

if (!BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env.local");
}

/* ─────────────────────────────────────────────────────────
   CORE FETCH
───────────────────────────────────────────────────────── */

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export interface ApiError {
  message: string;
  status: number;
}

/**
 * Makes an authenticated request to a Creditlinker Edge Function.
 * Throws an ApiError on non-2xx responses.
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw { message: "Not authenticated. Please sign in.", status: 401 } as ApiError;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = "An unexpected error occurred.";
    try {
      const err = await response.json();
      message = err.message ?? err.error ?? message;
    } catch {
      // response body wasn't JSON — use default message
    }

    if (response.status === 401) {
      message = "Your session has expired. Please sign in again.";
    }

    throw { message, status: response.status } as ApiError;
  }

  return response.json() as Promise<T>;
}

/* ─────────────────────────────────────────────────────────
   PIPELINE
───────────────────────────────────────────────────────── */

/** Run the full pipeline for a business */
export const runPipeline = (businessId: string) =>
  apiCall("run-pipeline", { body: { business_id: businessId } });

/** Recompute reputation score */
export const recomputeReputation = (businessId: string) =>
  apiCall("recompute-reputation", { body: { business_id: businessId } });

/* ─────────────────────────────────────────────────────────
   DISCOVERY
───────────────────────────────────────────────────────── */

/** Discovery match — financers finding businesses */
export const discoveryMatch = (
  institutionId: string,
  criteriaId: string,
  limit = 20
) =>
  apiCall("discovery-match", {
    body: { institution_id: institutionId, criteria_id: criteriaId, limit },
  });

/* ─────────────────────────────────────────────────────────
   KYC
───────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
   BUSINESS CREATION
───────────────────────────────────────────────────────── */

export interface CreateBusinessResponse {
  success:         boolean;
  business_id:     string;
  creditlinker_id: string;
  branch_id:       string;
  name:            string;
  sector:          string;
}

/** Create a new isolated business entity owned by the authenticated user */
export const createBusiness = (
  name:                string,
  sector:              string,
  registration_status: 'registered' | 'unregistered'
) =>
  apiCall<CreateBusinessResponse>('create-business', {
    body: { name, sector, registration_status },
  });

/* ─────────────────────────────────────────────────────────
   KYC
───────────────────────────────────────────────────────── */

/** Submit KYC verification */
export const verifyKyc = (businessId: string, kycData: Record<string, unknown>) =>
  apiCall("verify-kyc", { body: { business_id: businessId, ...kycData } });

/* ─────────────────────────────────────────────────────────
   FINANCERS PAGE — CONSENT & MESSAGING
───────────────────────────────────────────────────────── */

export interface FinancerPermissions {
  can_view_score: boolean;
  can_view_transaction_detail: boolean;
  can_view_identity: boolean;
  valid_until?: string;
}

export interface ActiveConsent {
  consent_id:          string;
  institution_id:      string;
  institution_name:    string;
  institution_type:    string;
  granted_at:          string;
  valid_until:         string | null;
  days_remaining:      number | null;
  permissions:         FinancerPermissions;
  access_log:          { accessed_at: string; action: string }[];
  financing_record_id: string | null;
  unread_count:        number;
}

export interface PendingRequest {
  match_id:         string;
  institution_id:   string;
  institution_name: string;
  institution_type: string;
  requested_at:     string;
  capital_category: string;
  match_score:      number;
  status:           string;
}

export interface RevokedConsent {
  consent_id:       string;
  institution_id:   string;
  institution_name: string;
  institution_type: string;
  granted_at:       string;
  revoked_at:       string | null;
}

export interface FinancerData {
  success:          boolean;
  business_id:      string;
  active_consents:  ActiveConsent[];
  pending_requests: PendingRequest[];
  revoked_consents: RevokedConsent[];
}

export interface MessageRecord {
  message_id:  string;
  sender_type: "business" | "institution" | "creditlinker";
  content:     string;
  sent_at:     string;
  read_at:     string | null;
}

export interface MessagesResponse {
  success:        boolean;
  consent_id:     string;
  institution_id: string;
  messages:       MessageRecord[];
}

/** Load all financer relationship data for the active business */
export const getFinancerData = () =>
  apiCall<FinancerData>("get-financer-data", {});

/** Fetch messages for a consent thread (also marks unread as read) */
export const getMessages = (consentId: string) =>
  apiCall<MessagesResponse>("get-messages", { body: { consent_id: consentId } });

/** Business sends a message to a financer on a consent thread */
export const sendMessage = (consentId: string, content: string) =>
  apiCall<{ success: boolean; message: MessageRecord }>(
    "send-message",
    { body: { consent_id: consentId, content } }
  );

/** Extend the valid_until on an active consent */
export const renewConsent = (consentId: string, durationDays: number) =>
  apiCall<{ success: boolean; consent_id: string; valid_until: string; days_remaining: number }>(
    "renew-consent",
    { body: { consent_id: consentId, duration_days: durationDays } }
  );

/** Approve or deny a discovery match request */
export const respondToRequest = (
  matchId:      string,
  action:       "approve" | "deny",
  permissions?: Omit<FinancerPermissions, "valid_until">,
  durationDays?: number
) =>
  apiCall<{ success: boolean; action: string; match_id: string; consent?: ActiveConsent }>(
    "respond-to-request",
    { body: { match_id: matchId, action, permissions, duration_days: durationDays } }
  );

/** Revoke an active consent by consent_id */
export const revokeConsentById = (consentId: string, businessId: string) =>
  apiCall<{ success: boolean; revoked_at: string }>(
    "revoke-consent",
    { body: { consent_id: consentId, business_id: businessId } }
  );

/** Grant consent to an institution directly (without a discovery match) */
export const grantConsent = (businessId: string, institutionId: string) =>
  apiCall("grant-consent", {
    body: { business_id: businessId, institution_id: institutionId },
  });

/* ─────────────────────────────────────────────────────────
   MESSAGES PAGE — ALL THREADS
───────────────────────────────────────────────────────── */

export interface ThreadMessage {
  message_id:  string;
  sender_type: "business" | "institution" | "creditlinker";
  content:     string;
  sent_at:     string;
  read_at:     string | null;
}

export interface MessageThread {
  thread_id:           string;
  type:                "financer" | "creditlinker";
  institution_id:      string | null;
  institution_name:    string | null;
  institution_type:    string | null;
  consent_id:          string | null;
  financing_record_id: string | null;
  subject:             string | null;
  last_message:        string;
  last_message_at:     string;
  business_unread:     number;
  messages:            ThreadMessage[];
}

export interface AllMessagesResponse {
  success: boolean;
  threads: MessageThread[];
}

/** Load all message threads (financer + platform) for the active business */
export const getAllMessages = () =>
  apiCall<AllMessagesResponse>("get-all-messages", {});

/** Mark one or more platform messages as read */
export const markMessagesRead = (messageIds: string[]) =>
  apiCall<{ success: boolean; updated: number }>(
    "mark-messages-read",
    { body: { message_ids: messageIds } }
  );

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS PAGE
───────────────────────────────────────────────────────── */

export type NotifType =
  | "pipeline_complete"
  | "score_change"
  | "consent_request"
  | "financing_offer"
  | "document_reviewed"
  | "account_security"
  | "consent_expiring";

export interface AppNotification {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  metadata:  Record<string, unknown>;
  read:      boolean;
  action:    { label: string; href: string } | null;
  timestamp: string;
}

export interface NotificationsResponse {
  success:       boolean;
  notifications: AppNotification[];
  unread_count:  number;
}

/** Fetch all non-dismissed notifications for the active business */
export const getNotifications = () =>
  apiCall<NotificationsResponse>("get-notifications", {});

/** Mark a single notification as read */
export const markNotificationRead = (notificationId: string) =>
  apiCall<{ success: boolean; action: string }>(
    "manage-notifications",
    { body: { action: "mark_read", notification_id: notificationId } }
  );

/** Mark all notifications as read */
export const markAllNotificationsRead = () =>
  apiCall<{ success: boolean; action: string }>(
    "manage-notifications",
    { body: { action: "mark_all_read" } }
  );

/** Soft-dismiss (hide) a single notification */
export const dismissNotification = (notificationId: string) =>
  apiCall<{ success: boolean; action: string }>(
    "manage-notifications",
    { body: { action: "dismiss", notification_id: notificationId } }
  );

/* ─────────────────────────────────────────────────────────
   DISPUTES PAGE
───────────────────────────────────────────────────────── */

export type DisputeStatus = "pending" | "resolved" | "rejected";

export interface DisputeRecord {
  dispute_id:             string;
  financing_id:           string;
  institution_id:         string;
  institution:            string;
  institution_type:       string;
  capital_category:       string;
  amount:                 number;
  initiated_by:           "business" | "financer";
  opened_at:              string;
  reason:                 string;
  status:                 DisputeStatus;
  resolution:             string;
  resolved_at:            string | null;
  resolution_notes:       string | null;
  platform_verified:      boolean;
  direct_debit_triggered: boolean;
}

export interface ActiveFinancingForDispute {
  financing_id:     string;
  institution:      string;
  capital_category: string;
  amount:           number;
  status:           string;
}

export interface DisputesResponse {
  success:         boolean;
  disputes:        DisputeRecord[];
  active_financing: ActiveFinancingForDispute[];
}

/** Load all disputes + eligible financing records for the active business */
export const getDisputes = () =>
  apiCall<DisputesResponse>("get-disputes", {});

/** Open a new dispute against an active financing record */
export const openDispute = (
  financingId: string,
  reason:      string
) =>
  apiCall<{ success: boolean; dispute_record: DisputeRecord }>(
    "open-dispute",
    { body: { financing_id: financingId, initiated_by: "business", reason } }
  );

/** Submit settlement proof for a financing record */
export const submitSettlementProof = (
  financingId:          string,
  businessId:           string,
  transactionReference: string,
  amountPaid:           number,
  paymentDate:          string,
  bankAccountUsed:      string
) =>
  apiCall<{ success: boolean; financing_record: unknown }>(
    "submit-settlement-proof",
    {
      body: {
        financing_id:          financingId,
        business_id:           businessId,
        transaction_reference: transactionReference,
        amount_paid:           amountPaid,
        payment_date:          paymentDate,
        bank_account_used:     bankAccountUsed,
      },
    }
  );

/* ─────────────────────────────────────────────────────────
   REPORTS — SNAPSHOTS & GENERATION
───────────────────────────────────────────────────────── */

export interface DimensionScore {
  name:      string;
  grade:     string;
  raw_score: number;
  trend:     string;
  signal:    string;
}

export interface IdentitySnapshot {
  snapshot_id:                string;
  pipeline_run_id:            string;
  taken_at:                   string;
  composite_score:            number | null;
  risk_level:                 'low' | 'medium' | 'high' | null;
  data_quality_score:         number | null;
  identity_resolution_status: string | null;
  dimensions:                 Record<string, DimensionScore>;
}

export interface SnapshotsResponse {
  success:   boolean;
  snapshots: IdentitySnapshot[];
}

export type ReportType   = 'financial_identity' | 'readiness' | 'full';
export type ReportFormat = 'pdf' | 'csv';

export interface GenerateReportResponse {
  success:      boolean;
  download_url: string;
  expires_in:   number;
  file_name:    string;
}

/** Fetch all identity snapshots for the active business, newest first */
export const getSnapshots = (businessId: string) =>
  apiCall<SnapshotsResponse>('get-snapshots', { body: { business_id: businessId } });

/** Generate a report and return a 60-second signed download URL */
export const generateReport = (
  businessId:  string,
  reportType:  ReportType,
  format:      ReportFormat = 'pdf',
  snapshotId?: string
) =>
  apiCall<GenerateReportResponse>('generate-report', {
    body: {
      business_id:  businessId,
      report_type:  reportType,
      format,
      ...(snapshotId ? { snapshot_id: snapshotId } : {}),
    },
  });

/* ─────────────────────────────────────────────────────────
   SETTINGS PAGE
───────────────────────────────────────────────────────── */

export interface AccountSettingsResponse {
  success:        boolean;
  user_id:        string;
  email:          string | null;
  full_name:      string | null;
  phone:          string | null;
  mfa_enabled:    boolean;
  last_login:     string | null;
  business_id:    string;
  member_since:   string;
  open_to_financing: boolean;
  kyc_status:     string;
  notification_preferences: {
    pipeline_complete:  boolean;
    score_change:       boolean;
    consent_request:    boolean;
    financing_offer:    boolean;
    document_reviewed:  boolean;
    account_security:   boolean;
    product_updates:    boolean;
  };
  kyc: {
    gender:      string;
    dob:         string;
    address:     string;
    bvn_masked:  string;
    nin_masked:  string;
    bvn_verified: boolean;
    nin_verified: boolean;
    id_type:     string;
    id_number:   string;
    id_expiry:   string;
    id_verified: boolean;
    submitted_at: string | null;
  };
  security_log: {
    id:          string;
    action_type: string;
    detail:      Record<string, unknown>;
    occurred_at: string;
  }[];
}

/** Load all settings data for the authenticated user */
export const getAccountSettings = () =>
  apiCall<AccountSettingsResponse>("get-account-settings", {});

/** Update display name and/or phone number */
export const updateProfile = (fields: { full_name?: string; phone?: string }) =>
  apiCall<{ success: boolean; action: string; updated: Record<string, string> }>(
    "update-account-settings",
    { body: { action: "update_profile", ...fields } }
  );

/** Toggle open_to_financing on the business */
export const updateOpenToFinancing = (open_to_financing: boolean) =>
  apiCall<{ success: boolean; action: string; open_to_financing: boolean }>(
    "update-account-settings",
    { body: { action: "update_open_to_financing", open_to_financing } }
  );

/** Persist notification preference toggles */
export const updateNotificationPrefs = (preferences: Record<string, boolean>) =>
  apiCall<{ success: boolean; action: string; notification_preferences: Record<string, boolean> }>(
    "update-account-settings",
    { body: { action: "update_notification_prefs", preferences } }
  );

/** Save KYC personal fields. BVN/NIN accepted raw — masked server-side. */
export const updateKyc = (fields: {
  gender?:    string;
  dob?:       string;
  address?:   string;
  bvn?:       string;
  nin?:       string;
  id_type?:   string;
  id_number?: string;
  id_expiry?: string;
}) =>
  apiCall<{ success: boolean; action: string; fields_updated: string[] }>(
    "update-account-settings",
    { body: { action: "update_kyc", ...fields } }
  );

/** Change the authenticated user's password (re-auth verified server-side) */
export const changePassword = (new_password: string) =>
  apiCall<{ success: boolean; action: string }>(
    "update-account-settings",
    { body: { action: "change_password", new_password } }
  );

/** Submit a support ticket */
export const createSupportTicket = (
  issue_type:  string,
  subject:     string,
  description: string
) =>
  apiCall<{ success: boolean; action: string; ticket_id: string; created_at: string }>(
    "update-account-settings",
    { body: { action: "create_support_ticket", issue_type, subject, description } }
  );
