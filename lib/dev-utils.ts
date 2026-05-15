/**
 * lib/dev-utils.ts
 *
 * Shared helpers for the developer portal.
 * Used by: overview, usage, settings pages.
 *
 * TIER_LIMITS acts as a fallback until the developer_tiers table is being
 * queried directly. Values must match the seed data in the migration.
 */

export const TIER_LIMITS: Record<string, { requests: number; webhooks: number; pipelines: number }> = {
  read:   { requests: 1_000,    webhooks: 100,   pipelines: 5   },
  signal: { requests: 10_000,   webhooks: 500,   pipelines: 20  },
  build:  { requests: 100_000,  webhooks: 5_000, pipelines: 100 },
};

/**
 * Returns the display label for a tier key.
 * e.g. "read" → "Read", undefined → "—"
 */
export function tierLabel(tier?: string | null): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Derives the next quota reset date from the account's created_at timestamp.
 * Reset is always the 1st of the next calendar month relative to creation month.
 * Falls back to next month from today if no date is supplied.
 */
export function computeResetDate(createdAt?: string | null): string {
  const base  = createdAt ? new Date(createdAt) : new Date();
  const reset = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return reset.toLocaleDateString("en-NG", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}
