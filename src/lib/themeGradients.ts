export interface ThemeStyle {
  gradient: string;
  textColor: string;
  accentColor: string;
}

export const themeGradients: Record<string, ThemeStyle> = {
  // Dark Romance – burgundy tones
  'dark romance': {
    gradient: "from-burgundy via-red-900/80 to-gray-900/90",
    textColor: "text-gray-100",
    accentColor: "text-red-400"
  },
  
  // Fantasy Romance – lavender and mystical
  'fantasy romance': {
    gradient: "from-lavender via-purple-400/70 to-indigo-500/70",
    textColor: "text-white",
    accentColor: "text-lavender"
  },
  
  // Contemporary Romance – pastel blue
  'contemporary romance': {
    gradient: "from-pastel-blue via-blue-300/60 to-cyan-200/50",
    textColor: "text-gray-800",
    accentColor: "text-blue-600"
  },
  
  // Historical Romance – vintage gold + parchment
  'historical romance': {
    gradient: "from-vintage-gold via-amber-200/70 to-stone-200/60",
    textColor: "text-amber-900",
    accentColor: "text-vintage-gold"
  },
  
  // Generic mappings
  historical: {
    gradient: "from-vintage-gold via-amber-200/70 to-stone-200/60",
    textColor: "text-amber-900",
    accentColor: "text-vintage-gold"
  },
  
  contemporary: {
    gradient: "from-pastel-blue via-blue-300/60 to-cyan-200/50",
    textColor: "text-gray-800",
    accentColor: "text-blue-600"
  },
  
  fantasy: {
    gradient: "from-lavender via-purple-400/70 to-indigo-500/70",
    textColor: "text-white",
    accentColor: "text-lavender"
  },
  
  mystical: {
    gradient: "from-purple-400/70 via-blue-400/60 to-indigo-400/70",
    textColor: "text-blue-50",
    accentColor: "text-purple-200"
  },
  
  crime: {
    gradient: "from-gray-800/90 via-red-900/80 to-gray-900/90",
    textColor: "text-gray-100",
    accentColor: "text-red-400"
  },
  
  regal: {
    gradient: "from-emerald-600/70 via-yellow-500/60 to-amber-400/70",
    textColor: "text-emerald-50",
    accentColor: "text-yellow-200"
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
