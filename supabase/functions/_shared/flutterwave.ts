import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { nextBillingDate, validatePayment } from "./flutterwaveRules.ts";
export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
export function db() {
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Account storage is unavailable.");
  return createClient(url, key);
}
export async function user(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new Error("Please sign in.");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) throw new Error("Please sign in.");
  return data.user;
}
export function config() {
  const key = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) throw new Error("Payments are not configured yet. Please try again later.");
  return { key, environment: key.includes("TEST") ? "sandbox" : "live" };
}
export async function flw(path: string, method = "GET", body?: unknown) {
  const { key } = config();
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const result = await res.json();
  if (!res.ok || result.status !== "success") throw new Error(result.message || `Payment provider returned ${res.status}.`);
  return result.data;
}
export async function verifyTransaction(id: string, expectedUser?: string) {
  if (!/^\d+$/.test(id)) throw new Error("Invalid transaction.");
  const t = await flw(`/transactions/${encodeURIComponent(id)}/verify`);
  const store = db();
  let { data: checkout } = await store.from("flutterwave_checkouts").select("*").eq("tx_ref", t.tx_ref).maybeSingle();
  let subscription: any;
  if (!checkout) {
    // Recurring charges may have a new reference; match a verified subscription, never an email alone.
    const rows = await flw(`/subscriptions?transaction_id=${encodeURIComponent(id)}`);
    const remote = rows.find((r: any) => r.plan && r.customer?.customer_email === t.customer?.email);
    if (!remote) throw new Error("Payment is not linked to a known subscription.");
    const existing = await store.from("subscriptions").select("*").eq("flutterwave_subscription_id", String(remote.id)).maybeSingle();
    subscription = existing.data;
    if (!subscription) throw new Error("Unknown subscription.");
    checkout = { tx_ref: t.tx_ref, user_id: subscription.user_id, tier: subscription.price_id === "premium_yearly" ? "annual" : "monthly", amount: subscription.price_id === "premium_yearly" ? 60 : 5, plan_id: String(remote.plan), currency: "USD", environment: subscription.environment };
    validatePayment(t, checkout);
    const saved = await store.from("flutterwave_checkouts").upsert(checkout);
    if (saved.error) throw saved.error;
  }
  if (expectedUser && checkout.user_id !== expectedUser) throw new Error("This payment belongs to another account.");
  if (checkout.environment !== config().environment) throw new Error("Payment environment mismatch.");
  validatePayment(t, checkout);
  const rows = await flw(`/subscriptions?transaction_id=${encodeURIComponent(id)}`);
  const remote = rows.find((r: any) => String(r.plan) === String(checkout.plan_id) && r.customer?.customer_email === t.customer?.email && r.status === "active");
  if (!remote) throw new Error("Your recurring subscription is still being confirmed. Please retry shortly.");
  const paidAt = t.created_at;
  const next = remote.next_due_date || remote.next_billing_date || nextBillingDate(paidAt, checkout.tier);
  const { error } = await store.rpc("apply_flutterwave_payment", { _transaction_id: String(t.id), _tx_ref: checkout.tx_ref, _subscription_id: String(remote.id), _paid_at: paidAt, _next_billing_date: next });
  if (error) throw error;
  return { verified: true };
}
export async function handle(req: Request, run: () => Promise<unknown>) {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try { return json(await run()); } catch (e) {
    const error = e instanceof Error ? e.message : "Payment request failed.";
    return json({ error }, error === "Please sign in." ? 401 : 400);
  }
}