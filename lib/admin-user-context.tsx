"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminUser, AdminRole, PermissionString } from "@/lib/admin-rbac";
import { isValidPermission } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  Build an AdminUser from a Supabase session
// ─────────────────────────────────────────────────────────────

function buildAdminUser(session: any): AdminUser | null {
  const user = session?.user;
  if (!user) return null;

  const baseRole = user.app_metadata?.role;
  if (baseRole !== "admin") return null;

  // Permissions stored in app_metadata.permissions (set by invite-admin-user)
  const raw: string[] = user.app_metadata?.permissions ?? [];
  const permissions = raw.filter(isValidPermission) as PermissionString[];

  // admin_role is the RBAC tier written by invite-admin-user.
  // Default to super_admin when no tier is set (existing accounts).
  const validRoles = ["super_admin", "operations_admin", "risk_admin", "viewer"];
  const adminRole  = validRoles.includes(user.app_metadata?.admin_role)
    ? user.app_metadata.admin_role
    : "super_admin";

  return {
    id:               user.id,
    name:             user.user_metadata?.full_name ?? user.email ?? "Admin",
    email:            user.email ?? "",
    role:             adminRole as AdminRole,
    permissions,
    sessionStartedAt: session.created_at ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────────────────────

interface AdminUserContextValue {
  adminUser: AdminUser | null;
  loading: boolean;
}

const AdminUserContext = createContext<AdminUserContextValue>({
  adminUser: null,
  loading: true,
});

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminUser(buildAdminUser(session));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminUser(buildAdminUser(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AdminUserContext.Provider value={{ adminUser, loading }}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser() {
  return useContext(AdminUserContext);
}
