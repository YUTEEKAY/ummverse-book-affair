import { handle, user, verifyTransaction } from "../_shared/flutterwave.ts";
Deno.serve(req => handle(req, async () => {
  const account = await user(req);
  const { transaction_id } = await req.json();
  if (!/^\d+$/.test(String(transaction_id))) throw new Error("Invalid transaction.");
  return verifyTransaction(String(transaction_id), account.id);
}));