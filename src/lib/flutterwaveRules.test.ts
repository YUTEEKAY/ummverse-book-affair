// @ts-ignore bun runner types
import { expect, test } from "bun:test";
import { CURRENCY, PRICE, linkTier, nextBillingDate, validatePayment } from "../../supabase/functions/_shared/flutterwaveRules";
import { PAYMENT_LINKS } from "./paymentLinks";
test("payment currency is Nigerian naira", () => expect(CURRENCY).toBe("NGN"));
test("Flutterwave monthly price is ₦8,000", () => expect(PRICE.monthly).toBe(8000));
test("Flutterwave annual price is ₦80,000", () => expect(PRICE.annual).toBe(80000));
test("successful payment must match reference amount currency and account", () => {
  const c = { tx_ref: "ref", user_id: "u", amount: 80000 };
  const t = { tx_ref: "ref", status: "successful", amount: 80000, currency: "NGN", meta: { user_id: "u" } };
  expect(() => validatePayment(t, c)).not.toThrow();
  for (const change of [{ amount: 8000 }, { currency: "USD" }, { tx_ref: "another" }, { status: "failed" }, { meta: { user_id: "other" } }]) expect(() => validatePayment({ ...t, ...change }, c)).toThrow();
});
test("monthly period handles month-end and annual handles leap day", () => {
  expect(nextBillingDate("2026-01-31T12:00:00Z", "monthly")).toBe("2026-02-28T12:00:00.000Z");
  expect(nextBillingDate("2024-02-29T12:00:00Z", "annual")).toBe("2025-02-28T12:00:00.000Z");
});
test("₦80,000 link payment unlocks annual", () => expect(linkTier({ status: "successful", currency: "NGN", amount: 80000 })).toBe("annual"));
test("₦8,000 link payment unlocks monthly", () => expect(linkTier({ status: "successful", currency: "NGN", amount: 8000 })).toBe("monthly"));
test("under-₦8,000 link payment unlocks nothing", () => expect(linkTier({ status: "successful", currency: "NGN", amount: 1000 })).toBeNull());
test("old US dollar payments unlock nothing", () => expect(linkTier({ status: "successful", currency: "USD", amount: 60 })).toBeNull());
test("monthly button uses lo5a1h8arwlu link", () => expect(PAYMENT_LINKS.monthly).toBe("https://flutterwave.com/pay/lo5a1h8arwlu"));
test("annual button uses tw608nmdxat0 link", () => expect(PAYMENT_LINKS.annual).toBe("https://flutterwave.com/pay/tw608nmdxat0"));
