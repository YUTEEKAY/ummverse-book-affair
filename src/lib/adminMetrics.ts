export const MONTHLY_PRICE_USD = 5;
export const ANNUAL_PRICE_USD = 70;

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  trials_used: number;
  price_id: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  is_manual: boolean | null;
};

export type Tier = "free" | "monthly" | "annual";
export type DisplayStatus = "Active" | "Trialing" | "Canceled" | "Expired" | "—";

export function isActive(row: AdminUserRow, now = new Date()): boolean {
  if (!row.status) return false;
  const end = row.current_period_end ? new Date(row.current_period_end) : null;
  if (["active", "trialing"].includes(row.status)) return !end || end > now;
  if (row.status === "canceled") return !!end && end > now;
  return false;
}

export function tierOf(row: AdminUserRow, now = new Date()): Tier {
  if (!isActive(row, now)) return "free";
  return row.price_id === "premium_yearly" ? "annual" : "monthly";
}

export function statusOf(row: AdminUserRow, now = new Date()): DisplayStatus {
  if (!row.status) return "—";
  if (!isActive(row, now)) return "Expired";
  if (row.status === "trialing") return "Trialing";
  if (row.status === "canceled" || row.cancel_at_period_end) return "Canceled";
  return "Active";
}

export function computeKpis(rows: AdminUserRow[], now = new Date()) {
  let monthly = 0, annual = 0;
  const trials = { 0: 0, 1: 0, 2: 0 } as Record<0 | 1 | 2, number>;
  for (const r of rows) {
    const t = tierOf(r, now);
    if (t === "monthly") monthly++;
    else if (t === "annual") annual++;
    else trials[Math.min(2, Math.max(0, r.trials_used)) as 0 | 1 | 2]++;
  }
  const mrr = monthly * MONTHLY_PRICE_USD + (annual * ANNUAL_PRICE_USD) / 12;
  return { totalUsers: rows.length, monthly, annual, paid: monthly + annual, mrr, trials };
}
