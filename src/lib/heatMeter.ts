export function heatRating(level?: string | null) {
  if (!level) return 0;
  const numeric = Number(level.match(/^[1-5](?=\D|$)/)?.[0]);
  if (numeric) return numeric;
  return ({ sweet: 1, warm: 2, hot: 4, scorching: 5 } as Record<string, number>)[level.toLowerCase()] ?? 0;
}