# Creditlinker Admin Portal — Development Roadmap

> Use this document to resume development in any AI session.
> Paste the relevant section to the agent and say "continue from here".

---

## Project Context

- **Web repo**: `/home/greene/Documents/Creditlinker/Web` → GitHub: `MichealKrugman/Creditlinker_Web` → deployed on Vercel
- **Supabase functions repo**: `/home/greene/Documents/Creditlinker/SDK/supabase` → separate git repo inside the SDK folder
- **Deploy**: Push to master triggers GitHub Actions CI → `supabase functions deploy`
- **Stack**: Next.js 16, TypeScript, Supabase Auth + Edge Functions (Deno/Hono), Supabase Postgres
- **Auth**: Admin users have `app_metadata.role = "admin"` and `app_metadata.admin_role = "super_admin" | "operations_admin" | "risk_admin" | "viewer"`
- **RBAC file**: `lib/admin-rbac.ts` — `AdminRole`, `ROLE_PRESETS`, `canView`, `canManage`, `isSuperAdmin`
- **Admin user context**: `lib/admin-user-context.tsx` — `AdminUserProvider`, `useAdminUser`
- **All admin `callFn` helpers must include**: `apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` header and correct HTTP method

### Edge function pattern
```typescript
// All admin GET functions follow this pattern
const app = makeApp();
app.use("*", requireAuth);
app.use("*", requireRole(["admin"]));
app.get("/", async (c) => { ... });
Deno.serve(app.fetch);
```

### Web callFn pattern
```typescript
async function callFn(name: string, body?: object, method: "GET" | "POST" = "GET") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any)?.error?.message ?? `Request failed: ${res.status}`); }
  return res.json();
}
```

### Commit pattern
```bash
# Supabase functions (from supabase repo, NOT the SDK root)
cd /home/greene/Documents/Creditlinker/SDK/supabase && git add <files> && git commit -m "<msg>" && git push

# Web (from Web repo)
cd /home/greene/Documents/Creditlinker/Web && git add <files> && git commit -m "<msg>" && git push
```

---

## Completed ✅

### Phase 1 — Access control & account actions
- [x] Admin RBAC tiers (`super_admin`, `operations_admin`, `risk_admin`, `viewer`) in `lib/admin-rbac.ts`
- [x] `ROLE_PRESETS`, `ROLE_LABELS`, `ROLE_DESCRIPTIONS`, `getRoleLabel` helpers
- [x] `admin-user-context.tsx` wired to real Supabase session (reads `app_metadata.admin_role`)
- [x] `invite-admin-user` edge function — super_admin only, writes `admin_role` + `permissions` to `app_metadata`
- [x] `get-admin-users` edge function — GET, returns all admins with role/permissions
- [x] Settings page — invite modal with role selector + permission preview, admin list with role badges
- [x] Business detail page — `/admin/businesses/[id]` — profile, KYC, score history, pipeline, accounts, consents, financing, disputes, wallet, actions panel
- [x] `admin-get-business-detail` edge function
- [x] `admin-update-business-field` edge function — whitelisted field overrides with audit trail
- [x] Manual pipeline trigger from business detail page (calls `run-pipeline`)
- [x] Suspend / activate / approve KYC from business detail page
- [x] Financer detail page — `/admin/financers/[id]` — profile, portfolio, consents, disputes, actions
- [x] `admin-get-financer-detail` edge function
- [x] Eye link on financers list to detail page

### Infrastructure fixes (already merged)
- [x] Auth ES256 JWT fix (`_shared/auth.ts` — `supabase.auth.getUser()`)
- [x] Hono routing fix (`_shared/hono.ts` — `getPath: () => "/"`)
- [x] `apikey` header added to all admin page `callFn` helpers
- [x] `admin-get-disputes`, `admin-get-notifications` new functions
- [x] `admin-get-platform-metrics` schema fixed (no `status` on institutions)
- [x] `admin-get-financers` schema fixed (removed non-existent columns)
- [x] `admin-get-pipeline-health` schema fixed (removed broken join)
- [x] Financial data page wired to `admin-get-pipeline-health`
- [x] Notifications history load fixed (GET method)
- [x] CI `continue-on-error` on deploy step (free plan 402 bulk update)
- [x] Business detail page switched from edge function to direct Supabase queries (CORS/function slot fix)
- [x] RLS admin read/write bypass policies added for all business detail tables (migration `20260511000000_admin_read_policies.sql`)
- [x] `linked_accounts`, `financing_records`, `consent_records`, `dispute_records` column names corrected; FK joins replaced with institution lookup

---

## Remaining Development

### Phase 2 — Business & financer management

#### 2A. Export on all pages ✅
- [x] `businesses` — CSV export from filtered rows
- [x] `financers` — CSV export from filtered rows
- [x] `disputes` — Export button added + CSV export
- [x] `audit-logs` — already implemented
- [x] `reports` — CSV export of KPIs, sector breakdown, financing summary

#### 2B. Dispute detail & timeline ✅
- Route: `/admin/disputes/[id]`
- Direct Supabase queries (no edge function needed — admin RLS policies in place)
- Page tabs: Overview | Timeline | Resolution
- Actions: resolve dispute (calls existing `resolve-dispute` function)
- Eye link added to disputes list page (open disputes) and resolved disputes (click row)

#### 2C. Developer detail page ✅
- Route: `/admin/developers/[id]` (id = owner_id)
- Direct Supabase queries: `businesses`, `sdk_api_keys`, `sdk_events`, `webhooks`
- Page tabs: Overview | API Usage | Webhooks
- Actions: suspend/activate developer
- Eye link added to developers list page

#### 2D. Wallet & ledger view (on business detail page) ✅
- Added "Ledger" tab to business detail page
- Queries `ledger_entries` where `business_id = ?`, ordered by date desc, limit 100
- Shows: date, type (credit/debit badge), description, amount (signed, color-coded), running balance after
- Wallet balance + status shown in card header
- Migration `20260511000001_admin_read_policies_ext.sql` adds RLS for `ledger_entries`

#### 2E. Financer onboarding approval workflow
- Currently institutions exist with no approval columns in DB
- Option A: Add `approval_status` and `approved_at` columns to `institutions` table via migration
- Option B: Use `platform_events` to track approval state
- Admin action buttons for approve/reject already exist on financer detail page
- Needs DB migration + `admin-approve-financer` and `admin-suspend-financer` functions to write the status somewhere queryable

---

### Phase 3 — Reporting & notifications

#### 3A. Date range filtering on audit logs
- File: `app/(admin)/admin/audit-logs/page.tsx`
- Add date-from / date-to inputs above the log table
- Filter the Supabase query: `.gte("created_at", from).lte("created_at", to)`
- The audit log page queries `platform_events` directly via the Supabase client — no edge function needed

#### 3B. Targeted notifications
- File: `app/(admin)/admin/notifications/page.tsx`
- Currently broadcasts to everyone — add audience selector: `all`, `businesses`, `financers`, `specific business (by ID)`
- Update `admin-broadcast-notification` edge function to accept `audience` and `target_id` params
- When `target_id` is set, only insert notification for that user's `owner_id`

#### 3C. Notification delivery status
- Add `delivered_at` and `read_at` tracking to the `notifications` table (migration needed)
- Show delivery stats on the notification history list in the notifications page

#### 3D. Business PDF statement
- Route: button on business detail page → `/admin/businesses/[id]/statement`
- New edge function: `admin-generate-business-statement` — returns JSON with all data
- Web: use browser `window.print()` with a print-optimised layout, or generate via a PDF library
- Content: business name, registration, score, data coverage, financing summary, dispute summary

---

### Phase 4 — System & security

#### 4A. Admin activity log (separate from platform events)
- Route: `/admin/audit-logs` already exists but shows `platform_events`
- Add a second tab "Admin Actions" that shows rows from `audit_logs` table where `actor_type = "admin"`
- The `audit_logs` table has: `id, actor_id, actor_type, action, target_type, target_id, metadata, created_at`
- No new edge function — query `audit_logs` directly from the page via Supabase client

#### 4B. Webhook delivery logs
- Route: new tab or section on System page
- Query `webhooks` table to show configured webhooks
- Show delivery history if stored in a related table
- Add retry button (calls `test-webhook` edge function)

#### 4C. Session management
- Settings page — new "Sessions" tab (super_admin only)
- Use Supabase Auth Admin API: `db.auth.admin.listUsers()` then filter by `last_sign_in_at`
- Force logout: `db.auth.admin.signOut(userId)` from a new `admin-revoke-session` edge function

#### 4D. 2FA enforcement
- Settings page security tab — MFA toggle already exists visually
- Wire the `mfa_required` setting to actually check `supabase.auth.mfa` status on login
- Redirect non-MFA admin users to enroll after login

#### 4E. Real-time system health
- System page currently loads once — add auto-refresh every 30 seconds
- Add `setInterval` in the page's `useEffect` with cleanup
- Add a "last updated" timestamp display

---

### Phase 5 — Dashboard improvements

#### 5A. Dashboard data wiring
- Verification queue count (`verification_queue`) comes from `admin-get-platform-metrics` — verify it's showing
- Recent audit events — `recent_audit` field from same function — wire to the audit strip component
- Pipeline health preview — wire from `admin-get-pipeline-health` `summary` field

#### 5B. Dashboard quick-action buttons
- "View pending verifications" → `/admin/verifications`
- "Resolve oldest dispute" → `/admin/disputes`
- These are just Link components — no backend needed

---

## Database columns confirmed (for reference)

```
businesses:       business_id, name, sector, owner_id, profile_status, kyc_status,
                  tier, registration_number, data_coverage_start, data_coverage_end,
                  last_pipeline_run_at, open_to_financing, kyc_bvn_masked, kyc_nin_masked,
                  kyc_bvn_verified, kyc_nin_verified, kyc_id_type, kyc_id_verified,
                  created_at, deleted_at

institutions:     institution_id, name, category, owner_id, created_at, tier
                  (NO status, approval_status, or approved_at columns)

pipeline_runs:    pipeline_run_id, business_id, status, stage_reached, sync_reason,
                  tier, kyc_status, raw_transaction_count, started_at, completed_at,
                  duration_ms, errors, warnings, created_at
                  (NO data_quality_score or composite_score)

dispute_records:  dispute_id, financing_record_id, business_id, institution_id,
                  initiated_by, opened_at, reason, resolution, resolved_at,
                  resolution_notes, platform_verified, direct_debit_triggered
                  (NO created_at — use opened_at)

platform_events:  id, actor_id, actor_type, surface, event_type, severity,
                  target_type, target_id, business_id, message, metadata, created_at
                  (resource_id does NOT exist — use target_id)

audit_logs:       id, actor_id, actor_type, action, target_type, target_id,
                  metadata, created_at

creditlinker_scores: business_id, composite_score, data_quality_score, computed_at
```

---

## How to resume in a new session

Tell the agent:
> "Read ADMIN_DEVELOPMENT_ROADMAP.md in the Web repo, then continue with [item name]."

Or paste a specific section and say:
> "Implement this. Follow the callFn pattern and edge function pattern in the document."
