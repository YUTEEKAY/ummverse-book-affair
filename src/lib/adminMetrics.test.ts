// @ts-ignore
import { describe, expect, test } from "bun:test";
import { computeKpis, statusOf, tierOf, type AdminUserRow } from "./adminMetrics";

const now = new Date("2026-11-13T00:00:00Z");
const base: AdminUserRow = { id: "x", email: "a@b.c", full_name: null, created_at: "2026-01-01", trials_used: 0, price_id: null, status: null, current_period_end: null, cancel_at_period_end: false, is_manual: false };

describe("admin metrics", () => {
  test("Flutterwave monthly and annual statuses grant access only through their paid period", () => {
    expect(tierOf({ ...base, status: "active_monthly", price_id: "premium_monthly", current_period_end: "2026-12-01" }, now)).toBe("monthly");
    expect(tierOf({ ...base, status: "active_annual", price_id: "premium_yearly", current_period_end: "2026-12-01" }, now)).toBe("annual");
    expect(tierOf({ ...base, status: "active_annual", price_id: "premium_yearly", current_period_end: "2026-10-01" }, now)).toBe("free");
  });
  test("MRR counts monthly at $5 and annual at $60/12", () => {
    const rows = [
      { ...base, status: "active", price_id: "premium_monthly", current_period_end: "2026-12-01" },
      { ...base, status: "active", price_id: "premium_yearly", current_period_end: "2027-06-01" },
    ];
    const k = computeKpis(rows, now);
    expect(k.monthly).toBe(1);
    expect(k.annual).toBe(1);
    expect(k.mrr).toBeCloseTo(5 + 60 / 12);
  });
  test("expired subscription counts as free trial user", () => {
    const r = { ...base, trials_used: 2, status: "active", price_id: "premium_monthly", current_period_end: "2026-10-01" };
    expect(tierOf(r, now)).toBe("free");
    expect(statusOf(r, now)).toBe("Expired");
    expect(computeKpis([r], now).trials[2]).toBe(1);
  });
  test("canceled keeps access until period end", () => {
    const r = { ...base, status: "canceled", price_id: "premium_yearly", current_period_end: "2027-01-01" };
    expect(tierOf(r, now)).toBe("annual");
    expect(statusOf(r, now)).toBe("Canceled");
  });
});
