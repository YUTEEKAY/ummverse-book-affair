import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, MessageSquare, Calendar, Crown, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch user's reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_url
          )
        `)
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user's book views
  const { data: bookViews, isLoading: viewsLoading } = useQuery({
    queryKey: ['user-book-views', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('book_views')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const getTierBadge = () => {
    if (profile?.subscription_tier === 'lifetime') {
      return (
        <Badge className="bg-gradient-primary text-white">
          <Crown className="h-3 w-3 mr-1" />
          Lifetime
        </Badge>
      );
    }
    if (profile?.subscription_tier === 'premium_monthly') {
      return (
        <Badge className="bg-gradient-primary text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium Monthly
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const freeViewsRemaining = profile?.subscription_tier === 'free' 
    ? 3 - (profile?.free_views_count || 0) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back to Home Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        
        {/* Header Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile?.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    className="w-20 h-20 rounded-full object-cover" 
                  />
                )}
                <div>
                  <CardTitle className="text-3xl mb-2">
                    {profile?.full_name || 'User'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {profile?.email}
                  </CardDescription>
                  <div className="mt-2">{getTierBadge()}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Recently</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Viewed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookViews?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        {profile?.subscription_tier === 'free' && freeViewsRemaining !== null && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle>Free Tier Status</CardTitle>
              <CardDescription>
                You have {freeViewsRemaining} free book {freeViewsRemaining === 1 ? 'view' : 'views'} remaining this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Views Used</span>
                    <span>{profile.free_views_count || 0} / 3</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((profile.free_views_count || 0) / 3) * 100}%` }}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/pricing')} 
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Tabs */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            <TabsTrigger value="viewed">Recently Viewed</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Reviews</CardTitle>
                <CardDescription>Books you've reviewed</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div 
                        key={review.id} 
                        className="border-b pb-4 last:border-0 cursor-pointer hover:bg-accent/50 p-3 rounded-lg transition-colors"
                        onClick={() => navigate(`/book/${review.books.id}`)}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          {review.books?.cover_url && (
                            <img 
                              src={review.books.cover_url} 
                              alt={review.books.title} 
                              className="w-12 h-16 object-cover rounded" 
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{review.books?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {review.books?.author}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-red-500">
                                {'❤️'.repeat(review.hearts || 0)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.timestamp), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground pl-15">
                          {review.review_text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    You haven't written any reviews yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Viewed Books</CardTitle>
                <CardDescription>Your reading history</CardDescription>
              </CardHeader>
              <CardContent>
                {viewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : bookViews && bookViews.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {bookViews.map((view: any) => (
                      <div
                        key={view.id}
                        className="cursor-pointer group"
                        onClick={() => navigate(`/book/${view.books.id}`)}
                      >
                        {view.books?.cover_url ? (
                          <img
                            src={view.books.cover_url}
                            alt={view.books.title}
                            className="w-full aspect-[2/3] object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-muted rounded-lg mb-2 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="font-medium text-sm line-clamp-2">
                          {view.books?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {view.books?.author}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(view.created_at), 'MMM dd')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    You haven't viewed any books yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
