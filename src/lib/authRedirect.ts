export const AUTH_ORIGIN = "https://ummverse.com.ng";

export function canonicalSignInUrl(path: string) {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
  const url = new URL("/signin", AUTH_ORIGIN);
  url.searchParams.set("next", safe);
  return url.toString();
}