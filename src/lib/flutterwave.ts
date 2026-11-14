import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
export const PLANS = [
  { id: "monthly", name: "Monthly", price: "$5", per: "/month" },
  { id: "annual", name: "Annual", price: "$60", per: "/year" },
];
export function getPaymentEnvironment(): "sandbox" | "live" {
  const key = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  return !key || key.includes("TEST") ? "sandbox" : "live";
}
export async function paymentRequest(name: string, body: unknown) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const message = await error.context.json().catch(() => ({}));
      throw new Error(message.error ?? "Payment request failed. Please try again.");
    }
    throw error;
  }
  return data;
}
export async function openFlutterwaveCheckout(tier: string) {
  const data = await paymentRequest("create-flutterwave-checkout", { tier, origin: window.location.origin });
  const url = new URL(data.url);
  if (url.protocol !== "https:" || !(url.hostname === "flutterwave.com" || url.hostname.endsWith(".flutterwave.com"))) throw new Error("Invalid payment link.");
  window.location.assign(url.href);
}