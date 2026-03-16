/**
 * ═══════════════════════════════════════════════════════════════
 *  CREDITLINKER — ADMIN RBAC ENGINE
 * ═══════════════════════════════════════════════════════════════
 *
 *  Roles
 *  ─────
 *  super_admin  Full platform access. Cannot be restricted. Can manage
 *               other admin accounts and platform configuration.
 *
 *  admin        Scoped operator. At creation time a super_admin assigns
 *               a permission scope. Each permission is a module + level
 *               pair. A module the admin is not granted is invisible and
 *               route-blocked — not merely read-only.
 *
 *  Permission model
 *  ────────────────
 *  Each permission is a string of the form  "module:level"
 *
 *  Modules     → functional sections of the admin portal
 *  Levels      → view  | manage
 *
 *  view    → read-only access to the module and its data
 *  manage  → view + write actions (approve, suspend, verify, resolve…)
 *
 *  A manage grant implies view. You never need to add both.
 *
 *  Examples
 *  ────────
 *  ['businesses:view']                      read-only businesses access
 *  ['businesses:manage']                    full incl. verify / suspend
 *  ['verifications:manage','reports:view']  mixed-scope admin
 *
 *  JWT source (Keycloak)
 *  ─────────────────────
 *  realm_access.roles claim  → ['super_admin'] | ['admin']
 *  custom claim               → admin_permissions: string[]
 *                               (absent on super_admin tokens)
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin';

/**
 * Every functional section of the admin portal maps to one module.
 * The dashboard is always accessible — it is never gated.
 */
export type PermissionModule =
  | 'businesses'      // Business accounts — view, verify, suspend
  | 'financers'       // Financer institutions — approve, suspend
  | 'developers'      // Developer accounts and API keys
  | 'financial_data'  // Pipeline observability, ingestion monitoring
  | 'verifications'   // Verification queue + dispute resolution
  | 'reports'         // Platform analytics and reports
  | 'system'          // System health, services, config flags
  | 'audit_logs'      // Full audit trail of all platform events
  | 'notifications'   // Platform-wide broadcast notifications
  | 'settings';       // Platform configuration — super_admin only by default

export type AccessLevel = 'view' | 'manage';

/**
 * Strongly-typed permission string. Examples:
 *   'businesses:view'   'verifications:manage'
 */
export type PermissionString = `${PermissionModule}:${AccessLevel}`;

/**
 * Resolved admin user object — derived from the Keycloak JWT.
 */
export interface AdminUser {
  /** Keycloak subject (user UUID) */
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  /**
   * Granted permissions.
   * super_admin : ignored — all access is implied.
   * admin       : explicit list. Absent module = no access to it.
   */
  permissions: PermissionString[];
  /** ISO timestamp of session start — displayed in the UI */
  sessionStartedAt: string;
}

// ─────────────────────────────────────────────────────────────
//  JWT PARSING
// ─────────────────────────────────────────────────────────────

/**
 * Parse a Keycloak access_token JWT into an AdminUser.
 *
 * Expected JWT claims
 *   sub                  → user ID
 *   name                 → full name
 *   email                → email
 *   realm_access.roles   → ['super_admin'] | ['admin', ...]
 *   admin_permissions    → PermissionString[]  (admin tokens only)
 *
 * Returns null when the token carries no admin role.
 * The caller is responsible for redirecting non-admins.
 */
export function parseAdminFromToken(token: string): AdminUser | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    const realmRoles: string[] = decoded?.realm_access?.roles ?? [];
    const superAdmin = realmRoles.includes('super_admin');
    const regularAdmin = realmRoles.includes('admin');

    if (!superAdmin && !regularAdmin) return null;

    const raw: string[] = decoded?.admin_permissions ?? [];
    const valid = raw.filter(isValidPermission) as PermissionString[];

    return {
      id:               decoded.sub ?? '',
      name:             decoded.name ?? decoded.preferred_username ?? 'Admin',
      email:            decoded.email ?? '',
      role:             superAdmin ? 'super_admin' : 'admin',
      permissions:      superAdmin ? [] : valid,
      sessionStartedAt: new Date((decoded.iat ?? 0) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

/** Runtime type-guard: is a raw string a valid PermissionString? */
function isValidPermission(p: string): p is PermissionString {
  const MODULES: PermissionModule[] = [
    'businesses', 'financers', 'developers', 'financial_data',
    'verifications', 'reports', 'system', 'audit_logs',
    'notifications', 'settings',
  ];
  const [mod, level] = p.split(':');
  return (
    MODULES.includes(mod as PermissionModule) &&
    (level === 'view' || level === 'manage')
  );
}

// ─────────────────────────────────────────────────────────────
//  PERMISSION HELPERS
// ─────────────────────────────────────────────────────────────

/** Is this user a super_admin? They bypass all permission checks. */
export function isSuperAdmin(user: AdminUser): boolean {
  return user.role === 'super_admin';
}

/**
 * Can the admin view (access) a module?
 * super_admin → always true
 * admin       → true if they hold :view OR :manage for the module
 */
export function canView(user: AdminUser, module: PermissionModule): boolean {
  if (user.role === 'super_admin') return true;
  // settings module: enforce super_admin-only policy
  if (module === 'settings' && SETTINGS_SUPER_ADMIN_ONLY) return false;
  return user.permissions.some(
    (p) => p === `${module}:view` || p === `${module}:manage`
  );
}

/**
 * Can the admin perform write / action operations on a module?
 * super_admin → always true
 * admin       → true only if they hold :manage for the module
 */
export function canManage(user: AdminUser, module: PermissionModule): boolean {
  if (user.role === 'super_admin') return true;
  if (module === 'settings' && SETTINGS_SUPER_ADMIN_ONLY) return false;
  return user.permissions.some((p) => p === `${module}:manage`);
}

/**
 * Returns every module the admin has at least view access to.
 * Used to build the dynamic sidebar and access-check pages.
 */
export function getAccessibleModules(user: AdminUser): PermissionModule[] {
  const ALL: PermissionModule[] = [
    'businesses', 'financers', 'developers', 'financial_data',
    'verifications', 'reports', 'system', 'audit_logs',
    'notifications', 'settings',
  ];
  return ALL.filter((m) => canView(user, m));
}

/**
 * Human-readable summary of the admin's scope.
 * Shown in the sidebar user strip and audit log entries.
 *
 * super_admin           → 'Full Access'
 * admin (3 modules)     → 'Businesses · Verifications · Reports'
 * admin (no modules)    → 'No module access'
 */
export function describeScope(user: AdminUser): string {
  if (user.role === 'super_admin') return 'Full Access';
  const modules = getAccessibleModules(user);
  if (modules.length === 0) return 'No module access';
  return modules.map((m) => MODULE_LABELS[m]).join(' · ');
}

/**
 * Returns the access level label for display in permission badges.
 * 'manage' → 'Full'   |   'view' → 'View only'   |   none → 'No access'
 */
export function accessLevelLabel(
  user: AdminUser,
  module: PermissionModule
): 'Full' | 'View only' | 'No access' {
  if (user.role === 'super_admin') return 'Full';
  if (canManage(user, module)) return 'Full';
  if (canView(user, module)) return 'View only';
  return 'No access';
}

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────

/** Human-readable labels for each module */
export const MODULE_LABELS: Record<PermissionModule, string> = {
  businesses:     'Businesses',
  financers:      'Financers',
  developers:     'Developers',
  financial_data: 'Financial Data',
  verifications:  'Verifications',
  reports:        'Reports',
  system:         'System',
  audit_logs:     'Audit Logs',
  notifications:  'Notifications',
  settings:       'Settings',
};

/**
 * Enforce that the settings module is always super_admin-only.
 * Even if an admin token carries 'settings:manage', this gate prevents access.
 * Set to false to allow explicit settings delegation.
 */
export const SETTINGS_SUPER_ADMIN_ONLY = true;

// ─────────────────────────────────────────────────────────────
//  MOCK SESSION  — replace with real Keycloak token fetch
// ─────────────────────────────────────────────────────────────

/**
 * Development mock — returns a super_admin user.
 *
 * To test a scoped admin, return EXAMPLE_SCOPED_ADMIN instead.
 *
 * In production this should read from:
 *   1. A Next.js server session (next-auth or iron-session)
 *   2. Or call Keycloak /userinfo with the access_token cookie
 *      and pass the result through parseAdminFromToken()
 */
export function getMockAdminUser(): AdminUser {
  return {
    id:               'usr_admin_001',
    name:             'Tunde Adeyemi',
    email:            'tunde@creditlinker.ng',
    role:             'super_admin',
    permissions:      [],    // ignored for super_admin
    sessionStartedAt: new Date().toISOString(),
  };
}

/**
 * Example scoped admin for testing restricted views.
 * Swap the return value in getMockAdminUser() to use this.
 */
export const EXAMPLE_SCOPED_ADMIN: AdminUser = {
  id:               'usr_admin_002',
  name:             'Chisom Eze',
  email:            'chisom@creditlinker.ng',
  role:             'admin',
  permissions:      [
    'businesses:manage',
    'verifications:manage',
    'reports:view',
    'financers:view',
  ],
  sessionStartedAt: new Date().toISOString(),
};
