/**
 * app/api/webhooks/dispatch/route.ts
 *
 * Internal endpoint called by the backend whenever a platform event occurs.
 * It is NOT public-facing — only the internal backend should call it using
 * the INTERNAL_API_SECRET header.
 *
 * Flow:
 *   1. Backend emits an event (score.updated, consent.granted, etc.)
 *   2. Backend POSTs to /api/webhooks/dispatch with the event payload
 *   3. This route looks up all active developer_webhooks subscribed to that event
 *   4. For each match, POSTs to the developer's endpoint URL with a signed payload
 *   5. Writes a row to developer_webhook_events (success or failed) per delivery
 *   6. Updates developer_webhooks.last_used_at
 *
 * Request body expected:
 * {
 *   event_type: string;         // e.g. "score.updated"
 *   developer_id?: string;      // if scoped to one developer, otherwise fan-out to all
 *   payload: Record<string, unknown>;
 * }
 *
 * Environment variables:
 *   INTERNAL_API_SECRET        — shared secret; dispatch is rejected without it
 *   WEBHOOK_SIGNING_SECRET     — used to sign outbound payloads (HMAC-SHA256)
 *   SUPABASE_SERVICE_ROLE_KEY  — for DB writes
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SIGNING_SECRET = process.env.WEBHOOK_SIGNING_SECRET ?? "dev_signing_secret";
const TIMEOUT_MS     = 10_000;

/** HMAC-SHA256 signature for payload verification by the developer */
async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return "sha256=" + Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** POST /api/webhooks/dispatch */
export async function POST(req: NextRequest) {
  // ── Auth: must come from internal backend ─────────────────────────
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    event_type:   string;
    developer_id?: string;
    payload:      Record<string, unknown>;
  };

  if (!body.event_type || !body.payload) {
    return NextResponse.json({ error: "missing event_type or payload" }, { status: 400 });
  }

  // ── Find subscribed webhooks ──────────────────────────────────────
  let query = supabaseAdmin
    .from("developer_webhooks")
    .select("id, developer_id, url")
    .eq("is_active", true)
    .contains("events", [body.event_type]);

  if (body.developer_id) {
    query = query.eq("developer_id", body.developer_id);
  }

  const { data: hooks, error: hooksErr } = await query;

  if (hooksErr || !hooks || hooks.length === 0) {
    return NextResponse.json({ dispatched: 0 });
  }

  // ── Dispatch to each endpoint in parallel ─────────────────────────
  const timestamp   = Date.now();
  const rawPayload  = JSON.stringify({ event: body.event_type, created_at: new Date().toISOString(), data: body.payload });
  const signature   = await signPayload(rawPayload, SIGNING_SECRET);

  const results = await Promise.allSettled(
    hooks.map(async (hook) => {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let httpStatus = 0;
      let status: "delivered" | "failed" = "failed";

      try {
        const res = await fetch(hook.url, {
          method:  "POST",
          headers: {
            "Content-Type":      "application/json",
            "X-CL-Signature":   signature,
            "X-CL-Timestamp":   String(timestamp),
            "X-CL-Event":       body.event_type,
          },
          body:    rawPayload,
          signal:  controller.signal,
        });
        httpStatus = res.status;
        status     = res.ok ? "delivered" : "failed";
      } catch {
        httpStatus = 0;
        status     = "failed";
      } finally {
        clearTimeout(timeout);
      }

      // Write delivery record
      await supabaseAdmin.from("developer_webhook_events").insert({
        developer_id: hook.developer_id,
        event_type:   body.event_type,
        status,
        endpoint_url: hook.url,
        http_status:  httpStatus || null,
      });

      // Update last_used_at
      await supabaseAdmin
        .from("developer_webhooks")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", hook.id);

      return { hook_id: hook.id, status, http_status: httpStatus };
    })
  );

  const dispatched = results.filter(r => r.status === "fulfilled").length;

  return NextResponse.json({ dispatched, total: hooks.length });
}
