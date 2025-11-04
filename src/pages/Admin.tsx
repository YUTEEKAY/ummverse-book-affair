import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Upload, BookOpen, Users, Eye, MessageSquare, Sparkles, RefreshCw, Image, Languages, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookManagement } from '@/components/admin/BookManagement';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [enriching, setEnriching] = useState(false);
  const [bookStats, setBookStats] = useState({
    total: 0,
    missingCovers: 0,
    missingSummaries: 0,
    noApiSource: 0
  });

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

  const { data: subscriptionStats, isLoading: subsLoading, error: subsError, refetch: refetchSubs } = useQuery({
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
    },
    refetchOnMount: 'always'
  });

  // Load book enrichment stats
  useEffect(() => {
    loadBookStats();
  }, []);

  const loadBookStats = async () => {
    const { data: books } = await supabase
      .from('books')
      .select('cover_url, summary, api_source');
    
    if (books) {
      setBookStats({
        total: books.length,
        missingCovers: books.filter(b => !b.cover_url).length,
        missingSummaries: books.filter(b => !b.summary).length,
        noApiSource: books.filter(b => !b.api_source).length
      });
    }
  };

  const handleQuickEnrich = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-enrich-books', {
        body: { batchSize: 50, forceRefresh: false }
      });

      if (error) throw error;

      toast.success("✨ Quick enrichment complete!", {
        description: `${data?.updated || 0} books updated`
      });
      
      await loadBookStats();
    } catch (error: any) {
      console.error('Quick enrichment error:', error);
      toast.error('Quick enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

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

        {/* Admin Navigation */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/import')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import & Enrichment Tools
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            View Site
          </Button>
        </div>

        {/* Quick Actions & Enrichment Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrichment Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Book Enrichment
              </CardTitle>
              <CardDescription>Add covers, summaries, and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-muted-foreground">Missing Covers</div>
                  <div className="text-2xl font-bold">{bookStats.missingCovers}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-muted-foreground">Missing Summaries</div>
                  <div className="text-2xl font-bold">{bookStats.missingSummaries}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={handleQuickEnrich}
                  disabled={enriching}
                >
                  {enriching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Quick Enrich (50 Books)
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/import')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Advanced Enrichment Tools
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/admin/import')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Books from CSV
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  navigate('/admin/import');
                  toast.info('Navigate to Import page for recategorization tools');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recategorize Moods & Tropes
              </Button>
            </CardContent>
          </Card>
        </div>

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>User tier distribution</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetchSubs()}
                disabled={subsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${subsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : subsError ? (
              <div className="text-center py-8 text-destructive">
                Error loading subscription data: {subsError.message}
              </div>
            ) : (
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
            )}
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
