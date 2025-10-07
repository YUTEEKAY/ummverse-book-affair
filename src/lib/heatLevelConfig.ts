import { Flower2, Sparkles, Flame, Heart } from "lucide-react";

export type HeatLevel = "sweet" | "warm" | "hot" | "scorching";

export interface HeatLevelConfig {
  value: HeatLevel;
  label: string;
  icon: typeof Flower2;
  emoji: string;
  gradient: string;
  textColor: string;
  glowColor: string;
  tooltip: string;
  bgGlow: string;
}

export const heatLevelConfig: Record<HeatLevel, HeatLevelConfig> = {
  sweet: {
    value: "sweet",
    label: "Sweet / Clean",
    icon: Flower2,
    emoji: "🌸",
    gradient: "from-pink-100 via-rose-50 to-white",
    textColor: "text-pink-700",
    glowColor: "shadow-[0_0_20px_rgba(244,114,182,0.3)]",
    tooltip: "Sweet like first love.",
    bgGlow: "radial-gradient(circle at 50% 50%, rgba(244,114,182,0.08) 0%, transparent 70%)",
  },
  warm: {
    value: "warm",
    label: "Warm / Flirty",
    icon: Sparkles,
    emoji: "💞",
    gradient: "from-orange-100 via-amber-50 to-yellow-50",
    textColor: "text-orange-600",
    glowColor: "shadow-[0_0_20px_rgba(251,146,60,0.4)]",
    tooltip: "Warm and teasing.",
    bgGlow: "radial-gradient(circle at 50% 50%, rgba(251,146,60,0.12) 0%, transparent 70%)",
  },
  hot: {
    value: "hot",
    label: "Hot / Steamy",
    icon: Flame,
    emoji: "🔥",
    gradient: "from-red-500 via-orange-400 to-yellow-300",
    textColor: "text-white",
    glowColor: "shadow-[0_0_25px_rgba(239,68,68,0.5)]",
    tooltip: "Hot with tension.",
    bgGlow: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)",
  },
  scorching: {
    value: "scorching",
    label: "Scorching / Explicit",
    icon: Heart,
    emoji: "💋",
    gradient: "from-red-900 via-red-700 to-red-500",
    textColor: "text-white",
    glowColor: "shadow-[0_0_30px_rgba(127,29,29,0.6)]",
    tooltip: "Scorching and unapologetic.",
    bgGlow: "radial-gradient(circle at 50% 50%, rgba(127,29,29,0.18) 0%, transparent 70%)",
  },
};

export const getHeatLevelConfig = (level: string | null | undefined): HeatLevelConfig | null => {
  if (!level) return null;
  return heatLevelConfig[level as HeatLevel] || null;
};
