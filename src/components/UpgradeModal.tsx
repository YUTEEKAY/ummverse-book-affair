import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { PLANS, openFlutterwaveCheckout } from "@/lib/flutterwave";
import { toast } from "sonner";

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (priceId: string) => {
    if (!user) return;
    setLoading(priceId);
    try {
      await openFlutterwaveCheckout(priceId);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't open checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Unlock your next chapter</DialogTitle>
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
                  
                </div>
                <p className="mt-2 font-serif text-2xl">{p.price}<span className="text-sm text-muted-foreground">{p.per}</span></p>

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
