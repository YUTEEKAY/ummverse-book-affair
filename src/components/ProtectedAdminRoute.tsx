import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkAdminStatus } = useAuth();
  // null = still checking for the current user
  const [verified, setVerified] = useState<{ userId: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (verified?.userId === user.id) return;
    let cancelled = false;
    checkAdminStatus().then((ok) => {
      if (!cancelled) setVerified({ userId: user.id, ok });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  const checking = !!user && verified?.userId !== user.id;
  const isAdmin = !!verified?.ok;

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
