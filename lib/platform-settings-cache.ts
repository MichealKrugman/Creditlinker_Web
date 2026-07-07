/**
 * lib/platform-settings-cache.ts
 * ─────────────────────────────────────────────────────────────
 * SCALE-06: platform_settings was being fetched independently in two
 * places — (admin)/layout.tsx (just session_timeout_minutes, for the
 * idle-timeout check) and admin/settings/page.tsx (the full settings
 * row set, for editing). Every time an admin navigated into Settings,
 * that meant two separate reads of the same table within the same
 * session.
 *
 * This module is a tiny shared in-memory cache: the first caller
 * fetches all platform_settings rows and pins them for `ttlMs`
 * (default 60s); everyone else in that window reuses the same data.
 * Settings are edited rarely (an admin session at most), so a short
 * staleness window is an acceptable trade for not re-querying on
 * every layout mount / tab switch.
 */

import { supabase } from "@/lib/supabase";

type SettingsMap = Record<string, any>;

let cache: { value: SettingsMap; expiresAt: number } | null = null;
let inFlight: Promise<SettingsMap> | null = null;

async function fetchAll(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("platform_settings").select("key, value");
  if (error) throw new Error(error.message);
  const out: SettingsMap = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}

/**
 * Returns the full platform_settings map (key -> value), using the
 * cached copy if it's younger than `ttlMs` (default 60s).
 */
export async function getPlatformSettings(ttlMs = 60_000): Promise<SettingsMap> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  if (inFlight) return inFlight; // dedupe concurrent callers

  inFlight = fetchAll()
    .then((value) => {
      cache = { value, expiresAt: Date.now() + ttlMs };
      inFlight = null;
      return value;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });

  return inFlight;
}

/** Call after saving settings so the next read picks up fresh values immediately. */
export function invalidatePlatformSettings(): void {
  cache = null;
}
