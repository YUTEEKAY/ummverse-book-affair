export const FREE_TRIALS = 2;
const KEY = "ummverse_free_uses";

export function getDeviceUses(): number {
  const n = Number(localStorage.getItem(KEY) ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
export function setDeviceUses(n: number) {
  localStorage.setItem(KEY, String(n));
}

/** Pure rule: may a non-subscriber with `used` tries take another? */
export function canUseFreeTrial(used: number): boolean {
  return used < FREE_TRIALS;
}
