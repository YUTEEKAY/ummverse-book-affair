import { getPaymentEnvironment } from "@/lib/flutterwave";

export function PaymentTestModeBanner() {
  if (getPaymentEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full border-b border-accent/40 bg-accent/15 px-4 py-2 text-center text-sm text-foreground">
      Payments are in test mode or awaiting configuration.{" "}
      <a href="https://developer.flutterwave.com/docs/testing" target="_blank" rel="noopener noreferrer" className="font-medium underline">Read more</a>
    </div>
  );
}
