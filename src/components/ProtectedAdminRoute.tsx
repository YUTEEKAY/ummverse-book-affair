import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, checkAdminStatus } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!loading && user) {
        await checkAdminStatus();
      }
      setChecking(false);
    };
    verify();
  }, [user, loading, checkAdminStatus]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
