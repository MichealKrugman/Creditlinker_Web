import { supabase } from "@/lib/supabase";

/**
 * Resolves the institution_id for any logged-in user —
 * whether they are the owner or an invited member.
 *
 * Returns null if the user has no institution association.
 */
export async function getMyInstitutionId(userId: string): Promise<string | null> {
  // 1. Check if they own an institution
  const { data: owned } = await supabase
    .from("institutions")
    .select("institution_id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (owned) return owned.institution_id;

  // 2. Check if they are a member of one
  const { data: member } = await supabase
    .from("institution_members")
    .select("institution_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return member ? String(member.institution_id) : null;
}

/**
 * Returns the institution row + current member row for the logged-in user.
 * Used by pages that need both institution context and the user's role.
 */
export async function getMyInstitutionContext(userId: string) {
  const institutionId = await getMyInstitutionId(userId);
  if (!institutionId) return { institutionId: null, member: null, institution: null };

  const [instRes, memberRes] = await Promise.all([
    supabase
      .from("institutions")
      .select("institution_id, name, owner_id")
      .eq("institution_id", institutionId)
      .maybeSingle(),
    supabase
      .from("institution_members")
      .select("id, user_id, role, full_name, email, team_lead_id, is_active")
      .eq("institution_id", institutionId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    institutionId,
    institution: instRes.data ?? null,
    member: memberRes.data ?? null,
  };
}
