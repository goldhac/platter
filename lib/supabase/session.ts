import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refreshes the Supabase session cookie and does an optimistic auth redirect for
 * /admin. Called from proxy.ts (Next 16's renamed middleware). Per the Next docs,
 * this is an optimistic check only — the real authorization (staff role + tenant)
 * happens in the admin layout and is enforced by RLS (security.md §2).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: refresh the session; do not run code between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Logged-out entry points: sign in, and self-serve sign up.
  const isPublicAdmin = path === "/admin/login" || path === "/admin/signup";
  if (path.startsWith("/admin") && !isPublicAdmin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  // Already signed in and hitting a logged-out page → send to the dashboard.
  if (isPublicAdmin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
