import { config, db, flw, handle, user } from "../_shared/flutterwave.ts";
Deno.serve(req => handle(req, async () => {
  const account = await user(req);
  const { subscription_id } = await req.json();
  if (typeof subscription_id !== "string" || !/^[0-9a-f-]{36}$/i.test(subscription_id)) throw new Error("Invalid subscription.");
  const { data: s, error } = await db().from("subscriptions").select("*").eq("id", subscription_id).eq("user_id", account.id).eq("provider", "flutterwave").maybeSingle();
  if (error || !s?.flutterwave_subscription_id) throw new Error("No recurring subscription to cancel.");
  if (s.environment !== config().environment) throw new Error("Payment environment mismatch.");
  if (s.cancel_at_period_end) return { canceled: true };
  await flw(`/subscriptions/${encodeURIComponent(s.flutterwave_subscription_id)}/cancel`, "PUT");
  const result = await db().from("subscriptions").update({ status: "canceled", cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq("id", s.id);
  if (result.error) throw result.error;
  return { canceled: true };
}));