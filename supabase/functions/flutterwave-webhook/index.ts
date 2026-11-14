import { db, flw, json, config, verifyTransaction } from "../_shared/flutterwave.ts";
import { CURRENCY, linkTier, nextBillingDate } from "../_shared/flutterwaveRules.ts";
function equal(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);
async function findUserByEmail(email: string) {
  const clean = String(email ?? "").trim();
  if (!clean || !clean.includes("@")) return null;
  const { data, error } = await db().from("profiles").select("id").ilike("email", escapeLike(clean)).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0].id as string : null;
}
async function setProfileStatus(userId: string, status: string, subscriptionId?: string | null) {
  const update: Record<string, unknown> = { subscription_status: status, updated_at: new Date().toISOString() };
  if (subscriptionId !== undefined) update.subscription_id = subscriptionId;
  const { error } = await db().from("profiles").update(update).eq("id", userId);
  if (error) throw error;
}

// Hosted payment-link charges: re-verify with Flutterwave, then match the account by email.
async function applyLinkPayment(id: string) {
  if (!/^\d+$/.test(id)) throw new Error("Invalid transaction.");
  const store = db();
  const t = await flw(`/transactions/${encodeURIComponent(id)}/verify`);
  const { data: known } = await store.from("flutterwave_checkouts").select("tx_ref").eq("tx_ref", t.tx_ref).maybeSingle();
  if (known) return verifyTransaction(id);
  const tier = linkTier(t);
  if (!tier) return { ignored: "amount, currency or status not eligible" };
  const userId = await findUserByEmail(t.customer?.email);
  if (!userId) return { ignored: "no matching account" };
  let remote: any = null;
  try { remote = (await flw(`/subscriptions?transaction_id=${encodeURIComponent(id)}`))?.[0] ?? null; } catch { remote = null; }
  const subId = remote?.id ? String(remote.id) : `tx_${t.id}`;
  const { error: saveError } = await store.from("flutterwave_checkouts").upsert({
    tx_ref: t.tx_ref, user_id: userId, tier, amount: Number(t.amount), currency: CURRENCY,
    plan_id: String(remote?.plan ?? t.plan ?? "payment_link"), environment: config().environment,
  });
  if (saveError) throw saveError;
  const paidAt = t.created_at ?? new Date().toISOString();
  const next = remote?.next_due_date || nextBillingDate(paidAt, tier);
  const { error } = await store.rpc("apply_flutterwave_payment", { _transaction_id: String(t.id), _tx_ref: t.tx_ref, _subscription_id: subId, _paid_at: paidAt, _next_billing_date: next });
  if (error) throw error;
  await setProfileStatus(userId, tier === "annual" ? "active_annual" : "active_monthly", remote?.id ? String(remote.id) : undefined);
  return { applied: true };
}

async function cancel(data: any) {
  const store = db();
  const id = data?.id != null ? String(data.id) : "";
  let userId: string | null = null;
  if (/^\d+$/.test(id)) {
    const { data: local } = await store.from("subscriptions").select("user_id").eq("flutterwave_subscription_id", id).maybeSingle();
    userId = local?.user_id ?? null;
  }
  const email = data?.customer?.customer_email ?? data?.customer?.email;
  if (!userId) userId = await findUserByEmail(email);
  if (!userId) return { ignored: "no matching account" };
  // Confirm with Flutterwave so a forged payload cannot downgrade someone.
  const { data: account } = await store.auth.admin.getUserById(userId);
  const lookupEmail = account.user?.email;
  if (!lookupEmail) throw new Error("Unknown subscriber.");
  const rows = await flw(`/subscriptions?email=${encodeURIComponent(lookupEmail)}`);
  const stillActive = (rows ?? []).some((s: any) => s.status === "active");
  if (stillActive && (!id || (rows ?? []).find((s: any) => String(s.id) === id)?.status !== "cancelled")) throw new Error("Cancellation is not confirmed by Flutterwave.");
  const now = new Date().toISOString();
  const { error } = await store.from("subscriptions").update({ status: "canceled", cancel_at_period_end: false, current_period_end: now, updated_at: now })
    .eq("user_id", userId).eq("provider", "flutterwave").in("status", ["active", "active_monthly", "active_annual"]);
  if (error) throw error;
  await setProfileStatus(userId, "free");
  return { canceled: true };
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const hash = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");
  if (!hash || !equal(req.headers.get("verif-hash") ?? "", hash)) return json({ error: "Invalid webhook signature" }, 401);
  try {
    const event = await req.json();
    const type = event.event ?? event["event.type"];
    if (type === "charge.completed" || type === "CARD_TRANSACTION") {
      if (event.data?.status === "successful") await applyLinkPayment(String(event.data.id));
    } else if (["subscription.cancelled", "subscription.canceled"].includes(type)) {
      await cancel(event.data);
    }
    return json({ received: true });
  } catch (e) {
    console.error("flutterwave-webhook", e instanceof Error ? e.message : e);
    return json({ error: "Payment confirmation failed; retry delivery." }, 500);
  }
});
