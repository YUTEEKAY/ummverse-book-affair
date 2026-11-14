import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { emailAuthError, validateNewPassword } from "@/lib/emailAuth";

export default function ResetPassword() {
  const initialUrl = useRef(window.location.href);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let mounted = true;
    let recoveryEvent = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") recoveryEvent = true;
    });
    const timer = window.setTimeout(() => {
      if (mounted) { mounted = false; setChecking(false); setError("Your reset link could not be verified. Request a new one."); }
    }, 20000);
    const verify = async () => {
      const url = new URL(initialUrl.current);
      const hash = new URLSearchParams(url.hash.slice(1));
      const code = url.searchParams.get("code");
      if (hash.has("error") || url.searchParams.has("error")) throw new Error("This reset link has expired. Please request a new one.");
      let { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session && code) {
        const exchanged = await supabase.auth.exchangeCodeForSession(code);
        if (exchanged.error) throw exchanged.error;
        data = exchanged.data;
      }
      if (!data.session || !(hash.get("type") === "recovery" || code || recoveryEvent)) {
        throw new Error("Open the password reset link from your email to set a new password.");
      }
      const verified = await supabase.auth.getUser();
      if (verified.error || !verified.data.user) throw new Error("Your reset link has expired. Please request a new one.");
      if (mounted) { window.history.replaceState(null, "", "/reset-password"); setReady(true); }
    };
    verify().catch(() => { if (mounted) setError("Open a valid password reset link from your email, or request a new one."); })
      .finally(() => { window.clearTimeout(timer); if (mounted) setChecking(false); });
    return () => { mounted = false; window.clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateNewPassword(password);
    if (invalid) { setError(invalid); return; }
    if (password !== confirm) { setError("Your passwords don’t match."); return; }
    if (!ready) return;
    setError(null); setBusy(true);
    try {
      // Recovery sessions are exempt from current_password requirements.
      const result = await supabase.auth.updateUser({ password });
      if (result.error) { setError(emailAuthError(result.error)); return; }
      setPassword(""); setConfirm(""); setDone(true);
    } catch { setError("We couldn’t save your password. Please try again."); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-[75vh] items-center justify-center px-4 py-10">
    <Card className="w-full max-w-md space-y-6 p-7">
      <Link to="/" className="font-serif text-3xl text-primary">Ummverse</Link>
      <h1 className="font-serif text-2xl">Set a new password</h1>
      {checking ? <p role="status">Verifying your reset link…</p> : done ? <><p role="status">Your password has been updated.</p><Button asChild className="w-full"><Link to="/dashboard">Go to Dashboard</Link></Button></> : <>
        {ready && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirm Password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update Password"}</Button>
        </form>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button asChild variant="link"><Link to="/signin">Back to Sign In</Link></Button>
      </>}
    </Card>
  </main>;
}