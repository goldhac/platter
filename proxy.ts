import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next 16 renamed Middleware → Proxy (same functionality). Scoped to /admin so the
// public menu stays fast and isn't slowed by an auth round-trip.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
