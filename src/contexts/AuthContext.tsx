import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { verifyAdminSession } from '@/lib/adminSession';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentSession = useRef<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        currentSession.current = session;
        setIsAdmin(false);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      currentSession.current = session;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    currentSession.current = null;
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  const checkAdminStatus = useCallback(async () => {
    const userId = currentSession.current?.user.id;
    if (!userId) {
      setIsAdmin(false);
      return false;
    }

    try {
      const ok = await verifyAdminSession(
        userId,
        async () => {
          const { data, error } = await supabase.auth.getSession();
          return error ? null : data.session;
        },
        () => currentSession.current?.user.id,
        async (token) => {
          const { data, error } = await supabase.functions.invoke('check-admin', {
            headers: { Authorization: `Bearer ${token}` },
          });
          return !error && data?.isAdmin === true;
        },
      );
      if (currentSession.current?.user.id === userId) setIsAdmin(ok);
      return ok;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [session?.access_token, checkAdminStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signOut,
        isAdmin,
        checkAdminStatus,
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
