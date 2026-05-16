import { NextRequest, NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────────────────────
   CREDITLINKER API PROXY
   
   Routes traffic for the two API hostnames to Supabase edge functions,
   while enforcing environment/key-prefix consistency:

     api.creditlinker.com.ng          → live environment  (sk_live_ keys)
     sandbox.api.creditlinker.com.ng  → test environment  (sk_test_ keys)
───────────────────────────────────────────────────────────────────────────── */

const SUPABASE_FUNCTIONS_URL =
  "https://gsillmzvcufuntriytjc.supabase.co/functions/v1";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  const isSandboxApi = host.startsWith("sandbox.api.");
  const isLiveApi    = host.startsWith("api.") && !isSandboxApi;

  // Non-API host — pass through untouched
  if (!isLiveApi && !isSandboxApi) {
    return NextResponse.next();
  }

  const env: "live" | "test" = isSandboxApi ? "test" : "live";
  const expectedPrefix        = env === "test" ? "sk_test_" : "sk_live_";

  // Extract API key from Authorization: Bearer <key> or x-api-key header
  const authHeader   = request.headers.get("authorization") ?? "";
  const apiKeyHeader = request.headers.get("x-api-key")     ?? "";

  const rawKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : apiKeyHeader.trim();

  // Enforce prefix/environment match — only if a key was supplied.
  // No key = pass through and let the edge function return its own 401.
  if (rawKey && !rawKey.startsWith(expectedPrefix)) {
    return new NextResponse(
      JSON.stringify({
        error: "unauthorized",
        message: "Authentication failed. Check your API key and ensure you are using the correct endpoint.",
      }),
      {
        status:  403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Inject x-creditlinker-env so edge functions know which environment
  // they're operating in without re-parsing the key themselves
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-creditlinker-env", env);

  const { pathname, search } = request.nextUrl;
  const target = `${SUPABASE_FUNCTIONS_URL}${pathname}${search}`;

  return NextResponse.rewrite(new URL(target), {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/(.*)" ],
};
