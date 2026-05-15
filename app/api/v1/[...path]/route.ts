/**
 * app/api/v1/[...path]/route.ts
 *
 * Developer API gateway.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey, logApiCall } from "@/lib/api-logger";

export const dynamic     = "force-dynamic";
export const maxDuration = 60;

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ?? "http://localhost:4000";

const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive",
  "transfer-encoding", "te", "trailer", "upgrade",
]);

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const start    = Date.now();
  const { path } = await params;
  const endpoint = "/" + (path ?? []).join("/");
  const method   = req.method;

  const authHeader = req.headers.get("authorization") ?? "";
  const rawKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!rawKey) {
    return NextResponse.json(
      { error: "unauthorized", message: "Missing Authorization header." },
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

  const upstreamUrl = `${INTERNAL_API_URL}/v1${endpoint}${req.nextUrl.search}`;

  const upstreamHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) upstreamHeaders.set(key, value);
  });
  upstreamHeaders.set("x-developer-id", keyInfo.developer_id);
  upstreamHeaders.set("x-api-key-id",   keyInfo.key_id);
  upstreamHeaders.set("x-environment",  keyInfo.environment);
  upstreamHeaders.set("authorization",  `Bearer ${process.env.INTERNAL_API_KEY ?? ""}`);

  let upstreamResponse: Response;
  let statusCode = 502;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error edge runtime duplex
      duplex: "half",
    });
    statusCode = upstreamResponse.status;
  } catch (err) {
    const elapsed = Date.now() - start;
    void logApiCall({ developer_id: keyInfo.developer_id, api_key_id: keyInfo.key_id, endpoint, method, status_code: 502, response_time_ms: elapsed, environment: keyInfo.environment });
    console.error(`[gateway] upstream error for ${method} ${endpoint}:`, err);
    return NextResponse.json(
      { error: "gateway_error", message: "Upstream service unreachable." },
      { status: 502 }
    );
  }

  const elapsed = Date.now() - start;
  void logApiCall({ developer_id: keyInfo.developer_id, api_key_id: keyInfo.key_id, endpoint, method, status_code: statusCode, response_time_ms: elapsed, environment: keyInfo.environment });

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
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
