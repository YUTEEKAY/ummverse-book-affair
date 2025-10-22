import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, MessageSquare, Calendar, Crown, Shield, Upload, Database, Users, Eye, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Admin Dashboard Component
function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Platform-wide analytics queries
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [usersRes, booksRes, reviewsRes, viewsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('books').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('book_views').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: usersRes.count || 0,
        totalBooks: booksRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        totalViews: viewsRes.count || 0,
      };
    },
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier');
      
      if (error) throw error;

      const breakdown = {
        free: 0,
        premium_monthly: 0,
        lifetime: 0,
      };

      data?.forEach((profile: any) => {
        breakdown[profile.subscription_tier as keyof typeof breakdown]++;
      });

      return breakdown;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_views')
        .select(`
          *,
          books (title, author),
          profiles!book_views_user_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentReviews } = useQuery({
    queryKey: ['recent-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          books (title, author, cover_url)
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Admin Header */}
        <Card className="mb-8 bg-gradient-primary text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
                  <CardDescription className="text-white/90">
                    {profile?.full_name} • {profile?.email}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Admin Tools */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative tools and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="default"
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/admin/import')}
              >
                <Upload className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Import Books</div>
                  <div className="text-xs opacity-80">Batch upload book data</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
              >
                <Database className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">View Backend</div>
                  <div className="text-xs opacity-80">Access database and functions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Platform Statistics</h2>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{platformStats?.totalBooks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">In library</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{platformStats?.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Book Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{platformStats?.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total engagements</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{platformStats?.totalReviews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">User reviews</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Subscription Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Overview</CardTitle>
            <CardDescription>User tier distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Free Tier</p>
                  <p className="text-2xl font-bold">{subscriptionStats?.free || 0}</p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Monthly</p>
                  <p className="text-2xl font-bold">{subscriptionStats?.premium_monthly || 0}</p>
                </div>
                <Badge className="bg-gradient-primary text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime</p>
                  <p className="text-2xl font-bold">{subscriptionStats?.lifetime || 0}</p>
                </div>
                <Badge className="bg-gradient-primary text-white"><Crown className="h-3 w-3 mr-1" />Lifetime</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Activity */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Book Views</CardTitle>
                <CardDescription>Real-time platform engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{activity.books?.title}</p>
                          <p className="text-sm text-muted-foreground">by {activity.books?.author}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Viewed by {activity.profiles?.full_name || activity.profiles?.email || 'Anonymous'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Reviews</CardTitle>
                <CardDescription>Recent user feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReviews && recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {recentReviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
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
                            <p className="text-sm text-muted-foreground">{review.books?.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-red-500">{'❤️'.repeat(review.hearts || 0)}</div>
                              {review.pen_name && (
                                <Badge variant="outline" className="text-xs">{review.pen_name}</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.timestamp), 'MMM dd')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-15">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Regular User Profile Component
function UserProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Fetch user's reviews (no user_id in reviews table, showing all for now)
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
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
    enabled: !!user,
  });

  const getTierBadge = () => {
    if (profile?.subscription_tier === 'lifetime') {
      return <Badge className="bg-gradient-primary text-white"><Crown className="h-3 w-3 mr-1" />Lifetime</Badge>;
    }
    if (profile?.subscription_tier === 'premium_monthly') {
      return <Badge className="bg-gradient-primary text-white"><Crown className="h-3 w-3 mr-1" />Premium Monthly</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const freeViewsRemaining = profile?.subscription_tier === 'free' ? 3 - (profile?.free_views_count || 0) : null;

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
                  <CardTitle className="text-3xl mb-2">{profile?.full_name || 'User'}</CardTitle>
                  <CardDescription className="text-base">{profile?.email}</CardDescription>
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Free Tier Status</CardTitle>
              <CardDescription>
                You have {freeViewsRemaining} free book view{freeViewsRemaining !== 1 ? 's' : ''} remaining this month.
                {profile.free_views_reset_date && (
                  <> Resets on {format(new Date(profile.free_views_reset_date), 'MMM dd, yyyy')}.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/pricing')}>Upgrade to Premium</Button>
            </CardContent>
          </Card>
        )}

        {profile?.subscription_tier === 'premium_monthly' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Premium Monthly Subscription</CardTitle>
              <CardDescription>
                Status: {profile.subscription_status}
                {profile.subscription_ends_at && (
                  <> • Renews on {format(new Date(profile.subscription_ends_at), 'MMM dd, yyyy')}</>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Tabs for Reviews and Books Viewed */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="books">Books Viewed</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6">
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="grid gap-4">
                {reviews.map((review: any) => (
                  <Card key={review.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/book/${review.book_id}`)}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {review.books?.cover_url && (
                          <img
                            src={review.books.cover_url}
                            alt={review.books.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{review.books?.title}</CardTitle>
                          <CardDescription>{review.books?.author}</CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-red-500">{'❤️'.repeat(review.hearts || 0)}</div>
                            {review.pen_name && (
                              <Badge variant="outline">{review.pen_name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{review.review_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(review.timestamp), 'MMM dd, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">You haven't written any reviews yet</p>
                  <Button className="mt-4" onClick={() => navigate('/')}>Browse Books</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            {viewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookViews && bookViews.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {bookViews.map((view: any) => (
                  <Card key={view.id} className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                    onClick={() => navigate(`/book/${view.book_id}`)}>
                    {view.books?.cover_url ? (
                      <img
                        src={view.books.cover_url}
                        alt={view.books.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2">{view.books?.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{view.books?.author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">You haven't viewed any books yet</p>
                  <Button className="mt-4" onClick={() => navigate('/')}>Browse Books</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main Profile Component with Conditional Rendering
export default function Profile() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

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

  // Render admin dashboard or regular user profile
  return isAdmin ? <AdminDashboard /> : <UserProfile />;
}
