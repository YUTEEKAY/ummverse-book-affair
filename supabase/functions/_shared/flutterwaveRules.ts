export type Tier = "monthly" | "annual";
export const PRICE = { monthly: 5, annual: 60 };
export function nextBillingDate(date: string, tier: Tier): string {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + (tier === "annual" ? 12 : 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString();
}
export function validatePayment(t: any, c: any) {
  if (t.status !== "successful" || t.currency !== "USD" || Number(t.amount) !== Number(c.amount) || t.tx_ref !== c.tx_ref || (t.meta?.user_id && t.meta.user_id !== c.user_id)) {
    throw new Error("Payment amount, currency, reference or account does not match.");
  }
}