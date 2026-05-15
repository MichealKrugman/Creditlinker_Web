/**
 * app/api/v1/[...path]/route.ts
 *
 * Developer API gateway.
 *
 * Every request a developer makes to:
 *   POST /api/v1/business/score
 *   GET  /api/v1/institution/discovery
 *   etc.
 *
 * flows through here. The gateway:
 *   1. Reads the Authorization: Bearer <key> header
 *   2. Validates the key via resolveApiKey()
 *   3. Forwards the request to the internal backend (INTERNAL_API_URL)
 *   4. Writes a log row to developer_api_logs (fire-and-forget)
 *   5. Returns the backend response verbatim
 *
 * Environment variables required:
 *   INTERNAL_API_URL          — base URL of the real backend, e.g. http://localhost:4000
 *                               or https://internal.creditlinker.com.ng
 *   SUPABASE_SERVICE_ROLE_KEY — for api-logger writes (already in .env.local)
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey, logApiCall } from "@/lib/api-logger";

// The real backend that actually handles business logic.
// Set INTERNAL_API_URL in .env.local — defaults to localhost:4000 for dev.
const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ?? "http://localhost:4000";

// Headers we never forward upstream (Next.js internals / hop-by-hop)
const STRIP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
]);

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const start = Date.now();
  const endpoint = "/" + (params.path ?? []).join("/");
  const method   = req.method;

  // ── 1. Extract and validate the API key ──────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const rawKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!rawKey) {
    return NextResponse.json(
      { error: "unauthorized", message: "Missing Authorization header. Use: Authorization: Bearer <key>" },
      { status: 401 }
    );
  }

  const keyInfo = await resolveApiKey(rawKey);

  if (!keyInfo) {
    return NextResponse.json(
      { error: "unauthorized", message: "Invalid or revoked API key." },
      { status: 401 }
    );
  }

  // ── 2. Build upstream request ─────────────────────────────────────
  const upstreamUrl = `${INTERNAL_API_URL}/v1${endpoint}${req.nextUrl.search}`;

  // Forward all headers except stripped ones; replace Authorization with
  // an internal service token so the backend knows it's trusted.
  const upstreamHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      upstreamHeaders.set(key, value);
    }
  });
  upstreamHeaders.set("x-developer-id",  keyInfo.developer_id);
  upstreamHeaders.set("x-api-key-id",    keyInfo.key_id);
  upstreamHeaders.set("x-environment",   keyInfo.environment);
  upstreamHeaders.set("authorization",   `Bearer ${process.env.INTERNAL_API_KEY ?? ""}`);

  // ── 3. Proxy to upstream ──────────────────────────────────────────
  let upstreamResponse: Response;
  let statusCode = 502;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error Next.js edge runtime supports duplex
      duplex: "half",
    });
    statusCode = upstreamResponse.status;
  } catch (err) {
    // Upstream is unreachable — log and return 502
    const elapsed = Date.now() - start;
    void logApiCall({
      developer_id:     keyInfo.developer_id,
      api_key_id:       keyInfo.key_id,
      endpoint,
      method,
      status_code:      502,
      response_time_ms: elapsed,
      environment:      keyInfo.environment,
    });
    console.error(`[gateway] upstream error for ${method} ${endpoint}:`, err);
    return NextResponse.json(
      { error: "gateway_error", message: "Upstream service unreachable." },
      { status: 502 }
    );
  }

  const elapsed = Date.now() - start;

  // ── 4. Log the call (fire-and-forget) ────────────────────────────
  void logApiCall({
    developer_id:     keyInfo.developer_id,
    api_key_id:       keyInfo.key_id,
    endpoint,
    method,
    status_code:      statusCode,
    response_time_ms: elapsed,
    environment:      keyInfo.environment,
  });

  // ── 5. Stream upstream response back to developer ─────────────────
  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  // Add timing header for transparency
  responseHeaders.set("x-response-time", `${elapsed}ms`);
  responseHeaders.set("x-request-id",    crypto.randomUUID());

  return new NextResponse(upstreamResponse.body, {
    status:  statusCode,
    headers: responseHeaders,
  });
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const OPTIONS = handler;

// Allow large request bodies (file uploads etc.)
export const config = {
  api: { bodyParser: false },
};
