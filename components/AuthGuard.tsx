"use client";

/**
 * components/AuthGuard.tsx
 *
 * Wraps any protected layout. On mount it:
 *   1. Calls /api/auth/session (server-side token validation via Supabase admin client)
 *      rather than trusting the localStorage-cached session directly.
 *   2. If the server confirms the session is valid, checks account_type against
 *      requiredAccountType and redirects cross-portal users to their own dashboard.
 *   3. If the server returns 401/403 or the fetch fails, redirects to /login.
 *
 * SEC-01 hardening (A): replaced getSession() — which trusted localStorage blindly —
 *   with server-side validation so a crafted localStorage entry cannot bypass the guard.
 * SEC-01 hardening (B): validation is performed by /api/auth/session, which calls
 *   supabase.auth.getUser(token) on the server using the service role key, re-validating
 *   the JWT signature + expiry against Supabase's auth server on every page load.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDashboardPath, type AccountType } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * If provided, the guard also checks that the logged-in user's account_type
   * matches this value. Mismatch → redirect to the correct dashboard.
   */
  requiredAccountType?: AccountType;
}

export default function AuthGuard({ children, requiredAccountType }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        // Get the raw JWT from localStorage so we can send it to the server for
        // validation. We still use getSession() here — but ONLY to retrieve the
        // token string, not to trust its contents. Actual validation happens
        // server-side in /api/auth/session via supabase.auth.getUser(token).
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          if (!mounted) return;
          router.replace(requiredAccountType === "developer" ? "/developers/login" : "/login");
          return;
        }

        // Server-side validation — the route handler calls getUser(token), which
        // re-validates the JWT against Supabase's auth server. A crafted or expired
        // token will be rejected here even if it looks valid in localStorage.
        const res = await fetch("/api/auth/session", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // No-store: we want a fresh server check every time, not a cached response.
          cache: "no-store",
        });

        if (!mounted) return;

        if (!res.ok) {
          // 401 = token invalid/expired, 403 = token valid but account_type mismatch
          // handled below, 500 = server error — all result in redirect to login.
          router.replace(requiredAccountType === "developer" ? "/developers/login" : "/login");
          return;
        }

        const { accountType } = await res.json() as { accountType: AccountType };

        // Cross-portal check: send the user to their own dashboard if they've
        // somehow landed on the wrong portal.
        if (requiredAccountType && accountType !== requiredAccountType) {
          router.replace(getDashboardPath(accountType));
          return;
        }

        setChecking(false);
      } catch (err) {
        // Network error hitting /api/auth/session — fail closed (redirect to login).
        console.error("[AuthGuard] session validation failed:", err);
        if (mounted) {
          router.replace(requiredAccountType === "developer" ? "/developers/login" : "/login");
        }
      }
    }

    checkSession();

    // Listen for auth state changes while the page is open (e.g. token expiry,
    // sign-out from another tab).
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(requiredAccountType === "developer" ? "/developers/login" : "/login");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, requiredAccountType]);

  // Render nothing while validating — prevents any flash of protected content.
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F7FA",
      }}>
        <div style={{
          width: 32, height: 32,
          border: "3px solid #E5E7EB",
          borderTopColor: "#0A2540",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
