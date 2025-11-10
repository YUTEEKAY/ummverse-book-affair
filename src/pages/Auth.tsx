import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const resetSchema = z.object({
  mode: z.literal('reset'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
});

const signInSchema = z.object({
  mode: z.literal('signin'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: passwordSchema,
});

const signUpSchema = z.object({
  mode: z.literal('signup'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: passwordSchema,
  confirmPassword: z.string(),
});

const recoverySchema = z.object({
  mode: z.literal('recovery'),
  password: passwordSchema,
  confirmPassword: z.string(),
});

const authSchema = z.discriminatedUnion('mode', [resetSchema, signInSchema, signUpSchema, recoverySchema])
  .refine(
    (d) => d.mode !== 'signup' || (d as any).password === (d as any).confirmPassword,
    { path: ['confirmPassword'], message: "Passwords don't match" }
  )
  .refine(
    (d) => d.mode !== 'recovery' || (d as any).password === (d as any).confirmPassword,
    { path: ['confirmPassword'], message: "Passwords don't match" }
  );

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const { signUpWithEmail, signInWithEmail, resetPassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AuthFormData>({
  resolver: zodResolver(authSchema),
  defaultValues: { mode: 'signin' },
});

  // Check for recovery token in URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
      setValue('mode', 'recovery');
    }
  }, [setValue]);

  useEffect(() => {
    if (user && !authLoading && !isRecoveryMode) {
      navigate('/');
    }
  }, [user, authLoading, isRecoveryMode, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isRecoveryMode) {
        // Handle password recovery/reset
        const { error } = await supabase.auth.updateUser({
          password: (data as any).password
        });
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Password update failed",
            description: error.message || "Could not update password. The link may have expired.",
          });
        } else {
          toast({
            title: "Password updated!",
            description: "Your password has been successfully updated. You can now sign in.",
          });
          // Clear hash and redirect to home
          window.location.hash = '';
          setIsRecoveryMode(false);
          navigate('/');
        }
      } else if (isResetMode && 'email' in data) {
        const { error } = await resetPassword(data.email);
        if (error) {
          toast({
            variant: "destructive",
            title: "Password reset failed",
            description: error.message || "Could not send reset email. Please try again.",
          });
        } else {
          toast({
            title: "Reset email sent!",
            description: "Check your email for a password reset link.",
          });
          setIsResetMode(false);
          reset();
        }
      } else if (isSignUp && 'email' in data) {
        const { error } = await signUpWithEmail(data.email as string, (data as any).password as string);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message || "Could not create account. Please try again.",
          });
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          setIsSignUp(false);
          reset();
        }
      } else if ('email' in data) {
        const { error } = await signInWithEmail(data.email as string, (data as any).password as string);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message || "Invalid email or password.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blush/10 to-dusty-rose/20 p-4">
      <Card className="w-full max-w-md border-dusty-rose/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Heart className="w-16 h-16 text-dusty-rose fill-dusty-rose" />
          </div>
          <CardTitle className="text-3xl font-serif text-foreground">
            Welcome to Ummverse
          </CardTitle>
          <CardDescription className="text-base">
            {isRecoveryMode
              ? 'Enter your new password below'
              : isResetMode 
                ? 'Enter your email to receive a password reset link' 
                : isSignUp 
                  ? 'Create your account to get started' 
                  : 'Sign in to access your personalized romance book recommendations'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('mode')} value={isRecoveryMode ? 'recovery' : isResetMode ? 'reset' : (isSignUp ? 'signup' : 'signin')} />
            
            {!isRecoveryMode && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email' as any)}
                  disabled={isSubmitting}
                />
                {'email' in errors && errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            )}

            {!isResetMode && (
              <div className="space-y-2">
                <Label htmlFor="password">{isRecoveryMode ? 'New Password' : 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isSubmitting}
                />
                {(errors as any).password && (
                  <p className="text-sm text-destructive">{String((errors as any).password?.message)}</p>
                )}
              </div>
            )}

            {(isSignUp || isRecoveryMode) && !isResetMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                />
                {(errors as any).confirmPassword && (
                  <p className="text-sm text-destructive">{String((errors as any).confirmPassword?.message)}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-dusty-rose hover:opacity-90 transition-opacity"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRecoveryMode ? 'Updating Password...' : isResetMode ? 'Sending Reset Email...' : isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRecoveryMode ? 'Update Password' : isResetMode ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
            
            {!isResetMode && !isSignUp && !isRecoveryMode && (
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsResetMode(true);
                  reset({ mode: 'reset' });
                }}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-dusty-rose w-full"
              >
                Forgot your password?
              </Button>
            )}
          </form>

          {!isRecoveryMode && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  if (isResetMode) {
                    setIsResetMode(false);
                    reset({ mode: 'signin' });
                  } else {
                    const nextIsSignUp = !isSignUp;
                    setIsSignUp(nextIsSignUp);
                    reset({ mode: nextIsSignUp ? 'signup' : 'signin' });
                  }
                }}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-dusty-rose"
              >
                {isResetMode 
                  ? 'Back to sign in' 
                  : isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"}
              </Button>
            </div>
          )}
          
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>✨ Free users get 3 book views per week</p>
            <p className="mt-1">💕 Premium members enjoy unlimited access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
