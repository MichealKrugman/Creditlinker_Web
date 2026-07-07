/**
 * Admin API utilities
 *
 * Centralises the two call patterns used across the admin portal:
 *  - callAdminFn(body)          → POST to the merged /admin edge function
 *  - callEdgeFn(name, body?)    → POST (or GET) to any named edge function
 *
 * Both resolve the caller's JWT from the active Supabase session so callers
 * don't have to handle auth headers themselves.
 *
 * SCALE-06: callAdminFn always POSTs, so plain HTTP Cache-Control headers
 * never apply (browsers don't cache POST responses). For stable-ish data
 * (dashboard KPI tiles, pipeline health, platform metrics) that's fine to
 * be 60-90s stale, callAdminFnCached() below adds a small in-memory TTL
 * cache keyed by the request body, so repeated mounts / tab refocuses
 * within the TTL window reuse the last response instead of re-invoking
 * the edge function.
 */

import { supabase } from "@/lib/supabase";

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

function baseHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

/**
 * Call the merged /admin edge function.
 * Always POSTs; `body.action` selects the handler server-side.
 *
 * @example
 *   const data = await callAdminFn({ action: "get-platform-metrics" });
 */
export async function callAdminFn(body: object): Promise<any> {
  const token = await getToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin`,
    {
      method: "POST",
      headers: baseHeaders(token),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `Admin fn request failed: ${res.status}`
    );
  }
  return res.json();
}

// ── SCALE-06: in-memory TTL cache for read-mostly admin fn calls ──────────
type CacheEntry = { value: any; expiresAt: number; promise?: Promise<any> };
const adminFnCache = new Map<string, CacheEntry>();

/**
 * Same as callAdminFn, but caches the resolved response in memory for
 * `ttlMs` (default 60s), keyed by the JSON-serialised request body.
 * Concurrent calls for the same key while a request is in flight share
 * the same promise instead of firing duplicate requests.
 *
 * Use this for dashboard tiles, pipeline health, and other data that's
 * acceptable to be slightly stale. Do NOT use for anything that must
 * reflect a just-made mutation immediately — call callAdminFn directly,
 * or invalidateAdminFnCache() after the mutation.
 */
export async function callAdminFnCached(body: object, ttlMs = 60_000): Promise<any> {
  const key = JSON.stringify(body);
  const now = Date.now();
  const existing = adminFnCache.get(key);

  if (existing) {
    if (existing.promise) return existing.promise; // in-flight — share it
    if (existing.expiresAt > now) return existing.value; // still fresh
  }

  const promise = callAdminFn(body)
    .then((value) => {
      adminFnCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((err) => {
      adminFnCache.delete(key); // don't cache failures
      throw err;
    });

  adminFnCache.set(key, { value: undefined, expiresAt: 0, promise });
  return promise;
}

/** Clear cached entries. Pass a substring to only clear matching keys (e.g. action name). */
export function invalidateAdminFnCache(matching?: string): void {
  if (!matching) { adminFnCache.clear(); return; }
  for (const key of adminFnCache.keys()) {
    if (key.includes(matching)) adminFnCache.delete(key);
  }
}

/**
 * Call any named edge function by name.
 * Defaults to POST; pass method: "GET" for read-only functions.
 *
 * @example
 *   await callEdgeFn("admin-suspend-business", { business_id, reason });
 *   await callEdgeFn("resolve-dispute", { dispute_id, resolution_notes });
 */
export async function callEdgeFn(
  name: string,
  body?: object,
  method: "POST" | "GET" = "POST"
): Promise<any> {
  const token = await getToken();
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method,
    headers: baseHeaders(token),
    ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `Edge fn "${name}" failed: ${res.status}`
    );
  }
  return res.json();
}
