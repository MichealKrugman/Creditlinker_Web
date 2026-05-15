"use client";
/**
 * (developer-auth) layout
 * Minimal — no AuthGuard, no sidebar.
 * Covers: /developers/login  /developers/register
 * PlatformSettingsProvider is included so the login/register pages can
 * display the live platform name and support email from the admin config.
 */
import { PlatformSettingsProvider } from "@/lib/platform-settings-context";

export default function DeveloperAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformSettingsProvider>
      <div style={{ minHeight: "100vh", background: "#fff" }}>
        {children}
      </div>
    </PlatformSettingsProvider>
  );
}
