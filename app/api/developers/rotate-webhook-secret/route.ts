/**
 * app/api/developers/rotate-webhook-secret/route.ts
 *
 * Regenerates the webhook_secret for the authenticated developer account.
 * The new secret is returned once — the developer must copy it immediately.
 *
 * Steps:
 *  1. Verify the caller's session via the Bearer token
 *  2. Locate the developer_accounts row by auth user id
 *  3. Generate a new 32-byte hex secret
 *  4. Update the row and return the new secret
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  // ── 1. Verify session ────────────────────────────────────────────
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── 2. Find developer account ────────────────────────────────────
  const { data: account, error: accountErr } = await supabaseAdmin
    .from("developer_accounts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (accountErr || !account) {
    return NextResponse.json({ error: "Developer account not found" }, { status: 404 });
  }

  // ── 3. Generate new secret ───────────────────────────────────────
  const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // ── 4. Update and return ─────────────────────────────────────────
  const { error: updateErr } = await supabaseAdmin
    .from("developer_accounts")
    .update({ webhook_secret: newSecret })
    .eq("id", account.id);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to rotate secret" }, { status: 500 });
  }

  return NextResponse.json({ webhook_secret: newSecret });
}
