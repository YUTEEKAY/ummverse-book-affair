import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  free_views_count: number;
  free_views_reset_date: string;
  subscription_tier: 'free' | 'premium_monthly' | 'lifetime';
  lemon_squeezy_customer_id: string | null;
  subscription_ends_at: string | null;
  subscription_status: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  incrementViewCount: () => Promise<void>;
  canViewBook: boolean;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
  isLifetime: boolean;
  isPremiumMonthly: boolean;
  subscriptionTier: 'free' | 'premium_monthly' | 'lifetime';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
      
      // Check if we need to reset weekly view count
      const resetDate = new Date(data.free_views_reset_date);
      const now = new Date();
      const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 7 && data.free_views_count > 0) {
        // Reset the counter
        await supabase
          .from('profiles')
          .update({ 
            free_views_count: 0, 
            free_views_reset_date: now.toISOString() 
          })
          .eq('id', userId);
        
        setProfile({ ...data, free_views_count: 0, free_views_reset_date: now.toISOString() });
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string) => {
    const redirectUrl = 'https://ummverse.com.ng/';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = 'https://ummverse.com.ng/auth';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const incrementViewCount = async () => {
    if (!user || !profile) return;
    
    const newCount = profile.free_views_count + 1;
    
    const { error } = await supabase
      .from('profiles')
      .update({ free_views_count: newCount })
      .eq('id', user.id);
    
    if (!error) {
      setProfile({ ...profile, free_views_count: newCount });
    }
  };

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-admin');
      
      if (error || !data) {
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(data.isAdmin);
      return data.isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user?.id]);

  // Subscription tier helpers
  const isLifetime = profile?.subscription_tier === 'lifetime';
  const isPremiumMonthly = profile?.subscription_tier === 'premium_monthly';
  const subscriptionTier = profile?.subscription_tier ?? 'free';
  
  // Check if subscription is active (for premium monthly users)
  const isSubscriptionActive = () => {
    if (!profile) return false;
    
    if (profile.subscription_tier === 'lifetime') {
      return true; // Never expires
    }
    
    if (profile.subscription_tier === 'premium_monthly') {
      if (profile.subscription_status === 'active') {
        if (profile.subscription_ends_at) {
          return new Date(profile.subscription_ends_at) > new Date();
        }
        return true;
      }
      return false;
    }
    
    return false;
  };
  
  const canViewBook = !user || isSubscriptionActive() || (profile?.free_views_count ?? 0) < 3;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        signOut,
        incrementViewCount,
        canViewBook,
        isAdmin,
        checkAdminStatus,
        isLifetime,
        isPremiumMonthly,
        subscriptionTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
