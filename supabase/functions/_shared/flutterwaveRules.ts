export type Tier = "monthly" | "annual";
export const CURRENCY = "NGN";
export const PRICE = { monthly: 8000, annual: 80000 };
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
  if (t.status !== "successful" || t.currency !== CURRENCY || Number(t.amount) !== Number(c.amount) || t.tx_ref !== c.tx_ref || (t.meta?.user_id && t.meta.user_id !== c.user_id)) {
    throw new Error("Payment amount, currency, reference or account does not match.");
  }
}// Hosted payment links: ₦80,000+ unlocks annual, ₦8,000+ monthly; anything else is ignored.
export function linkTier(t: any): Tier | null {
  const amount = Number(t?.amount);
  if (t?.status !== "successful" || t?.currency !== CURRENCY || !Number.isFinite(amount)) return null;
  if (amount >= PRICE.annual) return "annual";
  if (amount >= PRICE.monthly) return "monthly";
  return null;
}
