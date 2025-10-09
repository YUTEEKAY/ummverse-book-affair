import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PremiumBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { profile } = useAuth();

  // Don't show banner to premium users
  if (!isVisible || profile?.is_premium) return null;

  return (
    <div className="bg-gradient-to-r from-primary via-dusty-rose to-primary text-primary-foreground py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm md:text-base">
        <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <p className="font-medium text-center">
          ✨ Join Ummverse Premium for unlimited access to romance books
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="hidden md:inline-flex"
          onClick={() => window.location.href = 'https://ummverse.lemonsqueezy.com/buy/ummverse-premium'}
        >
          Unlock Now
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
          aria-label="Close banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PremiumBanner;
