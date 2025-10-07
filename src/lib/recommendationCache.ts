interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  trope: string | null;
  heat_level: string | null;
  poeticLine: string;
}

interface CacheEntry {
  data: BookRecommendation[];
  timestamp: number;
}

export const getCachedRecommendations = (
  contextType: string,
  contextId: string
): BookRecommendation[] | null => {
  if (typeof window === 'undefined') return null;
  
  const cacheKey = `recommendations-${contextType}-${contextId}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (!cached) return null;
  
  try {
    const { data } = JSON.parse(cached) as CacheEntry;
    return data;
  } catch {
    sessionStorage.removeItem(cacheKey);
    return null;
  }
};

export const setCachedRecommendations = (
  contextType: string,
  contextId: string,
  recommendations: BookRecommendation[]
): void => {
  if (typeof window === 'undefined') return;
  
  const cacheKey = `recommendations-${contextType}-${contextId}`;
  const entry: CacheEntry = {
    data: recommendations,
    timestamp: Date.now()
  };
  sessionStorage.setItem(cacheKey, JSON.stringify(entry));
};

export const clearRecommendationCache = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.keys(sessionStorage)
    .filter(key => key.startsWith('recommendations-'))
    .forEach(key => sessionStorage.removeItem(key));
};
