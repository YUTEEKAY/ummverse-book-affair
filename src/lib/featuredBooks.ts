export const FEATURED_SLOTS = [1, 2, 3] as const;

export function featuredSlot(value: string): number | null {
  const slot = Number(value);
  return FEATURED_SLOTS.some(position => position === slot) ? slot : null;
}