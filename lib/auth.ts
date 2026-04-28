/**
 * lib/auth.ts
 * All authentication logic for Creditlinker.
 * Wraps Supabase Auth — imported by login/register pages and auth guards.
 */

import { supabase } from "./supabase";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

export type AccountType = "business" | "financer" | "developer";

export interface AuthUser {
  id: string;
  email: string;
  accountType: AccountType;
  /** For businesses: the business_id from the businesses table */
  businessId?: string;
  /** For financers: the institution_id from the institutions table */
  institutionId?: string;
}

/* ─────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────── */

/**
 * Sign in with email + password.
 * Returns the user's account type so the caller can redirect correctly.
 * Throws a plain error message string on failure.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ accountType: AccountType; redirectPath: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Translate Supabase error messages into friendly ones
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password.");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("Please confirm your email before signing in.");
    }
    throw new Error(error.message);
  }

  const user = data.user;
  const accountType = user.user_metadata?.account_type as AccountType;
  const redirectPath = getDashboardPath(accountType);

  return { accountType, redirectPath };
}

/* ─────────────────────────────────────────────────────────
   REGISTER — BUSINESS
───────────────────────────────────────────────────────── */

export interface RegisterBusinessInput {
  fullName: string;
  businessName: string;
  email: string;
  password: string;
  isRegistered: boolean; // CAC registered or not
}

/**
 * Register a Business account.
 * 1. Creates a Supabase Auth user with account_type metadata.
 * 2. Inserts a row into the businesses table.
 * Throws a plain error message string on failure.
 */
export async function registerBusiness(input: RegisterBusinessInput): Promise<void> {
  const { fullName, businessName, email, password, isRegistered } = input;

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: "business",
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) throw new Error("Account creation failed. Please try again.");

  // Step 2: Insert business record
  // financial_identity_id and creditlinker_id are generated here as placeholders.
  // They will be properly computed by the backend pipeline on first sync.
  const financialIdentityId = `FI-${userId.slice(0, 8).toUpperCase()}`;
  const creditlinkerId = `CL-${userId.slice(0, 8).toUpperCase()}`;

  const { error: dbError } = await supabase.from("businesses").insert({
    financial_identity_id: financialIdentityId,
    creditlinker_id: creditlinkerId,
    name: businessName,
    owner_id: userId,
    profile_status: "incomplete",
    kyc_status: "unverified",
    open_to_financing: false,
    selected_capital_categories: [],
    tier: "free",
    // registration_number left null until KYC — only if CAC registered
    ...(isRegistered ? {} : {}), // placeholder for future CAC field
  });

  if (dbError) {
    // Auth user was created but DB insert failed — sign them out to avoid orphan auth user
    await supabase.auth.signOut();
    throw new Error("Failed to create your business profile. Please contact support.");
  }
}

/* ─────────────────────────────────────────────────────────
   REGISTER — FINANCER (INSTITUTION)
───────────────────────────────────────────────────────── */

export interface RegisterFinancerInput {
  fullName: string;
  institutionName: string;
  email: string;
  password: string;
}

/**
 * Register a Capital Provider (Institution) account.
 * 1. Creates a Supabase Auth user with account_type metadata.
 * 2. Inserts a row into the institutions table.
 */
export async function registerFinancer(input: RegisterFinancerInput): Promise<void> {
  const { fullName, institutionName, email, password } = input;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: "financer",
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) throw new Error("Account creation failed. Please try again.");

  const { error: dbError } = await supabase.from("institutions").insert({
    name: institutionName,
    category: "capital_provider", // default — can be updated in settings
    owner_id: userId,
    tier: "free",
  });

  if (dbError) {
    await supabase.auth.signOut();
    throw new Error("Failed to create your institution profile. Please contact support.");
  }
}

/* ─────────────────────────────────────────────────────────
   REGISTER — DEVELOPER
───────────────────────────────────────────────────────── */

export interface RegisterDeveloperInput {
  fullName: string;
  email: string;
  password: string;
}

/**
 * Register a Developer account.
 * Developers only need a Supabase Auth user — no extra DB row needed for MVP.
 */
export async function registerDeveloper(input: RegisterDeveloperInput): Promise<void> {
  const { fullName, email, password } = input;

  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: "developer",
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(authError.message);
  }
}

/* ─────────────────────────────────────────────────────────
   SIGN OUT
───────────────────────────────────────────────────────── */

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/* ─────────────────────────────────────────────────────────
   GET CURRENT SESSION
───────────────────────────────────────────────────────── */

/**
 * Returns the current session's access token (JWT).
 * Returns null if the user is not logged in.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Returns account_type from the current user's metadata.
 * Returns null if not logged in.
 */
export async function getCurrentAccountType(): Promise<AccountType | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return data.user.user_metadata?.account_type as AccountType ?? null;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

export function getDashboardPath(accountType: AccountType): string {
  switch (accountType) {
    case "business":  return "/dashboard";
    case "financer":  return "/financer/dashboard";
    case "developer": return "/developers/overview";
    default:          return "/login";
  }
}
