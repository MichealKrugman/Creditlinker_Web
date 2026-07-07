/**
 * lib/login-guard.ts
 * ─────────────────────────────────────────────────────────────
 * Thin client for the login-guard edge function (SEC-04).
 *
 * Used by both the public login page and the admin login page to:
 *   1. Check whether an account is locked BEFORE attempting a password
 *      or MFA check (so a locked-out account never even reaches
 *      Supabase Auth).
 *   2. Report failed password/MFA attempts so the lockout counter can
 *      increment server-side.
 *   3. Reset the lockout counter on a fully successful sign-in.
 *
 * This is intentionally a standalone, unauthenticated call — there is
 * no session yet at the point these functions are used.
 * ─────────────────────────────────────────────────────────────
 */

export type LoginScope = "admin" | "public";

type GuardResponse = { locked: boolean; retry_after_seconds: number };

async function callLoginGuard(
  scope: LoginScope,
  action: "precheck" | "fail" | "success",
  email: string,
): Promise<GuardResponse> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/login-guard`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ scope, action, email }),
      },
    );
    if (!res.ok && res.status !== 429 && res.status !== 423) {
      // Unexpected error shape — fail open so a login-guard outage never
      // blocks a legitimate sign-in.
      return { locked: false, retry_after_seconds: 0 };
    }
    const data = await res.json();
    return { locked: !!data.locked, retry_after_seconds: data.retry_after_seconds ?? 0 };
  } catch {
    // Network error talking to login-guard — fail open, same reasoning.
    return { locked: false, retry_after_seconds: 0 };
  }
}

/** Call before attempting signInWithPassword or mfa.verify. */
export function precheckLogin(scope: LoginScope, email: string) {
  return callLoginGuard(scope, "precheck", email);
}

/** Call after a failed password check OR a failed MFA code check. */
export function reportLoginFailure(scope: LoginScope, email: string) {
  return callLoginGuard(scope, "fail", email);
}

/** Call after a fully successful sign-in (password + MFA if applicable). */
export function reportLoginSuccess(scope: LoginScope, email: string) {
  return callLoginGuard(scope, "success", email);
}

/**
 * Call before attempting supabase.auth.signUp(). IP-only check (no scope
 * needed) — guards against bulk account creation from a single source.
 */
export async function precheckRegister(email: string): Promise<GuardResponse> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/login-guard`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ action: "register", email }),
      },
    );
    if (!res.ok && res.status !== 429 && res.status !== 423) {
      return { locked: false, retry_after_seconds: 0 };
    }
    const data = await res.json();
    return { locked: !!data.locked, retry_after_seconds: data.retry_after_seconds ?? 0 };
  } catch {
    return { locked: false, retry_after_seconds: 0 };
  }
}

/** Friendly copy for a locked-account error message. */
export function formatLockMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Friendly copy for a registration rate-limit error message. */
export function formatRegisterLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many accounts created from this network recently. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
