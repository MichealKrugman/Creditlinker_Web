import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTIONS_URL = "https://gsillmzvcufuntriytjc.supabase.co/functions/v1";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Proxy api.creditlinker.com.ng → Supabase edge functions
  if (host.startsWith("api.")) {
    const { pathname, search } = request.nextUrl;

    const target = `${SUPABASE_FUNCTIONS_URL}${pathname}${search}`;

    // Forward the request with all original headers preserved
    return NextResponse.rewrite(new URL(target), {
      request: {
        headers: request.headers,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths — the host check inside handles filtering
    "/(.*)",
  ],
};
