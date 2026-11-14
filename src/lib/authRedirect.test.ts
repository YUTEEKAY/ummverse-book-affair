// @ts-ignore bun test runner types
import { expect, test } from "bun:test";
import { AUTH_ORIGIN, canonicalSignInUrl } from "./authRedirect";

test("sign-in uses the requested ummverse.com.ng domain", () => {
  expect(AUTH_ORIGIN).toBe("https://ummverse.com.ng");
  expect(new URL(canonicalSignInUrl("/dashboard")).origin).toBe("https://ummverse.com.ng");
});
test("sign-in preserves only local destinations", () => {
  expect(new URL(canonicalSignInUrl("//elsewhere.test")).searchParams.get("next")).toBe("/dashboard");
  expect(new URL(canonicalSignInUrl("/book/123")).searchParams.get("next")).toBe("/book/123");
});