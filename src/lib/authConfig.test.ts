// @ts-ignore -- Tests run with Bun, following the project's test convention.
import { expect, test } from "bun:test";
import { resolveAuthConfig } from "./authConfig";

test("Vercel anon alias overrides file configuration", () => {
  expect(resolveAuthConfig({ VITE_SUPABASE_URL: "https://host.example", VITE_SUPABASE_ANON_KEY: "host-public" }, { VITE_SUPABASE_URL: "https://file.example", VITE_SUPABASE_PUBLISHABLE_KEY: "file-public" })).toEqual({ url: "https://host.example", key: "host-public" });
});
test("publishable key takes precedence over anon alias", () => {
  expect(resolveAuthConfig({ VITE_SUPABASE_URL: "https://host.example", VITE_SUPABASE_PUBLISHABLE_KEY: "publishable", VITE_SUPABASE_ANON_KEY: "anon" }, {}).key).toBe("publishable");
});
test("missing auth configuration fails clearly instead of publishing a broken client", () => {
  expect(() => resolveAuthConfig({}, {})).toThrow("Auth configuration missing");
});