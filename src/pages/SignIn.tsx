import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Card } from "@/components/ui/card";

const NEXT_KEY = "ummverse_next";
const safePath = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : null);

export default function SignIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = safePath(params.get("next"));
    if (next) sessionStorage.setItem(NEXT_KEY, next);
  }, [params]);

  useEffect(() => {
    if (!loading && user) {
      const next = safePath(sessionStorage.getItem(NEXT_KEY)) ?? "/dashboard";
      sessionStorage.removeItem(NEXT_KEY);
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
          <GoogleSignInButton className="h-11 w-full" redirectPath="/signin" onError={setError} />
        )}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <p className="mt-8 text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </Card>
    </main>
  );
}
