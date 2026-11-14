import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { toast } from "sonner";

const PLANS = [
  { id: "premium_monthly", name: "Monthly", price: "₦8,000", usd: "$5", per: "/month" },
  { id: "premium_yearly", name: "Yearly", price: "₦95,000", usd: "$70", per: "/year", note: "Best value" },
];

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    if (!user) return;
    setLoading(priceId);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(priceId);
      onClose();
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
        settings: { displayMode: "overlay", successUrl: `${window.location.origin}/dashboard?checkout=success`, allowLogout: false, variant: "one-page" },
      });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't open checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">You've used your 2 free tries</DialogTitle>
          <DialogDescription>
            Subscribe to keep getting quiz recommendations and searches, as many as you like.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-foreground">
          {["Unlimited quiz recommendations", "Unlimited book searches", "Cancel anytime"].map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{t}</li>
          ))}
        </ul>
        {!user ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-sm text-muted-foreground">Sign in first so your subscription stays with your account.</p>
            <GoogleSignInButton className="w-full" />
          </div>
        ) : (
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.id} className="flex flex-col rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  {p.note && <span className="rounded bg-accent/20 px-2 py-0.5 text-xs">{p.note}</span>}
                </div>
                <p className="mt-2 font-serif text-2xl">{p.price}<span className="text-sm text-muted-foreground">{p.per}</span></p>
                <p className="text-xs text-muted-foreground">about {p.usd}</p>
                <Button className="mt-3" onClick={() => checkout(p.id)} disabled={!!loading}>
                  {loading === p.id ? "Opening…" : "Subscribe"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
