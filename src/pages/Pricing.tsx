import { PricingTiers } from '@/components/PricingTiers';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Pricing() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Redirect admins to their dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // Redirect if user already has premium
  if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
    return <Navigate to="/premium" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-16">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock unlimited romance book discoveries and AI-powered recommendations
          </p>
        </div>
        <PricingTiers />
        
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <p>All payments are securely processed by Lemon Squeezy. Cancel your monthly subscription anytime.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
