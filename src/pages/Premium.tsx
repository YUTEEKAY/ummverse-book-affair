import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Sparkles, BookOpen } from 'lucide-react';

const Premium = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blush/10 to-dusty-rose/20 p-4">
      <Card className="w-full max-w-2xl border-dusty-rose/20 shadow-xl">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center gap-2">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <Heart className="w-16 h-16 text-dusty-rose fill-dusty-rose" />
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-4xl font-serif text-foreground">
            Welcome to Ummverse Premium!
          </CardTitle>
          <CardDescription className="text-lg">
            Your gateway to unlimited romance book discoveries
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
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your premium subscription is now active!
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
            ✨ Thank you for supporting Ummverse Premium
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Premium;
