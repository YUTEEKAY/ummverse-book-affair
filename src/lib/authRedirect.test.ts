// @ts-ignore -- Tests run with Bun, following the project's test convention.
import { describe, expect, test } from "bun:test";
import { authCallbackUrl, safeAuthDestination } from "./authRedirect";

describe("same-origin OAuth returns", () => {
  for (const origin of ["http://localhost:8080", "https://preview.lovable.app", "https://reader.vercel.app", "https://www.ummverse.com.ng"]) {
    test(`returns to ${origin}`, () => {
      expect(authCallbackUrl(origin)).toBe(`${origin}/auth/callback`);
    });
  }
  test("preserves the intended reader destination", () => {
    expect(safeAuthDestination("/dashboard?tab=saved#books")).toBe("/dashboard?tab=saved#books");
  });
  test("rejects external destinations and callback loops", () => {
    for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/signin?next=/dashboard", "/auth/callback/", null]) {
      expect(safeAuthDestination(value)).toBeNull();
    }
  });
});