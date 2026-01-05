import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/create-profile";

  if (code) {
    console.log(`[Auth Callback] Processing code exchange. Next path: ${next}`);
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Exchange Error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (!error) {
      console.log("[Auth Callback] Session exchange successful.");
      // Get user after successful auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[Auth Callback] Get User Error:", userError);
      }

      if (user) {
        console.log(`[Auth Callback] User found: ${user.id} (${user.email})`);

        // Check if profile exists and is complete
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(
            "[Auth Callback] Profile Fetch Error (might be new user):",
            profileError
          );
        }

        // If no profile or incomplete username, redirect to profile creation
        if (!profile || !profile.username) {
          console.log(
            "[Auth Callback] Profile incomplete or missing, redirecting to create-profile."
          );
          return NextResponse.redirect(`${origin}/create-profile`);
        }

        console.log("[Auth Callback] Profile found, redirecting to", next);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/login?error=Could not verify email code`
  );
}
