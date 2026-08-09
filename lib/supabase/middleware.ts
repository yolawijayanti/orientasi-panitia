import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PANITIA_PREFIX = "/panitia";
const LEADER_PREFIX = "/leader";
const LOGIN_PATH = "/login";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
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

  // Wajib panggil getUser() (bukan getSession()) di sini supaya token
  // di-refresh oleh Supabase server-side sebelum request diteruskan.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPanitiaRoute = pathname.startsWith(PANITIA_PREFIX);
  const isLeaderRoute = pathname.startsWith(LEADER_PREFIX);
  const isLoginRoute = pathname === LOGIN_PATH;

  if (!user) {
    if (isPanitiaRoute || isLeaderRoute || pathname === "/") {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const homePath = profile?.role === "leader" ? `${LEADER_PREFIX}/dashboard` : `${PANITIA_PREFIX}/dashboard`;

  const boleh =
    (profile?.role === "leader" && !isPanitiaRoute) ||
    (profile?.role === "panitia" && !isLeaderRoute);

  if (isLoginRoute || pathname === "/" || !boleh) {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  return response;
}
