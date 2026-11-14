import type { SupabaseClient } from "@supabase/supabase-js";

// getSession waits for the client's automatic URL/session initialization first.
// Do not exchange an already-consumed PKCE code or bypass the managed broker.
export async function completeAuthCallback(auth: SupabaseClient["auth"], href: string): Promise<void> {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has("error") || hash.has("error")) {
    throw new Error("Google sign-in was not completed. Please try again.");
  }
  const { data, error } = await auth.getSession();
  if (error) throw new Error("Your sign-in link could not be verified. Please sign in again.");
  if (!data.session) {
    const code = url.searchParams.get("code");
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!code && !(accessToken && refreshToken)) {
      throw new Error("No sign-in session was received. Please sign in again.");
    }
    // Automatic URL hydration is preferred; explicitly handle an unprocessed
    // implicit return as well as PKCE without starting another OAuth flow.
    const exchanged = code
      ? await auth.exchangeCodeForSession(code)
      : await auth.setSession({ access_token: accessToken ?? "", refresh_token: refreshToken ?? "" });
    if (exchanged.error || !exchanged.data.session) {
      throw new Error("Your sign-in link has expired or belongs to another browser. Please sign in again.");
    }
  }
  const verified = await auth.getUser();
  if (verified.error || !verified.data.user) {
    throw new Error("Your sign-in session could not be verified. Please sign in again.");
  }
}