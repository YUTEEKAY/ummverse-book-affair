import { db, flw, json, verifyTransaction } from "../_shared/flutterwave.ts";
function equal(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const hash = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");
  if (!hash || !equal(req.headers.get("verif-hash") ?? "", hash)) return json({ error: "Invalid webhook signature" }, 401);
  try {
    const event = await req.json();
    if (event.event === "charge.completed") {
      if (event.data?.status === "successful") await verifyTransaction(String(event.data.id));
    } else if (["subscription.cancelled", "subscription.canceled"].includes(event.event)) {
      const id = String(event.data?.id);
      if (!/^\d+$/.test(id)) throw new Error("Invalid subscription.");
      const store = db();
      const { data: local, error: readError } = await store.from("subscriptions").select("user_id,price_id").eq("flutterwave_subscription_id", id).eq("provider", "flutterwave").maybeSingle();
      if (readError) throw readError;
      if (!local) return json({ received: true });
      const { data: account } = await store.auth.admin.getUserById(local.user_id);
      if (!account.user?.email) throw new Error("Unknown subscriber.");
      let remote: any;
      for (let page = 1; page <= 100; page++) {
        const rows = await flw(`/subscriptions?email=${encodeURIComponent(account.user.email)}&page=${page}`);
        remote = rows.find((s: any) => String(s.id) === id);
        if (remote || !rows.length) break;
      }
      if (!remote || remote.status !== "cancelled") throw new Error("Cancellation is not confirmed by Flutterwave.");
      const { error } = await db().from("subscriptions").update({ status: "canceled", cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq("flutterwave_subscription_id", id).eq("provider", "flutterwave");
      if (error) throw error;
    }
    return json({ received: true });
  } catch { return json({ error: "Payment confirmation failed; retry delivery." }, 500); }
});