export const AUTH_NEXT_KEY = "ummverse_next";

export function authCallbackUrl(origin: string): string {
  return new URL("/auth/callback", origin).href;
}

export function safeAuthDestination(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  try {
    const base = "https://redirect.invalid";
    const url = new URL(path, base);
    if (url.origin !== base || ["/signin", "/auth/callback"].includes(url.pathname.replace(/\/$/, ""))) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}