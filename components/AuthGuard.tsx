"use client";

/**
 * components/AuthGuard.tsx
 *
 * Wraps any protected layout. On mount it checks whether there is a valid
 * Supabase session. If not, it redirects to /login immediately.
 *
 * Optionally enforces a required account type — so a business user who
 * somehow lands on /financer/dashboard gets kicked back to their own dashboard.
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
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        // No session at all → go to login
        router.replace("/login");
        return;
      }

      if (requiredAccountType) {
        const actualType = data.session.user.user_metadata?.account_type as AccountType;
        if (actualType && actualType !== requiredAccountType) {
          // Logged in, but wrong account type → redirect to their real dashboard
          router.replace(getDashboardPath(actualType));
          return;
        }
      }

      setChecking(false);
    }

    checkSession();

    // Also listen for auth changes (e.g. token expiry) while the page is open
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, requiredAccountType]);

  // Show nothing while we verify — avoids a flash of protected content
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
