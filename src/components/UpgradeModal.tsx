import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailAuthForm } from "./EmailAuthForm";
import { PLANS } from "@/lib/flutterwave";
import { PAYMENT_LINKS, SAME_EMAIL_NOTE } from "@/lib/paymentLinks";

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = (planId: string) => {
    if (!user) return;
    setLoading(planId);
    window.location.assign(PAYMENT_LINKS[planId as keyof typeof PAYMENT_LINKS]);
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
            <div className="w-full"><EmailAuthForm /></div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
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
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
            <strong>Important:</strong> {SAME_EMAIL_NOTE.replace("Important: ", "")}
            {user.email && <> Your account email is <strong>{user.email}</strong>.</>}
          </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
