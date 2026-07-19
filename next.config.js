/** @type {import('next').NextConfig} */

// ─────────────────────────────────────────────────────────────────────────────
// CREDITLINKER — next.config.js
// ─────────────────────────────────────────────────────────────────────────────
// SEC-02: HTTP Security Headers
//
// Applied on every response via the headers() export. Headers are tuned to
// Creditlinker's actual surface:
//   - Portal UI  (creditlinker.com.ng)
//   - Live API   (api.creditlinker.com.ng)       → proxy.ts rewrites to Supabase
//   - Sandbox API(sandbox.api.creditlinker.com.ng)→ proxy.ts rewrites to Supabase
//   - Supabase project (gsillmzvcufuntriytjc.supabase.co) for auth + storage
//   - Mono (api.withmono.com) for bank-link iframes / redirects
//
// CHANGING THESE? Read each header's comment before editing. Overly tight CSP
// breaks the portal; overly loose CSP defeats the purpose.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_HOST   = "https://gsillmzvcufuntriytjc.supabase.co";
const SUPABASE_STORAGE = "https://gsillmzvcufuntriytjc.supabase.co/storage/v1";

const securityHeaders = [

  // ── Content-Security-Policy ────────────────────────────────────────────────
  // Restricts where the browser can load scripts, styles, images, and data
  // from. The most impactful header — prevents XSS from exfiltrating tokens
  // or hijacking the UI even if an attacker gets code execution.
  //
  // Directives explained:
  //   default-src 'self'          → block everything not explicitly allowed
  //   script-src  'self' 'unsafe-inline'  → Next.js requires inline scripts for
  //                                          hydration. Remove if/when RSC is
  //                                          fully adopted and inline scripts
  //                                          can be replaced with nonces.
  //   style-src   'self' 'unsafe-inline'  → Tailwind / CSS-in-JS needs this.
  //   img-src     'self' data: blob:      → avatar uploads come as blob: URLs;
  //               + Supabase storage      → KYC doc thumbnails served from there.
  //   font-src    'self'                  → all fonts are self-hosted.
  //   connect-src 'self'                  → fetch() and XHR:
  //               + Supabase              → auth, DB, functions, realtime
  //               + api.creditlinker.*    → live API (proxy)
  //               + sandbox.api.*         → sandbox API (proxy)
  //               + withmono.com          → bank-link SDK calls
  //   frame-src   'self'                  → Mono connect widget opens in an
  //               + withmono.com          → iframe for bank auth flow.
  //   object-src  'none'                  → no Flash / plugins ever.
  //   base-uri    'self'                  → prevents <base> tag injection.
  //   form-action 'self'                  → form POSTs only to same origin.
  //   upgrade-insecure-requests           → force HTTPS for all sub-resources.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${SUPABASE_STORAGE}`,
      "font-src 'self'",
      [
        "connect-src 'self'",
        SUPABASE_HOST,
        "https://api.creditlinker.com.ng",
        "https://sandbox.api.creditlinker.com.ng",
        "https://api.withmono.com",
        "wss://gsillmzvcufuntriytjc.supabase.co",   // Supabase Realtime WebSocket
      ].join(" "),
      "frame-src 'self' https://connect.withmono.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },

  // ── HTTP Strict Transport Security ────────────────────────────────────────
  // Forces HTTPS for 1 year. includeSubDomains covers api.* and sandbox.api.*
  // preload: submit to HSTS preload list once the platform is stable.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },

  // ── X-Frame-Options ───────────────────────────────────────────────────────
  // Prevents the portal from being embedded in an iframe on another site
  // (clickjacking). SAMEORIGIN allows our own portals to embed each other
  // if needed; DENY would be stricter but breaks any legitimate iframe use.
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },

  // ── X-Content-Type-Options ────────────────────────────────────────────────
  // Prevents the browser from MIME-sniffing a response away from the declared
  // Content-Type. Stops attacks where a PNG upload is sniffed as HTML/JS.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── Referrer-Policy ───────────────────────────────────────────────────────
  // strict-origin-when-cross-origin: sends full URL as Referer on same-origin
  // requests (useful for internal analytics), but only the origin on cross-
  // origin requests (hides paths and query strings from third parties like Mono).
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // ── Permissions-Policy ────────────────────────────────────────────────────
  // Disables browser features Creditlinker doesn't use. Reduces attack surface
  // if a financer or business embeds a third-party widget that tries to access
  // camera / microphone / geolocation without explicit user permission.
  // camera=() and microphone=() are blocked at policy level — re-enable
  // if KYC selfie capture is ever added directly in the portal.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },

  // ── X-DNS-Prefetch-Control ────────────────────────────────────────────────
  // Disables automatic DNS prefetching of hrefs in the page. Prevents leaking
  // which third-party domains the user is about to visit to DNS resolvers.
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },

];

const nextConfig = {
  transpilePackages: [
    "@supabase/supabase-js",
    "@supabase/auth-js",
    "@supabase/realtime-js",
    "@supabase/postgrest-js",
    "@supabase/storage-js",
    "@supabase/functions-js",
  ],

  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
