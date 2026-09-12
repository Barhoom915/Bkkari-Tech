import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") || "/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account";
  const referralCode = requestUrl.searchParams.get("ref") || "";

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store, max-age=0");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error:", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("تعذر تثبيت جلسة تسجيل الدخول")}`, requestUrl.origin));
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user && referralCode && !user.user_metadata?.referral_code) {
      await supabase.auth.updateUser({ data: { referral_code: referralCode } });
    }
    if (user && !user.user_metadata?.terms_accepted_at) {
      return NextResponse.redirect(new URL(`/terms?accept=1&next=${encodeURIComponent(next)}`, requestUrl.origin));
    }
  }

  return response;
}
