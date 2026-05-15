/**
 * lib/api-logger.ts
 *
 * Server-side helper that inserts a row into developer_api_logs.
 * Called from the API gateway route after every proxied request.
 * Uses the service-role client so it can write regardless of RLS.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export interface LogPayload {
  developer_id:     string;
  api_key_id:       string | null;
  endpoint:         string;
  method:           string;
  status_code:      number;
  response_time_ms: number;
  environment:      "live" | "test";
}

/**
 * Writes one API log row. Fire-and-forget — never throws so the
 * response to the developer is never delayed by a logging failure.
 */
export async function logApiCall(payload: LogPayload): Promise<void> {
  try {
    await supabaseAdmin.from("developer_api_logs").insert({
      developer_id:     payload.developer_id,
      api_key_id:       payload.api_key_id,
      endpoint:         payload.endpoint,
      method:           payload.method.toUpperCase(),
      status_code:      payload.status_code,
      response_time_ms: payload.response_time_ms,
      environment:      payload.environment,
    });
  } catch (err) {
    // Log to server console but never surface to the caller
    console.error("[api-logger] failed to write log row:", err);
  }
}

/**
 * Looks up a raw API key (Bearer token), validates it, and returns
 * the developer_id + key id + environment if active.
 * Returns null if the key is not found or is revoked.
 */
export async function resolveApiKey(rawKey: string): Promise<{
  developer_id: string;
  key_id: string;
  environment: "live" | "test";
} | null> {
  if (!rawKey || rawKey.length < 16) return null;

  // The key_prefix is the first 16 characters we stored during creation
  const prefix = rawKey.slice(0, 16);

  const { data, error } = await supabaseAdmin
    .from("developer_api_keys")
    .select("id, developer_id, environment, is_active, key_hash")
    .eq("key_prefix", prefix)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  // Verify the full key hash
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  if (computedHash !== data.key_hash) return null;

  // Update last_used_at in the background
  supabaseAdmin
    .from("developer_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return {
    developer_id: data.developer_id,
    key_id:       data.id,
    environment:  data.environment as "live" | "test",
  };
}
