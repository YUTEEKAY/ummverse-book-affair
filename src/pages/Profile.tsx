import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Crown, Edit, Calendar, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { ReadingStats } from "@/components/profile/ReadingStats";
import { UserPreferences } from "@/components/profile/UserPreferences";
import { ReviewManagement } from "@/components/profile/ReviewManagement";

export default function Profile() {
  const { user, profile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          book_id,
          rating,
          review_text,
          nickname,
          created_at,
          books (
            title,
            author,
            cover_url
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: recentlyViewed, isLoading: viewedLoading } = useQuery({
    queryKey: ["recently-viewed", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_views")
        .select(`
          created_at,
          books (
            id,
            title,
            author,
            cover_url,
            rating,
            genre
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "lifetime":
        return <Badge className="bg-gradient-to-r from-amber-500 to-rose-500"><Crown className="mr-1 h-3 w-3" />Lifetime</Badge>;
      case "premium_monthly":
        return <Badge className="bg-gradient-to-r from-rose-500 to-pink-500"><Crown className="mr-1 h-3 w-3" />Premium</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const memberSince = (profile as any)?.created_at 
    ? new Date((profile as any).created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Recently";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 -mt-16 md:-mt-12">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile?.full_name || "Book Lover"}</h1>
                  {getTierBadge(profile?.subscription_tier || "free")}
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                {(profile as any)?.bio && (
                  <p className="text-sm max-w-2xl">{(profile as any).bio}</p>
                )}
              </div>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Your Profile</DialogTitle>
                  </DialogHeader>
                  <EditProfileForm
                    userId={user.id}
                    currentData={{
                      full_name: profile?.full_name || "",
                      bio: (profile as any)?.bio || "",
                      avatar_url: profile?.avatar_url || "",
                    }}
                    onSuccess={() => {
                      setIsEditDialogOpen(false);
                      window.location.reload();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-8">
          <ReadingStats userId={user.id} />
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{memberSince}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Books Viewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{recentlyViewed?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Reviews Written
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reviews?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Free Tier Status */}
        {profile?.subscription_tier === "free" && (
          <Card className="mb-8 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
            <CardHeader>
              <CardTitle>Free Tier Status</CardTitle>
              <CardDescription>
                You have {Math.max(0, 5 - (profile?.free_views_count || 0))} free views remaining this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/pricing">
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <div className="mb-8">
          <UserPreferences
            userId={user.id}
            preferences={((profile as any)?.notification_preferences as any) || {}}
            profileVisibility={(profile as any)?.profile_visibility || "public"}
            onUpdate={() => window.location.reload()}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <ReviewManagement
                    key={review.id}
                    review={review}
                    onUpdate={refetchReviews}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't written any reviews yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {viewedLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentlyViewed && recentlyViewed.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentlyViewed.map((view: any) => (
                  <Link key={view.books.id} to={`/book/${view.books.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <img
                          src={view.books.cover_url || "/placeholder.svg"}
                          alt={view.books.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-1">{view.books.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{view.books.author}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary">{view.books.genre}</Badge>
                            {view.books.rating && (
                              <span className="text-sm">★ {view.books.rating}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't viewed any books yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}