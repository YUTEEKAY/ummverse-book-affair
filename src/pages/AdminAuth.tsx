import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AdminAuth() {
  const navigate = useNavigate();
  const { signInWithEmail, isAdmin, loading, user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    
    const { error } = await signInWithEmail(data.email, data.password);
    
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Please check your credentials',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Signed in successfully',
      description: 'Checking admin access...',
    });
    
    // Wait a moment for admin status check
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blush/10 to-background p-4">
      <Card className="w-full max-w-md border-dusty-rose/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">Admin Access</CardTitle>
          <CardDescription>
            Sign in with your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
