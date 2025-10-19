import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Sparkles, BookOpen, Crown, Zap } from 'lucide-react';

const Premium = () => {
  const { user, loading, profile, subscriptionTier, isLifetime, isPremiumMonthly } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Tier-specific messaging
  const tierInfo = {
    lifetime: {
      title: 'Welcome to Ummverse Lifetime!',
      subtitle: 'You have lifetime access to all premium features',
      badge: '👑 Lifetime Member',
      icon: Crown,
      color: 'text-amber-500'
    },
    premium_monthly: {
      title: 'Welcome to Ummverse Premium!',
      subtitle: 'Your monthly subscription is active',
      badge: '⚡ Monthly Member',
      icon: Zap,
      color: 'text-primary'
    },
    free: {
      title: 'Choose Your Plan',
      subtitle: 'Unlock unlimited romance book discoveries',
      badge: '',
      icon: Sparkles,
      color: 'text-primary'
    }
  };

  const currentTier = tierInfo[subscriptionTier] || tierInfo.free;
  const TierIcon = currentTier.icon;

  // If user isn't premium, redirect to pricing
  if (!loading && profile && subscriptionTier === 'free') {
    navigate('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blush/10 to-dusty-rose/20 p-4">
      <Card className="w-full max-w-2xl border-dusty-rose/20 shadow-xl">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center gap-2">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <TierIcon className={`w-16 h-16 ${currentTier.color} ${isLifetime ? 'fill-amber-500' : ''}`} />
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          {currentTier.badge && (
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              isLifetime ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'
            }`}>
              {currentTier.badge}
            </div>
          )}
          <CardTitle className="text-4xl font-serif text-foreground">
            {currentTier.title}
          </CardTitle>
          <CardDescription className="text-lg">
            {currentTier.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-gradient-to-r from-blush/20 to-dusty-rose/20 rounded-lg p-6 space-y-4">
            <h3 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Your Premium Benefits
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-dusty-rose fill-dusty-rose mt-0.5 flex-shrink-0" />
                <span>Unlimited access to complete book details, summaries, and recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-dusty-rose fill-dusty-rose mt-0.5 flex-shrink-0" />
                <span>AI-powered personalized book recommendations tailored to your taste</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-dusty-rose fill-dusty-rose mt-0.5 flex-shrink-0" />
                <span>Exclusive access to detailed reviews and ratings from the community</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-dusty-rose fill-dusty-rose mt-0.5 flex-shrink-0" />
                <span>Browse by mood, trope, genre, and heat level without limits</span>
              </li>
              {isLifetime && (
                <li className="flex items-start gap-2">
                  <Crown className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Lifetime access — yours forever, no recurring payments</span>
                </li>
              )}
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {isLifetime 
                ? '🎉 You have lifetime access — thank you for your support!' 
                : isPremiumMonthly 
                ? 'Your premium subscription is now active!' 
                : 'Ready to explore?'}
            </p>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="bg-gradient-to-r from-primary to-dusty-rose hover:opacity-90 transition-opacity"
            >
              Start Exploring
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ✨ Thank you for supporting Ummverse
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Premium;
