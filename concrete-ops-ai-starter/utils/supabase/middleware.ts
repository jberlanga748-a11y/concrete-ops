import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProfileNotReadyRedirectPath, resolveAppUser } from "@/lib/auth/app-user";
import { adminRoles, getRoleHomePath } from "@/lib/auth/roles";
import { getEnv } from "@/lib/env";

const ADMIN_ROLES = new Set(adminRoles);
const OFFICE_ONLY_PREFIXES = [
  "/dashboard/settings",
  "/dashboard/employees",
  "/dashboard/customers",
  "/dashboard/estimates",
  "/dashboard/proposals",
  "/dashboard/approvals",
  "/dashboard/notifications",
  "/dashboard/audit-logs",
];

function isOfficeOnlyPath(pathname: string) {
  return OFFICE_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getEnv();

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isEmployeeRoute = pathname.startsWith("/employee");

  // If not logged in, protect dashboard + employee routes
  if (!user && (isDashboardRoute || isEmployeeRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { appUser, error: appUserError } = await resolveAppUser(supabase, user);

    if (appUserError) {
      return response;
    }

    if (!appUser) {
      if (isAuthRoute) {
        return response;
      }

      if (isDashboardRoute || isEmployeeRoute) {
        return NextResponse.redirect(new URL(getProfileNotReadyRedirectPath(pathname), request.url));
      }

      return response;
    }

    const { role } = appUser;
    const isAdmin = ADMIN_ROLES.has(role);

    // Foreman landing: send dashboard root to foreman home
    if (role === "foreman" && pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/foreman";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // If logged in and trying to access auth pages, send to correct home
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(role);
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Employees can't access dashboard
    if (!isAdmin && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/employee";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Admin roles can't access employee portal
    if (isAdmin && isEmployeeRoute) {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(role);
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (role === "foreman" && isOfficeOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/foreman";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
