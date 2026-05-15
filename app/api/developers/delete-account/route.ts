/**
 * app/api/developers/delete-account/route.ts
 *
 * Permanently deletes a developer account.
 * Requires the caller to be authenticated — we verify the session server-side
 * and only allow a developer to delete their OWN account.
 *
 * Steps:
 *  1. Verify the caller's session via the Bearer token
 *  2. Confirm account_type === "developer"
 *  3. Delete the developer_accounts row (cascades to api_keys, logs, webhooks)
 *  4. Delete the Supabase Auth user via service role
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function DELETE(req: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: userError } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ── 2. Guard: developers only ─────────────────────────────────────
  if (user.user_metadata?.account_type !== "developer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ── 3. Delete DB row (cascades to api_keys, logs, webhooks, events) ─
  const { error: dbError } = await supabaseAdmin
    .from("developer_accounts")
    .delete()
    .eq("id", user.id);

  if (dbError) {
    console.error("[delete-account] DB delete failed:", dbError.message);
    return NextResponse.json(
      { error: "Failed to delete account data. Please contact support." },
      { status: 500 }
    );
  }

  // ── 4. Delete Auth user ───────────────────────────────────────────
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (authError) {
    // DB row is gone; log the orphaned auth user but don't fail the caller
    console.error("[delete-account] Auth user delete failed:", authError.message);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
