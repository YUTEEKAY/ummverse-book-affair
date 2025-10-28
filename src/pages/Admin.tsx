import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Upload, BookOpen, Users, Eye, MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookManagement } from '@/components/admin/BookManagement';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
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
        supabase.from('book_views').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersRes.count || 0,
        totalBooks: booksRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        totalViews: viewsRes.count || 0
      };
    }
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier');
      
      if (error) throw error;

      const breakdown = { free: 0, premium_monthly: 0, lifetime: 0 };
      data?.forEach((profile: any) => {
        breakdown[profile.subscription_tier as keyof typeof breakdown]++;
      });
      
      return breakdown;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Admin Header */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
                  <CardDescription className="text-base">
                    {profile?.full_name} • {profile?.email}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Site
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
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
                  <div className="text-xs opacity-80">Batch upload via CSV</div>
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
                <Badge variant="default">Premium</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime</p>
                  <p className="text-2xl font-bold">{subscriptionStats?.lifetime || 0}</p>
                </div>
                <Badge variant="default">Lifetime</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Management Tabs */}
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="books">
              <BookOpen className="h-4 w-4 mr-2" />
              Book Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-6">
            <BookManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
