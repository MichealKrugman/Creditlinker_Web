/**
 * app/api/auth/session/route.ts
 *
 * Server-side session validation endpoint for AuthGuard.
 *
 * Flow:
 *   AuthGuard (client) → GET /api/auth/session (Authorization: Bearer <jwt>)
 *   → this handler calls supabase.auth.getUser(token) using the service role key
 *   → Supabase re-validates the JWT signature + expiry against its auth server
 *   → returns { accountType } on success, or 401 on failure
 *
 * Why service role key here:
 *   getUser(token) with the service role client does NOT bypass RLS — it just lets
 *   us call the admin auth API to validate any token without needing the user's
 *   own session on the server. The returned user object comes from Supabase's
 *   auth server, not from localStorage, so it cannot be spoofed.
 *
 * This endpoint is intentionally minimal — it validates the token and returns
 * the account_type claim. Nothing else is exposed.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service role client — only used server-side, never exposed to the browser.
// SUPABASE_SERVICE_ROLE_KEY must NOT have the NEXT_PUBLIC_ prefix.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      // Disable session persistence — this is a stateless server client.
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(request: NextRequest) {
  // Extract the JWT from the Authorization header.
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", message: "No token provided." },
      { status: 401 }
    );
  }

  // Re-validate the token against Supabase's auth server.
  // This is the key call — getUser(token) never trusts a cached value.
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Invalid or expired session." },
      { status: 401 }
    );
  }

  const accountType = data.user.user_metadata?.account_type as string | undefined;

  if (!accountType) {
    // Valid Supabase user but no account_type metadata — shouldn't happen in
    // normal registration flow, but fail closed if it does.
    return NextResponse.json(
      { error: "forbidden", message: "Account type not set." },
      { status: 403 }
    );
  }

  // Return only what AuthGuard needs — no sensitive user data.
  return NextResponse.json(
    { accountType },
    {
      status: 200,
      headers: {
        // Prevent this response from being cached anywhere.
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
