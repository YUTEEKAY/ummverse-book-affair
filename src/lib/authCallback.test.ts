// @ts-ignore -- Tests run with Bun, following the project's test convention.
import { describe, expect, mock, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { completeAuthCallback } from "./authCallback";

function client(session: object | null = { user: { id: "reader" } }) {
  const auth = {
    getSession: mock(async () => ({ data: { session }, error: null })),
    exchangeCodeForSession: mock(async (_code: string) => ({ data: { session: { user: { id: "reader" } } }, error: null })),
    getUser: mock(async () => ({ data: { user: { id: "reader" } }, error: null })),
  };
  return { auth, typed: auth as unknown as SupabaseClient["auth"] };
}

describe("OAuth callback", () => {
  test("does not re-exchange an automatically hydrated code", async () => {
    const c = client();
    await completeAuthCallback(c.typed, "https://reader.vercel.app/auth/callback?code=consumed");
    expect(c.auth.exchangeCodeForSession).toHaveBeenCalledTimes(0);
    expect(c.auth.getUser).toHaveBeenCalledTimes(1);
  });
  test("exchanges an unhandled code then verifies the user", async () => {
    const c = client(null);
    await completeAuthCallback(c.typed, "https://reader.vercel.app/auth/callback?code=fresh");
    expect(c.auth.exchangeCodeForSession).toHaveBeenCalledWith("fresh");
    expect(c.auth.getUser).toHaveBeenCalledTimes(1);
  });
  test("does not grant access on an empty callback", async () => {
    const c = client(null);
    await expect(completeAuthCallback(c.typed, "https://reader.vercel.app/auth/callback")).rejects.toThrow("No sign-in session");
    expect(c.auth.getUser).toHaveBeenCalledTimes(0);
  });
  test("rejects provider denial even with an existing session", async () => {
    const c = client();
    await expect(completeAuthCallback(c.typed, "https://reader.vercel.app/auth/callback#error=access_denied")).rejects.toThrow("not completed");
    expect(c.auth.getSession).toHaveBeenCalledTimes(0);
  });
});