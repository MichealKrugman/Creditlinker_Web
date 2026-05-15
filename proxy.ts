import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTIONS_URL = "https://gsillmzvcufuntriytjc.supabase.co/functions/v1";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.startsWith("api.")) {
    const { pathname, search } = request.nextUrl;
    const target = `${SUPABASE_FUNCTIONS_URL}${pathname}${search}`;
    return NextResponse.rewrite(new URL(target), {
      request: { headers: request.headers },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)" ],
};
