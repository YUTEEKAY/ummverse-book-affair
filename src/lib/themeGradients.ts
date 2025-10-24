export interface ThemeStyle {
  gradient: string;
  textColor: string;
  accentColor: string;
}

export const themeGradients: Record<string, ThemeStyle> = {
  // Dark Romance – burgundy tones
  'dark romance': {
    gradient: "from-burgundy via-red-900/80 to-gray-900/90",
    textColor: "text-white",
    accentColor: "text-red-200"
  },
  
  // Fantasy Romance – lavender and mystical
  'fantasy romance': {
    gradient: "from-lavender via-purple-400/70 to-indigo-500/70",
    textColor: "text-white",
    accentColor: "text-purple-100"
  },
  
  // Contemporary Romance – pastel blue
  'contemporary romance': {
    gradient: "from-pastel-blue via-blue-300/60 to-cyan-200/50",
    textColor: "text-white",
    accentColor: "text-blue-100"
  },
  
  // Historical Romance – vintage gold + parchment
  'historical romance': {
    gradient: "from-vintage-gold via-amber-200/70 to-stone-200/60",
    textColor: "text-white",
    accentColor: "text-amber-100"
  },
  
  // Generic mappings
  historical: {
    gradient: "from-vintage-gold via-amber-200/70 to-stone-200/60",
    textColor: "text-white",
    accentColor: "text-amber-100"
  },
  
  contemporary: {
    gradient: "from-pastel-blue via-blue-300/60 to-cyan-200/50",
    textColor: "text-white",
    accentColor: "text-blue-100"
  },
  
  fantasy: {
    gradient: "from-lavender via-purple-400/70 to-indigo-500/70",
    textColor: "text-white",
    accentColor: "text-lavender"
  },
  
  mystical: {
    gradient: "from-purple-400/70 via-blue-400/60 to-indigo-400/70",
    textColor: "text-white",
    accentColor: "text-purple-100"
  },
  
  crime: {
    gradient: "from-gray-800/90 via-red-900/80 to-gray-900/90",
    textColor: "text-white",
    accentColor: "text-red-200"
  },
  
  regal: {
    gradient: "from-emerald-600/70 via-yellow-500/60 to-amber-400/70",
    textColor: "text-white",
    accentColor: "text-yellow-100"
  },
  
  soft: {
    gradient: "from-sky-300 via-blue-300 to-indigo-300",
    textColor: "text-white",
    accentColor: "text-sky-100"
  },
  
  warm: {
    gradient: "from-warm-peach via-blush to-dusty-rose",
    textColor: "text-white",
    accentColor: "text-warm-peach"
  },
  
  hot: {
    gradient: "from-red-400 via-orange-400 to-yellow-400",
    textColor: "text-white",
    accentColor: "text-yellow-100"
  },
  
  default: {
    gradient: "from-blush via-dusty-rose to-warm-peach",
    textColor: "text-white",
    accentColor: "text-blush"
  }
};

export const getThemeStyle = (colorTheme: string | null): ThemeStyle => {
  return themeGradients[colorTheme || ""] || themeGradients.default;
};
