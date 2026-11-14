// Vercel's environment takes priority over checked-in mode-specific values.
// The ANON_KEY alias feeds the generated client's PUBLISHABLE_KEY variable.
export function resolveAuthConfig(hosted: Record<string, string | undefined>, files: Record<string, string | undefined>) {
  const url = hosted.VITE_SUPABASE_URL || files.VITE_SUPABASE_URL;
  const key = hosted.VITE_SUPABASE_PUBLISHABLE_KEY || hosted.VITE_SUPABASE_ANON_KEY || files.VITE_SUPABASE_PUBLISHABLE_KEY || files.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Auth configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY), then rebuild.");
  return { url, key };
}