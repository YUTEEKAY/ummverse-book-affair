// @ts-ignore bun runner types
import { expect, test } from "bun:test";
import { PRICE, nextBillingDate, validatePayment } from "../../supabase/functions/_shared/flutterwaveRules";
test("Flutterwave monthly price is $5", () => expect(PRICE.monthly).toBe(5));
test("Flutterwave annual price is $60", () => expect(PRICE.annual).toBe(60));
test("successful payment must match reference amount currency and account", () => {
  const c = { tx_ref: "ref", user_id: "u", amount: 60 };
  const t = { tx_ref: "ref", status: "successful", amount: 60, currency: "USD", meta: { user_id: "u" } };
  expect(() => validatePayment(t, c)).not.toThrow();
  for (const change of [{ amount: 5 }, { currency: "NGN" }, { tx_ref: "another" }, { status: "failed" }, { meta: { user_id: "other" } }]) expect(() => validatePayment({ ...t, ...change }, c)).toThrow();
});
test("monthly period handles month-end and annual handles leap day", () => {
  expect(nextBillingDate("2026-01-31T12:00:00Z", "monthly")).toBe("2026-02-28T12:00:00.000Z");
  expect(nextBillingDate("2024-02-29T12:00:00Z", "annual")).toBe("2025-02-28T12:00:00.000Z");
});