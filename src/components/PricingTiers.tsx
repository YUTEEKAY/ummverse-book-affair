import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export function PricingTiers() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'monthly' | 'lifetime') => {
    setLoadingTier(tier);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-lemon-squeezy-checkout',
        {
          body: { tier }
        }
      );
      
      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Failed to create checkout', {
          description: error.message || 'Please try again later'
        });
        return;
      }
      
      if (data?.url) {
        // Redirect to Lemon Squeezy checkout
        window.location.href = data.url;
      } else {
        toast.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoadingTier(null);
    }
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
      {/* Premium Monthly Card */}
      <Card className="p-6 border-primary bg-card hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-serif font-bold">Premium Monthly</h3>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold">₦8,000</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Unlimited book views</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span>AI-powered recommendations</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Full book summaries</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Cancel anytime</span>
          </li>
        </ul>
        <Button 
          onClick={() => handleSubscribe('monthly')}
          className="w-full"
          disabled={loadingTier !== null}
        >
          {loadingTier === 'monthly' ? 'Loading...' : 'Subscribe Monthly'}
        </Button>
      </Card>
      
      {/* Lifetime Card */}
      <Card className="p-6 border-2 border-amber-500 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 relative hover:shadow-xl transition-shadow">
        <div className="absolute -top-3 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          BEST VALUE
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-amber-500" />
          <h3 className="text-2xl font-serif font-bold">Lifetime Access</h3>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold">₦80,000</span>
          <span className="text-muted-foreground">/one-time</span>
        </div>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>Everything in Premium</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span><strong>Lifetime access</strong> — pay once, use forever</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>All future features included</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>Priority support</span>
          </li>
        </ul>
        <Button 
          onClick={() => handleSubscribe('lifetime')}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          disabled={loadingTier !== null}
        >
          {loadingTier === 'lifetime' ? 'Loading...' : 'Get Lifetime Access'}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Save ₦16,000 vs 10 months of Premium
        </p>
      </Card>
    </div>
  );
}
