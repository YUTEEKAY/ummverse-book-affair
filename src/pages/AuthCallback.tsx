import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeAuthCallback } from "@/lib/authCallback";
import { AUTH_NEXT_KEY, safeAuthDestination } from "@/lib/authRedirect";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const completion = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let mounted = true;
    completion.current ??= completeAuthCallback(supabase.auth, window.location.href);
    // A stalled network must never leave the reader on an endless spinner.
    const timer = window.setTimeout(() => {
      if (mounted) {
        mounted = false;
        window.history.replaceState(null, "", "/auth/callback");
        setError("Sign-in is taking too long. Please try again.");
      }
    }, 20000);
    completion.current.then(() => {
      if (!mounted) return;
      const next = safeAuthDestination(sessionStorage.getItem(AUTH_NEXT_KEY)) ?? "/dashboard";
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      navigate(next, { replace: true });
    }).catch((cause: unknown) => {
      if (!mounted) return;
      window.history.replaceState(null, "", "/auth/callback");
      setError(cause instanceof Error ? cause.message : "Sign-in failed. Please try again.");
    }).finally(() => window.clearTimeout(timer));
    return () => { mounted = false; window.clearTimeout(timer); };
  }, [navigate]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <Link to="/" className="font-serif text-3xl text-primary">Ummverse</Link>
      {error ? <>
        <p role="alert" className="max-w-md text-destructive">{error}</p>
        <Button asChild><Link to="/signin">Try signing in again</Link></Button>
      </> : <>
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-primary" />
        <p role="status" className="text-muted-foreground">Completing your sign-in…</p>
      </>}
    </main>
  );
}