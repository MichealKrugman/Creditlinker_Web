"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminUser, PermissionString } from "@/lib/admin-rbac";
import { isValidPermission } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  Build an AdminUser from a Supabase session
// ─────────────────────────────────────────────────────────────

function buildAdminUser(session: any): AdminUser | null {
  const user = session?.user;
  if (!user) return null;

  const role = user.app_metadata?.role;
  if (role !== "admin") return null;

  // admin_permissions stored in app_metadata (optional)
  const raw: string[] = user.app_metadata?.admin_permissions ?? [];
  const permissions = raw.filter(isValidPermission) as PermissionString[];

  // admin_role determines super_admin vs scoped admin
  const adminRole = user.app_metadata?.admin_role === "super_admin"
    ? "super_admin"
    : permissions.length === 0
      ? "super_admin"   // if no scoped permissions set, default to super_admin
      : "admin";

  return {
    id:               user.id,
    name:             user.user_metadata?.full_name ?? user.email ?? "Admin",
    email:            user.email ?? "",
    role:             adminRole,
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
