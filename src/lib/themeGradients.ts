export interface ThemeStyle {
  gradient: string;
  textColor: string;
  accentColor: string;
}

export const themeGradients: Record<string, ThemeStyle> = {
  // Historical Romance – muted rose + parchment beige
  historical: {
    gradient: "from-rose-300/80 via-amber-100/70 to-stone-200/60",
    textColor: "text-amber-900",
    accentColor: "text-rose-600"
  },
  
  // Modern/Contemporary – deep red + champagne gold
  contemporary: {
    gradient: "from-red-400/70 via-amber-300/60 to-yellow-200/50",
    textColor: "text-amber-950",
    accentColor: "text-red-600"
  },
  
  // Fantasy/Mystical – violet + midnight blue shimmer
  fantasy: {
    gradient: "from-violet-500/70 via-blue-500/60 to-indigo-600/70",
    textColor: "text-blue-50",
    accentColor: "text-violet-200"
  },
  
  // Mystical (existing moods)
  mystical: {
    gradient: "from-purple-400/70 via-blue-400/60 to-indigo-400/70",
    textColor: "text-blue-50",
    accentColor: "text-purple-200"
  },
  
  // Crime/Dark Romance – charcoal gray + ruby highlight
  crime: {
    gradient: "from-gray-800/90 via-red-900/80 to-gray-900/90",
    textColor: "text-gray-100",
    accentColor: "text-red-400"
  },
  
  // Royal/Billionaire – emerald + gold glow
  regal: {
    gradient: "from-emerald-600/70 via-yellow-500/60 to-amber-400/70",
    textColor: "text-emerald-50",
    accentColor: "text-yellow-200"
  },
  
  // Warm (existing moods - Cozy & Comforting)
  warm: {
    gradient: "from-warm-peach via-blush to-dusty-rose",
    textColor: "text-white",
    accentColor: "text-warm-peach"
  },
  
  // Hot (existing moods - Spicy & Steamy)
  hot: {
    gradient: "from-red-400 via-orange-400 to-yellow-400",
    textColor: "text-white",
    accentColor: "text-yellow-100"
  },
  
  // Default fallback
  default: {
    gradient: "from-blush via-dusty-rose to-warm-peach",
    textColor: "text-white",
    accentColor: "text-blush"
  }
};

export const getThemeStyle = (colorTheme: string | null): ThemeStyle => {
  return themeGradients[colorTheme || ""] || themeGradients.default;
};
