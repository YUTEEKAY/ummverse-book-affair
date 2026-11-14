import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailAuthForm } from "@/components/EmailAuthForm";
import { Card } from "@/components/ui/card";

import { AUTH_NEXT_KEY, safeAuthDestination } from "@/lib/authRedirect";

export default function SignIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const next = safeAuthDestination(params.get("next"));
    if (next) sessionStorage.setItem(AUTH_NEXT_KEY, next);
  }, [params]);

  useEffect(() => {
    if (!loading && user) {
      const next = safeAuthDestination(sessionStorage.getItem(AUTH_NEXT_KEY)) ?? "/dashboard";
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      navigate(next, { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center sm:p-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Heart className="h-4 w-4 text-primary" /> Ummverse
        </Link>
        <h1 className="mb-2 font-serif text-3xl font-semibold">Welcome back, reader</h1>
        <p className="mb-8 text-muted-foreground">Sign in to save books, revisit your quiz matches and manage your membership.</p>
        {loading || user ? (
          <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <EmailAuthForm />
        )}
        <p className="mt-8 text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </Card>
    </main>
  );
}
