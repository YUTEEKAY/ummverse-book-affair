import { useId, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emailAuthError, validateNewPassword } from "@/lib/emailAuth";

export function EmailAuthForm() {
  const id = useId();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const changeMode = (value: string) => { setMode(value); setError(null); setMessage(null); setPassword(""); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null); setMessage(null);
    if (mode === "signup") {
      const invalid = validateNewPassword(password);
      if (invalid) { setError(invalid); return; }
      if (!name.trim()) { setError("Please enter your full name."); return; }
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) { setError(emailAuthError(result.error)); return; }
        setMessage("If an account exists for this email, you’ll receive a password reset link.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: {
          data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard`,
        } });
        if (result.error) { setError(emailAuthError(result.error)); return; }
        setPassword("");
        setMessage(result.data.session ? "Your account is ready." : "Check your email to confirm your account before signing in.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) { setError(emailAuthError(result.error)); return; }
        setPassword("");
        setMessage("You’re signed in.");
      }
    } catch { setError("We couldn’t connect. Please check your connection and try again."); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5 text-left">
    {mode !== "forgot" ? <Tabs value={mode} onValueChange={changeMode}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin" disabled={busy}>Sign In</TabsTrigger>
        <TabsTrigger value="signup" disabled={busy}>Create Account</TabsTrigger>
      </TabsList>
    </Tabs> : <h2 className="font-serif text-2xl">Reset your password</h2>}
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && <div className="space-y-2"><Label htmlFor={`${id}-name`}>Full Name</Label><Input id={`${id}-name`} autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required disabled={busy} /></div>}
      <div className="space-y-2"><Label htmlFor={`${id}-email`}>Email</Label><Input id={`${id}-email`} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></div>
      {mode !== "forgot" && <div className="space-y-2"><Label htmlFor={`${id}-password`}>Password</Label><Input id={`${id}-password`} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === "signup" ? 8 : undefined} required disabled={busy} /></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-foreground">{message}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Sign In"}</Button>
    </form>
    <Button type="button" variant="link" disabled={busy} className="h-auto px-0" onClick={() => changeMode(mode === "forgot" ? "signin" : "forgot")}>{mode === "forgot" ? "Back to Sign In" : "Forgot Password?"}</Button>
  </div>;
}