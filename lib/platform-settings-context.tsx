"use client";

/**
 * lib/platform-settings-context.tsx
 *
 * Reads a handful of keys from the platform_settings table that the admin
 * controls, and makes them available everywhere in the developer portal via
 * usePlatformSettings().
 *
 * Keys consumed:
 *   api_base_url      — e.g. "https://api.creditlinker.com.ng"
 *   platform_name     — e.g. "Creditlinker"
 *   support_email     — e.g. "support@creditlinker.com.ng"
 *   api_version       — e.g. "v1"
 *   developer_region  — e.g. "West Africa (Lagos)"
 *   maintenance_mode  — boolean
 *
 * If a key is missing the fallback value is used, so the UI never breaks.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────────
   TYPES + DEFAULTS
───────────────────────────────────────────────────────── */
export interface PlatformSettings {
  apiBaseUrl:       string;
  platformName:     string;
  supportEmail:     string;
  apiVersion:       string;
  developerRegion:  string;
  maintenanceMode:  boolean;
}

const FALLBACKS: PlatformSettings = {
  apiBaseUrl:      "https://api.creditlinker.com.ng",
  platformName:    "Creditlinker",
  supportEmail:    "support@creditlinker.com.ng",
  apiVersion:      "v1",
  developerRegion: "West Africa (Lagos)",
  maintenanceMode: false,
};

interface PlatformSettingsContextValue {
  settings: PlatformSettings;
  loading:  boolean;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextValue>({
  settings: FALLBACKS,
  loading:  true,
});

/* ─────────────────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────────────────── */
export function PlatformSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(FALLBACKS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", [
            "api_base_url",
            "platform_name",
            "support_email",
            "api_version",
            "developer_region",
            "maintenance_mode",
          ]);

        if (error || !data) return;

        const map: Record<string, unknown> = {};
        for (const row of data) map[row.key] = row.value;

        // platform_settings.value is now text — values are plain strings
        function str(key: string, fallback: string): string {
          const v = map[key];
          if (v === null || v === undefined) return fallback;
          return (typeof v === "string" ? v : String(v)) || fallback;
        }

        function bool(key: string, fallback: boolean): boolean {
          const v = map[key];
          if (v === null || v === undefined) return fallback;
          if (typeof v === "boolean") return v;
          if (v === "true" || v === true) return true;
          if (v === "false" || v === false) return false;
          return fallback;
        }

        setSettings({
          apiBaseUrl:      str("api_base_url",      FALLBACKS.apiBaseUrl),
          platformName:    str("platform_name",     FALLBACKS.platformName),
          supportEmail:    str("support_email",     FALLBACKS.supportEmail),
          apiVersion:      str("api_version",       FALLBACKS.apiVersion),
          developerRegion: str("developer_region",  FALLBACKS.developerRegion),
          maintenanceMode: bool("maintenance_mode", false),
        });
      } catch (e) {
        // Silently fall back — FALLBACKS are already set as initial state
        console.warn("[platform-settings] fetch failed, using fallbacks", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────── */
export function usePlatformSettings(): PlatformSettingsContextValue {
  return useContext(PlatformSettingsContext);
}
