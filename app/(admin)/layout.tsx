"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopNav } from "@/components/layout/AdminTopNav";
import { AdminUserProvider } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [checking, setChecking] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    // getUser() validates the JWT against the Supabase auth server on every
    // call — it never trusts a locally cached session. A forged or revoked
    // token will fail here regardless of what is stored in the browser.
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      const role = user?.app_metadata?.role;
      if (error || !user || role !== "admin") {
        router.replace("/admin/login");
      } else {
        setChecking(false);
      }
    });
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#F5F7FA",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #E5E7EB", borderTopColor: "#0A2540",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 12px",
          }} />
          <p style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "var(--font-body)" }}>
            Checking access…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AdminUserProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F5F7FA" }}>
        <AdminSidebar />
        <div style={{
          flex: 1, marginLeft: 240,
          display: "flex", flexDirection: "column",
          minHeight: "100vh", minWidth: 0,
        }}>
          <AdminTopNav />
          <main style={{
            flex: 1, padding: "28px 28px",
            maxWidth: 1280, width: "100%",
          }}>
            {children}
          </main>
        </div>
      </div>
    </AdminUserProvider>
  );
}
