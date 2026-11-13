import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getPaddleClient, type PaddleEnv } from "../_shared/paddle.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims, error } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
  if (error || !claims?.claims?.sub) return json({ error: "Please sign in." }, 401);

  const body = await req.json().catch(() => ({}));
  const env: PaddleEnv = body?.environment === "live" ? "live" : "sandbox";

  const { data: sub } = await supabase.from("subscriptions")
    .select("paddle_subscription_id, paddle_customer_id")
    .eq("user_id", claims.claims.sub).eq("environment", env)
    .not("paddle_subscription_id", "like", "manual_%")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!sub) return json({ error: "No paid subscription to manage. Gifted plans can't be changed here." }, 404);

  try {
    const session = await getPaddleClient(env).customerPortalSessions.create(sub.paddle_customer_id, [sub.paddle_subscription_id]);
    return json({ url: session.urls.general.overview });
  } catch (e: any) {
    console.error("portal failed", e?.message ?? e);
    return json({ error: "Couldn't open the billing portal. Please try again." }, 502);
  }
});
