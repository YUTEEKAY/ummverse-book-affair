import { createClient } from "npm:@supabase/supabase-js@2";
import { handle, user } from "../_shared/flutterwave.ts";
Deno.serve(req => handle(req, async () => {
  await user(req);
  const body = await req.json();
  if (!["live", "sandbox"].includes(body.check_env) || !Number.isInteger(body.device_uses) || body.device_uses < 0 || body.device_uses > 2) throw new Error("Invalid trial request.");
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Trial service unavailable.");
  const client = createClient(url, key, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data, error } = await client.rpc("consume_trial", { device_uses: body.device_uses, check_env: body.check_env });
  if (error) throw error;
  return data;
}));
