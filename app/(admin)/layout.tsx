"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopNav } from "@/components/layout/AdminTopNav";
import { AdminUserProvider } from "@/lib/admin-user-context";
import { supabase } from "@/lib/supabase";
import { getPlatformSettings } from "@/lib/platform-settings-cache";

const DEFAULT_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 30_000; // check every 30 seconds

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [checking, setChecking] = useState(!isLoginPage);

  // SEC-10: idle session timeout
  const lastActivityRef   = useRef<number>(Date.now());
  const timeoutMinutesRef = useRef<number>(DEFAULT_TIMEOUT_MINUTES);

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
        // SCALE-06: shared platform_settings cache — avoids a second direct
        // query when the settings page also reads this table within the
        // same session.
        getPlatformSettings()
          .then((s) => {
            const parsed = Number(s.session_timeout_minutes);
            if (Number.isFinite(parsed) && parsed > 0) {
              timeoutMinutesRef.current = parsed;
            }
          })
          .catch(() => { /* keep DEFAULT_TIMEOUT_MINUTES on failure */ });
      }
    });
  }, [isLoginPage, router]);

  // Activity listeners — reset the idle clock on any user interaction.
  useEffect(() => {
    if (isLoginPage) return;
    const resetActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown",   resetActivity);
    window.addEventListener("click",     resetActivity);
    window.addEventListener("scroll",    resetActivity);
    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown",   resetActivity);
      window.removeEventListener("click",     resetActivity);
      window.removeEventListener("scroll",    resetActivity);
    };
  }, [isLoginPage]);

  // Idle timeout check — runs every CHECK_INTERVAL_MS.
  useEffect(() => {
    if (isLoginPage) return;
    const timer = setInterval(async () => {
      const idleMs      = Date.now() - lastActivityRef.current;
      const timeoutMs   = timeoutMinutesRef.current * 60_000;
      if (idleMs >= timeoutMs) {
        await supabase.auth.signOut();
        router.replace("/admin/login?reason=timeout");
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
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
